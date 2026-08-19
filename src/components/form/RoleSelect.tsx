import React, { type ComponentProps, type FC, useMemo } from 'react';
import type { SingleValue } from 'react-select';
import SelectReact, { type TSelectOption } from './SelectReact';
import type { Role } from '@/store/slices/permissions/permissionsSlice';
import { isSuperAdminRole, resolveRoleLabel } from '@/pages/admin/Permission/utils/formatters';

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
			// Se evalúa el slug canónico: `display_name` ("Super administrador")
			// no coincide con la clave "superadmin" y dejaba pasar el rol.
			return !isSuperAdminRole(role.name);
		});
	}, [roles, hideSuperAdmin]);

	const options = useMemo<TSelectOption[]>(() => {
		return filteredRoles
			.map((role) => ({
				value: String(role.id),
				label: resolveRoleLabel(role),
			}))
			.sort((a, b) => a.label.localeCompare(b.label, 'es'));
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
