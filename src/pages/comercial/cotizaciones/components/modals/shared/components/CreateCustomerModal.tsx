import React, { useState } from 'react';
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
import Dropdown from '@/components/ui/Dropdown';
import Label from '@/components/form/Label';
import Icon from '@/components/icon/Icon';
import FieldWrap from '@/components/form/FieldWrap';
import Validation from '@/components/form/Validation';

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
	billing_company: Yup.string().min(2, 'La empresa debe tener al menos 2 caracteres'),
	giro: Yup.string().min(2, 'El giro debe tener al menos dos caracteres'),
	billing_address_1: Yup.string().min(2, 'La dirección debe tener al menos dos caracteres'),
	shipping_address_1: Yup.string().min(
		2,
		'La dirección de envío debe tener al menos dos caracteres',
	),
	phone: Yup.string().min(9, 'El teléfono debe tener al menos 9 caracteres'),
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
			billing_company: '',
			giro: '',
			billing_address_1: '',
			shipping_address_1: '',
			phone: '',
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
					billing_company: values.billing_company.trim(),
					giro: values.giro.trim(),
					billing_address_1: values.billing_address_1.trim(),
					shipping_address_1: values.shipping_address_1.trim(),
					phone: values.phone.trim(),
				};

				const response = await ApiService.fetchData<{
					data: {
						id: number;
						name?: string;
						contact_name?: string;
						contact?: { name?: string };
						billing_company?: string;
						giro?: string;
						billing_address_1?: string;
						shipping_address_1?: string;
						phone?: string;

						[key: string]: any;
					};
				}>({
					url: `/subsidiaries/${subsidiaryId}/customer-sales`,
					method: 'POST',
					data: payload,
				});

				const createdCustomer = response.data?.data || (response.data as any);

				await dispatch(
					fetchCustomersOverviewThunk({
						subsidiary: subsidiaryId,
					}),
				).unwrap();

				const customerName =
					createdCustomer.name ||
					createdCustomer.contact_name ||
					createdCustomer.contact?.name ||
					values.name.trim();

				if (!createdCustomer.id) {
					toast.error('Error: No se pudo obtener el ID del cliente creado');
					return;
				}

				toast.success(`Cliente ${customerName} creado exitosamente`);

				await onCustomerCreated(createdCustomer.id, customerName);

				await new Promise((resolve) => setTimeout(resolve, 500));

				resetForm();
				onClose();
			} catch (error: any) {
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

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const handleDropdownToggle = () => {
		setIsDropdownOpen(!isDropdownOpen);
	};

	//TODO: crear una funcion para que un input se rrellene automaticamente al mismo tiempo con la misma informacion que el otro se debe ir rellenando al mismo tiempo que el usuario escribe quiero que si se cambia una vez escrito el de facturacion y haber cumplido su proposito si vuelvo a cambiarlo por segunda vez no se cambie el de envio
	const handleBillingAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { value } = e.target;
		if (formik.values.billing_address_1 === formik.values.shipping_address_1) {
			formik.setFieldValue('shipping_address_1', value);
		}
		formik.setFieldValue('billing_address_1', value);
	};

	const handleShippingAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		formik.handleChange(e);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='lg'>
			<ModalHeader>Crear Cliente Nuevo</ModalHeader>
			<form onSubmit={formik.handleSubmit}>
				<ModalBody>
					<div className='space-y-4'>
						<div>
							<Label
								htmlFor='name'
								className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Nombre <span className='text-red-500'>*</span>
							</Label>
							<FieldWrap
								isValid={!(formik.touched.name && formik.errors.name)}
								isTouched={formik.touched.name}
								invalidFeedback={formik.errors.name}
								onBlur={formik.handleBlur}
								onChange={formik.handleChange}>
								<Validation
									isValid={!(formik.touched.name && formik.errors.name)}
									isTouched={formik.touched.name}
									invalidFeedback={formik.errors.name}
									children={
										<Input
											name='name'
											value={formik.values.name}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											placeholder='Ej: Juan Pérez'
										/>
									}
								/>
							</FieldWrap>
						</div>

						<div>
							<Label
								htmlFor='rut'
								className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								RUT <span className='text-red-500'>*</span>
							</Label>
							<FieldWrap
								isValid={!(formik.touched.rut && formik.errors.rut)}
								isTouched={formik.touched.rut}
								invalidFeedback={formik.errors.rut}
								onBlur={formik.handleBlur}
								onChange={handleRutChange}>
								<Validation
									isValid={!(formik.touched.rut && formik.errors.rut)}
									isTouched={formik.touched.rut}
									invalidFeedback={formik.errors.rut}
									children={
										<Input
											name='rut'
											value={formik.values.rut}
											onChange={handleRutChange}
											onBlur={formik.handleBlur}
											placeholder='Ej: 12345678-9'
										/>
									}
								/>
							</FieldWrap>
						</div>

						<div>
							<Label
								htmlFor='email'
								className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Correo Electrónico <span className='text-red-500'>*</span>
							</Label>
							<FieldWrap
								isValid={!(formik.touched.email && formik.errors.email)}
								isTouched={formik.touched.email}
								invalidFeedback={formik.errors.email}
								onBlur={formik.handleBlur}
								onChange={formik.handleChange}>
								<Validation
									isValid={!(formik.touched.email && formik.errors.email)}
									isTouched={formik.touched.email}
									invalidFeedback={formik.errors.email}
									children={
										<Input
											name='email'
											type='email'
											value={formik.values.email}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
									}
								/>
							</FieldWrap>
						</div>

						{isDropdownOpen ? (
							<div>
								<Button onClick={handleDropdownToggle} className='pl-0'>
									Ocultar Informacion{' '}
									<Icon icon='DuoAngleDoubleUp' className='ml-2 text-3xl' />
								</Button>

								<div>
									<Label
										htmlFor='billing_company'
										className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Empresa
									</Label>
									<FieldWrap
										isValid={
											!(
												formik.touched.billing_company &&
												formik.errors.billing_company
											)
										}
										isTouched={formik.touched.billing_company}
										invalidFeedback={formik.errors.billing_company}
										onBlur={formik.handleBlur}
										onChange={formik.handleChange}>
										<Validation
											isValidMessage={
												!(
													formik.touched.billing_company &&
													formik.errors.billing_company
												)
											}
											isValid={
												!(
													formik.touched.billing_company &&
													formik.errors.billing_company
												)
											}
											isTouched={formik.touched.billing_company}
											invalidFeedback={formik.errors.billing_company}
											children={
												<Input
													name='billing_company'
													value={formik.values.billing_company}
													onBlur={formik.handleBlur}
													placeholder='Ej: Empresa S.A.'
													isValid={
														!(
															formik.touched.billing_company &&
															formik.errors.billing_company
														)
													}
													isTouched={formik.touched.billing_company}
													invalidFeedback={formik.errors.billing_company}
												/>
											}
										/>
									</FieldWrap>
								</div>

								<div>
									<Label
										htmlFor='giro'
										className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Giro
									</Label>
									<FieldWrap
										isValid={!(formik.touched.giro && formik.errors.giro)}
										isTouched={formik.touched.giro}
										invalidFeedback={formik.errors.giro}
										onBlur={formik.handleBlur}
										onChange={formik.handleChange}>
										<Validation
											isValidMessage={
												!(formik.touched.giro && formik.errors.giro)
											}
											isValid={!(formik.touched.giro && formik.errors.giro)}
											isTouched={formik.touched.giro}
											invalidFeedback={formik.errors.giro}
											children={
												<Input
													name='giro'
													value={formik.values.giro}
													placeholder='Ej: Giro'
													isValid={
														!(formik.touched.giro && formik.errors.giro)
													}
													isTouched={formik.touched.giro}
													invalidFeedback={formik.errors.giro}
												/>
											}
										/>
									</FieldWrap>
								</div>

								<div>
									<Label
										htmlFor='billing_address_1'
										className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Dirección de Facturación
									</Label>
									<FieldWrap
										isValid={
											!(
												formik.touched.billing_address_1 &&
												formik.errors.billing_address_1
											)
										}
										isTouched={formik.touched.billing_address_1}
										invalidFeedback={formik.errors.billing_address_1}
										onBlur={formik.handleBlur}
										onChange={formik.handleChange}>
										<Validation
											isValidMessage={
												!(
													formik.touched.billing_address_1 &&
													formik.errors.billing_address_1
												)
											}
											isValid={
												!(
													formik.touched.billing_address_1 &&
													formik.errors.billing_address_1
												)
											}
											isTouched={formik.touched.billing_address_1}
											invalidFeedback={formik.errors.billing_address_1}
											children={
												<Input
													name='billing_address_1'
													value={formik.values.billing_address_1}
													onBlur={formik.handleBlur}
													placeholder='Ej: Dirección de Facturación'
													onChange={(e) => {
														formik.handleChange(e);
														handleBillingAddressChange(e);
													}}
												/>
											}
										/>
									</FieldWrap>
								</div>

								<div>
									<Label
										htmlFor='shipping_address_1'
										className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Dirección de Envío
									</Label>
									<FieldWrap
										isValid={
											!(
												formik.touched.shipping_address_1 &&
												formik.errors.shipping_address_1
											)
										}
										isTouched={formik.touched.shipping_address_1}
										invalidFeedback={formik.errors.shipping_address_1}
										onBlur={formik.handleBlur}
										onChange={formik.handleChange}>
										<Validation
											isValidMessage={
												!(
													formik.touched.shipping_address_1 &&
													formik.errors.shipping_address_1
												)
											}
											isValid={
												!(
													formik.touched.shipping_address_1 &&
													formik.errors.shipping_address_1
												)
											}
											isTouched={formik.touched.shipping_address_1}
											invalidFeedback={formik.errors.shipping_address_1}
											children={
												<Input
													onChange={(e) => {
														formik.handleChange(e);
														handleShippingAddressChange(e);
													}}
													name='shipping_address_1'
													value={formik.values.shipping_address_1}
													onBlur={formik.handleBlur}
													placeholder='Ej: Dirección de Envío'
												/>
											}
										/>
									</FieldWrap>
								</div>

								<div>
									<Label
										htmlFor='phone'
										className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Teléfono
									</Label>
									<FieldWrap
										isValid={!(formik.touched.phone && formik.errors.phone)}
										isTouched={formik.touched.phone}
										invalidFeedback={formik.errors.phone}
										onBlur={formik.handleBlur}
										onChange={formik.handleChange}>
										<Validation
											isValidMessage={
												!(formik.touched.phone && formik.errors.phone)
											}
											isValid={!(formik.touched.phone && formik.errors.phone)}
											isTouched={formik.touched.phone}
											invalidFeedback={formik.errors.phone}
											children={
												<Input
													name='phone'
													value={formik.values.phone}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													placeholder='Ej: Teléfono'
												/>
											}
										/>
									</FieldWrap>
								</div>
							</div>
						) : (
							<Button onClick={handleDropdownToggle} className='pl-0'>
								Mas Informacion{' '}
								<Icon icon='DuoAngleDoubleDown' className='ml-2 text-3xl' />
							</Button>
						)}
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
