import { normalizeCostInput } from '@/components/procurement';
import { formatDecimalCents, parseDecimalString } from '@/utils/procurementDecimal.util';
import type {
	IStockReceipt,
	IStockReceiptCreatePayload,
	IStockReceiptLineManualInput,
	IStockReceiptLineWithDocumentInput,
	IStockReceiptUpdatePayload,
} from '@/interface/procurement.interface';
import { hasReceivedQuantity } from '../types';
import type { IRecepcionLineFormValues, IStockReceiptFormValues } from '../types';

/**
 * Cuerpo del `POST` (alta) y del `PATCH` (corrección) de una recepción a partir
 * de los valores del formulario. Sin React: `useStockReceiptForm` sólo lo envía.
 */

const toOptionalDecimal = (value: string): string | null => {
	const normalized = normalizeCostInput(value);
	if (!normalized) return null;
	const cents = parseDecimalString(normalized);
	return cents === null ? null : formatDecimalCents(cents);
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

export const toCreatePayload = (values: IStockReceiptFormValues): IStockReceiptCreatePayload =>
	values.mode === 'with_document'
		? {
				purchase_document_id: Number(values.purchase_document_id),
				warehouse_id: Number(values.warehouse_id),
				received_on: values.received_on,
				notes: values.notes.trim() || null,
				items: values.items.filter(hasReceivedQuantity).map(toWithDocumentLineInput),
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

/**
 * Un proveedor que no cambió no se reenvía: enviarlo obliga a resolverlo de
 * nuevo, y sin `view-procurement-supplier` la corrección terminaba en «El
 * proveedor no existe» aunque el usuario no lo hubiera tocado.
 */
const toSupplierUpdate = (
	values: IStockReceiptFormValues,
	receipt: IStockReceipt,
): Pick<IStockReceiptUpdatePayload, 'supplier_id'> => {
	const supplierId = values.supplier_id === '' ? null : Number(values.supplier_id);
	return supplierId === (receipt.supplier?.id ?? null) ? {} : { supplier_id: supplierId };
};

export const toUpdatePayload = (
	values: IStockReceiptFormValues,
	receipt: IStockReceipt,
): IStockReceiptUpdatePayload => ({
	warehouse_id: Number(values.warehouse_id),
	received_on: values.received_on,
	notes: values.notes.trim() || null,
	...(values.mode === 'manual'
		? {
				reason: values.reason.trim(),
				...toSupplierUpdate(values, receipt),
				items: values.items.map(toManualLineInput),
			}
		: { items: values.items.filter(hasReceivedQuantity).map(toWithDocumentLineInput) }),
});
