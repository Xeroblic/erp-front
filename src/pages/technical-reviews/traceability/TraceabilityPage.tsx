import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	getTraceabilityHistory,
	selectTraceabilityData,
	selectTraceabilityLoading,
	selectError,
	clearErrors,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import dayjs from 'dayjs';

const TraceabilityPage: React.FC = () => {
	const { serialNumber } = useParams<{ serialNumber: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();

	const data = useAppSelector(selectTraceabilityData);
	const loading = useAppSelector(selectTraceabilityLoading);
	const error = useAppSelector(selectError);

	useEffect(() => {
		if (branchId && serialNumber) {
			dispatch(clearErrors());
			dispatch(getTraceabilityHistory({ branchId, serialNumber }));
		}
	}, [branchId, serialNumber, dispatch]);

	// Debug logging
	useEffect(() => {
		console.log('[TraceabilityPage] Data received:', data);
		console.log('[TraceabilityPage] Loading:', loading);
		console.log('[TraceabilityPage] Error:', error);
	}, [data, loading, error]);

	const movements = useMemo(() => {
		// Invertimos el orden para mostrar los más recientes arriba
		return [...(data?.history?.items || [])].reverse();
	}, [data]);

	const formatDate = (date: string | null | undefined) => {
		if (!date) return '-';
		return dayjs(date).format('DD/MM/YYYY HH:mm');
	};

	const getMovementIcon = (type: string) => {
		switch (type) {
			case 'entry':
				return 'HeroArrowDownOnSquare';
			case 'status_change':
				return 'HeroArrowsRightLeft';
			case 'transfer':
				return 'HeroTruck';
			case 'sale':
				return 'HeroCurrencyDollar';
			default:
				return 'HeroDocumentText';
		}
	};

	const getMovementColor = (type: string) => {
		switch (type) {
			case 'entry':
				return 'bg-green-500';
			case 'status_change':
				return 'bg-blue-500';
			case 'transfer':
				return 'bg-purple-500';
			case 'sale':
				return 'bg-emerald-500';
			default:
				return 'bg-gray-500';
		}
	};

	// Estados de carga
	if (loading && !data) {
		return (
			<PageWrapper>
				<Container>
					<div className='flex h-96 items-center justify-center'>
						<div className='flex flex-col items-center gap-4'>
							<div className='relative'>
								<div className='h-16 w-16 rounded-full border-4 border-blue-200 dark:border-blue-900' />
								<div className='absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-blue-500' />
							</div>
							<p className='text-lg font-medium text-gray-600 dark:text-gray-400'>
								Cargando trazabilidad...
							</p>
							<p className='text-sm text-gray-400'>Serie: {serialNumber}</p>
						</div>
					</div>
				</Container>
			</PageWrapper>
		);
	}

	// Estado de error
	if (error && !data) {
		return (
			<PageWrapper>
				<Container>
					<Card className='mx-auto max-w-lg'>
						<CardBody>
							<div className='flex flex-col items-center justify-center gap-4 py-10'>
								<div className='flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-200 text-red-500 dark:from-red-900/30 dark:to-red-800/30'>
									<Icon icon='HeroExclamationTriangle' className='h-10 w-10' />
								</div>
								<h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
									Error al cargar datos
								</h3>
								<p className='text-center text-gray-500'>{error}</p>
								<div className='mt-4 flex gap-3'>
									<Button
										onClick={() => navigate(-1)}
										variant='outline'
										icon='HeroArrowLeft'>
										Volver
									</Button>
									<Button
										onClick={() =>
											branchId &&
											serialNumber &&
											dispatch(
												getTraceabilityHistory({ branchId, serialNumber }),
											)
										}
										variant='solid'
										color='blue'
										icon='HeroArrowPath'>
										Reintentar
									</Button>
								</div>
							</div>
						</CardBody>
					</Card>
				</Container>
			</PageWrapper>
		);
	}

	const item = data?.item;
	const traceability = data?.traceability;

	return (
		<PageWrapper title={`Trazabilidad - ${serialNumber}`}>
			<Container>
				{/* Header */}
				<div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
					<div>
						<div className='mb-2 flex items-center gap-3'>
							<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg'>
								<Icon icon='HeroClock' className='h-6 w-6 text-white' />
							</div>
							<div>
								<h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
									Trazabilidad de Equipo
								</h1>
								<p className='text-sm text-gray-500'>
									Historial completo de movimientos y estados
								</p>
							</div>
						</div>
					</div>
					<Button onClick={() => navigate(-1)} variant='outline' icon='HeroArrowLeft'>
						Volver
					</Button>
				</div>

				<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
					{/* Columna Izquierda */}
					<div className='space-y-6 lg:col-span-1'>
						{/* Hero Card - Número de Serie */}
						<Card className='overflow-hidden border-0 bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl'>
							<CardBody className='p-6'>
								<div className='mb-4 flex items-center justify-between'>
									<span className='text-xs font-medium uppercase tracking-wider text-slate-400'>
										Número de Serie
									</span>
									<Icon icon='HeroQrCode' className='h-5 w-5 text-slate-400' />
								</div>
								<p className='mb-4 font-mono text-3xl font-bold tracking-wide'>
									{item?.serial_number || serialNumber}
								</p>
								<div className='flex flex-wrap gap-2'>
									{item?.equipment_type && (
										<Badge className='border-0 bg-white/10 text-white backdrop-blur'>
											{item.equipment_type}
										</Badge>
									)}
									{item?.grade && (
										<Badge className='border-0 bg-yellow-500/20 text-yellow-300'>
											<Icon icon='HeroStar' className='mr-1 h-3 w-3' />
											{item.grade}
										</Badge>
									)}
								</div>
							</CardBody>
						</Card>

						{/* Información del Equipo */}
						<Card>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle className='flex items-center gap-2'>
										<Icon
											icon='HeroComputerDesktop'
											className='h-5 w-5 text-blue-500'
										/>
										Información del Equipo
									</CardTitle>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								{item ? (
									<div className='space-y-4'>
										<div className='flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-zinc-800/50'>
											<span className='text-sm text-gray-500'>Producto</span>
											<span className='text-right text-sm font-medium text-gray-900 dark:text-gray-100'>
												{item.product?.name || 'No identificado'}
											</span>
										</div>
										{item.product?.sku && (
											<div className='flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-zinc-800/50'>
												<span className='text-sm text-gray-500'>SKU</span>
												<span className='font-mono text-sm font-medium text-gray-900 dark:text-gray-100'>
													{item.product.sku}
												</span>
											</div>
										)}
										<div className='flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-zinc-800/50'>
											<span className='text-sm text-gray-500'>
												Estado Revisión
											</span>
											<Badge
												variant='outline'
												className='rounded-full border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300'>
												{item.review_status || 'Pendiente'}
											</Badge>
										</div>
									</div>
								) : (
									<div className='flex flex-col items-center justify-center py-8 text-gray-400'>
										<Icon
											icon='HeroInformationCircle'
											className='mb-2 h-8 w-8'
										/>
										<p>Información no disponible</p>
									</div>
								)}
							</CardBody>
						</Card>

						{/* Estado Actual */}
						<Card>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle className='flex items-center gap-2'>
										<Icon
											icon='HeroSignal'
											className='h-5 w-5 text-purple-500'
										/>
										Estado Actual
									</CardTitle>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								{traceability ? (
									<div className='space-y-4'>
										{/* Estado Comercial Destacado */}
										<div className='rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 p-4 dark:from-cyan-900/20 dark:to-blue-900/20'>
											<span className='mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500'>
												Estado Comercial
											</span>
											<Badge
												color={traceability.status?.color as any}
												className='px-4 py-2 text-base font-semibold'>
												{traceability.status?.label || 'Desconocido'}
											</Badge>
										</div>

										{/* Detalles */}
										<div className='space-y-3'>
											<div className='flex items-center gap-3'>
												<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'>
													<Icon
														icon='HeroBuildingOffice2'
														className='h-5 w-5'
													/>
												</div>
												<div>
													<span className='block text-xs text-gray-500'>
														Ubicación Actual
													</span>
													<span className='font-medium text-gray-900 dark:text-gray-100'>
														{traceability.warehouse?.name ||
															'No definida'}
													</span>
												</div>
											</div>

											<div className='flex items-center gap-3'>
												<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'>
													<Icon icon='HeroUser' className='h-5 w-5' />
												</div>
												<div>
													<span className='block text-xs text-gray-500'>
														Responsable
													</span>
													<span className='font-medium text-gray-900 dark:text-gray-100'>
														{traceability.current_responsible?.name ||
															'No asignado'}
													</span>
												</div>
											</div>

											{traceability.received_at && (
												<div className='flex items-center gap-3'>
													<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'>
														<Icon
															icon='HeroCalendar'
															className='h-5 w-5'
														/>
													</div>
													<div>
														<span className='block text-xs text-gray-500'>
															Fecha de Ingreso
														</span>
														<span className='font-medium text-gray-900 dark:text-gray-100'>
															{formatDate(traceability.received_at)}
														</span>
													</div>
												</div>
											)}
										</div>
									</div>
								) : (
									<div className='flex flex-col items-center justify-center py-8 text-gray-400'>
										<Icon
											icon='HeroInformationCircle'
											className='mb-2 h-8 w-8'
										/>
										<p>Estado no disponible</p>
									</div>
								)}
							</CardBody>
						</Card>

						{/* Información de Venta */}
						{traceability?.customer && (
							<Card className='border-l-4 border-l-emerald-500'>
								<CardHeader>
									<CardHeaderChild>
										<CardTitle className='flex items-center gap-2'>
											<Icon
												icon='HeroCurrencyDollar'
												className='h-5 w-5 text-emerald-500'
											/>
											Información de Venta
										</CardTitle>
									</CardHeaderChild>
								</CardHeader>
								<CardBody>
									<div className='space-y-3'>
										<div className='flex justify-between'>
											<span className='text-gray-500'>Cliente:</span>
											<span className='font-medium'>
												{traceability.customer?.name}
											</span>
										</div>
										{traceability.sale_id && (
											<div className='flex justify-between'>
												<span className='text-gray-500'>ID Venta:</span>
												<span className='font-mono'>
													{traceability.sale_id}
												</span>
											</div>
										)}
										{traceability.sold_at && (
											<div className='flex justify-between'>
												<span className='text-gray-500'>Fecha:</span>
												<span>{formatDate(traceability.sold_at)}</span>
											</div>
										)}
									</div>
								</CardBody>
							</Card>
						)}
					</div>

					{/* Columna Derecha - Timeline */}
					<div className='lg:col-span-2'>
						<Card className='h-full'>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle className='flex items-center gap-2'>
										<Icon
											icon='HeroClock'
											className='h-5 w-5 text-indigo-500'
										/>
										Historial de Movimientos
									</CardTitle>
								</CardHeaderChild>
								<CardHeaderChild>
									<Badge
										variant='solid'
										color='blue'
										className='px-3 py-1 text-sm font-semibold'>
										{data?.history?.total || movements.length} Eventos
									</Badge>
								</CardHeaderChild>
							</CardHeader>
							<CardBody className='p-6'>
								{movements.length > 0 ? (
									<div className='relative'>
										{/* Línea del timeline */}
										<div className='absolute left-5 top-0 h-full w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-gray-200 dark:to-gray-700' />

										<div className='space-y-6'>
											{movements.map((movement: any, index: number) => (
												<div
													key={movement.id}
													className='relative flex gap-4 pl-12'>
													{/* Dot del timeline */}
													<div
														className={`absolute left-3 flex h-5 w-5 items-center justify-center rounded-full ${getMovementColor(movement.movement_type?.value)} ring-4 ring-white dark:ring-zinc-900`}>
														<div className='h-2 w-2 rounded-full bg-white' />
													</div>

													{/* Contenido del evento */}
													<div
														className={`flex-1 rounded-xl border p-4 transition-all hover:shadow-md ${
															index === 0
																? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20'
																: 'border-gray-200 bg-white dark:border-gray-700 dark:bg-zinc-800/50'
														}`}>
														{/* Header del evento */}
														<div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
															<div className='flex items-center gap-2'>
																<Icon
																	icon={getMovementIcon(
																		movement.movement_type
																			?.value,
																	)}
																	className='h-5 w-5 text-gray-600 dark:text-gray-400'
																/>
																<span className='font-semibold text-gray-900 dark:text-gray-100'>
																	{movement.movement_type
																		?.label || 'Movimiento'}
																</span>
															</div>
															<span className='text-xs text-gray-400'>
																{formatDate(movement.movement_date)}
															</span>
														</div>

														{/* Cambio de estado */}
														{movement.status?.to && (
															<div className='mb-3 flex items-center gap-2 text-sm'>
																{movement.status.from && (
																	<>
																		<Badge
																			variant='outline'
																			className='text-gray-500 line-through'>
																			{
																				movement.status.from
																					.label
																			}
																		</Badge>
																		<Icon
																			icon='HeroArrowRight'
																			className='h-4 w-4 text-gray-400'
																		/>
																	</>
																)}
																<Badge
																	variant='solid'
																	color='blue'
																	className='font-medium'>
																	{movement.status.to.label}
																</Badge>
															</div>
														)}

														{/* Razón */}
														{movement.reason && (
															<p className='mb-3 text-sm italic text-gray-600 dark:text-gray-400'>
																"{movement.reason}"
															</p>
														)}

														{/* Footer */}
														<div className='flex flex-wrap items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-700'>
															<div className='flex items-center gap-1'>
																<Icon
																	icon='HeroUserCircle'
																	className='h-4 w-4'
																/>
																<span>
																	{movement.performed_by?.name ||
																		'Sistema'}
																</span>
															</div>
															{movement.warehouse?.to && (
																<div className='flex items-center gap-1'>
																	<Icon
																		icon='HeroBuildingStorefront'
																		className='h-4 w-4'
																	/>
																	<span>
																		{movement.warehouse.to.name}
																	</span>
																</div>
															)}
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								) : (
									<div className='flex flex-col items-center justify-center py-16 text-gray-400'>
										<div className='mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800'>
											<Icon icon='HeroClockSolid' className='h-10 w-10' />
										</div>
										<p className='text-lg font-medium'>
											No hay movimientos registrados
										</p>
										<p className='text-sm'>
											El historial de este equipo está vacío
										</p>
									</div>
								)}
							</CardBody>
						</Card>
					</div>
				</div>
			</Container>
		</PageWrapper>
	);
};

export default TraceabilityPage;
