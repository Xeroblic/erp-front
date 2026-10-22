import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const dirMock = vi.fn(() => 'ltr');

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: dirMock } }),
}));

import useDir from '../useDir';

describe('useDir', () => {
	it('marca isRTL cuando i18n.dir() devuelve "rtl"', () => {
		dirMock.mockReturnValue('rtl');
		const { result } = renderHook(() => useDir());
		expect(result.current.dir).toBe('rtl');
		expect(result.current.isRTL).toBe(true);
		expect(result.current.isLTR).toBe(false);
	});
});
