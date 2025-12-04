import React, { Dispatch, SetStateAction } from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Checkbox from '@/components/form/Checkbox';
import { IBrand } from '@/interface/brand.interface';

type EditarMarcaProps = {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	brand: IBrand | null;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	isLoading?: boolean;
};

const EditarMarca: React.FC<EditarMarcaProps> = ({
	isOpen,
	setIsOpen,
	brand,
	onSubmit,
	isLoading,
}) => {
	const [active, setActive] = React.useState(brand?.is_active ?? true);

	React.useEffect(() => {
		if (brand) {
			setActive(brand.is_active);
		}
	}, [brand]);

	const handleSubmitClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		const form = document.getElementById('editBrandForm') as HTMLFormElement | null;
		form?.requestSubmit();
	};

	if (!brand) return null;

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
						<Icon icon='HeroPencilSquare' className='h-6 w-6 text-blue-600' />
					</div>
					<div>
						<h2 className='text-xl font-bold text-gray-900'>Editar marca</h2>
						<p className='text-sm text-gray-600'>
							Actualiza la informacion principal de la marca
						</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<form id='editBrandForm' className='space-y-4' onSubmit={onSubmit}>
					<input type='hidden' name='id' value={brand.id} />
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label htmlFor='edit-brand-name' className='required'>
								Nombre
							</Label>
							<Input
								id='edit-brand-name'
								name='name'
								type='text'
								defaultValue={brand.name}
								required
							/>
						</div>
						<div>
							<Label htmlFor='edit-brand-code'>Codigo interno</Label>
							<Input
								id='edit-brand-code'
								name='code'
								type='text'
								defaultValue={brand.code ?? ''}
							/>
						</div>
					</div>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						{/* Fabricante removido */}
					</div>

					<div>
						<Label htmlFor='edit-brand-image'>Logo o fotografia</Label>
						<Input id='edit-brand-image' name='image' type='file' accept='image/*' />
						<p className='mt-1 text-xs text-gray-500'>
							Si subes una nueva imagen se convertira automaticamente a WebP.
						</p>
					</div>

					<div>
						<Label htmlFor='edit-brand-gallery'>Galería</Label>
						<Input
							id='edit-brand-gallery'
							name='gallery'
							type='file'
							accept='image/*'
							multiple
						/>
						<p className='mt-1 text-xs text-gray-500'>
							Puedes seleccionar varias imágenes para agregar a la galería.
						</p>
					</div>

					<div className='flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2'>
						<div>
							<p className='text-sm font-medium text-gray-700'>Marca activa</p>
							<p className='text-xs text-gray-500'>
								Controla la disponibilidad de la marca en el catalogo.
							</p>
						</div>
						<div className='flex items-center space-x-2'>
							<Checkbox
								id='edit-brand-active-toggle'
								checked={active}
								onChange={(event) => {
									const value = event.currentTarget.checked;
									setActive(value);
									const hidden = document.getElementById(
										'edit-brand-is-active',
									) as HTMLInputElement | null;
									if (hidden) hidden.value = value ? '1' : '0';
								}}
							/>
							<Label htmlFor='edit-brand-active-toggle' className='!mb-0'>
								Activa
							</Label>
						</div>
						<input
							id='edit-brand-is-active'
							name='is_active'
							type='hidden'
							value={active ? '1' : '0'}
							readOnly
						/>
					</div>
				</form>
			</ModalBody>
			<ModalFooter>
				<div className='flex justify-end space-x-3'>
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

export default EditarMarca;
