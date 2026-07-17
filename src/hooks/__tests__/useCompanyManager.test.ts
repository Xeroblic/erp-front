import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

const { switchContext, fetchData, toastError } = vi.hoisted(() => ({
	switchContext: vi.fn(async () => true),
	fetchData: vi.fn(() => Promise.resolve({ data: {} })),
	toastError: vi.fn(),
}));

vi.mock('@/hooks/useOrgContextSwitcher', () => ({
	default: () => ({ switchContext, isSwitching: false }),
	useOrgContextSwitcher: () => ({ switchContext, isSwitching: false }),
}));
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('react-toastify', () => ({ toast: { error: (m: string) => toastError(m) } }));

import useCompanyManager from '../useCompanyManager';
import { renderHookWithStore, PreloadedTestState } from '@/test-utils/renderWithStore';

const withUser = (user: Record<string, unknown>): PreloadedTestState => ({
	auth: { user },
	personalizacion: { personalizacionUsuario: {} },
});

describe('useCompanyManager', () => {
	beforeEach(() => {
		switchContext.mockClear().mockResolvedValue(true);
		fetchData.mockReset().mockResolvedValue({ data: {} });
		toastError.mockReset();
	});

	it('deriva currentCompany desde user.subsidiary', () => {
		const { result } = renderHookWithStore(
			() => useCompanyManager(),
			withUser({ subsidiary: { id: 5, name: 'Sub Cinco' }, position: 'admin' }),
		);
		expect(result.current.currentCompany).toMatchObject({
			id: 5,
			name: 'Sub Cinco',
			is_primary: true,
			subsidiary_id: 5,
		});
	});

	it('deriva currentCompany desde personalizacion.sucursal_principal si no hay subsidiary', () => {
		const { result } = renderHookWithStore(
			() => useCompanyManager(),
			withUser({ personalizacion: { sucursal_principal: 12 } }),
		);
		expect(result.current.currentCompany).toMatchObject({
			id: 12,
			is_primary: false,
			subsidiary_id: 12,
		});
	});

	it('devuelve "Administración Global" para super-admin sin subsidiary', () => {
		const { result } = renderHookWithStore(
			() => useCompanyManager(),
			withUser({ authority: ['super-admin'] }),
		);
		expect(result.current.currentCompany).toMatchObject({
			id: 0,
			name: 'Administración Global',
			role: 'super-admin',
		});
	});

	it('refreshCompanies deriva availableCompanies desde user.companies (sin llamar API)', async () => {
		const { result } = renderHookWithStore(
			() => useCompanyManager(),
			withUser({
				companies: [
					{ id: 1, company_name: 'Empresa A', is_primary: 1 },
					{ id: 2, name: 'Empresa B' },
				],
				position: 'employee',
			}),
		);

		await act(async () => {
			await result.current.refreshCompanies();
		});

		expect(fetchData).not.toHaveBeenCalled();
		expect(result.current.availableCompanies).toHaveLength(2);
		expect(result.current.availableCompanies.map((c) => c.name)).toEqual([
			'Empresa A',
			'Empresa B',
		]);
	});

	it('switchCompany delega en switchContext con la semántica de subsidiaria', async () => {
		const { result } = renderHookWithStore(
			() => useCompanyManager(),
			withUser({ subsidiary: { id: 5, name: 'Sub' } }),
		);

		let ok: boolean | undefined;
		await act(async () => {
			ok = await result.current.switchCompany(9);
		});

		expect(ok).toBe(true);
		expect(switchContext).toHaveBeenCalledWith({
			subsidiaryId: 9,
			eventBranchId: null,
			successMessage: 'Empresa cambiada exitosamente',
		});
	});

	it('expone los checks de acceso de useAuthorization (sets vacíos => true)', () => {
		const { result } = renderHookWithStore(
			() => useCompanyManager(),
			withUser({ subsidiary: { id: 5, name: 'Sub' } }),
		);
		expect(result.current.canAccessCompany(123)).toBe(true);
		expect(result.current.canAccessSubsidiary(456)).toBe(true);
		expect(result.current.canAccessBranch(789)).toBe(true);
	});
});
