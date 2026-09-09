import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it } from 'vitest';
import { resetProcurementSuppliersStoreForTests } from '@/services/procurement/procurementSuppliers.service';
import procurementSuppliersReducer, {
	createProcurementSupplierThunk,
	deactivateProcurementSupplierThunk,
	fetchProcurementSupplierDetail,
	fetchProcurementSuppliers,
	restoreProcurementSupplierThunk,
	updateProcurementSupplierThunk,
} from '@/store/slices/procurement/procurementSuppliersSlice';
import type { IProcurementSupplierPayload } from '@/interface/procurement.interface';

/**
 * El servicio mock ya está probado en `procurementSuppliers.service.test.ts`.
 * Estas pruebas verifican el cableado del slice: qué flags mueve cada thunk y
 * que una escritura exitosa se refleje en `items`/`current` sin refetch.
 */

const createStore = () => configureStore({ reducer: procurementSuppliersReducer });

const newSupplierPayload: IProcurementSupplierPayload = {
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

afterEach(() => {
	resetProcurementSuppliersStoreForTests();
});

describe('fetchProcurementSuppliers', () => {
	it('carga items y meta, y levanta listLoading mientras viaja', async () => {
		const store = createStore();
		const request = store.dispatch(fetchProcurementSuppliers({ subsidiaryId: 4 }));
		expect(store.getState().listLoading).toBe(true);

		await request;

		expect(store.getState().listLoading).toBe(false);
		expect(store.getState().items.length).toBeGreaterThan(0);
		expect(store.getState().meta?.total).toBe(store.getState().items.length);
	});

	it('sin subsidiaryId no llama al servicio y deja un error legible', async () => {
		const store = createStore();
		await store.dispatch(fetchProcurementSuppliers({ subsidiaryId: null }));

		expect(store.getState().listError).toBe('No se pudo determinar la filial activa.');
		expect(store.getState().items).toEqual([]);
	});
});

describe('fetchProcurementSupplierDetail', () => {
	it('carga la ficha completa en current', async () => {
		const store = createStore();
		await store.dispatch(fetchProcurementSupplierDetail({ subsidiaryId: 4, id: 7 }));

		expect(store.getState().current?.id).toBe(7);
		expect(store.getState().current?.purchase_summary).toBeDefined();
	});

	it('un id inexistente deja currentError y current en null', async () => {
		const store = createStore();
		await store.dispatch(fetchProcurementSupplierDetail({ subsidiaryId: 4, id: 999 }));

		expect(store.getState().current).toBeNull();
		expect(store.getState().currentError).toBeTruthy();
	});
});

describe('mutaciones', () => {
	it('crear levanta y baja creating sin tocar items (el hook refresca la lista)', async () => {
		const store = createStore();
		const request = store.dispatch(
			createProcurementSupplierThunk({ subsidiaryId: 4, payload: newSupplierPayload }),
		);
		expect(store.getState().creating).toBe(true);

		const result = await request;
		expect(store.getState().creating).toBe(false);
		expect(createProcurementSupplierThunk.fulfilled.match(result)).toBe(true);
	});

	it('actualizar refleja el resultado en items y en current sin refetch', async () => {
		const store = createStore();
		await store.dispatch(fetchProcurementSuppliers({ subsidiaryId: 4 }));
		await store.dispatch(fetchProcurementSupplierDetail({ subsidiaryId: 4, id: 7 }));

		await store.dispatch(
			updateProcurementSupplierThunk({
				subsidiaryId: 4,
				id: 7,
				payload: {
					...newSupplierPayload,
					rut: '76123456-0',
					company_name: 'PCExpress Renovado',
				},
			}),
		);

		expect(store.getState().current?.display_name).toBe('PCExpress Renovado');
		expect(store.getState().items.find((row) => row.id === 7)?.display_name).toBe(
			'PCExpress Renovado',
		);
	});

	it('desactivar y restaurar actualizan is_active en items y en current', async () => {
		const store = createStore();
		await store.dispatch(fetchProcurementSuppliers({ subsidiaryId: 4 }));
		await store.dispatch(fetchProcurementSupplierDetail({ subsidiaryId: 4, id: 7 }));

		await store.dispatch(deactivateProcurementSupplierThunk({ subsidiaryId: 4, id: 7 }));
		expect(store.getState().current?.is_active).toBe(false);
		expect(store.getState().items.find((row) => row.id === 7)?.is_active).toBe(false);

		await store.dispatch(restoreProcurementSupplierThunk({ subsidiaryId: 4, id: 7 }));
		expect(store.getState().current?.is_active).toBe(true);
		expect(store.getState().items.find((row) => row.id === 7)?.is_active).toBe(true);
	});
});
