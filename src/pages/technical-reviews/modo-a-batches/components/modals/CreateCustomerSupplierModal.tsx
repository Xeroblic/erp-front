import React, { useEffect, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Button from '@/components/ui/Button';
import type { ICreateCustomerSupplierRequest } from '@/interface/customerSupplier.interface';

interface CreateCustomerSupplierModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	onSubmit: (data: ICreateCustomerSupplierRequest) => Promise<boolean>;
	loading?: boolean;
}

const CreateCustomerSupplierModal: React.FC<CreateCustomerSupplierModalProps> = ({
	isOpen,
	setIsOpen,
	onSubmit,
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
		const success = await onSubmit({ name: trimmed });
		setSubmitting(false);

		if (!success) return;
		setIsOpen(false);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={() => setIsOpen(false)} size='md' isCentered>
			<ModalHeader>Crear cliente/proveedor</ModalHeader>
			<ModalBody className='space-y-3'>
				<div>
					<Label htmlFor='customer_supplier_name'>Nombre</Label>
					<Input
						id='customer_supplier_name'
						name='customer_supplier_name'
						placeholder='Ej: Cliente XYZ'
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					{error && <p className='mt-1 text-xs text-red-500'>{error}</p>}
				</div>
				<p className='text-xs text-neutral-500'>
					Crea un cliente/proveedor básico para poder registrar el lote.
				</p>
			</ModalBody>
			<ModalFooter>
				<Button variant='outline' onClick={() => setIsOpen(false)} isDisable={submitting || loading}>
					Cancelar
				</Button>
				<Button
					variant='solid'
					onClick={handleSave}
					isLoading={submitting || loading}
					isDisable={submitting || loading}>
					Guardar
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default CreateCustomerSupplierModal;
