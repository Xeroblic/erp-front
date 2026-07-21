import { describe, it, expect } from 'vitest';
import useAuthorization from '../useAuthorization';
import { buildAuthState, renderHookWithStore } from '@/test-utils/renderWithStore';

describe('useAuthorization', () => {
	it('chequea permisos: has/any/all', () => {
		const { result } = renderHookWithStore(
			() => useAuthorization(),
			buildAuthState({ permisos: ['a', 'b'] }),
		);
		expect(result.current.hasPermission('a')).toBe(true);
		expect(result.current.hasPermission('z')).toBe(false);
		expect(result.current.hasAnyPermission(['z', 'b'])).toBe(true);
		expect(result.current.hasAllPermissions(['a', 'z'])).toBe(false);
	});

	it('super-admin aprueba todo (permisos, roles y scope)', () => {
		const { result } = renderHookWithStore(
			() => useAuthorization(),
			buildAuthState({ permisos: ['super-admin'] }),
		);
		expect(result.current.isSuperAdmin).toBe(true);
		expect(result.current.hasPermission('lo-que-sea')).toBe(true);
		expect(result.current.canAccessBranch(123)).toBe(true);
		expect(result.current.authorize({ permission: 'nope', scope: 'access' })).toBe(true);
	});

	it('canAccessBranch: sin sucursales listadas no bloquea (set vacío => true)', () => {
		const { result } = renderHookWithStore(() => useAuthorization(), buildAuthState({}));
		expect(result.current.canAccessBranch(5)).toBe(true);
	});

	it('canAccessBranch respeta la membresía cuando hay sucursales de acceso', () => {
		const { result } = renderHookWithStore(
			() => useAuthorization(),
			buildAuthState({ accessBranches: [{ id: 1 }, { id: 2 }] }),
		);
		expect(result.current.canAccessBranch(1)).toBe(true);
		expect(result.current.canAccessBranch(99)).toBe(false);
		// branchId nulo/undefined nunca bloquea
		expect(result.current.canAccessBranch(null)).toBe(true);
	});

	it('authorize combina permiso Y scope (ambos deben pasar)', () => {
		const { result } = renderHookWithStore(
			() => useAuthorization(),
			buildAuthState({ permisos: ['edit'], accessBranches: [{ id: 1 }] }),
		);
		// permiso ok + sucursal accesible => true
		expect(result.current.authorize({ permission: 'edit', scope: 'access', branchId: 1 })).toBe(
			true,
		);
		// permiso ok pero sucursal fuera de acceso => false
		expect(
			result.current.authorize({ permission: 'edit', scope: 'access', branchId: 99 }),
		).toBe(false);
		// sucursal ok pero sin el permiso => false
		expect(
			result.current.authorize({ permission: 'delete', scope: 'access', branchId: 1 }),
		).toBe(false);
	});

	it('distingue view vs access en el scope', () => {
		const { result } = renderHookWithStore(
			() => useAuthorization(),
			buildAuthState({
				visibleBranches: [{ id: 10 }],
				accessBranches: [{ id: 20 }],
			}),
		);
		expect(result.current.canViewBranch(10)).toBe(true);
		expect(result.current.canViewBranch(20)).toBe(false);
		expect(result.current.canAccessBranch(20)).toBe(true);
		expect(result.current.canAccessBranch(10)).toBe(false);
	});
});
