import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Modal, { ModalBody, ModalHeader } from './ui/Modal';
import Button from './ui/Button';
import Icon from './icon/Icon';

const mergeClasses = (...classes: Array<string | undefined | false>) =>
	classes.filter(Boolean).join(' ');

export interface ImageZoomProps {
	imageUrl: string;
	alt?: string;
	onClose?: () => void;
	withModal?: boolean;
	thumbnailUrl?: string;
	thumbnailAlt?: string;
	thumbnailClassName?: string;
	containerClassName?: string;
	viewerClassName?: string;
	imageClassName?: string;
	modalTitle?: string;
	modalSubtitle?: string;
	previewLabel?: string;
	renderTrigger?: (open: () => void) => ReactNode;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.25;

const clamp = (v: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, Number(v.toFixed(2))));

const ImageZoomComponent = ({
	imageUrl,
	alt = 'Imagen',
	onClose,
	withModal = true,
	thumbnailUrl,
	thumbnailAlt,
	thumbnailClassName = 'h-28 w-28',
	containerClassName,
	viewerClassName,
	imageClassName,
	modalTitle = 'Imagen ampliada',
	modalSubtitle = 'Click derecho: zoom in. Click izquierdo: zoom out. Rueda del mouse: zoom. Arrastra para mover.',
	previewLabel = 'Ver imagen',
	renderTrigger,
}: ImageZoomProps) => {
	const [isOpen, setIsOpen] = useState(!withModal);
	const [scale, setScale] = useState(1);
	const [hasOpened, setHasOpened] = useState(false);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [isPanning, setIsPanning] = useState(false);
	const [spaceDown, setSpaceDown] = useState(false);

	const viewerRef = useRef<HTMLDivElement>(null);
	const imgRef = useRef<HTMLImageElement>(null);
	const panStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
	const isZoomed = scale > 1.001;

	useEffect(() => {
		if (withModal) {
			setIsOpen(false);
			setHasOpened(false);
		} else {
			setIsOpen(true);
		}
	}, [withModal]);

	useEffect(() => {
		setScale(1);
		setOffset({ x: 0, y: 0 });
	}, [imageUrl]);

	useEffect(() => {
		if (!withModal || !hasOpened) return;
		if (!isOpen) onClose?.();
	}, [hasOpened, isOpen, onClose, withModal]);

	const openModal = () => {
		if (!withModal) return;
		setScale(1);
		setOffset({ x: 0, y: 0 });
		setHasOpened(true);
		setIsOpen(true);
	};

	const resetView = () => {
		setScale(1);
		setOffset({ x: 0, y: 0 });
	};

	const applyZoom = (nextScale: number) => {
		const ns = clamp(nextScale);
		setScale(ns);
		if (ns <= 1.001) setOffset({ x: 0, y: 0 });
	};

	const zoomIn = () => applyZoom(scale + ZOOM_STEP);
	const zoomOut = () => applyZoom(scale - ZOOM_STEP);

	// Limitar el pan para no perder la imagen
	const clampOffset = (x: number, y: number, sc: number) => {
		const el = viewerRef.current;
		const img = imgRef.current;
		if (!el || !img) return { x, y };

		const cw = el.clientWidth;
		const ch = el.clientHeight;

		const nw = img.naturalWidth || 1;
		const nh = img.naturalHeight || 1;

		const containScale = Math.min(cw / nw, ch / nh);
		const baseW = nw * containScale;
		const baseH = nh * containScale;

		const scaledW = baseW * sc;
		const scaledH = baseH * sc;

		const maxX = Math.max(0, (scaledW - cw) / 2);
		const maxY = Math.max(0, (scaledH - ch) / 2);

		return {
			x: Math.max(-maxX, Math.min(maxX, x)),
			y: Math.max(-maxY, Math.min(maxY, y)),
		};
	};

	// Re-clampear offset cuando cambie el zoom
	useEffect(() => {
		setOffset((prev) => clampOffset(prev.x, prev.y, scale));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [scale]);

	// Manejo de tecla Space para pan
	useEffect(() => {
		const down = (ev: KeyboardEvent) => {
			if (ev.code === 'Space') {
				setSpaceDown(true);
				ev.preventDefault();
			}
		};
		const up = (ev: KeyboardEvent) => {
			if (ev.code === 'Space') setSpaceDown(false);
		};
		window.addEventListener('keydown', down, { passive: false });
		window.addEventListener('keyup', up);
		return () => {
			window.removeEventListener('keydown', down as any);
			window.removeEventListener('keyup', up as any);
		};
	}, []);

	// Event handlers
	const onContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		zoomIn();
	};

	const onClickLeft = (e: React.MouseEvent) => {
		if (e.button !== 0) return;
		zoomOut();
	};

	const onWheel = (e: React.WheelEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
		applyZoom(scale + delta);
	};

	const onPointerDownPan = (e: React.PointerEvent) => {
		if (!isZoomed) return;
		e.preventDefault();
		(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
		setIsPanning(true);
		panStartRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
	};

	const onPointerMovePan = (e: React.PointerEvent) => {
		if (!isPanning) return;
		e.preventDefault();
		const dx = e.clientX - panStartRef.current.x;
		const dy = e.clientY - panStartRef.current.y;
		const next = clampOffset(panStartRef.current.ox + dx, panStartRef.current.oy + dy, scale);
		setOffset(next);
	};

	const onPointerUpPan = (e: React.PointerEvent) => {
		if (!isPanning) return;
		e.preventDefault();
		setIsPanning(false);
	};

	const viewer = (
		<div className='relative'>
			{/* Toolbar mejorado */}
			{/* <div className='absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-zinc-700/50 bg-gradient-to-b from-zinc-800/95 to-zinc-900/95 px-4 py-3 shadow-2xl backdrop-blur-xl'>
				<Button
					variant='outline'
					size='sm'
					onClick={(e) => {
						e.stopPropagation();
						zoomOut();
					}}
					disabled={scale <= MIN_SCALE}
					className='group h-10 w-10 justify-center border-zinc-600/50 bg-zinc-800/50 px-0 text-white hover:border-zinc-500 hover:bg-zinc-700/80 disabled:opacity-30'
					aria-label='Alejar'>
					<Icon
						icon='HeroMagnifyingGlassMinus'
						className='text-xl transition-transform group-hover:scale-110'
					/>
				</Button>

				<div className='flex min-w-[80px] flex-col items-center gap-0.5'>
					<span className='text-base font-bold text-white'>
						{Math.round(scale * 100)}%
					</span>
					<span className='text-[10px] font-medium uppercase tracking-wider text-zinc-400'>
						zoom
					</span>
				</div>

				<Button
					variant='outline'
					size='sm'
					onClick={(e) => {
						e.stopPropagation();
						zoomIn();
					}}
					disabled={scale >= MAX_SCALE}
					className='group h-10 w-10 justify-center border-zinc-600/50 bg-zinc-800/50 px-0 text-white hover:border-zinc-500 hover:bg-zinc-700/80 disabled:opacity-30'
					aria-label='Acercar'>
					<Icon
						icon='HeroMagnifyingGlassPlus'
						className='text-xl transition-transform group-hover:scale-110'
					/>
				</Button>

				<div className='mx-1 h-8 w-px bg-zinc-700/50' />

				<Button
					variant='outline'
					size='sm'
					onClick={(e) => {
						e.stopPropagation();
						resetView();
					}}
					className='group h-10 border-zinc-600/50 bg-zinc-800/50 px-4 text-sm font-semibold text-white hover:border-zinc-500 hover:bg-zinc-700/80'
					aria-label='Restablecer vista'>
					<Icon
						icon='HeroArrowPath'
						className='mr-1.5 text-base transition-transform group-hover:rotate-180'
					/>
					Reset
				</Button>
			</div> */}

			{/* Indicador de ayuda flotante cuando no hay zoom */}
			{!isZoomed && (
				<div className='pointer-events-none absolute inset-x-0 bottom-8 z-10 flex justify-center'>
					<div className='flex flex-col items-center gap-3 rounded-2xl border border-blue-500/40 bg-gradient-to-br from-emerald-800/60 to-emerald-600/60 px-6 py-4 backdrop-blur-sm'>
						<div className='flex items-center gap-4 text-sm font-medium text-white'>
							<div className='flex items-center gap-2'>
								<kbd className='rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-bold shadow-lg'>
									Click Derecho
								</kbd>
								<span className='text-blue-200'>→ Acercar</span>
							</div>
							<div className='h-4 w-px bg-white/20' />
							<div className='flex items-center gap-2'>
								<kbd className='rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-bold shadow-lg'>
									Rueda
								</kbd>
								<span className='text-blue-200'>→ Zoom</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Indicador de pan cuando está ampliado */}
			{isZoomed && (
				<div className='pointer-events-none absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/40 to-teal-600/40 px-4 py-2.5 backdrop-blur-sm'>
					<div
						className={mergeClasses(
							'flex items-center gap-2 text-sm font-semibold transition-all',
							isPanning ? 'text-emerald-300' : 'text-white/70',
						)}>
						<Icon
							icon='HeroHandRaised'
							className={mergeClasses('text-base', isPanning && 'animate-pulse')}
						/>
						<span className='ml-1'>
							{isPanning ? '¡Arrastrando!' : 'Arrastra para mover'}
						</span>
					</div>
				</div>
			)}

			{/* Contenedor del viewer */}
			<div
				ref={viewerRef}
				className={mergeClasses(
					'relative flex h-[70vh] min-h-[420px] w-full overflow-hidden rounded-2xl border shadow-2xl px-0',
					isZoomed
						? isPanning
							? 'cursor-grabbing border-emerald-500/50 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900'
							: 'cursor-grab border-blue-500/30 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900'
						: 'cursor-zoom-in border-zinc-700/50 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900',
					viewerClassName,
				)}
				onContextMenu={onContextMenu}
				onMouseDown={onClickLeft}
				onWheel={onWheel}
				onPointerDown={onPointerDownPan}
				onPointerMove={onPointerMovePan}
				onPointerUp={onPointerUpPan}
				onPointerCancel={onPointerUpPan}
				role='presentation'>
				<img
					ref={imgRef}
					src={imageUrl}
					alt={alt}
					draggable={false}
					className={mergeClasses('select-none', imageClassName)}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'contain',
						transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
						transformOrigin: 'center',
						transition: isPanning ? 'none' : 'transform 120ms ease',
					}}
				/>

				{/* Overlay sutil en las esquinas para indicar que es interactivo */}
				<div className='pointer-events-none absolute inset-0'>
					<div className='absolute left-0 top-0 h-32 w-32 bg-gradient-to-br from-blue-500/5 to-transparent' />
					<div className='absolute right-0 top-0 h-32 w-32 bg-gradient-to-bl from-purple-500/5 to-transparent' />
					<div className='absolute bottom-0 left-0 h-32 w-32 bg-gradient-to-tr from-blue-500/5 to-transparent' />
					<div className='absolute bottom-0 right-0 h-32 w-32 bg-gradient-to-tl from-purple-500/5 to-transparent' />
				</div>
			</div>
		</div>
	);

	if (!withModal) {
		return <div className={containerClassName}>{viewer}</div>;
	}

	const defaultTrigger = (
		<Button
			type='button'
			className={mergeClasses(
				'group relative inline-flex cursor-zoom-in overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-lg dark:border-white/10 dark:bg-neutral-900',
				thumbnailClassName,
			)}
			onClick={openModal}>
			<img
				src={thumbnailUrl ?? imageUrl}
				alt={thumbnailAlt ?? alt}
				className='h-full w-full object-cover'
			/>
			<span className='pointer-events-none absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-center text-xs font-medium uppercase tracking-wide text-white transition group-hover:bg-black/80'>
				{previewLabel}
			</span>
		</Button>
	);

	return (
		<div className={mergeClasses('flex flex-col gap-4', containerClassName)}>
			{renderTrigger ? renderTrigger(openModal) : defaultTrigger}

			<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='sm'>
				<ModalHeader>
					<div className='flex flex-col'>
						<span className='text-base'>{modalTitle}</span>
						<span className='text-xs font-normal text-slate-400'>{modalSubtitle}</span>
					</div>
				</ModalHeader>

				{/* sin padding para maximizar viewport */}
				<ModalBody className='bg-transparent p-0 [&:first-child]:pt-0'>
					{viewer}
				</ModalBody>
			</Modal>
		</div>
	);
};

export { ImageZoomComponent as ImageZoom };
export default ImageZoomComponent;
