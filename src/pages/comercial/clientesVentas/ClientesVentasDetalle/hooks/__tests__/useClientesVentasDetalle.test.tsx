import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICustomerSale } from '@/interface/customerSales.interface';
import { useClientesVentasDetalle } from '../useClientesVentasDetalle';

const state = vi.hoisted(() => ({
	detail: undefined as ICustomerSale | undefined,
}));
const dispatchSpy = vi.hoisted(() => vi.fn());
const thunkSpies = vi.hoisted(() => ({
	fetchDetail: vi.fn((payload: unknown) => ({ kind: 'fetch-detail', payload })),
	updateCustomer: vi.fn((payload: unknown) => ({ kind: 'update-customer', payload })),
}));
const toastSpies = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('react-router-dom', () => ({
	useParams: () => ({ clienteId: '8' }),
	useNavigate: () => vi.fn(),
}));
vi.mock('@/store', () => ({
	useAppDispatch: () => dispatchSpy,
	useAppSelector: (selector: (root: unknown) => unknown) =>
		selector({ customerSales: { detalle: state.detail, loading: false } }),
}));
vi.mock('@/store/selectors/subsidiarySelectors', () => ({
	selectEffectiveSubsidiaryId: () => 3,
}));
vi.mock('@/store/slices/customerSales/customerSalesSlice', () => ({
	fetchCustomerDetailThunk: thunkSpies.fetchDetail,
	updateCustomerThunk: thunkSpies.updateCustomer,
}));
vi.mock('react-toastify', () => ({ toast: toastSpies }));

const detail: ICustomerSale = {
	id: 8,
	subsidiary_id: 3,
	name: 'Comercial Andina Ltda.',
	document_type: 'rut',
	document_number: '20761872-1',
	type: 'company',
	rut: '20761872-1',
	billing_company: 'Comercial Andina Ltda.',
	email: 'contacto@andina.cl',
	is_active: true,
	created_at: '2026-08-24T00:00:00Z',
	updated_at: '2026-08-24T00:00:00Z',
};

describe('useClientesVentasDetalle', () => {
	beforeEach(() => {
		state.detail = detail;
		dispatchSpy.mockReset();
		thunkSpies.fetchDetail.mockClear();
		thunkSpies.updateCustomer.mockClear();
		toastSpies.success.mockReset();
		toastSpies.error.mockReset();
		dispatchSpy.mockImplementation((action: { kind: string }) =>
			action.kind === 'update-customer'
				? { unwrap: vi.fn().mockResolvedValue(detail) }
				: Promise.resolve(),
		);
	});

	it('inicializa el tipo real y envía el cambio en el PATCH del detalle', async () => {
		const { result } = renderHook(() => useClientesVentasDetalle());

		expect(result.current.formik.values.type).toBe('company');
		await act(async () => {
			await result.current.formik.setFieldValue('type', 'natural');
		});
		await act(async () => {
			await result.current.formik.submitForm();
		});

		await waitFor(() => expect(thunkSpies.updateCustomer).toHaveBeenCalledTimes(1));
		expect(thunkSpies.updateCustomer).toHaveBeenCalledWith(
			expect.objectContaining({
				subsidiary: 3,
				id: 8,
				payload: expect.objectContaining({ type: 'natural' }),
			}),
		);
		expect(toastSpies.success).toHaveBeenCalledWith('Cliente actualizado correctamente');
	});

	it('permite editar otro campo y omite type si el detalle no lo trae', async () => {
		state.detail = { ...detail, type: undefined };
		const { result } = renderHook(() => useClientesVentasDetalle());

		expect(result.current.formik.values.type).toBe('');
		await act(async () => {
			await result.current.formik.setFieldValue('billing_company', 'Comercial Andina SpA');
		});
		await act(async () => {
			await result.current.formik.submitForm();
		});

		await waitFor(() => expect(thunkSpies.updateCustomer).toHaveBeenCalledTimes(1));
		const updatePayload = thunkSpies.updateCustomer.mock.calls[0]?.[0] as
			| { payload?: Record<string, unknown> }
			| undefined;
		expect(updatePayload).toEqual(
			expect.objectContaining({
				subsidiary: 3,
				id: 8,
				payload: expect.objectContaining({ billing_company: 'Comercial Andina SpA' }),
			}),
		);
		expect(updatePayload?.payload).not.toHaveProperty('type');
		expect(toastSpies.success).toHaveBeenCalledWith('Cliente actualizado correctamente');
	});

	it('mantiene obligatorio el tipo cuando el detalle ya tenía uno válido', async () => {
		const { result } = renderHook(() => useClientesVentasDetalle());

		await act(async () => {
			await result.current.formik.setFieldValue('type', null);
		});
		await act(async () => {
			await result.current.formik.submitForm();
		});

		expect(result.current.formik.errors.type).toBe('Selecciona el tipo de cliente');
		expect(thunkSpies.updateCustomer).not.toHaveBeenCalled();
	});
});
