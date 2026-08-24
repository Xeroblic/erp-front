import React, { useState, useMemo, useEffect } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Badge from '@/components/ui/Badge';
import { ILockerInternal, IServiceOrder } from '@/interface/lockers.interface';
import { getStatusConfig } from '../../types';

interface ILockerActionModalProps {
	isOpen: boolean;
	actionType: 'withdraw' | 'dropoff' | 'reset' | 'ready' | null;
	selectedLocker: ILockerInternal | null;
	serviceOrders: IServiceOrder[];
	lockers: ILockerInternal[];
	isActionLoading: boolean;
	initialOrderId?: number | null;
	onClose: () => void;
	onSubmit: (data: {
		orderId: number | null;
		pinManual: string;
		actionLocker: ILockerInternal | null;
	}) => void;
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

const LockerActionModal: React.FC<ILockerActionModalProps> = ({
	isOpen,
	actionType,
	selectedLocker,
	serviceOrders,
	lockers,
	isActionLoading,
	initialOrderId,
	onClose,
	onSubmit,
}) => {
	const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
	const [pinManual, setPinManual] = useState('');
	const [actionLocker, setActionLocker] = useState<ILockerInternal | null>(null);

	useEffect(() => {
		if (selectedLocker) {
			setActionLocker(selectedLocker);
		}
	}, [selectedLocker]);

	useEffect(() => {
		if (!isOpen) {
			setSelectedOrderId(null);
			setPinManual('');
			setActionLocker(null);
		} else if (initialOrderId) {
			setSelectedOrderId(initialOrderId);
		}
	}, [isOpen, initialOrderId]);

	useEffect(() => {
		if (actionType === 'withdraw' && actionLocker) {
			const order = serviceOrders.find((o) => o.locker_id === actionLocker.id);
			if (order) setSelectedOrderId(order.id);
		}
	}, [actionType, actionLocker, serviceOrders]);

	const orderOptions: TSelectOption[] = useMemo(() => {
		let filtered = serviceOrders;
		if (actionType === 'withdraw' && actionLocker) {
			filtered = serviceOrders.filter((o) => o.locker_id === actionLocker.id);
		} else if (actionType === 'dropoff') {
			filtered = serviceOrders;
		} else if (actionType === 'ready') {
			filtered = serviceOrders.filter((o) => !!o.locker_id);
		}

		return filtered.map((order) => {
			const rawStatus = order.logistics_status || 'SIN ESTADO';
			const statusLabel =
				order.logistics_status_label || rawStatus.replace(/_/g, ' ').toUpperCase();
			const normalizedStatus = rawStatus.toLowerCase();
			const isRecommended =
				normalizedStatus === 'checked_in' ||
				normalizedStatus === 'in_progress' ||
				normalizedStatus === 'entregado_tecnico';
			const icon = isRecommended ? '✅' : '❌';

			return {
				value: String(order.id),
				label: `ORDEN #${order.id} — ${order.customer_name || 'Sin Cliente'} [${icon} ${statusLabel}]`,
			};
		});
	}, [serviceOrders, actionType, actionLocker]);

	const lockerOptions: TSelectOption[] = useMemo(() => {
		return lockers
			.filter(
				(l) =>
					l.status === 'available' ||
					l.status === 'maintenance' ||
					l.id === actionLocker?.id,
			)
			.map((l) => ({
				value: String(l.id),
				label: `Casillero Nº ${l.locker_number || l.id}`,
			}));
	}, [lockers, actionLocker]);

	const canSubmit =
		actionType === 'reset'
			? true
			: actionType === 'ready'
				? !!selectedOrderId && pinManual.length === 4
				: !!selectedOrderId;

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

	const handleSubmit = () => {
		onSubmit({ orderId: selectedOrderId, pinManual, actionLocker });
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='lg'>
			<ModalHeader>
				<div className='flex items-center gap-2'>
					<Icon
						icon={
							actionType === 'withdraw'
								? 'HeroArrowDownTray'
								: actionType === 'dropoff'
									? 'HeroArrowUpTray'
									: actionType === 'ready'
										? 'HeroBell'
										: 'HeroArrowPath'
						}
						className='h-5 w-5'
					/>
					{actionType === 'withdraw'
						? 'Fase 2 — Retirar Equipo'
						: actionType === 'dropoff'
							? 'Fase 4 — Depositar Equipo'
							: actionType === 'ready'
								? 'Marcar Listo para Retiro'
								: 'Fase 6 — Resetear Casillero'}
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4'>
					{actionLocker && (
						<div className='rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800'>
							<div className='grid grid-cols-2 gap-3 text-sm'>
								{actionType === 'dropoff' ? (
									<div className='col-span-2'>
										<Label htmlFor='locker-select'>Casillero de Depósito</Label>
										<SelectReact
											name='seleccion_casillero'
											id='locker-select'
											options={lockerOptions}
											value={
												lockerOptions.find(
													(o) => o.value === String(actionLocker.id),
												) || null
											}
											onChange={(opt) => {
												const selected = opt as TSelectOption | null;
												if (selected) {
													const newLocker = lockers.find(
														(l) => l.id === Number(selected.value),
													);
													if (newLocker) setActionLocker(newLocker);
												}
											}}
										/>
									</div>
								) : (
									<>
										<DetailRow
											label='Casillero'
											value={`Nº ${actionLocker.locker_number || actionLocker.number || actionLocker.id}`}
										/>
										<div>
											<span className='font-medium text-zinc-500'>
												Estado:
											</span>
											<div className='mt-0.5'>
												<StatusBadge status={actionLocker.status} />
											</div>
										</div>
									</>
								)}
							</div>
						</div>
					)}

					<div className='rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'>
						{actionType === 'withdraw' && (
							<p>
								<strong>Fase 2:</strong> Retira el equipo del casillero. Se generará
								un nuevo PIN automáticamente y el casillero quedará{' '}
								<strong>Disponible</strong>.
							</p>
						)}
						{actionType === 'dropoff' && (
							<p>
								<strong>Fase 4:</strong> Deposita el equipo reparado en este
								casillero. Se generará un nuevo PIN y el estado cambiará a{' '}
								<strong>Esperando Retiro</strong>. El cliente recibirá una
								notificación.
							</p>
						)}
						{actionType === 'reset' && (
							<p>
								<strong>Fase 6:</strong> Resetea el casillero después del retiro del
								cliente. Se genera un nuevo PIN y el casillero vuelve a estar{' '}
								<strong>Disponible</strong>.
							</p>
						)}
						{actionType === 'ready' && (
							<p>
								Marca la orden como lista para que el cliente retire. Ingresa el PIN
								que se le comunicará al cliente.
							</p>
						)}
					</div>

					{actionType !== 'reset' && (
						<div>
							<Label htmlFor='serviceOrder'>Orden de Servicio*</Label>
							{initialOrderId ? (
								<div className='rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
									{orderOptions.find((o) => o.value === String(initialOrderId))
										?.label || `Orden #${initialOrderId}`}
								</div>
							) : orderOptions.length === 1 && actionType === 'withdraw' ? (
								<div className='rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
									{orderOptions[0].label}
								</div>
							) : (
								<SelectReact
									id='serviceOrder'
									name='serviceOrder'
									options={orderOptions}
									placeholder='Selecciona la orden de servicio...'
									value={
										orderOptions.find(
											(o) => o.value === String(selectedOrderId),
										) ?? null
									}
									onChange={(opt) => {
										const selected = opt as TSelectOption | null;
										setSelectedOrderId(
											selected ? Number(selected.value) : null,
										);
									}}
								/>
							)}
						</div>
					)}

					{actionType === 'ready' && (
						<div>
							<Label htmlFor='pinManual'>PIN de Retiro (4 dígitos)*</Label>
							<Input
								id='pinManual'
								name='pinManual'
								type='text'
								maxLength={4}
								placeholder='Ej: 3589'
								value={pinManual}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									setPinManual(e.target.value.replace(/\D/g, ''));
								}}
							/>
							<p className='mt-1 text-xs text-zinc-400'>
								Este PIN se le enviará al cliente para que retire su equipo.
							</p>
						</div>
					)}
				</div>
			</ModalBody>
			<ModalFooter>
				<Button variant='outline' onClick={onClose}>
					Cancelar
				</Button>
				<Button
					color={
						actionType === 'reset'
							? 'red'
							: actionType === 'withdraw'
								? 'blue'
								: actionType === 'ready'
									? 'amber'
									: 'emerald'
					}
					variant='solid'
					isLoading={isActionLoading}
					isDisable={!canSubmit}
					onClick={handleSubmit}>
					{actionType === 'withdraw'
						? 'Confirmar Retiro'
						: actionType === 'dropoff'
							? 'Confirmar Depósito'
							: actionType === 'ready'
								? 'Marcar Listo'
								: 'Resetear'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default LockerActionModal;
