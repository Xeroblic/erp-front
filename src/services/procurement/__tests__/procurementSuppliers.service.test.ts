import { afterEach, describe, expect, it } from 'vitest';
import {
	resetProcurementSuppliersStoreForTests,
	createProcurementSupplier,
	deactivateProcurementSupplier,
	getProcurementSupplier,
	listProcurementSuppliers,
	restoreProcurementSupplier,
	updateProcurementSupplier,
} from '@/services/procurement/procurementSuppliers.service';
import type { IProcurementSupplierPayload } from '@/interface/procurement.interface';

/**
 * El servicio simula `/api/subsidiaries/{subsidiary}/procurement/suppliers`
 * (sección 5 del contrato). Estas pruebas verifican que la simulación respeta
 * las reglas del contrato — filtros excluyentes, obligatorios del formulario,
 * conflicto de RUT con su forma de compatibilidad, idempotencia — no el
 * fixture en sí, que ya cubre `procurement.db.test.ts`.
 */

const validPayload: IProcurementSupplierPayload = {
	rut: '12345678-5',
	company_name: 'Proveedor de prueba',
	contact_name: null,
	business_activity: null,
	billing_address: null,
	billing_commune_id: null,
	shipping_address: null,
	shipping_commune_id: null,
	phone: null,
	email: null,
};

const readErrorData = async (promise: Promise<unknown>) => {
	try {
		await promise;
		throw new Error('Se esperaba que la promesa rechazara');
	} catch (error) {
		return (error as { response: { status: number; data: Record<string, unknown> } }).response;
	}
};

afterEach(() => {
	resetProcurementSuppliersStoreForTests();
});

