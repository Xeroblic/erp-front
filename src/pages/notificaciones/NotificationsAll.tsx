import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/form/Select';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchNotifications,
	markAllRead,
	markRead,
	markUnread,
	deleteNotification,
	ackNotification,
	unackNotification,
	setLocalStatus,
} from '@/store/slices/notifications/notificationsSlice';
import NotificationSwipeItem from './components/NotificationSwipeItem';

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

const NotificationsAll: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { items, loading, unreadCount } = useAppSelector(
		(s) => s.notifications ?? { items: [], loading: false, unreadCount: 0 },
	);

	const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread' | 'ack'>('all');
	const [moduleFilter, setModuleFilter] = useState<string>('');
	const [priorityFilter, setPriorityFilter] = useState<string>('');

	const PRIORITY_OPTIONS = useMemo(
		() => [
			{ value: '', label: 'Todas las prioridades' },
			{ value: 'P1', label: 'P1' },
			{ value: 'P2', label: 'P2' },
			{ value: 'P3', label: 'P3' },
		],
		[],
	);

	const clearFilters = () => {
		setModuleFilter('');
		setPriorityFilter('');
		setStatusFilter('all');
	};

	useEffect(() => {
		dispatch(
			fetchNotifications({
				per_page: 50,
				status: statusFilter === 'all' ? 'all' : (statusFilter as any),
				module: moduleFilter || undefined,
				priority: priorityFilter || undefined,
			}),
		).catch(() => void 0);
	}, [dispatch, statusFilter, moduleFilter, priorityFilter]);

	const moduleOptions = useMemo(() => {
		const set = new Set<string>();
		items.forEach((n) => {
			const m = (n.event?.module_label ?? n.event?.module ?? '').toString().trim();
			if (m) set.add(m);
		});
		return Array.from(set.values()).sort();
	}, [items]);

	const visibleItems = useMemo(() => {
		if (statusFilter === 'all') return items.filter((n) => n.status !== 'ack');
		if (statusFilter === 'read') return items.filter((n) => n.status === 'read');
		if (statusFilter === 'unread') return items.filter((n) => n.status === 'unread');
		if (statusFilter === 'ack') return items.filter((n) => n.status === 'ack');
		return items;
	}, [items, statusFilter]);

	const isArchiveView = statusFilter === 'ack';

	return (
		<PageWrapper isProtectedRoute title='Notificaciones' name='Notificaciones'>
			<Container>
				{/* Header / filtros */}
				<Card className='mb-4'>
					<CardHeader>
						<CardTitle>Notificaciones</CardTitle>
					</CardHeader>
					<CardBody>
						<div className='flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
							{/* Estado */}
							<div className='flex w-full flex-wrap gap-2 sm:w-auto'>
								<Button
									className={`rounded-md px-3 py-1.5 text-sm ring-1 ring-zinc-200 dark:ring-zinc-700 ${
										statusFilter === 'all'
											? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white'
											: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
									}`}
									onClick={() => setStatusFilter('all')}>
									Todas
								</Button>
								<Button
									className={`rounded-md px-3 py-1.5 text-sm ring-1 ring-zinc-200 dark:ring-zinc-700 ${
										statusFilter === 'read'
											? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white'
											: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
									}`}
									onClick={() => setStatusFilter('read')}>
									Leídas
								</Button>
								<Button
									className={`rounded-md px-3 py-1.5 text-sm ring-1 ring-zinc-200 dark:ring-zinc-700 ${
										statusFilter === 'unread'
											? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white'
											: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
									}`}
									onClick={() => setStatusFilter('unread')}>
									No leídas
								</Button>
								<Button
									className={`rounded-md px-3 py-1.5 text-sm ring-1 ring-zinc-200 dark:ring-zinc-700 ${
										statusFilter === 'ack'
											? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white'
											: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
									}`}
									onClick={() => setStatusFilter('ack')}>
									Archivadas
								</Button>
							</div>

							{/* Selects */}
							<div className='flex w-full gap-2 sm:w-auto'>
								<Select
									name='module'
									value={moduleFilter}
									onChange={(e) => setModuleFilter(String(e.target.value))}
									className='w-full sm:w-56'
									dimension='sm'
									disabled={loading}>
									<option value=''>Todos los modulos</option>
									{moduleOptions.map((m) => (
										<option key={m} value={m}>
											{m}
										</option>
									))}
								</Select>
								<Select
									name='priority'
									value={priorityFilter}
									onChange={(e) => setPriorityFilter(String(e.target.value))}
									className='w-full sm:w-40'
									dimension='sm'
									disabled={loading}>
									{PRIORITY_OPTIONS.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</Select>
							</div>

							{/* Acciones */}
							<div className='flex w-full gap-2 sm:w-auto'>
								<Button
									className='w-full sm:w-auto'
									size='sm'
									variant='default'
									color='violet'
									onClick={() => dispatch(markAllRead())}
									isDisable={unreadCount === 0}>
									Marcar leídas
								</Button>
								<Button
									className='w-full sm:w-auto'
									size='sm'
									variant='default'
									onClick={() =>
										dispatch(
											fetchNotifications({
												per_page: 50,
												status:
													statusFilter === 'all'
														? 'all'
														: (statusFilter as any),
												module: moduleFilter || undefined,
												priority: priorityFilter || undefined,
											}),
										)
									}
									isLoading={loading}>
									Refrescar
								</Button>
								<Button
									className='w-full sm:w-auto'
									size='sm'
									variant='outline'
									onClick={clearFilters}
									isDisable={loading}>
									Limpiar
								</Button>
							</div>
						</div>
					</CardBody>
				</Card>

				{/* Listado */}
				<Card>
					<CardHeader>
						<CardTitle>Listado de notificaciones</CardTitle>
					</CardHeader>
					<CardBody>
						<div className='space-y-2'>
							{visibleItems.map((n) => (
								<div key={n.id} className='py-1'>
									<div className='mb-1 flex justify-end text-xs text-zinc-500'>
										{timeAgo(n.created_at)}
									</div>
									<NotificationSwipeItem
										n={n}
										onRead={(id) => dispatch(markRead({ id }))}
										onUnread={(id) => dispatch(markUnread({ id }))}
										onArchive={(id) => {
											if (isArchiveView) {
												// Optimista: mandar a "unread" y sacarla de Archivadas al instante
												dispatch(
													setLocalStatus({
														id,
														status: 'unread',
														read_at: null,
														ack_at: null,
													}),
												);
												dispatch(unackNotification({ id }))
													.unwrap()
													.then(() => {
														// Asegurar persistencia en backend: dejar como No leída
														dispatch(markUnread({ id })).catch(
															() => void 0,
														);
													})
													.catch(() => {
														// Revertir si falla
														dispatch(
															setLocalStatus({ id, status: 'ack' }),
														);
													});
											} else {
												dispatch(ackNotification({ id }));
											}
										}}
										archiveLabel={isArchiveView ? 'Desarchivar' : 'Archivar'}
										onDelete={(id) => dispatch(deleteNotification({ id }))}
										onOpen={(id) => {
											if (n.status !== 'read') dispatch(markRead({ id }));
											navigate(`/notificaciones/${id}`);
										}}
									/>
								</div>
							))}
							{items.length === 0 && (
								<div className='py-10 text-center text-sm text-zinc-500'>
									No hay notificaciones
								</div>
							)}
						</div>
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
};

export default NotificationsAll;
