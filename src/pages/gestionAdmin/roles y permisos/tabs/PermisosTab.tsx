import React from 'react';
import { FormikProps } from 'formik';
// Local Button removed; global save is in header
import Label from '@/components/form/Label';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Badge from '@/components/ui/Badge';
import { usePermissionLabels } from '@/hooks/usePermissionLabels';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import type { UserPermissionsFormValues } from '../types';

interface PermisosTabProps {
	formik: FormikProps<UserPermissionsFormValues>;
	permissionOptions: TSelectOption[];
	currentPermissions: string[];
	user: UserWithDetails;
	editable?: boolean;
}

const PermisosTab: React.FC<PermisosTabProps> = ({
	formik,
	permissionOptions,
	currentPermissions,
	user,
	editable = true,
}) => {
	const { getPermissionLabel } = usePermissionLabels();

	return (
		<form onSubmit={formik.handleSubmit} className='space-y-6'>
			<div>
				<Label htmlFor='permisos'>Permisos Directos</Label>
				<p className='mb-2 text-sm text-zinc-500'>
					Asigna permisos específicos adicionales a los heredados por roles
				</p>
				<SelectReact
					id='permisos'
					name='permisos'
					isMulti
					options={permissionOptions}
					value={formik.values.permisos.map((permName) => {
						const option = permissionOptions.find((opt) => opt.value === permName);
						return (
							option ?? {
								value: permName,
								label: getPermissionLabel(permName),
							}
						);
					})}
					isDisabled={!editable}
					onChange={(newValue) => {
						if (!editable) return;
						const permisos = Array.isArray(newValue)
							? newValue.map((o) => o.value)
							: [];
						formik.setFieldValue('permisos', permisos);
					}}
				/>
				{!editable && (
					<p className='mt-2 text-xs text-zinc-500'>
						Visualización solamente. No cuentas con permisos para asignar permisos
						directos.
					</p>
				)}
			</div>

			<div className='grid gap-4 md:grid-cols-2'>
				<div className='rounded-lg bg-green-50 p-4 dark:bg-green-900/20'>
					<h4 className='mb-3 font-semibold text-green-900 dark:text-green-300'>
						Permisos Directos ({currentPermissions.length})
					</h4>
					<div className='flex flex-wrap gap-2'>
						{currentPermissions.length > 0 ? (
							currentPermissions.map((perm) => (
								<Badge key={perm} color='emerald' className='text-xs'>
									{getPermissionLabel(perm)}
								</Badge>
							))
						) : (
							<p className='text-sm text-green-700 dark:text-green-400'>
								Sin permisos directos
							</p>
						)}
					</div>
				</div>

				<div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
					<h4 className='mb-3 font-semibold text-blue-900 dark:text-blue-300'>
						Todos los Permisos ({user.all_permissions?.length ?? 0})
					</h4>
					<div className='max-h-48 overflow-y-auto'>
						<div className='flex flex-wrap gap-2'>
							{user.all_permissions && user.all_permissions.length > 0 ? (
								user.all_permissions.map((perm) => (
									<Badge key={perm} color='blue' className='text-xs'>
										{getPermissionLabel(perm)}
									</Badge>
								))
							) : (
								<p className='text-sm text-blue-700 dark:text-blue-400'>
									Sin permisos
								</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</form>
	);
};

export default PermisosTab;
