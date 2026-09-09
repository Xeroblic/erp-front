import { afterEach, describe, expect, it } from 'vitest';
import {
	cancelStockReceipt,
	createStockReceipt,
	getStockReceipt,
	listStockReceipts,
	postStockReceipt,
	resetStockReceiptsStoreForTests,
	retryStockReceipt,
	reverseStockReceipt,
	setStockReceiptForcedOutcomeForTests,
	STOCK_RECEIPT_WORKER_DELAY_MS,
	updateStockReceipt,
} from '@/services/procurement/stockReceipts.service';
import {
	findPurchaseDocumentForReceipts,
	resetPurchaseDocumentsStoreForTests,
} from '@/services/procurement/purchaseDocuments.service';
import type { IStockReceiptCreatePayload } from '@/interface/procurement.interface';

/**
 * El servicio simula `/api/subsidiaries/{subsidiary}/procurement/
 * stock-receipts` (sección 7 del contrato) — la card más valiosa del
 * proyecto: la UX asíncrona (`draft → queued → posted/failed`) es justamente
 * lo que el contrato escrito no puede resolver solo. Estas pruebas ejercen
 * esa simulación de punta a punta con el worker real (`setTimeout`), no con
 * temporizadores falsos: el propósito de la card es demostrar el
 * comportamiento asíncrono real, no acortarlo.
 */

const SUBSIDIARY_A = 4;
const SUBSIDIARY_B = 9;
const BRANCH_ID = 4;

// IDs literales de `procurement.db.ts`.
const DRAFT_MANUAL_ID = 70;
const DRAFT_UNKNOWN_COST_ID = 71;
const QUEUED_ID = 72;
const FAILED_ID = 73;
const CANCELLED_ID = 74;
const REVERSED_ID = 75;
const POSTED_CONSUMED_ID = 80; // postedKeyboardStockReceipt, marcada consumida

const MAIN_WAREHOUSE_ID = 8;
const PC_EXPRESS_SUPPLIER_ID = 7;
const MOUSE_PRODUCT_ID = 31;
const KEYBOARD_DOCUMENT_ID = 61; // pcExpressKeyboardInvoiceDocument, confirmado
const KEYBOARD_DOCUMENT_LINE_ID = 601; // remaining_quantity: 12

const ACTOR = { id: 40, name: 'Camila Vidal' };

const readErrorData = async (promise: Promise<unknown>) => {
	try {
		await promise;
		throw new Error('Se esperaba que la promesa rechazara');
	} catch (error) {
		return (error as { response: { status: number; data: Record<string, unknown> } }).response;
	}
};

const waitForWorker = () =>
	new Promise<void>((resolve) => {
		setTimeout(resolve, STOCK_RECEIPT_WORKER_DELAY_MS + 200);
	});

const manualPayload: IStockReceiptCreatePayload = {
	purchase_document_id: null,
	supplier_id: null,
	warehouse_id: MAIN_WAREHOUSE_ID,
	received_on: '2026-09-04',
	reason: 'Ingreso de prueba',
	notes: null,
	items: [{ product_id: MOUSE_PRODUCT_ID, quantity: 3 }],
};

afterEach(() => {
	resetStockReceiptsStoreForTests();
	resetPurchaseDocumentsStoreForTests();
});

describe('listStockReceipts', () => {
	it('lista las siete recepciones semilla ordenadas por received_on DESC, ID DESC', async () => {
		const result = await listStockReceipts(SUBSIDIARY_A);
		expect(result.data).toHaveLength(7);
		const sorted = [...result.data];
		expect(result.data).toEqual(sorted);
	});

	it('filtra por status, warehouse_id y search', async () => {
		const drafts = await listStockReceipts(SUBSIDIARY_A, { status: 'draft' });
		expect(drafts.data.map((row) => row.id).sort()).toEqual([
			DRAFT_MANUAL_ID,
			DRAFT_UNKNOWN_COST_ID,
		]);

		const byWarehouse = await listStockReceipts(SUBSIDIARY_A, {
			warehouse_id: MAIN_WAREHOUSE_ID,
		});
		expect(byWarehouse.data.every((row) => row.warehouse.id === MAIN_WAREHOUSE_ID)).toBe(true);

		const bySearch = await listStockReceipts(SUBSIDIARY_A, { search: 'PCExpress' });
		expect(bySearch.data.length).toBeGreaterThan(0);
		expect(bySearch.data.every((row) => row.supplier?.display_name === 'PCExpress')).toBe(true);
	});

	it('particiona el store por filial: la misma búsqueda en otra filial no comparte estado', async () => {
		const resultA = await listStockReceipts(SUBSIDIARY_A);
		const resultB = await listStockReceipts(SUBSIDIARY_B);
		expect(resultA.data.map((row) => row.id)).toEqual(resultB.data.map((row) => row.id));
	});
});

