import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';

interface WarehouseInfoCardProps {
	warehouse: any;
}

const WarehouseInfoCard: React.FC<WarehouseInfoCardProps> = ({ warehouse }) => {
	return (
		<Card className='border-t-4 border-t-amber-500 shadow-sm transition-all hover:shadow-md dark:border-zinc-800'>
			<CardHeader className='bg-zinc-50/50 dark:bg-zinc-900/50'>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroInformationCircle' className='size-6 text-amber-500' />
					<CardTitle className='text-lg'>Información General</CardTitle>
				</div>
				<Badge variant='outline' color={warehouse.is_active ? 'emerald' : 'red'}>
					{warehouse.is_active ? 'Activa' : 'Inactiva'}
				</Badge>
			</CardHeader>
			<CardBody className='pt-6'>
				<div className='mb-6 border-b border-zinc-100 pb-6 dark:border-zinc-800'>
					<p className='text-sm text-zinc-500 dark:text-zinc-400'>Descripción</p>
					<p className='mt-1 text-base text-zinc-900 dark:text-zinc-100'>
						{warehouse.description || 'Sin descripción detallada disponible.'}
					</p>
				</div>

				<div className='grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
					<div className='flex items-start gap-3'>
						<div className='rounded-lg bg-blue-50 p-2 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400'>
							<Icon icon='HeroTag' className='size-5' />
						</div>
						<div>
							<p className='text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
								Nombre
							</p>
							<p className='font-semibold text-zinc-900 dark:text-zinc-100'>
								{warehouse.name}
							</p>
						</div>
					</div>
					<div className='flex items-start gap-3'>
						<div className='rounded-lg bg-emerald-50 p-2 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400'>
							<Icon icon='HeroQrCode' className='size-5' />
						</div>
						<div>
							<p className='text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
								Código
							</p>
							<p className='font-mono font-medium text-zinc-900 dark:text-zinc-100'>
								{warehouse.code}
							</p>
						</div>
					</div>
					<div className='flex items-start gap-3'>
						<div className='rounded-lg bg-violet-50 p-2 text-violet-500 dark:bg-violet-500/10 dark:text-violet-400'>
							<Icon icon='HeroBuildingOffice' className='size-5' />
						</div>
						<div>
							<p className='text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
								Sucursal
							</p>
							<p className='font-semibold text-zinc-900 dark:text-zinc-100'>
								{warehouse.branch_name || 'N/A'}
							</p>
						</div>
					</div>
					<div className='flex items-start gap-3'>
						<div className='rounded-lg bg-amber-50 p-2 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400'>
							<Icon icon='HeroMapPin' className='size-5' />
						</div>
						<div>
							<p className='text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
								Ubicación
							</p>
							<p className='font-medium text-zinc-900 dark:text-zinc-100'>
								{warehouse.address || 'N/A'}
							</p>
							<p className='text-xs text-zinc-500'>{warehouse.commune_name}</p>
						</div>
					</div>
					<div className='flex items-start gap-3'>
						<div className='rounded-lg bg-rose-50 p-2 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400'>
							<Icon icon='HeroUser' className='size-5' />
						</div>
						<div>
							<p className='text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
								Encargado
							</p>
							<p className='font-medium text-zinc-900 dark:text-zinc-100'>
								{warehouse.manager_name || 'Sin Asignar'}
							</p>
						</div>
					</div>
					<div className='flex items-start gap-3'>
						<div className='rounded-lg bg-cyan-50 p-2 text-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-400'>
							<Icon icon='HeroClock' className='size-5' />
						</div>
						<div>
							<p className='text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
								Horario
							</p>
							<p className='font-medium text-zinc-900 dark:text-zinc-100'>
								{warehouse.schedule || 'N/A'}
							</p>
						</div>
					</div>
					<div className='flex items-start gap-3'>
						<div className='rounded-lg bg-fuchsia-50 p-2 text-fuchsia-500 dark:bg-fuchsia-500/10 dark:text-fuchsia-400'>
							<Icon icon='HeroFingerPrint' className='size-5' />
						</div>
						<div>
							<p className='text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
								Nº Serie
							</p>
							<p className='font-medium text-zinc-900 dark:text-zinc-100'>
								{warehouse.requires_serial_tracking ? 'Requerido' : 'Opcional'}
							</p>
						</div>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default WarehouseInfoCard;
