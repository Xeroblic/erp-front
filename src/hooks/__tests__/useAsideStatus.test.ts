import { describe, it, expect, vi } from 'vitest';
import { createElement, PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';
import ThemeContext, { IThemeContextProps } from '../../context/themeContext';
import useAsideStatus from '../useAsideStatus';

const makeWrapper = (value: Partial<IThemeContextProps>) => {
	return ({ children }: PropsWithChildren) =>
		createElement(ThemeContext.Provider, { value: value as IThemeContextProps }, children);
};

describe('useAsideStatus', () => {
	it('devuelve asideStatus desde el ThemeContext', () => {
		const { result } = renderHook(() => useAsideStatus(), {
			wrapper: makeWrapper({ asideStatus: true, setAsideStatus: vi.fn() }),
		});
		expect(result.current.asideStatus).toBe(true);
	});

	it('refleja asideStatus=false', () => {
		const { result } = renderHook(() => useAsideStatus(), {
			wrapper: makeWrapper({ asideStatus: false, setAsideStatus: vi.fn() }),
		});
		expect(result.current.asideStatus).toBe(false);
	});

	it('expone la función setAsideStatus del contexto', () => {
		const setAsideStatus = vi.fn();
		const { result } = renderHook(() => useAsideStatus(), {
			wrapper: makeWrapper({ asideStatus: true, setAsideStatus }),
		});
		expect(result.current.setAsideStatus).toBe(setAsideStatus);
	});

	it('setAsideStatus invoca al setter del contexto', () => {
		const setAsideStatus = vi.fn();
		const { result } = renderHook(() => useAsideStatus(), {
			wrapper: makeWrapper({ asideStatus: false, setAsideStatus }),
		});
		result.current.setAsideStatus(true);
		expect(setAsideStatus).toHaveBeenCalledWith(true);
	});

	it('propaga cambios del contexto en un re-render', () => {
		const { result, rerender } = renderHook(() => useAsideStatus(), {
			wrapper: makeWrapper({ asideStatus: true, setAsideStatus: vi.fn() }),
		});
		expect(result.current.asideStatus).toBe(true);
		rerender();
		expect(result.current.asideStatus).toBe(true);
	});
});
