import React from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import type { ICategory } from '../../types';

type ParentOption = {
	id: number;
	name: string;
};

type EditarCategoriaProps = {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	category: ICategory | null;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
	parentOptions: ParentOption[];
	isLoading?: boolean;
};

const EditarCategoria: React.FC<EditarCategoriaProps> = ({
	isOpen,
	setIsOpen,
	category,
	onSubmit,
	parentOptions,
	isLoading,
}) => {
	const handleSubmitClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		const form = document.getElementById('editCategoryForm') as HTMLFormElement | null;
		form?.requestSubmit();
	};

	if (!category) return null;

	return (
		<Modal isOpen={isOpen} setIsOpen={() => setIsOpen(false)} size='lg'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
						<Icon icon='HeroPencilSquare' className='h-6 w-6 text-blue-600' />
					</div>
					<div>
						<h2 className='text-xl font-bold'>Editar categoria</h2>
						<p className='text-sm opacity-80'>
							Actualiza los datos principales de la categoria
						</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<form id='editCategoryForm' className='space-y-4' onSubmit={onSubmit}>
					<input type='hidden' name='id' value={category.id} />
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label htmlFor='edit-name' className='required'>
								Nombre
							</Label>
							<Input
								id='edit-name'
								name='name'
								type='text'
								defaultValue={category.name}
								required
							/>
						</div>
						<div>
							<Label htmlFor='edit-parent'>Categoria padre</Label>
							<Select
								id='edit-parent'
								name='parent_id'
								defaultValue={category.parent_id ? String(category.parent_id) : ''}>
								<option value=''>Ninguna</option>
								{parentOptions
									.filter((option) => option.id !== category.id)
									.map((option) => (
										<option key={option.id} value={String(option.id)}>
											{option.name}
										</option>
									))}
							</Select>
						</div>
					</div>

					{/* Descripcion removida de la edición por solicitud */}

					<div>
						<Label htmlFor='edit-image'>Imagen principal</Label>
						<Input id='edit-image' name='image' type='file' accept='image/*' />
						<p className='mt-1 text-xs text-gray-500'>
							Opcional. Reemplaza la imagen actual.
						</p>
					</div>

					<div>
						<Label htmlFor='edit-gallery'>Galería</Label>
						<Input
							id='edit-gallery'
							name='gallery'
							type='file'
							accept='image/*'
							multiple
						/>
						<p className='mt-1 text-xs text-gray-500'>
							Puedes seleccionar varias imágenes para agregar a la galería.
						</p>
					</div>

					{/* Toggle de activo eliminado por solicitud */}
				</form>
			</ModalBody>
			<ModalFooter>
				<div className='flex justify-end space-x-2'>
					<Button variant='outline' onClick={() => setIsOpen(false)}>
						Cancelar
					</Button>
					<Button color='blue' onClick={handleSubmitClick} isDisable={isLoading}>
						{isLoading ? 'Guardando...' : 'Guardar cambios'}
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default EditarCategoria;
