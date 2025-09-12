import React, { FC, ReactNode, useMemo, useState } from 'react';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '../../../../components/ui/Dropdown';
import Button from '../../../../components/ui/Button';
import Avatar from '../../../../components/Avatar';
import Icon from '../../../../components/icon/Icon';
import { TIcons } from '../../../../types/icons.type';
import notificationsDb, { INotificationMock } from '../../../../mocks/db/notifications.db';

interface INotificationItemProps {
	image?: string;
	name: string;
	icon?: TIcons;
	firstLine: ReactNode;
	secondLine: ReactNode;
	isUnread: boolean;
	time: string;
}
const NotificationItem: FC<INotificationItemProps> = ({
	image,
	name,
	icon,
	firstLine,
	secondLine,
	isUnread,
	time,
}) => {
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
    const [items, setItems] = useState<INotificationMock[]>(notificationsDb);

    const unreadCount = useMemo(
        () => items.filter((n) => n.status !== 'read').length,
        [items],
    );

    const timeAgo = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 60) return `${m}m`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h`;
        const d = Math.floor(h / 24);
        return `${d}d`;
    };

    const markAllAsRead = () => setItems((arr) => arr.map((n) => ({ ...n, status: 'read' })));
    const markAsRead = (id: string) =>
        setItems((arr) => arr.map((n) => (n.id === id ? { ...n, status: 'read' } : n)));

    return (
        <div className='relative'>
            <Dropdown>
                <DropdownToggle hasIcon={false}>
                    <Button icon='HeroBell' aria-label='Notification' />
                </DropdownToggle>
                <DropdownMenu placement='bottom-end' className='min-w-[22rem] p-0'>
                    <div className='flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800'>
                        <div className='font-semibold text-zinc-800 dark:text-zinc-100'>Notificaciones</div>
                        <Button size='sm' variant='default' color='violet' onClick={markAllAsRead}>
                            Marcar leídas
                        </Button>
                    </div>

                    <div className='max-h-96 overflow-auto px-4 py-2 divide-y divide-dashed divide-zinc-500/30'>
                        {items.map((n) => (
                            <div key={n.id} className='py-3 cursor-pointer' onClick={() => markAsRead(n.id)}>
                                <NotificationItem
                                    name={n.title}
                                    icon={n.icon}
                                    firstLine={
                                        <>
                                            <b>{n.title}</b>
                                            <span className='text-zinc-500'>· {n.channel === 'email' ? 'Correo' : 'Sistema'}</span>
                                        </>
                                    }
                                    secondLine={<span className='text-zinc-700'>{n.message}</span>}
                                    isUnread={n.status !== 'read'}
                                    time={timeAgo(n.createdAt)}
                                />
                            </div>
                        ))}
                        {items.length === 0 && (
                            <div className='py-6 text-center text-sm text-zinc-500'>Sin notificaciones</div>
                        )}
                    </div>

                    <div className='border-t border-zinc-200 dark:border-zinc-800 px-2 py-2'>
                        <DropdownItem className='justify-center text-sm' icon='HeroInbox'>
                            Ver todas
                        </DropdownItem>
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
