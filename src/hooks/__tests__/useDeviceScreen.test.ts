import { describe, it, expect } from 'vitest';
import { renderHook, act as rtlAct } from '@testing-library/react';
import useDeviceScreen from '../useDeviceScreen';

describe('useDeviceScreen', () => {
	it('lee el ancho y alto actuales de window', () => {
		const { result } = renderHook(() => useDeviceScreen());
		expect(result.current.width).toBe(window.innerWidth);
		expect(result.current.height).toBe(window.innerHeight);
	});

	it('expone las dimensiones de la pantalla', () => {
		const { result } = renderHook(() => useDeviceScreen());
		expect(result.current.screenWidth).toBe(window.screen.width);
		expect(result.current.screenHeight).toBe(window.screen.height);
	});

	it('expone flags de orientación (portrait/landscape) como booleanos', () => {
		const { result } = renderHook(() => useDeviceScreen());
		expect(typeof result.current.portrait).toBe('boolean');
		expect(typeof result.current.landscape).toBe('boolean');
	});

	it('recalcula las dimensiones al hacer resize de window', () => {
		const { result } = renderHook(() => useDeviceScreen());

		rtlAct(() => {
			(window as unknown as { innerWidth: number }).innerWidth = 375;
			(window as unknown as { innerHeight: number }).innerHeight = 812;
			window.dispatchEvent(new Event('resize'));
		});

		expect(result.current.width).toBe(375);
		expect(result.current.height).toBe(812);
	});

	it('deja de escuchar el resize tras desmontar', () => {
		const { result, unmount } = renderHook(() => useDeviceScreen());
		unmount();

		rtlAct(() => {
			(window as unknown as { innerWidth: number }).innerWidth = 1024;
			window.dispatchEvent(new Event('resize'));
		});

		// El valor no cambia porque el listener ya fue removido
		expect(result.current.width).not.toBe(1024);
	});
});
