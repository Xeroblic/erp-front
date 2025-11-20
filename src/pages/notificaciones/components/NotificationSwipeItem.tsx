import React, { useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import Avatar from '@/components/Avatar';
import Icon from '@/components/icon/Icon';
import type { UserNotificationDTO } from '@/interface/notifications.interface';

type Props = {
	n: UserNotificationDTO;
	onRead: (id: number) => void;
	onUnread: (id: number) => void;
	onArchive: (id: number) => void;
	onDelete?: (id: number) => void;
	onOpen?: (id: number) => void;
	onUnarchive?: (id: number) => void;
	archiveLabel?: string; // "Archivar" | "Desarchivar"
};

const sanitize = (s?: string | null) =>
	(s ? String(s) : '')
		.replace(/\n|\r|\t/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const THRESHOLD = 80; // px para disparar acciones
const ACTIVATE_PX = 18; // px para entrar en modo swipe
const HV_RATIO = 2; // horizontal debe ser 2x vertical

const NotificationSwipeItem: React.FC<Props> = ({
	n,
	onRead,
	onUnread,
	onArchive,
	onDelete,
	onOpen,
	archiveLabel = 'Archivar',
}) => {
	const startX = useRef<number | null>(null);
	const startY = useRef<number | null>(null);
	const [dx, setDx] = useState(0);
	const [pointerActive, setPointerActive] = useState(false);
	const [isSwiping, setIsSwiping] = useState(false);
	const lastTapRef = useRef<number>(0);
	const tapHintTimer = useRef<number | null>(null);
	const [needSecondTap, setNeedSecondTap] = useState(false);

	const x = useMotionValue(0);

	const handlePointerDown = (e: React.PointerEvent) => {
		startX.current = e.clientX;
		startY.current = e.clientY;
		setPointerActive(true);
		setIsSwiping(false);
		setDx(0);
		x.set(0);
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (startX.current == null || startY.current == null || !pointerActive) return;
		const deltaX = e.clientX - startX.current;
		const deltaY = e.clientY - startY.current;
		// Activar swipe solo si el movimiento horizontal domina claramente
		if (!isSwiping) {
			const absX = Math.abs(deltaX);
			const absY = Math.abs(deltaY);
			if (absX >= ACTIVATE_PX && absX > absY * HV_RATIO) {
				setIsSwiping(true);
			} else {
				// Si el movimiento vertical domina, no mostramos overlay ni arrastre
				return;
			}
		}
		setDx(deltaX);
		x.set(deltaX);
	};

	const smoothReset = () => animate(x, 0, { type: 'spring', stiffness: 260, damping: 24 });

	const handlePointerUp = () => {
		if (startX.current == null) return;
		const delta = x.get();
		setPointerActive(false);
		setIsSwiping(false);
		setDx(0);
		startX.current = null;
		startY.current = null;

		if (delta > THRESHOLD) {
			// swipe right => Toggle leído/no leído
			if (n.status !== 'read') {
				onRead(n.id);
			} else {
				onUnread(n.id);
			}
			smoothReset();
		} else if (delta < -THRESHOLD) {
			// swipe left => Archivar/Desarchivar
			onArchive(n.id);
			smoothReset();
		} else {
			smoothReset();
		}
	};

	const handleClick = () => {
		if (isSwiping || Math.abs(dx) >= 3) return;
		const now = Date.now();
		if (now - (lastTapRef.current || 0) < 350) {
			setNeedSecondTap(false);
			lastTapRef.current = 0;
			onOpen && onOpen(n.id);
			return;
		}
		lastTapRef.current = now;
		setNeedSecondTap(true);
		if (tapHintTimer.current) window.clearTimeout(tapHintTimer.current);
		tapHintTimer.current = window.setTimeout(
			() => setNeedSecondTap(false),
			1200,
		) as unknown as number;
	};

	const title = sanitize(n.event?.type_label ?? n.event?.type_key ?? 'Notificación');
	const moduleLabel = sanitize(
		n.event?.module_label ??
			n.event?.module ??
			((n.delivered_channels ?? []).includes('email') ? 'Correo' : 'Sistema'),
	);
	const message = sanitize(n.message ?? '');

	const rightAlpha = (n.status !== 'read' ? Math.min(Math.max(dx, 0) / THRESHOLD, 1) : 0) * 0.25; // emerald only if unread
	const leftAlpha = Math.min(Math.max(-dx, 0) / THRESHOLD, 1) * 0.25; // amber

	return (
		<div
			className='relative select-none'
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
			style={{ touchAction: 'pan-y' }}>
			{/* Fondo con feedback de color mientras se arrastra */}
			{isSwiping && (
				<div
					className='absolute inset-0 overflow-hidden'
					style={{ opacity: Math.abs(dx) > 1 ? 1 : 0 }}>
					<div
						className='pointer-events-none absolute inset-y-0 left-0 w-1/2'
						style={{ backgroundColor: `rgba(16, 185, 129, ${rightAlpha})` }}
					/>
					<div
						className='pointer-events-none absolute inset-y-0 right-0 w-1/2'
						style={{ backgroundColor: `rgba(245, 158, 11, ${leftAlpha})` }}
					/>
					<div className='pointer-events-none absolute inset-0 flex items-center justify-between px-4'>
						<div className='flex items-center gap-2 text-emerald-600'>
							<Icon icon='HeroCheckCircle' className='h-5 w-5' />
							<span className='hidden text-sm sm:inline'>
								{n.status !== 'read' ? 'Marcar leída' : 'Leída'}
							</span>
						</div>
						<div className='flex items-center gap-2 text-amber-600'>
							<Icon
								icon={
									archiveLabel.toLowerCase().includes('des')
										? 'HeroArchiveBoxXMark'
										: 'HeroArchiveBox'
								}
								className='h-5 w-5'
							/>
							<span className='hidden text-sm sm:inline'>{archiveLabel}</span>
						</div>
					</div>
				</div>
			)}

			{/* Tarjeta en primer plano con transición suave */}
			<motion.div
				style={{ x }}
				className={`relative rounded-md border p-3 shadow-sm ${
					n.status === 'read'
						? 'border-emerald-200/50 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-900/20'
						: 'border-rose-200/60 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-900/20'
				}`}
				onClick={handleClick}
				onDoubleClick={() => onOpen && onOpen(n.id)}>
				<div className='grid grid-cols-[auto_1fr_auto] items-start gap-3'>
					<div className='relative'>
						<Avatar name={n.event?.type_key ?? 'N'} />
						{(n.delivered_channels ?? []).includes('email') && (
							<span className='absolute start-3/4 top-3/4 flex rounded-full bg-blue-500/75 outline outline-2 outline-blue-500/75'>
								<Icon icon='HeroEnvelope' />
							</span>
						)}
					</div>
					<div>
						<div className='flex items-center gap-2'>
							<b className='text-zinc-900 dark:text-zinc-100'>{title}</b>
							<span className='text-zinc-500'>· {moduleLabel}</span>
							{n.bucket === 'Important' && (
								<span className='rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700'>
									Importante
								</span>
							)}
						</div>
						<div className='text-sm text-zinc-700 dark:text-zinc-300'>{message}</div>
						<div className='mt-2 flex items-center gap-3'>
							{n.status !== 'read' ? (
								<span className='rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700'>
									No leída
								</span>
							) : (
								<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700'>
									Leída
								</span>
							)}
							<button
								className='text-xs text-zinc-500 hover:underline'
								onClick={(e) => {
									e.stopPropagation();
									onArchive(n.id);
								}}>
								{archiveLabel}
							</button>
							{onDelete && (
								<button
									className='text-xs text-red-600 hover:underline'
									onClick={(e) => {
										e.stopPropagation();
										onDelete(n.id);
									}}>
									Eliminar
								</button>
							)}
							{needSecondTap && (
								<span className='text-[11px] text-zinc-500 dark:text-zinc-400'>
									Toca de nuevo para abrir
								</span>
							)}
						</div>
					</div>
					<div className='relative justify-self-end text-zinc-500'>
						{n.status !== 'read' && (
							<span className='absolute -right-1 -top-1 flex h-2 w-2'>
								<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75' />
								<span className='relative inline-flex h-2 w-2 rounded-full bg-red-500' />
							</span>
						)}
					</div>
				</div>
			</motion.div>
		</div>
	);
};

export default NotificationSwipeItem;
