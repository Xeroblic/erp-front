import { act, renderHook } from '@testing-library/react';
import type { FieldValues, UseFormSetValue } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { getHardwareVisualValidationMessage, useHardwareAbsence } from '../useHardwareAbsence';

describe('useHardwareAbsence', () => {
	it('names only the hardware groups that are actually pending', () => {
		expect(getHardwareVisualValidationMessage(false, true)).toBe(
			'Debes completar el tamaño y la tecnología de almacenamiento, ya que pueden revisarse visualmente.',
		);
		expect(getHardwareVisualValidationMessage(true, false)).toBe(
			'Debes completar el tamaño, los slots y el tipo de RAM, ya que pueden revisarse visualmente.',
		);
		expect(getHardwareVisualValidationMessage(true, true)).toBe(
			'Debes completar el tamaño, los slots y el tipo de RAM y el tamaño y la tecnología de almacenamiento, ya que pueden revisarse visualmente.',
		);
	});

	it('clears every dependent field when RAM and storage become absent', () => {
		const setValue = vi.fn() as unknown as UseFormSetValue<FieldValues>;
		const { result } = renderHook(() => useHardwareAbsence(setValue));

		act(() => {
			result.current.setRamAbsence(true);
			result.current.setStorageAbsence(true);
		});

		expect(setValue).toHaveBeenCalledWith('has_no_ram', true, {
			shouldDirty: true,
			shouldValidate: true,
		});
		expect(setValue).toHaveBeenCalledWith('ram_size', '', {
			shouldDirty: true,
			shouldValidate: false,
		});
		expect(setValue).toHaveBeenCalledWith('ram_slots', '', {
			shouldDirty: true,
			shouldValidate: false,
		});
		expect(setValue).toHaveBeenCalledWith('ram_type', undefined, {
			shouldDirty: true,
			shouldValidate: false,
		});
		expect(setValue).toHaveBeenCalledWith('has_no_storage', true, {
			shouldDirty: true,
			shouldValidate: true,
		});
		expect(setValue).toHaveBeenCalledWith('storage_size', '', {
			shouldDirty: true,
			shouldValidate: false,
		});
		expect(setValue).toHaveBeenCalledWith('storage_technology', undefined, {
			shouldDirty: true,
			shouldValidate: false,
		});
	});
});
