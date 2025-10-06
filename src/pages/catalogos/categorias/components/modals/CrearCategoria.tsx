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

type CrearCategoriaProps = {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	categories: ICategory[];
};

const CrearCategoria: React.FC<CrearCategoriaProps> = ({
	isOpen,
	setIsOpen,
	onSubmit,
	categories,
}) => {
	const [active, setActive] = React.useState(true);
	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100'>
						<Icon icon='HeroPlus' className='h-6 w-6 text-emerald-600' />
					</div>
					<div>
						<h2 className='text-xl font-bold text-gray-900'>Crear Nueva Categoría</h2>
						<p className='text-sm text-gray-600'>Registra una nueva categoría</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<form id='createCategoryForm' className='space-y-4' onSubmit={onSubmit}>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label htmlFor='create-name' className='required'>
								Nombre
							</Label>
							<Input
								id='create-name'
								name='name'
								type='text'
								placeholder='Ej: Electrónica'
								required
							/>
						</div>
						<div>
							<Label htmlFor='create-parent'>Categoría Padre</Label>
							<Select id='create-parent' name='parent_id' defaultValue=''>
								<option value=''>Ninguna</option>
								{categories
									.filter((c) => !c.parent_id)
									.map((c) => (
										<option key={c.id} value={String(c.id)}>
											{c.name}
										</option>
									))}
							</Select>
						</div>
					</div>

					<div>
						<Label htmlFor='create-description'>Descripción</Label>
						<Textarea
							id='create-description'
							name='description'
							rows={3}
							placeholder='Descripción de la categoría...'
						/>
					</div>

					<div className='flex items-center space-x-2'>
						<Checkbox
							id='create-active'
							name='is_active'
							checked={active}
							onChange={(e) => setActive(e.currentTarget.checked)}
						/>
						<Label htmlFor='create-active'>Activa</Label>
					</div>
				</form>
			</ModalBody>
			<ModalFooter>
				<div className='flex justify-end space-x-2'>
					<Button variant='outline' onClick={() => setIsOpen(false)}>
						Cancelar
					</Button>
					<Button
						color='emerald'
						onClick={(e) => {
							e.preventDefault();
							const form = document.getElementById(
								'createCategoryForm',
							) as HTMLFormElement | null;
							if (form)
								onSubmit({ preventDefault: () => {}, currentTarget: form } as any);
						}}>
						Crear Categoría
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default CrearCategoria;
