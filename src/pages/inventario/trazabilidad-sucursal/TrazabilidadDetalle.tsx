import Icon from '@/components/icon/Icon';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchDetalleMovimientoSucursalThunk,
	clearDetalleMovimientoSucursal,
	selectInventarioLoading,
	selectInventarioError,
} from '@/store/slices/inventory/inventorySlice';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserBranches } from '@/hooks/userBrandBranch';
import { selectPersonalizacionUsuario } from '@/store/slices/personalizacion/personalizacionSlice';

type MovementTypeConfig = {
	label: string;
	color: 'emerald' | 'red' | 'blue' | 'amber' | 'violet' | 'zinc';
	icon: string;
};

const MOVEMENT_TYPE_MAP: Record<string, MovementTypeConfig> = {
	initial_balance: { label: 'Balance Inicial', color: 'blue', icon: 'HeroArchiveBox' },
	sale: { label: 'Venta', color: 'emerald', icon: 'HeroShoppingCart' },
	purchase: { label: 'Compra', color: 'violet', icon: 'HeroShoppingBag' },
	transfer_in: { label: 'Transferencia Entrada', color: 'emerald', icon: 'HeroArrowDownTray' },
	transfer_out: { label: 'Transferencia Salida', color: 'red', icon: 'HeroArrowUpTray' },
	adjustment: { label: 'Ajuste', color: 'amber', icon: 'HeroWrenchScrewdriver' },
	return: { label: 'Devolución', color: 'blue', icon: 'HeroArrowUturnLeft' },
	warranty: { label: 'Garantía', color: 'violet', icon: 'HeroShieldCheck' },
	damaged: { label: 'Dañado', color: 'red', icon: 'HeroExclamationTriangle' },
	inventory_backfill: {
		label: 'Backfill de Inventario',
		color: 'blue',
		icon: 'HeroArchiveBoxArrowDown',
	},
};

const getMovementConfig = (type: string): MovementTypeConfig => {
	return (
		MOVEMENT_TYPE_MAP[type] || { label: type, color: 'zinc', icon: 'HeroQuestionMarkCircle' }
	);
};

const formatDate = (dateString: string): string => {
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-CL', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return dateString;
	}
};

