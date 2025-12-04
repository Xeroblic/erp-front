import React, { type ComponentProps, type FC, useMemo } from 'react';
import type { SingleValue } from 'react-select';
import SelectReact, { type TSelectOption } from './SelectReact';
import type { Role } from '@/store/slices/permissions/permissionsSlice';
import { formatRoleName, normalizeRoleKey } from '@/pages/admin/Permission/utils/formatters';

type SelectProps = ComponentProps<typeof SelectReact>;

interface RoleSelectProps extends Omit<SelectProps, 'options' | 'value' | 'onChange' | 'isMulti'> {
	roles: Role[];
	value: string;
	onChange: (roleId: string) => void;
	hideSuperAdmin?: boolean;
}

const RoleSelect: FC<RoleSelectProps> = ({
	roles,
	value,
	onChange,
	hideSuperAdmin = false,
	isLoading,
	isDisabled,
	placeholder,
	...selectProps
}) => {
	const filteredRoles = useMemo(() => {
		return roles.filter((role) => {
			if (!hideSuperAdmin) return true;
			const normalized = normalizeRoleKey(role.display_name || role.name);
			return normalized !== 'superadmin';
		});
	}, [roles, hideSuperAdmin]);

	const options = useMemo<TSelectOption[]>(() => {
		return filteredRoles.map((role) => ({
			value: String(role.id),
			label: formatRoleName(role.display_name || role.name),
		}));
	}, [filteredRoles]);

	const selectedOption = useMemo(() => {
		return options.find((option) => option.value === value) ?? null;
	}, [options, value]);

	const computedPlaceholder =
		placeholder ??
		(isLoading
			? 'Cargando roles...'
			: options.length
				? 'Selecciona un rol'
				: 'No hay roles disponibles');

	return (
		<SelectReact
			{...selectProps}
			placeholder={computedPlaceholder}
			isDisabled={Boolean(isDisabled) || (!isLoading && options.length === 0)}
			isLoading={isLoading}
			options={options}
			value={selectedOption}
			onChange={(option) => {
				const selected = option as SingleValue<TSelectOption>;
				onChange(selected?.value ?? '');
			}}
		/>
	);
};

export default RoleSelect;
