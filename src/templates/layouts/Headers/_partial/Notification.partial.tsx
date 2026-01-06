import React, { FC, ReactNode, useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Dropdown, {
	DropdownMenu,
	DropdownToggle,
	DropdownNavLinkItem,
} from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import Avatar from '@/components/Avatar';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardFooter, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Tabs, { Tab } from '@/components/ui/Tabs';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { TIcons } from '@/types/icons.type';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	markAllRead,
	markRead,
	fetchNotifications,
} from '@/store/slices/notifications/notificationsSlice';
import useDeviceScreen from '@/hooks/useDeviceScreen';
import tokenManager from '@/services/auth/tokenManager';
import { boolean } from 'yup';
import { toast } from 'react-toastify';

const MIN_REFRESH_INTERVAL_MS = 30000;

interface INotificationItemProps {
	image?: string;
	name: string;
	icon?: TIcons;
	title: string;
	moduleLabel?: string;
	message: string;
	isUnread: boolean;
	time: string;
}

const NotificationItem: FC<INotificationItemProps> = ({
	image,
	name,
	icon,
	title,
	moduleLabel,
	message,
	isUnread,
	time,
}) => {
	return (
		<Card
			className={`w-full border border-zinc-700/30 bg-transparent shadow-sm transition-all duration-200 hover:shadow-lg ${
				isUnread ? 'ring-1 ring-emerald-400/40 dark:ring-emerald-300/40' : ''
			}`}>
			<CardBody className='px-4 py-4 '>
				<div className='flex gap-3'>
					<div className='flex-shrink-0'>
						<Avatar src={image} name={name} />
					</div>
					<div className='grow space-y-1'>
						<div className='flex items-center justify-between gap-3'>
							<div className='flex flex-wrap items-center gap-2 text-sm font-semibold leading-snug'>
								<span className='truncate'>{title}</span>
								{moduleLabel && (
									<Badge
										variant='outline'
										color='violet'
										className='flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-3'>
										{icon && <Icon icon={icon} className='h-3 w-3' />}
										<span>{moduleLabel}</span>
									</Badge>
								)}
							</div>
							<div className='flex items-center gap-2 text-xs font-medium uppercase tracking-wide opacity-70'>
								{isUnread && (
									<span className='h-2 w-2 rounded-full bg-emerald-400' />
								)}
								<span>{time}</span>
							</div>
						</div>
						<div className='text-sm leading-relaxed opacity-80'>{message}</div>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

const clean = (s?: string | null) =>
	(s ? String(s) : '')
		.replace(/\n|\r|\t/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const isSseReady = () =>
	typeof window !== 'undefined' && (window as any).__zentriaSseReady === true;

const NotificationPartial = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { items, unreadCount } = useAppSelector(
		(s) => s.notifications ?? { items: [], unreadCount: 0 },
	);
	const { isAuthenticated, access } = useAppSelector((s) => s.auth);
	const { width } = useDeviceScreen();
	const isMobile = (width ?? 0) < 768;
	const [isModalOpen, setIsModalOpen] = useState(false);

	const isFetchingRef = useRef(false);
	const lastFetchTsRef = useRef(0);
	const refresh = useCallback(
		(force = false) => {
			if (!isAuthenticated) return;
			const currentToken = tokenManager.getAccessToken() ?? access;
			if (!currentToken) return;
			if (isFetchingRef.current) return;
			if (!force && isSseReady()) return;
			const now = Date.now();
			if (!force && now - lastFetchTsRef.current < MIN_REFRESH_INTERVAL_MS) return;
			isFetchingRef.current = true;
			dispatch(fetchNotifications({ per_page: 20 }))
				.catch(() => void 0)
				.finally(() => {
					lastFetchTsRef.current = Date.now();
					isFetchingRef.current = false;
				});
		},
		[dispatch, isAuthenticated, access],
	);

	// Prefetch + polling cada 60s + refresh en focus/visibility para mantener el badge al dia
	useEffect(() => {
		if (!isAuthenticated) return;
		if (!items.length) refresh(true);
		const iv = window.setInterval(() => refresh(), 60000);
		const onFocus = () => refresh();
		const onVis = () => {
			if (!document.hidden) refresh();
		};
		window.addEventListener('focus', onFocus);
		document.addEventListener('visibilitychange', onVis);
		return () => {
			window.clearInterval(iv);
			window.removeEventListener('focus', onFocus);
			document.removeEventListener('visibilitychange', onVis);
		};
	}, [items.length, refresh, isAuthenticated]);

	const [tab, setTab] = useState<'unread' | 'read' | 'all'>('all');
	const openPanel = useCallback(() => {
		if (!isAuthenticated) return;
		setTab('all');
		dispatch(fetchNotifications({ per_page: 20 }));
		if (isMobile) {
			setIsModalOpen(true);
		}
	}, [dispatch, isMobile, isAuthenticated]);

	const isRead = useCallback(
		(n: any) => (n.status === 'read' || !!n.read_at) && n.status !== 'ack',
		[],
	);
	const isUnread = useCallback((n: any) => !isRead(n) && n.status !== 'ack', [isRead]);

	const timeAgo = useCallback((iso?: string | null) => {
		if (!iso) return '';
		const diff = Date.now() - new Date(iso).getTime();
		const m = Math.max(0, Math.floor(diff / 60000));
		if (m < 60) return `${m}m`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h`;
		const d = Math.floor(h / 24);
		return `${d}d`;
	}, []);

	const tabItems = useMemo(
		() => ({
			unread: items.filter(isUnread),
			read: items.filter(isRead),
			all: items,
		}),
		[items, isRead, isUnread],
	);

	const handleMarkAll = useCallback(() => dispatch(markAllRead()), [dispatch]);
	const handleItemClick = useCallback(
		(id: number) => {
			dispatch(markRead({ id }));
			navigate(`/notificaciones/${id}`);
			if (isMobile) {
				setIsModalOpen(false);
			}
		},
		[dispatch, navigate, isMobile],
	);

	const renderNotificationList = useCallback(
		(list: any[]) => {
			const recentNotifications = list.slice(0, 10);
			if (!recentNotifications.length) {
				return (
					<div className='py-6 text-center text-sm font-medium opacity-70'>
						Sin notificaciones
					</div>
				);
			}
			return (
				<div className='flex row-span-12 max-h-80 flex-col gap-3 overflow-y-auto py-0 pr-2 min-w-[400px] min-h-[23rem] '>
					{recentNotifications.map((n, index) => (
						<div
							key={n.id}
							className={`space-y-0 w-full cursor-pointer notification-hover-effect animate-notification-in delay-${Math.min(index + 1, 4)}`}
							onClick={() => handleItemClick(n.id)}>
							<NotificationItem
								name={clean(
									n.event?.type_label ?? n.event?.type_key ?? 'Notificacion',
								)}
								icon={
									(n.delivered_channels ?? []).includes('email')
										? 'HeroEnvelope'
										: 'HeroGlobeAlt'
								}
								title={clean(n.event?.type_label ?? formatTitle(n))}
								moduleLabel={clean(
									n.event?.module_label ??
										n.event?.module ??
										((n.delivered_channels ?? []).includes('email')
											? 'Correo'
											: 'Sistema'),
								)}
								message={clean(n.message ?? '')}
								isUnread={isUnread(n)}
								time={timeAgo(n.created_at)}
							/>
						</div>
					))}
				</div>
			);
		},
		[handleItemClick, isUnread, timeAgo],
	);

	const hasUnread = useMemo(
		() => items.some((n) => n.status !== 'read' && n.status !== 'ack'),
		[items],
	);

	interface NotificationTabsProps {
		className?: string;
		contentClassName?: string;
	}

	const NotificationTabs: FC<NotificationTabsProps> = ({
		className = 'px-0',
		contentClassName = 'mt-0 px-0  pt-0',
	}) => (
		<Tabs
			activeTab={tab}
			onTabChange={(value) => setTab(value as 'unread' | 'read' | 'all')}
			className={className}
			contentClassName={contentClassName}>
			<Tab id='unread' text='No leidas' badge={tabItems.unread.length || undefined}>
				{renderNotificationList(tabItems.unread)}
			</Tab>
			<Tab id='read' text='Leidas' badge={tabItems.read.length || undefined}>
				{renderNotificationList(tabItems.read)}
			</Tab>
			<Tab id='all' text='Todas'>
				{renderNotificationList(tabItems.all)}
			</Tab>
		</Tabs>
	);
	
	const NotificationPanelHeader = () => (
		<>
			<div className='flex flex-wrap items-center gap-3 pb-3'>
				<div className='flex items-center gap-2 text-base font-semibold tracking-wide'>
					<span>Notificaciones</span>
					{hasUnread && (
						<Badge
							variant='solid'
							color='emerald'
							className='text-[10px] font-semibold uppercase tracking-wide px-2'>
							{unreadCount ? `${unreadCount} nuevas` : 'Sin leer'}
						</Badge>
					)}
				</div>
				<Button
					size='sm'
					variant='outline'
					color='violet'
					className='border border-dashed border-violet-400 bg-violet-400/30'
					onClick={handleMarkAll}
					isDisable={unreadCount === 0}>
					Marcar leidas
				</Button>
			</div>
			{/* <div className='flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
				<span>{items.length ? `${Math.min(tabItems[tab].length, 10)} visibles` : 'Sin registros'}</span>
				<span>
					{items.length ? `Mostrando ${tabItems[tab].length} en esta vista` : 'Sin notificaciones cargadas'}
				</span>
			</div> */}
		</>
	);
	
	const [IsOpen, setIsOpen] = useState(false)
	
	const handleNavigation = () => {
		try {
			navigate('/notificaciones')
			setIsOpen(false);
		} catch (error) {
			toast.error('No se puedo navegar hacia las Notificaciones')
		}
	}
	const NotificationPanel = () => (
		
		<div className='bg-gray-300 dark:bg-zinc-950 px-2 pt-2 overflow-hidden border border-zinc-200/70 shadow-lg dark:border-zinc-800/70'>
			<div className='flex flex-col gap-3 justify-center item-center pl-3'>
				<NotificationPanelHeader />
			</div>
			<div className='px-0'>
				<div className=''>
					<NotificationTabs />
				</div>
			</div>
			<div className='border-t border-zinc-200/70 px-4 pb-3 pt-3 dark:border-zinc-800/70'>
				<DropdownNavLinkItem
					className='justify-center text-sm'
					icon='HeroInbox'
					to='/notificaciones'
					onClick={handleNavigation}
					>
					Ver todas
				</DropdownNavLinkItem>
			</div>
		</div>
	);

	return (
		<div className='relative'>
			{isMobile ? (
				<div className='relative inline-block'>
					<Button
						icon='DuoNotifications1'
						aria-label='Notification'
						onClick={openPanel}
						className='h-10 w-10 !rounded-full border border-white/60 bg-white !p-0 text-sky-500 shadow-md shadow-sky-200/50 dark:border-white/10 dark:bg-zinc-800 dark:text-sky-300 dark:shadow-[0_4px_18px_rgba(0,0,0,0.55)]'
					/>
					{(unreadCount > 0 || hasUnread) && (
						<span className='pointer-events-none absolute end-0 top-0 flex h-3 w-3'>
							<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75' />
							<span className='relative inline-flex h-3 w-3 rounded-full bg-red-500' />
						</span>
					)}
					<Modal
						isCentered
						isOpen={isModalOpen}
						setIsOpen={setIsModalOpen}
						isScrollable
						size='lg'>
						<ModalHeader className='gap-2 px-4 pb-3 pt-4'>
							<NotificationPanelHeader />
						</ModalHeader>
						<ModalBody isScrollable className='px-3 pb-3 pt-0'>
							<NotificationTabs
								className='px-0'
								contentClassName='mt-0 px-0 pb-3 pt-0'
							/>
						</ModalBody>
						<ModalFooter className='justify-center border-t border-zinc-200/70 dark:border-zinc-800/70'>
							<DropdownNavLinkItem
								className='w-full justify-center text-sm'
								icon='HeroInbox'
								to='/notificaciones'>
								Ver todas
							</DropdownNavLinkItem>
						</ModalFooter>
					</Modal>
				</div>
			) : (
				<Dropdown isOpen={IsOpen} setIsOpen={setIsOpen}>
					<DropdownToggle hasIcon={false}>
						<div className='relative inline-block'>
							<Button
								icon='DuoNotifications1'
								aria-label='Notification'
								onClick={openPanel}
								className='h-10 w-10 !rounded-full border border-white/60 bg-white !p-0 text-sky-500 shadow-md shadow-sky-200/50 dark:border-white/10 dark:bg-zinc-800 dark:text-sky-300 dark:shadow-[0_4px_18px_rgba(0,0,0,0.55)]'
							/>
							{(unreadCount > 0 || hasUnread) && (
								<span className='pointer-events-none absolute end-0 top-0 flex h-3 w-3'>
									<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75' />
									<span className='relative inline-flex h-3 w-3 rounded-full bg-red-500' />
								</span>
							)}
						</div>
					</DropdownToggle>
					<DropdownMenu
						placement='bottom-end'
						isCloseAfterLeave={false}
						className='min-w-[24rem] p-0 pb-0 pt-0 border border-dashed border-zinc-400 dark:border-zinc-800 shadow-2xl overflow-hidden'
						setIsOpen={setIsOpen}
						>
						<NotificationPanel />
					</DropdownMenu>
				</Dropdown>
			)}
		</div>
	);
};

export default NotificationPartial;

// Helpers
function formatTitle(n: { event?: { type_key?: string | null } | null }): string {
	const key = n.event?.type_key ?? '';
	if (!key) return 'Notificacion';
	const map: Record<string, string> = {
		'system.sync-failed': 'Sincronizacion fallida',
		'payment.confirmed': 'Pago confirmado',
		'quote.expiring-soon': 'Cotizacion por expirar',
	};
	if (map[key]) return map[key];
	return key.replace(/[._-]+/g, ' ').replace(/\\b\\w/g, (s) => s.toUpperCase());
}