describe('createStockReceipt — con documento', () => {
	it('deriva producto, proveedor y costo del documento; no acepta overrides', async () => {
		const { data } = await createStockReceipt(SUBSIDIARY_A, BRANCH_ID, {
			purchase_document_id: KEYBOARD_DOCUMENT_ID,
			warehouse_id: MAIN_WAREHOUSE_ID,
			received_on: '2026-09-08',
			notes: null,
			items: [{ purchase_document_line_id: KEYBOARD_DOCUMENT_LINE_ID, quantity: 5 }],
		});

		expect(data.status).toBe('draft');
		expect(data.supplier?.id).toBe(PC_EXPRESS_SUPPLIER_ID);
		expect(data.items[0].product.id).toBe(67); // keyboardProduct
		expect(data.items[0].cost.source).toBe('document');
		expect(data.purchase_document?.id).toBe(KEYBOARD_DOCUMENT_ID);
	});

	it('RECEIPT_EXCEEDS_DOCUMENT cuando la cantidad supera lo pendiente de la línea', async () => {
		const response = await readErrorData(
			createStockReceipt(SUBSIDIARY_A, BRANCH_ID, {
				purchase_document_id: KEYBOARD_DOCUMENT_ID,
				warehouse_id: MAIN_WAREHOUSE_ID,
				received_on: '2026-09-08',
				notes: null,
				items: [{ purchase_document_line_id: KEYBOARD_DOCUMENT_LINE_ID, quantity: 13 }], // quedan 12
			}),
		);
		expect(response.status).toBe(422);
		expect(response.data.code).toBe('RECEIPT_EXCEEDS_DOCUMENT');
	});

	it('DOCUMENT_LINE_MISMATCH cuando la línea no pertenece al documento', async () => {
		const response = await readErrorData(
			createStockReceipt(SUBSIDIARY_A, BRANCH_ID, {
				purchase_document_id: KEYBOARD_DOCUMENT_ID,
				warehouse_id: MAIN_WAREHOUSE_ID,
				received_on: '2026-09-08',
				notes: null,
				items: [{ purchase_document_line_id: 999999, quantity: 1 }],
			}),
		);
		expect(response.status).toBe(422);
		expect(response.data.code).toBe('DOCUMENT_LINE_MISMATCH');
	});

	it('DOCUMENT_NOT_CONFIRMED cuando el documento no está confirmado', async () => {
		// id 42 = draftInvoiceDocument (draft, no confirmado).
		const response = await readErrorData(
			createStockReceipt(SUBSIDIARY_A, BRANCH_ID, {
				purchase_document_id: 42,
				warehouse_id: MAIN_WAREHOUSE_ID,
				received_on: '2026-09-08',
				notes: null,
				items: [{ purchase_document_line_id: 301, quantity: 1 }],
			}),
		);
		expect(response.status).toBe(422);
		expect(response.data.code).toBe('DOCUMENT_NOT_CONFIRMED');
	});
});

describe('createStockReceipt — sin documento', () => {
	it('reason obligatorio', async () => {
		const response = await readErrorData(
			createStockReceipt(SUBSIDIARY_A, BRANCH_ID, { ...manualPayload, reason: '' }),
		);
		expect(response.status).toBe(422);
		expect(response.data.code).toBe('STOCK_RECEIPT_REASON_REQUIRED');
	});

	it('proveedor conocido exige costo y base', async () => {
		const response = await readErrorData(
			createStockReceipt(SUBSIDIARY_A, BRANCH_ID, {
				...manualPayload,
				supplier_id: PC_EXPRESS_SUPPLIER_ID,
			}),
		);
		expect(response.status).toBe(422);
		expect(['UNIT_COST_REQUIRED', 'UNIT_COST_BASIS_REQUIRED']).toContain(response.data.code);
	});

	it('sin proveedor: costo puede quedar desconocido', async () => {
		const { data } = await createStockReceipt(SUBSIDIARY_A, BRANCH_ID, manualPayload);
		expect(data.items[0].cost.source).toBe('unknown');
		expect(data.supplier).toBeNull();
	});

	it('sin proveedor: monto presente exige base y viceversa', async () => {
		const response = await readErrorData(
			createStockReceipt(SUBSIDIARY_A, BRANCH_ID, {
				...manualPayload,
				items: [{ product_id: MOUSE_PRODUCT_ID, quantity: 3, unit_cost: '5000.00' }],
			}),
		);
		expect(response.status).toBe(422);
		expect(response.data.code).toBe('UNIT_COST_BASIS_REQUIRED');
	});

	it('con proveedor conocido y costo completo, declara la base tal como se ingresó', async () => {
		const { data } = await createStockReceipt(SUBSIDIARY_A, BRANCH_ID, {
			...manualPayload,
			supplier_id: PC_EXPRESS_SUPPLIER_ID,
			items: [
				{
					product_id: MOUSE_PRODUCT_ID,
					quantity: 3,
					unit_cost: '5000.00',
					unit_cost_basis: 'net',
				},
			],
		});
		expect(data.items[0].cost.source).toBe('declared');
		expect(data.items[0].cost.effective_basis).toBe('net');
	});
});

