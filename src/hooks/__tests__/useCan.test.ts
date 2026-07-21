import { describe, it, expect } from 'vitest';
import useCan from '../useCan';
import { buildAuthState, renderHookWithStore } from '@/test-utils/renderWithStore';

describe('useCan', () => {
	it('has() refleja los permisos del usuario', () => {
		const { result } = renderHookWithStore(
			() => useCan(),
			buildAuthState({ permisos: ['edit-sale', 'view-reports'] }),
		);

		expect(result.current.has('edit-sale')).toBe(true);
		expect(result.current.has('delete-sale')).toBe(false);
	});

	it('any() es OR y all() es AND sobre la lista de permisos', () => {
		const { result } = renderHookWithStore(
			() => useCan(),
			buildAuthState({ permisos: ['edit-sale'] }),
		);

		expect(result.current.any(['edit-sale', 'delete-sale'])).toBe(true);
		expect(result.current.all(['edit-sale', 'delete-sale'])).toBe(false);
		expect(result.current.all(['edit-sale'])).toBe(true);
	});

	it('any()/all() con lista vacía devuelven true (sin requisitos)', () => {
		const { result } = renderHookWithStore(() => useCan(), buildAuthState({ permisos: [] }));

		expect(result.current.any([])).toBe(true);
		expect(result.current.all([])).toBe(true);
	});

	it('super-admin pasa cualquier chequeo de permiso o rol', () => {
		const { result } = renderHookWithStore(
			() => useCan(),
			buildAuthState({ roles: ['super-admin'] }),
		);

		expect(result.current.isSuperAdmin).toBe(true);
		expect(result.current.has('cualquier-permiso-inexistente')).toBe(true);
		expect(result.current.hasRole('cualquier-rol')).toBe(true);
		expect(result.current.isAdmin).toBe(true);
	});

	it('isAdmin es true para roles administrativos y expone perms/roles', () => {
		const { result } = renderHookWithStore(
			() => useCan(),
			buildAuthState({ permisos: ['p1'], roles: ['branch-admin'] }),
		);

		expect(result.current.isAdmin).toBe(true);
		expect(result.current.isSuperAdmin).toBe(false);
		expect(result.current.perms).toEqual(['p1']);
		expect(result.current.roles).toEqual(['branch-admin']);
	});
});
