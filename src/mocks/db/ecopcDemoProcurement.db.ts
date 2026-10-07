import type {
	IProcurementCost,
	IProcurementProduct,
	IPurchaseDocument,
	IPurchaseDocumentCompact,
	IPurchaseDocumentLine,
	IStockReceipt,
	IWarehouseCompact,
} from '@/interface/procurement.interface';
import {
	bodegaActor,
	ECOPC_BRANCH_ID,
	procurementSuppliers,
	procurementWarehouses,
	unknownCost,
} from '@/mocks/db/procurement.db';
import {
	inventoryOrigins,
	resolveInventoryProduct,
	type IInventorySeedOrigin,
} from '@/mocks/db/inventoryStock.db';
import { ECOPC_SUBSIDIARY_ID, ecopcDemoHistory } from '@/mocks/db/inventoryEcopcDemo.db';

/**
 * Compras de la sucursal Ecopc (filial 1, la de la sesión del equipo en
 * desarrollo): los documentos de prueba y las recepciones que nombran sus
 * procedencias y su historial (#90, #95–#99), para que la ficha de
 * inventario no enlace una «Recepción #N» inexistente.
 *
 * Todo se **deriva** de esas procedencias en vez de copiarse, para que
 * producto, cantidad, bodega, proveedor, fecha y documento no se desalineen si
 * cambia la demo: cada procedencia es una recepción `posted` de una línea, y
 * cada documento que citan tiene una línea por procedencia, recibida entera.
 *
 * Las recepciones van sin `allowed_actions`: sus unidades ya se movieron,
 * ajustaron o reservaron en el historial de la demo, y revertirlas no es parte
 * de lo que la demo muestra. Sólo se siembran en la filial de Ecopc
 * (`stockReceipts.mock`, `purchaseDocuments.mock`).
 */

const NO_DOCUMENT_REASON = 'Compra sin documento, respaldo pendiente';
const VAT_RATE = 0.19;

type TReceiptOrigin = IInventorySeedOrigin & {
	stock_receipt_id: number;
	received_on: string;
	warehouse_id: number;
};

const isEcopcReceiptOrigin = (origin: IInventorySeedOrigin): origin is TReceiptOrigin =>
	origin.branch_id === ECOPC_BRANCH_ID &&
	origin.origin_type === 'stock_receipt' &&
	origin.stock_receipt_id !== null &&
	origin.received_on !== null &&
	origin.warehouse_id !== null;

const receiptOrigins = inventoryOrigins
	.filter(isEcopcReceiptOrigin)
	.sort((a, b) => a.stock_receipt_id - b.stock_receipt_id);

const warehouseById = (warehouseId: number): IWarehouseCompact => {
	const warehouse = procurementWarehouses.find((item) => item.id === warehouseId);
	if (!warehouse) throw new Error(`Bodega ${warehouseId} fuera del catálogo del mock.`);
	return warehouse;
};

const productById = (productId: number): IProcurementProduct => {
	const product = resolveInventoryProduct(productId);
	if (!product) throw new Error(`Producto ${productId} fuera del catálogo del mock.`);
	return product;
};

const operationId = (prefix: string, receiptId: number): string =>
	`${prefix}-0000-4000-8000-${String(receiptId).padStart(12, '0')}`;

/**
 * Costo de la línea a partir del costo neto del catálogo. La factura queda en
 * base neta y la boleta en bruta, como `grossEnteredCost`/`netEnteredCost`.
 */
const documentLineCost = (
	product: IProcurementProduct,
	document: IPurchaseDocumentCompact,
): IProcurementCost => {
	if (product.cost === null) return unknownCost;
	const net = Number(product.cost);
	const vat = Math.round(net * VAT_RATE * 100) / 100;
	const gross = net + vat;
	const isInvoice = document.document_type === 'invoice';
	return {
		currency_code: 'CLP',
		entered_unit_amount: net.toFixed(2),
		entered_basis: 'net',
		vat_rate_percent: (VAT_RATE * 100).toFixed(2),
		net_unit_amount: net.toFixed(2),
		vat_unit_amount: vat.toFixed(2),
		gross_unit_amount: gross.toFixed(2),
		effective_unit_amount: (isInvoice ? net : gross).toFixed(2),
		effective_basis: isInvoice ? 'net' : 'gross',
		source: 'document',
		calculation: 'single_price',
	};
};

/** Línea de documento de cada procedencia que lo cita: `documento * 10 + n`. */
const documentLines = new Map<number, IPurchaseDocumentLine>();
const documentsById = new Map<number, IPurchaseDocumentCompact>();
const linesByDocument = new Map<number, IPurchaseDocumentLine[]>();

receiptOrigins.forEach((origin) => {
	const document = origin.purchase_document;
	if (!document) return;
	const product = productById(origin.product_id);
	const siblings = linesByDocument.get(document.id) ?? [];
	const line: IPurchaseDocumentLine = {
		id: document.id * 10 + siblings.length + 1,
		product,
		sku_snapshot: product.sku,
		name_snapshot: product.name,
		quantity: origin.physical_quantity,
		cost: documentLineCost(product, document),
		notes: null,
		received_quantity: origin.physical_quantity,
		initial_stock_allocated_quantity: 0,
		accounted_quantity: origin.physical_quantity,
		remaining_quantity: 0,
		received_distribution: [
			{
				branch_id: ECOPC_BRANCH_ID,
				warehouse: warehouseById(origin.warehouse_id),
				quantity: origin.physical_quantity,
			},
		],
	};
	documentLines.set(origin.origin_id, line);
	documentsById.set(document.id, document);
	linesByDocument.set(document.id, [...siblings, line]);
});