describe('ETag / If-Match', () => {
	it('PATCH sin If-Match responde 428', async () => {
		const response = await readErrorData(
			updateStockReceipt(SUBSIDIARY_A, DRAFT_MANUAL_ID, { notes: 'x' }),
		);
		expect(response.status).toBe(428);
	});

	it('PATCH con ETag obsoleto responde 412 RESOURCE_VERSION_CONFLICT', async () => {
		const response = await readErrorData(
			updateStockReceipt(
				SUBSIDIARY_A,
				DRAFT_MANUAL_ID,
				{ notes: 'x' },
				{ etag: 'W/"sr-70-v0"' },
			),
		);
		expect(response.status).toBe(412);
		expect(response.data.code).toBe('RESOURCE_VERSION_CONFLICT');
	});
});

describe('Idempotencia', () => {
	it('reintentar con la misma clave y el mismo payload devuelve el mismo resultado, sin duplicar', async () => {
		const headers = { idempotencyKey: 'idem-create-1' };
		const first = await createStockReceipt(SUBSIDIARY_A, BRANCH_ID, manualPayload, headers);
		const second = await createStockReceipt(SUBSIDIARY_A, BRANCH_ID, manualPayload, headers);
		expect(second.data.id).toBe(first.data.id);

		const list = await listStockReceipts(SUBSIDIARY_A, { per_page: 100 });
		expect(list.data.filter((row) => row.id === first.data.id)).toHaveLength(1);
	});

	it('misma clave con payload distinto responde 409 IDEMPOTENCY_KEY_REUSED', async () => {
		const headers = { idempotencyKey: 'idem-create-2' };
		await createStockReceipt(SUBSIDIARY_A, BRANCH_ID, manualPayload, headers);
		const response = await readErrorData(
			createStockReceipt(
				SUBSIDIARY_A,
				BRANCH_ID,
				{ ...manualPayload, notes: 'otro payload' },
				headers,
			),
		);
		expect(response.status).toBe(409);
		expect(response.data.code).toBe('IDEMPOTENCY_KEY_REUSED');
	});
});

