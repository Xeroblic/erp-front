import React, { useEffect, useState } from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Checkbox from '@/components/form/Checkbox';
import { ImageZoom } from '@/components/ImageZoom';
import { ensureAbsoluteUrl } from '@/components/helper/brand.helper';
import { formatCLP } from '@/utils/format.utils';
import type { IBrand } from '@/interface/brand.interface';
import BrandLogo from './BrandLogo';

export interface BrandInlineSavePayload {
	name: string;
	code?: string;
	is_active: boolean;
	image: File | null;
	galleryFiles: File[];
}

interface BrandDetailPanelProps {
	brand: IBrand | null;
	onSave?: (brand: IBrand, payload: BrandInlineSavePayload) => Promise<void>;
	onDelete?: (brand: IBrand) => void;
	saving?: boolean;
}

const formatDate = (value?: string): string =>
	value
		? new Date(value).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
		: '—';

const BrandDetailPanel: React.FC<BrandDetailPanelProps> = ({ brand, onSave, onDelete, saving }) => {
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState('');
	const [code, setCode] = useState('');
	const [isActive, setIsActive] = useState(true);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

	useEffect(() => {
		setEditing(false);
		setImageFile(null);
		setGalleryFiles([]);
	}, [brand?.id]);

	if (!brand) {
		return (
			<Card className='h-full'>
				<CardBody className='flex h-full flex-col items-center justify-center gap-3 py-16 text-center'>
					<div className='rounded-full bg-zinc-100 p-4 dark:bg-zinc-800'>
						<Icon icon='HeroTag' className='h-7 w-7 text-zinc-400' />
					</div>
					<p className='font-medium text-zinc-700 dark:text-zinc-200'>
						Selecciona una marca
					</p>
					<p className='text-sm text-zinc-500'>
						Elige una marca de la lista para ver su detalle.
					</p>
				</CardBody>
			</Card>
		);
	}

	const startEditing = () => {
		setName(brand.name ?? '');
		setCode(brand.code ?? '');
		setIsActive(brand.is_active);
		setImageFile(null);
		setGalleryFiles([]);
		setEditing(true);
	};

	const handleSave = async () => {
		if (!onSave) return;
		await onSave(brand, {
			name: name.trim(),
			code: code.trim() || undefined,
			is_active: isActive,
			image: imageFile,
			galleryFiles,
		});
		setEditing(false);
	};

	const gallery = (brand.gallery ?? []).filter((img) => img?.url);

	return (
		<div className='space-y-4'>
			{/* Encabezado */}
			<Card>
				<CardBody className='flex items-center gap-4'>
					<BrandLogo brand={brand} className='h-16 w-16' iconClassName='h-8 w-8' zoomable />
					<div className='min-w-0 flex-1'>
						{editing ? (
							<div className='space-y-2'>
								<div>
									<Label htmlFor='inline-brand-name' className='required !mb-1'>
										Nombre
									</Label>
									<Input
										id='inline-brand-name'
										name='inline-brand-name'
										value={name}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setName(e.target.value)
										}
										disabled={saving}
									/>
								</div>
								<div>
									<Label htmlFor='inline-brand-code' className='!mb-1'>
										Código interno
									</Label>
									<Input
										id='inline-brand-code'
										name='inline-brand-code'
										value={code}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setCode(e.target.value)
										}
										disabled={saving}
									/>
								</div>
							</div>
						) : (
							<>
								<h2 className='truncate text-xl font-bold text-zinc-900 dark:text-white'>
									{brand.name}
								</h2>
								{brand.code && (
									<p className='font-mono text-xs text-zinc-500'>{brand.code}</p>
								)}
							</>
						)}
					</div>
					<div className='flex flex-col items-end gap-2'>
						{editing ? (
							<Checkbox
								id='inline-brand-active'
								variant='switch'
								checked={isActive}
								onChange={() => setIsActive((v) => !v)}
								disabled={saving}
								label={isActive ? 'Activa' : 'Inactiva'}
							/>
						) : (
							<Badge color={brand.is_active ? 'emerald' : 'zinc'}>
								{brand.is_active ? 'Activa' : 'Inactiva'}
							</Badge>
						)}

						{editing ? (
							<div className='flex gap-1'>
								<Button
									size='sm'
									variant='outline'
									onClick={() => setEditing(false)}
									isDisable={saving}>
									Cancelar
								</Button>
								<Button
									size='sm'
									color='emerald'
									icon='HeroCheck'
									onClick={() => void handleSave()}
									isDisable={saving || !name.trim()}>
									{saving ? 'Guardando…' : 'Guardar'}
								</Button>
							</div>
						) : (
							<div className='flex gap-1'>
								{onSave && (
									<Button
										size='sm'
										variant='outline'
										icon='HeroPencil'
										onClick={startEditing}>
										Editar
									</Button>
								)}
								{onDelete && (
									<Button
										size='sm'
										variant='outline'
										color='red'
										icon='HeroTrash'
										onClick={() => onDelete(brand)}
									/>
								)}
							</div>
						)}
					</div>
				</CardBody>
			</Card>

			{editing && (
				<Card>
					<CardBody className='space-y-2'>
						<Label htmlFor='inline-brand-image' className='!mb-1'>
							Reemplazar logo
						</Label>
						<Input
							id='inline-brand-image'
							name='inline-brand-image'
							type='file'
							accept='image/*'
							disabled={saving}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setImageFile(e.target.files?.[0] ?? null)
							}
						/>
						<p className='text-xs text-zinc-500'>
							Si subes una imagen, se convertirá automáticamente a WebP.
						</p>

						<div className='pt-2'>
							<Label htmlFor='inline-brand-gallery' className='!mb-1'>
								Agregar a la galería
							</Label>
							<Input
								id='inline-brand-gallery'
								name='inline-brand-gallery'
								type='file'
								accept='image/*'
								multiple
								disabled={saving}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setGalleryFiles(Array.from(e.target.files ?? []))
								}
							/>
							<p className='text-xs text-zinc-500'>
								Puedes seleccionar varias imágenes.
								{galleryFiles.length > 0 &&
									` ${galleryFiles.length} seleccionada(s).`}
							</p>
						</div>
					</CardBody>
				</Card>
			)}

			{/* Métricas */}
			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
				<Card>
					<CardBody>
						<div className='flex items-center justify-between'>
							<p className='text-sm text-zinc-500'>Productos</p>
							<Icon icon='HeroCube' className='h-4 w-4 text-violet-500' />
						</div>
						<p className='mt-1 text-3xl font-bold text-zinc-900 dark:text-white'>
							{brand.products_count ?? 0}
						</p>
					</CardBody>
				</Card>
				<Card>
					<CardBody>
						<div className='flex items-center justify-between'>
							<p className='text-sm text-zinc-500'>Ventas totales</p>
							<Icon icon='HeroBanknotes' className='h-4 w-4 text-emerald-500' />
						</div>
						<p className='mt-1 text-3xl font-bold text-zinc-900 dark:text-white'>
							{formatCLP(Number(brand.total_sales ?? 0))}
						</p>
					</CardBody>
				</Card>
			</div>

			{/* Línea de tiempo + galería */}
			<div className='grid grid-cols-1 gap-4 lg:grid-cols-2 '>
				<Card>
					<CardBody>
						<h3 className='mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200'>
							Línea de tiempo
						</h3>
						<ul className='space-y-3'>
							<li className='flex items-start gap-3'>
								<span className='mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300'>
									<Icon icon='HeroPlusCircle' className='h-4 w-4' />
								</span>
								<div>
									<p className='text-sm font-medium text-zinc-800 dark:text-zinc-100'>
										Creación
									</p>
									<p className='text-xs text-zinc-500'>
										{formatDate(brand.created_at)}
									</p>
								</div>
							</li>
							<li className='flex items-start gap-3'>
								<span className='mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300'>
									<Icon icon='HeroArrowPath' className='h-4 w-4' />
								</span>
								<div>
									<p className='text-sm font-medium text-zinc-800 dark:text-zinc-100'>
										Última actualización
									</p>
									<p className='text-xs text-zinc-500'>
										{formatDate(brand.updated_at)}
									</p>
								</div>
							</li>
						</ul>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<h3 className='mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200'>
							Galería
						</h3>
						{gallery.length ? (
							<div className='grid grid-cols-3 gap-2'>
								{gallery.map((img) => (
									<ImageZoom
										key={img.id ?? img.url}
										imageUrl={ensureAbsoluteUrl(img.url ?? img.thumb) ?? ''}
										alt={img.alt ?? brand.name}
										modalTitle={brand.name}
										renderTrigger={(open) => (
											<button
												type='button'
												onClick={open}
												className='aspect-square cursor-zoom-in overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 transition hover:ring-2 hover:ring-violet-300 dark:border-zinc-700 dark:bg-zinc-900'>
												<img
													src={
														ensureAbsoluteUrl(img.thumb ?? img.url) ??
														undefined
													}
													alt={img.alt ?? brand.name}
													loading='lazy'
													className='h-full w-full object-cover'
												/>
											</button>
										)}
									/>
								))}
							</div>
						) : (
							<div className='flex flex-col items-center justify-center gap-2 py-8 text-center'>
								<Icon icon='HeroPhoto' className='h-7 w-7 text-zinc-300' />
								<p className='text-sm text-zinc-500'>Sin imágenes en la galería.</p>
							</div>
						)}
					</CardBody>
				</Card>
			</div>
		</div>
	);
};

export default BrandDetailPanel;
