import { afterEach, describe, expect, it } from 'vitest';
import {
	cancelPurchaseDocument,
	confirmPurchaseDocument,
	createPurchaseDocument,
	getPurchaseDocument,
	listPurchaseDocuments,
	resetPurchaseDocumentsStoreForTests,
	simulatePurchaseDocumentsReloadForTests,
	updatePurchaseDocument,
} from '@/services/procurement/purchaseDocuments.service';
import type { IPurchaseDocumentCreatePayload } from '@/interface/procurement.interface';

/**
 * El servicio simula `/api/subsidiaries/{subsidiary}/procurement/
 * purchase-documents` (sección 6 del contrato). Estas pruebas verifican la
 * simulación de las reglas del contrato — factura exige proveedor, `ETag`/
 * `If-Match`, reemplazo de líneas, confirmar/anular — no el fixture en sí,
 * que ya cubre `procurement.db.test.ts`.
 */

const SUBSIDIARY_A = 4;
const SUBSIDIARY_B = 9;

// IDs literales de `procurement.db.ts`.
const CONFIRMED_WITH_RECEIPT_ID = 24; // pcExpressInvoiceDocument
const DRAFT_RECEIPT_NO_SUPPLIER_ID = 31; // draftReceiptDocument
const DRAFT_INVOICE_ID = 42; // draftInvoiceDocument
const CANCELLED_ID = 50; // cancelledInvoiceDocument

const MOUSE_PRODUCT_ID = 31;
const NOTEBOOK_SERIALIZED_PRODUCT_ID = 44;
const PC_EXPRESS_SUPPLIER_ID = 7; // completo: giro + ambas direcciones
const CONTRERAS_SUPPLIER_ID = 15; // activo pero incompleto para facturar

const readErrorData = async (promise: Promise<unknown>) => {
	try {
		await promise;
		throw new Error('Se esperaba que la promesa rechazara');
	} catch (error) {
		return (error as { response: { status: number; data: Record<string, unknown> } }).response;
	}
};

const basePayload: IPurchaseDocumentCreatePayload = {
	document_type: 'receipt',
	supplier_id: null,
	document_number: 'TEST-001',
	issue_date: '2026-09-01',
	currency_code: 'CLP',
	total_amount: null,
	notes: null,
	items: [
		{
			product_id: MOUSE_PRODUCT_ID,
			quantity: 2,
			unit_cost: '5000.00',
			unit_cost_basis: 'gross',
			notes: null,
		},
	],
};

afterEach(() => {
	resetPurchaseDocumentsStoreForTests();
});

// Documento agregado por la card 05 (recepciones): confirmado, con
// capacidad parcial, para que las recepciones «con documento» tengan un
// destino real sin consumir de inmediato `CONFIRMED_WITH_RECEIPT_ID`.
const CONFIRMED_PARTIAL_ID = 61; // pcExpressKeyboardInvoiceDocument
// Documento agregado por la card 07 (documentar después, sección 8):
// confirmado, sin proveedor, con capacidad sin consumir para `cableProduct`.
const CONFIRMED_INITIAL_STOCK_ID = 90; // cableProductInitialStockDocument

