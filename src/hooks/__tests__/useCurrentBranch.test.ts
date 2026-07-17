import { describe, it, expect } from 'vitest';
import { useCurrentBranch } from '../useCurrentBranch';
import { renderHookWithStore, PreloadedTestState } from '@/test-utils/renderWithStore';

const buildState = (opts: {
	sucursalPrincipal?: number;
	subsidiaryIdPers?: number;
	userBranch?: { id: number; subsidiary?: { id: number } };
	userBranchId?: number;
	accessBranches?: Array<{ id: number; name?: string }>;
	visibleBranches?: Array<{ id: number; name?: string }>;
	userSubsidiary?: { id: number };
}): PreloadedTestState => ({
	auth: {
		user: {
			branch: opts.userBranch,
			branch_id: opts.userBranchId,
			subsidiary: opts.userSubsidiary,
			access: { branches: opts.accessBranches ?? [] },
			visible: { branches: opts.visibleBranches ?? [] },
		},
	},
	personalizacion: {
		personalizacionUsuario: {
			sucursal_principal: opts.sucursalPrincipal,
			subsidiary_id: opts.subsidiaryIdPers,
		},
	},
});

describe('useCurrentBranch', () => {
	it('prioriza sucursal_principal de la personalización', () => {
		const { result } = renderHookWithStore(
			() => useCurrentBranch(),
			buildState({ sucursalPrincipal: 10, userBranch: { id: 99 } }),
		);
		expect(result.current.branchId).toBe(10);
		expect(result.current.hasValidBranch).toBe(true);
	});

	it('cae a user.branch.id cuando no hay sucursal_principal', () => {
		const { result } = renderHookWithStore(
			() => useCurrentBranch(),
			buildState({ userBranch: { id: 42 } }),
		);
		expect(result.current.branchId).toBe(42);
	});

	it('cae a user.branch_id como último recurso', () => {
		const { result } = renderHookWithStore(
			() => useCurrentBranch(),
			buildState({ userBranchId: 7 }),
		);
		expect(result.current.branchId).toBe(7);
	});

	it('branchId null y hasValidBranch false cuando no hay ninguna fuente', () => {
		const { result } = renderHookWithStore(() => useCurrentBranch(), buildState({}));
		expect(result.current.branchId).toBeNull();
		expect(result.current.hasValidBranch).toBe(false);
	});

	it('normaliza y deduplica visibleBranches desde access + visible', () => {
		const { result } = renderHookWithStore(
			() => useCurrentBranch(),
			buildState({
				accessBranches: [{ id: 1, name: 'A' }],
				visibleBranches: [
					{ id: 1, name: 'A dup' },
					{ id: 2, name: 'B' },
				],
			}),
		);
		expect(result.current.visibleBranches).toEqual([
			{ id: 1, name: 'A' },
			{ id: 2, name: 'B' },
		]);
	});

	it('resuelve subsidiaryId desde el subsidiary del usuario', () => {
		const { result } = renderHookWithStore(
			() => useCurrentBranch(),
			buildState({ sucursalPrincipal: 5, userSubsidiary: { id: 88 } }),
		);
		expect(result.current.subsidiaryId).toBe(88);
	});
});
