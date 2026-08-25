import { useCallback } from 'react';
import type { FieldPath, FieldPathValue, FieldValues, UseFormSetValue } from 'react-hook-form';

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

export const useHardwareAbsence = <TFieldValues extends FieldValues>(
	setValue: UseFormSetValue<TFieldValues>,
) => {
	const setHardwareValue = useCallback(
		(field: string, value: boolean | string | undefined, shouldValidate = false) => {
			const fieldPath = field as FieldPath<TFieldValues>;
			setValue(fieldPath, value as FieldPathValue<TFieldValues, typeof fieldPath>, {
				shouldDirty: true,
				shouldValidate,
			});
		},
		[setValue],
	);

	const setRamAbsence = useCallback(
		(active: boolean) => {
			setHardwareValue('has_no_ram', active, true);
			if (active) {
				setHardwareValue('ram_size', '');
				setHardwareValue('ram_slots', '');
				setHardwareValue('ram_type', undefined);
			}
		},
		[setHardwareValue],
	);

	const setStorageAbsence = useCallback(
		(active: boolean) => {
			setHardwareValue('has_no_storage', active, true);
			if (active) {
				setHardwareValue('storage_size', '');
				setHardwareValue('storage_technology', undefined);
			}
		},
		[setHardwareValue],
	);

	return { setRamAbsence, setStorageAbsence };
};
