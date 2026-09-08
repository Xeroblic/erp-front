import { afterEach, describe, expect, it } from 'vitest';
import {
	createProcurementSupplier,
	deactivateProcurementSupplier,
	getProcurementSupplier,
	listProcurementSuppliers,
	resetProcurementSuppliersStoreForTests,
	restoreProcurementSupplier,
	updateProcurementSupplier,
} from '@/services/procurement/procurementSuppliers.service';
import type { IProcurementSupplierPayload } from '@/interface/procurement.interface';

/**
 * El servicio simula `/api/subsidiaries/{subsidiary}/procurement/suppliers`
 * (sección 5 del contrato). Estas pruebas verifican que la simulación respeta
 * las reglas del contrato — filtros excluyentes, obligatorios del formulario,
 * conflicto de RUT con su forma de compatibilidad, idempotencia por filial,
 * aislamiento entre filiales y el 204 sin cuerpo de `deactivate` — no el
 * fixture en sí, que ya cubre `procurement.db.test.ts`.
 */

const SUBSIDIARY_A = 4;
const SUBSIDIARY_B = 9;

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
		const result = await listProcurementSuppliers(SUBSIDIARY_A);
		expect(result.data.every((supplier) => supplier.is_active)).toBe(true);
		// PCExpress, Marcelo Contreras, Nueva Corp SpA — Importadora Sur está inactiva.
		expect(result.data).toHaveLength(3);
	});

	it('is_active=0 trae sólo inactivos', async () => {
		const result = await listProcurementSuppliers(SUBSIDIARY_A, { is_active: 0 });
		expect(result.data).toHaveLength(1);
		expect(result.data[0].display_name).toBe('Importadora Sur');
	});

	it('include_inactive=1 trae todos', async () => {
		const result = await listProcurementSuppliers(SUBSIDIARY_A, { include_inactive: 1 });
		expect(result.data).toHaveLength(4);
	});

	it('rechaza combinar is_active con include_inactive', async () => {
		const { status, data } = await readErrorData(
			listProcurementSuppliers(SUBSIDIARY_A, { is_active: 1, include_inactive: 1 }),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('INVALID_FILTER_COMBINATION');
	});

	it('busca por nombre, RUT y giro', async () => {
		const byRut = await listProcurementSuppliers(SUBSIDIARY_A, { search: '76123456' });
		expect(byRut.data.map((s) => s.id)).toEqual([7]);

		const byActivity = await listProcurementSuppliers(SUBSIDIARY_A, {
			search: 'insumos informáticos',
		});
		expect(byActivity.data.map((s) => s.id)).toEqual([7]);
	});

	it('la fila resumida no trae purchase_summary', async () => {
		const result = await listProcurementSuppliers(SUBSIDIARY_A);
		expect(result.data[0]).not.toHaveProperty('purchase_summary');
	});
});

describe('aislamiento entre filiales', () => {
	it('crear en una filial no aparece en el listado de otra', async () => {
		await createProcurementSupplier(SUBSIDIARY_A, validPayload);

		const inA = await listProcurementSuppliers(SUBSIDIARY_A, { include_inactive: 1 });
		const inB = await listProcurementSuppliers(SUBSIDIARY_B, { include_inactive: 1 });

		expect(inA.data.some((s) => s.rut === '12345678-5')).toBe(true);
		expect(inB.data.some((s) => s.rut === '12345678-5')).toBe(false);
		// La filial B sigue con su propia semilla independiente, sin la nueva alta de A.
		expect(inB.meta.total).toBe(4);
	});

	it('el mismo RUT puede existir en dos filiales sin conflicto', async () => {
		// El mismo RUT ya causaría 409 dentro de una filial (probado arriba);
		// que las dos llamadas resuelvan es la prueba de que no hay conflicto
		// cruzado entre A y B.
		const { data: inA } = await createProcurementSupplier(SUBSIDIARY_A, validPayload);
		const { data: inB } = await createProcurementSupplier(SUBSIDIARY_B, validPayload);

		expect(inA.rut).toBe(inB.rut);
	});

	it('un id creado en la filial A no es visible desde la filial B', async () => {
		const { data: created } = await createProcurementSupplier(SUBSIDIARY_A, validPayload);

		const { status } = await readErrorData(getProcurementSupplier(SUBSIDIARY_B, created.id));
		expect(status).toBe(404);
	});
});

