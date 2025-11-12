import React, { Dispatch, SetStateAction } from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { IBrand } from '@/interface/brand.interface';
import { ensureAbsoluteUrl } from '@/components/helper/brand.helper';
import { formatCurrency } from '../utils';

type DetalleMarcaProps = {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	brand: IBrand | null;
	onEdit?: (brand: IBrand) => void;
};

const DetalleMarca: React.FC<DetalleMarcaProps> = ({ isOpen, setIsOpen, brand, onEdit }) => (
	<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
		<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20'>
						<Icon icon='HeroEye' className='h-6 w-6 text-green-600' />
					</div>
					<div>
						<h2 className='text-xl font-bold'>Detalle de la marca</h2>
						<p className='text-sm opacity-80'>
							Informacion registrada y metricas principales
						</p>
					</div>
				</div>
		</ModalHeader>
		<ModalBody>
			{brand ? (
				<div className='space-y-6'>
					<div className='flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0'>
						{ensureAbsoluteUrl(brand.image?.url ?? brand.logo_url ?? undefined) ? (
							<img
								src={
									ensureAbsoluteUrl(
										brand.image?.url ?? brand.logo_url ?? undefined,
									) ?? ''
								}
								alt={brand.image?.alt ?? brand.name}
								className='h-20 w-20 rounded-md ring-1 ring-zinc-200 dark:ring-white/10 bg-white object-contain'
							/>
						) : (
							<div className='flex h-20 w-20 items-center justify-center rounded-md ring-1 ring-zinc-200 dark:ring-white/10'>
								<Icon icon='HeroTag' className='h-8 w-8 text-gray-400' />
							</div>
						)}
						<div>
							<h3 className='text-xl font-bold'>{brand.name}</h3>
							{brand.code && (
								<p className='text-xs opacity-80'>{brand.code}</p>
							)}
							<div className='mt-2 flex items-center space-x-2'>
								{/* <Badge color={brand.is_active ? 'emerald' : 'red'}>
									{brand.is_active ? 'Activa' : 'Inactiva'}
								</Badge> */}
								{/* Origen removido: backend no lo entrega */}
							</div>
						</div>
					</div>

					<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
						<div className='space-y-3 rounded-md p-4 text-sm ring-1 ring-zinc-200 dark:ring-white/10'>
							<h4 className='font-semibold'>Informacion general</h4>
							{/* Fabricante y origen removidos */}
							<div className='flex justify-between'>
								<span className='opacity-80'>Creacion</span>
								<span className='font-medium'>
									{brand.created_at
										? new Date(brand.created_at).toLocaleDateString()
										: '-'}
								</span>
							</div>
							<div className='flex justify-between'>
								<span className='opacity-80'>Ultima actualizacion</span>
								<span className='font-medium'>
									{brand.updated_at
										? new Date(brand.updated_at).toLocaleDateString()
										: '-'}
								</span>
							</div>
						</div>

						<div className='space-y-3 rounded-md p-4 text-sm ring-1 ring-zinc-200 dark:ring-white/10'>
							<h4 className='font-semibold'>Actividad</h4>
							<div className='flex justify-between'>
								<span className='opacity-80'>Productos asociados</span>
								<span className='font-semibold'>
									{brand.products_count}
								</span>
							</div>
							<div className='flex justify-between'>
								<span className='opacity-80'>Ventas vinculadas</span>
								<span className='font-semibold text-green-600'>
									{formatCurrency(brand.total_sales)}
								</span>
							</div>
							{brand.website_url && (
								<div className='flex justify-between'>
									<span className='opacity-80'>Sitio web</span>
									<a
										href={brand.website_url}
										target='_blank'
										rel='noopener noreferrer'
										className='text-blue-600 underline hover:text-blue-800'>
										Visitar
									</a>
								</div>
							)}
						</div>
					</div>

					{brand.description && (
						<div className='rounded-md p-4 ring-1 ring-zinc-200 dark:ring-white/10'>
							<h4 className='font-semibold'>Descripcion</h4>
							<p className='mt-2 text-sm opacity-80'>{brand.description}</p>
						</div>
					)}
				</div>
			) : (
				<div className='py-6 text-center text-sm opacity-80'>
					Selecciona una marca para ver los detalles.
				</div>
			)}
		</ModalBody>
		<ModalFooter>
			<div className='flex justify-end space-x-3'>
				<Button variant='outline' onClick={() => setIsOpen(false)}>
					Cerrar
				</Button>
				{brand && onEdit && (
					<Button
						color='blue'
						onClick={() => {
							setIsOpen(false);
							onEdit(brand);
						}}>
						Editar marca
					</Button>
				)}
			</div>
		</ModalFooter>
	</Modal>
);

export default DetalleMarca;
