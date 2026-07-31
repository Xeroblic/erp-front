import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
	DeferredPaymentsListResponse,
	IDeferredPaymentsSummary,
} from '@/interface/deferredPayments.interface';
// eslint-disable-next-line import/extensions
import deferredPaymentsService from '@/services/deferredPaymentsService';
// eslint-disable-next-line import/extensions
import deferredPaymentsReducer from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import usePagosDiferidos from '../hooks/usePagosDiferidos';

const branchContext = vi.hoisted(() => ({ subsidiaryId: 10 as number | null }));
vi.mock('@/services/deferredPaymentsService', () => ({
	default: { getDocuments: vi.fn(), getSummary: vi.fn() },
}));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({
		branchId: 1,
		subsidiaryId: branchContext.subsidiaryId,
		hasValidBranch: branchContext.subsidiaryId !== null,
	}),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const summary: IDeferredPaymentsSummary = {
	total_outstanding: '1500.00',
	overdue: { count: 1, amount: '500.00' },
	due_within_7_days: { count: 1, amount: '400.00' },
	current: { count: 1, amount: '600.00' },
};
const listResponse = (page = 1, perPage = 10): DeferredPaymentsListResponse => ({
	data: [
		{
			id: page,
			document_number: `FAC-${page}`,
			document_type: 'electronic_invoice',
			purchase_order: null,
			total_amount: '1000.00',
			outstanding_amount: '600.00',
			status: 'partially_paid',
			is_overdue: false,
			days_until_due: 5,
			due_date: '2026-08-05',
			issue_date: '2026-07-01',
			customer: { id: 7, billing_company: 'Cliente Real', rut: '1-9', contact_name: null },
		},
	],
	meta: { current_page: page, per_page: perPage, total: 3, last_page: 3 },
});
const flushPromises = async () => {
	await act(async () => {
		await Promise.resolve();
	});
};

