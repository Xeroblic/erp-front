import React, { FC, ReactNode, useMemo } from 'react';
import Dropdown, { DropdownMenu, DropdownToggle, DropdownNavLinkItem } from '../../../../components/ui/Dropdown';
import Button from '../../../../components/ui/Button';
import Avatar from '../../../../components/Avatar';
import Icon from '../../../../components/icon/Icon';
import { TIcons } from '../../../../types/icons.type';
import { useAppDispatch, useAppSelector } from '@/store';
import { markAllRead, markRead } from '@/store/slices/notifications/notificationsSlice';

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
    <div className='flex min-w-[24rem] gap-2'>
      <div className='relative flex-shrink-0'>
        <Avatar src={image} name={name} />
        {icon && (
          <span className='absolute start-3/4 top-3/4 flex rounded-full bg-blue-500/75 outline outline-2 outline-blue-500/75'>
            <Icon icon={icon} />
          </span>
        )}
      </div>
      <div className='grow'>
        <div className='flex gap-2'>{firstLine}</div>
        <div className='flex gap-2'>{secondLine}</div>
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

const NotificationPartial = () => {
  const dispatch = useAppDispatch();
  const { items, unreadCount } = useAppSelector((s) => s.notifications ?? { items: [], unreadCount: 0 });

  const recent = useMemo(() => items.slice(0, 10), [items]);

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
  const handleItemClick = (id: number) => dispatch(markRead({ id }));

  return (
    <div className='relative'>
      <Dropdown>
        <DropdownToggle hasIcon={false}>
          <Button icon='HeroBell' aria-label='Notification' />
        </DropdownToggle>
        <DropdownMenu placement='bottom-end' className='min-w-[22rem] p-0'>
          <div className='flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800'>
            <div className='font-semibold text-zinc-800 dark:text-zinc-100'>Notificaciones</div>
            <Button size='sm' variant='default' color='violet' onClick={handleMarkAll}>
              Marcar leídas
            </Button>
          </div>

          <div className='max-h-96 overflow-auto px-4 py-2 divide-y divide-dashed divide-zinc-500/30'>
            {recent.map((n) => (
              <div key={n.id} className='py-3 cursor-pointer' onClick={() => handleItemClick(n.id)}>
                <NotificationItem
                  name={n.event?.type_key ?? 'Notificación'}
                  icon={(n.delivered_channels ?? []).includes('email') ? 'HeroEnvelope' : 'HeroGlobeAlt'}
                  firstLine={
                    <>
                      <b>{formatTitle(n)}</b>
                      <span className='text-zinc-500'> · {n.event?.module ?? ((n.delivered_channels ?? []).includes('email') ? 'Correo' : 'Sistema')}</span>
                    </>
                  }
                  secondLine={<span className='text-zinc-700'>{n.message ?? ''}</span>}
                  isUnread={n.status !== 'read' && !n.read_at}
                  time={timeAgo(n.created_at)}
                />
              </div>
            ))}
            {recent.length === 0 && (
              <div className='py-6 text-center text-sm text-zinc-500'>Sin notificaciones</div>
            )}
          </div>

          <div className='border-t border-zinc-200 dark:border-zinc-800 px-2 py-2'>
            <DropdownNavLinkItem className='justify-center text-sm' icon='HeroInbox' to='/notificaciones'>
              Ver todas
            </DropdownNavLinkItem>
          </div>
        </DropdownMenu>
      </Dropdown>
      {unreadCount > 0 && (
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
  return key.replace(/[._-]+/g, ' ').replace(/\b\w/g, (s) => s.toUpperCase());
}

