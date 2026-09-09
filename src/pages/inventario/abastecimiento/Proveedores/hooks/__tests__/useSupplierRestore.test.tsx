import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetProcurementSuppliersStoreForTests } from '@/services/procurement/procurementSuppliers.service';
import procurementSuppliersReducer from '@/store/slices/procurement/procurementSuppliersSlice';
import useSupplierRestore from '../useSupplierRestore';

/**
 * `restore` es una escritura del contrato como cualquier otra: necesita su
 * propia `Idempotency-Key` (sección 1). Antes de esta pieza compartida, los
 * tres lugares que restauran (fila del listado, ficha, banner de conflicto)
 * la omitían.
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

afterEach(() => {
	resetProcurementSuppliersStoreForTests();
	toastSpies.success.mockReset();
	toastSpies.error.mockReset();
});

describe('useSupplierRestore', () => {
	it('restaura, avisa con toast y llama a onSuccess con la ficha', async () => {
		const onSuccess = vi.fn();
		const { result } = renderHook(() => useSupplierRestore({ subsidiaryId: 4, onSuccess }), {
			wrapper: createWrapper(),
		});

		// Importadora Sur (id 12) está desactivada en la semilla.
		await act(async () => {
			await result.current.restore(12);
		});

		expect(toastSpies.success).toHaveBeenCalledWith('Importadora Sur fue restaurado.');
		expect(onSuccess).toHaveBeenCalledTimes(1);
		expect(onSuccess.mock.calls[0][0]).toMatchObject({ id: 12, is_active: true });
	});

	it('cada llamada usa una Idempotency-Key propia: dos restauraciones seguidas no chocan', async () => {
		const { result } = renderHook(() => useSupplierRestore({ subsidiaryId: 4 }), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			await result.current.restore(12);
		});
		// Ya está activo: restaurar de nuevo es un error de negocio (409 ya
		// activo), no un IDEMPOTENCY_KEY_REUSED — prueba de que la segunda
		// llamada no heredó la clave de la primera.
		await act(async () => {
			await result.current.restore(12);
		});

		expect(toastSpies.error).toHaveBeenCalledTimes(1);
		expect(toastSpies.success).toHaveBeenCalledTimes(1);
	});

	it('un proveedor inexistente falla con aviso genérico, sin romper', async () => {
		const { result } = renderHook(() => useSupplierRestore({ subsidiaryId: 4 }), {
			wrapper: createWrapper(),
		});

		const outcome = await act(async () => result.current.restore(9999));

		expect(outcome).toBeUndefined();
		expect(toastSpies.error).toHaveBeenCalledWith('No se pudo restaurar el proveedor.');
	});
});