describe('createProcurementSupplier', () => {
	it('crea con RUT normalizado y allowed_actions de proveedor activo', async () => {
		const { data } = await createProcurementSupplier(SUBSIDIARY_A, validPayload);
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
		const withCompany = await createProcurementSupplier(SUBSIDIARY_A, validPayload);
		expect(withCompany.data.display_name).toBe('Proveedor de prueba');

		const withContactOnly = await createProcurementSupplier(SUBSIDIARY_A, {
			...validPayload,
			rut: '11222333-9',
			company_name: null,
			contact_name: 'Persona Natural',
		});
		expect(withContactOnly.data.display_name).toBe('Persona Natural');
	});

	it('rechaza un RUT inválido con INVALID_CHILEAN_RUT', async () => {
		const { status, data } = await readErrorData(
			createProcurementSupplier(SUBSIDIARY_A, { ...validPayload, rut: '11111111-2' }),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('INVALID_CHILEAN_RUT');
	});

	it('exige company_name o contact_name', async () => {
		const { status, data } = await readErrorData(
			createProcurementSupplier(SUBSIDIARY_A, {
				...validPayload,
				company_name: null,
				contact_name: '  ',
			}),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('SUPPLIER_NAME_REQUIRED');
	});

	it('409 con existing_supplier fuera del envoltorio común ante un RUT ya usado por un activo', async () => {
		const { status, data } = await readErrorData(
			createProcurementSupplier(SUBSIDIARY_A, { ...validPayload, rut: '76123456-0' }),
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
			createProcurementSupplier(SUBSIDIARY_A, { ...validPayload, rut: '77888999-4' }),
		);
		expect(data.existing_supplier).toEqual({
			id: 12,
			display_name: 'Importadora Sur',
			is_active: false,
		});
	});

	it('no crea nada cuando el RUT está en conflicto', async () => {
		await readErrorData(
			createProcurementSupplier(SUBSIDIARY_A, { ...validPayload, rut: '76123456-0' }),
		).catch(() => undefined);
		const all = await listProcurementSuppliers(SUBSIDIARY_A, { include_inactive: 1 });
		expect(all.meta.total).toBe(4);
	});
});

describe('updateProcurementSupplier', () => {
	it('actualiza los campos editables y recalcula display_name', async () => {
		const { data } = await updateProcurementSupplier(SUBSIDIARY_A, 7, {
			...validPayload,
			rut: '76123456-0',
			company_name: 'PCExpress Renovado',
		});
		expect(data.display_name).toBe('PCExpress Renovado');
		expect(data.is_active).toBe(true);
	});

	it('409 si el RUT editado ya pertenece a otro proveedor', async () => {
		const { status, data } = await readErrorData(
			updateProcurementSupplier(SUBSIDIARY_A, 15, { ...validPayload, rut: '76123456-0' }),
		);
		expect(status).toBe(409);
		expect(data.code).toBe('SUPPLIER_RUT_ALREADY_EXISTS');
	});

	it('permite conservar el mismo RUT del propio proveedor', async () => {
		const { data } = await updateProcurementSupplier(SUBSIDIARY_A, 7, {
			...validPayload,
			rut: '76123456-0',
		});
		expect(data.id).toBe(7);
	});
});

describe('desactivar y restaurar', () => {
	it('desactivar responde sin cuerpo (204 contractual) y saca al proveedor del listado activo', async () => {
		const result = await deactivateProcurementSupplier(SUBSIDIARY_A, 7);
		expect(result).toBeUndefined();

		const activeList = await listProcurementSuppliers(SUBSIDIARY_A);
		expect(activeList.data.find((s) => s.id === 7)).toBeUndefined();

		const ficha = await getProcurementSupplier(SUBSIDIARY_A, 7);
		expect(ficha.data.is_active).toBe(false);
		expect(ficha.data.allowed_actions).toEqual(['restore']);
	});

	it('restaurar nunca ocurre solo: hace falta llamarlo explícitamente, y sí devuelve la ficha', async () => {
		await deactivateProcurementSupplier(SUBSIDIARY_A, 7);
		const beforeRestore = await getProcurementSupplier(SUBSIDIARY_A, 7);
		expect(beforeRestore.data.is_active).toBe(false);

		const { data } = await restoreProcurementSupplier(SUBSIDIARY_A, 7);
		expect(data.is_active).toBe(true);
		expect(data.allowed_actions).toEqual(['update', 'deactivate']);
	});

	it('desactivar dos veces es 409, no una operación silenciosa', async () => {
		await deactivateProcurementSupplier(SUBSIDIARY_A, 7);
		const { status, data } = await readErrorData(
			deactivateProcurementSupplier(SUBSIDIARY_A, 7),
		);
		expect(status).toBe(409);
		expect(data.code).toBe('PROCUREMENT_SUPPLIER_ALREADY_INACTIVE');
	});

	it('desactivar en una filial no afecta al mismo id en otra', async () => {
		await deactivateProcurementSupplier(SUBSIDIARY_A, 7);

		const fichaEnB = await getProcurementSupplier(SUBSIDIARY_B, 7);
		expect(fichaEnB.data.is_active).toBe(true);
	});
});

describe('Idempotency-Key', () => {
	it('misma clave y mismo payload devuelve el mismo resultado sin duplicar', async () => {
		const first = await createProcurementSupplier(SUBSIDIARY_A, validPayload, {
			idempotencyKey: 'key-1',
		});
		const second = await createProcurementSupplier(SUBSIDIARY_A, validPayload, {
			idempotencyKey: 'key-1',
		});
		expect(second.data.id).toBe(first.data.id);

		const all = await listProcurementSuppliers(SUBSIDIARY_A, { include_inactive: 1 });
		expect(all.meta.total).toBe(5); // 4 de la semilla + 1, no 2.
	});

	it('misma clave con otro payload es 409 IDEMPOTENCY_KEY_REUSED', async () => {
		await createProcurementSupplier(SUBSIDIARY_A, validPayload, { idempotencyKey: 'key-2' });
		const { status, data } = await readErrorData(
			createProcurementSupplier(
				SUBSIDIARY_A,
				{ ...validPayload, rut: '11222333-9' },
				{ idempotencyKey: 'key-2' },
			),
		);
		expect(status).toBe(409);
		expect(data.code).toBe('IDEMPOTENCY_KEY_REUSED');
	});

	it('la misma clave en dos filiales no interfiere entre sí', async () => {
		const inA = await createProcurementSupplier(SUBSIDIARY_A, validPayload, {
			idempotencyKey: 'key-3',
		});
		const inB = await createProcurementSupplier(
			SUBSIDIARY_B,
			{ ...validPayload, rut: '11222333-9' },
			{ idempotencyKey: 'key-3' },
		);

		expect(inA.data.rut).toBe('12345678-5');
		expect(inB.data.rut).toBe('11222333-9');
	});
});