describe('listPurchaseDocuments', () => {
	it('lista los seis documentos semilla ordenados por emisión DESC', async () => {
		const result = await listPurchaseDocuments(SUBSIDIARY_A);
		expect(result.data.map((row) => row.id)).toEqual([
			DRAFT_INVOICE_ID,
			DRAFT_RECEIPT_NO_SUPPLIER_ID,
			CONFIRMED_WITH_RECEIPT_ID,
			CONFIRMED_INITIAL_STOCK_ID,
			CONFIRMED_PARTIAL_ID,
			CANCELLED_ID,
		]);
	});

	it('filtra por document_type, status, reception_status y supplier_id', async () => {
		const invoices = await listPurchaseDocuments(SUBSIDIARY_A, { document_type: 'invoice' });
		expect(invoices.data.every((row) => row.document_type === 'invoice')).toBe(true);

		const drafts = await listPurchaseDocuments(SUBSIDIARY_A, { status: 'draft' });
		expect(drafts.data.map((row) => row.id).sort()).toEqual([31, 42]);

		const partial = await listPurchaseDocuments(SUBSIDIARY_A, {
			reception_status: 'partially_received',
		});
		expect(partial.data.map((row) => row.id).sort()).toEqual(
			[CONFIRMED_WITH_RECEIPT_ID, CONFIRMED_PARTIAL_ID].sort(),
		);

		const bySupplier = await listPurchaseDocuments(SUBSIDIARY_A, {
			supplier_id: PC_EXPRESS_SUPPLIER_ID,
		});
		expect(bySupplier.data.every((row) => row.supplier?.id === PC_EXPRESS_SUPPLIER_ID)).toBe(
			true,
		);
	});

	it('busca por folio, proveedor y RUT', async () => {
		// «55012» sólo aparece como folio (draftReceiptDocument, sin proveedor):
		// a diferencia de «1234», no coincide además con el RUT de PCExpress.
		const byFolio = await listPurchaseDocuments(SUBSIDIARY_A, { search: '55012' });
		expect(byFolio.data.map((row) => row.id)).toEqual([DRAFT_RECEIPT_NO_SUPPLIER_ID]);

		// «1234» coincide con el folio del documento 24 y con el RUT de
		// PCExpress (76123456-0), proveedor también de los documentos 42, 50 y
		// del agregado por la card 05 (61, mismo proveedor).
		const byFolioOrSupplierRut = await listPurchaseDocuments(SUBSIDIARY_A, { search: '1234' });
		expect(byFolioOrSupplierRut.data.map((row) => row.id).sort()).toEqual([
			24,
			42,
			50,
			CONFIRMED_PARTIAL_ID,
		]);

		const byRut = await listPurchaseDocuments(SUBSIDIARY_A, { search: '76123456' });
		expect(byRut.data.length).toBeGreaterThan(0);
	});

	it('aísla el store por filial: crear en una no aparece en la otra', async () => {
		await createPurchaseDocument(SUBSIDIARY_A, basePayload);
		const otherSubsidiaryList = await listPurchaseDocuments(SUBSIDIARY_B);
		expect(otherSubsidiaryList.data.some((row) => row.document_number === 'TEST-001')).toBe(
			false,
		);
	});
});

describe('getPurchaseDocument', () => {
	it('entrega el detalle con ETag', async () => {
		const { data, headers } = await getPurchaseDocument(SUBSIDIARY_A, DRAFT_INVOICE_ID);
		expect(data.id).toBe(DRAFT_INVOICE_ID);
		expect(headers.etag).toMatch(/^W\/"pd-42-v\d+"$/);
	});

	it('404 si el documento no existe', async () => {
		const { status, data } = await readErrorData(getPurchaseDocument(SUBSIDIARY_A, 9999));
		expect(status).toBe(404);
		expect(data.code).toBe('PURCHASE_DOCUMENT_NOT_FOUND');
	});
});

