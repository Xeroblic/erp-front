/**
 * CreateCustomerSupplierModal
 * Modal para crear un nuevo cliente/proveedor desde el formulario de lotes.
 */
import React, { useEffect, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Button from '@/components/ui/Button';
import type {
	ICreateCustomerSupplierRequest,
	ICustomerSupplier,
} from '@/interface/customerSupplier.interface';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateCustomerSupplierModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	onCreate: (data: ICreateCustomerSupplierRequest) => Promise<ICustomerSupplier | null>;
	loading?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CreateCustomerSupplierModal: React.FC<CreateCustomerSupplierModalProps> = ({
	isOpen,
	setIsOpen,
	onCreate,
	loading = false,
}) => {
	const [name, setName] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	// Reset form state when modal opens
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
		try {
			const created = await onCreate({ name: trimmed });
			if (created) {
				setIsOpen(false);
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Error al crear el registro';
			setError(message);
		} finally {
			setSubmitting(false);
		}
	};

	const isBusy = submitting || loading;

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
					Primero crea el cliente. Luego podrás asociarle un proveedor existente desde el
					formulario.
				</p>
			</ModalBody>
			<ModalFooter>
				<Button variant='outline' onClick={() => setIsOpen(false)} isDisable={isBusy}>
					Cancelar
				</Button>
				<Button variant='solid' onClick={handleSave} isLoading={isBusy} isDisable={isBusy}>
					Guardar
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default CreateCustomerSupplierModal;