describe('usePagosDiferidos con servicio', () => {
	const getDocumentsMock = vi.mocked(deferredPaymentsService.getDocuments);
	const getSummaryMock = vi.mocked(deferredPaymentsService.getSummary);
	const createHook = () => {
		const store = configureStore({ reducer: { deferredPayments: deferredPaymentsReducer } });
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		return { store, hook: renderHook(() => usePagosDiferidos(), { wrapper: Wrapper }) };
	};
	beforeEach(() => {
		branchContext.subsidiaryId = 10;
		getDocumentsMock.mockImplementation((_id, params) =>
			Promise.resolve(listResponse(params.page, params.per_page)),
		);
		getSummaryMock.mockResolvedValue(summary);
	});
	afterEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	it('consulta listado y resumen para la subsidiaria activa', async () => {
		const { store } = createHook();
		await flushPromises();
		expect(getDocumentsMock).toHaveBeenCalledWith(
			10,
			expect.objectContaining({ page: 1, per_page: 10 }),
			expect.any(AbortSignal),
		);
		expect(getSummaryMock).toHaveBeenCalledWith(10, expect.any(AbortSignal));
		expect(store.getState().deferredPayments.list).toHaveLength(1);
		expect(store.getState().deferredPayments.summary).toEqual(summary);
	});
	it('no consulta sin una subsidiaria resuelta', async () => {
		branchContext.subsidiaryId = null;
		const { hook } = createHook();
		await flushPromises();
		expect(getDocumentsMock).not.toHaveBeenCalled();
		expect(getSummaryMock).not.toHaveBeenCalled();
		expect(hook.result.current.state.hasDataContext).toBe(false);
	});
	it('espera el debounce y consulta una sola vez en pagina 1 al buscar', async () => {
		vi.useFakeTimers();
		const { hook } = createHook();
		await flushPromises();
		act(() => hook.result.current.filters.setFilter({ page: 3 }));
		await flushPromises();
		getDocumentsMock.mockClear();
		act(() => hook.result.current.filters.setSearch('andina'));
		await act(async () => vi.advanceTimersByTimeAsync(299));
		expect(getDocumentsMock).not.toHaveBeenCalled();
		await act(async () => vi.advanceTimersByTimeAsync(1));
		expect(getDocumentsMock).toHaveBeenCalledOnce();
		expect(getDocumentsMock.mock.calls[0]?.[1]).toMatchObject({ page: 1, search: 'andina' });
	});
	it('permite limpiar y repetir el mismo termino durante el debounce', async () => {
		vi.useFakeTimers();
		const { hook } = createHook();
		await flushPromises();
		getDocumentsMock.mockClear();
		act(() => hook.result.current.filters.setSearch('cliente'));
		await act(async () => vi.advanceTimersByTimeAsync(300));
		act(() => {
			hook.result.current.filters.reset();
			hook.result.current.filters.setSearch('cliente');
		});
		await act(async () => vi.advanceTimersByTimeAsync(300));
		expect(hook.result.current.filters.search).toBe('cliente');
		expect(getDocumentsMock).toHaveBeenCalledOnce();
		expect(getDocumentsMock.mock.calls[0]?.[1]).toMatchObject({ search: 'cliente' });
	});
	it('bloquea la consulta cuando el rango de vencimiento es invalido', async () => {
		const { hook } = createHook();
		await flushPromises();
		getDocumentsMock.mockClear();
		act(() =>
			hook.result.current.filters.setFilter({
				due_after: '2026-08-10',
				due_before: '2026-08-01',
			}),
		);
		await flushPromises();
		expect(hook.result.current.filters.hasInvalidDateRange).toBe(true);
		expect(getDocumentsMock).not.toHaveBeenCalled();
	});
	it('reinicia pagina, limpia seleccion y usa la nueva subsidiaria', async () => {
		const { hook, store } = createHook();
		await flushPromises();
		act(() => hook.result.current.filters.setFilter({ page: 3, per_page: 2 }));
		await flushPromises();
		act(() => hook.result.current.selection.openDetail(7));
		getDocumentsMock.mockClear();
		getSummaryMock.mockClear();
		act(() => {
			branchContext.subsidiaryId = 20;
			hook.rerender();
		});
		await flushPromises();
		expect(getDocumentsMock).toHaveBeenCalledOnce();
		expect(getDocumentsMock.mock.calls[0]?.[0]).toBe(20);
		expect(getDocumentsMock.mock.calls[0]?.[1]).toMatchObject({ page: 1, per_page: 2 });
		expect(getSummaryMock).toHaveBeenCalledWith(20, expect.any(AbortSignal));
		expect(store.getState().deferredPayments.filters.page).toBe(1);
		expect(hook.result.current.selection.selectedId).toBeNull();
	});
	it('expone errores independientes de listado y resumen', async () => {
		getDocumentsMock.mockRejectedValueOnce(new Error('Listado caido'));
		getSummaryMock.mockRejectedValueOnce(new Error('Resumen caido'));
		const { hook } = createHook();
		await flushPromises();
		expect(hook.result.current.state.error).toBe('Listado caido');
		expect(hook.result.current.state.errorSummary).toBe('Resumen caido');
		expect(hook.result.current.data.list).toEqual([]);
		expect(hook.result.current.data.summary).toBeNull();
	});
	it('aborta ambas solicitudes al desmontar sin dejar errores falsos', async () => {
		let listSignal: AbortSignal | undefined;
		let summarySignal: AbortSignal | undefined;
		getDocumentsMock.mockImplementation((_id, _params, signal) => {
			listSignal = signal;
			return new Promise(() => {});
		});
		getSummaryMock.mockImplementation((_id, signal) => {
			summarySignal = signal;
			return new Promise(() => {});
		});
		const { hook, store } = createHook();
		await flushPromises();
		hook.unmount();
		expect(listSignal?.aborted).toBe(true);
		expect(summarySignal?.aborted).toBe(true);
		expect(store.getState().deferredPayments.error).toBeNull();
		expect(store.getState().deferredPayments.errorSummary).toBeNull();
	});
});
