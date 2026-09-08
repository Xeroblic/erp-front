import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetProcurementSuppliersStoreForTests } from '@/services/procurement/procurementSuppliers.service';
import procurementSuppliersReducer from '@/store/slices/procurement/procurementSuppliersSlice';
import type { IProveedorFormValues } from '../../types';
import useProveedorForm from '../useProveedorForm';

/**
 * El conflicto de RUT (409 `SUPPLIER_RUT_ALREADY_EXISTS`) es la regla más
 * fácil de romper del contrato: no se toastea (lo resuelve el banner de la
 * modal) y **nunca** restaura solo. Estas pruebas ejercen ese camino contra
 * el servicio mock real.
 */

vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const toastSpies = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-toastify', () => ({ toast: toastSpies }));

const createWrapper = () => {
	const store = configureStore({
		reducer: { procurementSuppliers: procurementSuppliersReducer },
	});
	const Wrapper = ({ children }: PropsWithChildren) => (
		<Provider store={store}>{children}</Provider>
	);
	return Wrapper;
};

const validValues: IProveedorFormValues = {
	rut: '', // se completa por test
	company_name: 'Nuevo Proveedor de Prueba',
	contact_name: '',
	business_activity: '',
	billing_address: '',
	billing_commune_id: null,
	shipping_address: '',
	shipping_commune_id: null,
	phone: '',
	email: '',
};

afterEach(() => {
	resetProcurementSuppliersStoreForTests();
	toastSpies.success.mockReset();
	toastSpies.error.mockReset();
});

describe('useProveedorForm — conflicto de RUT', () => {
	it('un RUT ya usado deja `conflict` sin toastear el error genérico', async () => {
		const { result } = renderHook(() => useProveedorForm({ subsidiaryId: 4 }), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			await result.current.formik.setValues({ ...validValues, rut: '76123456-0' });
		});
		await act(async () => {
			await result.current.formik.submitForm();
		});

		await waitFor(() => expect(result.current.conflict).not.toBeNull());
		expect(result.current.conflict).toEqual({
			id: 7,
			display_name: 'PCExpress',
			is_active: true,
		});
		expect(toastSpies.error).not.toHaveBeenCalled();
	});

	it('el conflicto sobre un proveedor eliminado ofrece restaurar, y restaurar es una acción explícita', async () => {
		const onSuccess = vi.fn();
		const { result } = renderHook(() => useProveedorForm({ subsidiaryId: 4, onSuccess }), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			await result.current.formik.setValues({ ...validValues, rut: '77888999-4' });
		});
		await act(async () => {
			await result.current.formik.submitForm();
		});

		await waitFor(() => expect(result.current.conflict?.is_active).toBe(false));
		// Someter el formulario NO restauró nada por su cuenta.
		expect(onSuccess).not.toHaveBeenCalled();

		await act(async () => {
			await result.current.restoreConflicting();
		});

		expect(onSuccess).toHaveBeenCalledTimes(1);
		expect(result.current.conflict).toBeNull();
	});

	it('tocar el RUT limpia el conflicto mostrado', async () => {
		const { result } = renderHook(() => useProveedorForm({ subsidiaryId: 4 }), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			await result.current.formik.setValues({ ...validValues, rut: '76123456-0' });
		});
		await act(async () => {
			await result.current.formik.submitForm();
		});
		await waitFor(() => expect(result.current.conflict).not.toBeNull());

		act(() => result.current.handleRutChange('11222333-9'));

		await waitFor(() => expect(result.current.conflict).toBeNull());
	});
});