describe('Ciclo de estados: draft → queued → posted', () => {
	it('post responde de inmediato con queued, sin acciones, y el worker publica después', async () => {
		const created = await createStockReceipt(SUBSIDIARY_A, BRANCH_ID, manualPayload);
		const posted202 = await postStockReceipt(SUBSIDIARY_A, created.data.id, ACTOR);
		expect(posted202.data.status).toBe('queued');
		expect(posted202.data.allowed_actions).toEqual([]);

		// Mientras está queued, la pantalla nunca afirma que hay stock: no hay
		// `posted_at` ni `inventory_operation_id` todavía.
		expect(posted202.data.posted_at).toBeNull();

		await waitForWorker();

		const { data: resolved } = await getStockReceipt(SUBSIDIARY_A, created.data.id);
		expect(resolved.status).toBe('posted');
		expect(resolved.posted_at).not.toBeNull();
		expect(resolved.inventory_operation_id).not.toBeNull();
		expect(resolved.posted_by).toEqual(ACTOR);
		expect(resolved.allowed_actions).toEqual(['reverse']);
	});

	it('una recepción en queued no admite update ni post/retry manual', async () => {
		const created = await createStockReceipt(SUBSIDIARY_A, BRANCH_ID, manualPayload);
		await postStockReceipt(SUBSIDIARY_A, created.data.id, ACTOR);

		const { data: queued, headers } = await getStockReceipt(SUBSIDIARY_A, created.data.id);
		expect(queued.status).toBe('queued');

		const updateResponse = await readErrorData(
			updateStockReceipt(
				SUBSIDIARY_A,
				created.data.id,
				{ notes: 'x' },
				{ etag: headers.etag },
			),
		);
		expect(updateResponse.status).toBe(409);

		const doublePost = await readErrorData(
			postStockReceipt(SUBSIDIARY_A, created.data.id, ACTOR),
		);
		expect(doublePost.status).toBe(409);
		expect(doublePost.data.code).toBe('RECEIPT_ALREADY_POSTED');

		await waitForWorker();
	});

	it('publicar con documento vinculado refleja la cobertura en la línea del documento', async () => {
		const created = await createStockReceipt(SUBSIDIARY_A, BRANCH_ID, {
			purchase_document_id: KEYBOARD_DOCUMENT_ID,
			warehouse_id: MAIN_WAREHOUSE_ID,
			received_on: '2026-09-08',
			notes: null,
			items: [{ purchase_document_line_id: KEYBOARD_DOCUMENT_LINE_ID, quantity: 4 }],
		});
		await postStockReceipt(SUBSIDIARY_A, created.data.id, ACTOR);
		await waitForWorker();

		const document = findPurchaseDocumentForReceipts(SUBSIDIARY_A, KEYBOARD_DOCUMENT_ID)!;
		const line = document.items.find((item) => item.id === KEYBOARD_DOCUMENT_LINE_ID)!;
		// 8 ya recibidos por el fixture posted (id 80) + 4 de esta recepción.
		expect(line.received_quantity).toBe(12);
		expect(line.remaining_quantity).toBe(8);
		expect(document.reception_status).toBe('partially_received');
	});
});

describe('Ciclo de estados: draft → queued → failed → draft', () => {
	it('el worker falla, expone failure_message, y corregir vuelve a draft conservando processing', async () => {
		const created = await createStockReceipt(SUBSIDIARY_A, BRANCH_ID, manualPayload);
		setStockReceiptForcedOutcomeForTests(SUBSIDIARY_A, created.data.id, 'failed');

		await postStockReceipt(SUBSIDIARY_A, created.data.id, ACTOR);
		await waitForWorker();

		const { data: failed, headers } = await getStockReceipt(SUBSIDIARY_A, created.data.id);
		expect(failed.status).toBe('failed');
		expect(failed.failure_message).toMatch(/no pudimos/i);
		expect(failed.allowed_actions).toEqual(['update', 'retry', 'cancel']);
		expect(failed.processing.attempt_count).toBe(1);

		const { data: corrected } = await updateStockReceipt(
			SUBSIDIARY_A,
			created.data.id,
			{ notes: 'corregido' },
			{ etag: headers.etag },
		);
		expect(corrected.status).toBe('draft');
		expect(corrected.failure_message).toBeNull();
		expect(corrected.processing.attempt_count).toBe(1); // historia conservada

		setStockReceiptForcedOutcomeForTests(SUBSIDIARY_A, created.data.id, null);
	});

	it('reintentar directo conserva el estado failed → queued sin pasar por draft', async () => {
		// id 73 = failedStockReceipt del seed.
		const { data: retried } = await retryStockReceipt(SUBSIDIARY_A, FAILED_ID, ACTOR);
		expect(retried.status).toBe('queued');
		expect(retried.failure_message).toBeNull();

		await waitForWorker();
		const { data: resolved } = await getStockReceipt(SUBSIDIARY_A, FAILED_ID);
		expect(resolved.status).toBe('posted'); // outcome por defecto
	});

	it('retry sólo se permite desde failed', async () => {
		const response = await readErrorData(
			retryStockReceipt(SUBSIDIARY_A, DRAFT_MANUAL_ID, ACTOR),
		);
		expect(response.status).toBe(409);
		expect(response.data.code).toBe('STOCK_RECEIPT_NOT_FAILED');
	});
});

