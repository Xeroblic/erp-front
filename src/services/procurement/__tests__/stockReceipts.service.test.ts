import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IStockReceipt } from '@/interface/procurement.interface';

/**
 * La fachada no simula nada: elige el doble o la API real según la bandera.
 * La simulación se prueba en `@/mocks/services/__tests__/stockReceipts.mock.test.ts`.
 * Las rutas y cabeceras de la rama real son las del backend (tareas 11 y 12).
 */

const fetchData = vi.hoisted(() => vi.fn());
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));

const listProcurementSuppliers = vi.hoisted(() => vi.fn());
vi.mock('@/services/procurement/procurementSuppliers.service', () => ({
	listProcurementSuppliers,
}));

const loadFacade = async (useMocks: boolean) => {
	vi.resetModules();
	vi.doMock('@/config/inventoryReceipts.config', () => ({ default: useMocks }));
	const facade = await import('@/services/procurement/stockReceipts.service');
	// Tras resetModules, la clase del error es la del registro nuevo, no la de arriba.
	const { ProcurementEndpointNotPublishedError } = await import(
		'@/utils/procurementEndpoint.util'
	);
	return { ...facade, ProcurementEndpointNotPublishedError };
};

const BASE = '/subsidiaries/1/procurement/stock-receipts';
const RECEIPT = { id: 80, status: 'draft' } as IStockReceipt;
const ACTOR = { id: 7, name: 'Ana Soto' };

const respondWithReceipt = (receipt: IStockReceipt = RECEIPT, etag = 'W/"sr-80-v2"') =>
	fetchData.mockResolvedValue({ data: { data: receipt }, headers: { etag } });

const lastRequest = () => fetchData.mock.calls.at(-1)?.[0] as Record<string, unknown>;

afterEach(() => {
	vi.doUnmock('@/config/inventoryReceipts.config');
	fetchData.mockReset();
	listProcurementSuppliers.mockReset();
});

describe('stockReceipts.service — con datos simulados', () => {
	it('delega en el doble y no toca la API', async () => {
		const facade = await loadFacade(true);
		const mock = await import('@/mocks/services/stockReceipts.mock');

		expect(facade.listStockReceipts).toBe(mock.listStockReceipts);
		expect(facade.getStockReceipt).toBe(mock.getStockReceipt);
		expect(facade.createStockReceipt).toBe(mock.createStockReceipt);
		expect(facade.postStockReceipt).toBe(mock.postStockReceipt);
		expect(facade.reverseStockReceipt).toBe(mock.reverseStockReceipt);
		expect(facade.listWarehousesForStockReceipts).toBe(mock.listWarehousesForStockReceipts);
		expect(facade.listStockReceiptSuppliers).toBe(mock.listStockReceiptSuppliers);
		expect(facade.searchStockReceiptProducts).toBe(mock.searchStockReceiptProducts);
		expect(facade.STOCK_RECEIPTS_USE_TEST_SUPPLIERS).toBe(true);
	});
});

