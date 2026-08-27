import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { ILockerInternal, IServiceOrder } from '@/interface/lockers.interface';
import { getStatusConfig } from '../../types';

interface IDetailLockerModalProps {
	isOpen: boolean;
	detailLocker: ILockerInternal | null;
	onClose: () => void;
	serviceOrders: IServiceOrder[];
}

const DetailRow = ({
	label,
	value,
	fullWidth,
}: {
	label: string;
	value: string;
	fullWidth?: boolean;
}) => (
	<div className={fullWidth ? 'col-span-2' : ''}>
		<span className='font-medium text-zinc-500'>{label}:</span>
		<p className='text-zinc-800 dark:text-zinc-200'>{value}</p>
	</div>
);

const DetailLockerModal: React.FC<IDetailLockerModalProps> = ({
	isOpen,
	detailLocker,
	onClose,
	serviceOrders,
}) => {
	if (!detailLocker) return null;

	// Mapa rápido (podemos pasarlo como prop o re-calcular)
	const orderByLockerId: Record<number, IServiceOrder> = {};
	serviceOrders.forEach((order) => {
		if (order.locker_id) orderByLockerId[order.locker_id] = order;
	});

	const order = detailLocker.active_service_order || orderByLockerId[detailLocker.id];
	const lockerNum = detailLocker.locker_number || detailLocker.number || String(detailLocker.id);

	const StatusBadge = ({ status }: { status: string }) => {
		const config = getStatusConfig(status);
		return (
			<Badge color={config.color as any} variant='solid' className='text-xs'>
				<span className='flex items-center gap-1'>
					<Icon icon={config.icon} className='h-3 w-3' />
					{config.label}
				</span>
			</Badge>
		);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='lg'>
			<ModalHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroEye' className='h-5 w-5' />
					Detalle del Casillero Nº {lockerNum}
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4'>
					<div className='flex items-center gap-2'>
						<span className='text-sm font-medium text-zinc-500'>Estado actual:</span>
						<StatusBadge status={detailLocker.status} />
					</div>

					<div className='rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800'>
						<h4 className='mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
							Información del Casillero
						</h4>
						<div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm'>
							<DetailRow label='Número' value={lockerNum} />
							<DetailRow
								label='QR Token'
								value={
									detailLocker.qr_token
										? `${detailLocker.qr_token.slice(0, 12)}...`
										: '—'
								}
							/>
							<DetailRow label='PIN Actual' value={detailLocker.locker_pin || '—'} />
							<DetailRow
								label='Ingreso'
								value={
									order?.checked_in_at || detailLocker.check_in_at
										? new Date(
												order?.checked_in_at || detailLocker.check_in_at!,
											).toLocaleString('es-CL')
										: '—'
								}
							/>
						</div>
					</div>

					<div className='rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800'>
						<h4 className='mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
							Datos del Cliente
						</h4>
						<div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm'>
							<DetailRow
								label='Nombre'
								value={order?.customer_name || detailLocker.customer_name || '—'}
							/>
							<DetailRow
								label='Email'
								value={order?.customer_email || detailLocker.customer_email || '—'}
							/>
							<DetailRow
								label='Teléfono'
								value={order?.customer_phone || detailLocker.customer_phone || '—'}
							/>
						</div>
					</div>

					<div className='rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800'>
						<h4 className='mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
							Datos del Equipo
						</h4>
						<div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm'>
							<DetailRow
								label='Marca'
								value={order?.device_brand || detailLocker.device_brand || '—'}
							/>
							<DetailRow
								label='Modelo'
								value={order?.device_model || detailLocker.device_model || '—'}
							/>
							<DetailRow
								label='Nº Serie'
								value={detailLocker.serial_number || order?.serial_number || '—'}
							/>
							<DetailRow
								label='Servicio'
								value={order?.service_type || detailLocker.service_type || '—'}
							/>
							<DetailRow
								label='Descripción'
								value={
									order?.device_description ||
									detailLocker.device_description ||
									'—'
								}
								fullWidth
							/>
						</div>
					</div>

					{order && (
						<div className='rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20'>
							<h4 className='mb-2 text-sm font-semibold text-blue-700 dark:text-blue-300'>
								Orden de Servicio #{order.id}
							</h4>
							<div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm'>
								<DetailRow
									label='Estado'
									value={
										order.logistics_status_label ||
										order.logistics_status ||
										order.status ||
										'—'
									}
								/>
								<DetailRow
									label='Creada'
									value={
										order.created_at
											? new Date(order.created_at).toLocaleString('es-CL')
											: '—'
									}
								/>
							</div>
						</div>
					)}
				</div>
			</ModalBody>
			<ModalFooter>
				<Button variant='outline' onClick={onClose}>
					Cerrar
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default DetailLockerModal;
