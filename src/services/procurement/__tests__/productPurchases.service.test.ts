import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	listProductPurchaseHistory,
	listProductSuppliers,
} from '@/services/procurement/productPurchases.service';

/**
 * Cableado HTTP de las compras por producto contra el contrato del backend
 * (§12, `ProductPurchaseController`): URL por filial y producto, `GET`,
 * paginación y filtros del historial. La sugerencia y el orden los decide el
 * backend y no se prueban aquí.
 */

const apiSpies = vi.hoisted(() => ({ fetchData: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: apiSpies }));

const BASE = '/subsidiaries/2/procurement/products/31';
const envelope = { data: [], links: {}, meta: { total: 0 } };

beforeEach(() => {
	apiSpies.fetchData.mockReset();
	apiSpies.fetchData.mockResolvedValue({ data: envelope });
});

describe('listProductSuppliers', () => {
	it('pide los proveedores del producto con la paginación y devuelve el envoltorio', async () => {
		const controller = new AbortController();

		const result = await listProductSuppliers(
			2,
			31,
			{ page: 1, per_page: 100 },
			controller.signal,
		);

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: `${BASE}/suppliers`,
			method: 'get',
			params: { page: 1, per_page: 100 },
			signal: controller.signal,
		});
		expect(result).toBe(envelope);
	});
});

describe('listProductPurchaseHistory', () => {
	it('manda los filtros del contrato y la paginación', async () => {
		await listProductPurchaseHistory(2, 31, {
			supplier_id: 7,
			purchase_document_id: 24,
			received_from: '2026-09-01',
			received_to: '2026-09-30',
			page: 2,
			per_page: 15,
		});

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: `${BASE}/purchase-history`,
			method: 'get',
			params: {
				supplier_id: 7,
				purchase_document_id: 24,
				received_from: '2026-09-01',
				received_to: '2026-09-30',
				page: 2,
				per_page: 15,
			},
			signal: undefined,
		});
	});

	it('no manda los filtros vacíos', async () => {
		await listProductPurchaseHistory(2, 31, {
			supplier_id: undefined,
			received_from: undefined,
			received_to: '',
			page: 1,
			per_page: 15,
		});

		expect(apiSpies.fetchData).toHaveBeenCalledWith(
			expect.objectContaining({ params: { page: 1, per_page: 15 } }),
		);
	});

	it('propaga el error de la API (404 de un producto de otra filial)', async () => {
		const notFound = { response: { status: 404, data: { message: 'Not Found' } } };
		apiSpies.fetchData.mockRejectedValueOnce(notFound);

		await expect(listProductPurchaseHistory(2, 31)).rejects.toBe(notFound);
	});
});
