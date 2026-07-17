import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import useSaveBtn from '../useSaveBtn';
import SAVE_BTN_STATUS from '../../constants/common/saveBtn.constant';

describe('useSaveBtn', () => {
	it('muestra SAVING mientras isSaving es true (tiene prioridad)', () => {
		const { result } = renderHook(() =>
			useSaveBtn({ isNewItem: true, isSaving: true, isDirty: true }),
		);

		expect(result.current.saveBtnText).toBe(SAVE_BTN_STATUS.SAVING);
		expect(result.current.saveBtnColor).toBe('emerald');
	});

	it('muestra PUBLISH cuando es un item nuevo y no está guardando', () => {
		const { result } = renderHook(() =>
			useSaveBtn({ isNewItem: true, isSaving: false, isDirty: false }),
		);

		expect(result.current.saveBtnText).toBe(SAVE_BTN_STATUS.PUBLISH);
		expect(result.current.saveBtnColor).toBe('blue');
	});

	it('muestra SAVED cuando el item existe y no hay cambios', () => {
		const { result } = renderHook(() =>
			useSaveBtn({ isNewItem: false, isSaving: false, isDirty: false }),
		);

		expect(result.current.saveBtnText).toBe(SAVE_BTN_STATUS.SAVED);
	});

	it('muestra SAVE cuando el item existe y hay cambios pendientes', () => {
		const { result } = renderHook(() =>
			useSaveBtn({ isNewItem: false, isSaving: false, isDirty: true }),
		);

		expect(result.current.saveBtnText).toBe(SAVE_BTN_STATUS.SAVE);
	});

	it('deshabilita el botón solo si el item existe y no está sucio', () => {
		const { result: disabled } = renderHook(() =>
			useSaveBtn({ isNewItem: false, isSaving: false, isDirty: false }),
		);
		const { result: enabled } = renderHook(() =>
			useSaveBtn({ isNewItem: false, isSaving: false, isDirty: true }),
		);

		expect(disabled.current.saveBtnDisable).toBe(true);
		expect(enabled.current.saveBtnDisable).toBe(false);
	});
});
