/**
 * GallerySection
 * Pestaña de Galería/Fotos para la revisión técnica de un equipo.
 * Las fotos van asociadas al item de la revisión.
 *
 * Se usa como una sección más del FormShell (misma tira de pestañas), pero no
 * participa del formulario react-hook-form: gestiona su propio estado vía
 * `useReviewPhotos` y obtiene el contexto (item + subsidiaria) de
 * `ReviewPhotosContext`.
 *
 * Permisos:
 *   - Ver galería:      view-technical-reviews-items
 *   - Subir / eliminar: review-technical-reviews-items
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import useCan from '@/hooks/useCan';
import type { FormSectionProps } from '../types';
import { useReviewPhotosContext } from './ReviewPhotosContext';
import { useReviewPhotos } from './useReviewPhotos';
import {
	MAX_PHOTO_SIZE_KB,
	MAX_PHOTOS_PER_UPLOAD,
	PHOTO_ACCEPT_ATTR,
	PHOTO_EDIT_PERMISSION,
	PHOTO_VIEW_PERMISSION,
} from './gallery.constants';

function GallerySection<T extends FieldValues>({ readOnly }: FormSectionProps<T>) {
	const { subsidiaryId, itemId } = useReviewPhotosContext();
	const { has } = useCan();

	const canView = has(PHOTO_VIEW_PERMISSION);
	const canEdit = !readOnly && has(PHOTO_EDIT_PERMISSION);

	const { photos, loading, uploading, deletingId, error, refresh, upload, remove } =
		useReviewPhotos({
			subsidiaryId,
			itemId,
			enabled: canView,
		});

	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [confirmId, setConfirmId] = useState<number | null>(null);
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

	const lightboxPhoto = lightboxIndex !== null ? (photos[lightboxIndex] ?? null) : null;

	const closeLightbox = useCallback(() => setLightboxIndex(null), []);
	const showPrev = useCallback(() => {
		setLightboxIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
	}, [photos.length]);
	const showNext = useCallback(() => {
		setLightboxIndex((i) => (i === null ? i : (i + 1) % photos.length));
	}, [photos.length]);

	// Navegación por teclado del lightbox (Esc / ← / →)
	useEffect(() => {
		if (lightboxIndex === null) return undefined;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') closeLightbox();
			else if (e.key === 'ArrowLeft') showPrev();
			else if (e.key === 'ArrowRight') showNext();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [lightboxIndex, closeLightbox, showPrev, showNext]);

	const handleFiles = useCallback(
		(fileList: FileList | null) => {
			if (!fileList || fileList.length === 0) return;
			void upload(Array.from(fileList));
		},
		[upload],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			setIsDragging(false);
			if (!canEdit || uploading) return;
			handleFiles(e.dataTransfer.files);
		},
		[canEdit, uploading, handleFiles],
	);

	const handleConfirmDelete = useCallback(
		(mediaId: number) => {
			setConfirmId(null);
			void remove(mediaId);
		},
		[remove],
	);

	// ─── Sin contexto de item (no debería ocurrir dentro de la revisión) ─────
	if (!itemId || !subsidiaryId) {
		return (
			<div className='flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 py-12 text-center dark:border-zinc-700'>
				<Icon icon='HeroPhoto' className='h-8 w-8 text-zinc-400' />
				<p className='text-sm text-zinc-500'>
					Guarda la revisión para poder adjuntar fotos.
				</p>
			</div>
		);
	}

	// ─── Sin permiso de lectura ──────────────────────────────────────────────
	if (!canView) {
		return (
			<div className='flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 py-12 text-center dark:border-zinc-700'>
				<Icon icon='HeroLockClosed' className='h-8 w-8 text-zinc-400' />
				<p className='text-sm text-zinc-500'>No tienes permiso para ver las fotos.</p>
			</div>
		);
	}

	return (
		<div className='space-y-5'>
			{/* ─── Encabezado: conteo + refrescar ────────────────────────── */}
			<div className='flex items-center justify-between'>
				<p className='text-sm font-semibold text-zinc-600 dark:text-zinc-300'>
					{photos.length === 0
						? 'Sin fotos'
						: `${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'}`}
				</p>
				<button
					type='button'
					onClick={() => void refresh()}
					disabled={loading}
					title='Actualizar galería'
					className='flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'>
					<Icon
						icon='HeroArrowPath'
						className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
					/>
					Actualizar
				</button>
			</div>

			{/* ─── Zona de carga ─────────────────────────────────────────── */}
			{canEdit && (
				<div
					onDragOver={(e) => {
						e.preventDefault();
						setIsDragging(true);
					}}
					onDragLeave={() => setIsDragging(false)}
					onDrop={handleDrop}
					className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
						isDragging
							? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
							: 'border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50'
					}`}>
					<Icon icon='HeroArrowUpTray' className='h-7 w-7 text-blue-500' />
					<p className='text-sm font-semibold text-zinc-700 dark:text-zinc-200'>
						Arrastra fotos aquí o
					</p>
					<Button
						variant='solid'
						color='blue'
						icon='HeroPlusCircle'
						isLoading={uploading}
						disabled={uploading}
						onClick={() => inputRef.current?.click()}>
						Seleccionar fotos
					</Button>
					<p className='text-[11px] text-zinc-400'>
						jpg, jpeg, png, webp · máx. {MAX_PHOTO_SIZE_KB / 1024} MB c/u · hasta{' '}
						{MAX_PHOTOS_PER_UPLOAD} por carga
					</p>
					<input
						ref={inputRef}
						type='file'
						accept={PHOTO_ACCEPT_ATTR}
						multiple
						className='hidden'
						onChange={(e) => {
							handleFiles(e.target.files);
							e.target.value = '';
						}}
					/>
				</div>
			)}

			{/* ─── Error ─────────────────────────────────────────────────── */}
			{error && (
				<div className='flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300'>
					<span className='flex items-center gap-2'>
						<Icon icon='HeroExclamationTriangle' className='h-4 w-4 shrink-0' />
						{error}
					</span>
					<button
						type='button'
						onClick={() => void refresh()}
						className='shrink-0 font-semibold underline underline-offset-2 hover:no-underline'>
						Reintentar
					</button>
				</div>
			)}

			{/* ─── Grid / estados ────────────────────────────────────────── */}
			{loading ? (
				<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'>
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className='aspect-square animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800'
						/>
					))}
				</div>
			) : photos.length === 0 ? (
				<div className='flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 py-12 text-center dark:border-zinc-700'>
					<Icon icon='HeroPhoto' className='h-8 w-8 text-zinc-400' />
					<p className='text-sm text-zinc-500'>Aún no hay fotos en esta revisión.</p>
				</div>
			) : (
				<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'>
					{photos.map((photo, index) => (
						<div
							key={photo.id}
							className='group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800'>
							<button
								type='button'
								onClick={() => setLightboxIndex(index)}
								className='h-full w-full'
								title={photo.alt ?? 'Ver foto'}>
								<img
									src={photo.thumb ?? photo.url}
									alt={photo.alt ?? 'Foto de revisión'}
									loading='lazy'
									className='h-full w-full object-cover transition-transform duration-200 group-hover:scale-105'
								/>
							</button>

							{/* Overlay: zoom */}
							<div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20'>
								<Icon
									icon='HeroMagnifyingGlassPlus'
									className='h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-90'
								/>
							</div>

							{/* Botón eliminar + confirmación (solo con permiso de edición) */}
							{canEdit &&
								(confirmId === photo.id ? (
									<div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 px-2 text-center'>
										<p className='text-xs font-semibold text-white'>
											¿Eliminar foto?
										</p>
										<div className='flex gap-2'>
											<button
												type='button'
												onClick={() => handleConfirmDelete(photo.id)}
												className='rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700'>
												Sí
											</button>
											<button
												type='button'
												onClick={() => setConfirmId(null)}
												className='rounded-md bg-white/20 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/30'>
												No
											</button>
										</div>
									</div>
								) : (
									<button
										type='button'
										onClick={() => setConfirmId(photo.id)}
										disabled={deletingId === photo.id}
										title='Eliminar foto'
										className='absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-red-600/90 text-white opacity-0 shadow-md transition-all hover:bg-red-700 focus:opacity-100 disabled:opacity-60 group-hover:opacity-100'>
										<Icon
											icon={
												deletingId === photo.id
													? 'HeroArrowPath'
													: 'HeroTrash'
											}
											className={`h-4 w-4 ${deletingId === photo.id ? 'animate-spin' : ''}`}
										/>
									</button>
								))}
						</div>
					))}
				</div>
			)}

			{/* ─── Lightbox ──────────────────────────────────────────────── */}
			{lightboxPhoto && (
				<div
					role='dialog'
					aria-modal='true'
					onClick={closeLightbox}
					className='fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm'>
					{/* Cerrar */}
					<button
						type='button'
						onClick={closeLightbox}
						title='Cerrar (Esc)'
						className='absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20'>
						<Icon icon='HeroXMark' className='h-6 w-6' />
					</button>

					{/* Contador */}
					{photos.length > 1 && (
						<span className='absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white'>
							{(lightboxIndex ?? 0) + 1} / {photos.length}
						</span>
					)}

					{/* Anterior */}
					{photos.length > 1 && (
						<button
							type='button'
							onClick={(e) => {
								e.stopPropagation();
								showPrev();
							}}
							title='Anterior (←)'
							className='absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20'>
							<Icon icon='HeroChevronLeft' className='h-6 w-6' />
						</button>
					)}

					{/* Siguiente */}
					{photos.length > 1 && (
						<button
							type='button'
							onClick={(e) => {
								e.stopPropagation();
								showNext();
							}}
							title='Siguiente (→)'
							className='absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20'>
							<Icon icon='HeroChevronRight' className='h-6 w-6' />
						</button>
					)}

					<img
						src={lightboxPhoto.url}
						alt={lightboxPhoto.alt ?? 'Foto de revisión'}
						onClick={(e) => e.stopPropagation()}
						className='max-h-[90vh] max-w-[85vw] rounded-lg object-contain shadow-2xl'
					/>
				</div>
			)}
		</div>
	);
}

export default GallerySection;
