import React, { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import Dropdown, { DropdownMenu, DropdownToggle, DropdownNavLinkItem } from '../../../../components/ui/Dropdown';
import Button from '../../../../components/ui/Button';
import Avatar from '../../../../components/Avatar';
import Icon from '../../../../components/icon/Icon';
import { TIcons } from '../../../../types/icons.type';
import { useAppDispatch, useAppSelector } from '@/store';
import { markAllRead, markRead, fetchNotifications } from '@/store/slices/notifications/notificationsSlice';
import { useNavigate } from 'react-router-dom';

interface INotificationItemProps {
  image?: string;
  name: string;
  icon?: TIcons;
  firstLine: ReactNode;
  secondLine: ReactNode;
  isUnread: boolean;
  time: string;
}

const NotificationItem: FC<INotificationItemProps> = ({ image, name, icon, firstLine, secondLine, isUnread, time }) => {
  return (
    <div
      className={`flex min-w-[24rem] gap-2 rounded-lg border px-3 py-2 transition-colors  ${
        isUnread ? 'ring-1 ring-emerald-400/25' : ''
      }`}
    >
      <div className='relative flex-shrink-0'>
        <Avatar src={image} name={name} />
        {icon && (
          <span className='absolute start-3/4 top-3/4 flex rounded-full bg-blue-500/75 outline outline-2 outline-blue-500/75'>
            <Icon icon={icon} />
          </span>
        )}
      </div>
      <div className='grow'>
        <div className='flex gap-2 text-zinc-900'>{firstLine}</div>
        <div className='flex gap-2 text-zinc-700'>{secondLine}</div>
      </div>
      <div className='relative flex flex-shrink-0 items-center'>
        {isUnread && (
          <span className='absolute end-0 top-0 flex h-2 w-2'>
            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75' />
            <span className='relative inline-flex h-2 w-2 rounded-full bg-red-500' />
          </span>
        )}
        <div className='text-zinc-500'>{time}</div>
      </div>
    </div>
  );
};

const clean = (s?: string | null) => (s ? String(s) : '').replace(/\n|\r|\t/g, ' ').replace(/\s+/g, ' ').trim();

const NotificationPartial = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, unreadCount } = useAppSelector((s) => s.notifications ?? { items: [], unreadCount: 0 });

  // Prefetch + polling breve + refresh en focus/visibility para mantener el badge al d
  useEffect(() => {
    const refresh = () => dispatch(fetchNotifications({ per_page: 20 })).catch(() => void 0);
    if (!items.length) refresh();
    const iv = window.setInterval(refresh, 30000);
    const onFocus = () => refresh();
    const onVis = () => { if (!document.hidden) refresh(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(iv);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtro local en el dropdown: por defecto mostrar Todas
  const [tab, setTab] = useState<'unread' | 'read' | 'all'>('all');

  const isRead = (n: any) => (n.status === 'read' || !!n.read_at) && n.status !== 'ack';
  const isUnread = (n: any) => !isRead(n) && n.status !== 'ack';

  const filtered = useMemo(() => {
    if (tab === 'unread') return items.filter(isUnread);
    if (tab === 'read') return items.filter(isRead);
    return items; // all
  }, [items, tab]);
  
  const recent = useMemo(() => filtered.slice(0, 10), [filtered]);


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

  const handleMarkAll = () => dispatch(markAllRead());
  const handleItemClick = (id: number) => {
    dispatch(markRead({ id }));
    navigate(`/notificaciones/${id}`);
  };

  // Fallback local en caso de que el contador tarde en actualizar
  const hasUnread = useMemo(() => items.some((n) => n.status !== 'read' && n.status !== 'ack'), [items]);

  return (
    <div className='relative'>
      <Dropdown>
        <DropdownToggle hasIcon={false}>
          <Button icon='HeroBell' aria-label='Notification' onClick={() => { setTab('all'); dispatch(fetchNotifications({ per_page: 20 })); }} />
        </DropdownToggle>
        <DropdownMenu placement='bottom-end' isCloseAfterLeave={false} className='min-w-[24rem] p-0'>
          <div className='flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800'>
            <div className='font-semibold text-zinc-800 dark:text-zinc-100'>Notificaciones</div>
            <Button size='sm' variant='default' color='violet' onClick={handleMarkAll} isDisable={unreadCount === 0}>Marcar leídas</Button>
          </div>

          <div className='max-h-96 divide-y divide-dashed divide-zinc-500/30 dark:divide-zinc-700/40 overflow-auto px-4 py-2'>
            {recent.map((n) => (
              <div key={n.id} className='cursor-pointer py-3' onClick={() => handleItemClick(n.id)}>
                <NotificationItem
                  name={clean(n.event?.type_label ?? n.event?.type_key ?? 'Notificación')}
                  icon={(n.delivered_channels ?? []).includes('email') ? 'HeroEnvelope' : 'HeroGlobeAlt'}
                  firstLine={
                    <>
                      <b>{clean(n.event?.type_label ?? formatTitle(n))}</b>
                      <span className='text-zinc-500'> &middot; {clean(n.event?.module_label ?? n.event?.module ?? ((n.delivered_channels ?? []).includes('email') ? 'Correo' : 'Sistema'))}</span>
                    </>
                  }
                  secondLine={<span className='text-zinc-700 dark:text-zinc-300'>{clean(n.message ?? '')}</span>}
                  isUnread={isUnread(n)}
                  time={timeAgo(n.created_at)}
                />
              </div>
            ))}
            {recent.length === 0 && (
              <div className='py-6 text-center text-sm text-zinc-500'>Sin notificaciones</div>
            )}
          </div>

          <div className='flex items-center justify-between gap-2 border-t border-zinc-200 px-3 py-2 dark:border-zinc-800'>
            <div className='flex gap-1' onMouseDown={(e) => e.preventDefault()}>
              <button
                type='button'
                className={`px-2 py-1 rounded-md text-xs ${tab === 'unread' ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}
                onClick={() => setTab('unread')}
                aria-label={'Mostrar no leídas'}>{'No leídas'}</button>
              <button
                type='button'
                className={`px-2 py-1 rounded-md text-xs ${tab === 'read' ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}
                onClick={() => setTab('read')}
                aria-label={'Mostrar leídas'}>{'Leídas'}</button>
              <button
                type='button'
                className={`px-2 py-1 rounded-md text-xs ${tab === 'all' ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}
                onClick={() => setTab('all')}
                aria-label='Mostrar todas'>
                Todas
              </button>
            </div>
            <div>
              <DropdownNavLinkItem className='justify-center text-sm' icon='HeroInbox' to='/notificaciones'>
                Ver todas
              </DropdownNavLinkItem>
            </div>
          </div>
        </DropdownMenu>
      </Dropdown>
      {(unreadCount > 0 || hasUnread) && (
        <span className='absolute end-0 top-0 flex h-3 w-3'>
          <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75' />
          <span className='relative inline-flex h-3 w-3 rounded-full bg-red-500' />
        </span>
      )}
    </div>
  );
};

export default NotificationPartial;

// Helpers
function formatTitle(n: { event?: { type_key?: string | null } | null }): string {
  const key = n.event?.type_key ?? '';
  if (!key) return 'Notificación';
  const map: Record<string, string> = {
    'system.sync-failed': 'Sincronización fallida',
    'payment.confirmed': 'Pago confirmado',
    'quote.expiring-soon': 'Cotización por expirar',
  };
  if (map[key]) return map[key];
  return key.replace(/[._-]+/g, ' ').replace(/\\b\\w/g, (s) => s.toUpperCase());
}










