import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import useAuthorization from '@/hooks/useAuthorization';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import {
	createStockReceiptThunk,
	updateStockReceiptThunk,
} from '@/store/slices/procurement/stockReceiptsSlice';
import { normalizeCostInput } from '@/components/procurement';
import { formatDecimalCents, parseDecimalString } from '@/utils/procurementDecimal.util';
import type {
	IStockReceipt,
	IStockReceiptCreatePayload,
	IStockReceiptLineManualInput,
	IStockReceiptLineWithDocumentInput,
	IStockReceiptUpdatePayload,
} from '@/interface/procurement.interface';
import { EMPTY_RECEPCION_LINE, EMPTY_RECEPCION_VALUES, recepcionFormSchema } from '../types';
import type { IRecepcionFormValues, IRecepcionLineFormValues } from '../types';

/**
 * Formik + `useIdempotentWrite` del alta y corrección de recepción (card 05,
 * sección 7). Un solo hook para las dos, igual que
 * `useDocumentoCompraForm`: el contrato usa el mismo cuerpo de líneas en
 * `POST` y en los campos editables de `PATCH`.
 *
 * La edición sólo se ofrece en `draft`/`failed` (la ficha ya filtra
 * `allowed_actions` antes de abrir este formulario) y el `mode` queda fijo
 * al de la recepción existente: el contrato no permite cambiar una
 * recepción con documento a manual ni viceversa.
 */

const toOptionalDecimal = (value: string): string | null => {
	const normalized = normalizeCostInput(value);
	if (!normalized) return null;
	const cents = parseDecimalString(normalized);
	return cents === null ? null : formatDecimalCents(cents);
};

const toFormValues = (
	receipt: IStockReceipt | null,
	defaultWarehouseId: number | '',
	initialDocumentId?: number,
): IRecepcionFormValues => {
	if (receipt === null) {
		// Llega desde `create_receipt` en la ficha de un documento de compra
		// confirmado (`DocumentoCompraDetalle`): abre el alta ya en modo «con
		// documento» y con ese documento seleccionado, en vez de obligar a
		// buscarlo de nuevo en el selector.
		if (initialDocumentId !== undefined) {
			return {
				...EMPTY_RECEPCION_VALUES,
				mode: 'with_document',
				purchase_document_id: initialDocumentId,
				warehouse_id: defaultWarehouseId,
			};
		}
		return { ...EMPTY_RECEPCION_VALUES, warehouse_id: defaultWarehouseId };
	}

	const isWithDocument = receipt.purchase_document !== null;
	return {
		mode: isWithDocument ? 'with_document' : 'manual',
		purchase_document_id: receipt.purchase_document?.id ?? '',
		warehouse_id: receipt.warehouse.id,
		supplier_id: receipt.supplier?.id ?? '',
		received_on: receipt.received_on,
		reason: receipt.reason ?? '',
		notes: receipt.notes ?? '',
		items: receipt.items.map((item) => ({
			id: item.id,
			purchase_document_line_id: item.purchase_document_line_id ?? '',
			product_id: item.product.id,
			quantity: String(item.quantity),
			unit_cost: item.cost.entered_unit_amount ?? '',
			unit_cost_basis:
				item.cost.entered_basis && item.cost.entered_basis !== 'unknown'
					? item.cost.entered_basis
					: '',
		})),
	};
};

const toWithDocumentLineInput = (
	line: IRecepcionLineFormValues,
): IStockReceiptLineWithDocumentInput => ({
	id: line.id,
	purchase_document_line_id: Number(line.purchase_document_line_id),
	quantity: Number(line.quantity),
});

const toManualLineInput = (line: IRecepcionLineFormValues): IStockReceiptLineManualInput => ({
	id: line.id,
	product_id: Number(line.product_id),
	quantity: Number(line.quantity),
	unit_cost: toOptionalDecimal(line.unit_cost),
	unit_cost_basis: line.unit_cost_basis || null,
});

const toCreatePayload = (values: IRecepcionFormValues): IStockReceiptCreatePayload =>
	values.mode === 'with_document'
		? {
				purchase_document_id: Number(values.purchase_document_id),
				warehouse_id: Number(values.warehouse_id),
				received_on: values.received_on,
				notes: values.notes.trim() || null,
				items: values.items.map(toWithDocumentLineInput),
			}
		: {
				purchase_document_id: null,
				supplier_id: values.supplier_id === '' ? null : Number(values.supplier_id),
				warehouse_id: Number(values.warehouse_id),
				received_on: values.received_on,
				reason: values.reason.trim(),
				notes: values.notes.trim() || null,
				items: values.items.map(toManualLineInput),
			};

const toUpdatePayload = (values: IRecepcionFormValues): IStockReceiptUpdatePayload => ({
	warehouse_id: Number(values.warehouse_id),
	received_on: values.received_on,
	notes: values.notes.trim() || null,
	...(values.mode === 'manual'
		? {
				reason: values.reason.trim(),
				supplier_id: values.supplier_id === '' ? null : Number(values.supplier_id),
				items: values.items.map(toManualLineInput),
			}
		: { items: values.items.map(toWithDocumentLineInput) }),
});

const FORM_FIELD_BY_API_FIELD: Partial<Record<string, keyof IRecepcionFormValues>> = {
	warehouse_id: 'warehouse_id',
	received_on: 'received_on',
	reason: 'reason',
	supplier_id: 'supplier_id',
	purchase_document_id: 'purchase_document_id',
};

interface IUseRecepcionFormArgs {
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

const useRecepcionForm = ({
	subsidiaryId,
	branchId,
	defaultWarehouseId = '',
	receipt = null,
	etag = null,
	initialDocumentId,
	authorizedBranchIds,
	onSuccess,
}: IUseRecepcionFormArgs) => {
	const dispatch = useAppDispatch();
	const { authorize } = useAuthorization();
	const isEdit = receipt !== null;
	const idempotentWrite = useIdempotentWrite({
		etag,
		fallbackMessage: isEdit
			? 'No se pudo corregir la recepción.'
			: 'No se pudo crear la recepción.',
	});

	const formik = useFormik<IRecepcionFormValues>({
		initialValues: toFormValues(receipt, defaultWarehouseId, initialDocumentId),
		enableReinitialize: true,
		validationSchema: recepcionFormSchema,
		onSubmit: async (values, { resetForm }) => {
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
								payload: toUpdatePayload(values),
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

			if (result && subsidiaryId !== submittedSubsidiaryId) {
				// El contexto cambió mientras la escritura seguía en curso: se
				// completó de verdad (no se pierde ni se duplica), pero esta
				// instancia del formulario ya no debe actuar sobre el destino
				// nuevo — ni resetear como si fuera su propio alta, ni disparar
				// `onSuccess` (que en las pantallas de este módulo navega o
				// cierra un modal que podría pertenecer a otra recepción ahora).
				toast.info('La recepción se guardó, pero cambiaste de filial: no se abrirá aquí.');
				return;
			}

			if (result) {
				if (!isEdit)
					resetForm({
						values: {
							...EMPTY_RECEPCION_VALUES,
							warehouse_id: defaultWarehouseId,
							items: [{ ...EMPTY_RECEPCION_LINE }],
						},
					});
				onSuccess?.(result.data);
			}
		},
	});

	/** Mismo criterio que `useDocumentoCompraForm`: 412 bloquea el formulario. */
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
	};

	return {
		formik,
		isEdit,
		isSubmitting: idempotentWrite.isSubmitting,
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

export default useRecepcionForm;
