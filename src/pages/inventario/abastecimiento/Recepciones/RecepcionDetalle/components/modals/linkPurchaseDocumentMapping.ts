import type { IProcurementResolvedError } from '@/utils/procurementErrors.util';
import type {
	IPurchaseDocument,
	IStockReceipt,
	IStockReceiptLinkPurchaseDocumentItemInput,
} from '@/interface/procurement.interface';

/**
 * Por qué una línea de la recepción no puede enviarse todavía.
 * - `no_line`: el documento no tiene una línea de ese producto.
 * - `no_capacity`: lo pendiente del documento no alcanza (probado, o por la
 *   línea que eligió el usuario).
 * - `choose`: la búsqueda agotó su presupuesto sin decidir; elige el usuario.
 */
export type TUnmatchedReason = 'no_line' | 'no_capacity' | 'choose';

export interface ILinkMapping {
	/** Lo que viaja: sólo si todas las líneas están resueltas se puede enviar. */
	items: IStockReceiptLinkPurchaseDocumentItemInput[];
	/** Por `stock_receipt_line_id`. */
	unmatched: Map<number, TUnmatchedReason>;
	/** Línea del documento de cada línea de la recepción, elegida o sugerida. */
	assignment: Map<number, number>;
}

/** Nodos que la búsqueda recorre por producto antes de ceder la elección al usuario. */
const SEARCH_BUDGET = 20_000;

interface ISearchItem {
	id: number;
	quantity: number;
}

interface ISearchBin {
	id: number;
	capacity: number;
}

interface ISearchResult {
	/** `null`: no hay asignación (o no se encontró dentro del presupuesto). */
	assignment: Map<number, number> | null;
	/** `true` si se cortó por presupuesto: que no haya respuesta no está probado. */
	exhausted: boolean;
}

/**
 * Reparte las líneas de un producto entre las del documento sin pasarse de lo
 * pendiente de ninguna. Es empaquetar en contenedores, así que se busca con
 * retroceso: primero las cantidades mayores, y en cada nivel se prueba una sola
 * vez cada capacidad restante distinta (dos contenedores con el mismo saldo son
 * intercambiables). Encuentra una asignación siempre que exista, salvo que
 * agote el presupuesto.
 */
const searchAssignment = (items: ISearchItem[], bins: ISearchBin[]): ISearchResult => {
	const order = [...items].sort((a, b) => b.quantity - a.quantity);
	const left = bins.map((bin) => bin.capacity);
	const chosen: number[] = [];
	let nodes = 0;
	let exhausted = false;

	const place = (index: number): boolean => {
		if (index === order.length) return true;
		nodes += 1;
		if (nodes > SEARCH_BUDGET) exhausted = true;
		if (exhausted) return false;
		const { quantity } = order[index];
		const tried = new Set<number>();
		return left.some((capacity, bin) => {
			if (exhausted || capacity < quantity || tried.has(capacity)) return false;
			tried.add(capacity);
			left[bin] -= quantity;
			chosen[index] = bin;
			if (place(index + 1)) return true;
			left[bin] += quantity;
			return false;
		});
	};

	if (!place(0)) return { assignment: null, exhausted };
	return {
		assignment: new Map(order.map((item, index) => [item.id, bins[chosen[index]].id])),
		exhausted: false,
	};
};

/**
 * Mapeo de `PUT .../purchase-document`. Hay que asignar todas las líneas de la
 * recepción, cada una a una línea del documento del mismo producto, y dos
 * pueden ir a la misma si lo pendiente alcanza para la suma (tarea 13).
 *
 * `overrides` son las líneas que eligió el usuario: se respetan y la búsqueda
 * reparte el resto con lo que queda. Si la búsqueda no decide dentro de su
 * presupuesto, la línea queda para que la elija el usuario en vez de bloquear
 * un vínculo que el backend sí aceptaría.
 */
export const buildLinkMapping = (
	receipt: Pick<IStockReceipt, 'items'>,
	document: Pick<IPurchaseDocument, 'items'>,
	overrides: ReadonlyMap<number, number> = new Map(),
): ILinkMapping => {
	const documentLines = new Map(document.items.map((line) => [line.id, line]));
	const assignment = new Map<number, number>();
	const unmatched = new Map<number, TUnmatchedReason>();

	// Sólo vale la elección de una línea del mismo producto.
	receipt.items.forEach((receiptLine) => {
		const chosenId = overrides.get(receiptLine.id);
		const chosen = chosenId === undefined ? undefined : documentLines.get(chosenId);
		if (chosen && chosen.product.id === receiptLine.product.id)
			assignment.set(receiptLine.id, chosen.id);
	});

	const used = new Map<number, number>();
	receipt.items.forEach((receiptLine) => {
		const documentLineId = assignment.get(receiptLine.id);
		if (documentLineId !== undefined)
			used.set(documentLineId, (used.get(documentLineId) ?? 0) + receiptLine.quantity);
	});

	const productIds = [...new Set(receipt.items.map((line) => line.product.id))];
	productIds.forEach((productId) => {
		const free = receipt.items.filter(
			(line) => line.product.id === productId && !assignment.has(line.id),
		);
		if (free.length === 0) return;
		const bins = document.items
			.filter((line) => line.product.id === productId)
			.map((line) => ({
				id: line.id,
				capacity: Math.max(0, line.remaining_quantity - (used.get(line.id) ?? 0)),
			}));
		if (bins.length === 0) {
			free.forEach((line) => unmatched.set(line.id, 'no_line'));
			return;
		}
		const result = searchAssignment(
			free.map((line) => ({ id: line.id, quantity: line.quantity })),
			bins,
		);
		if (result.assignment) {
			result.assignment.forEach((documentLineId, receiptLineId) =>
				assignment.set(receiptLineId, documentLineId),
			);
			return;
		}
		free.forEach((line) => unmatched.set(line.id, result.exhausted ? 'choose' : 'no_capacity'));
	});

	// Una elección del usuario puede pasarse de lo pendiente: se marca, no se corrige.
	const totals = new Map<number, number>();
	receipt.items.forEach((receiptLine) => {
		const documentLineId = assignment.get(receiptLine.id);
		if (documentLineId !== undefined)
			totals.set(documentLineId, (totals.get(documentLineId) ?? 0) + receiptLine.quantity);
	});
	receipt.items.forEach((receiptLine) => {
		const documentLineId = assignment.get(receiptLine.id);
		const documentLine =
			documentLineId === undefined ? undefined : documentLines.get(documentLineId);
		if (documentLine && (totals.get(documentLine.id) ?? 0) > documentLine.remaining_quantity)
			unmatched.set(receiptLine.id, 'no_capacity');
	});

	const items = receipt.items.flatMap((receiptLine) => {
		const documentLineId = assignment.get(receiptLine.id);
		return documentLineId === undefined || unmatched.has(receiptLine.id)
			? []
			: [
					{
						stock_receipt_line_id: receiptLine.id,
						purchase_document_line_id: documentLineId,
					},
				];
	});

	return { items, unmatched, assignment };
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
