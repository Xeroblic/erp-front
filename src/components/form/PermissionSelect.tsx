import React, { type ComponentProps, type FC, useMemo } from 'react';
import SelectReact, { type TSelectOption } from './SelectReact';
import type { Permission } from '@/store/slices/permissions/permissionsSlice';
import { formatPermissionName } from '@/pages/admin/Permission/utils/formatters';
import type { MultiValue, SingleValue } from 'react-select';

type SelectProps = ComponentProps<typeof SelectReact>;

interface PermissionSelectProps
	extends Omit<SelectProps, 'options' | 'value' | 'onChange'> {
	permissions: Permission[];
	value: string[];
	onChange: (permissionCodes: string[]) => void;
	isMulti?: boolean;
}

const PermissionSelect: FC<PermissionSelectProps> = ({
	permissions,
	value,
	onChange,
	isMulti = true,
	isLoading,
	isDisabled,
	placeholder,
	...selectProps
}) => {
	const options = useMemo<TSelectOption[]>(() => {
		return permissions
			.map((permission) => {
				const optionValue = permission.code || permission.name;
				return {
					value: optionValue,
					label: formatPermissionName(optionValue),
				};
			})
			.sort((a, b) => a.label.localeCompare(b.label, 'es'));
	}, [permissions]);

	const multiSelectedOptions = useMemo(() => {
		return options.filter((option) => value.includes(option.value));
	}, [options, value]);

	const singleSelectedOption = useMemo(() => {
		const firstValue = value[0];
		return firstValue ? options.find((option) => option.value === firstValue) ?? null : null;
	}, [options, value]);

	const computedPlaceholder = placeholder
		?? (isLoading
			? 'Cargando permisos...'
			: options.length
				? isMulti
					? 'Selecciona permisos opcionales'
					: 'Selecciona un permiso'
				: 'No hay permisos disponibles');

	return (
		<SelectReact
			{...selectProps}
			isMulti={isMulti}
			placeholder={computedPlaceholder}
			isDisabled={Boolean(isDisabled) || (!isLoading && options.length === 0)}
			isLoading={isLoading}
			options={options}
			value={isMulti ? multiSelectedOptions : singleSelectedOption}
			onChange={(selection) => {
				if (isMulti) {
					const currentSelection = (selection ?? []) as MultiValue<TSelectOption>;
					onChange(currentSelection.map((option) => option.value));
					return;
				}
				const currentSelection = selection as SingleValue<TSelectOption>;
				onChange(currentSelection?.value ? [currentSelection.value] : []);
			}}
		/>
	);
};

export default PermissionSelect;
