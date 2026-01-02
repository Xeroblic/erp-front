import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
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
import { validateRut, formatRut } from '@/utils/validateRut';
import { useAppDispatch } from '@/store';
import { fetchCustomersOverviewThunk } from '@/store/slices/customerSales/customerSalesSlice';

interface CreateCustomerModalProps {
	isOpen: boolean;
	onClose: () => void;
	subsidiaryId: number;
	onCustomerCreated: (customerId: number, customerName: string) => void;
}

const validationSchema = Yup.object({
	name: Yup.string().required('El nombre es requerido'),
	rut: Yup.string()
		.required('El RUT es requerido')
		.test('rut-valid', 'RUT inválido', (value) => validateRut(value || '')),
	email: Yup.string().required('El correo es requerido').email('Correo electrónico inválido'),
});

const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
	isOpen,
	onClose,
	subsidiaryId,
	onCustomerCreated,
}) => {
	const dispatch = useAppDispatch();

	const formik = useFormik({
		initialValues: {
			name: '',
			rut: '',
			email: '',
		},
		validationSchema,
		onSubmit: async (values, { setSubmitting, resetForm }) => {
			try {
				const payload = {
					subsidiary_id: subsidiaryId,
					document_type: 'rut',
					document_number: values.rut.trim(),
					email: values.email.trim(),
					contact_name: values.name.trim(),
					is_active: true,
				};
				const response = await ApiService.fetchData({
					url: `/subsidiaries/${subsidiaryId}/customer-sales`,
					method: 'POST',
					data: payload,
				});
				const createdCustomer = response.data as any;
				await dispatch(
					fetchCustomersOverviewThunk({
						subsidiary: subsidiaryId,
					}),
				).unwrap();
				toast.success('Cliente creado exitosamente');
				const customerName =
					createdCustomer.name ||
					createdCustomer.contact_name ||
					createdCustomer.contact?.name ||
					values.name.trim();

				onCustomerCreated(createdCustomer.id, customerName);
				resetForm();
				onClose();
			} catch (error: any) {
				console.error('Error al crear cliente:', error);
				toast.error(error.response?.data?.message || 'Error al crear cliente');
			} finally {
				setSubmitting(false);
			}
		},
	});

	const handleClose = () => {
		formik.resetForm();
		onClose();
	};

	const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatRut(e.target.value);
		formik.setFieldValue('rut', formatted);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='lg'>
			<ModalHeader>Crear Cliente Nuevo</ModalHeader>
			<form onSubmit={formik.handleSubmit}>
				<ModalBody>
					<div className='space-y-4'>
						<div>
							<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Nombre <span className='text-red-500'>*</span>
							</label>
							<Input
								name='name'
								value={formik.values.name}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								placeholder='Ej: Juan Pérez'
								isValid={!(formik.touched.name && formik.errors.name)}
								isTouched={formik.touched.name}
								invalidFeedback={formik.errors.name}
							/>
						</div>

						<div>
							<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								RUT <span className='text-red-500'>*</span>
							</label>
							<Input
								name='rut'
								value={formik.values.rut}
								onChange={handleRutChange}
								onBlur={formik.handleBlur}
								placeholder='Ej: 12345678-9'
								isValid={!(formik.touched.rut && formik.errors.rut)}
								isTouched={formik.touched.rut}
								invalidFeedback={formik.errors.rut}
							/>
						</div>

						<div>
							<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Correo Electrónico <span className='text-red-500'>*</span>
							</label>
							<Input
								name='email'
								type='email'
								value={formik.values.email}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								placeholder='Ej: correo@ejemplo.com'
								isValid={!(formik.touched.email && formik.errors.email)}
								isTouched={formik.touched.email}
								invalidFeedback={formik.errors.email}
							/>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
						<Button
							variant='outline'
							color='red'
							onClick={handleClose}
							isDisable={formik.isSubmitting}
							type='button'>
							Cancelar
						</Button>
						<Button
							variant='solid'
							color='emerald'
							type='submit'
							isDisable={formik.isSubmitting}>
							{formik.isSubmitting ? 'Creando...' : 'Crear Cliente'}
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default CreateCustomerModal;
