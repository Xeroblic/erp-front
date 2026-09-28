import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createProcurementSupplier,
	deactivateProcurementSupplier,
	getProcurementSupplier,
	listProcurementSuppliers,
	restoreProcurementSupplier,
	updateProcurementSupplier,
} from '@/services/procurement/procurementSuppliers.service';
import type { IProcurementSupplierPayload } from '@/interface/procurement.interface';

/**
 * Cableado HTTP del maestro de proveedores contra el contrato del backend
 * (`routes/apis/procurement.php`, PR #93): URL por filial, método, params y
 * la `Idempotency-Key` que el middleware `idempotent` exige en cada escritura.
 * Las reglas de negocio las prueba el backend; el doble en memoria las cubre
 * en `procurementSuppliers.mock.test.ts`.
 */

const apiSpies = vi.hoisted(() => ({ fetchData: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: apiSpies }));

const BASE = '/subsidiaries/4/procurement/suppliers';
const KEY = '3f2a7c1e-9b4d-4e8a-a1c2-5d6e7f8a9b0c';

const payload: IProcurementSupplierPayload = {
	rut: '76123456-0',
	company_name: 'PCExpress',
	contact_name: null,
	business_activity: null,
	billing_address: null,
	billing_commune_id: null,
	shipping_address: null,
	shipping_commune_id: null,
	phone: null,
	email: null,
};

beforeEach(() => {
	apiSpies.fetchData.mockReset();
	apiSpies.fetchData.mockResolvedValue({ data: { data: { id: 7 } } });
});

describe('lecturas', () => {
	it('lista con los filtros como query params y devuelve el envoltorio paginado', async () => {
		const envelope = { data: [], links: {}, meta: { total: 0 } };
		apiSpies.fetchData.mockResolvedValueOnce({ data: envelope });

		const result = await listProcurementSuppliers(4, {
			search: 'pc',
			include_inactive: 1,
			page: 2,
			per_page: 100,
		});

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: BASE,
			method: 'get',
			params: { search: 'pc', include_inactive: 1, page: 2, per_page: 100 },
		});
		expect(result).toBe(envelope);
	});

	it('pide la ficha por id dentro de la filial', async () => {
		const result = await getProcurementSupplier(4, 7);

		expect(apiSpies.fetchData).toHaveBeenCalledWith({ url: `${BASE}/7`, method: 'get' });
		expect(result).toEqual({ data: { id: 7 } });
	});
});

describe('escrituras: todas viajan con Idempotency-Key', () => {
	it('crear es POST a la colección con el payload', async () => {
		await createProcurementSupplier(4, payload, { idempotencyKey: KEY });

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: BASE,
			method: 'post',
			data: payload,
			headers: { 'Idempotency-Key': KEY },
		});
	});

	it('editar es PATCH a la ficha, sin If-Match (la ruta no lo declara)', async () => {
		await updateProcurementSupplier(4, 7, payload, { idempotencyKey: KEY });

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: `${BASE}/7`,
			method: 'patch',
			data: payload,
			headers: { 'Idempotency-Key': KEY },
		});
	});

	it('desactivar es DELETE y resuelve sin cuerpo (204)', async () => {
		apiSpies.fetchData.mockResolvedValueOnce({ data: '' });

		await expect(
			deactivateProcurementSupplier(4, 7, { idempotencyKey: KEY }),
		).resolves.toBeUndefined();
		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: `${BASE}/7`,
			method: 'delete',
			headers: { 'Idempotency-Key': KEY },
		});
	});

	it('restaurar es POST a /restore y devuelve la ficha', async () => {
		const result = await restoreProcurementSupplier(4, 7, { idempotencyKey: KEY });

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: `${BASE}/7/restore`,
			method: 'post',
			headers: { 'Idempotency-Key': KEY },
		});
		expect(result).toEqual({ data: { id: 7 } });
	});

	it('propaga el error HTTP sin envolverlo, para que el slice lea code y existing_supplier', async () => {
		const conflict = {
			isAxiosError: true,
			response: {
				status: 409,
				data: {
					message: 'Ya existe un proveedor con este RUT en esta filial.',
					code: 'SUPPLIER_RUT_ALREADY_EXISTS',
					existing_supplier: {
						id: 12,
						display_name: 'Importadora Sur',
						is_active: false,
					},
				},
			},
		};
		apiSpies.fetchData.mockRejectedValueOnce(conflict);

		await expect(createProcurementSupplier(4, payload, { idempotencyKey: KEY })).rejects.toBe(
			conflict,
		);
	});
});