describe('createPurchaseDocument', () => {
	it('conserva el envío separado de productos al recargar y permite quitarlo del borrador', async () => {
		const created = await createPurchaseDocument(SUBSIDIARY_A, {
			...basePayload,
			shipping_cost: '1190.00',
			shipping_cost_basis: 'gross',
		});
		expect(created.data.items).toHaveLength(1);
		expect(created.data.shipping_cost?.entered_unit_amount).toBe('1190.00');
		expect(created.data.shipping_cost?.entered_basis).toBe('gross');
		simulatePurchaseDocumentsReloadForTests();
		const reloaded = await getPurchaseDocument(SUBSIDIARY_A, created.data.id);
		expect(reloaded.data.shipping_cost).toEqual(created.data.shipping_cost);
		const updated = await updatePurchaseDocument(
			SUBSIDIARY_A,
			created.data.id,
			{ shipping_cost: null, shipping_cost_basis: null },
			{ etag: reloaded.headers.etag },
		);
		expect(updated.data.shipping_cost).toBeNull();
		expect(updated.data.items).toEqual(created.data.items);
		simulatePurchaseDocumentsReloadForTests();
		expect(
			(await getPurchaseDocument(SUBSIDIARY_A, created.data.id)).data.shipping_cost,
		).toBeNull();
	});

	it('la factura sin proveedor es 422 INVOICE_SUPPLIER_REQUIRED', async () => {
		const { status, data } = await readErrorData(
			createPurchaseDocument(SUBSIDIARY_A, { ...basePayload, document_type: 'invoice' }),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('INVOICE_SUPPLIER_REQUIRED');
	});

	it('la boleta permite proveedor null', async () => {
		const { data } = await createPurchaseDocument(SUBSIDIARY_A, basePayload);
		expect(data.status).toBe('draft');
		expect(data.supplier).toBeNull();
		expect(data.allowed_actions).toEqual(['update', 'confirm', 'cancel', 'add_attachment']);
	});

	it('items vacíos es 422 PURCHASE_DOCUMENT_ITEMS_EMPTY', async () => {
		const { status, data } = await readErrorData(
			createPurchaseDocument(SUBSIDIARY_A, { ...basePayload, items: [] }),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('PURCHASE_DOCUMENT_ITEMS_EMPTY');
	});

	it('un producto serializado es 422 PURCHASE_DOCUMENT_PRODUCT_INVALID', async () => {
		const { status, data } = await readErrorData(
			createPurchaseDocument(SUBSIDIARY_A, {
				...basePayload,
				items: [
					{
						product_id: NOTEBOOK_SERIALIZED_PRODUCT_ID,
						quantity: 1,
						unit_cost: '100.00',
						unit_cost_basis: 'gross',
						notes: null,
					},
				],
			}),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('PURCHASE_DOCUMENT_PRODUCT_INVALID');
	});

	it('varias líneas del mismo producto son válidas, cada una con su costo', async () => {
		const { data } = await createPurchaseDocument(SUBSIDIARY_A, {
			...basePayload,
			items: [
				{ ...basePayload.items[0], unit_cost: '5000.00' },
				{ ...basePayload.items[0], unit_cost: '5200.00' },
			],
		});
		expect(data.items).toHaveLength(2);
		expect(data.items[0].cost.entered_unit_amount).toBe('5000.00');
		expect(data.items[1].cost.entered_unit_amount).toBe('5200.00');
	});

	it('el costo efectivo es neto en factura y bruto en boleta, sin importar la base ingresada', async () => {
		const { data: invoiceDoc } = await createPurchaseDocument(SUBSIDIARY_A, {
			...basePayload,
			document_type: 'invoice',
			supplier_id: PC_EXPRESS_SUPPLIER_ID,
		});
		expect(invoiceDoc.items[0].cost.effective_basis).toBe('net');

		const { data: receiptDoc } = await createPurchaseDocument(SUBSIDIARY_A, basePayload);
		expect(receiptDoc.items[0].cost.effective_basis).toBe('gross');
	});

	it('misma Idempotency-Key y mismo payload devuelve el mismo resultado', async () => {
		const headers = { idempotencyKey: 'key-create-1' };
		const first = await createPurchaseDocument(SUBSIDIARY_A, basePayload, headers);
		const second = await createPurchaseDocument(SUBSIDIARY_A, basePayload, headers);
		expect(second.data.id).toBe(first.data.id);

		const listed = await listPurchaseDocuments(SUBSIDIARY_A, { search: 'TEST-001' });
		expect(listed.data).toHaveLength(1);
	});

	it('misma Idempotency-Key con otro payload es 409 IDEMPOTENCY_KEY_REUSED', async () => {
		const headers = { idempotencyKey: 'key-create-2' };
		await createPurchaseDocument(SUBSIDIARY_A, basePayload, headers);
		const { status, data } = await readErrorData(
			createPurchaseDocument(
				SUBSIDIARY_A,
				{ ...basePayload, document_number: 'OTRO' },
				headers,
			),
		);
		expect(status).toBe(409);
		expect(data.code).toBe('IDEMPOTENCY_KEY_REUSED');
	});

	it('dos creaciones concurrentes con la misma clave: una gana, la otra ve OPERATION_IN_PROGRESS', async () => {
		const headers = { idempotencyKey: 'key-concurrent-create' };
		const [first, second] = await Promise.allSettled([
			createPurchaseDocument(SUBSIDIARY_A, basePayload, headers),
			createPurchaseDocument(SUBSIDIARY_A, basePayload, headers),
		]);

		const fulfilled = [first, second].filter(
			(
				outcome,
			): outcome is PromiseFulfilledResult<
				Awaited<ReturnType<typeof createPurchaseDocument>>
			> => outcome.status === 'fulfilled',
		);
		const rejected = [first, second].filter(
			(outcome): outcome is PromiseRejectedResult => outcome.status === 'rejected',
		);
		expect(fulfilled).toHaveLength(1);
		expect(rejected).toHaveLength(1);
		const { response } = rejected[0].reason as {
			response: { status: number; data: Record<string, unknown> };
		};
		expect(response.status).toBe(409);
		expect(response.data.code).toBe('OPERATION_IN_PROGRESS');

		// La concurrencia no duplicó la escritura: sólo un documento se creó.
		const listed = await listPurchaseDocuments(SUBSIDIARY_A, { search: 'TEST-001' });
		expect(listed.data).toHaveLength(1);
	});
});

describe('updatePurchaseDocument', () => {
	it('sin If-Match es 428', async () => {
		const { status } = await readErrorData(
			updatePurchaseDocument(SUBSIDIARY_A, DRAFT_INVOICE_ID, { document_number: 'X' }, {}),
		);
		expect(status).toBe(428);
	});

	it('con ETag obsoleto es 412 RESOURCE_VERSION_CONFLICT', async () => {
		const { status, data } = await readErrorData(
			updatePurchaseDocument(
				SUBSIDIARY_A,
				DRAFT_INVOICE_ID,
				{ document_number: 'X' },
				{ etag: 'W/"pd-42-v0"' },
			),
		);
		expect(status).toBe(412);
		expect(data.code).toBe('RESOURCE_VERSION_CONFLICT');
	});

	it('un documento confirmado es 409 PURCHASE_DOCUMENT_IMMUTABLE', async () => {
		const { headers } = await getPurchaseDocument(SUBSIDIARY_A, CONFIRMED_WITH_RECEIPT_ID);
		const { status, data } = await readErrorData(
			updatePurchaseDocument(
				SUBSIDIARY_A,
				CONFIRMED_WITH_RECEIPT_ID,
				{ notes: 'intento' },
				{ etag: headers.etag },
			),
		);
		expect(status).toBe(409);
		expect(data.code).toBe('PURCHASE_DOCUMENT_IMMUTABLE');
	});

	it('items: [] es 422 PURCHASE_DOCUMENT_ITEMS_EMPTY', async () => {
		const { headers } = await getPurchaseDocument(SUBSIDIARY_A, DRAFT_INVOICE_ID);
		const { status, data } = await readErrorData(
			updatePurchaseDocument(
				SUBSIDIARY_A,
				DRAFT_INVOICE_ID,
				{ items: [] },
				{ etag: headers.etag },
			),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('PURCHASE_DOCUMENT_ITEMS_EMPTY');
	});

	it('un id de línea ajeno es 422 DOCUMENT_LINE_MISMATCH', async () => {
		const { headers } = await getPurchaseDocument(SUBSIDIARY_A, DRAFT_INVOICE_ID);
		const { status, data } = await readErrorData(
			updatePurchaseDocument(
				SUBSIDIARY_A,
				DRAFT_INVOICE_ID,
				{
					items: [
						{
							id: 999999,
							product_id: MOUSE_PRODUCT_ID,
							quantity: 1,
							unit_cost: '100.00',
							unit_cost_basis: 'gross',
							notes: null,
						},
					],
				},
				{ etag: headers.etag },
			),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('DOCUMENT_LINE_MISMATCH');
	});

	it('items ausente conserva las líneas; presente reemplaza la colección', async () => {
		const before = await getPurchaseDocument(SUBSIDIARY_A, DRAFT_INVOICE_ID);
		expect(before.data.items).toHaveLength(2);

		const kept = await updatePurchaseDocument(
			SUBSIDIARY_A,
			DRAFT_INVOICE_ID,
			{ notes: 'sólo cambio la nota' },
			{ etag: before.headers.etag },
		);
		expect(kept.data.items).toHaveLength(2);
		expect(kept.data.items.map((item) => item.id)).toEqual(
			before.data.items.map((item) => item.id),
		);

		const firstLineId = before.data.items[0].id;
		const replaced = await updatePurchaseDocument(
			SUBSIDIARY_A,
			DRAFT_INVOICE_ID,
			{
				items: [
					{
						id: firstLineId,
						product_id: MOUSE_PRODUCT_ID,
						quantity: 99,
						unit_cost: '100.00',
						unit_cost_basis: 'gross',
						notes: null,
					},
				],
			},
			{ etag: kept.headers.etag },
		);
		// La línea con id actualiza; la que no vino en el reemplazo queda fuera.
		expect(replaced.data.items).toHaveLength(1);
		expect(replaced.data.items[0].id).toBe(firstLineId);
		expect(replaced.data.items[0].quantity).toBe(99);
	});
});

describe('confirmPurchaseDocument', () => {
	it('proveedor incompleto es 422 INVOICE_SUPPLIER_INCOMPLETE', async () => {
		const { data: created } = await createPurchaseDocument(SUBSIDIARY_A, {
			...basePayload,
			document_type: 'invoice',
			supplier_id: CONTRERAS_SUPPLIER_ID,
		});
		const { status, data } = await readErrorData(
			confirmPurchaseDocument(SUBSIDIARY_A, created.id),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('INVOICE_SUPPLIER_INCOMPLETE');
	});

	it('confirmar un documento que ya no es draft es 409 PURCHASE_DOCUMENT_NOT_DRAFT', async () => {
		const { status, data } = await readErrorData(
			confirmPurchaseDocument(SUBSIDIARY_A, CONFIRMED_WITH_RECEIPT_ID),
		);
		expect(status).toBe(409);
		expect(data.code).toBe('PURCHASE_DOCUMENT_NOT_DRAFT');
	});

	it('confirma una boleta sin proveedor: pending, sin snapshot', async () => {
		const { data } = await confirmPurchaseDocument(SUBSIDIARY_A, DRAFT_RECEIPT_NO_SUPPLIER_ID);
		expect(data.status).toBe('confirmed');
		expect(data.reception_status).toBe('pending');
		expect(data.supplier_snapshot).toBeNull();
		// `create_receipt` (card 05, sección 7): un documento confirmado
		// siempre la ofrece, aunque su capacidad restante sea baja.
		expect(data.allowed_actions).toEqual(['create_receipt', 'cancel', 'add_attachment']);
	});

	it('confirma una factura con proveedor completo: fija el snapshot histórico', async () => {
		const { data } = await confirmPurchaseDocument(SUBSIDIARY_A, DRAFT_INVOICE_ID);
		expect(data.status).toBe('confirmed');
		expect(data.supplier_snapshot?.id).toBe(PC_EXPRESS_SUPPLIER_ID);
		expect(data.supplier_snapshot?.business_activity).not.toBeNull();
		expect(data.confirmed_at).not.toBeNull();
	});
});

describe('cancelPurchaseDocument', () => {
	it('sin motivo es 422 CANCELLATION_REASON_REQUIRED', async () => {
		const { status, data } = await readErrorData(
			cancelPurchaseDocument(SUBSIDIARY_A, DRAFT_INVOICE_ID, { reason: '' }),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('CANCELLATION_REASON_REQUIRED');
	});

	it('anular un documento ya anulado es 409 PURCHASE_DOCUMENT_ALREADY_CANCELLED', async () => {
		const { status, data } = await readErrorData(
			cancelPurchaseDocument(SUBSIDIARY_A, CANCELLED_ID, { reason: 'otra vez' }),
		);
		expect(status).toBe(409);
		expect(data.code).toBe('PURCHASE_DOCUMENT_ALREADY_CANCELLED');
	});

	it('con recepciones activas es 409 PURCHASE_DOCUMENT_HAS_ACTIVE_RECEIPTS', async () => {
		const { status, data } = await readErrorData(
			cancelPurchaseDocument(SUBSIDIARY_A, CONFIRMED_WITH_RECEIPT_ID, { reason: 'motivo' }),
		);
		expect(status).toBe(409);
		expect(data.code).toBe('PURCHASE_DOCUMENT_HAS_ACTIVE_RECEIPTS');
	});

	it('anula un borrador sin recepciones: libera el folio, sin acciones', async () => {
		const { data } = await cancelPurchaseDocument(SUBSIDIARY_A, DRAFT_INVOICE_ID, {
			reason: 'folio ingresado por error',
		});
		expect(data.status).toBe('cancelled');
		expect(data.cancellation_reason).toBe('folio ingresado por error');
		expect(data.reception_status).toBeNull();
		expect(data.allowed_actions).toEqual([]);
	});

	it('confirmar y anular en paralelo sobre el mismo borrador se encolan: ninguna pisa a la otra', async () => {
		// `confirmPurchaseDocument` espera a `getProcurementSupplier` antes de
		// escribir; `cancelPurchaseDocument` no espera nada. Sin encolar por
		// documento, `cancel` terminaría primero (estado aún `draft`) y
		// `confirm` la pisaría al resolver después, revirtiendo la anulación en
		// silencio. Encoladas, `confirm` corre entera primero (llegó primero a
		// la cola) y `cancel` corre después sobre el documento ya confirmado.
		const [confirmOutcome, cancelOutcome] = await Promise.allSettled([
			confirmPurchaseDocument(SUBSIDIARY_A, DRAFT_INVOICE_ID),
			cancelPurchaseDocument(SUBSIDIARY_A, DRAFT_INVOICE_ID, { reason: 'motivo carrera' }),
		]);

		expect(confirmOutcome.status).toBe('fulfilled');
		expect(cancelOutcome.status).toBe('fulfilled');

		const { data: finalState } = await getPurchaseDocument(SUBSIDIARY_A, DRAFT_INVOICE_ID);
		expect(finalState.status).toBe('cancelled');
		expect(finalState.cancellation_reason).toBe('motivo carrera');
	});
});

// «listas relacionadas»: ni las recepciones vinculadas
// (`listStockReceiptsForPurchaseDocument`, hallazgo 9) ni las asignaciones de
// stock inicial (`listInitialStockAllocationsForPurchaseDocument`, card 07,
// ZF-112) viven en este servicio — ambas se cubren en
// `stockReceipts.service.test.ts` e `inventoryStock.service.test.ts`
// respectivamente: esos stores son la fuente real, no un stub de este
// archivo.
