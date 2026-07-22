import { describe, it, expect } from 'vitest';
import useDarkMode from '../useDarkMode';
import { renderHookWithStore } from '@/test-utils/renderWithStore';

const withDarkMode = (darkMode: string) => ({ personalizacion: { darkMode } });

describe('useDarkMode', () => {
	it('expone darkModeStatus desde el store', () => {
		const { result } = renderHookWithStore(() => useDarkMode(), withDarkMode('dark'));
		expect(result.current.darkModeStatus).toBe('dark');
	});

	it('isDarkTheme es true cuando darkMode === "dark"', () => {
		const { result } = renderHookWithStore(() => useDarkMode(), withDarkMode('dark'));
		expect(result.current.isDarkTheme).toBe(true);
	});

	it('isDarkTheme es false cuando darkMode === "light"', () => {
		const { result } = renderHookWithStore(() => useDarkMode(), withDarkMode('light'));
		expect(result.current.isDarkTheme).toBe(false);
	});

	it('con "system" depende de matchMedia (stub => no dark)', () => {
		const { result } = renderHookWithStore(() => useDarkMode(), withDarkMode('system'));
		expect(result.current.isDarkTheme).toBe(false);
	});

	it('expone la función setDarkModeStatus', () => {
		const { result } = renderHookWithStore(() => useDarkMode(), withDarkMode('light'));
		expect(typeof result.current.setDarkModeStatus).toBe('function');
	});
});
