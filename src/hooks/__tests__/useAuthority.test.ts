import { describe, it, expect } from 'vitest';
import useAuthority from '../useAuthority';
import { buildAuthState, renderHookWithStore } from '@/test-utils/renderWithStore';

describe('useAuthority', () => {
	it('devuelve !emptyCheck cuando falta authority o userAuthority', () => {
		// emptyCheck por defecto = true => retorna false
		const { result } = renderHookWithStore(() => useAuthority([], []), buildAuthState());
		expect(result.current).toBe(false);

		// emptyCheck = false => retorna true
		const { result: r2 } = renderHookWithStore(
			() => useAuthority([], [], false, false),
			buildAuthState(),
		);
		expect(r2.current).toBe(true);
	});

	it('concede acceso en modo OR si al menos un rol coincide', () => {
		const { result } = renderHookWithStore(
			() => useAuthority(['admin'], ['admin', 'editor']),
			buildAuthState(),
		);
		expect(result.current).toBe(true);
	});

	it('niega acceso en modo OR si ningún rol coincide', () => {
		const { result } = renderHookWithStore(
			() => useAuthority(['viewer'], ['admin', 'editor']),
			buildAuthState(),
		);
		expect(result.current).toBe(false);
	});

	it('en modo AND (requireAll) exige todos los roles', () => {
		const { result: ok } = renderHookWithStore(
			() => useAuthority(['admin', 'editor'], ['admin', 'editor'], true),
			buildAuthState(),
		);
		expect(ok.current).toBe(true);

		const { result: fail } = renderHookWithStore(
			() => useAuthority(['admin'], ['admin', 'editor'], true),
			buildAuthState(),
		);
		expect(fail.current).toBe(false);
	});

	it('super-admin (en el store) concede acceso sin importar los roles requeridos', () => {
		const { result } = renderHookWithStore(
			() => useAuthority(['viewer'], ['permiso-inexistente']),
			buildAuthState({ roles: ['super-admin'] }),
		);
		expect(result.current).toBe(true);
	});
});
