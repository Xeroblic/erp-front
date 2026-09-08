import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import procurementSuppliersReducer, {
	fetchProcurementSupplierDetail,
} from '@/store/slices/procurement/procurementSuppliersSlice';
import type { IProcurementSupplier } from '@/interface/procurement.interface';

/**
 * Propiedad de contexto (ZF-12): una ficha de proveedor que resuelve tarde no
 * puede pisar la que el usuario ya pidió después (proveedor distinto, o el
 * mismo tras cambiar de filial). El servicio real siempre resuelve en el
 * mismo orden en que se llama, así que esta carrera se simula mockeándolo con
 * promesas controladas a mano.
 */

const serviceSpies = vi.hoisted(() => ({ getProcurementSupplier: vi.fn() }));
vi.mock('@/services/procurement/procurementSuppliers.service', () => ({
	getProcurementSupplier: serviceSpies.getProcurementSupplier,
}));

const supplier = (id: number, display_name: string): IProcurementSupplier => ({
	id,
	rut: `${id}0000000-0`,
	company_name: display_name,
	contact_name: null,
	business_activity: null,
	billing_address: null,
	billing_commune_id: null,
	shipping_address: null,
	shipping_commune_id: null,
	phone: null,
	email: null,
	display_name,
	is_active: true,
	created_at: '2026-01-01T00:00:00-03:00',
	updated_at: '2026-01-01T00:00:00-03:00',
	allowed_actions: ['update', 'deactivate'],
	purchase_summary: {
		last_purchase_on: null,
		received_units: 0,
		products_supplied_count: 0,
		receipt_count: 0,
	},
});

const deferred = <T>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
};

const createStore = () => configureStore({ reducer: procurementSuppliersReducer });

beforeEach(() => serviceSpies.getProcurementSupplier.mockReset());

describe('fetchProcurementSupplierDetail — respuestas tardías', () => {
	it('una ficha anterior que resuelve después no pisa la más reciente', async () => {
		const first = deferred<{ data: IProcurementSupplier }>();
		const second = deferred<{ data: IProcurementSupplier }>();
		serviceSpies.getProcurementSupplier
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise);

		const store = createStore();
		const firstRequest = store.dispatch(
			fetchProcurementSupplierDetail({ subsidiaryId: 4, id: 7 }),
		);
		const secondRequest = store.dispatch(
			fetchProcurementSupplierDetail({ subsidiaryId: 4, id: 12 }),
		);

		// La segunda petición (más reciente) resuelve primero...
		second.resolve({ data: supplier(12, 'Importadora Sur') });
		await secondRequest;
		expect(store.getState().current?.id).toBe(12);

		// ...y la primera, tardía, resuelve después: no puede pisarla.
		first.resolve({ data: supplier(7, 'PCExpress') });
		await firstRequest;
		expect(store.getState().current?.id).toBe(12);
		expect(store.getState().currentLoading).toBe(false);
	});

	it('limpiar la ficha actual descarta cualquier respuesta en vuelo', async () => {
		const pending = deferred<{ data: IProcurementSupplier }>();
		serviceSpies.getProcurementSupplier.mockReturnValueOnce(pending.promise);

		const store = createStore();
		const { clearProcurementSupplierCurrent } = await import(
			'@/store/slices/procurement/procurementSuppliersSlice'
		);
		const request = store.dispatch(fetchProcurementSupplierDetail({ subsidiaryId: 4, id: 7 }));
		store.dispatch(clearProcurementSupplierCurrent());

		pending.resolve({ data: supplier(7, 'PCExpress') });
		await request;

		expect(store.getState().current).toBeNull();
	});
});