const totalAmount = (lines: IPurchaseDocumentLine[]): string | null =>
	lines.every((line) => line.cost.gross_unit_amount !== null)
		? lines
				.reduce(
					(total, line) => total + Number(line.cost.gross_unit_amount) * line.quantity,
					0,
				)
				.toFixed(2)
		: null;

export const ecopcDemoPurchaseDocuments: IPurchaseDocument[] = [...documentsById.values()].map(
	(document): IPurchaseDocument => {
		const lines = linesByDocument.get(document.id) ?? [];
		const supplier =
			receiptOrigins.find((origin) => origin.purchase_document?.id === document.id)
				?.supplier ?? null;
		const confirmedAt = `${document.issue_date}T10:00:00-03:00`;
		return {
			...document,
			currency_code: 'CLP',
			total_amount: totalAmount(lines),
			status: 'confirmed',
			reception_status: 'received',
			supplier,
			items_count: lines.length,
			created_at: `${document.issue_date}T09:00:00-03:00`,
			// Recibido entero y con recepciones `posted`: no se anula ni admite otra recepción.
			allowed_actions: ['add_attachment'],
			supplier_snapshot:
				procurementSuppliers.find((item) => item.id === supplier?.id) ?? null,
			shipping_cost: null,
			notes: null,
			items: lines,
			related_counts: {
				stock_receipts: lines.length,
				initial_stock_allocations: 0,
				attachments: 0,
			},
			confirmed_at: confirmedAt,
			cancelled_at: null,
			cancellation_reason: null,
			updated_at: confirmedAt,
		};
	},
);

const postedReceipt = (origin: TReceiptOrigin): IStockReceipt => {
	const id = origin.stock_receipt_id;
	const product = productById(origin.product_id);
	const line = documentLines.get(origin.origin_id) ?? null;
	const postedAt = `${origin.received_on}T11:00:00-03:00`;
	return {
		id,
		subsidiary_id: ECOPC_SUBSIDIARY_ID,
		branch_id: ECOPC_BRANCH_ID,
		status: 'posted',
		warehouse: warehouseById(origin.warehouse_id),
		supplier: origin.supplier,
		purchase_document: origin.purchase_document,
		received_on: origin.received_on,
		items_count: 1,
		total_quantity: origin.physical_quantity,
		created_at: `${origin.received_on}T09:30:00-03:00`,
		posted_at: postedAt,
		allowed_actions: [],
		reason: line ? null : NO_DOCUMENT_REASON,
		notes: null,
		items: [
			{
				id: id * 100,
				product,
				sku_snapshot: product.sku,
				name_snapshot: product.name,
				purchase_document_line_id: line?.id ?? null,
				quantity: origin.physical_quantity,
				cost: line?.cost ?? unknownCost,
			},
		],
		inventory_operation_id: operationId('ec0bc0e0', id),
		reversal_operation_id: null,
		queued_at: `${origin.received_on}T10:58:00-03:00`,
		failed_at: null,
		reversed_at: null,
		cancellation_reason: null,
		reversal_reason: null,
		failure_code: null,
		failure_message: null,
		processing: { attempt_count: 1, last_attempt_at: postedAt, next_retry_at: null },
		posted_by: bodegaActor,
		updated_at: postedAt,
	};
};

/** Recepciones que el historial revierte: ingresaron sin documento y no dejan saldo. */
const reversedReceipts = (ecopcDemoHistory[ECOPC_BRANCH_ID] ?? []).flatMap(
	(event): IStockReceipt[] => {
		if (event.kind !== 'reversed_receipt') return [];
		const id = event.stock_receipt_id;
		return [
			{
				id,
				subsidiary_id: event.subsidiary_id,
				branch_id: ECOPC_BRANCH_ID,
				status: 'reversed',
				warehouse: warehouseById(event.warehouse_id),
				supplier: null,
				purchase_document: null,
				received_on: event.applied_at.slice(0, 10),
				items_count: event.items.length,
				total_quantity: event.items.reduce((total, item) => total + item.quantity, 0),
				created_at: event.applied_at,
				posted_at: event.applied_at,
				allowed_actions: [],
				reason: NO_DOCUMENT_REASON,
				notes: null,
				items: event.items.map((item, index) => {
					const product = productById(item.product_id);
					return {
						id: id * 100 + index,
						product,
						sku_snapshot: product.sku,
						name_snapshot: product.name,
						purchase_document_line_id: null,
						quantity: item.quantity,
						cost: unknownCost,
					};
				}),
				inventory_operation_id: operationId('ec0bc0e0', id),
				reversal_operation_id: operationId('ec0bc0f0', id),
				queued_at: event.applied_at,
				failed_at: null,
				reversed_at: event.reversed_at,
				cancellation_reason: null,
				reversal_reason: 'Ingresó por error a la bodega; se revierte la misma tarde.',
				failure_code: null,
				failure_message: null,
				processing: {
					attempt_count: 1,
					last_attempt_at: event.applied_at,
					next_retry_at: null,
				},
				posted_by: bodegaActor,
				updated_at: event.reversed_at,
			},
		];
	},
);

export const ecopcDemoReceipts: IStockReceipt[] = [
	...receiptOrigins.map(postedReceipt),
	...reversedReceipts,
].sort((a, b) => a.id - b.id);

/** Semilla extra de Recepciones para una filial: sólo Ecopc tiene la suya. */
export const extraStockReceiptsForSubsidiary = (subsidiaryId: number): IStockReceipt[] =>
	subsidiaryId === ECOPC_SUBSIDIARY_ID ? ecopcDemoReceipts : [];

/** Semilla extra de Documentos de compra (simulados) para una filial. */
export const extraPurchaseDocumentsForSubsidiary = (subsidiaryId: number): IPurchaseDocument[] =>
	subsidiaryId === ECOPC_SUBSIDIARY_ID ? ecopcDemoPurchaseDocuments : [];
