import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import {
	createPurchaseDocumentThunk,
	updatePurchaseDocumentThunk,
} from '@/store/slices/procurement/purchaseDocumentsSlice';
import { normalizeCostInput, toCostEntryPayload } from '@/components/procurement';
import { formatDecimalCents, parseDecimalString } from '@/utils/procurementDecimal.util';
import type {
	IPurchaseDocument,
	IPurchaseDocumentCreatePayload,
	IPurchaseDocumentLineInput,
	IPurchaseDocumentUpdatePayload,
	TPurchaseDocumentType,
} from '@/interface/procurement.interface';
import { applyProcurementFieldErrors } from '@/utils/procurementErrors.util';
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
	const idempotentWrite = useIdempotentWrite({
		etag,
		fallbackMessage: isEdit
			? 'No se pudo actualizar el documento de compra.'
			: 'No se pudo crear el documento de compra.',
	});

	/**
	 * Editar sin `ETag` no se envía (ver `updatePurchaseDocument`): pasa cuando
	 * el backend no publica ese encabezado en CORS. El modal lo avisa antes de
	 * que el usuario llene el formulario.
	 */
	const isMissingEtag = isEdit && !etag;
	const formik = useFormik<IPurchaseDocumentFormValues>({
		initialValues: toFormValues(document, defaultDocumentType),
		enableReinitialize: true,
		validationSchema: purchaseDocumentFormSchema,
		onSubmit: async (values, { resetForm }) => {
			const result = await idempotentWrite.submit((headers) =>
				isEdit && document
					? dispatch(
							updatePurchaseDocumentThunk({
								subsidiaryId,
								id: document.id,
								payload: toUpdatePayload(values, document),
								headers: { idempotencyKey: headers['Idempotency-Key'], etag },
							}),
						).unwrap()
					: dispatch(
							createPurchaseDocumentThunk({
								subsidiaryId,
								payload: toPayload(values),
								headers: { idempotencyKey: headers['Idempotency-Key'] },
							}),
						).unwrap(),
			);

			if (result) {
				// Copia fresca de líneas: `EMPTY_DOCUMENTO_VALUES` es compartido y el
				// próximo «Nuevo documento» reabriría con las líneas de este envío.
				if (!isEdit)
					resetForm({
						values: {
							...EMPTY_DOCUMENTO_VALUES,
							document_type: defaultDocumentType,
							items: [{ ...EMPTY_DOCUMENTO_LINE }],
						},
					});
				onSuccess?.(result.data);
			}
		},
	});

	/**
	 * El ETag con que se abrió quedó obsoleto (412). Reintentar, con la misma
	 * clave o con otra, repetiría el 412: hay que recargar el documento.
	 */
	const [hasVersionConflict, setHasVersionConflict] = useState(false);

	/**
	 * Un 422 se pinta sobre su campo (también `items.N.campo`) y la clave se
	 * renueva salvo que el error admita reintentar con la misma. El conflicto de
	 * versión no se arregla con otra clave: bloquea el formulario hasta recargar.
	 */
	useEffect(() => {
		const resolved = idempotentWrite.error;
		if (!resolved) return;

		if (resolved.code === 'RESOURCE_VERSION_CONFLICT') {
			setHasVersionConflict(true);
			toast.error(resolved.message);
			return;
		}

		applyProcurementFieldErrors(resolved.fieldErrors, toFormFieldPath, formik.setFieldError);
		toast.error(resolved.message);

		if (resolved.action !== 'retry_same_key') idempotentWrite.renewKey();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [idempotentWrite.error]);

	const reset = () => {
		formik.resetForm();
		idempotentWrite.clearError();
		setHasVersionConflict(false);
	};

	/**
	 * Descarta el borrador de otro contexto (filial): además de limpiar,
	 * renueva la clave, para que el alta en la filial nueva no viaje con la
	 * `Idempotency-Key` de un envío pensado para la anterior.
	 */
	const discardDraft = () => {
		reset();
		idempotentWrite.renewKey();
	};

	return {
		formik,
		isEdit,
		isSubmitting: idempotentWrite.isSubmitting,
		hasVersionConflict,
		isMissingEtag,
		reset,
		discardDraft,
	};
};

export default usePurchaseDocumentForm;
