import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/form/Checkbox';
import Label from '@/components/form/Label';

import { useAppDispatch } from '@/store';
import {
	createCustomerThunk,
	updateCustomerThunk,
	fetchCustomerDetailThunk,
	fetchCustomersOverviewThunk,
} from '@/store/slices/customerSales/customerSalesSlice';
import { ICustomerSale } from '@/interface/customerSales.interface';
import { formatRut, validateRut } from '../utils/validateRut';

const CreateCustomerSaleModal = ({
	isOpen,
	setIsOpen,
	subsidiaryId,
	isEdit = false,
	initialData,
}: {
	isOpen: boolean;
	setIsOpen: (v: boolean) => void;
	subsidiaryId: number | string | null | undefined;
	isEdit?: boolean;
	initialData?: Partial<ICustomerSale> | null;
}) => {
	const dispatch = useAppDispatch();
	const rutId = React.useId();
	const companyId = React.useId();
	const contactId = React.useId();
	const emailId = React.useId();
	const phoneId = React.useId();

	const formik = useFormik({
		initialValues: {
			document_number: initialData?.document_number ?? initialData?.rut ?? '',
			billing_company: initialData?.billing_company ?? '',
			contact_name: initialData?.contact_name ?? initialData?.primary_contact?.name ?? '',
			email: initialData?.email ?? '',
			phone: initialData?.phone ?? '',
			is_active: typeof initialData?.is_active === 'boolean' ? initialData.is_active : true,
		},
		enableReinitialize: true,
		validationSchema: Yup.object({
			document_number: Yup.string()
				.required('RUT requerido')
				.test('rut-valid', 'RUT inválido', (value) => validateRut(value || '')),
			email: Yup.string().email('Email inválido').required('Email requerido'),
			billing_company: Yup.string().required('Empresa/Persona requerida'),
		}),
		onSubmit: async (values, { setSubmitting }) => {
			try {
				if (!subsidiaryId) {
					console.error('Subsidiaria no seleccionada');
					return;
				}

				if (isEdit && initialData?.id) {
					const action = await dispatch(
						updateCustomerThunk({
							subsidiary: subsidiaryId,
							id: initialData.id,
							payload: {
								rut: values.document_number,
								billing_company: values.billing_company,
								contact_name: values.contact_name,
								email: values.email,
								phone: values.phone,
								is_active: values.is_active,
								primary_contact: {
									name: values.contact_name || '',
									email: values.email || '',
									phone: values.phone || '',
								},
								primary_contact_name: values.contact_name,
								primary_contact_email: values.email,
								primary_contact_phone: values.phone,
							},
						}) as any,
					);

					if (action && action.meta?.requestStatus === 'fulfilled') {
						// refrescar detalle y overview
						dispatch(
							fetchCustomerDetailThunk({
								subsidiary: subsidiaryId,
								id: initialData.id,
							} as any) as any,
						);
						dispatch(
							fetchCustomersOverviewThunk({ subsidiary: subsidiaryId } as any) as any,
						);
						setIsOpen(false);
					} else {
						console.error('Error actualizando cliente', action);
					}
				} else {
					const action = await dispatch(
						createCustomerThunk({
							subsidiary: subsidiaryId,
							payload: {
								document_type: 'rut',
								rut: values.document_number,
								billing_company: values.billing_company,
								contact_name: values.contact_name,
								email: values.email,
								phone: values.phone,
								is_active: values.is_active,
								primary_contact: {
									name: values.contact_name || '',
									email: values.email || '',
									phone: values.phone || '',
								},
								primary_contact_name: values.contact_name,
								primary_contact_email: values.email,
								primary_contact_phone: values.phone,
							},
						}) as any,
					);

					if (action && action.meta?.requestStatus === 'fulfilled') {
						try {
							dispatch(
								fetchCustomersOverviewThunk({
									subsidiary: subsidiaryId,
								} as any) as any,
							);
						} catch (e) {
							console.warn(
								'No se pudo refrescar overview después de crear cliente',
								e,
							);
						}
						setIsOpen(false);
						formik.resetForm();
					} else {
						console.error('Error creando cliente', action);
					}
				}
			} finally {
				setSubmitting(false);
			}
		},
	});

	return (
		<Modal isOpen={isOpen} setIsOpen={() => setIsOpen(false)} size='md'>
			<ModalHeader>{isEdit ? 'Editar Cliente' : 'Crear Cliente'}</ModalHeader>

			<ModalBody>
				<form onSubmit={formik.handleSubmit} className='space-y-4'>
					<div className='space-y-1'>
						<Label htmlFor={rutId}>RUT</Label>
						<Input
							id={rutId}
							name='document_number'
							placeholder='12345678-9'
							value={formik.values.document_number}
							onChange={(e) => {
								const formatted = formatRut(e.target.value);
								formik.setFieldValue('document_number', formatted);
							}}
							onBlur={formik.handleBlur}
							isTouched={!!formik.touched.document_number}
							isValid={!formik.errors.document_number}
							invalidFeedback={
								formik.touched.document_number
									? (formik.errors.document_number as any)
									: undefined
							}
						/>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-1'>
							<Label htmlFor={companyId}>Empresa</Label>
							<Input
								id={companyId}
								name='billing_company'
								placeholder='Empresa S.A.'
								value={formik.values.billing_company}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								isTouched={!!formik.touched.billing_company}
								isValid={!formik.errors.billing_company}
								invalidFeedback={
									formik.touched.billing_company
										? (formik.errors.billing_company as any)
										: undefined
								}
							/>
						</div>
						<div className='space-y-1'>
							<Label htmlFor={contactId}>Contacto</Label>
							<Input
								id={contactId}
								name='contact_name'
								placeholder='Juan Pérez'
								value={formik.values.contact_name}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
							/>
						</div>
					</div>

					<div className='space-y-1'>
						<Label htmlFor={emailId}>Email</Label>
						<Input
							id={emailId}
							name='email'
							placeholder='correo@example.cl'
							value={formik.values.email}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							isTouched={!!formik.touched.email}
							isValid={!formik.errors.email}
							invalidFeedback={
								formik.touched.email ? (formik.errors.email as any) : undefined
							}
						/>
					</div>

					<div className='space-y-1'>
						<Label htmlFor={phoneId}>Teléfono</Label>
						<Input
							id={phoneId}
							name='phone'
							placeholder='+56 9 1234 5678'
							value={formik.values.phone}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</div>

					<div>
						<Checkbox
							label='Activo'
							name='is_active'
							checked={formik.values.is_active}
							onChange={formik.handleChange}
						/>
					</div>
				</form>
			</ModalBody>

			<ModalFooter>
				<Button
					variant='outline'
					onClick={() => {
						setIsOpen(false);
						formik.resetForm();
					}}>
					Cancelar
				</Button>
				<Button
					variant='solid'
					onClick={() => formik.handleSubmit()}
					disabled={formik.isSubmitting}>
					{isEdit ? 'Actualizar' : 'Guardar'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default CreateCustomerSaleModal;
