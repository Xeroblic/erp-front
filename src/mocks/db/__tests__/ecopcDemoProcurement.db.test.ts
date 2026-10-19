import { afterEach, describe, expect, it } from 'vitest';
import { ECOPC_BRANCH_ID, STOCK_RECEIPT_SUBSIDIARY_ID } from '@/mocks/db/procurement.db';
import { inventoryOrigins } from '@/mocks/db/inventoryStock.db';
import { ECOPC_SUBSIDIARY_ID, ecopcDemoHistory } from '@/mocks/db/inventoryEcopcDemo.db';
import {
	getStockReceipt,
	listStockReceipts,
	resetStockReceiptsStoreForTests,
} from '@/mocks/services/stockReceipts.mock';
import {
	findPurchaseDocumentByLineId,
	resetPurchaseDocumentsStoreForTests,
} from '@/mocks/services/purchaseDocuments.mock';

afterEach(() => {
	resetStockReceiptsStoreForTests();
	resetPurchaseDocumentsStoreForTests();
});

/** Filial dueña de cada sucursal sembrada: Ecopc tiene la suya, el resto usa la 2. */
const subsidiaryOf = (branchId: number): number =>
	branchId === ECOPC_BRANCH_ID ? ECOPC_SUBSIDIARY_ID : STOCK_RECEIPT_SUBSIDIARY_ID;

const receiptOrigins = inventoryOrigins.flatMap((origin) =>
	origin.origin_type === 'stock_receipt' && origin.stock_receipt_id !== null
		? [{ ...origin, stock_receipt_id: origin.stock_receipt_id }]
		: [],
);

const reversedReceiptEvents = (ecopcDemoHistory[ECOPC_BRANCH_ID] ?? []).flatMap((event) =>
	event.kind === 'reversed_receipt' ? [event] : [],
);

describe('Semillas: procedencias, recepciones y documentos coherentes', () => {
	it('las semillas nombran recepciones en las dos sucursales', () => {
		const branches = new Set(receiptOrigins.map((origin) => origin.branch_id));
		expect(branches).toEqual(new Set([4, ECOPC_BRANCH_ID]));
		expect(reversedReceiptEvents.length).toBeGreaterThan(0);
	});

	// La ficha de inventario enlaza «Recepción #N»: el destino tiene que existir
	// y contar lo mismo que la procedencia. La procedencia puede tener menos
	// unidades que la recepción (se vendieron o movieron), nunca más.
	it.each(
		receiptOrigins.map(
			(origin) => [origin.origin_id, origin.stock_receipt_id, origin] as const,
		),
	)(
		'la procedencia %i abre la recepción #%i con su producto, proveedor y documento',
		async (_originId, receiptId, origin) => {
			const { data } = await getStockReceipt(subsidiaryOf(origin.branch_id), receiptId);

			expect(data.status).toBe('posted');
			expect(data.branch_id).toBe(origin.branch_id);
			expect(data.received_on).toBe(origin.received_on);
			expect(data.supplier).toEqual(origin.supplier);
			const received = data.items
				.filter((item) => item.product.id === origin.product_id)
				.reduce((total, item) => total + item.quantity, 0);
			expect(received).toBeGreaterThanOrEqual(origin.physical_quantity);
			if (data.purchase_document) {
				expect(origin.purchase_document).toEqual(data.purchase_document);
			}
		},
	);

	it.each(receiptOrigins.map((origin) => [origin.stock_receipt_id, origin.branch_id] as const))(
		'cada línea con documento de la recepción #%i existe en ese documento',
		async (receiptId, branchId) => {
			const subsidiaryId = subsidiaryOf(branchId);
			const { data } = await getStockReceipt(subsidiaryId, receiptId);

			data.items.forEach((item) => {
				if (item.purchase_document_line_id === null) return;
				const document = findPurchaseDocumentByLineId(
					subsidiaryId,
					item.purchase_document_line_id,
				);
				expect(document?.id).toBe(data.purchase_document?.id);
				const line = document?.items.find(
					(row) => row.id === item.purchase_document_line_id,
				);
				expect(line?.product.id).toBe(item.product.id);
				expect(line?.received_quantity).toBeGreaterThanOrEqual(item.quantity);
			});
		},
	);

	it.each(reversedReceiptEvents.map((event) => [event.stock_receipt_id, event] as const))(
		'la reversión del historial (#%i) tiene su recepción revertida',
		async (receiptId, event) => {
			const { data } = await getStockReceipt(event.subsidiary_id, receiptId);

			expect(data.status).toBe('reversed');
			expect(data.reversed_at).toBe(event.reversed_at);
			expect(data.items.map((item) => [item.product.id, item.quantity])).toEqual(
				event.items.map((item) => [item.product_id, item.quantity]),
			);
		},
	);

	it('las demás filiales no reciben las recepciones ni los documentos de Ecopc', async () => {
		const ecopcOrigin = receiptOrigins.find((origin) => origin.branch_id === ECOPC_BRANCH_ID);
		const ecopcDocument = ecopcOrigin?.purchase_document;
		expect(ecopcOrigin && ecopcDocument).toBeTruthy();

		await expect(
			getStockReceipt(STOCK_RECEIPT_SUBSIDIARY_ID, ecopcOrigin?.stock_receipt_id ?? 0),
		).rejects.toMatchObject({ response: { status: 404 } });
		const { data } = await listStockReceipts(STOCK_RECEIPT_SUBSIDIARY_ID, { per_page: 100 });
		expect(data.some((row) => row.branch_id === ECOPC_BRANCH_ID)).toBe(false);
		expect(
			findPurchaseDocumentByLineId(
				STOCK_RECEIPT_SUBSIDIARY_ID,
				(ecopcDocument?.id ?? 0) * 10 + 1,
			),
		).toBeUndefined();
	});
});