describe('stockReceipts.service — API real', () => {
	it('lista con los filtros como query y devuelve el envoltorio paginado', async () => {
		const facade = await loadFacade(false);
		const envelope = { data: [], links: {}, meta: { total: 0 } };
		fetchData.mockResolvedValue({ data: envelope });

		const result = await facade.listStockReceipts(1, { status: 'failed', page: 2 });

		expect(lastRequest()).toMatchObject({
			url: BASE,
			method: 'get',
			params: { status: 'failed', page: 2 },
		});
		expect(result).toBe(envelope);
	});

	it('las recepciones de un documento son el listado filtrado por purchase_document_id', async () => {
		const facade = await loadFacade(false);
		fetchData.mockResolvedValue({ data: { data: [], links: {}, meta: {} } });

		await facade.listStockReceiptsForPurchaseDocument(1, 24, { per_page: 5 });

		expect(lastRequest()).toMatchObject({
			url: BASE,
			params: { per_page: 5, purchase_document_id: 24 },
		});
	});

	it('el detalle devuelve la ficha y el ETag de la respuesta', async () => {
		const facade = await loadFacade(false);
		respondWithReceipt();

		const result = await facade.getStockReceipt(1, 80);

		expect(lastRequest()).toMatchObject({ url: `${BASE}/80`, method: 'get' });
		expect(result).toEqual({ data: RECEIPT, headers: { etag: 'W/"sr-80-v2"' } });
	});

	it('el alta envía la clave de idempotencia, sin If-Match', async () => {
		const facade = await loadFacade(false);
		respondWithReceipt();
		const payload = {
			purchase_document_id: null,
			supplier_id: null,
			warehouse_id: 8,
			received_on: '2026-10-10',
			reason: 'Ingreso inicial',
			notes: null,
			items: [{ product_id: 31, quantity: 3 }],
		};

		await facade.createStockReceipt(1, payload, { idempotencyKey: 'k-1' }, [4]);

		expect(lastRequest()).toEqual(
			expect.objectContaining({
				url: BASE,
				method: 'post',
				data: payload,
				headers: { 'Idempotency-Key': 'k-1' },
			}),
		);
	});

	it('la corrección exige el ETag: sin él rechaza con 428 sin llamar a la API', async () => {
		const facade = await loadFacade(false);

		const error = await facade
			.updateStockReceipt(1, 80, { notes: 'x' }, { idempotencyKey: 'k-2', etag: null })
			.catch((reason: unknown) => reason);

		expect(error).toMatchObject({ response: { status: 428 } });
		expect(fetchData).not.toHaveBeenCalled();
	});

	it('la corrección envía If-Match con el ETag vigente', async () => {
		const facade = await loadFacade(false);
		respondWithReceipt();

		await facade.updateStockReceipt(
			1,
			80,
			{ notes: 'x' },
			{ idempotencyKey: 'k-3', etag: 'W/"sr-80-v1"' },
		);

		expect(lastRequest()).toMatchObject({
			url: `${BASE}/80`,
			method: 'patch',
			headers: { 'Idempotency-Key': 'k-3', 'If-Match': 'W/"sr-80-v1"' },
		});
	});

	it.each([
		['postStockReceipt', 'post'],
		['retryStockReceipt', 'retry'],
	] as const)(
		'%s pide el ingreso sin cuerpo: el solicitante sale del token',
		async (fn, action) => {
			const facade = await loadFacade(false);
			respondWithReceipt({ ...RECEIPT, status: 'queued' });

			const result = await facade[fn](1, 80, ACTOR, { idempotencyKey: 'k-4' });

			expect(lastRequest()).toMatchObject({
				url: `${BASE}/80/${action}`,
				method: 'post',
				data: undefined,
				headers: { 'Idempotency-Key': 'k-4' },
			});
			expect(result.data.status).toBe('queued');
		},
	);

	it.each([
		['cancelStockReceipt', 'cancel'],
		['reverseStockReceipt', 'reverse'],
	] as const)('%s envía el motivo', async (fn, action) => {
		const facade = await loadFacade(false);
		respondWithReceipt();

		await facade[fn](1, 80, { reason: 'Error de digitación' }, { idempotencyKey: 'k-5' });

		expect(lastRequest()).toMatchObject({
			url: `${BASE}/80/${action}`,
			method: 'post',
			data: { reason: 'Error de digitación' },
			headers: { 'Idempotency-Key': 'k-5' },
		});
	});

	it('vincular un documento hace PUT con la clave y sin If-Match, y devuelve la ficha con su ETag', async () => {
		const facade = await loadFacade(false);
		const linked = {
			...RECEIPT,
			status: 'posted',
			allowed_actions: ['reverse'],
		} as IStockReceipt;
		respondWithReceipt(linked, 'W/"sr-80-v4"');
		const payload = {
			purchase_document_id: 24,
			reason: 'Factura recibida después de la entrega',
			items: [{ stock_receipt_line_id: 301, purchase_document_line_id: 101 }],
		};

		const result = await facade.linkStockReceiptPurchaseDocument(1, 80, payload, {
			idempotencyKey: 'k-link',
			etag: 'W/"sr-80-v3"',
		});

		expect(fetchData).toHaveBeenCalledTimes(1);
		expect(lastRequest()).toEqual({
			url: `${BASE}/80/purchase-document`,
			method: 'put',
			data: payload,
			headers: { 'Idempotency-Key': 'k-link' },
		});
		expect(result).toEqual({ data: linked, headers: { etag: 'W/"sr-80-v4"' } });
	});

	it('las bodegas salen de cada sucursal, sólo activas y con su sucursal', async () => {
		const facade = await loadFacade(false);
		fetchData.mockImplementation(({ url }: { url: string }) =>
			Promise.resolve({
				data: {
					data:
						url === '/branches/4/warehouses'
							? [
									{ id: 8, name: 'Central', is_active: true },
									{ id: 9, name: 'Cerrada', is_active: false },
								]
							: [{ id: 15, name: 'Sur', is_active: true }],
					meta: { last_page: 1 },
				},
			}),
		);

		const warehouses = await facade.listWarehousesForStockReceipts([4, 6]);

		expect(fetchData.mock.calls.map(([request]) => (request as { url: string }).url)).toEqual([
			'/branches/4/warehouses',
			'/branches/6/warehouses',
		]);
		expect(warehouses).toEqual([
			{ id: 8, name: 'Central', is_active: true, branch_id: 4 },
			{ id: 15, name: 'Sur', is_active: true, branch_id: 6 },
		]);
	});

	it('una sucursal que responde 403 no esconde las bodegas de las demás', async () => {
		const facade = await loadFacade(false);
		fetchData.mockImplementation(({ url }: { url: string }) =>
			url === '/branches/6/warehouses'
				? Promise.reject(
						Object.assign(new Error('Forbidden'), {
							isAxiosError: true,
							response: { status: 403, data: {} },
						}),
					)
				: Promise.resolve({
						data: { data: [{ id: 8, name: 'Central', is_active: true }], meta: {} },
					}),
		);

		const warehouses = await facade.listWarehousesForStockReceipts([4, 6]);

		expect(warehouses).toEqual([{ id: 8, name: 'Central', is_active: true, branch_id: 4 }]);
	});

	it('cualquier otro fallo de una sucursal se informa', async () => {
		const facade = await loadFacade(false);
		const failure = Object.assign(new Error('Server error'), {
			isAxiosError: true,
			response: { status: 500, data: {} },
		});
		fetchData.mockImplementation(({ url }: { url: string }) =>
			url === '/branches/6/warehouses'
				? Promise.reject(failure)
				: Promise.resolve({ data: { data: [], meta: {} } }),
		);

		await expect(facade.listWarehousesForStockReceipts([4, 6])).rejects.toBe(failure);
	});

	it('busca productos en el catálogo que usa Documentos de compra: activos y sin serie', async () => {
		const facade = await loadFacade(false);
		fetchData.mockResolvedValue({
			data: {
				data: [
					{ id: 31, sku: 'NB-1', name: 'Notebook', brand: { name: 'Lenovo' } },
					{ id: 'x' },
				],
				meta: { total: 1 },
			},
		});

		const page = await facade.searchStockReceiptProducts(1, ' note ');

		expect(lastRequest()).toMatchObject({
			url: '/subsidiaries/1/products',
			method: 'get',
			params: { q: 'note', serial_tracking: false, is_active: true },
		});
		expect(page).toEqual({
			data: [{ id: 31, sku: 'NB-1', name: 'Notebook', brand_name: 'Lenovo' }],
			has_more: false,
		});
	});

	it('el selector de proveedores usa el maestro real', async () => {
		const facade = await loadFacade(false);
		const envelope = { data: [], links: {}, meta: {} };
		listProcurementSuppliers.mockResolvedValue(envelope);

		const result = await facade.listStockReceiptSuppliers(1, { per_page: 100 });

		expect(listProcurementSuppliers).toHaveBeenCalledWith(1, { per_page: 100 });
		expect(result).toBe(envelope);
		expect(facade.STOCK_RECEIPTS_USE_TEST_SUPPLIERS).toBe(false);
	});
});
