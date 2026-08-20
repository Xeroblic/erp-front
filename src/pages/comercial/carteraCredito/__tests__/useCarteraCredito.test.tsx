import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DeferredPaymentCreditProfilesListResponse } from '@/interface/deferredPayments.interface';
// eslint-disable-next-line import/extensions
import deferredPaymentsService from '@/services/deferredPaymentsService';
import useCarteraCredito from '../hooks/useCarteraCredito';

const branchContext = vi.hoisted(() => ({ subsidiaryId: 10 as number | null }));

vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 1, subsidiaryId: branchContext.subsidiaryId }),
}));
vi.mock('@/services/deferredPaymentsService', () => ({
	default: { getCreditProfiles: vi.fn() },
}));

const response: DeferredPaymentCreditProfilesListResponse = {
	data: [],
	meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 },
};

describe('useCarteraCredito', () => {
	const getCreditProfilesMock = vi.mocked(deferredPaymentsService.getCreditProfiles);

	beforeEach(() => {
		branchContext.subsidiaryId = 10;
		getCreditProfilesMock.mockResolvedValue(response);
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	it('preserva el mensaje del backend al fallar la carga', async () => {
		getCreditProfilesMock.mockRejectedValue({
			response: { data: { message: 'Los filtros enviados no son válidos.' } },
		});
		const { result } = renderHook(() => useCarteraCredito());

		await waitFor(() =>
			expect(result.current.state.error).toBe('Los filtros enviados no son válidos.'),
		);
	});

	it('no consulta la nueva subsidiaria con la búsqueda pendiente de la anterior', async () => {
		vi.useFakeTimers();
		const { result, rerender } = renderHook(() => useCarteraCredito());
		await act(async () => {
			await Promise.resolve();
		});
		getCreditProfilesMock.mockClear();

		act(() => result.current.filters.setSearch('cliente anterior'));
		act(() => {
			branchContext.subsidiaryId = 20;
			rerender();
		});
		await act(async () => {
			await Promise.resolve();
		});
		await act(async () => vi.advanceTimersByTimeAsync(300));

		const subsidiaryRequests = getCreditProfilesMock.mock.calls.filter(
			([subsidiaryId]) => subsidiaryId === 20,
		);
		expect(subsidiaryRequests).toHaveLength(1);
		expect(subsidiaryRequests[0]).toEqual([
			20,
			expect.objectContaining({ search: undefined }),
			expect.any(AbortSignal),
		]);
	});

	it('espera el debounce antes de consultar una búsqueda en la primera página', async () => {
		vi.useFakeTimers();
		const { result } = renderHook(() => useCarteraCredito());
		await act(async () => {
			await Promise.resolve();
		});
		getCreditProfilesMock.mockClear();

		act(() => result.current.filters.setSearch('c'));
		act(() => result.current.filters.setSearch('cl'));
		act(() => result.current.filters.setSearch('cliente'));

		expect(getCreditProfilesMock).not.toHaveBeenCalled();
		await act(async () => vi.advanceTimersByTimeAsync(300));

		expect(getCreditProfilesMock).toHaveBeenCalledTimes(1);
		expect(getCreditProfilesMock).toHaveBeenCalledWith(
			10,
			expect.objectContaining({ page: 1, per_page: 10, search: 'cliente' }),
			expect.any(AbortSignal),
		);
	});

	it('carga la nueva subsidiaria aunque no haya filtros activos', async () => {
		const { rerender } = renderHook(() => useCarteraCredito());
		await waitFor(() =>
			expect(getCreditProfilesMock).toHaveBeenCalledWith(
				10,
				expect.any(Object),
				expect.any(AbortSignal),
			),
		);
		getCreditProfilesMock.mockClear();

		branchContext.subsidiaryId = 20;
		rerender();

		await waitFor(() =>
			expect(getCreditProfilesMock).toHaveBeenCalledWith(
				20,
				expect.objectContaining({ search: undefined }),
				expect.any(AbortSignal),
			),
		);
	});
	it('expone el debounce para bloquear acciones que dependen de los filtros efectivos', async () => {
		vi.useFakeTimers();
		const { result } = renderHook(() => useCarteraCredito());
		await act(async () => {
			await Promise.resolve();
		});

		act(() => result.current.filters.setSearch('Andes'));
		expect(result.current.filters.isSearchDebouncing).toBe(true);
		await act(async () => vi.advanceTimersByTimeAsync(300));
		expect(result.current.filters.isSearchDebouncing).toBe(false);
	});

	it('inicia en carga cuando existe una subsidiaria activa', () => {
		const loadingFrames: boolean[] = [];
		getCreditProfilesMock.mockImplementation(
			() => new Promise<DeferredPaymentCreditProfilesListResponse>(() => {}),
		);
		renderHook(() => {
			const carteraCredito = useCarteraCredito();
			loadingFrames.push(carteraCredito.state.loading);
			return carteraCredito;
		});

		expect(loadingFrames[0]).toBe(true);
	});

	it('no muestra un frame vacío sin carga al cambiar de subsidiaria', async () => {
		const frames: Array<{ loading: boolean; rowCount: number }> = [];
		getCreditProfilesMock.mockResolvedValue({
			...response,
			data: [
				{
					id: 1,
					customer_sale_id: 1,
					credit_limit: '1000.00',
					payment_term_days: 30,
					notes: null,
					outstanding_balance: '0.00',
					available_credit: '1000.00',
					is_active: true,
					credit_limit_exceeded: false,
					customer: null,
					created_at: null,
					updated_at: null,
				},
			],
		});
		const { result, rerender } = renderHook(() => {
			const carteraCredito = useCarteraCredito();
			frames.push({
				loading: carteraCredito.state.loading,
				rowCount: carteraCredito.data.rows.length,
			});
			return carteraCredito;
		});
		await waitFor(() => {
			expect(result.current.state.loading).toBe(false);
			expect(result.current.data.rows).toHaveLength(1);
		});
		frames.length = 0;
		getCreditProfilesMock.mockImplementation(
			() => new Promise<DeferredPaymentCreditProfilesListResponse>(() => {}),
		);

		act(() => {
			branchContext.subsidiaryId = 20;
			rerender();
		});

		expect(frames).not.toContainEqual({ loading: false, rowCount: 0 });
	});
});
