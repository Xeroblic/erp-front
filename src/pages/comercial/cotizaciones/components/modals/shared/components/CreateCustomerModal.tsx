import React, { useState } from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';

interface CreateCustomerModalProps {
	isOpen: boolean;
	onClose: () => void;
	subsidiaryId: number;
	onCustomerCreated: (customerId: number, customerName: string) => void;
}

const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
	isOpen,
	onClose,
	subsidiaryId,
	onCustomerCreated,
}) => {
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		rut: '',
		email: '',
	});
	const [errors, setErrors] = useState({
		name: '',
		rut: '',
		email: '',
	});

	const handleReset = () => {
		setFormData({ name: '', rut: '', email: '' });
		setErrors({ name: '', rut: '', email: '' });
	};

	const handleClose = () => {
		handleReset();
		onClose();
	};

	const validateForm = (): boolean => {
		const newErrors = { name: '', rut: '', email: '' };
		let isValid = true;

		if (!formData.name.trim()) {
			newErrors.name = 'El nombre es requerido';
			isValid = false;
		}

		if (!formData.rut.trim()) {
			newErrors.rut = 'El RUT es requerido';
			isValid = false;
		}

		if (!formData.email.trim()) {
			newErrors.email = 'El correo es requerido';
			isValid = false;
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = 'Correo electrónico inválido';
			isValid = false;
		}

		setErrors(newErrors);
		return isValid;
	};

	const handleSubmit = async () => {
		if (!validateForm()) return;

		setLoading(true);
		try {
			const payload = {
				subsidiary_id: subsidiaryId,
				document_type: 'rut',
				document_number: formData.rut.trim(),
				email: formData.email.trim(),
				contact_name: formData.name.trim(),
				is_active: true,
			};

			const response = await ApiService.fetchData({
				url: `/subsidiaries/${subsidiaryId}/customer-sales`,
				method: 'POST',
				data: payload,
			});

			const createdCustomer = response.data as any;
			toast.success('Cliente creado exitosamente');

			onCustomerCreated(
				createdCustomer.id,
				createdCustomer.name || createdCustomer.contact_name,
			);
			handleClose();
		} catch (error: any) {
			console.error('Error al crear cliente:', error);
			toast.error(error.response?.data?.message || 'Error al crear cliente');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='lg'>
			<ModalHeader>Crear Cliente Nuevo</ModalHeader>
			<ModalBody>
				<div className='space-y-4'>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Nombre <span className='text-red-500'>*</span>
						</label>
						<Input
							name='name'
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							placeholder='Ej: Juan Pérez'
							isValid={!errors.name}
							invalidFeedback={errors.name}
						/>
					</div>

					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							RUT <span className='text-red-500'>*</span>
						</label>
						<Input
							name='rut'
							value={formData.rut}
							onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
							placeholder='Ej: 12345678-9'
							isValid={!errors.rut}
							invalidFeedback={errors.rut}
						/>
					</div>

					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Correo Electrónico <span className='text-red-500'>*</span>
						</label>
						<Input
							name='email'
							type='email'
							value={formData.email}
							onChange={(e) => setFormData({ ...formData, email: e.target.value })}
							placeholder='Ej: correo@ejemplo.com'
							isValid={!errors.email}
							invalidFeedback={errors.email}
						/>
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' color='red' onClick={handleClose} isDisable={loading}>
						Cancelar
					</Button>
					<Button variant='solid' color='emerald' onClick={handleSubmit} isDisable={loading}>
						{loading ? 'Creando...' : 'Crear Cliente'}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default CreateCustomerModal;
