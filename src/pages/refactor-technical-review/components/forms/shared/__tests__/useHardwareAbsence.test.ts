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

	it('preserves the hardware values when absence is activated and reverted', () => {
		const values = {
			has_no_ram: false,
			has_no_storage: false,
			ram_size: '8GB',
			ram_slots: '2',
			ram_type: 'DDR4',
			storage_size: '512GB',
			storage_technology: 'ssd',
		};
		const setHasNoRam = vi.fn<HardwareAbsenceSetters<HardwareAbsenceFields>['setHasNoRam']>(
			(value) => {
				values.has_no_ram = value;
			},
		);
		const setHasNoStorage = vi.fn<
			HardwareAbsenceSetters<HardwareAbsenceFields>['setHasNoStorage']
		>((value) => {
			values.has_no_storage = value;
		});
		const setters: HardwareAbsenceSetters<HardwareAbsenceFields> = {
			setHasNoRam,
			setHasNoStorage,
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
		expect(setHasNoStorage).toHaveBeenCalledWith(true, {
			shouldDirty: true,
			shouldValidate: true,
		});
		expect(values).toMatchObject({
			has_no_ram: true,
			has_no_storage: true,
			ram_size: '8GB',
			ram_slots: '2',
			ram_type: 'DDR4',
			storage_size: '512GB',
			storage_technology: 'ssd',
		});

		act(() => {
			result.current.setRamAbsence(false);
			result.current.setStorageAbsence(false);
		});

		expect(values).toEqual({
			has_no_ram: false,
			has_no_storage: false,
			ram_size: '8GB',
			ram_slots: '2',
			ram_type: 'DDR4',
			storage_size: '512GB',
			storage_technology: 'ssd',
		});
	});
});
