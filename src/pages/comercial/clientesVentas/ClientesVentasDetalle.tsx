import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Checkbox from '@/components/form/Checkbox';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchCustomerDetailThunk,
	fetchCustomersOverviewThunk,
	updateCustomerThunk,
} from '@/store/slices/customerSales/customerSalesSlice';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import ClientDetailHeader from './components/parts/ClientDetailHeader';
import DetailSection from './components/parts/DetailSection';
import EditableField from './components/parts/EditableField';
import EditableSelect from './components/parts/EditableSelect';
import { formatRut, validateRut } from './components/utils/validateRut';
import { TSelectOptions } from '@/components/form/SelectReact';

const ClientesVentasDetalle = () => {
	const { clienteId } = useParams();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const { detalle, loading } = useAppSelector((s) => s.customerSales);
	const effectiveSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);

	const [isEditable, setIsEditable] = useState(false);

	useEffect(() => {
		if (clienteId) {
			dispatch(
				fetchCustomerDetailThunk({
					subsidiary: effectiveSubsidiaryId ?? 1,
					id: clienteId,
				} as any),
			);
		}
	}, [clienteId, dispatch, effectiveSubsidiaryId]);

	const contacto = React.useMemo(
		() => ({
			name: detalle?.contact_name || detalle?.primary_contact?.name || '',
			email: detalle?.email || detalle?.primary_contact?.email || '',
			phone: detalle?.phone || detalle?.primary_contact?.phone || '',
		}),
		[detalle],
	);

	const defaultDocumentOptions: TSelectOptions = React.useMemo(
		() => [
			{ value: 'factura', label: 'Factura' },
			{ value: 'boleta', label: 'Boleta' },
		],
		[],
	);

	const paymentMethodOptions: TSelectOptions = React.useMemo(
		() => [
			{ value: 'efectivo', label: 'Efectivo' },
			{ value: 'tarjeta', label: 'Tarjeta' },
			{ value: 'tarjeta_credito', label: 'Tarjeta Crédito' },
			{ value: 'tarjeta_debito', label: 'Tarjeta Débito' },
			{ value: 'transferencia', label: 'Transferencia' },
			{ value: 'cheque', label: 'Cheque' },
			{ value: 'credito', label: 'Crédito' },
		],
		[],
	);

	const initialFormValues = React.useMemo(
		() => ({
			document_number: detalle?.document_number || detalle?.rut || '',
			billing_company: detalle?.billing_company || '',
			contact_name: contacto.name || '',
			email: contacto.email || '',
			trade_activity: detalle?.trade_activity || '',
			phone: contacto.phone || '',
			is_active: detalle?.is_active ?? true,
			preferred_payment_method: detalle?.preferred_payment_method || '',
			default_document_type: detalle?.default_document_type || '',
			// purchase_order_number: detalle?.purchase_order_number || '',
			billing_address_1: detalle?.billing_address_1 || '',
			billing_city: detalle?.billing_city || '',
			billing_postcode: detalle?.billing_postcode || '',
			shipping_address_1: detalle?.shipping_address_1 || '',
			shipping_city: detalle?.shipping_city || '',
			notes: detalle?.notes || '',
		}),
		[detalle, contacto],
	);

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: initialFormValues,
		validationSchema: Yup.object({
			document_number: Yup.string()
				.required('RUT requerido')
				.test('rut-valid', 'RUT inválido', (value) => validateRut(value || '')),
			billing_company: Yup.string().required('Nombre o empresa requerido'),
			email: Yup.string().email('Email inválido').required('Email requerido'),
		}),
		onSubmit: async (values, { setSubmitting }) => {
			if (!detalle) return;
			try {
				const payload = {
					...values,
					rut: values.document_number,
					document_number: values.document_number,
					contact_name: values.contact_name,
					email: values.email,
					phone: values.phone,
					primary_contact: {
						name: values.contact_name || '',
						email: values.email || '',
						phone: values.phone || '',
					},
					primary_contact_name: values.contact_name,
					primary_contact_email: values.email,
					primary_contact_phone: values.phone,
				};

				await dispatch(
					updateCustomerThunk({
						subsidiary: effectiveSubsidiaryId ?? 1,
						id: detalle.id,
						payload,
					}) as any,
				);

				await dispatch(
					fetchCustomerDetailThunk({
						subsidiary: effectiveSubsidiaryId ?? 1,
						id: detalle.id,
					} as any),
				);
				dispatch(
					fetchCustomersOverviewThunk({ subsidiary: effectiveSubsidiaryId ?? 1 } as any),
				);
				toast.success('Cliente actualizado');
				setIsEditable(false);
			} catch (error) {
				console.error(error);
				toast.error('No se pudo actualizar el cliente');
			} finally {
				setSubmitting(false);
			}
		},
	});

	const handleCancelEdit = () => {
		formik.resetForm();
		setIsEditable(false);
	};

	if (loading || !detalle) {
		return (
			<PageWrapper>
				<Container>
					<div className='p-10 text-center text-zinc-500'>
						Cargando información del cliente...
					</div>
				</Container>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper title='Detalle cliente' name='Detalle cliente'>
			<ClientDetailHeader
				client={detalle}
				contactName={contacto.name || ''}
				onBack={() => navigate('/comercial/clientes-ventas')}
				onEditToggle={() => setIsEditable(true)}
				onCancelEdit={handleCancelEdit}
				onSave={() => formik.submitForm()}
				isEditable={isEditable}
				isSubmitting={formik.isSubmitting}
			/>

			<Container>
				<div>
					<div>
						<form onSubmit={formik.handleSubmit} className='space-y-10'>
							<Card>
								<CardBody>
									<DetailSection
										title='Información General'
										description='Datos base del cliente y estado operacional.'
										contenRight={
											<div className='flex items-center gap-2'>
												{isEditable ? (
													<Checkbox
													checked={formik.values.is_active}
													label='Cliente activo'
													onChange={(e) =>
														formik.setFieldValue('is_active', e.target.checked)
													}
													/>
												) : (
													<>
														<p className='text-sm font-medium mt-2 text-zinc-500'>Estado</p>
														<Badge
															variant='solid'
															className='px-2 text-sm'
															color={formik.values.is_active ? 'green' : 'red'}>
															{formik.values.is_active ? 'Activo' : 'Inactivo'}
														</Badge>
													</>
												)}
											</div>
										}>
										<EditableField
											formik={formik}
											name='document_number'
											label='RUT'
											isEditable={isEditable}
											placeholder='12345678-9'
											onChangeValue={(value) =>
												formik.setFieldValue(
													'document_number',
													formatRut(value),
												)
											}
										/>
										<EditableField
											formik={formik}
											name='billing_company'
											label='Nombre / Empresa'
											isEditable={isEditable}
											placeholder='Empresa S.A.'
										/>
										<EditableField
											formik={formik}
											name='contact_name'
											label='Contacto'
											isEditable={isEditable}
											placeholder='Juan Pérez'
										/>
										<EditableField
											formik={formik}
											name='email'
											label='Email'
											isEditable={isEditable}
											placeholder='correo@example.cl'
										/>
										<EditableField
											formik={formik}
											name='phone'
											label='Teléfono'
											isEditable={isEditable}
											placeholder='+56 9 1234 5678'
										/>
										<EditableField
											formik={formik}
											name='trade_activity'
											label='Actividad Comercial'
											isEditable={isEditable}
											placeholder='Actividad comercial del cliente'
										/>
									</DetailSection>
								</CardBody>
							</Card>
							<Card>
								<CardBody>
									<DetailSection
										title='Comercial'
										description='Preferencias de documentos y pagos.'>
										<EditableSelect
											formik={formik}
											name='default_document_type'
											label='Documento preferido'
											isEditable={isEditable}
											options={defaultDocumentOptions}
											placeholder='Selecciona documento'
										/>
										<EditableSelect
											formik={formik}
											name='preferred_payment_method'
											label='Método de pago'
											isEditable={isEditable}
											options={paymentMethodOptions}
											placeholder='Selecciona método'
										/>
										{/* <EditableField
											formik={formik}
											name='purchase_order_number'
											label='N° Orden de compra'
											isEditable={isEditable}
											placeholder='OC-0001'
										/> */}
									</DetailSection>
								</CardBody>
							</Card>

							<div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
								<Card>
									<CardBody>
										<DetailSection
											title='Dirección de facturación'
											contentClassName='grid grid-cols-1 gap-4'>
											<EditableField
												formik={formik}
												name='billing_address_1'
												label='Dirección'
												isEditable={isEditable}
												placeholder='Av. Providencia 123'
											/>
											<EditableField
												formik={formik}
												name='billing_city'
												label='Ciudad'
												isEditable={isEditable}
												placeholder='Santiago'
											/>
											<EditableField
												formik={formik}
												name='billing_postcode'
												label='Código Postal'
												isEditable={isEditable}
												placeholder='8320000'
											/>
										</DetailSection>
									</CardBody>
								</Card>
								<Card>
									<CardBody>
										<DetailSection
											title='Dirección de despacho'
											contentClassName='grid grid-cols-1 gap-4'>
											<EditableField
												formik={formik}
												name='shipping_address_1'
												label='Dirección'
												isEditable={isEditable}
												placeholder='Dirección de envío'
											/>
											<EditableField
												formik={formik}
												name='shipping_city'
												label='Ciudad'
												isEditable={isEditable}
												placeholder='Ciudad de envío'
											/>
										</DetailSection>
									</CardBody>
								</Card>
							</div>
							<Card>
								<CardBody>
									<DetailSection
										title='Notas internas'
										description='Información adicional relevante para el equipo.'
										contentClassName='grid grid-cols-1'>
										<EditableField
											formik={formik}
											name='notes'
											label='Notas'
											isEditable={isEditable}
											textarea
											placeholder='Observaciones internas...'
										/>
									</DetailSection>
								</CardBody>
							</Card>
						</form>
					</div>
				</div>
			</Container>
		</PageWrapper>
	);
};

export default ClientesVentasDetalle;
