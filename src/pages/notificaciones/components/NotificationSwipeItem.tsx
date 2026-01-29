import React, { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
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
	archiveLabel?: string;
};

const sanitize = (s?: string | null) =>
	(s ? String(s) : '')
		.replace(/\n|\r|\t/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

// Constantes de configuración
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
	// === REFS DOM ===
	const containerRef = useRef<HTMLDivElement>(null);
	const cardRef = useRef<HTMLDivElement>(null);
	const bgRef = useRef<HTMLDivElement>(null);
	const leftIconRef = useRef<HTMLDivElement>(null);
	const rightIconRef = useRef<HTMLDivElement>(null);

	// === REFS TRACKING (sin re-renders) ===
	const startX = useRef(0);
	const startY = useRef(0);
	const currentX = useRef(0);
	const isDragging = useRef(false);
	const isHorizontal = useRef<boolean | null>(null); // null = no decidido, true = horizontal, false = vertical
	const cardWidth = useRef(300);
	const rafId = useRef<number>(0);
	const pointerId = useRef<number | null>(null);

	// === ESTADO REACT (mínimo) ===
	const [showBg, setShowBg] = useState(false);

	// Tap handling
	const lastTapRef = useRef(0);
	const [needSecondTap, setNeedSecondTap] = useState(false);
	const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Threshold dinámico
	const getThreshold = () => cardWidth.current * 0.45;

	// === INICIALIZACIÓN ===
	useLayoutEffect(() => {
		if (cardRef.current) {
			cardWidth.current = cardRef.current.offsetWidth || 300;
			gsap.set(cardRef.current, { x: 0, force3D: true, willChange: 'transform' });
		}
	}, []);

	// === APLICAR VISUALES (llamado en RAF) ===
	const applyVisuals = useCallback(() => {
		const x = currentX.current;
		const threshold = getThreshold();
		const progress = Math.min(Math.abs(x) / threshold, 1);
		const direction = x > 0 ? 'right' : x < 0 ? 'left' : null;

		// Mover tarjeta con gsap.set para sync con GPU
		if (cardRef.current) {
			gsap.set(cardRef.current, { x: x });
		}

		// Mostrar/ocultar background según dirección
		if (bgRef.current) {
			if (direction === 'right' && n.status !== 'read') {
				bgRef.current.style.background = `linear-gradient(90deg, rgba(16, 185, 129, ${progress * 0.4}) 0%, transparent 50%)`;
			} else if (direction === 'left') {
				bgRef.current.style.background = `linear-gradient(270deg, rgba(245, 158, 11, ${progress * 0.4}) 0%, transparent 50%)`;
			} else {
				bgRef.current.style.background = 'transparent';
			}
		}

		// Animar iconos
		if (rightIconRef.current) {
			const scale = direction === 'right' ? 1 + progress * 0.3 : 1;
			const opacity = direction === 'right' ? progress : 0;
			gsap.set(rightIconRef.current, { scale, opacity });
		}
		if (leftIconRef.current) {
			const scale = direction === 'left' ? 1 + progress * 0.3 : 1;
			const opacity = direction === 'left' ? progress : 0;
			gsap.set(leftIconRef.current, { scale, opacity });
		}
	}, [n.status]);

	// === POINTER HANDLERS ===
	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		// Medir ancho actual
		if (cardRef.current) {
			cardWidth.current = cardRef.current.offsetWidth || 300;
		}

		// Capturar pointer
		e.currentTarget.setPointerCapture(e.pointerId);
		pointerId.current = e.pointerId;

		// Reset estado
		startX.current = e.clientX;
		startY.current = e.clientY;
		currentX.current = 0;
		isDragging.current = true;
		isHorizontal.current = null;

		// Mostrar background layer
		setShowBg(true);
	}, []);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!isDragging.current) return;

			const dx = e.clientX - startX.current;
			const dy = e.clientY - startY.current;

			// Decidir dirección si aún no está decidido
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

					// Prevenir scroll mientras hacemos swipe
					if (containerRef.current) {
						containerRef.current.style.touchAction = 'none';
					}
				} else {
					return; // Aún no hay suficiente movimiento
				}
			}

			if (!isHorizontal.current) return;

			// Aplicar resistencia suave después del threshold
			const threshold = getThreshold();
			const maxDrag = cardWidth.current * 0.6;
			let newX = dx;

			if (Math.abs(dx) > threshold) {
				const excess = Math.abs(dx) - threshold;
				const resistance = 1 - (excess / maxDrag) * 0.7;
				newX = Math.sign(dx) * (threshold + excess * Math.max(resistance, 0.2));
			}

			currentX.current = newX;

			// Usar RAF para actualizar visuales
			cancelAnimationFrame(rafId.current);
			rafId.current = requestAnimationFrame(applyVisuals);
		},
		[applyVisuals],
	);

	const handlePointerEnd = useCallback(
		(e: React.PointerEvent) => {
			// Liberar pointer
			try {
				e.currentTarget.releasePointerCapture(e.pointerId);
			} catch {
				// Ignorar
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

			// Ejecutar acción si corresponde
			if (shouldExecute && isHorizontal.current) {
				if (x > 0) {
					// Swipe derecha -> toggle read
					if (n.status !== 'read') {
						onRead(n.id);
					} else {
						onUnread(n.id);
					}
				} else {
					// Swipe izquierda -> archive
					onArchive(n.id);
				}
			}

			// Animar reset suave
			if (cardRef.current) {
				gsap.to(cardRef.current, {
					x: 0,
					duration: shouldExecute ? 0.25 : 0.4,
					ease: shouldExecute ? 'power2.out' : 'elastic.out(1, 0.6)',
					force3D: true,
				});
			}

			// Fade out background e iconos
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

	// Double tap to open
	const handleClick = useCallback(() => {
		if (isHorizontal.current !== null) return; // Fue un swipe

		const now = Date.now();
		if (now - lastTapRef.current < 350) {
			setNeedSecondTap(false);
			onOpen?.(n.id);
			if (tapTimer.current) clearTimeout(tapTimer.current);
			return;
		}

		lastTapRef.current = now;
		setNeedSecondTap(true);
		tapTimer.current = setTimeout(() => setNeedSecondTap(false), 1200);
	}, [n.id, onOpen]);

	// Cleanup
	useEffect(() => {
		return () => {
			cancelAnimationFrame(rafId.current);
			if (tapTimer.current) clearTimeout(tapTimer.current);
		};
	}, []);

	// === RENDER DATA ===
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
			{/* Background con gradientes */}
			{showBg && (
				<div
					ref={bgRef}
					className='pointer-events-none absolute inset-0 rounded-md'
					style={{ opacity: 1 }}>
					{/* Icono izquierdo (archivar) */}
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
					{/* Icono derecho (marcar leída) */}
					<div
						ref={rightIconRef}
						className='absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500'
						style={{ opacity: 0 }}>
						<Icon icon='HeroCheckCircle' className='h-8 w-8' />
					</div>
				</div>
			)}

			{/* Card principal */}
			<div
				ref={cardRef}
				className={`relative cursor-pointer rounded-md border p-3 ${
					n.status === 'read'
						? 'border-emerald-200/50 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-900/20'
						: 'border-rose-200/60 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-900/20'
				}`}
				onClick={handleClick}>
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
			</div>
		</div>
	);
};

export default NotificationSwipeItem;
