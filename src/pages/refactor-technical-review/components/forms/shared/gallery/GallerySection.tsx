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
import React, { useCallback, useRef, useState } from 'react';
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
import type { ITechnicalReviewPhoto } from '@/interface/technicalReviews.interface';

function GallerySection<T extends FieldValues>({ readOnly }: FormSectionProps<T>) {
	const { subsidiaryId, itemId } = useReviewPhotosContext();
	const { has } = useCan();

	const canView = has(PHOTO_VIEW_PERMISSION);
	const canEdit = !readOnly && has(PHOTO_EDIT_PERMISSION);

	const { photos, loading, uploading, deletingId, error, upload, remove } = useReviewPhotos({
		subsidiaryId,
		itemId,
		enabled: canView,
	});

	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [lightbox, setLightbox] = useState<ITechnicalReviewPhoto | null>(null);

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
				<div className='flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300'>
					<Icon icon='HeroExclamationTriangle' className='h-4 w-4' />
					{error}
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
					{photos.map((photo) => (
						<div
							key={photo.id}
							className='group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800'>
							<button
								type='button'
								onClick={() => setLightbox(photo)}
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

							{/* Botón eliminar (solo con permiso de edición) */}
							{canEdit && (
								<button
									type='button'
									onClick={() => remove(photo.id)}
									disabled={deletingId === photo.id}
									title='Eliminar foto'
									className='absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-red-600/90 text-white shadow-md transition-all hover:bg-red-700 disabled:opacity-60'>
									<Icon
										icon={
											deletingId === photo.id ? 'HeroArrowPath' : 'HeroTrash'
										}
										className={`h-4 w-4 ${deletingId === photo.id ? 'animate-spin' : ''}`}
									/>
								</button>
							)}
						</div>
					))}
				</div>
			)}

			{/* ─── Lightbox ──────────────────────────────────────────────── */}
			{lightbox && (
				<div
					role='dialog'
					aria-modal='true'
					onClick={() => setLightbox(null)}
					className='fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm'>
					<button
						type='button'
						onClick={() => setLightbox(null)}
						title='Cerrar'
						className='absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20'>
						<Icon icon='HeroXMark' className='h-6 w-6' />
					</button>
					<img
						src={lightbox.url}
						alt={lightbox.alt ?? 'Foto de revisión'}
						onClick={(e) => e.stopPropagation()}
						className='max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl'
					/>
				</div>
			)}
		</div>
	);
}

export default GallerySection;
