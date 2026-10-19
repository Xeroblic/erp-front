import { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	createPurchaseDocumentThunk,
	updatePurchaseDocumentThunk,
	setDocumentWriteAttempt,
	completeDocumentWriteAttempt,
	clearDocumentWriteAttempt,
} from '@/store/slices/procurement/purchaseDocumentsSlice';
import type {
	IPurchaseDocumentWriteAttempt,
	IPurchaseDocumentWriteRejection,
} from '@/store/slices/procurement/purchaseDocumentsSlice';
import { createIdempotencyKey, shouldRetryWithSameKey } from '@/utils/procurementWrite.util';
import { normalizeCostInput, toCostEntryPayload } from '@/components/procurement';
import { formatDecimalCents, parseDecimalString } from '@/utils/procurementDecimal.util';
import type {
	IPurchaseDocument,
	IPurchaseDocumentCreatePayload,
	IPurchaseDocumentLineInput,
	IPurchaseDocumentUpdatePayload,
	TPurchaseDocumentType,
} from '@/interface/procurement.interface';
import {
	applyProcurementFieldErrors,
	resolveProcurementError,
} from '@/utils/procurementErrors.util';
import { EMPTY_DOCUMENTO_LINE, EMPTY_DOCUMENTO_VALUES, purchaseDocumentFormSchema } from '../types';
import type { IPurchaseDocumentFormValues, IDocumentoCompraLineFormValues } from '../types';

/**
 * Alta y edición de documento de compra: el contrato usa el mismo cuerpo en
 * `POST` y en `PATCH`, que además exige `If-Match` con el `ETag` vigente. La
 * edición sólo se ofrece en `draft` (la ficha filtra `allowed_actions`).
 */

const toOptionalDecimal = (value: string): string | null => {
	const normalized = normalizeCostInput(value);
	if (!normalized) return null;
	const cents = parseDecimalString(normalized);
	return cents === null ? null : formatDecimalCents(cents);
};

export const toFormValues = (
	document: IPurchaseDocument | null,
	defaultDocumentType: TPurchaseDocumentType,
): IPurchaseDocumentFormValues =>
	document === null
		? { ...EMPTY_DOCUMENTO_VALUES, document_type: defaultDocumentType }
		: {
				document_type: document.document_type,
				supplier_id: document.supplier?.id ?? '',
				document_number: document.document_number,
				issue_date: document.issue_date,
				total_amount: document.total_amount ?? '',
				include_shipping: document.shipping_cost !== null,
				shipping_cost: document.shipping_cost?.entered_amount ?? '',
				shipping_cost_basis: document.shipping_cost?.entered_basis ?? 'net',
				notes: document.notes ?? '',
				items: document.items.map((item) => ({
					id: item.id,
					product_id: item.product.id,
					quantity: String(item.quantity),
					unit_cost: item.cost.entered_unit_amount ?? '',
					unit_cost_basis:
						item.cost.entered_basis && item.cost.entered_basis !== 'unknown'
							? item.cost.entered_basis
							: '',
					notes: item.notes ?? '',
				})),
			};

/**
 * El schema exige monto y base en toda línea. Si aun así faltan, se aborta el
 * envío: inventar un costo guardaría la compra con un monto que nadie escribió.
 */
const toLineInput = (line: IDocumentoCompraLineFormValues): IPurchaseDocumentLineInput => {
	const cost = toCostEntryPayload(line);
	if (cost === null) throw new Error('La línea no tiene un costo unitario válido.');
	return {
		id: line.id,
		product_id: Number(line.product_id),
		quantity: Number(line.quantity),
		...cost,
		notes: line.notes.trim() || null,
	};
};

const toPayload = (values: IPurchaseDocumentFormValues): IPurchaseDocumentCreatePayload => ({
	document_type: values.document_type,
	supplier_id: values.supplier_id === '' ? null : Number(values.supplier_id),
	document_number: values.document_number.trim(),
	issue_date: values.issue_date,
	currency_code: 'CLP',
	total_amount: toOptionalDecimal(values.total_amount),
	shipping_cost: values.include_shipping ? toOptionalDecimal(values.shipping_cost) : null,
	shipping_cost_basis: values.include_shipping ? values.shipping_cost_basis || null : null,
	notes: values.notes.trim() || null,
	items: values.items.map(toLineInput),
});

