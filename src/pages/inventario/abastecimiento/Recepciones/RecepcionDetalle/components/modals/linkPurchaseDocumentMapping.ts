import type { IProcurementResolvedError } from '@/utils/procurementErrors.util';
import type {
	IPurchaseDocument,
	IStockReceipt,
	IStockReceiptLinkPurchaseDocumentItemInput,
} from '@/interface/procurement.interface';

/** Por qué una línea de la recepción no encontró par en el documento. */
export type TUnmatchedReason = 'no_line' | 'no_capacity';

export interface ILinkMapping {
	items: IStockReceiptLinkPurchaseDocumentItemInput[];
	/** Por `stock_receipt_line_id`. */
	unmatched: Map<number, TUnmatchedReason>;
}

/**
 * Mapeo automático por producto para `PUT .../purchase-document`. Cada línea de
 * la recepción toma la primera línea del documento del mismo producto a la que
 * todavía le alcance lo pendiente: dos líneas de la recepción pueden ir a la
 * misma línea del documento si la suma cabe (tarea 13). Hay que asignarlas
 * todas, así que una sin par bloquea el envío en vez de esperar el 422.
 */
export const buildLinkMapping = (
	receipt: Pick<IStockReceipt, 'items'>,
	document: Pick<IPurchaseDocument, 'items'>,
): ILinkMapping => {
	const assigned = new Map<number, number>();
	const items: IStockReceiptLinkPurchaseDocumentItemInput[] = [];
	const unmatched = new Map<number, TUnmatchedReason>();
	receipt.items.forEach((receiptLine) => {
		const sameProduct = document.items.filter(
			(line) => line.product.id === receiptLine.product.id,
		);
		const documentLine = sameProduct.find(
			(line) =>
				line.remaining_quantity - (assigned.get(line.id) ?? 0) >= receiptLine.quantity,
		);
		if (!documentLine) {
			unmatched.set(receiptLine.id, sameProduct.length > 0 ? 'no_capacity' : 'no_line');
			return;
		}
		assigned.set(documentLine.id, (assigned.get(documentLine.id) ?? 0) + receiptLine.quantity);
		items.push({
			stock_receipt_line_id: receiptLine.id,
			purchase_document_line_id: documentLine.id,
		});
	});
	return { items, unmatched };
};

export interface ILinkFieldErrors {
	document: string | null;
	/** Por `stock_receipt_line_id`. */
	lines: Record<number, string>;
}

export const NO_LINK_FIELD_ERRORS: ILinkFieldErrors = { document: null, lines: {} };

const ITEM_FIELD_PATTERN = /^items\.(\d+)\.(purchase_document_line_id|stock_receipt_line_id)$/;

/**
 * Lleva cada `errors.*` del 422 a su lugar: `purchase_document_id` bajo el
 * documento (no confirmado, o de otro proveedor) e `items.N.*` a la línea de la
 * recepción que se envió en la posición N. `items` sin índice (falta asignar
 * alguna) queda en el mensaje general.
 */
export const toLinkFieldErrors = (
	error: Pick<IProcurementResolvedError, 'fieldErrors'>,
	sentItems: readonly IStockReceiptLinkPurchaseDocumentItemInput[],
): ILinkFieldErrors => {
	const result: ILinkFieldErrors = { document: null, lines: {} };
	Object.entries(error.fieldErrors ?? {}).forEach(([field, messages]) => {
		const [message] = messages;
		if (!message) return;
		if (field === 'purchase_document_id') {
			result.document = message;
			return;
		}
		const match = ITEM_FIELD_PATTERN.exec(field);
		const sent = match ? sentItems[Number(match[1])] : undefined;
		if (sent) result.lines[sent.stock_receipt_line_id] = message;
	});
	return result;
};
