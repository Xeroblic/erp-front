import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const dirMock = vi.fn(() => 'ltr');

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: dirMock } }),
}));

import useDir from '../useDir';

describe('useDir', () => {
	beforeEach(() => {
		dirMock.mockReturnValue('ltr');
	});

	it('devuelve dir="ltr" e isLTR=true por defecto', () => {
		const { result } = renderHook(() => useDir());
		expect(result.current.dir).toBe('ltr');
		expect(result.current.isLTR).toBe(true);
		expect(result.current.isRTL).toBe(false);
	});

	it('marca isRTL cuando i18n.dir() devuelve "rtl"', () => {
		dirMock.mockReturnValue('rtl');
		const { result } = renderHook(() => useDir());
		expect(result.current.dir).toBe('rtl');
		expect(result.current.isRTL).toBe(true);
		expect(result.current.isLTR).toBe(false);
	});

	it('isLTR e isRTL son siempre opuestos', () => {
		const { result } = renderHook(() => useDir());
		expect(result.current.isLTR).toBe(!result.current.isRTL);
	});

	it('refleja el valor exacto retornado por i18n.dir()', () => {
		dirMock.mockReturnValue('rtl');
		const { result } = renderHook(() => useDir());
		expect(result.current.dir).toBe('rtl');
	});

	it('consulta i18n.dir en cada render', () => {
		dirMock.mockClear();
		renderHook(() => useDir());
		expect(dirMock).toHaveBeenCalled();
	});
});
