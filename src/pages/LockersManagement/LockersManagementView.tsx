import React, { useState, useMemo } from 'react';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import {
	ILockerInternal,
	ILockerLocation,
	IServiceOrder,
} from '@/services/lockersInternalService';
import { getStatusConfig, getAvailableActions } from './types';
import QRScanner from '../recursosHumanos/relojControl/components/QRScanner';

// ─────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────
interface ILockersManagementViewProps {
	locations: ILockerLocation[];
	selectedLocationId: number | null;
	lockers: ILockerInternal[];
	serviceOrders: IServiceOrder[];
	isLoading: boolean;
	error: string | null;
	selectedLocker: ILockerInternal | null;
	actionType: 'withdraw' | 'dropoff' | 'reset' | 'ready' | null;
	isActionLoading: boolean;
	successPin: string | null;
	successMessage: string | null;
	// Acciones
	setSelectedLocker: (locker: ILockerInternal | null) => void;
	setSuccessPin: (pin: string | null) => void;
	changeLocation: (locationId: number) => void;
	fetchLockers: () => void;
	fetchServiceOrders: () => void;
	openAction: (locker: ILockerInternal, type: 'withdraw' | 'dropoff' | 'reset' | 'ready') => void;
	closeAction: () => void;
	handleWithdraw: (serviceOrderId: number) => void;
	handleDropOff: (serviceOrderId: number) => void;
	handleReset: () => void;
	handleSetReadyForPickup: (serviceOrderId: number, pinManual: string) => void;
	handleScanQR: (token: string) => Promise<boolean>;
}

