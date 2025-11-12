import React from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { ICategory } from '../../types';
import ApiService from '@/services/ApiService';
import { normalizeCategory } from '@/components/helper/category.helper';

type DetalleCategoriaProps = {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	category: ICategory | null;
	onEdit?: (category: ICategory) => void;
};

const DetalleCategoria: React.FC<DetalleCategoriaProps> = ({
	isOpen,
	setIsOpen,
	category,
	onEdit,
}) => {
	const [desc, setDesc] = React.useState<string>('');
	const [loading, setLoading] = React.useState<boolean>(false);

	React.useEffect(() => {
		setDesc(category?.description ?? '');
	}, [category]);

	React.useEffect(() => {
		const run = async () => {
			if (!isOpen || !category?.id) return;
			try {
				setLoading(true);
				const response = await ApiService.fetchData<{ data?: any }>({
					url: `/categories/${category.id}`,
					method: 'get',
				});
				const raw = response.data?.data ?? response.data;
				if (raw) {
					const normalized = normalizeCategory(raw);
					setDesc(normalized.description ?? '');
				}
			} catch {
				// ignore; keep existing desc
			} finally {
				setLoading(false);
			}
		};
		void run();
	}, [isOpen, category?.id]);

	return (
		<Modal isOpen={isOpen} setIsOpen={() => setIsOpen(false)} size='lg'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/20'>
						<Icon icon='HeroEye' className='h-6 w-6 text-sky-600' />
					</div>
					<div>
						<h2 className='text-xl font-bold'>Detalle de la categoria</h2>
						<p className='text-sm opacity-80'>Informacion general y estado actual</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				{category ? (
					<div className='space-y-6'>
						{/* Imagen principal y galería */}
						<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
							<div className='md:col-span-1'>
								<div className='aspect-square w-full overflow-hidden rounded-md ring-1 ring-zinc-200 dark:ring-white/10'>
									{category.image?.url ? (
										<img
											src={category.image.thumb || category.image.url}
											alt={category.image.alt || category.name}
											className='h-full w-full object-cover'
										/>
									) : (
										<div className='flex h-full w-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400'>
											Sin imagen
										</div>
									)}
								</div>
							</div>
							<div className='md:col-span-2'>
								<div className='space-y-2'>
									<h4 className='font-semibold'>Galería</h4>
									{category.gallery && category.gallery.length > 0 ? (
										<div className='grid grid-cols-3 gap-2 sm:grid-cols-4'>
											{category.gallery.map((img, idx) => (
												<div
													key={`${img.id ?? idx}`}
													className='aspect-square overflow-hidden rounded border border-zinc-200 dark:border-zinc-700'>
													<img
														src={img.thumb || img.url}
														alt={
															img.alt || `${category.name}-${idx + 1}`
														}
														className='h-full w-full object-cover'
													/>
												</div>
											))}
										</div>
									) : (
										<p className='text-sm opacity-80'>
											Sin imágenes en la galería.
										</p>
									)}
								</div>
							</div>
						</div>
						<div className='flex flex-col space-y-3 md:flex-row md:items-center md:space-x-4 md:space-y-0'>
							<div>
								<h3 className='text-lg font-semibold'>{category.name}</h3>
								{category.parent_name && (
									<p className='text-sm opacity-80'>
										Pertenece a: {category.parent_name}
									</p>
								)}
							</div>
							
						</div>

						<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							<div className='space-y-2 rounded-md p-4 text-sm ring-1 ring-zinc-200 dark:ring-white/10'>
								<h4 className='font-semibold'>Informacion</h4>
								<div className='flex justify-between'>
									<span className='opacity-80'>Productos asociados</span>
									<span className='font-medium'>
										{category.products_count ?? 0}
									</span>
								</div>
								<div className='flex justify-between'>
									<span className='opacity-80'>Creada</span>
									<span className='font-medium'>
										{category.created_at
											? new Date(category.created_at).toLocaleDateString()
											: '-'}
									</span>
								</div>
								<div className='flex justify-between'>
									<span className='opacity-80'>Actualizada</span>
									<span className='font-medium'>
										{category.updated_at
											? new Date(category.updated_at).toLocaleDateString()
											: '-'}
									</span>
								</div>
							</div>
							{!loading && desc && desc.trim().length > 0 && (
								<div className='space-y-2 rounded-md p-4 text-sm ring-1 ring-zinc-200 dark:ring-white/10'>
									<h4 className='font-semibold'>Descripcion</h4>
									<p className='whitespace-pre-line opacity-80'>{desc}</p>
								</div>
							)}
							<div className='space-y-2 rounded-md p-4 text-sm ring-1 ring-zinc-200 dark:ring-white/10'>
								<h4 className='font-semibold'>Detalles</h4>
								<div className='flex justify-between'>
									<span className='opacity-80'>Slug</span>
									<span className='font-mono'>{category.slug || '-'}</span>
								</div>
								<div className='flex justify-between'>
									<span className='opacity-80'>Padre</span>
									<span className='font-medium'>
										{category.parent_name || 'Principal'}
									</span>
								</div>
								<div className='flex justify-between'>
									<span className='opacity-80'>Subcategorías</span>
									<span className='font-medium'>
										{category.children_count ?? 0}
									</span>
								</div>
								{/* ID oculto para no mostrar al usuario final */}
							</div>
						</div>
					</div>
				) : (
					<div className='py-6 text-center text-sm opacity-80'>
						Selecciona una categoria para ver sus detalles.
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<div className='flex justify-end space-x-3'>
					<Button variant='outline' onClick={() => setIsOpen(false)}>
						Cerrar
					</Button>
					{category && onEdit && (
						<Button
							color='blue'
							onClick={() => {
								setIsOpen(false);
								onEdit(category);
							}}>
							Editar categoria
						</Button>
					)}
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default DetalleCategoria;
