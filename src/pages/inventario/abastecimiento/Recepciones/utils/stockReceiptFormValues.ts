import type { IPurchaseDocument, IStockReceipt } from '@/interface/procurement.interface';
import { EMPTY_RECEPCION_LINE, EMPTY_RECEPCION_VALUES } from '../types';
import type {
	IRecepcionLineFormValues,
	IStockReceiptFormValues,
	TStockReceiptFormMode,
} from '../types';

/**
 * Valores del formulario de recepción, sin React: lo que abre el alta o la
 * corrección, las líneas «con documento» y el cambio de modo. El hook
 * (`useStockReceiptForm`) y el modal sólo los aplican.
 */

export const toFormValues = (
	receipt: IStockReceipt | null,
	defaultWarehouseId: number | '',
	initialDocumentId?: number,
): IStockReceiptFormValues => {
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
				items: [],
			};
		}
		// «Con documento» parte sin líneas: se precargan al elegir el documento
		// (`buildDocumentLines`).
		return { ...EMPTY_RECEPCION_VALUES, warehouse_id: defaultWarehouseId, items: [] };
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

/**
 * Líneas del formulario «con documento» a partir de la ficha del documento.
 *
 * - **Alta** (`preserveExisting: false`): todas las líneas con saldo, con
 *   «Recibido» igual a ese saldo — el caso habitual es recibir todo.
 * - **Corrección** (`preserveExisting: true`): las filas de la recepción se
 *   conservan tal cual — mismas filas (incluidas varias contra la misma línea
 *   documental), mismos ids y mismas cantidades; sólo se les agrega el saldo
 *   como tope. Las líneas con saldo que la recepción no tenía se muestran al
 *   final en `0`: `0` no se envía, así que el payload no cambia salvo que el
 *   usuario lo decida.
 */
export const buildDocumentLines = (
	document: IPurchaseDocument,
	currentItems: IRecepcionLineFormValues[],
	{ preserveExisting }: { preserveExisting: boolean },
): IRecepcionLineFormValues[] => {
	if (!preserveExisting) {
		return document.items
			.filter((line) => line.remaining_quantity > 0)
			.map((line) => ({
				...EMPTY_RECEPCION_LINE,
				purchase_document_line_id: line.id,
				quantity: String(line.remaining_quantity),
				pending_quantity: line.remaining_quantity,
			}));
	}

	const remainingByLineId = new Map(
		document.items.map((line) => [line.id, line.remaining_quantity]),
	);
	const preserved = currentItems.map((item) => ({
		...item,
		pending_quantity:
			item.purchase_document_line_id === ''
				? undefined
				: remainingByLineId.get(item.purchase_document_line_id),
	}));
	const usedLineIds = new Set(currentItems.map((item) => item.purchase_document_line_id));
	const omitted = document.items
		.filter((line) => line.remaining_quantity > 0 && !usedLineIds.has(line.id))
		.map((line) => ({
			...EMPTY_RECEPCION_LINE,
			purchase_document_line_id: line.id,
			quantity: '0',
			pending_quantity: line.remaining_quantity,
		}));
	return [...preserved, ...omitted];
};

/**
 * Valores al cambiar de modo, en un solo objeto: varios `setFieldValue`
 * seguidos validaban con el modo anterior y podían dejar su error de líneas en
 * el modo nuevo. Con documento las líneas se precargan al elegirlo; sin
 * documento se parte con una línea vacía para completar.
 */
export const switchReceiptMode = (
	values: IStockReceiptFormValues,
	mode: TStockReceiptFormMode,
): IStockReceiptFormValues =>
	mode === 'manual'
		? {
				...values,
				mode,
				purchase_document_id: '',
				items: [{ ...EMPTY_RECEPCION_LINE }],
			}
		: { ...values, mode, reason: '', supplier_id: '', items: [] };