// ─────────────────────────────────────────────────
// Componente View
// ─────────────────────────────────────────────────
const LockersManagementView: React.FC<ILockersManagementViewProps> = ({
	locations,
	selectedLocationId,
	lockers,
	serviceOrders,
	isLoading,
	error,
	selectedLocker,
	actionType,
	isActionLoading,
	successPin,
	successMessage,
	setSuccessPin,
	changeLocation,
	fetchLockers,
	openAction,
	closeAction,
	handleWithdraw,
	handleDropOff,
	handleReset,
	handleSetReadyForPickup,
	handleScanQR,
	setSelectedLocker,
}) => {
	// --- Estado local del modal ---
	const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
	const [pinManual, setPinManual] = useState('');
	const [detailLocker, setDetailLocker] = useState<ILockerInternal | null>(null);
	const [isScanning, setIsScanning] = useState(false);

	const resetModalState = () => {
		setSelectedOrderId(null);
		setPinManual('');
	};

	const onClose = () => {
		resetModalState();
		closeAction();
	};

	const onSubmit = () => {
		if (actionType === 'withdraw' && selectedOrderId) {
			handleWithdraw(selectedOrderId);
		} else if (actionType === 'dropoff' && selectedOrderId) {
			handleDropOff(selectedOrderId);
		} else if (actionType === 'reset') {
			handleReset();
		} else if (actionType === 'ready' && selectedOrderId && pinManual) {
			handleSetReadyForPickup(selectedOrderId, pinManual);
		}
		resetModalState();
	};

	// --- Mapeo de órdenes por locker_id para cruzar datos ---
	const orderByLockerId = useMemo(() => {
		const map: Record<number, IServiceOrder> = {};
		serviceOrders.forEach((order) => {
			if (order.locker_id) {
				map[order.locker_id] = order;
			}
		});
		return map;
	}, [serviceOrders]);

	// --- Conteo por estado normalizado ---
	const statusCounts = useMemo(() => {
		const counts: Record<string, number> = {
			Disponible: 0,
			Ocupado: 0,
			'Esperando Retiro': 0,
			'En Cuarentena': 0,
		};
		lockers.forEach((l) => {
			const config = getStatusConfig(l.status);
			if (counts[config.label] !== undefined) {
				counts[config.label]++;
			}
		});
		return counts;
	}, [lockers]);

	const locationOptions: TSelectOption[] = locations.map((loc) => ({
		value: String(loc.id),
		label: loc.name || `Ubicación ${loc.id}`,
	}));

	const orderOptions: TSelectOption[] = useMemo(() => {
		// Filtrar órdenes según la acción
		let filtered = serviceOrders;

		if (actionType === 'withdraw' && selectedLocker) {
			filtered = serviceOrders.filter((o) => o.locker_id === selectedLocker.id);
		} else if (actionType === 'dropoff') {
			// Por ahora mostramos todas para depurar por qué no aparecen,
			// pero marcamos las recomendadas (checked_in / in_progress).
			filtered = serviceOrders;
		} else if (actionType === 'ready') {
			filtered = serviceOrders.filter((o) => !!o.locker_id);
		}

		return filtered.map((order) => {
			const rawStatus = order.logistics_status || 'SIN ESTADO';
			const statusLabel = order.logistics_status_label || rawStatus.replace(/_/g, ' ').toUpperCase();
			
			const normalizedStatus = rawStatus.toLowerCase();
			const isRecommended = normalizedStatus === 'checked_in' || normalizedStatus === 'in_progress' || normalizedStatus === 'entregado_tecnico';
			
			const icon = isRecommended ? '✅' : '❌';
			
			return {
				value: String(order.id),
				label: `ORDEN #${order.id} — ${order.customer_name || 'Sin Cliente'} [${icon} ${statusLabel}]`,
			};
		});
	}, [serviceOrders, actionType, selectedLocker]);

	// --- Pre-selección automática de orden ---
	React.useEffect(() => {
		if (actionType === 'withdraw' && selectedLocker) {
			const order = serviceOrders.find((o) => o.locker_id === selectedLocker.id);
			if (order) setSelectedOrderId(order.id);
		}
	}, [actionType, selectedLocker, serviceOrders]);

	const lockerOptions: TSelectOption[] = useMemo(() => {
		// Para el selector de casillero en el modal (Fase 4)
		return lockers
			.filter((l) => l.status === 'available' || l.status === 'maintenance' || l.id === selectedLocker?.id)
			.map((l) => ({
				value: String(l.id),
				label: `Casillero Nº ${l.locker_number || l.id}`,
			}));
	}, [lockers, selectedLocker]);

	const canSubmit =
		actionType === 'reset'
			? true
			: actionType === 'ready'
				? !!selectedOrderId && pinManual.length === 4
				: !!selectedOrderId;

	// --- Badge de estado ---
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

	// --- Resumen visual ---
	const summaryCards = [
		{ label: 'Disponible', color: 'emerald', icon: 'HeroCheck' },
		{ label: 'Ocupado', color: 'amber', icon: 'HeroLockClosed' },
		{ label: 'Esperando Retiro', color: 'blue', icon: 'HeroBell' },
		{ label: 'En Cuarentena', color: 'violet', icon: 'HeroClock' },
	];

	return (
		<PageWrapper name='Gestión de Casilleros' title='Gestión de Casilleros'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex flex-col items-start'>
						<div className='flex flex-row items-center gap-3'>
							<Icon icon='DuoLockClosed' className='text-4xl' />
							<Badge className='text-2xl font-bold'>Gestión de Casilleros</Badge>
						</div>
						<p className='mt-1 text-sm text-gray-500'>
							Panel de control interno — Flujo Lock Care
						</p>
					</div>
				</SubheaderLeft>
			</Subheader>

			<Container className='w-full'>
				<div className='flex flex-col gap-4'>
					{/* Selector de ubicación */}
					<Card>
						<CardBody className='p-4'>
							<div className='flex flex-wrap items-end gap-4'>
								<div className='min-w-[250px] flex-1'>
									<Label htmlFor='location-select'>Ubicación / Sede</Label>
									<SelectReact
										id='location-select'
										name='location'
										options={locationOptions}
										placeholder='Selecciona una ubicación...'
										value={
											locationOptions.find(
												(o) => o.value === String(selectedLocationId),
											) ?? null
										}
										onChange={(opt) => {
											const selected = opt as TSelectOption | null;
											if (selected) changeLocation(Number(selected.value));
										}}
									/>
								</div>
								<div className='flex gap-2'>
									<Button
										color='blue'
										variant='solid'
										icon='HeroQrCode'
										onClick={() => setIsScanning(true)}>
										Escanear QR
									</Button>
									<Button
										color='emerald'
										variant='outline'
										icon='HeroArrowPath'
										isLoading={isLoading}
										onClick={fetchLockers}>
										Actualizar
									</Button>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Resumen de estados */}
					<div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
						{summaryCards.map(({ label, color, icon }) => (
							<Card key={label}>
								<CardBody className='p-4'>
									<div className='flex items-center gap-3'>
										<div
											className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-${color}-100 dark:bg-${color}-900/30`}>
											<Icon
												icon={icon}
												className={`h-5 w-5 text-${color}-600`}
											/>
										</div>
										<div>
											<p className='text-xs font-medium text-zinc-500'>
												{label}
											</p>
											<p className='text-2xl font-bold text-zinc-800 dark:text-zinc-200'>
												{statusCounts[label] ?? 0}
											</p>
										</div>
									</div>
								</CardBody>
							</Card>
						))}
					</div>

					{/* Estado de carga */}
					{isLoading && (
						<Card>
							<CardBody className='flex items-center justify-center p-12'>
								<div className='flex flex-col items-center gap-3'>
									<div className='h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent' />
									<p className='text-zinc-500'>Cargando casilleros...</p>
								</div>
							</CardBody>
						</Card>
					)}

					{/* Error */}
					{!isLoading && error && (
						<Card>
							<CardBody className='p-6 text-center'>
								<Icon
									icon='HeroExclamationCircle'
									className='mx-auto mb-2 h-10 w-10 text-red-500'
								/>
								<p className='text-red-600'>{error}</p>
								<Button
									className='mt-4'
									color='zinc'
									variant='outline'
									onClick={fetchLockers}>
									Reintentar
								</Button>
							</CardBody>
						</Card>
					)}

					{/* Tabla de casilleros */}
					{!isLoading && !error && (
						<Card>
							<CardHeader>
								<Badge className='text-lg font-semibold'>
									Casilleros ({lockers.length})
								</Badge>
							</CardHeader>
							<CardBody className='p-0'>
								<div className='overflow-x-auto'>
									<table className='w-full text-left text-sm'>
										<thead className='border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800'>
											<tr>
												<th className='px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300'>
													Nº
												</th>
												<th className='px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300'>
													Estado
												</th>
												<th className='px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300'>
													Cliente
												</th>
												<th className='px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300'>
													Equipo
												</th>
												<th className='px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300'>
													Servicio
												</th>
												<th className='px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300'>
													Ingreso
												</th>
												<th className='px-4 py-3 text-right font-semibold text-zinc-600 dark:text-zinc-300'>
													Acciones
												</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-zinc-100 dark:divide-zinc-700'>
											{lockers.length === 0 ? (
												<tr>
													<td
														colSpan={7}
														className='px-4 py-12 text-center text-zinc-400'>
														No hay casilleros en esta ubicación.
													</td>
												</tr>
											) : (
												lockers.map((locker) => {
													const order = orderByLockerId[locker.id];
													const actions = getAvailableActions(locker.status);
													// Intentar sacar datos del locker o de la orden asociada
													const clientName =
														locker.customer_name ||
														order?.customer_name ||
														'—';
													const clientEmail =
														locker.customer_email ||
														order?.customer_email;
													const deviceInfo =
														locker.device_brand && locker.device_model
															? `${locker.device_brand} ${locker.device_model}`
															: order?.device_brand && order?.device_model
																? `${order.device_brand} ${order.device_model}`
																: locker.device_description ||
																	order?.device_description ||
																	'—';
													const serviceType =
														locker.service_type ||
														order?.service_type ||
														'—';
													const checkInDate =
														locker.check_in_at || order?.created_at;

													return (
														<tr
															key={locker.id}
															className='transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50'>
															<td className='px-4 py-3 font-mono font-semibold text-zinc-800 dark:text-zinc-200'>
																{locker.locker_number || locker.id}
															</td>
															<td className='px-4 py-3'>
																<StatusBadge
																	status={locker.status}
																/>
															</td>
															<td className='px-4 py-3'>
																<div>
																	<p className='font-medium text-zinc-800 dark:text-zinc-200'>
																		{clientName}
																	</p>
																	{clientEmail && (
																		<p className='text-xs text-zinc-400'>
																			{clientEmail}
																		</p>
																	)}
																</div>
															</td>
															<td className='max-w-[180px] truncate px-4 py-3 text-zinc-600 dark:text-zinc-400'>
																{deviceInfo}
															</td>
															<td className='px-4 py-3 text-zinc-600 dark:text-zinc-400'>
																{serviceType}
															</td>
															<td className='px-4 py-3 text-xs text-zinc-500'>
																{checkInDate
																	? new Date(
																			checkInDate,
																		).toLocaleString('es-CL')
																	: '—'}
															</td>
															<td className='px-4 py-3 text-right'>
																<div className='flex flex-wrap items-center justify-end gap-1'>
																	{/* Fase 2: Retirar — solo si OCUPADO */}
																	{actions.includes('withdraw') && (
																		<Button
																			size='xs'
																			color='blue'
																			variant='outline'
																			icon='HeroArrowDownTray'
																			onClick={() =>
																				openAction(
																					locker,
																					'withdraw',
																				)
																			}>
																			Retirar
																		</Button>
																	)}

																	{/* Fase 4: Depositar — solo si DISPONIBLE */}
																	{actions.includes('dropoff') && (
																		<Button
																			size='xs'
																			color='emerald'
																			variant='outline'
																			icon='HeroArrowUpTray'
																			onClick={() =>
																				openAction(
																					locker,
																					'dropoff',
																				)
																			}>
																			Depositar
																		</Button>
																	)}

																	{/* Fase 6: Reset — solo si EN CUARENTENA o MANTENIMIENTO */}
																	{actions.includes('reset') && (
																		<Button
																			size='xs'
																			color='red'
																			variant='outline'
																			icon='HeroArrowPath'
																			onClick={() =>
																				openAction(
																					locker,
																					'reset',
																				)
																			}>
																			Reset
																		</Button>
																	)}

																	{/* Siempre: Ver detalle */}
																	{actions.includes('detail') && (
																		<Button
																			size='xs'
																			color='zinc'
																			variant='outline'
																			icon='HeroEye'
																			onClick={() =>
																				setDetailLocker(
																					locker,
																				)
																			}>
																			Detalle
																		</Button>
																	)}
																</div>
															</td>
														</tr>
													);
												})
											)}
										</tbody>
									</table>
								</div>
							</CardBody>
						</Card>
					)}
				</div>
			</Container>

			{/* ═══════════════════════════════════════════
			    MODAL: Detalle del casillero
			    ═══════════════════════════════════════════ */}
			<Modal isOpen={!!detailLocker} setIsOpen={() => setDetailLocker(null)} size='lg'>
				<ModalHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroEye' className='h-5 w-5' />
						Detalle del Casillero Nº {detailLocker?.locker_number || detailLocker?.id}
					</div>
				</ModalHeader>
				<ModalBody>
					{detailLocker && (() => {
						const order = orderByLockerId[detailLocker.id];
						return (
							<div className='space-y-4'>
								{/* Estado actual */}
								<div className='flex items-center gap-2'>
									<span className='text-sm font-medium text-zinc-500'>
										Estado actual:
									</span>
									<StatusBadge status={detailLocker.status} />
								</div>

								{/* Info del casillero */}
								<div className='rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800'>
									<h4 className='mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
										Información del Casillero
									</h4>
									<div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm'>
										<DetailRow label='Número' value={detailLocker.locker_number || String(detailLocker.id)} />
										<DetailRow label='QR Token' value={detailLocker.qr_token ? `${detailLocker.qr_token.slice(0, 12)}...` : '—'} />
										<DetailRow label='PIN Actual' value={detailLocker.current_pin || '—'} />
										<DetailRow label='Ingreso' value={(detailLocker.check_in_at || order?.checked_in_at) ? new Date(detailLocker.check_in_at || order!.checked_in_at!).toLocaleString('es-CL') : '—'} />
									</div>
								</div>

								{/* Datos del Cliente */}
								<div className='rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800'>
									<h4 className='mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
										Datos del Cliente
									</h4>
									<div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm'>
										<DetailRow label='Nombre' value={detailLocker.customer_name || order?.customer_name || '—'} />
										<DetailRow label='Email' value={detailLocker.customer_email || order?.customer_email || '—'} />
										<DetailRow label='Teléfono' value={detailLocker.customer_phone || order?.customer_phone || '—'} />
									</div>
								</div>

								{/* Datos del Equipo */}
								<div className='rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800'>
									<h4 className='mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
										Datos del Equipo
									</h4>
									<div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm'>
										<DetailRow label='Marca' value={detailLocker.device_brand || order?.device_brand || '—'} />
										<DetailRow label='Modelo' value={detailLocker.device_model || order?.device_model || '—'} />
										<DetailRow label='Nº Serie' value={detailLocker.serial_number || order?.serial_number || '—'} />
										<DetailRow label='Servicio' value={detailLocker.service_type || order?.service_type || '—'} />
										<DetailRow label='Descripción' value={detailLocker.device_description || order?.device_description || '—'} fullWidth />
									</div>
								</div>

								{/* Orden de servicio asociada */}
								{order && (
									<div className='rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20'>
										<h4 className='mb-2 text-sm font-semibold text-blue-700 dark:text-blue-300'>
											Orden de Servicio #{order.id}
										</h4>
										<div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm'>
											<DetailRow label='Estado' value={order.logistics_status_label || order.status || '—'} />
											<DetailRow label='Creada' value={order.created_at ? new Date(order.created_at).toLocaleString('es-CL') : '—'} />
										</div>
									</div>
								)}
							</div>
						);
					})()}
				</ModalBody>
				<ModalFooter>
					<Button variant='outline' onClick={() => setDetailLocker(null)}>
						Cerrar
					</Button>
				</ModalFooter>
			</Modal>

			{/* ═══════════════════════════════════════════
			    MODAL: Acciones técnicas
			    ═══════════════════════════════════════════ */}
			<Modal isOpen={!!actionType && !!selectedLocker} setIsOpen={onClose} size='lg'>
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
						{/* Info del casillero seleccionado */}
						{selectedLocker && (
							<div className='rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800'>
								<div className='grid grid-cols-2 gap-3 text-sm'>
									{actionType === 'dropoff' ? (
										<div className='col-span-2'>
											<Label htmlFor='locker-select'>Casillero de Depósito</Label>
											<SelectReact
												id='locker-select'
												options={lockerOptions}
												value={lockerOptions.find(o => o.value === String(selectedLocker.id))}
												onChange={(opt) => {
													const selected = opt as TSelectOption | null;
													if (selected) {
														const newLocker = lockers.find(l => l.id === Number(selected.value));
														if (newLocker) setSelectedLocker(newLocker);
													}
												}}
											/>
										</div>
									) : (
										<>
											<DetailRow label='Casillero' value={`Nº ${selectedLocker.locker_number || selectedLocker.id}`} />
											<div>
												<span className='font-medium text-zinc-500'>Estado:</span>
												<div className='mt-0.5'>
													<StatusBadge status={selectedLocker.status} />
												</div>
											</div>
										</>
									)}
								</div>
							</div>
						)}

						{/* Descripción de la acción */}
						<div className='rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'>
							{actionType === 'withdraw' && (
								<p>
									<strong>Fase 2:</strong> Retira el equipo del casillero. Se
									generará un nuevo PIN automáticamente y el casillero quedará{' '}
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
									<strong>Fase 6:</strong> Resetea el casillero después del
									retiro del cliente. Se genera un nuevo PIN y el casillero
									vuelve a estar <strong>Disponible</strong>.
								</p>
							)}
							{actionType === 'ready' && (
								<p>
									Marca la orden como lista para que el cliente retire.
									Ingresa el PIN que se le comunicará al cliente.
								</p>
							)}
						</div>

						{/* Selector de orden (withdraw, dropoff, ready) */}
						{actionType !== 'reset' && (
							<div>
								<Label htmlFor='serviceOrder'>Orden de Servicio*</Label>
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
							</div>
						)}

						{/* PIN manual solo para "ready for pickup" */}
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
						onClick={onSubmit}>
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

			{/* Modal de Éxito con PIN (Técnico) */}
			<Modal isOpen={!!successPin} setIsOpen={() => setSuccessPin(null)} size='sm'>
				<ModalHeader>
					<div className='flex items-center gap-2 text-emerald-600'>
						<Icon icon='HeroCheckCircle' className='h-5 w-5' />
						Acción Completada
					</div>
				</ModalHeader>
				<ModalBody>
					<div className='text-center space-y-4'>
						<p className='text-sm text-zinc-600'>{successMessage}</p>
						<div className='rounded-2xl bg-emerald-50 p-6 border border-emerald-100'>
							<p className='text-5xl font-mono font-black text-emerald-600 tracking-[0.2em] ml-4'>
								{successPin}
							</p>
						</div>
						<p className='text-[10px] text-zinc-400 uppercase font-bold tracking-widest'>
							Anota este PIN para operar el casillero
						</p>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button color='emerald' className='w-full' onClick={() => setSuccessPin(null)}>
						Entendido
					</Button>
				</ModalFooter>
			</Modal>

			{/* Escáner QR */}
			<Modal isOpen={isScanning} setIsOpen={setIsScanning} size='md'>
				<ModalHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroQrCode' className='h-5 w-5' />
						Escanear Código QR del Casillero
					</div>
				</ModalHeader>
				<ModalBody>
					<QRScanner
						isActive={isScanning}
						onScan={async (code) => {
							const success = await handleScanQR(code);
							if (success) setIsScanning(false);
						}}
						onCancel={() => setIsScanning(false)}
					/>
				</ModalBody>
			</Modal>
		</PageWrapper>
	);
};

// ─────────────────────────────────────────────────
// Componente auxiliar para filas de detalle
// ─────────────────────────────────────────────────
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

export default LockersManagementView;
