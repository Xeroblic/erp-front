import React from 'react';
import { FormikProps } from 'formik';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Badge from '@/components/ui/Badge';
import { formatRoleName } from '@/pages/admin/Permission/utils/formatters';
import type { UserPermissionsFormValues } from '../types';

interface RolesTabProps {
	formik: FormikProps<UserPermissionsFormValues>;
	roleOptions: TSelectOption[];
	currentRoles: string[];
	onCancel: () => void;
}

const RolesTab: React.FC<RolesTabProps> = ({ formik, roleOptions, currentRoles, onCancel }) => {
	return (
		<form onSubmit={formik.handleSubmit} className='space-y-6'>
			<div>
				<Label htmlFor='roles'>Roles Asignados</Label>
				<p className='mb-2 text-sm text-zinc-500'>
					Selecciona los roles que tendrá este usuario
				</p>
				<SelectReact
					id='roles'
					name='roles'
					isMulti
					options={roleOptions}
					value={formik.values.roles.map((roleName) => {
						const option = roleOptions.find((opt) => opt.value === roleName);
						return (
							option ?? {
								value: roleName,
								label: formatRoleName(roleName),
							}
						);
					})}
					onChange={(newValue) => {
						const roles = Array.isArray(newValue) ? newValue.map((o) => o.value) : [];
						formik.setFieldValue('roles', roles);
					}}
				/>
				{formik.touched.roles && formik.errors.roles && (
					<p className='mt-1 text-xs text-red-500'>{formik.errors.roles}</p>
				)}
			</div>

			<div className='rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800'>
				<h4 className='mb-3 font-semibold'>Roles Actuales ({currentRoles.length})</h4>
				<div className='flex flex-wrap gap-2'>
					{currentRoles.length > 0 ? (
						currentRoles.map((role) => (
							<Badge key={role} color='blue'>
								{formatRoleName(role)}
							</Badge>
						))
					) : (
						<p className='text-sm text-zinc-500'>Sin roles asignados</p>
					)}
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

export default RolesTab;
