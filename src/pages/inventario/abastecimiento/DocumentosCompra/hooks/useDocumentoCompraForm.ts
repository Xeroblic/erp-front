import { useEffect, useMemo } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import {
	createPurchaseDocumentThunk,
	updatePurchaseDocumentThunk,
} from '@/store/slices/procurement/purchaseDocumentsSlice';
import { purchasableProcurementProducts } from '@/mocks/db/procurement.db';
import { normalizeCostInput } from '@/components/procurement';
import { formatDecimalCents, parseDecimalString } from '@/utils/procurementDecimal.util';
import type {
	IPurchaseDocument,
	IPurchaseDocumentCreatePayload,
	IPurchaseDocumentLineInput,
} from '@/interface/procurement.interface';
import { EMPTY_DOCUMENTO_LINE, EMPTY_DOCUMENTO_VALUES, documentoCompraFormSchema } from '../types';
import type { IDocumentoCompraFormValues, IDocumentoCompraLineFormValues } from '../types';

/**
 * Formik + `useIdempotentWrite` del alta y edición de documento de compra
 * (card 03, sección 6). Un solo hook para las dos: el contrato usa el mismo
 * cuerpo en `POST` y en los campos editables de `PATCH`, con la diferencia de
 * que la edición exige `If-Match` con el `ETag` vigente.
 *
 * La edición sólo se ofrece en `draft` (la ficha ya filtra `allowed_actions`
 * antes de abrir este formulario), así que no hay que resolver acá qué pasa
 * si el documento está confirmado.
 */

const toOptionalDecimal = (value: string): string | null => {
	const normalized = normalizeCostInput(value);
	if (!normalized) return null;
	const cents = parseDecimalString(normalized);
	return cents === null ? null : formatDecimalCents(cents);
};

const toFormValues = (document: IPurchaseDocument | null): IDocumentoCompraFormValues =>
	document === null
		? EMPTY_DOCUMENTO_VALUES
		: {
				document_type: document.document_type,
				supplier_id: document.supplier?.id ?? '',
				document_number: document.document_number,
				issue_date: document.issue_date,
				total_amount: document.total_amount ?? '',
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

const toLineInput = (line: IDocumentoCompraLineFormValues): IPurchaseDocumentLineInput => ({
	id: line.id,
	product_id: Number(line.product_id),
	quantity: Number(line.quantity),
	unit_cost: toOptionalDecimal(line.unit_cost) ?? '0.00',
	unit_cost_basis: line.unit_cost_basis || 'gross',
	notes: line.notes.trim() || null,
});

const toPayload = (values: IDocumentoCompraFormValues): IPurchaseDocumentCreatePayload => ({
	document_type: values.document_type,
	supplier_id: values.supplier_id === '' ? null : Number(values.supplier_id),
	document_number: values.document_number.trim(),
	issue_date: values.issue_date,
	currency_code: 'CLP',
	total_amount: toOptionalDecimal(values.total_amount),
	notes: values.notes.trim() || null,
	items: values.items.map(toLineInput),
});

const FORM_FIELD_BY_API_FIELD: Partial<Record<string, keyof IDocumentoCompraFormValues>> = {
	supplier_id: 'supplier_id',
	document_number: 'document_number',
	issue_date: 'issue_date',
};

interface IUseDocumentoCompraFormArgs {
	subsidiaryId: number | null;
	/** `null`/`undefined`: alta. Con documento: edición de ese `draft`. */
	document?: IPurchaseDocument | null;
	/** `ETag` vigente de `document`, para `If-Match`. Sólo hace falta en edición. */
	etag?: string | null;
	onSuccess?: (document: IPurchaseDocument) => void;
}

const useDocumentoCompraForm = ({
	subsidiaryId,
	document = null,
	etag = null,
	onSuccess,
}: IUseDocumentoCompraFormArgs) => {
	const dispatch = useAppDispatch();
	const isEdit = document !== null;
	const idempotentWrite = useIdempotentWrite({
		etag,
		fallbackMessage: isEdit
			? 'No se pudo actualizar el documento de compra.'
			: 'No se pudo crear el documento de compra.',
	});

	const productOptions = useMemo(
		() =>
			purchasableProcurementProducts.map((product) => ({
				value: String(product.id),
				label: `${product.sku} · ${product.name}`,
			})),
		[],
	);
	const productsById = useMemo(
		() => new Map(purchasableProcurementProducts.map((product) => [product.id, product])),
		[],
	);

	const formik = useFormik<IDocumentoCompraFormValues>({
		initialValues: toFormValues(document),
		enableReinitialize: true,
		validationSchema: documentoCompraFormSchema,
		onSubmit: async (values, { resetForm }) => {
			const payload = toPayload(values);
			const result = await idempotentWrite.submit((headers) =>
				isEdit && document
					? dispatch(
							updatePurchaseDocumentThunk({
								subsidiaryId,
								id: document.id,
								payload,
								headers: { idempotencyKey: headers['Idempotency-Key'], etag },
							}),
						).unwrap()
					: dispatch(
							createPurchaseDocumentThunk({
								subsidiaryId,
								payload,
								headers: { idempotencyKey: headers['Idempotency-Key'] },
							}),
						).unwrap(),
			);

			if (result) {
				// Sólo en alta: en edición el modal cierra sobre la ficha que ya se
				// está viendo. `EMPTY_DOCUMENTO_VALUES` es un objeto compartido —
				// sin resetear con una copia fresca de líneas, «Nuevo documento»
				// reabriría con las líneas del envío anterior.
				if (!isEdit)
					resetForm({
						values: { ...EMPTY_DOCUMENTO_VALUES, items: [{ ...EMPTY_DOCUMENTO_LINE }] },
					});
				onSuccess?.(result.data);
			}
		},
	});

	/**
	 * Igual criterio que `useProveedorForm`: un 422 con `fieldErrors` se pinta
	 * sobre el input top-level correspondiente cuando existe, y siempre se
	 * toastea — el mock no indexa los errores de línea (`items.N.campo`), así
	 * que un error de una línea sólo llega por el toast. La clave se renueva
	 * salvo que el error admita reintentar con la misma.
	 */
	useEffect(() => {
		const resolved = idempotentWrite.error;
		if (!resolved) return;

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
	};

	return {
		formik,
		isEdit,
		isSubmitting: idempotentWrite.isSubmitting,
		productOptions,
		productsById,
		reset,
	};
};

export default useDocumentoCompraForm;
