import React from 'react';
import { FormikProps } from 'formik';
// Button removed: global save button is in UserPermissionsDetail
import Label from '@/components/form/Label';
import Checkbox from '@/components/form/Checkbox';
import Badge from '@/components/ui/Badge';
import { formatRoleName } from '@/pages/admin/Permission/utils/formatters';
import type { UserPermissionsFormValues } from '../types';

type RoleOption = { value: string; label: string };

interface RolesTabProps {
	formik: FormikProps<UserPermissionsFormValues>;
	roleOptions: RoleOption[];
	currentRoles: string[];
	editable?: boolean;
}

const RolesTab: React.FC<RolesTabProps> = ({
	formik,
	roleOptions,
	currentRoles,
	editable = true,
}) => {
	return (
		<form onSubmit={formik.handleSubmit} className='space-y-6'>
			<div>
				<Label htmlFor='roles'>Roles Asignados</Label>
				<p className='mb-2 text-sm text-zinc-500'>
					Selecciona los roles que tendrá este usuario
				</p>
				<div className='grid grid-cols-2 gap-2'>
					{roleOptions.map((opt) => {
						const checked = formik.values.roles.includes(opt.value as string);
						return (
							<label key={opt.value} className='flex items-center gap-2'>
								<Checkbox
									checked={checked}
									disabled={!editable}
									onChange={() => {
										if (!editable) return;
										const next = new Set(formik.values.roles);
										if (next.has(opt.value as string))
											next.delete(opt.value as string);
										else next.add(opt.value as string);
										formik.setFieldValue('roles', Array.from(next));
									}}
								/>
								<span className='text-sm'>
									{formatRoleName(opt.label as string)}
								</span>
							</label>
						);
					})}
				</div>
				{formik.touched.roles && formik.errors.roles && (
					<p className='mt-1 text-xs text-red-500'>{formik.errors.roles}</p>
				)}
				{!editable && (
					<p className='mt-2 text-xs text-zinc-500'>
						No tienes permisos para modificar los roles de este usuario.
					</p>
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
		</form>
	);
};

export default RolesTab;
