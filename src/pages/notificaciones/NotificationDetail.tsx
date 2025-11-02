import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
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

	const bg =
		notif?.status === 'read'
			? 'bg-emerald-50/50 border-emerald-200 text-zinc-900 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-zinc-100'
			: 'bg-rose-50/60 border-rose-200 text-zinc-900 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-zinc-100';

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
							<div className={`rounded-md border p-4 ${bg}`}>
								<div className='mb-3 flex items-start gap-2'>
									<div className='flex-1'>
										<div className='flex items-center gap-2'>
											<b className='text-lg'>
												{notif.event?.type_label ??
													notif.event?.type_key ??
													'Notificación'}
											</b>
											<span className='rounded bg-zinc-200/60 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300'>
												{notif.event?.module_label ??
													notif.event?.module ??
													'Sistema'}
											</span>
											{notif.bucket === 'Important' && (
												<span className='rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700'>
													Importante
												</span>
											)}
											<span className='ml-auto text-xs text-zinc-500 dark:text-zinc-400'>
												{timeAgo(notif.created_at)}
											</span>
										</div>
										<div className='mt-1 text-sm text-zinc-700 dark:text-zinc-300'>
											{notif.message ?? ''}
										</div>
									</div>
									{notif.status !== 'read' ? (
										<span className='rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700'>
											No leída
										</span>
									) : (
										<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700'>
											Leída
										</span>
									)}
								</div>
								{/* Resumen en tarjetas */}
								{cards.length > 0 && (
									<div className='mb-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
										{cards.map((c) => (
											<div
												key={c.key}
												className={`rounded-md border border-zinc-200 bg-white/70 p-3 dark:border-zinc-700 dark:bg-zinc-900/60 ${orderClassFor(c.key)}`}>
												<div className='text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
													{c.label}
												</div>
												<div className='mt-0.5 text-sm text-zinc-900 dark:text-zinc-100'>
													{c.value}
												</div>
											</div>
										))}
									</div>
								)}
								{/* Otros detalles */}
								{extraEntries.length > 0 && (
									<div className='order-20 rounded-md border border-zinc-200 bg-white/60 p-3 dark:border-zinc-700 dark:bg-zinc-900/50 sm:order-none'>
										<div className='mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-300'>
											Detalles adicionales
										</div>
										<div className='grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2'>
											{extraEntries.map(([k, v]) => (
												<div key={k} className='flex items-start gap-2'>
													<div className='min-w-[120px] text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
														{k}
													</div>
													<div className='break-words text-sm text-zinc-800 dark:text-zinc-200'>
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