describe('listProcurementSuppliers', () => {
	it('trae sólo activos por defecto', async () => {
		const result = await listProcurementSuppliers();
		expect(result.data.every((supplier) => supplier.is_active)).toBe(true);
		// PCExpress, Marcelo Contreras, Nueva Corp SpA — Importadora Sur está inactiva.
		expect(result.data).toHaveLength(3);
	});

	it('is_active=0 trae sólo inactivos', async () => {
		const result = await listProcurementSuppliers({ is_active: 0 });
		expect(result.data).toHaveLength(1);
		expect(result.data[0].display_name).toBe('Importadora Sur');
	});

	it('include_inactive=1 trae todos', async () => {
		const result = await listProcurementSuppliers({ include_inactive: 1 });
		expect(result.data).toHaveLength(4);
	});

	it('rechaza combinar is_active con include_inactive', async () => {
		const { status, data } = await readErrorData(
			listProcurementSuppliers({ is_active: 1, include_inactive: 1 }),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('INVALID_FILTER_COMBINATION');
	});

	it('busca por nombre, RUT y giro', async () => {
		const byRut = await listProcurementSuppliers({ search: '76123456' });
		expect(byRut.data.map((s) => s.id)).toEqual([7]);

		const byActivity = await listProcurementSuppliers({ search: 'insumos informáticos' });
		expect(byActivity.data.map((s) => s.id)).toEqual([7]);
	});

	it('la fila resumida no trae purchase_summary', async () => {
		const result = await listProcurementSuppliers();
		expect(result.data[0]).not.toHaveProperty('purchase_summary');
	});
});

describe('createProcurementSupplier', () => {
	it('crea con RUT normalizado y allowed_actions de proveedor activo', async () => {
		const { data } = await createProcurementSupplier(validPayload);
		expect(data.rut).toBe('12345678-5');
		expect(data.is_active).toBe(true);
		expect(data.allowed_actions).toEqual(['update', 'deactivate']);
		expect(data.purchase_summary).toEqual({
			last_purchase_on: null,
			received_units: 0,
			products_supplied_count: 0,
			receipt_count: 0,
		});
	});

	it('calcula display_name desde company_name, y desde contact_name si no hay razón social', async () => {
		const withCompany = await createProcurementSupplier(validPayload);
		expect(withCompany.data.display_name).toBe('Proveedor de prueba');

		const withContactOnly = await createProcurementSupplier({
			...validPayload,
			rut: '11222333-9',
			company_name: null,
			contact_name: 'Persona Natural',
		});
		expect(withContactOnly.data.display_name).toBe('Persona Natural');
	});

	it('rechaza un RUT inválido con INVALID_CHILEAN_RUT', async () => {
		const { status, data } = await readErrorData(
			createProcurementSupplier({ ...validPayload, rut: '11111111-2' }),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('INVALID_CHILEAN_RUT');
	});

	it('exige company_name o contact_name', async () => {
		const { status, data } = await readErrorData(
			createProcurementSupplier({ ...validPayload, company_name: null, contact_name: '  ' }),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('SUPPLIER_NAME_REQUIRED');
	});

	it('409 con existing_supplier fuera del envoltorio común ante un RUT ya usado por un activo', async () => {
		const { status, data } = await readErrorData(
			createProcurementSupplier({ ...validPayload, rut: '76123456-0' }),
		);
		expect(status).toBe(409);
		expect(data.code).toBe('SUPPLIER_RUT_ALREADY_EXISTS');
		expect(data.existing_supplier).toEqual({
			id: 7,
			display_name: 'PCExpress',
			is_active: true,
		});
		// La excepción de compatibilidad: no va dentro de `data`.
		expect(data).not.toHaveProperty('data');
	});

	it('409 con existing_supplier.is_active false ante un RUT de un proveedor eliminado', async () => {
		const { data } = await readErrorData(
			createProcurementSupplier({ ...validPayload, rut: '77888999-4' }),
		);
		expect(data.existing_supplier).toEqual({
			id: 12,
			display_name: 'Importadora Sur',
			is_active: false,
		});
	});

	it('no crea nada cuando el RUT está en conflicto', async () => {
		await readErrorData(
			createProcurementSupplier({ ...validPayload, rut: '76123456-0' }),
		).catch(() => undefined);
		const all = await listProcurementSuppliers({ include_inactive: 1 });
		expect(all.meta.total).toBe(4);
	});
});

describe('updateProcurementSupplier', () => {
	it('actualiza los campos editables y recalcula display_name', async () => {
		const { data } = await updateProcurementSupplier(7, {
			...validPayload,
			rut: '76123456-0',
			company_name: 'PCExpress Renovado',
		});
		expect(data.display_name).toBe('PCExpress Renovado');
		expect(data.is_active).toBe(true);
	});

	it('409 si el RUT editado ya pertenece a otro proveedor', async () => {
		const { status, data } = await readErrorData(
			updateProcurementSupplier(15, { ...validPayload, rut: '76123456-0' }),
		);
		expect(status).toBe(409);
		expect(data.code).toBe('SUPPLIER_RUT_ALREADY_EXISTS');
	});

	it('permite conservar el mismo RUT del propio proveedor', async () => {
		const { data } = await updateProcurementSupplier(7, { ...validPayload, rut: '76123456-0' });
		expect(data.id).toBe(7);
	});
});

describe('desactivar y restaurar', () => {
	it('desactivar dispara allowed_actions=["restore"] y lo saca del listado activo', async () => {
		const { data } = await deactivateProcurementSupplier(7);
		expect(data.is_active).toBe(false);
		expect(data.allowed_actions).toEqual(['restore']);

		const activeList = await listProcurementSuppliers();
		expect(activeList.data.find((s) => s.id === 7)).toBeUndefined();
	});

	it('restaurar nunca ocurre solo: hace falta llamarlo explícitamente', async () => {
		await deactivateProcurementSupplier(7);
		const beforeRestore = await getProcurementSupplier(7);
		expect(beforeRestore.data.is_active).toBe(false);

		const { data } = await restoreProcurementSupplier(7);
		expect(data.is_active).toBe(true);
		expect(data.allowed_actions).toEqual(['update', 'deactivate']);
	});

	it('desactivar dos veces es 409, no una operación silenciosa', async () => {
		await deactivateProcurementSupplier(7);
		const { status, data } = await readErrorData(deactivateProcurementSupplier(7));
		expect(status).toBe(409);
		expect(data.code).toBe('PROCUREMENT_SUPPLIER_ALREADY_INACTIVE');
	});
});

describe('Idempotency-Key', () => {
	it('misma clave y mismo payload devuelve el mismo resultado sin duplicar', async () => {
		const first = await createProcurementSupplier(validPayload, { idempotencyKey: 'key-1' });
		const second = await createProcurementSupplier(validPayload, { idempotencyKey: 'key-1' });
		expect(second.data.id).toBe(first.data.id);

		const all = await listProcurementSuppliers({ include_inactive: 1 });
		expect(all.meta.total).toBe(5); // 4 de la semilla + 1, no 2.
	});

	it('misma clave con otro payload es 409 IDEMPOTENCY_KEY_REUSED', async () => {
		await createProcurementSupplier(validPayload, { idempotencyKey: 'key-2' });
		const { status, data } = await readErrorData(
			createProcurementSupplier(
				{ ...validPayload, rut: '11222333-9' },
				{ idempotencyKey: 'key-2' },
			),
		);
		expect(status).toBe(409);
		expect(data.code).toBe('IDEMPOTENCY_KEY_REUSED');
	});
});
