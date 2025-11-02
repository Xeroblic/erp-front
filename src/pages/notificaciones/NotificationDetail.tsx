import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	ackNotification,
	deleteNotification,
	fetchNotifications,
	markRead,
} from '@/store/slices/notifications/notificationsSlice';
import Container from '@/components/layouts/Container/Container';

const timeAgo = (iso?: string | null) => {
	if (!iso) return '';
	const diff = Date.now() - new Date(iso).getTime();
	const m = Math.max(0, Math.floor(diff / 60000));
	if (m < 60) return `${m}m`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h`;
	const d = Math.floor(h / 24);
	return `${d}d`;
};

const NotificationDetail: React.FC = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { items, loading } = useAppSelector(
		(s) => s.notifications ?? { items: [], loading: false },
	);

	const nid = Number(id);
	const notif = useMemo(() => items.find((n) => n.id === nid), [items, nid]);

	useEffect(() => {
		if (!notif) {
			dispatch(fetchNotifications({ per_page: 50 })).catch(() => void 0);
		}
	}, [dispatch, notif]);

	const markAsRead = () => {
		if (notif && notif.status !== 'read') dispatch(markRead({ id: notif.id }));
	};
	const archive = () => notif && dispatch(ackNotification({ id: notif.id }));
	const remove = async () => {
		if (notif) {
			await dispatch(deleteNotification({ id: notif.id }));
			navigate('/notificaciones');
		}
	};

	// Determine notification type color scheme
	const getNotificationColors = () => {
		const module = notif?.event?.module_label ?? notif?.event?.module ?? '';
		const isImportant = notif?.bucket === 'Important';
		
		if (isImportant) {
			return {
				bg: 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30',
				border: 'border-rose-200 dark:border-rose-900/50',
				icon: 'HeroExclamationTriangle',
				iconColor: 'text-rose-600 dark:text-rose-400',
				iconBg: 'bg-rose-100 dark:bg-rose-900/50',
			};
		}
		
		if (module.toLowerCase().includes('inventario')) {
			return {
				bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
				border: 'border-blue-200 dark:border-blue-900/50',
				icon: 'HeroArchiveBox',
				iconColor: 'text-blue-600 dark:text-blue-400',
				iconBg: 'bg-blue-100 dark:bg-blue-900/50',
			};
		}
		
		if (module.toLowerCase().includes('producto')) {
			return {
				bg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30',
				border: 'border-purple-200 dark:border-purple-900/50',
				icon: 'HeroCube',
				iconColor: 'text-purple-600 dark:text-purple-400',
				iconBg: 'bg-purple-100 dark:bg-purple-900/50',
			};
		}
		
		return {
			bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
			border: 'border-emerald-200 dark:border-emerald-900/50',
			icon: 'HeroBell',
			iconColor: 'text-emerald-600 dark:text-emerald-400',
			iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
		};
	};

	const colors = getNotificationColors();

	// Helpers to render payload as cards
	const payload = (notif?.event?.payload ?? {}) as Record<string, any>;
	const cards: Array<{ key: string; label: string; value: string }> = [];
	const add = (key: string, label: string) => {
		const v = payload[key];
		if (v !== undefined && v !== null && String(v).trim() !== '') {
			cards.push({ key, label, value: String(v) });
		}
	};

	// Common fields per modules
	add('product_name', 'Producto');
	add('sku', 'SKU');
	add('brand_name', 'Marca');
	add('category_name', 'Categoría');
	add('warehouse_name', 'Bodega');
	add('batch_code', 'Lote');
	add('expected_quantity', 'Cantidad esperada');
	add('branch_name', 'Sucursal');
	add('subsidiary_name', 'Subempresa');
	add('company_name', 'Empresa');
	add('created_by', 'Creado por');
	add('updated_by', 'Actualizado por');

	const usedKeys = new Set(cards.map((c) => c.key));
	const extraEntries = Object.entries(payload).filter(
		([k, v]) => !usedKeys.has(k) && v !== null && v !== undefined,
	);

	// Responsive order on mobile (base). On sm+ restore natural flow with order-none
	const orderClassFor = (key: string): string => {
		switch (key) {
			case 'warehouse_name':
			case 'warehouse':
				return 'order-1 sm:order-none';
			case 'batch_code':
				return 'order-2 sm:order-none';
			case 'expected_quantity':
				return 'order-3 sm:order-none';
			case 'created_by':
				return 'order-4 sm:order-none';
			case 'product_name':
				return 'order-1 sm:order-none';
			case 'sku':
				return 'order-2 sm:order-none';
			case 'brand_name':
				return 'order-3 sm:order-none';
			case 'category_name':
				return 'order-4 sm:order-none';
			case 'branch_name':
				return 'order-5 sm:order-none';
			case 'subsidiary_name':
				return 'order-6 sm:order-none';
			case 'company_name':
				return 'order-7 sm:order-none';
			default:
				return 'order-10 sm:order-none';
		}
	};

	return (
		<PageWrapper
			isProtectedRoute
			title='Detalle de notificación'
			name='Detalle de notificación'>
			<Container>
				<Card>
					<CardHeader>
						<CardHeaderChild>
							<div className='flex items-center gap-3'>
								<Button
									size='sm'
									variant='outline'
									icon='HeroArrowLeft'
									onClick={() => navigate('/notificaciones')}>
									Volver
								</Button>
								<CardTitle>Notificación</CardTitle>
							</div>
						</CardHeaderChild>
						<CardHeaderChild>
							<div className='flex gap-2'>
								{notif?.status !== 'read' && (
									<Button
										size='sm'
										variant='default'
										color='emerald'
										onClick={markAsRead}>
										Marcar leída
									</Button>
								)}
								<Button size='sm' variant='default' onClick={archive}>
									Archivar
								</Button>
								<Button size='sm' variant='default' color='red' onClick={remove}>
									Eliminar
								</Button>
							</div>
						</CardHeaderChild>
					</CardHeader>
					<CardBody>
						{!notif && (
							<div className='text-sm text-zinc-500'>
								{loading ? 'Cargando…' : 'No encontrada'}
							</div>
						)}
						{notif && (
							<div className='space-y-6'>
								{/* Header Section with Icon and Main Info */}
								<div className={`relative overflow-hidden rounded-xl border ${colors.border} ${colors.bg} p-6 shadow-sm transition-all duration-300 hover:shadow-md`}>
									<div className='flex items-start gap-4'>
										{/* Icon */}
										<div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl ${colors.iconBg} shadow-sm`}>
											<Icon icon={colors.icon} className={`text-2xl ${colors.iconColor}`} />
										</div>

										{/* Main Content */}
										<div className='flex-1 min-w-0'>
											<div className='flex flex-wrap items-start gap-2 mb-2'>
												<h2 className='text-xl font-bold text-zinc-900 dark:text-zinc-50'>
													{notif.event?.type_label ??
														notif.event?.type_key ??
														'Notificación'}
												</h2>
												<span className='inline-flex items-center gap-1.5 rounded-lg bg-white/80 dark:bg-zinc-800/80 px-3 py-1 text-sm font-medium text-zinc-700 dark:text-zinc-200 shadow-sm backdrop-blur-sm'>
													<Icon icon='HeroRectangleStack' className='text-base' />
													{notif.event?.module_label ??
														notif.event?.module ??
														'Sistema'}
												</span>
												{notif.bucket === 'Important' && (
													<span className='inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1 text-sm font-semibold text-white shadow-sm animate-pulse'>
														<Icon icon='HeroExclamationTriangle' className='text-base' />
														Importante
													</span>
												)}
											</div>
											<p className='text-base text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3'>
												{notif.message ?? ''}
											</p>
											<div className='flex flex-wrap items-center gap-3 text-sm'>
												<span className='flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400'>
													<Icon icon='HeroClock' className='text-base' />
													{timeAgo(notif.created_at)}
												</span>
												{notif.status !== 'read' ? (
													<span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-200 dark:ring-emerald-800'>
														<span className='h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse'></span>
														No leída
													</span>
												) : (
													<span className='inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400'>
														<Icon icon='HeroCheckCircle' className='text-sm' />
														Leída
													</span>
												)}
											</div>
										</div>
									</div>
								</div>

								{/* Details Cards Grid */}
								{cards.length > 0 && (
									<div>
										<h3 className='mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400'>
											<Icon icon='HeroInformationCircle' className='text-lg' />
											Detalles
										</h3>
										<div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
											{cards.map((c) => (
												<div
													key={c.key}
													className={`group relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600 ${orderClassFor(c.key)}`}>
													<div className='absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300'></div>
													<div className='text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5'>
														{c.label}
													</div>
													<div className='text-base font-medium text-zinc-900 dark:text-zinc-50 break-words'>
														{c.value}
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Additional Details Section */}
								{extraEntries.length > 0 && (
									<div className='rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 backdrop-blur-sm'>
										<h3 className='mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400'>
											<Icon icon='HeroListBullet' className='text-lg' />
											Información Adicional
										</h3>
										<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
											{extraEntries.map(([k, v]) => (
												<div key={k} className='flex flex-col gap-1'>
													<div className='text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
														{k}
													</div>
													<div className='text-sm font-medium text-zinc-800 dark:text-zinc-200 break-words'>
														{String(v)}
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
};

export default NotificationDetail;
