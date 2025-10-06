import React from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';
import { ICategory } from '../../types';

type EditarCategoriaProps = {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	category: ICategory | null;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	categories: ICategory[];
};

const EditarCategoria: React.FC<EditarCategoriaProps> = ({
	isOpen,
	setIsOpen,
	category,
	onSubmit,
	categories,
}) => {
	const [active, setActive] = React.useState<boolean>(!!category?.is_active);
	React.useEffect(() => {
		setActive(!!category?.is_active);
	}, [category, isOpen]);
	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100'>
						<Icon icon='HeroPencilSquare' className='h-6 w-6 text-indigo-600' />
					</div>
					<div>
						<h2 className='text-xl font-bold text-gray-900'>Editar Categoría</h2>
						<p className='text-sm text-gray-600'>
							Actualiza la información de la categoría
						</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				{category && (
					<form id='editCategoryForm' className='space-y-4' onSubmit={onSubmit}>
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
								<Label htmlFor='edit-parent'>Categoría Padre</Label>
								<Select
									id='edit-parent'
									name='parent_id'
									defaultValue={
										category.parent_id ? String(category.parent_id) : ''
									}>
									<option value=''>Ninguna</option>
									{categories
										.filter((c) => !c.parent_id && c.id !== category.id)
										.map((c) => (
											<option key={c.id} value={String(c.id)}>
												{c.name}
											</option>
										))}
								</Select>
							</div>
						</div>

						<div>
							<Label htmlFor='edit-description'>Descripción</Label>
							<Textarea
								id='edit-description'
								name='description'
								rows={3}
								defaultValue={category.description}
							/>
						</div>

						<div className='flex items-center space-x-2'>
							<Checkbox
								id='edit-active'
								name='is_active'
								checked={active}
								onChange={(e) => setActive(e.currentTarget.checked)}
							/>
							<Label htmlFor='edit-active'>Activa</Label>
						</div>
					</form>
				)}
			</ModalBody>
			<ModalFooter>
				<div className='flex justify-end space-x-2'>
					<Button variant='outline' onClick={() => setIsOpen(false)}>
						Cancelar
					</Button>
					<Button
						color='indigo'
						onClick={(e) => {
							e.preventDefault();
							const form = document.getElementById(
								'editCategoryForm',
							) as HTMLFormElement | null;
							if (form)
								onSubmit({ preventDefault: () => {}, currentTarget: form } as any);
						}}>
						Guardar Cambios
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default EditarCategoria;
