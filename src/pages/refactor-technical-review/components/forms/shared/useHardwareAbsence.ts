import { useCallback } from 'react';
import type { FieldValues, SetValueConfig } from 'react-hook-form';

export interface HardwareAbsenceFields extends FieldValues {
	has_no_ram?: boolean;
	has_no_storage?: boolean;
	ram_size?: string;
	ram_slots?: string;
	ram_type?: string | undefined;
	storage_size?: string;
	storage_technology?: string | undefined;
}

export interface HardwareAbsenceSetters<TFieldValues extends HardwareAbsenceFields> {
	setHasNoRam: (
		value: boolean & NonNullable<TFieldValues['has_no_ram']>,
		options: SetValueConfig,
	) => void;
	setRamSize: (
		value: '' & NonNullable<TFieldValues['ram_size']>,
		options: SetValueConfig,
	) => void;
	setRamSlots: (
		value: '' & NonNullable<TFieldValues['ram_slots']>,
		options: SetValueConfig,
	) => void;
	setRamType: (value: undefined & TFieldValues['ram_type'], options: SetValueConfig) => void;
	setHasNoStorage: (
		value: boolean & NonNullable<TFieldValues['has_no_storage']>,
		options: SetValueConfig,
	) => void;
	setStorageSize: (
		value: '' & NonNullable<TFieldValues['storage_size']>,
		options: SetValueConfig,
	) => void;
	setStorageTechnology: (
		value: undefined & TFieldValues['storage_technology'],
		options: SetValueConfig,
	) => void;
}

export const getHardwareVisualValidationMessage = (
	missingRam: boolean,
	missingStorage: boolean,
): string => {
	const missingGroups = [
		missingRam ? 'el tamaño, los slots y el tipo de RAM' : null,
		missingStorage ? 'el tamaño y la tecnología de almacenamiento' : null,
	].filter((group): group is string => group !== null);

	const fields =
		missingGroups.length === 2
			? `${missingGroups[0]} y ${missingGroups[1]}`
			: (missingGroups[0] ?? 'los campos de hardware requeridos');

	return `Debes completar ${fields}, ya que pueden revisarse visualmente.`;
};

export const useHardwareAbsence = <TFieldValues extends HardwareAbsenceFields>({
	setHasNoRam,
	setRamSize,
	setRamSlots,
	setRamType,
	setHasNoStorage,
	setStorageSize,
	setStorageTechnology,
}: HardwareAbsenceSetters<TFieldValues>) => {
	const setRamAbsence = useCallback(
		(active: boolean) => {
			setHasNoRam(active, {
				shouldDirty: true,
				shouldValidate: true,
			});
			if (active) {
				setRamSize('', { shouldDirty: true, shouldValidate: false });
				setRamSlots('', { shouldDirty: true, shouldValidate: false });
				setRamType(undefined, { shouldDirty: true, shouldValidate: false });
			}
		},
		[setHasNoRam, setRamSize, setRamSlots, setRamType],
	);

	const setStorageAbsence = useCallback(
		(active: boolean) => {
			setHasNoStorage(active, {
				shouldDirty: true,
				shouldValidate: true,
			});
			if (active) {
				setStorageSize('', { shouldDirty: true, shouldValidate: false });
				setStorageTechnology(undefined, { shouldDirty: true, shouldValidate: false });
			}
		},
		[setHasNoStorage, setStorageSize, setStorageTechnology],
	);

	return { setRamAbsence, setStorageAbsence };
};
