import { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import useAuthorization from '@/hooks/useAuthorization';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import {
	createStockReceiptThunk,
	postStockReceiptThunk,
	updateStockReceiptThunk,
} from '@/store/slices/procurement/stockReceiptsSlice';
import {
	getStockReceiptWarehouseBranchId,
	listWarehousesForStockReceipts,
} from '@/services/procurement/stockReceipts.service';
import type { IStockReceipt } from '@/interface/procurement.interface';
import useReceiptActor from './useReceiptActor';
import { stockReceiptFormSchema } from '../types';
import type { IStockReceiptFormValues, TStockReceiptSubmitIntent } from '../types';
import { toFormValues } from '../utils/stockReceiptFormValues';
import { toCreatePayload, toUpdatePayload } from '../utils/stockReceiptPayload';

/**
 * Resultado del segundo paso de «Guardar e ingresar al stock».
 *
 * - `posted`: el backend aceptó el ingreso (la recepción ya está `queued`).
 * - `rejected`: respuesta definitiva de rechazo; la clave ya no sirve.
 * - `uncertain`: timeout, red o `OPERATION_IN_PROGRESS` — el ingreso pudo
 *   aplicarse o no. Se conserva la clave para reintentar la **misma**
 *   operación y no se afirma ningún estado.
 */
type TIngressOutcome =
	| { kind: 'posted'; receipt: IStockReceipt }
	| { kind: 'rejected'; message: string }
	| { kind: 'uncertain'; message: string };

/**
 * Identidad completa de un ingreso con resultado incierto: la recepción **y**
 * la filial con la que se envió. La clave de idempotencia vive en `postWrite`.
 * Reintentar o abrir la ficha sólo es válido desde esa misma filial: con otra
 * activa, el `POST` apuntaría a otra recepción y la navegación la abriría bajo
 * un contexto ajeno.
 */
export interface IPendingIngress {
	receipt: IStockReceipt;
	subsidiaryId: number | null;
}

/**
 * Formik + `useIdempotentWrite` del alta y corrección de recepción (card 05,
 * sección 7). Un solo hook para las dos, igual que
 * `usePurchaseDocumentForm`: el contrato usa el mismo cuerpo de líneas en
 * `POST` y en los campos editables de `PATCH`.
 *
 * La edición sólo se ofrece en `draft`/`failed` (la ficha ya filtra
 * `allowed_actions` antes de abrir este formulario) y el `mode` queda fijo
 * al de la recepción existente: el contrato no permite cambiar una
 * recepción con documento a manual ni viceversa.
 *
 * «Guardar e ingresar al stock» encadena `POST /stock-receipts/{id}/post`
 * después de guardar: el contrato no ofrece un alta atómica que ingrese stock.
 * Si ese segundo paso falla, la recepción ya existe como borrador: se avisa y
 * se sigue igual a la ficha, donde «Ingresar al stock» sigue disponible — el
 * usuario nunca queda sin salida.
 */

const FORM_FIELD_BY_API_FIELD: Partial<Record<string, keyof IStockReceiptFormValues>> = {
	warehouse_id: 'warehouse_id',
	received_on: 'received_on',
	reason: 'reason',
	supplier_id: 'supplier_id',
	purchase_document_id: 'purchase_document_id',
};

interface IUseStockReceiptFormArgs {
	subsidiaryId: number | null;
	branchId: number | null;
	defaultWarehouseId?: number | '';
	/** `null`/`undefined`: alta. Con recepción: corrección de `draft`/`failed`. */
	receipt?: IStockReceipt | null;
	/** `ETag` vigente de `receipt`, para `If-Match`. Sólo hace falta al corregir. */
	etag?: string | null;
	/** Sólo en alta: preselecciona modo «con documento» y ese documento. */
	initialDocumentId?: number;
	/** Sucursales autorizadas del actor (hallazgo 5); `null`/vacío no filtra. */
	authorizedBranchIds?: number[] | null;
	onSuccess?: (receipt: IStockReceipt) => void;
}

const useStockReceiptForm = ({
	subsidiaryId,
	branchId,
	defaultWarehouseId = '',
	receipt = null,
	etag = null,
	initialDocumentId,
	authorizedBranchIds,
	onSuccess,
}: IUseStockReceiptFormArgs) => {
	const dispatch = useAppDispatch();
	const { authorize } = useAuthorization();
	const actor = useReceiptActor();
	const isEdit = receipt !== null;
	/**
	 * Intención del último envío. Vive en un ref porque Formik no la transporta
	 * y porque un reintento (`canRetry`) debe repetir exactamente la misma.
	 */
	const submitIntentRef = useRef<TStockReceiptSubmitIntent>('save');
	const [submitIntent, setSubmitIntent] = useState<TStockReceiptSubmitIntent>('save');
	/**
	 * Filial **vigente**, leída después del `await` del envío. Comparar con el
	 * `subsidiaryId` del cierre de `onSubmit` no sirve: ese valor quedó
	 * capturado al enviar y nunca ve un cambio posterior.
	 */
	const subsidiaryIdRef = useRef(subsidiaryId);
	subsidiaryIdRef.current = subsidiaryId;
	const idempotentWrite = useIdempotentWrite({
		etag,
		fallbackMessage: isEdit
			? 'No se pudo corregir la recepción.'
			: 'No se pudo crear la recepción.',
	});
	const postWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo ingresar la recepción al stock.',
	});

	/**
	 * Ingreso con resultado incierto, con la filial que lo originó. Mientras
	 * exista, el modal no se cierra solo: ofrece reintentar con la misma clave o
	 * ir a la ficha — ambas cosas sólo desde la filial propietaria.
	 */
	const [pendingIngress, setPendingIngress] = useState<IPendingIngress | null>(null);
	const isPendingIngressForeign =
		pendingIngress !== null && pendingIngress.subsidiaryId !== subsidiaryId;

	/**
	 * Segundo paso de «Guardar e ingresar al stock». Nunca deshace el guardado.
	 * Sólo renueva la clave cuando el resultado es definitivo (aceptado o
	 * rechazado): ante un resultado incierto la conserva para que el reintento
	 * sea la misma operación.
	 */
	const postReceipt = async (
		saved: IStockReceipt,
		ownerSubsidiaryId: number | null,
	): Promise<TIngressOutcome> => {
		if (!actor) {
			return {
				kind: 'rejected',
				message: 'No pudimos identificar a quién solicita el ingreso.',
			};
		}
		// Objeto y no `let`: el resultado se fija dentro de `onError`, fuera del
		// análisis de flujo de TypeScript.
		const captured: { failure: TIngressOutcome | null } = { failure: null };
		const posted = await postWrite.submit(
			(headers) =>
				dispatch(
					postStockReceiptThunk({
						// La filial de la recepción, nunca la activa en este render.
						subsidiaryId: ownerSubsidiaryId,
						id: saved.id,
						actor,
						headers: { idempotencyKey: headers['Idempotency-Key'] },
					}),
				).unwrap(),
			{
				onError: (postError) => {
					captured.failure =
						postError.action === 'retry_same_key'
							? { kind: 'uncertain', message: postError.message }
							: { kind: 'rejected', message: postError.message };
				},
			},
		);
		if (posted) {
			postWrite.renewKey();
			return { kind: 'posted', receipt: posted.data };
		}
		const outcome: TIngressOutcome = captured.failure ?? {
			kind: 'uncertain',
			message: 'No pudimos confirmar el ingreso al stock.',
		};
		if (outcome.kind === 'rejected') postWrite.renewKey();
		return outcome;
	};

	/** Cierra el flujo sobre una recepción ya guardada: limpia el alta y avisa al padre. */
	const finish = (
		saved: IStockReceipt,
		resetForm: (nextState?: { values: IStockReceiptFormValues }) => void,
	) => {
		if (!isEdit)
			resetForm({
				values: toFormValues(null, defaultWarehouseId),
			});
		submitIntentRef.current = 'save';
		setSubmitIntent('save');
		setPendingIngress(null);
		onSuccess?.(saved);
	};

	/**
	 * Aplica el resultado del ingreso. `posted` y `rejected` terminan el flujo
	 * (la ficha muestra el estado); `uncertain` lo deja abierto y bloqueado.
	 */
	const settleIngress = (
		saved: IStockReceipt,
		ownerSubsidiaryId: number | null,
		outcome: TIngressOutcome,
		resetForm: (nextState?: { values: IStockReceiptFormValues }) => void,
	) => {
		// Hallazgo 3 aplicado al segundo paso: con otra filial activa no se
		// navega ni se cierra como si fuera de este contexto. Un resultado
		// definitivo ya renovó la clave; uno incierto se conserva con su filial.
		if (subsidiaryIdRef.current !== ownerSubsidiaryId) {
			if (outcome.kind === 'uncertain') {
				setPendingIngress({ receipt: saved, subsidiaryId: ownerSubsidiaryId });
				toast.warning(
					`No pudimos confirmar si la recepción #${saved.id} ingresó al stock. Pertenece a la filial anterior: vuelve a ella para reintentar.`,
				);
				return;
			}
			setPendingIngress(null);
			toast.info('La recepción se guardó, pero cambiaste de filial: no se abrirá aquí.');
			return;
		}
		if (outcome.kind === 'posted') {
			toast.success('Recepción guardada. Ingresando al stock: la ficha se actualiza sola.');
			finish(outcome.receipt, resetForm);
			return;
		}
		if (outcome.kind === 'rejected') {
			toast.error(
				`La recepción #${saved.id} se guardó, pero el ingreso al stock fue rechazado: ${outcome.message} Revisa su estado en la ficha.`,
			);
			finish(saved, resetForm);
			return;
		}
		setPendingIngress({ receipt: saved, subsidiaryId: ownerSubsidiaryId });
		toast.warning(
			`La recepción #${saved.id} se guardó, pero no pudimos confirmar si ingresó al stock.`,
		);
	};

	const formik = useFormik<IStockReceiptFormValues>({
		initialValues: toFormValues(receipt, defaultWarehouseId, initialDocumentId),
		enableReinitialize: true,
		validationSchema: stockReceiptFormSchema,
		onSubmit: async (values, { resetForm, setFieldError }) => {
			// Hallazgo 4: revalida al confirmar, no sólo al abrir — cubre un
			// permiso o contexto (filial/sucursal) que cambió con el formulario
			// ya abierto. La ruta sólo exige `view-product`; escribir exige
			// `edit-product` con el scope de la sucursal/filial de destino.
			if (
				!authorize({ permission: 'edit-product', scope: 'access', branchId, subsidiaryId })
			) {
				toast.error(
					'No tienes permiso para crear o corregir recepciones en este contexto.',
				);
				return;
			}

			// La bodega decide la sucursal de la recepción: se autoriza contra
			// **esa** sucursal y contra la lista autorizada, no sólo contra la
			// sucursal activa. Cubre una bodega ajena que llegue por valor
			// inicial o por una recepción existente.
			const warehouseId = Number(values.warehouse_id);
			const warehouseBranchId = getStockReceiptWarehouseBranchId(warehouseId);
			const isOfferedWarehouse = listWarehousesForStockReceipts(authorizedBranchIds).some(
				(warehouse) => warehouse.id === warehouseId,
			);
			if (
				warehouseBranchId === null ||
				!isOfferedWarehouse ||
				!authorize({
					permission: 'edit-product',
					scope: 'access',
					branchId: warehouseBranchId,
					subsidiaryId,
				})
			) {
				setFieldError(
					'warehouse_id',
					'Selecciona una bodega de una sucursal en la que puedas operar.',
				);
				return;
			}

			// Hallazgo 3: si la filial cambia mientras esta escritura sigue en
			// vuelo, la continuación no debe navegar ni cerrar el modal de un
			// contexto que ya no es el activo — la operación se completó, pero
			// para la filial con la que se envió, no con la que quedó activa.
			const submittedSubsidiaryId = subsidiaryId;

			const result = await idempotentWrite.submit((headers) =>
				isEdit && receipt
					? dispatch(
							updateStockReceiptThunk({
								subsidiaryId,
								id: receipt.id,
								payload: toUpdatePayload(values, receipt),
								headers: { idempotencyKey: headers['Idempotency-Key'], etag },
								authorizedBranchIds,
							}),
						).unwrap()
					: dispatch(
							createStockReceiptThunk({
								subsidiaryId,
								payload: toCreatePayload(values),
								headers: { idempotencyKey: headers['Idempotency-Key'] },
								authorizedBranchIds,
							}),
						).unwrap(),
			);

			if (result && subsidiaryIdRef.current !== submittedSubsidiaryId) {
				// El contexto cambió mientras la escritura seguía en curso: se
				// completó de verdad (no se pierde ni se duplica), pero esta
				// instancia del formulario ya no debe actuar sobre el destino
				// nuevo — ni resetear como si fuera su propio alta, ni disparar
				// `onSuccess` (que en las pantallas de este módulo navega o
				// cierra un modal que podría pertenecer a otra recepción ahora).
				toast.info('La recepción se guardó, pero cambiaste de filial: no se abrirá aquí.');
				return;
			}

			if (!result) return;

			if (submitIntentRef.current !== 'save_and_post') {
				toast.success(
					isEdit
						? 'Corrección guardada. La recepción sigue en borrador.'
						: 'Recepción guardada como borrador. Todavía no suma stock.',
				);
				finish(result.data, resetForm);
				return;
			}

			const outcome = await postReceipt(result.data, submittedSubsidiaryId);
			settleIngress(result.data, submittedSubsidiaryId, outcome, resetForm);
		},
	});

	/**
	 * Reintenta el ingreso incierto con la **misma** clave y la **misma**
	 * filial con que se envió. Desde otra filial no hace nada: la vista ya
	 * deshabilita el botón, esto es la defensa del hook.
	 */
	const retryIngress = async () => {
		if (!pendingIngress || pendingIngress.subsidiaryId !== subsidiaryIdRef.current) return;
		const { receipt: saved, subsidiaryId: ownerSubsidiaryId } = pendingIngress;
		const outcome = await postReceipt(saved, ownerSubsidiaryId);
		settleIngress(saved, ownerSubsidiaryId, outcome, formik.resetForm);
	};

	/**
	 * Descarte explícito del reintento: se va a la ficha, cuyo `GET` muestra el
	 * estado real (y hace polling si quedó `queued`). Sólo desde la filial
	 * propietaria: con otra activa, la ruta abriría la recepción bajo un
	 * contexto ajeno. La clave se renueva porque pertenecía a esta operación.
	 */
	const leavePendingIngress = () => {
		if (!pendingIngress || pendingIngress.subsidiaryId !== subsidiaryIdRef.current) return;
		postWrite.renewKey();
		toast.info('Revisa el estado en la ficha: muestra si el ingreso al stock se aplicó.');
		finish(pendingIngress.receipt, formik.resetForm);
	};

	/**
	 * Descarta el ingreso pendiente sin navegar — la única salida cuando la
	 * filial activa ya no es la propietaria. La recepción sigue guardada en su
	 * filial; su ficha allí muestra si el ingreso se aplicó.
	 */
	const discardPendingIngress = () => {
		if (!pendingIngress) return;
		const { receipt: saved } = pendingIngress;
		postWrite.renewKey();
		setPendingIngress(null);
		submitIntentRef.current = 'save';
		setSubmitIntent('save');
		if (!isEdit)
			formik.resetForm({
				values: toFormValues(null, defaultWarehouseId),
			});
		toast.info(
			`La recepción #${saved.id} quedó guardada en su filial. Revisa allí si ingresó al stock.`,
		);
	};

	/** Envía con una intención explícita (los dos botones del pie del modal). */
	const submitWith = (intent: TStockReceiptSubmitIntent) => {
		// Un reintento incierto repite la intención original, nunca otra.
		if (!idempotentWrite.canRetry) {
			submitIntentRef.current = intent;
			setSubmitIntent(intent);
		}
		formik.submitForm().catch(() => undefined);
	};

	/** Mismo criterio que `usePurchaseDocumentForm`: 412 bloquea el formulario. */
	const [hasVersionConflict, setHasVersionConflict] = useState(false);

	useEffect(() => {
		const resolved = idempotentWrite.error;
		if (!resolved) return;

		if (resolved.code === 'RESOURCE_VERSION_CONFLICT') {
			setHasVersionConflict(true);
			toast.error(resolved.message);
			return;
		}

		Object.entries(resolved.fieldErrors ?? {}).forEach(([apiField, messages]) => {
			const formField = FORM_FIELD_BY_API_FIELD[apiField];
			if (formField && messages[0]) formik.setFieldError(formField, messages[0]);
		});
		toast.error(resolved.message);

		if (resolved.action !== 'retry_same_key') idempotentWrite.renewKey();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [idempotentWrite.error]);

	const reset = () => {
		formik.resetForm();
		idempotentWrite.clearError();
		setHasVersionConflict(false);
		submitIntentRef.current = 'save';
		setSubmitIntent('save');
	};

	return {
		formik,
		isEdit,
		isSubmitting: idempotentWrite.isSubmitting || postWrite.isSubmitting,
		/** Ingreso incierto (recepción + filial propietaria); bloquea el formulario. */
		pendingIngress,
		/** `true` si la filial activa no es la del ingreso pendiente. */
		isPendingIngressForeign,
		retryIngress,
		leavePendingIngress,
		discardPendingIngress,
		/** Intención del envío en curso o pendiente de reintento. */
		submitIntent,
		submitWith,
		hasVersionConflict,
		/**
		 * Resultado incierto de la tentativa anterior (timeout, `OPERATION_IN_
		 * PROGRESS`): el hook expone esto para que la vista bloquee el
		 * formulario y conserve `formik.values` intactos hasta que el usuario
		 * reintente con el mismo comando — un reintento debe reenviar
		 * exactamente lo que se envió, nunca datos editados a mitad de camino
		 * (hallazgo 8).
		 */
		canRetry: idempotentWrite.canRetry,
		reset,
	};
};

export default useStockReceiptForm;
