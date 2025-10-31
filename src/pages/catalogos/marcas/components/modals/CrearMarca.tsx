import React, { Dispatch, SetStateAction } from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Checkbox from '@/components/form/Checkbox';
import { useAppSelector } from '@/store';
import UserBranchSelector from '@/pages/catalogos/productos/components/modals/components/UserBranchSelector';

type CrearMarcaProps = {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	isLoading?: boolean;
	defaultBranchId?: number;
};

const CrearMarca: React.FC<CrearMarcaProps> = ({
	isOpen,
	setIsOpen,
	onSubmit,
	isLoading,
	defaultBranchId,
}) => {
	const [isActive, setIsActive] = React.useState(true);
	const [selectedBranchId, setSelectedBranchId] = React.useState<number | null>(null);
	const currentUser = useAppSelector((state) => state.auth.user);
	const userId = currentUser?.id || (currentUser as any)?.pk || undefined;

	React.useEffect(() => {
		if (!isOpen) {
			setIsActive(true);
			setSelectedBranchId(null);
			const form = document.getElementById('createBrandForm') as HTMLFormElement | null;
			form?.reset();
		}
	}, [isOpen]);

	React.useEffect(() => {
		if (!isOpen) return;
		setSelectedBranchId((prev) => {
			if (prev !== null) return prev;
			return defaultBranchId ?? null;
		});
	}, [isOpen, defaultBranchId]);

	const handleSubmitClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		const form = document.getElementById('createBrandForm') as HTMLFormElement | null;
		form?.requestSubmit();
	};

	const canSubmit = !isLoading && selectedBranchId !== null;

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-violet-100'>
						<Icon icon='HeroPlus' className='h-6 w-6 text-violet-600' />
					</div>
					<div>
						<h2 className='text-xl font-bold text-gray-900'>Nueva marca</h2>
						<p className='text-sm text-gray-600'>
							Registra una marca para la sucursal seleccionada
						</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<form id='createBrandForm' className='space-y-4' onSubmit={onSubmit}>
					<UserBranchSelector
						userId={userId ?? 0}
						value={selectedBranchId}
						onChange={(branchId) => setSelectedBranchId(branchId)}
						name='branch_id'
						label='Sucursal'
						placeholder='Selecciona una sucursal'
						required
						showError
					/>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label htmlFor='brand-name' className='required'>
								Nombre
							</Label>
							<Input
								id='brand-name'
								name='name'
								type='text'
								placeholder='Nombre de la marca'
								required
							/>
						</div>
						<div>
							<Label htmlFor='brand-code'>Codigo interno</Label>
							<Input id='brand-code' name='code' type='text' placeholder='Opcional' />
						</div>
					</div>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						{/* Fabricante removido: backend no lo entrega */}
					</div>

					<div>
						<Label htmlFor='brand-image'>Logo o fotografia</Label>
						<Input id='brand-image' name='image' type='file' accept='image/*' />
						<p className='mt-1 text-xs text-gray-500'>
							La imagen se convertira automaticamente a formato WebP.
						</p>
					</div>

					<div>
						<Label htmlFor='brand-gallery'>Galería</Label>
						<Input id='brand-gallery' name='gallery' type='file' accept='image/*' multiple />
						<p className='mt-1 text-xs text-gray-500'>Puedes seleccionar varias imágenes para la galería.</p>
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
								id='brand-active-toggle'
								checked={isActive}
								onChange={(event) => {
									const value = event.currentTarget.checked;
									setIsActive(value);
									const hidden = document.getElementById(
										'brand-is-active',
									) as HTMLInputElement | null;
									if (hidden) hidden.value = value ? '1' : '0';
								}}
							/>
							<Label htmlFor='brand-active-toggle' className='!mb-0'>
								Activa
							</Label>
						</div>
						<input
							id='brand-is-active'
							name='is_active'
							type='hidden'
							value={isActive ? '1' : '0'}
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
					<Button
						color='violet'
						onClick={handleSubmitClick}
						isDisable={!canSubmit}
						isLoading={isLoading}>
						{isLoading ? 'Guardando...' : 'Crear marca'}
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default CrearMarca;