const attemptFormValues = ({
	payload,
	includeShipping,
	shippingCostInput,
}: IPurchaseDocumentWriteAttempt): IPurchaseDocumentFormValues => ({
	document_type: payload.document_type,
	supplier_id: payload.supplier_id ?? '',
	document_number: payload.document_number,
	issue_date: payload.issue_date,
	total_amount: payload.total_amount ?? '',
	include_shipping: includeShipping,
	shipping_cost: shippingCostInput,
	shipping_cost_basis: payload.shipping_cost_basis ?? 'net',
	notes: payload.notes ?? '',
	items: payload.items.map((line) => ({
		id: line.id,
		product_id: line.product_id,
		quantity: String(line.quantity),
		unit_cost: line.unit_cost,
		unit_cost_basis: line.unit_cost_basis,
		notes: line.notes ?? '',
	})),
});

/**
 * En edición, un proveedor que no cambió no se reenvía: el backend lo
 * resolvería de nuevo y, sin `view-procurement-supplier`, respondería «El
 * proveedor no existe». Con sólo `document_type`, el backend completa el
 * `supplier_id` guardado, así que la regla de factura se mantiene.
 */
export const toUpdatePayload = (
	values: IPurchaseDocumentFormValues,
	document: IPurchaseDocument,
): IPurchaseDocumentUpdatePayload => {
	const { supplier_id: supplierId, ...payload } = toPayload(values);
	return supplierId === (document.supplier?.id ?? null)
		? payload
		: { ...payload, supplier_id: supplierId };
};

const FORM_FIELD_BY_API_FIELD: Partial<Record<string, keyof IPurchaseDocumentFormValues>> = {
	document_type: 'document_type',
	supplier_id: 'supplier_id',
	document_number: 'document_number',
	issue_date: 'issue_date',
	total_amount: 'total_amount',
	shipping_cost: 'shipping_cost',
	shipping_cost_basis: 'shipping_cost_basis',
	notes: 'notes',
};

const LINE_FIELDS: readonly (keyof IDocumentoCompraLineFormValues)[] = [
	'product_id',
	'quantity',
	'unit_cost',
	'unit_cost_basis',
	'notes',
];

/**
 * Campo de Formik para un error del backend. Laravel indexa los de línea como
 * `items.N.campo`, que Formik acepta tal cual como ruta.
 */
const toFormFieldPath = (apiField: string): string | null => {
	const topLevel = FORM_FIELD_BY_API_FIELD[apiField];
	if (topLevel) return topLevel;

	const lineMatch = /^items\.(\d+)\.(\w+)$/.exec(apiField);
	if (!lineMatch) return null;
	const field = lineMatch[2] as keyof IDocumentoCompraLineFormValues;
	return LINE_FIELDS.includes(field) ? apiField : null;
};

interface IUsePurchaseDocumentFormArgs {
	subsidiaryId: number | null;
	/** `null`/`undefined`: alta. Con documento: edición de ese `draft`. */
	document?: IPurchaseDocument | null;
	/** `ETag` vigente de `document`, para `If-Match`. Sólo hace falta en edición. */
	etag?: string | null;
	/**
	 * Tipo con que abre un alta. Quien no puede listar proveedores no puede
	 * elegir el que exige la factura, así que su alta abre como boleta.
	 */
	defaultDocumentType: TPurchaseDocumentType;
	onSuccess?: (document: IPurchaseDocument) => void;
}

