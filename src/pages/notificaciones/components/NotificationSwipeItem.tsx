import React, { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import Avatar from '@/components/Avatar';
import Icon from '@/components/icon/Icon';
import type { UserNotificationDTO } from '@/interface/notifications.interface';
import { toast } from 'react-toastify';

type Props = {
	n: UserNotificationDTO;
	onRead: (id: number) => void;
	onUnread: (id: number) => void;
	onArchive: (id: number) => void;
	onDelete?: (id: number) => void;
	onOpen?: (id: number) => void;
	onUnarchive?: (id: number) => void;
	archiveLabel?: string;
};

const sanitize = (s?: string | null) =>
	(s ? String(s) : '')
		.replace(/\n|\r|\t/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const ACTIVATE_PX = 12;
const HV_RATIO = 1.5;

const NotificationSwipeItem: React.FC<Props> = ({
	n,
	onRead,
	onUnread,
	onArchive,
	onDelete,
	onOpen,
	archiveLabel = 'Archivar',
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const cardRef = useRef<HTMLDivElement>(null);
	const bgRef = useRef<HTMLDivElement>(null);
	const leftIconRef = useRef<HTMLDivElement>(null);
	const rightIconRef = useRef<HTMLDivElement>(null);

	const startX = useRef(0);
	const startY = useRef(0);
	const currentX = useRef(0);
	const isDragging = useRef(false);
	const isHorizontal = useRef<boolean | null>(null);
	const cardWidth = useRef(300);
	const rafId = useRef<number>(0);
	const pointerId = useRef<number | null>(null);

	const [showBg, setShowBg] = useState(false);

	const getThreshold = () => cardWidth.current * 0.45;

	useLayoutEffect(() => {
		if (cardRef.current) {
			cardWidth.current = cardRef.current.offsetWidth || 300;
			gsap.set(cardRef.current, { x: 0, force3D: true, willChange: 'transform' });
		}
	}, []);

	const applyVisuals = useCallback(() => {
		const x = currentX.current;
		const threshold = getThreshold();
		const progress = Math.min(Math.abs(x) / threshold, 1);
		const direction = x > 0 ? 'right' : x < 0 ? 'left' : null;

		if (cardRef.current) {
			gsap.set(cardRef.current, { x: x });

			if (direction === 'right') {
				if (n.status === 'read') {
					cardRef.current.style.boxShadow = `inset 0 0 ${20 + progress * 30}px rgba(239, 68, 68, ${progress * 0.3})`;
				} else {
					cardRef.current.style.boxShadow = `inset 0 0 ${20 + progress * 30}px rgba(16, 185, 129, ${progress * 0.3})`;
				}
			} else if (direction === 'left') {
				cardRef.current.style.boxShadow = `inset 0 0 ${20 + progress * 30}px rgba(245, 158, 11, ${progress * 0.3})`;
			} else {
				cardRef.current.style.boxShadow = '';
			}
		}

		if (bgRef.current) {
			if (direction === 'right') {
				if (n.status === 'read') {
					bgRef.current.style.background = `linear-gradient(90deg, rgba(239, 68, 68, ${progress * 0.5}) 0%, transparent 60%)`;
				} else {
					bgRef.current.style.background = `linear-gradient(90deg, rgba(16, 185, 129, ${progress * 0.5}) 0%, transparent 60%)`;
				}
			} else if (direction === 'left') {
				bgRef.current.style.background = `linear-gradient(270deg, rgba(245, 158, 11, ${progress * 0.5}) 0%, transparent 60%)`;
			} else {
				bgRef.current.style.background = 'transparent';
			}
		}

		if (rightIconRef.current) {
			const scale = direction === 'right' ? 1 + progress * 0.4 : 1;
			const opacity = direction === 'right' ? progress : 0;
			gsap.set(rightIconRef.current, { scale, opacity });
		}
		if (leftIconRef.current) {
			const scale = direction === 'left' ? 1 + progress * 0.4 : 1;
			const opacity = direction === 'left' ? progress : 0;
			gsap.set(leftIconRef.current, { scale, opacity });
		}
	}, []);

	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		if (cardRef.current) {
			cardWidth.current = cardRef.current.offsetWidth || 300;
		}

		e.currentTarget.setPointerCapture(e.pointerId);
		pointerId.current = e.pointerId;

		startX.current = e.clientX;
		startY.current = e.clientY;
		currentX.current = 0;
		isDragging.current = true;
		isHorizontal.current = null;

		setShowBg(true);
	}, []);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!isDragging.current) return;

			const dx = e.clientX - startX.current;
			const dy = e.clientY - startY.current;

			if (isHorizontal.current === null) {
				const absX = Math.abs(dx);
				const absY = Math.abs(dy);

				if (absX > ACTIVATE_PX || absY > ACTIVATE_PX) {
					isHorizontal.current = absX > absY * HV_RATIO;

					if (!isHorizontal.current) {
						// Es scroll vertical, cancelar swipe
						isDragging.current = false;
						setShowBg(false);
						return;
					}

					if (containerRef.current) {
						containerRef.current.style.touchAction = 'none';
					}
				} else {
					return;
				}
			}

			if (!isHorizontal.current) return;

			const threshold = getThreshold();
			const maxDrag = cardWidth.current * 0.6;
			let newX = dx;

			if (Math.abs(dx) > threshold) {
				const excess = Math.abs(dx) - threshold;
				const resistance = 1 - (excess / maxDrag) * 0.7;
				newX = Math.sign(dx) * (threshold + excess * Math.max(resistance, 0.2));
			}

			currentX.current = newX;

			cancelAnimationFrame(rafId.current);
			rafId.current = requestAnimationFrame(applyVisuals);
		},
		[applyVisuals],
	);

	const handlePointerEnd = useCallback(
		(e: React.PointerEvent) => {
			try {
				e.currentTarget.releasePointerCapture(e.pointerId);
			} catch {
				return;
			}

			if (!isDragging.current) return;

			cancelAnimationFrame(rafId.current);
			isDragging.current = false;

			// Restaurar touch-action
			if (containerRef.current) {
				containerRef.current.style.touchAction = 'pan-y';
			}

			const x = currentX.current;
			const threshold = getThreshold();
			const shouldExecute = Math.abs(x) >= threshold;

			if (shouldExecute && isHorizontal.current) {
				if (x > 0) {
					try {
						if (n.status !== 'read') {
							onRead(n.id);
							e.currentTarget.releasePointerCapture(e.pointerId);
							toast.success(`La notificación con id: ${n.id} se a marcado como "No Leida" Exitosamente `)
						} else {
							onUnread(n.id);
							e.currentTarget.releasePointerCapture(e.pointerId);
							toast.success(`La notificación con id: ${n.id} se a marcado como "Leida" exitosamente!`)
						}
					} catch {
						toast.error('hubo un error al marcar como leido/no leido el elemento')
					}
				} else {
					try {
						onArchive(n.id);
						e.currentTarget.releasePointerCapture(e.pointerId);
						setTimeout(() => {
							e.currentTarget.releasePointerCapture(e.pointerId);
						}, 100);
						toast.success('Se a Archivado correctamente el elemento')
					} catch {
						toast.error('hubo un error al archivar el elemento')
					}

				}
			} else if (!shouldExecute && isHorizontal.current === null) {
				try {
					onOpen?.(n.id);
					e.currentTarget.releasePointerCapture(e.pointerId);
					toast.success(`Se a abierto correctamente el elemento`, { autoClose: 200 })
				} catch {
					toast.error('hubo un error al abrir el elemento', { autoClose: 200 })
				}
			}
			if (cardRef.current) {
				gsap.to(cardRef.current, {
					x: 0,
					boxShadow: 'none',
					duration: shouldExecute ? 0.25 : 0.4,
					ease: shouldExecute ? 'power2.out' : 'elastic.out(1, 0.6)',
					force3D: true,
				});
			}

			if (bgRef.current) {
				gsap.to(bgRef.current, {
					opacity: 0,
					duration: 0.2,
					onComplete: () => setShowBg(false),
				});
			}
			if (leftIconRef.current) {
				gsap.to(leftIconRef.current, { scale: 1, opacity: 0, duration: 0.2 });
			}
			if (rightIconRef.current) {
				gsap.to(rightIconRef.current, { scale: 1, opacity: 0, duration: 0.2 });
			}

			currentX.current = 0;
			isHorizontal.current = null;
			pointerId.current = null;
		},
		[n.id, n.status, onRead, onUnread, onArchive],
	);

	useEffect(() => {
		return () => {
			cancelAnimationFrame(rafId.current);
		};
	}, []);

	const title = sanitize(n.event?.type_label ?? n.event?.type_key ?? 'Notificación');
	const moduleLabel = sanitize(
		n.event?.module_label ??
		n.event?.module ??
		((n.delivered_channels ?? []).includes('email') ? 'Correo' : 'Sistema'),
	);
	const message = sanitize(n.message ?? '');

	return (
		<div
			ref={containerRef}
			className='relative select-none overflow-hidden'
			style={{ touchAction: 'pan-y' }}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerEnd}
			onPointerCancel={handlePointerEnd}
			onPointerLeave={handlePointerEnd}>
			{showBg && (
				<div
					ref={bgRef}
					className='pointer-events-none absolute inset-0 rounded-md'
					style={{ opacity: 1 }}>
					<div
						ref={leftIconRef}
						className='absolute left-4 top-1/2 -translate-y-1/2 text-amber-500'
						style={{ opacity: 0 }}>
						<Icon
							icon={
								archiveLabel.toLowerCase().includes('des')
									? 'HeroArchiveBoxXMark'
									: 'HeroArchiveBox'
							}
							className='h-8 w-8'
						/>
					</div>
					<div
						ref={rightIconRef}
						className='absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500'
						style={{ opacity: 0 }}>
						<Icon icon='HeroCheckCircle' className='h-8 w-8' />
					</div>
				</div>
			)}
			<div
				ref={cardRef}
				className={`relative cursor-pointer rounded-md border p-3 ${n.status === 'read'
						? 'border-emerald-200/50 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-900/20'
						: 'border-rose-200/60 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-900/20'
					}`}>
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
			</div>
		</div>
	);
};

export default NotificationSwipeItem;
