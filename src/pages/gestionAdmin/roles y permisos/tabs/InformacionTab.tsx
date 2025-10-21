import React from 'react';
import Badge from '@/components/ui/Badge';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';

interface InformacionTabProps {
	user: UserWithDetails;
	displayName: string;
	cargoResolved: string;
	companyResolved: string;
	uniqueRoles: string[];
	directPermissionsCount: number;
	totalPermissionsCount: number;
}

const InformacionTab: React.FC<InformacionTabProps> = ({
	user,
	displayName,
	cargoResolved,
	companyResolved,
	uniqueRoles,
	directPermissionsCount,
	totalPermissionsCount,
}) => {
	return (
		<div className='space-y-6'>
			<h3 className='text-lg font-semibold'>Información del Usuario</h3>
			<div className='grid gap-4 md:grid-cols-2'>
				<div>
					<p className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>Nombre</p>
					<p className='mt-1 text-sm'>{user.first_name || '—'}</p>
				</div>
				<div>
					<p className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>Apellido</p>
					<p className='mt-1 text-sm'>{user.last_name || '—'}</p>
				</div>
				<div>
					<p className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>Email</p>
					<p className='mt-1 text-sm'>{user.email}</p>
				</div>
				<div>
					<p className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>Cargo</p>
					<p className='mt-1 text-sm'>{cargoResolved}</p>
				</div>
				<div>
					<p className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>Empresa</p>
					<p className='mt-1 text-sm'>{companyResolved}</p>
				</div>
				<div>
					<p className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>Estado</p>
					<Badge className='mt-1' color={user.is_active ? 'emerald' : 'red'}>
						{user.is_active ? 'Activo' : 'Inactivo'}
					</Badge>
				</div>
			</div>

			<div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
				<h4 className='mb-2 font-semibold text-blue-900 dark:text-blue-300'>
					Resumen de Permisos
				</h4>
				<div className='grid gap-3 md:grid-cols-3'>
					<div>
						<p className='text-sm text-blue-700 dark:text-blue-400'>Roles Asignados</p>
						<p className='text-2xl font-bold text-blue-900 dark:text-blue-300'>
							{uniqueRoles.length}
						</p>
					</div>
					<div>
						<p className='text-sm text-blue-700 dark:text-blue-400'>
							Permisos Directos
						</p>
						<p className='text-2xl font-bold text-blue-900 dark:text-blue-300'>
							{directPermissionsCount}
						</p>
					</div>
					<div>
						<p className='text-sm text-blue-700 dark:text-blue-400'>Permisos Totales</p>
						<p className='text-2xl font-bold text-blue-900 dark:text-blue-300'>
							{totalPermissionsCount}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default InformacionTab;