describe('cancel', () => {
	it('cancela desde draft y desde failed con motivo obligatorio', async () => {
		const fromDraft = await cancelStockReceipt(SUBSIDIARY_A, DRAFT_UNKNOWN_COST_ID, {
			reason: 'Duplicado',
		});
		expect(fromDraft.data.status).toBe('cancelled');
		expect(fromDraft.data.allowed_actions).toEqual([]);

		const fromFailed = await cancelStockReceipt(SUBSIDIARY_A, FAILED_ID, {
			reason: 'Ya no aplica',
		});
		expect(fromFailed.data.status).toBe('cancelled');
	});

	it('exige motivo', async () => {
		const response = await readErrorData(
			cancelStockReceipt(SUBSIDIARY_A, DRAFT_MANUAL_ID, { reason: '' }),
		);
		expect(response.status).toBe(422);
	});

	it('no se puede anular una recepción posted', async () => {
		const response = await readErrorData(
			cancelStockReceipt(SUBSIDIARY_A, POSTED_CONSUMED_ID, { reason: 'x' }),
		);
		expect(response.status).toBe(409);
		expect(response.data.code).toBe('STOCK_RECEIPT_NOT_CANCELLABLE');
	});
});

describe('reverse', () => {
	it('sólo se permite desde posted (409 RECEIPT_NOT_POSTED)', async () => {
		const response = await readErrorData(
			reverseStockReceipt(SUBSIDIARY_A, DRAFT_MANUAL_ID, { reason: 'x' }),
		);
		expect(response.status).toBe(409);
		expect(response.data.code).toBe('RECEIPT_NOT_POSTED');
	});

	it('409 RECEIPT_ALREADY_CONSUMED cuando las unidades ya se consumieron', async () => {
		const response = await readErrorData(
			reverseStockReceipt(SUBSIDIARY_A, POSTED_CONSUMED_ID, { reason: 'Producto dañado' }),
		);
		expect(response.status).toBe(409);
		expect(response.data.code).toBe('RECEIPT_ALREADY_CONSUMED');
	});

	it('revertir una recepción con documento libera la cobertura', async () => {
		const created = await createStockReceipt(SUBSIDIARY_A, BRANCH_ID, {
			purchase_document_id: KEYBOARD_DOCUMENT_ID,
			warehouse_id: MAIN_WAREHOUSE_ID,
			received_on: '2026-09-08',
			notes: null,
			items: [{ purchase_document_line_id: KEYBOARD_DOCUMENT_LINE_ID, quantity: 4 }],
		});
		await postStockReceipt(SUBSIDIARY_A, created.data.id, ACTOR);
		await waitForWorker();

		const { data: reversed } = await reverseStockReceipt(SUBSIDIARY_A, created.data.id, {
			reason: 'Error de bodega',
		});
		expect(reversed.status).toBe('reversed');
		expect(reversed.reversal_operation_id).not.toBeNull();

		const document = findPurchaseDocumentForReceipts(SUBSIDIARY_A, KEYBOARD_DOCUMENT_ID)!;
		const line = document.items.find((item) => item.id === KEYBOARD_DOCUMENT_LINE_ID)!;
		// Vuelve a los 8 originales del fixture posted (id 80): la reversión
		// libera exactamente lo que esta recepción había aportado.
		expect(line.received_quantity).toBe(8);
		expect(line.remaining_quantity).toBe(12);
	});
});

describe('Recarga con una recepción en queued (sección 7)', () => {
	it('la recepción sembrada en queued sobrevive y el worker sembrado la resuelve', async () => {
		const { data: initial } = await getStockReceipt(SUBSIDIARY_A, QUEUED_ID);
		expect(initial.status).toBe('queued');

		await waitForWorker();

		const { data: resolved } = await getStockReceipt(SUBSIDIARY_A, QUEUED_ID);
		expect(['posted', 'failed']).toContain(resolved.status);
	});
});

describe('allowed_actions por estado', () => {
	it('coincide con la tabla de la sección 7 para cada estado semilla', async () => {
		const draft = await getStockReceipt(SUBSIDIARY_A, DRAFT_MANUAL_ID);
		expect(draft.data.allowed_actions.sort()).toEqual(['cancel', 'post', 'update'].sort());

		const failed = await getStockReceipt(SUBSIDIARY_A, FAILED_ID);
		expect(failed.data.allowed_actions.sort()).toEqual(['cancel', 'retry', 'update'].sort());

		const cancelled = await getStockReceipt(SUBSIDIARY_A, CANCELLED_ID);
		expect(cancelled.data.allowed_actions).toEqual([]);

		const reversed = await getStockReceipt(SUBSIDIARY_A, REVERSED_ID);
		expect(reversed.data.allowed_actions).toEqual([]);

		const posted = await getStockReceipt(SUBSIDIARY_A, POSTED_CONSUMED_ID);
		expect(posted.data.allowed_actions).toEqual(['reverse']);
	});
});
