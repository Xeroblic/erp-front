import React, { useEffect, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Button from '@/components/ui/Button';
import type { ICreateSupplierRequest, ISupplier } from '@/interface/supplier.interface';

interface CreateSupplierModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	onCreate: (data: ICreateSupplierRequest) => Promise<ISupplier | null>;
	loading?: boolean;
}

const CreateSupplierModal: React.FC<CreateSupplierModalProps> = ({
	isOpen,
	setIsOpen,
	onCreate,
	loading = false,
}) => {
	const [name, setName] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setName('');
			setError(null);
		}
	}, [isOpen]);

	const handleSave = async () => {
		const trimmed = name.trim();
		if (!trimmed) {
			setError('El nombre es obligatorio');
			return;
		}

		setSubmitting(true);
		const created = await onCreate({ name: trimmed });
		setSubmitting(false);

		if (created) {
			setIsOpen(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={() => setIsOpen(false)} size='md' isCentered>
			<ModalHeader>Crear proveedor</ModalHeader>
			<ModalBody className='space-y-3'>
				<div>
					<Label htmlFor='supplier_name'>Nombre</Label>
					<Input
						id='supplier_name'
						name='supplier_name'
						placeholder='Ej: Proveedor XYZ'
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					{error && <p className='mt-1 text-xs text-red-500'>{error}</p>}
				</div>
				<p className='text-xs text-neutral-500'>
					Crea un nuevo proveedor que podrás asociar a un cliente/proveedor.
				</p>
			</ModalBody>
			<ModalFooter>
				<Button
					variant='outline'
					onClick={() => setIsOpen(false)}
					color='red'
					isDisable={submitting || loading}>
					Cancelar
				</Button>
				<Button
					variant='solid'
					color='emerald'
					onClick={handleSave}
					isLoading={submitting || loading}
					isDisable={submitting || loading}>
					Guardar
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default CreateSupplierModal;
