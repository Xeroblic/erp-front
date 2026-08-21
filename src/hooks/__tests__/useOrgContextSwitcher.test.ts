import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

const { fetchData, toastSuccess, toastError } = vi.hoisted(() => ({
	fetchData: vi.fn(() => Promise.resolve({ data: {} })),
	toastSuccess: vi.fn(),
	toastError: vi.fn(),
}));

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('react-toastify', () => ({
	toast: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}));

// Mantiene los selectores reales, pero neutraliza el dispatch de thunks
// (devuelve algo con `.unwrap()` para que la orquestación siga su curso).
vi.mock('@/store', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/store')>();
	return {
		...actual,
		useAppDispatch: () => () => ({ unwrap: () => Promise.resolve() }),
	};
});

import { useOrgContextSwitcher, ORG_CONTEXT_CHANGED_EVENT } from '../useOrgContextSwitcher';
import { renderHookWithStore, PreloadedTestState } from '@/test-utils/renderWithStore';

const state = (opts: {
	companyIdUser?: number;
	companyIdPers?: number;
	subsidiaryIdPers?: number;
}): PreloadedTestState => ({
	auth: { user: { company: { id: opts.companyIdUser } } },
	personalizacion: {
		personalizacionUsuario: {
			company_id: opts.companyIdPers,
			subsidiary_id: opts.subsidiaryIdPers,
		},
	},
});

describe('useOrgContextSwitcher', () => {
	beforeEach(() => {
		fetchData.mockReset().mockResolvedValue({ data: {} });
		toastSuccess.mockReset();
		toastError.mockReset();
	});

	it('POSTea a /user/switch-company con company_id explícito y subsidiary_id', async () => {
		const { result } = renderHookWithStore(
			() => useOrgContextSwitcher(),
			state({ companyIdUser: 1 }),
		);

		let ok: boolean | undefined;
		await act(async () => {
			ok = await result.current.switchContext({ companyId: 5, subsidiaryId: 9 });
		});

		expect(ok).toBe(true);
		expect(fetchData).toHaveBeenCalledWith(
			expect.objectContaining({
				url: '/user/switch-company',
				method: 'post',
				data: { company_id: 5, subsidiary_id: 9 },
			}),
		);
		expect(toastSuccess).toHaveBeenCalled();
	});

	it('resuelve company_id desde la personalización cuando no se pasa explícito', async () => {
		const { result } = renderHookWithStore(
			() => useOrgContextSwitcher(),
			state({ companyIdUser: 1, companyIdPers: 77 }),
		);

		await act(async () => {
			await result.current.switchContext({ subsidiaryId: 3 });
		});

		expect(fetchData).toHaveBeenCalledWith(
			expect.objectContaining({ data: { company_id: 77, subsidiary_id: 3 } }),
		);
	});

	it('emite el evento org-context-changed con el detalle correcto', async () => {
		const { result } = renderHookWithStore(
			() => useOrgContextSwitcher(),
			state({ companyIdUser: 2 }),
		);
		const listener = vi.fn();
		window.addEventListener(ORG_CONTEXT_CHANGED_EVENT, listener);

		await act(async () => {
			await result.current.switchContext({ subsidiaryId: 8, eventBranchId: 44 });
		});

		expect(listener).toHaveBeenCalledTimes(1);
		const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
		expect(detail).toEqual({ companyId: 2, subsidiaryId: 8, branchId: 44 });
		window.removeEventListener(ORG_CONTEXT_CHANGED_EVENT, listener);
	});

	it('devuelve false y muestra toast.error si la API falla', async () => {
		fetchData.mockRejectedValueOnce({ response: { data: { message: 'boom' } } });
		const { result } = renderHookWithStore(
			() => useOrgContextSwitcher(),
			state({ companyIdUser: 1 }),
		);

		let ok: boolean | undefined;
		await act(async () => {
			ok = await result.current.switchContext({ subsidiaryId: 1 });
		});

		expect(ok).toBe(false);
		expect(toastError).toHaveBeenCalledWith('boom');
	});

	it('ante un AbortError devuelve false sin mostrar toast.error', async () => {
		fetchData.mockRejectedValueOnce({ name: 'AbortError' });
		const { result } = renderHookWithStore(
			() => useOrgContextSwitcher(),
			state({ companyIdUser: 1 }),
		);

		let ok: boolean | undefined;
		await act(async () => {
			ok = await result.current.switchContext({ subsidiaryId: 1 });
		});

		expect(ok).toBe(false);
		expect(toastError).not.toHaveBeenCalled();
	});

	it('isSwitching vuelve a false al terminar', async () => {
		const { result } = renderHookWithStore(
			() => useOrgContextSwitcher(),
			state({ companyIdUser: 1 }),
		);
		await act(async () => {
			await result.current.switchContext({ subsidiaryId: 1 });
		});
		expect(result.current.isSwitching).toBe(false);
	});
});
