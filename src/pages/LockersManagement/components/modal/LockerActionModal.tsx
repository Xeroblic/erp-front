import React, { useState, useMemo, useEffect } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import Icon from '@/components/icon/Icon';
import Label from '@/components/form/Label';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Badge from '@/components/ui/Badge';
import { ILockerInternal, IServiceOrder } from '@/interface/lockers.interface';
import {
	getDropoffLockers,
	getEligibleOrders,
	getStatusConfig,
	LOCKER_PERMISSIONS,
	TLockerAction,
} from '../../types';

interface ILockerActionModalProps {
	isOpen: boolean;
	actionType: TLockerAction | null;
	selectedLocker: ILockerInternal | null;
	serviceOrders: IServiceOrder[];
	lockers: ILockerInternal[];
	isActionLoading: boolean;
	initialOrderId?: number | null;
	subsidiaryId: number | null;
	onClose: () => void;
	onSubmit: (data: { orderId: number | null; actionLocker: ILockerInternal | null }) => void;
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
	subsidiaryId,
	onClose,
	onSubmit,
}) => {
	const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
	const [actionLocker, setActionLocker] = useState<ILockerInternal | null>(null);

	useEffect(() => {
		if (selectedLocker) {
			setActionLocker(selectedLocker);
		}
	}, [selectedLocker]);

	useEffect(() => {
		if (!isOpen) {
			setSelectedOrderId(null);
			setActionLocker(null);
		} else if (initialOrderId) {
			setSelectedOrderId(initialOrderId);
		}
	}, [isOpen, initialOrderId]);

	// Retiro: la orden activa del casillero viene en `active_service_order`.
	useEffect(() => {
		if (actionType === 'withdraw' && actionLocker) {
			const orderId =
				actionLocker.active_service_order?.id ??
				serviceOrders.find((o) => o.locker_id === actionLocker.id)?.id;
			if (orderId) setSelectedOrderId(orderId);
		}
	}, [actionType, actionLocker, serviceOrders]);

	const orderOptions: TSelectOption[] = useMemo(
		() =>
			getEligibleOrders(actionType, actionLocker, serviceOrders).map((order) => ({
				value: String(order.id),
				label: `ORDEN #${order.id} — ${order.customer_name} [${order.logistics_status_label}]`,
			})),
		[serviceOrders, actionType, actionLocker],
	);

	const lockerOptions: TSelectOption[] = useMemo(
		() =>
			getDropoffLockers(lockers, actionLocker?.id ?? null).map((l) => ({
				value: String(l.id),
				label: `Casillero Nº ${l.number}`,
			})),
		[lockers, actionLocker],
	);

	const canSubmit = actionType === 'reset' ? true : !!selectedOrderId;

	const StatusBadge = ({ status }: { status: string }) => {
		const config = getStatusConfig(status);
		return (
			<Badge color={config.color} variant='solid' className='text-xs'>
				<span className='flex items-center gap-1'>
					<Icon icon={config.icon} className='h-3 w-3' />
					{config.label}
				</span>
			</Badge>
		);
	};

	const handleSubmit = () => {
		onSubmit({ orderId: selectedOrderId, actionLocker });
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
									: 'HeroArrowPath'
						}
						className='h-5 w-5'
					/>
					{actionType === 'withdraw'
						? 'Retirar Equipo'
						: actionType === 'dropoff'
							? 'Depositar Equipo'
							: 'Resetear Casillero'}
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
											value={`Nº ${actionLocker.number}`}
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
								Retira el equipo del casillero. Se generará un nuevo PIN, que debes
								fijar en el candado, y el casillero quedará{' '}
								<strong>Disponible</strong>.
							</p>
						)}
						{actionType === 'dropoff' && (
							<p>
								Deposita el equipo en este casillero. Se generará un nuevo PIN para
								el candado y el estado cambiará a <strong>Listo para retiro</strong>
								. El cliente recibirá por correo la palabra clave para retirarlo.
							</p>
						)}
						{actionType === 'reset' && (
							<p>
								Resetea el casillero después del retiro del cliente. Se genera un
								nuevo PIN, que debes fijar en el candado, y el casillero vuelve a
								estar <strong>Disponible</strong>.
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
				</div>
			</ModalBody>
			<ModalFooter>
				<Button variant='outline' onClick={onClose}>
					Cancelar
				</Button>
				<ProtectedButton
					permission={LOCKER_PERMISSIONS.operate}
					subsidiaryId={subsidiaryId}
					scope='access'
					fallbackMode='disabled'
					color={
						actionType === 'reset'
							? 'red'
							: actionType === 'withdraw'
								? 'blue'
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
							: 'Resetear'}
				</ProtectedButton>
			</ModalFooter>
		</Modal>
	);
};

export default LockerActionModal;
