import React from 'react';
import { FormikProps } from 'formik';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Badge from '@/components/ui/Badge';
import { formatPermissionName } from '@/pages/admin/Permission/utils/formatters';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import type { UserPermissionsFormValues } from '../types';

interface PermisosTabProps {
	formik: FormikProps<UserPermissionsFormValues>;
	permissionOptions: TSelectOption[];
	currentPermissions: string[];
	user: UserWithDetails;
	onCancel: () => void;
}

const PermisosTab: React.FC<PermisosTabProps> = ({
	formik,
	permissionOptions,
	currentPermissions,
	user,
	onCancel,
}) => {
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
								label: formatPermissionName(permName),
							}
						);
					})}
					onChange={(newValue) => {
						const permisos = Array.isArray(newValue)
							? newValue.map((o) => o.value)
							: [];
						formik.setFieldValue('permisos', permisos);
					}}
				/>
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
									{formatPermissionName(perm)}
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
										{formatPermissionName(perm)}
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

			<div className='flex justify-end gap-2'>
				<Button variant='outline' onClick={onCancel}>
					Cancelar
				</Button>
				<button type='submit'>
					<Button variant='solid' color='blue' isDisable={formik.isSubmitting}>
						{formik.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
					</Button>
				</button>
			</div>
		</form>
	);
};

export default PermisosTab;
