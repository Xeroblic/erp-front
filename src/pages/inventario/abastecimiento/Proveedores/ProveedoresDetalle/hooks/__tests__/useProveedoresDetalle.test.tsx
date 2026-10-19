import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetProcurementSuppliersStoreForTests } from '@/mocks/services/procurementSuppliers.mock';
import procurementSuppliersReducer from '@/store/slices/procurement/procurementSuppliersSlice';
import useProveedoresDetalle from '../useProveedoresDetalle';

vi.mock(
	'@/services/procurement/procurementSuppliers.service',
	() => import('@/mocks/services/procurementSuppliers.mock'),
);

const branchContext = vi.hoisted(() => ({ branchId: 4, subsidiaryId: 4 }));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ ...branchContext }),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});
vi.mock('react-router-dom', () => ({
	useParams: () => ({ proveedorId: '7' }),
	useNavigate: () => vi.fn(),
}));

const OTHER_SUBSIDIARY_ID = 5;

const createWrapper = () => {
	const store = configureStore({
		reducer: { procurementSuppliers: procurementSuppliersReducer },
	});
	const Wrapper = ({ children }: PropsWithChildren) => (
		<Provider store={store}>{children}</Provider>
	);
	return Wrapper;
};

type THookResult = ReturnType<typeof useProveedoresDetalle>;

const renderTracked = () => {
	const renders: THookResult[] = [];
	const hook = renderHook(
		() => {
			const value = useProveedoresDetalle();
			renders.push(value);
			return value;
		},
		{ wrapper: createWrapper() },
	);
	return { ...hook, renders };
};

const switchSubsidiary = (rerender: () => void) => {
	branchContext.branchId = OTHER_SUBSIDIARY_ID;
	branchContext.subsidiaryId = OTHER_SUBSIDIARY_ID;
	rerender();
};

afterEach(() => {
	resetProcurementSuppliersStoreForTests();
	branchContext.branchId = 4;
	branchContext.subsidiaryId = 4;
});

describe('useProveedoresDetalle — cambio de filial', () => {
	it('no expone la ficha de la filial anterior ni un render', async () => {
		const { result, rerender, renders } = renderTracked();
		await waitFor(() => expect(result.current.supplier?.id).toBe(7));

		const rendersBeforeSwitch = renders.length;
		switchSubsidiary(rerender);

		const [firstRenderInNewSubsidiary] = renders.slice(rendersBeforeSwitch);
		expect(firstRenderInNewSubsidiary.subsidiaryId).toBe(OTHER_SUBSIDIARY_ID);
		expect(firstRenderInNewSubsidiary.supplier).toBeNull();
		expect(firstRenderInNewSubsidiary.loading).toBe(true);

		await waitFor(() => expect(result.current.supplier?.id).toBe(7));
	});

	it('cierra el modal abierto en la filial anterior y no lo reabre con la ficha nueva', async () => {
		const { result, rerender } = renderTracked();
		await waitFor(() => expect(result.current.supplier?.id).toBe(7));

		act(() => result.current.setIsFormModalOpen(true));
		expect(result.current.isFormModalOpen).toBe(true);

		switchSubsidiary(rerender);
		await waitFor(() => expect(result.current.supplier?.id).toBe(7));

		expect(result.current.isFormModalOpen).toBe(false);
	});
});
