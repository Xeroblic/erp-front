import React from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ICategory } from '../../types';

type EliminarCategoriaProps = {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	category: ICategory | null;
	onConfirm: () => void;
};

const EliminarCategoria: React.FC<EliminarCategoriaProps> = ({
	isOpen,
	setIsOpen,
	category,
	onConfirm,
}) => {
	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen}>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
						<Icon icon='HeroTrash' className='h-6 w-6 text-red-600' />
					</div>
					<div>
						<h2 className='text-xl font-bold text-gray-900'>Eliminar Categoría</h2>
						<p className='text-sm text-gray-600'>Esta acción no se puede deshacer</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				{category ? (
					<div className='space-y-2 text-sm text-gray-700'>
						<p>
							¿Estás seguro que deseas eliminar la categoría
							<span className='font-semibold'> {category.name}</span>?
						</p>
					</div>
				) : (
					<div className='text-sm text-gray-500'>No hay categoría seleccionada.</div>
				)}
			</ModalBody>
			<ModalFooter>
				<div className='flex justify-end space-x-2'>
					<Button variant='outline' onClick={() => setIsOpen(false)}>
						Cancelar
					</Button>
					<Button color='red' onClick={onConfirm}>
						Eliminar
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default EliminarCategoria;
