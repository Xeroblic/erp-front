import React from 'react';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import type { ITransfer, TransferStatus } from '@/interface/transfers.interface';

interface TransfersTableProps {
	transfers: ITransfer[];
	isLoading?: boolean;
	onView: (transfer: ITransfer) => void;
}

const statusConfig: Record<
	TransferStatus,
	{ label: string; color: React.ComponentProps<typeof Badge>['color'] }
> = {
	pending: { label: 'Pendiente', color: 'amber' },
	sent: { label: 'Enviada', color: 'blue' },
	received: { label: 'Recibida', color: 'emerald' },
	completed: { label: 'Completada', color: 'violet' },
	cancelled: { label: 'Cancelada', color: 'red' },
	draft: { label: 'Borrador', color: 'gray' },
};

const formatDate = (date: string) => {
	try {
		return new Intl.DateTimeFormat('es-CL', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(new Date(date));
	} catch {
		return date;
	}
};

const TransfersTable: React.FC<TransfersTableProps> = ({ transfers, isLoading, onView }) => {
	if (isLoading) {
		return (
			<div className='space-y-3 p-4'>
				{Array.from({ length: 5 }).map((_, index) => (
					<div
						key={index}
						className='h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800'
					/>
				))}
			</div>
		);
	}

	if (!transfers.length) {
		return (
			<div className='flex flex-col items-center justify-center space-y-3 py-12 text-center'>
				<Icon icon='HeroInboxStack' className='h-12 w-12 text-gray-400' />
				<p className='text-base font-medium text-gray-700 dark:text-gray-200'>
					Aún no hay transferencias registradas
				</p>
				<p className='text-sm text-gray-500'>
					Usa el botón “Nueva transferencia” para crear la primera.
				</p>
			</div>
		);
	}

	return (
		<div className='overflow-x-auto'>
			<Table className='min-w-full'>
				<THead>
					<Tr>
						<Th>#</Th>
						<Th>Origen → Destino</Th>
						<Th>Totales</Th>
						<Th>Responsable</Th>
						<Th>Estado</Th>
						<Th>Notas</Th>
						<Th>&nbsp;</Th>
					</Tr>
				</THead>
				<TBody>
					{transfers.map((transfer) => {
						const totals = transfer.totals || {
							items: transfer.items?.length || 0,
							quantity:
								transfer.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
						};

						const status = statusConfig[transfer.status] || statusConfig.pending;

						return (
							<Tr key={transfer.id}>
								<Td>
									<div className='flex flex-col'>
										<span className='text-sm font-semibold text-gray-900 dark:text-white'>
											{transfer.transfer_number || `TR-${transfer.id}`}
										</span>
										<span className='text-xs text-gray-500'>
											{formatDate(transfer.created_at)}
										</span>
									</div>
								</Td>
								<Td>
									<div className='text-sm text-gray-800 dark:text-gray-100'>
										<div className='flex items-center space-x-1'>
											<Icon
												icon='HeroBuildingStorefront'
												className='h-4 w-4 text-green-500'
											/>
											<span>
												{transfer.from_branch?.name || 'Sucursal origen'}
											</span>
										</div>
										<div className='flex items-center space-x-1 text-gray-500'>
											<Icon icon='HeroArrowLongRight' className='h-4 w-4' />
											<span>
												{transfer.from_warehouse?.name || 'Bodega origen'}
											</span>
										</div>
										<div className='mt-1 flex items-center space-x-1'>
											<Icon
												icon='HeroBuildingOffice'
												className='h-4 w-4 text-blue-500'
											/>
											<span>
												{transfer.to_branch?.name || 'Sucursal destino'}
											</span>
										</div>
										<div className='flex items-center space-x-1 text-gray-500'>
											<Icon icon='HeroArrowLongRight' className='h-4 w-4' />
											<span>
												{transfer.to_warehouse?.name || 'Bodega destino'}
											</span>
										</div>
									</div>
								</Td>
								<Td>
									<div className='text-sm'>
										<p className='font-semibold'>{totals.items} productos</p>
										<p className='text-gray-500'>{totals.quantity} unidades</p>
									</div>
								</Td>
								<Td>
									<p className='text-sm font-medium text-gray-900 dark:text-white'>
										{transfer.responsible?.name || 'Sin asignar'}
									</p>
									<p className='text-xs text-gray-500'>
										{transfer.responsible?.email}
									</p>
								</Td>
								<Td>
									<Badge color={status.color}>{status.label}</Badge>
								</Td>
								<Td className='max-w-xs text-sm text-gray-600 dark:text-gray-300'>
									{transfer.notes || '—'}
								</Td>
								<Td className='text-right'>
									<Button
										size='sm'
										variant='outline'
										onClick={() => onView(transfer)}>
										Ver detalle
									</Button>
								</Td>
							</Tr>
						);
					})}
				</TBody>
			</Table>
		</div>
	);
};

export default TransfersTable;