const TrazabilidadDetalle = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const detalleMovimiento = useAppSelector((state) => state.inventario.detalleMovimientoSucursal);
	const loading = useAppSelector(selectInventarioLoading);
	const error = useAppSelector(selectInventarioError);
	const currentUser = useAppSelector((state) => state.auth.user);
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);

	const [hasFetched, setHasFetched] = useState(false);

	const userId = currentUser?.id ?? (currentUser as any)?.pk ?? undefined;
	const { branches } = useUserBranches(userId, { enabled: Boolean(userId) });

	const preferredBranchId = useMemo(() => {
		if (personalizacionUsuario?.sucursal_principal)
			return personalizacionUsuario.sucursal_principal;
		if (currentUser?.branch?.id) return currentUser.branch.id;
		if (currentUser?.branch_id) return currentUser.branch_id;
		return null;
	}, [
		personalizacionUsuario?.sucursal_principal,
		currentUser?.branch?.id,
		currentUser?.branch_id,
	]);

	const [branchId, setBranchId] = useState<number | null>(preferredBranchId);

	useEffect(() => {
		if (branchId === null && preferredBranchId) {
			setBranchId(preferredBranchId);
		}
	}, [preferredBranchId, branchId]);

	useEffect(() => {
		const handleExternalBranchChange = (event: Event) => {
			const customEvent = event as CustomEvent<{
				branchId: number | null;
				subsidiaryId?: number | null;
			}>;
			const { detail } = customEvent;
			const nextBranchId = detail?.branchId ?? null;
			if (nextBranchId === null) return;
			setBranchId(nextBranchId);
		};

		window.addEventListener('user-branch-changed', handleExternalBranchChange);
		return () => window.removeEventListener('user-branch-changed', handleExternalBranchChange);
	}, []);

	useEffect(() => {
		if (branchId && id && !hasFetched) {
			dispatch(
				fetchDetalleMovimientoSucursalThunk({
					branch_id: branchId,
					movement_id: parseInt(id, 10),
				}),
			);
			setHasFetched(true);
		}
	}, [branchId, id, dispatch, hasFetched]);

	useEffect(() => {
		return () => {
			dispatch(clearDetalleMovimientoSucursal());
		};
	}, [dispatch]);

	const handleGoBack = useCallback(() => {
		navigate('/inventario/trazabilidad-subsidiary');
	}, [navigate]);

	const handleReload = useCallback(() => {
		if (branchId && id) {
			setHasFetched(false);
			dispatch(
				fetchDetalleMovimientoSucursalThunk({
					branch_id: branchId,
					movement_id: parseInt(id, 10),
				}),
			);
			setHasFetched(true);
		}
	}, [branchId, id, dispatch]);

	const movementConfig = detalleMovimiento
		? getMovementConfig(detalleMovimiento.movement_type)
		: null;

	const quantityStyle = useMemo(() => {
		if (!detalleMovimiento) return { color: 'text-zinc-600', prefix: '' };
		const delta = detalleMovimiento.quantity_delta;
		if (delta > 0) return { color: 'text-emerald-600', prefix: '+' };
		if (delta < 0) return { color: 'text-red-600', prefix: '' };
		return { color: 'text-zinc-600', prefix: '' };
	}, [detalleMovimiento]);

	if (loading || !hasFetched) {
		return (
			<PageWrapper
				isProtectedRoute={true}
				name='trazabilidad-detalle'
				title='Detalle de Movimiento'>
				<Container>
					<div className='flex min-h-[60vh] flex-col items-center justify-center'>
						<Spinner nombre='Cargando detalle del movimiento...' />
					</div>
				</Container>
			</PageWrapper>
		);
	}

	if (error) {
		return (
			<PageWrapper
				isProtectedRoute={true}
				name='trazabilidad-detalle'
				title='Detalle de Movimiento'>
				<Container>
					<div className='flex min-h-[60vh] flex-col items-center justify-center'>
						<Icon
							icon='HeroExclamationCircle'
							className='mb-4 h-16 w-16 text-red-500'
						/>
						<Badge className='px-2 text-xl font-bold text-red-600 dark:text-red-400'>
							Error al cargar el movimiento
						</Badge>
						<p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>{error}</p>
						<div className='mt-4 flex gap-2'>
							<Button variant='outline' onClick={handleGoBack} icon='HeroArrowLeft'>
								Volver
							</Button>
							<Button
								variant='solid'
								color='blue'
								onClick={handleReload}
								icon='HeroArrowPath'>
								Reintentar
							</Button>
						</div>
					</div>
				</Container>
			</PageWrapper>
		);
	}

	if (!detalleMovimiento) {
		return (
			<PageWrapper
				isProtectedRoute={true}
				name='trazabilidad-detalle'
				title='Detalle de Movimiento'>
				<Container>
					<div className='flex min-h-[60vh] flex-col items-center justify-center'>
						<Icon
							icon='HeroDocumentMagnifyingGlass'
							className='mb-4 h-16 w-16 text-zinc-400'
						/>
						<Badge className='px-2 text-xl font-bold text-gray-600 dark:text-gray-300'>
							Movimiento no encontrado
						</Badge>
						<p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
							El movimiento solicitado no existe o no tienes permisos para verlo.
						</p>
						<Button
							variant='outline'
							className='mt-4'
							onClick={handleGoBack}
							icon='HeroArrowLeft'>
							Volver a la lista
						</Button>
					</div>
				</Container>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper
			isProtectedRoute={true}
			name='trazabilidad-detalle'
			title='Detalle de Movimiento'>
			<Subheader>
				<SubheaderLeft>
					<Button variant='outline' size='sm' onClick={handleGoBack} icon='HeroArrowLeft'>
						Volver
					</Button>
					<div className='ml-4 flex flex-col'>
						<Badge className='px-2 text-xl font-bold'>
							Movimiento #{detalleMovimiento.id}
						</Badge>
						<p className='text-sm text-gray-500 dark:text-gray-400'>
							Detalle completo del movimiento de inventario
						</p>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					{movementConfig && (
						<Badge
							color={movementConfig.color}
							variant='solid'
							className='flex items-center gap-2 px-3 py-1'>
							<Icon icon={movementConfig.icon} className='h-4 w-4' />
							{movementConfig.label}
						</Badge>
					)}
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
					{/* Card: Información del Producto */}
					<Card>
						<CardHeader>
							<CardTitle>
								<div className='flex items-center gap-2'>
									<Icon icon='HeroCube' className='h-5 w-5 text-blue-500' />
									<Badge className='px-2'>Producto</Badge>
								</div>
							</CardTitle>
						</CardHeader>
						<CardBody>
							<div className='space-y-4'>
								<div className='flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-700'>
									<span className='text-sm text-gray-500 dark:text-gray-400'>
										Nombre
									</span>
									<span className='font-semibold text-gray-900 dark:text-white'>
										{detalleMovimiento.product?.name ?? 'N/A'}
									</span>
								</div>
								<div className='flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-700'>
									<span className='text-sm text-gray-500 dark:text-gray-400'>
										SKU
									</span>
									<Badge
										color='zinc'
										variant='outline'
										className='px-2 font-mono'>
										{detalleMovimiento.product?.sku ?? 'N/A'}
									</Badge>
								</div>
								<div className='flex items-center justify-between'>
									<span className='text-sm text-gray-500 dark:text-gray-400'>
										ID Producto
									</span>
									<span className='text-gray-700 dark:text-gray-300'>
										#{detalleMovimiento.product?.id ?? 'N/A'}
									</span>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Card: Cambio de Inventario */}
					<Card>
						<CardHeader>
							<CardTitle>
								<div className='flex items-center gap-2'>
									<Icon
										icon='HeroArrowsRightLeft'
										className='h-5 w-5 text-violet-500'
									/>
									<Badge className='px-2'>Cambio de Inventario</Badge>
								</div>
							</CardTitle>
						</CardHeader>
						<CardBody>
							<div className='flex items-center justify-center gap-4 py-4'>
								<div className='flex flex-col items-center'>
									<span className='text-xs text-gray-500 dark:text-gray-400'>
										Antes
									</span>
									<Badge
										color='zinc'
										variant='outline'
										className='mt-1 px-4 py-2 text-2xl font-bold'>
										{detalleMovimiento.balance_before}
									</Badge>
								</div>
								<div className='flex flex-col items-center'>
									<Icon icon='HeroArrowRight' className='h-6 w-6 text-gray-400' />
									<Badge
										color={
											detalleMovimiento.quantity_delta >= 0
												? 'emerald'
												: 'red'
										}
										variant='solid'
										className='mt-1 px-3 py-1 text-lg font-bold'>
										{quantityStyle.prefix}
										{detalleMovimiento.quantity_delta}
									</Badge>
								</div>
								<div className='flex flex-col items-center'>
									<span className='text-xs text-gray-500 dark:text-gray-400'>
										Después
									</span>
									<Badge
										color='blue'
										variant='solid'
										className='mt-1 px-4 py-2 text-2xl font-bold'>
										{detalleMovimiento.balance_after}
									</Badge>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Card: Ubicación */}
					<Card>
						<CardHeader>
							<CardTitle>
								<div className='flex items-center gap-2'>
									<Icon
										icon='HeroBuildingStorefront'
										className='h-5 w-5 text-emerald-500'
									/>
									<Badge className='px-2'>Ubicación</Badge>
								</div>
							</CardTitle>
						</CardHeader>
						<CardBody>
							<div className='space-y-4'>
								<div className='flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-700'>
									<span className='text-sm text-gray-500 dark:text-gray-400'>
										Sucursal
									</span>
									<div className='flex items-center gap-2'>
										<Icon
											icon='HeroBuildingStorefront'
											className='h-4 w-4 text-emerald-500'
										/>
										<span className='font-semibold text-gray-900 dark:text-white'>
											{detalleMovimiento.branch?.name ?? 'N/A'}
										</span>
									</div>
								</div>
								<div className='flex items-center justify-between'>
									<span className='text-sm text-gray-500 dark:text-gray-400'>
										Bodega
									</span>
									<div className='flex items-center gap-2'>
										<Icon
											icon='HeroArchiveBox'
											className='h-4 w-4 text-amber-500'
										/>
										<span className='text-gray-700 dark:text-gray-300'>
											{detalleMovimiento.warehouse?.name ?? 'Sin bodega'}
										</span>
									</div>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Card: Usuario que realizó el movimiento */}
					<Card>
						<CardHeader>
							<CardTitle>
								<div className='flex items-center gap-2'>
									<Icon icon='HeroUser' className='h-5 w-5 text-blue-500' />
									<Badge className='px-2'>Realizado por</Badge>
								</div>
							</CardTitle>
						</CardHeader>
						<CardBody>
							<div className='space-y-4'>
								<div className='flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-700'>
									<span className='text-sm text-gray-500 dark:text-gray-400'>
										Nombre
									</span>
									<span className='font-semibold text-gray-900 dark:text-white'>
										{detalleMovimiento.performed_by?.name ?? 'N/A'}
									</span>
								</div>
								<div className='flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-700'>
									<span className='text-sm text-gray-500 dark:text-gray-400'>
										Email
									</span>
									<a
										href={`mailto:${detalleMovimiento.performed_by?.email}`}
										className='text-blue-600 hover:underline dark:text-blue-400'>
										{detalleMovimiento.performed_by?.email ?? 'N/A'}
									</a>
								</div>
								<div className='flex items-center justify-between'>
									<span className='text-sm text-gray-500 dark:text-gray-400'>
										ID Usuario
									</span>
									<span className='text-gray-700 dark:text-gray-300'>
										#{detalleMovimiento.performed_by?.id ?? 'N/A'}
									</span>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Card: Razón y Origen - Full width */}
					<Card className='lg:col-span-2'>
						<CardHeader>
							<CardTitle>
								<div className='flex items-center gap-2'>
									<Icon
										icon='HeroDocumentText'
										className='h-5 w-5 text-amber-500'
									/>
									<Badge className='px-2'>Detalles del Movimiento</Badge>
								</div>
							</CardTitle>
						</CardHeader>
						<CardBody>
							<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
								<div>
									<h4 className='mb-2 text-sm font-medium text-gray-500 dark:text-gray-400'>
										Razón del movimiento
									</h4>
									<p className='rounded-lg bg-zinc-100 p-3 text-gray-800 dark:bg-zinc-800 dark:text-gray-200'>
										{detalleMovimiento.reason || 'Sin razón especificada'}
									</p>
								</div>
								<div>
									<h4 className='mb-2 text-sm font-medium text-gray-500 dark:text-gray-400'>
										Origen
									</h4>
									<div className='space-y-2 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800'>
										<div className='flex items-center justify-between'>
											<span className='text-sm text-gray-500 dark:text-gray-400'>
												Tipo
											</span>
											<Badge
												color='violet'
												variant='outline'
												className='px-2'>
												{detalleMovimiento.source?.type ?? 'N/A'}
											</Badge>
										</div>
										{detalleMovimiento.source?.id && (
											<div className='flex items-center justify-between'>
												<span className='text-sm text-gray-500 dark:text-gray-400'>
													ID
												</span>
												<span className='text-gray-700 dark:text-gray-300'>
													#{detalleMovimiento.source.id}
												</span>
											</div>
										)}
										{detalleMovimiento.source?.line_id && (
											<div className='flex items-center justify-between'>
												<span className='text-sm text-gray-500 dark:text-gray-400'>
													Línea ID
												</span>
												<span className='text-gray-700 dark:text-gray-300'>
													#{detalleMovimiento.source.line_id}
												</span>
											</div>
										)}
									</div>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Card: Metadatos */}
					{detalleMovimiento.metadata &&
						Object.keys(detalleMovimiento.metadata).length > 0 && (
							<Card className='lg:col-span-2'>
								<CardHeader>
									<CardTitle>
										<div className='flex items-center gap-2'>
											<Icon
												icon='HeroCodeBracket'
												className='h-5 w-5 text-zinc-500'
											/>
											<Badge className='px-2'>Metadatos</Badge>
										</div>
									</CardTitle>
								</CardHeader>
								<CardBody>
									<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
										{Object.entries(detalleMovimiento.metadata).map(
											([key, value]) => (
												<div
													key={key}
													className='rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800'>
													<span className='block text-xs text-gray-500 dark:text-gray-400'>
														{key
															.replace(/_/g, ' ')
															.replace(/\b\w/g, (l) =>
																l.toUpperCase(),
															)}
													</span>
													<span className='mt-1 block font-semibold text-gray-900 dark:text-white'>
														{String(value)}
													</span>
												</div>
											),
										)}
									</div>
								</CardBody>
							</Card>
						)}

					{/* Card: Fechas */}
					<Card className='lg:col-span-2'>
						<CardHeader>
							<CardTitle>
								<div className='flex items-center gap-2'>
									<Icon icon='HeroCalendar' className='h-5 w-5 text-blue-500' />
									<Badge className='px-2'>Fechas</Badge>
								</div>
							</CardTitle>
						</CardHeader>
						<CardBody>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div className='flex items-center justify-between rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800'>
									<div className='flex items-center gap-3'>
										<Icon
											icon='HeroCalendarDays'
											className='h-8 w-8 text-blue-500'
										/>
										<div>
											<span className='block text-xs text-gray-500 dark:text-gray-400'>
												Fecha de ocurrencia
											</span>
											<span className='block font-semibold text-gray-900 dark:text-white'>
												{formatDate(detalleMovimiento.occurred_at)}
											</span>
										</div>
									</div>
								</div>
								<div className='flex items-center justify-between rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800'>
									<div className='flex items-center gap-3'>
										<Icon
											icon='HeroClock'
											className='h-8 w-8 text-emerald-500'
										/>
										<div>
											<span className='block text-xs text-gray-500 dark:text-gray-400'>
												Fecha de registro
											</span>
											<span className='block font-semibold text-gray-900 dark:text-white'>
												{formatDate(detalleMovimiento.created_at)}
											</span>
										</div>
									</div>
								</div>
							</div>
						</CardBody>
					</Card>
				</div>
			</Container>
		</PageWrapper>
	);
};

export default TrazabilidadDetalle;
