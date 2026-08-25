import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
	getHardwareVisualValidationMessage,
	type HardwareAbsenceFields,
	type HardwareAbsenceSetters,
	useHardwareAbsence,
} from '../useHardwareAbsence';

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
		const setHasNoRam = vi.fn<HardwareAbsenceSetters<HardwareAbsenceFields>['setHasNoRam']>();
		const setRamSize = vi.fn<HardwareAbsenceSetters<HardwareAbsenceFields>['setRamSize']>();
		const setRamSlots = vi.fn<HardwareAbsenceSetters<HardwareAbsenceFields>['setRamSlots']>();
		const setRamType = vi.fn<HardwareAbsenceSetters<HardwareAbsenceFields>['setRamType']>();
		const setHasNoStorage =
			vi.fn<HardwareAbsenceSetters<HardwareAbsenceFields>['setHasNoStorage']>();
		const setStorageSize =
			vi.fn<HardwareAbsenceSetters<HardwareAbsenceFields>['setStorageSize']>();
		const setStorageTechnology =
			vi.fn<HardwareAbsenceSetters<HardwareAbsenceFields>['setStorageTechnology']>();
		const setters: HardwareAbsenceSetters<HardwareAbsenceFields> = {
			setHasNoRam,
			setRamSize,
			setRamSlots,
			setRamType,
			setHasNoStorage,
			setStorageSize,
			setStorageTechnology,
		};
		const { result } = renderHook(() => useHardwareAbsence(setters));

		act(() => {
			result.current.setRamAbsence(true);
			result.current.setStorageAbsence(true);
		});

		expect(setHasNoRam).toHaveBeenCalledWith(true, {
			shouldDirty: true,
			shouldValidate: true,
		});
		expect(setRamSize).toHaveBeenCalledWith('', {
			shouldDirty: true,
			shouldValidate: false,
		});
		expect(setRamSlots).toHaveBeenCalledWith('', {
			shouldDirty: true,
			shouldValidate: false,
		});
		expect(setRamType).toHaveBeenCalledWith(undefined, {
			shouldDirty: true,
			shouldValidate: false,
		});
		expect(setHasNoStorage).toHaveBeenCalledWith(true, {
			shouldDirty: true,
			shouldValidate: true,
		});
		expect(setStorageSize).toHaveBeenCalledWith('', {
			shouldDirty: true,
			shouldValidate: false,
		});
		expect(setStorageTechnology).toHaveBeenCalledWith(undefined, {
			shouldDirty: true,
			shouldValidate: false,
		});
	});
});
