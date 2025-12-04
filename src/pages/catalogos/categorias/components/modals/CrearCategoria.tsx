import React from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';

type ParentOption = {
	id: number;
	name: string;
};

type CrearCategoriaProps = {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
	parentOptions: ParentOption[];
	isLoading?: boolean;
};

const CrearCategoria: React.FC<CrearCategoriaProps> = ({
	isOpen,
	setIsOpen,
	onSubmit,
	parentOptions,
	isLoading,
}) => {
	React.useEffect(() => {
		if (!isOpen) {
			const form = document.getElementById('createCategoryForm') as HTMLFormElement | null;
			form?.reset();
		}
	}, [isOpen]);

	const handleSubmitClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		const form = document.getElementById('createCategoryForm') as HTMLFormElement | null;
		form?.requestSubmit();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={() => setIsOpen(false)} size='lg'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100'>
						<Icon icon='HeroPlus' className='h-6 w-6 text-emerald-600' />
					</div>
					<div>
						<h2 className='text-xl font-bold text-gray-900'>Nueva categoria</h2>
						<p className='text-sm text-gray-600'>
							Registra una categoria disponible para tus productos
						</p>
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
								placeholder='Ej: Electronica'
								required
							/>
						</div>
						<div>
							<Label htmlFor='create-parent'>Categoria padre</Label>
							<Select id='create-parent' name='parent_id' defaultValue=''>
								<option value=''>Ninguna</option>
								{parentOptions.map((option) => (
									<option key={option.id} value={String(option.id)}>
										{option.name}
									</option>
								))}
							</Select>
						</div>
					</div>

					{/* Descripcion removida del formulario de creación por solicitud */}

					<div>
						<Label htmlFor='create-image'>Imagen principal</Label>
						<Input id='create-image' name='image' type='file' accept='image/*' />
						<p className='mt-1 text-xs text-gray-500'>
							Opcional. Se convertirá a WebP.
						</p>
					</div>

					<div>
						<Label htmlFor='create-gallery'>Galería</Label>
						<Input
							id='create-gallery'
							name='gallery'
							type='file'
							accept='image/*'
							multiple
						/>
						<p className='mt-1 text-xs text-gray-500'>
							Puedes seleccionar varias imágenes para la galería.
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
					<Button color='emerald' onClick={handleSubmitClick} isDisable={isLoading}>
						{isLoading ? 'Creando...' : 'Crear categoria'}
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default CrearCategoria;