const usePurchaseDocumentForm = ({
	subsidiaryId,
	document = null,
	etag = null,
	defaultDocumentType,
	onSuccess,
}: IUsePurchaseDocumentFormArgs) => {
	const dispatch = useAppDispatch();
	const isEdit = document !== null;
	const resourceKey = `${subsidiaryId ?? 'none'}:${document?.id ?? 'new'}`;
	const pendingAttempt = useAppSelector(
		(state): IPurchaseDocumentWriteAttempt | null =>
			state.purchaseDocuments?.pendingDocumentWrites?.[resourceKey] ?? null,
	);
	const attemptRef = useRef<IPurchaseDocumentWriteAttempt | null>(pendingAttempt);
	attemptRef.current = pendingAttempt;
	const ownerRef = useRef({ key: resourceKey, generation: 0 });
	if (ownerRef.current.key !== resourceKey)
		ownerRef.current = { key: resourceKey, generation: ownerRef.current.generation + 1 };
	const mounted = useRef(true);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);
	const [hasVersionConflict, setHasVersionConflict] = useState(false);
	// Cambiar el estado del intento no reinicializa el borrador: un rechazo
	// definitivo debe conservar los valores que el usuario necesita corregir.
	const initialForm = useRef({
		resourceKey,
		document,
		defaultDocumentType,
		values: pendingAttempt
			? attemptFormValues(pendingAttempt)
			: toFormValues(document, defaultDocumentType),
	});
	if (
		initialForm.current.resourceKey !== resourceKey ||
		initialForm.current.document !== document ||
		initialForm.current.defaultDocumentType !== defaultDocumentType
	)
		initialForm.current = {
			resourceKey,
			document,
			defaultDocumentType,
			values: pendingAttempt
				? attemptFormValues(pendingAttempt)
				: toFormValues(document, defaultDocumentType),
		};

	/**
	 * Editar sin `ETag` no se envía (ver `updatePurchaseDocument`): pasa cuando
	 * el backend no publica ese encabezado en CORS. El modal lo avisa antes de
	 * que el usuario llene el formulario.
	 */
	const isMissingEtag = isEdit && !etag;
	const formik = useFormik<IPurchaseDocumentFormValues>({
		initialValues: initialForm.current.values,
		enableReinitialize: true,
		validationSchema: purchaseDocumentFormSchema,
		onSubmit: async (values) => {
			if (subsidiaryId === null || hasVersionConflict || isMissingEtag) return;
			const { current } = attemptRef;
			// eslint-disable-next-line @typescript-eslint/no-use-before-define -- función declarada y elevada; su resultado actualiza este Formik.
			await sendAttempt(
				current ?? {
					resourceKey,
					subsidiaryId,
					documentId: document?.id ?? null,
					idempotencyKey: createIdempotencyKey(),
					etag,
					payload: toPayload(values),
					omitSupplier:
						document !== null &&
						(values.supplier_id === '' ? null : Number(values.supplier_id)) ===
							(document.supplier?.id ?? null),
					includeShipping: values.include_shipping,
					shippingCostInput: values.shipping_cost,
					status: 'uncertain',
					result: null,
					rejection: null,
				},
			);
		},
	});

	/**
	 * El ETag con que se abrió quedó obsoleto (412). Reintentar, con la misma
	 * clave o con otra, repetiría el 412: hay que recargar el documento.
	 */
	const isHere = (attempt: IPurchaseDocumentWriteAttempt, generation: number) =>
		mounted.current &&
		ownerRef.current.key === attempt.resourceKey &&
		ownerRef.current.generation === generation;
	const clearAttempt = (attempt: IPurchaseDocumentWriteAttempt) => {
		dispatch(clearDocumentWriteAttempt(attempt));
		if (attemptRef.current?.idempotencyKey === attempt.idempotencyKey)
			attemptRef.current = null;
	};
	const deliver = (
		attempt: IPurchaseDocumentWriteAttempt,
		result: IPurchaseDocument,
		generation: number,
	) => {
		if (!isHere(attempt, generation)) return;
		clearAttempt(attempt);
		if (attempt.documentId === null)
			formik.resetForm({
				values: {
					...EMPTY_DOCUMENTO_VALUES,
					document_type: defaultDocumentType,
					items: [{ ...EMPTY_DOCUMENTO_LINE }],
				},
			});
		onSuccess?.(result);
	};
	/** Muestra un rechazo definitivo sobre el formulario: su mensaje, sus campos y el 412. */
	const showRejection = (rejection: IPurchaseDocumentWriteRejection) => {
		if (rejection.isVersionConflict) setHasVersionConflict(true);
		applyProcurementFieldErrors(rejection.fieldErrors, toFormFieldPath, formik.setFieldError);
		toast.error(rejection.message);
	};
	async function sendAttempt(attempt: IPurchaseDocumentWriteAttempt) {
		const { generation } = ownerRef.current;
		if (attempt.status === 'in_flight' || attempt.status === 'rejected') return;
		if (attempt.status === 'completed' && attempt.result) {
			deliver(attempt, attempt.result, generation);
			return;
		}
		const sending = { ...attempt, status: 'in_flight' as const };
		attemptRef.current = sending;
		dispatch(setDocumentWriteAttempt(sending));
		try {
			const { supplier_id: supplier, ...withoutSupplier } = attempt.payload;
			void supplier;
			const response =
				attempt.documentId === null
					? await dispatch(
							createPurchaseDocumentThunk({
								subsidiaryId: attempt.subsidiaryId,
								payload: attempt.payload,
								headers: { idempotencyKey: attempt.idempotencyKey },
							}),
						).unwrap()
					: await dispatch(
							updatePurchaseDocumentThunk({
								subsidiaryId: attempt.subsidiaryId,
								id: attempt.documentId,
								payload: attempt.omitSupplier ? withoutSupplier : attempt.payload,
								headers: {
									idempotencyKey: attempt.idempotencyKey,
									etag: attempt.etag,
								},
							}),
						).unwrap();
			dispatch(completeDocumentWriteAttempt({ ...attempt, result: response.data }));
			deliver(attempt, response.data, generation);
		} catch (error: unknown) {
			const resolved = resolveProcurementError(
				error,
				'No pudimos guardar el documento de compra.',
			);
			const rejection: IPurchaseDocumentWriteRejection = {
				message: resolved.message,
				fieldErrors: resolved.fieldErrors,
				isVersionConflict: resolved.code === 'RESOURCE_VERSION_CONFLICT',
			};
			const here = isHere(attempt, generation);
			if (shouldRetryWithSameKey(error))
				dispatch(setDocumentWriteAttempt({ ...attempt, status: 'uncertain' }));
			else if (here) clearAttempt(attempt);
			// Sin el formulario a la vista, el rechazo y su borrador esperan al usuario.
			else dispatch(setDocumentWriteAttempt({ ...attempt, status: 'rejected', rejection }));
			if (here) showRejection(rejection);
		}
	}

	const reset = () => {
		formik.resetForm();
		setHasVersionConflict(false);
	};

	/**
	 * Limpia el formulario al cambiar de filial. Los intentos inciertos conservan
	 * su propietario y siguen disponibles cuando se vuelve a ese contexto.
	 */
	const discardDraft = () => {
		reset();
	};
	/** Libera un intento rechazado para corregirlo: conserva sus valores y marca sus errores. */
	const reviewRejection = () => {
		const attempt = attemptRef.current;
		if (attempt?.status !== 'rejected') return;
		clearAttempt(attempt);
		if (attempt.rejection) showRejection(attempt.rejection);
	};
	const discardAttempt = () => {
		const attempt = attemptRef.current;
		if (!attempt || attempt.status === 'in_flight') return;
		clearAttempt(attempt);
		formik.resetForm({ values: toFormValues(document, defaultDocumentType) });
	};

	return {
		formik,
		isEdit,
		isSubmitting: pendingAttempt?.status === 'in_flight',
		pendingAttempt,
		retryPending: () => {
			if (attemptRef.current) void sendAttempt(attemptRef.current);
		},
		reviewRejection,
		discardAttempt,
		hasVersionConflict,
		isMissingEtag,
		reset,
		discardDraft,
	};
};

export default usePurchaseDocumentForm;
