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
	setHasNoStorage: (
		value: boolean & NonNullable<TFieldValues['has_no_storage']>,
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
	setHasNoStorage,
}: HardwareAbsenceSetters<TFieldValues>) => {
	const setRamAbsence = useCallback(
		(active: boolean) => {
			setHasNoRam(active, {
				shouldDirty: true,
				shouldValidate: true,
			});
		},
		[setHasNoRam],
	);

	const setStorageAbsence = useCallback(
		(active: boolean) => {
			setHasNoStorage(active, {
				shouldDirty: true,
				shouldValidate: true,
			});
		},
		[setHasNoStorage],
	);

	return { setRamAbsence, setStorageAbsence };
};
