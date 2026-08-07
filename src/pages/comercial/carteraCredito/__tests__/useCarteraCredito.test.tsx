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

	it('inicia y reinicia la carga al cambiar de subsidiaria', () => {
		getCreditProfilesMock.mockImplementation(
			() => new Promise<DeferredPaymentCreditProfilesListResponse>(() => {}),
		);
		const { result, rerender } = renderHook(() => useCarteraCredito());
		expect(result.current.state.loading).toBe(true);

		act(() => {
			branchContext.subsidiaryId = 20;
			rerender();
		});

		expect(result.current.state.loading).toBe(true);
	});
});
