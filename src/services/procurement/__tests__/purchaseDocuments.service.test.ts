import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	cancelPurchaseDocument,
	confirmPurchaseDocument,
	createPurchaseDocument,
	getPurchaseDocument,
	listPurchaseDocuments,
	MISSING_ETAG_MESSAGE,
	updatePurchaseDocument,
} from '@/services/procurement/purchaseDocuments.service';
import { resolveProcurementError } from '@/utils/procurementErrors.util';
import type { IPurchaseDocumentCreatePayload } from '@/interface/procurement.interface';

/**
 * Cableado HTTP de documentos de compra contra el contrato del backend
 * (`routes/apis/procurement.php`, PR #84/#92): URL por filial, método,
 * `Idempotency-Key` en cada escritura, `If-Match` sólo en el PATCH y el
 * `ETag` de la respuesta. Las reglas de negocio las prueba el backend; el
 * doble en memoria las cubre en `purchaseDocuments.mock.test.ts`.
 */

const apiSpies = vi.hoisted(() => ({ fetchData: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: apiSpies }));

const BASE = '/subsidiaries/4/procurement/purchase-documents';
const KEY = '3f2a7c1e-9b4d-4e8a-a1c2-5d6e7f8a9b0c';
const ETAG = '"purchase_documents-9-v3"';

const payload: IPurchaseDocumentCreatePayload = {
	document_type: 'invoice',
	supplier_id: 7,
	document_number: 'F-100',
	issue_date: '2026-09-25',
	currency_code: 'CLP',
	total_amount: null,
	shipping_cost: null,
	shipping_cost_basis: null,
	notes: null,
	items: [
		{ product_id: 11, quantity: 2, unit_cost: '1000.00', unit_cost_basis: 'net', notes: null },
	],
};

beforeEach(() => {
	apiSpies.fetchData.mockReset();
	apiSpies.fetchData.mockResolvedValue({ data: { data: { id: 9 } }, headers: { etag: ETAG } });
});

describe('lecturas', () => {
	it('lista con los filtros como query params y devuelve el envoltorio paginado', async () => {
		const envelope = { data: [], links: {}, meta: { total: 0 } };
		apiSpies.fetchData.mockResolvedValueOnce({ data: envelope, headers: {} });

		const result = await listPurchaseDocuments(4, { status: 'confirmed', per_page: 100 });

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: BASE,
			method: 'get',
			params: { status: 'confirmed', per_page: 100 },
		});
		expect(result).toBe(envelope);
	});

	it('desempaqueta la ficha y conserva el ETag de la respuesta', async () => {
		const result = await getPurchaseDocument(4, 9);

		expect(apiSpies.fetchData).toHaveBeenCalledWith({ url: `${BASE}/9`, method: 'get' });
		expect(result).toEqual({ data: { id: 9 }, headers: { etag: ETAG } });
	});

	it('sin ETag legible (CORS) informa null en vez de inventar uno', async () => {
		apiSpies.fetchData.mockResolvedValueOnce({ data: { data: { id: 9 } }, headers: {} });

		const result = await getPurchaseDocument(4, 9);

		expect(result.headers.etag).toBeNull();
	});
});

describe('escrituras', () => {
	it('crear es POST con el payload y la Idempotency-Key, sin If-Match', async () => {
		await createPurchaseDocument(4, payload, { idempotencyKey: KEY });

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: BASE,
			method: 'post',
			data: payload,
			headers: { 'Idempotency-Key': KEY },
		});
	});

	it('editar es PATCH con If-Match del ETag vigente', async () => {
		await updatePurchaseDocument(4, 9, { notes: 'x' }, { idempotencyKey: KEY, etag: ETAG });

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: `${BASE}/9`,
			method: 'patch',
			data: { notes: 'x' },
			headers: { 'Idempotency-Key': KEY, 'If-Match': ETAG },
		});
	});

	it('editar sin ETag no llega al backend y se rechaza como 428', async () => {
		const error = await updatePurchaseDocument(
			4,
			9,
			{ notes: 'x' },
			{ idempotencyKey: KEY, etag: null },
		).catch((reason: unknown) => reason);

		expect(apiSpies.fetchData).not.toHaveBeenCalled();
		const resolved = resolveProcurementError(error);
		expect(resolved.status).toBe(428);
		expect(resolved.message).toBe(MISSING_ETAG_MESSAGE);
		expect(resolved.action).toBe('reload_resource');
	});

	it('confirmar es POST a /confirm sin cuerpo ni If-Match', async () => {
		await confirmPurchaseDocument(4, 9, { idempotencyKey: KEY });

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: `${BASE}/9/confirm`,
			method: 'post',
			headers: { 'Idempotency-Key': KEY },
		});
	});

	it('anular es POST a /cancel con el motivo', async () => {
		const result = await cancelPurchaseDocument(
			4,
			9,
			{ reason: 'Folio duplicado' },
			{ idempotencyKey: KEY },
		);

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: `${BASE}/9/cancel`,
			method: 'post',
			data: { reason: 'Folio duplicado' },
			headers: { 'Idempotency-Key': KEY },
		});
		expect(result.headers.etag).toBe(ETAG);
	});
});
