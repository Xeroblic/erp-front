import React from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import SelectReact, { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';
import Input from '@/components/form/Input';
import Button from '@/components/ui/Button';
import { FormikErrors, FormikTouched } from 'formik';
import { FormQuotationValues } from '../types';
import { QuoteStatus } from '@/interface';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import CreateCustomerModal from './CreateCustomerModal';
import ApiService from '@/services/ApiService';
import { toast } from 'react-toastify';

 const getCustomerField = (customer: any, keys: string[]) => {
	for (const key of keys) {
		const value = key
			.split('.')
			.reduce<any>((acc, part) => (acc != null ? acc[part] : undefined), customer);
		if (value !== undefined && value !== null && String(value).trim() !== '') {
			return value;
		}
	}
	return '';
 };

interface GeneralInfoCardProps {
	values: FormQuotationValues;
	setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
	errors: FormikErrors<FormQuotationValues>;
	touched: FormikTouched<FormQuotationValues>;
	customerOptions: TSelectOptions;
	subsidiaryId: number;
	customersData?: any[];
	paymentMethodOptions: TSelectOptions;
	paymentTermsOptions: TSelectOptions;
	statusOptions: TSelectOptions;
	onCustomerCreated: (customerId: number, customerName: string, customerData?: any) => void;
	onCustomerUpdated?: (customerId: number, customerData: any) => void;
}

const GeneralInfoCard: React.FC<GeneralInfoCardProps> = ({
	values,
	setFieldValue,
	errors,
	touched,
	customerOptions,
	subsidiaryId,
	customersData,
	paymentMethodOptions,
	paymentTermsOptions,
	statusOptions,
	onCustomerCreated,
	onCustomerUpdated,
}) => {
	const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
	const [isSavingCustomer, setIsSavingCustomer] = React.useState(false);
	const [isLoadingCustomerDetail, setIsLoadingCustomerDetail] = React.useState(false);
	const selectMenuProps = React.useMemo(
		() => ({
			menuPortalTarget: typeof document !== 'undefined' ? document.body : null,
			menuPosition: 'fixed' as const,
			styles: {
				menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
			},
		}),
		[],
	);

	const selectedCustomer = customersData?.find((c) => Number(c.id) === Number(values.customer_id));
	const customerRut = getCustomerField(selectedCustomer, [
		'tax_number',
		'rut',
		'document_number',
	]);
	const customerGiro = getCustomerField(selectedCustomer, [
		'activity',
		'giro',
		'business_activity',
	]);
	const customerShippingAddress = getCustomerField(selectedCustomer, [
		'shipping_address',
		'address',
		'addresses.0.address',
	]);
	const customerBillingAddress = getCustomerField(selectedCustomer, [
		'billing_address',
		'billing_company_address',
		'address',
	]);
	const customerContact = getCustomerField(selectedCustomer, [
		'contact_name',
		'contact.name',
		'name',
	]);
	const customerEmail = getCustomerField(selectedCustomer, [
		'email',
		'contact.email',
	]);
	const hasExtendedCustomerData = Boolean(
		getCustomerField(selectedCustomer, [
			'giro',
			'trade_activity',
			'billing_address_1',
			'shipping_address_1',
			'primary_contact.phone',
		]),
	);

	React.useEffect(() => {
		const loadCustomerDetail = async () => {
			if (!values.customer_id || !selectedCustomer || hasExtendedCustomerData) {
				return;
			}

			setIsLoadingCustomerDetail(true);
			try {
				const response = await ApiService.fetchData<any>({
					url: `/subsidiaries/${subsidiaryId}/customer-sales/${values.customer_id}`,
					method: 'get',
				});

				const customerDetail = response.data?.data ?? response.data;
				if (customerDetail) {
					onCustomerUpdated?.(Number(values.customer_id), customerDetail);
				}
			} catch (error) {
				console.error('Error cargando detalle del cliente:', error);
			} finally {
				setIsLoadingCustomerDetail(false);
			}
		};

		loadCustomerDetail();
	}, [
		values.customer_id,
		selectedCustomer,
		hasExtendedCustomerData,
		subsidiaryId,
		onCustomerUpdated,
	]);

	React.useEffect(() => {
		if (!values.customer_id) {
			setFieldValue('customer_rut', '', false);
			setFieldValue('customer_giro', '', false);
			setFieldValue('customer_shipping_address', '', false);
			setFieldValue('customer_billing_address', '', false);
			setFieldValue('customer_contact_name', '', false);
			setFieldValue('customer_email', '', false);
			return;
		}

		if (!selectedCustomer) {
			return;
		}

		setFieldValue('customer_rut', customerRut, false);
		setFieldValue('customer_giro', customerGiro, false);
		setFieldValue('customer_shipping_address', customerShippingAddress, false);
		setFieldValue('customer_billing_address', customerBillingAddress, false);
		setFieldValue('customer_contact_name', customerContact, false);
		setFieldValue('customer_email', customerEmail, false);
	}, [
		values.customer_id,
		selectedCustomer,
		customerRut,
		customerGiro,
		customerShippingAddress,
		customerBillingAddress,
		customerContact,
		customerEmail,
		setFieldValue,
	]);

	const handleSaveCustomerData = async () => {
		if (!values.customer_id) {
			toast.error('Debes seleccionar un cliente antes de guardar sus datos');
			return;
		}

		setIsSavingCustomer(true);
		try {
			const payload = {
				document_type: 'rut',
				document_number: values.customer_rut?.trim() || '',
				rut: values.customer_rut?.trim() || '',
				email: values.customer_email?.trim() || '',
				contact_name: values.customer_contact_name?.trim() || '',
				billing_company:
					selectedCustomer?.billing_company || selectedCustomer?.name || values.customer_contact_name,
				giro: values.customer_giro?.trim() || '',
				trade_activity: values.customer_giro?.trim() || '',
				billing_address_1: values.customer_billing_address?.trim() || '',
				shipping_address_1: values.customer_shipping_address?.trim() || '',
			};

			const response = await ApiService.fetchData<any>({
				url: `/subsidiaries/${subsidiaryId}/customer-sales/${values.customer_id}`,
				method: 'patch',
				data: payload,
			});

			const updatedCustomer = response.data?.data ?? response.data ?? payload;
			onCustomerUpdated?.(Number(values.customer_id), updatedCustomer);
			toast.success('Datos del cliente actualizados');
		} catch (error: any) {
			toast.error(error?.response?.data?.message || 'No se pudieron guardar los datos del cliente');
		} finally {
			setIsSavingCustomer(false);
		}
	};

	return (
		<Card
			rounded='rounded-2xl'
			className='dark:shadow-lg/10 border border-white/80 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5'>
			<CardHeader className='pb-2'>
				<CardHeaderChild className='w-full items-center justify-between'>
					<div>
						<CardTitle className='flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white'>
							<span className='flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-200'>
								<Icon icon='DuoAddressBook1' className='text-xl' />
							</span>
							<span>Información General</span>
						</CardTitle>
						<p className='text-xs text-gray-500 dark:text-gray-300'>
							Define los datos base del cliente y la vigencia de la cotización.
						</p>
					</div>
					<Badge className='rounded-full bg-amber-50 px-4 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-400/20 dark:text-amber-100'>
						Paso 1
					</Badge>
				</CardHeaderChild>
			</CardHeader>
			<CardBody className='pt-2'>
				<div className='grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1fr]'>
					{/* Columna Izquierda: Datos del Cliente */}
					<div className='space-y-4 rounded-2xl border border-zinc-100 bg-white/50 p-4 dark:border-white/10 dark:bg-zinc-900/50'>
						<div className='flex items-center justify-between gap-3'>
							<h4 className='text-sm font-semibold text-gray-800 dark:text-gray-200'>Datos del Cliente</h4>
							<div className='flex items-center gap-2'>
								{selectedCustomer ? (
									<Badge className='rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-100'>
										Autocompletado activo
									</Badge>
								) : null}
								{isLoadingCustomerDetail ? (
									<Badge className='rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700 dark:bg-sky-400/20 dark:text-sky-100'>
										Cargando detalle...
									</Badge>
								) : null}
								{values.customer_id ? (
									<Button
										size='sm'
										variant='outline'
										color='emerald'
										icon='HeroCheck'
										onClick={handleSaveCustomerData}
										isLoading={isSavingCustomer}>
										Guardar cliente
									</Button>
								) : null}
							</div>
						</div>
						<div className='flex flex-col gap-3'>
							{/* Fila: Cliente */}
							<div className='grid grid-cols-1 gap-2 md:grid-cols-[140px_minmax(0,1fr)] md:items-center'>
								<p className='text-[11px] font-semibold text-gray-500 dark:text-gray-300'>Cliente *</p>
								<div className='flex gap-2 w-full'>
									<div className='relative z-50 flex-1'>
										<SelectReact
											key={`customer-select-${values.customer_id}-${customerOptions.length}`}
											name='customer_id'
											options={customerOptions}
											placeholder='Seleccionar cliente...'
											value={customerOptions.find(
												(opt) => opt.value === String(values.customer_id),
											)}
											isClearable={true}
											onChange={(option) => {
												const selectedOption = option as TSelectOption;
												if (selectedOption && !Array.isArray(selectedOption)) {
													setFieldValue(
														'customer_id',
														Number(selectedOption.value) || 0,
													);
												} else {
													setFieldValue('customer_id', 0);
												}
											}}
											isValid={!errors.customer_id}
											isTouched={touched.customer_id}
											invalidFeedback={errors.customer_id}
											{...selectMenuProps}
										/>
									</div>
									<Button
										variant='solid'
										color='blue'
										icon='HeroPlus'
										onClick={() => setIsCreateModalOpen(true)}
										className='shrink-0'
									/>
								</div>
							</div>

							{/* Fila: RUT */}
							<div className='grid grid-cols-1 gap-2 md:grid-cols-[140px_minmax(0,1fr)] md:items-center'>
								<p className='text-[11px] font-semibold text-gray-500 dark:text-gray-300'>RUT</p>
								<div className='w-full'>
									<Input
										name='customer_rut'
										value={values.customer_rut ?? ''}
										onChange={(e) => setFieldValue('customer_rut', e.target.value)}
									/>
								</div>
							</div>

							{/* Fila: Giro */}
							<div className='grid grid-cols-1 gap-2 md:grid-cols-[140px_minmax(0,1fr)] md:items-center'>
								<p className='text-[11px] font-semibold text-gray-500 dark:text-gray-300'>Giro</p>
								<div className='w-full'>
									<Input
										name='customer_giro'
										value={values.customer_giro ?? ''}
										onChange={(e) => setFieldValue('customer_giro', e.target.value)}
									/>
								</div>
							</div>

							{/* Fila: Dir Envío */}
							<div className='grid grid-cols-1 gap-2 md:grid-cols-[140px_minmax(0,1fr)] md:items-center'>
								<p className='text-[11px] font-semibold text-gray-500 dark:text-gray-300'>Dirección de Envío</p>
								<div className='w-full'>
									<Input
										name='customer_shipping_address'
										value={values.customer_shipping_address ?? ''}
										onChange={(e) =>
											setFieldValue('customer_shipping_address', e.target.value)
										}
									/>
								</div>
							</div>

							{/* Fila: Dir Facturación */}
							<div className='grid grid-cols-1 gap-2 md:grid-cols-[140px_minmax(0,1fr)] md:items-center'>
								<p className='text-[11px] font-semibold text-gray-500 dark:text-gray-300'>Dirección de Fact.</p>
								<div className='w-full'>
									<Input
										name='customer_billing_address'
										value={values.customer_billing_address ?? ''}
										onChange={(e) =>
											setFieldValue('customer_billing_address', e.target.value)
										}
									/>
								</div>
							</div>

							{/* Fila: Contacto */}
							<div className='grid grid-cols-1 gap-2 md:grid-cols-[140px_minmax(0,1fr)] md:items-center'>
								<p className='text-[11px] font-semibold text-gray-500 dark:text-gray-300'>Contacto</p>
								<div className='w-full'>
									<Input
										name='customer_contact_name'
										value={values.customer_contact_name ?? ''}
										onChange={(e) => setFieldValue('customer_contact_name', e.target.value)}
									/>
								</div>
							</div>

							{/* Fila: Correo */}
							<div className='grid grid-cols-1 gap-2 md:grid-cols-[140px_minmax(0,1fr)] md:items-center'>
								<p className='text-[11px] font-semibold text-gray-500 dark:text-gray-300'>Correo</p>
								<div className='w-full'>
									<Input
										name='customer_email'
										value={values.customer_email ?? ''}
										onChange={(e) => setFieldValue('customer_email', e.target.value)}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Columna Derecha: Detalles de la Cotización */}
					<div className='space-y-4 rounded-2xl border border-zinc-100 bg-white/50 p-4 dark:border-white/10 dark:bg-zinc-900/50'>
						<h4 className='text-sm font-semibold text-gray-800 dark:text-gray-200'>Detalles de la Cotización</h4>
						<div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
							{/* Fecha Cotización */}
							<div>
								<p className='mb-1 text-[11px] font-semibold text-gray-500 dark:text-gray-300'>Fecha de Cotización *</p>
								<div className='w-full'>
									<Input
										name='quote_date'
										type='date'
										value={values.quote_date}
										onChange={(e) => setFieldValue('quote_date', e.target.value)}
										isValid={!errors.quote_date}
										isTouched={touched.quote_date}
										invalidFeedback={errors.quote_date}
									/>
								</div>
							</div>

							{/* Válida Hasta */}
							<div>
								<p className='mb-1 text-[11px] font-semibold text-gray-500 dark:text-gray-300'>Válida Hasta *</p>
								<div className='w-full'>
									<Input
										name='expiry_date'
										type='date'
										value={values.expiry_date ?? ''}
										onChange={(e) => setFieldValue('expiry_date', e.target.value)}
										isValid={!errors.expiry_date}
										isTouched={touched.expiry_date}
										invalidFeedback={errors.expiry_date}
									/>
								</div>
							</div>

							<div className='md:col-span-2'>
								<p className='mb-1 text-[11px] font-semibold text-gray-500 dark:text-gray-300'>N° Orden de Compra (OC)</p>
								<Input
									name='purchase_order'
									placeholder='OC-2024-001'
									value={values.purchase_order ?? ''}
									onChange={(e) => setFieldValue('purchase_order', e.target.value)}
									isValid={!errors.purchase_order}
									isTouched={touched.purchase_order}
									invalidFeedback={errors.purchase_order}
								/>
							</div>

							<div>
								<p className='mb-1 text-[11px] font-semibold text-gray-500 dark:text-gray-300'>Método de Pago *</p>
								<SelectReact
									name='payment_method'
									options={paymentMethodOptions}
									placeholder='Seleccionar método...'
									value={
										values.payment_method
											? (paymentMethodOptions.find(
													(opt) => opt.value === String(values.payment_method),
												) ?? null)
											: null
									}
									onChange={(option) => {
										const selectedOption = option as TSelectOption;
										if (selectedOption && !Array.isArray(selectedOption)) {
											setFieldValue('payment_method', selectedOption.value || null);
										}
									}}
									{...selectMenuProps}
									isValid={!errors.payment_method}
									isTouched={touched.payment_method}
									invalidFeedback={errors.payment_method}
								/>
							</div>

							<div>
								<p className='mb-1 text-[11px] font-semibold text-gray-500 dark:text-gray-300'>Términos de Pago</p>
								<SelectReact
									name='payment_terms'
									options={paymentTermsOptions}
									placeholder='Seleccionar términos...'
									value={paymentTermsOptions.find(
										(opt) => opt.value === String(values.payment_terms),
									)}
									onChange={(option) => {
										const selectedOption = option as TSelectOption;
										if (selectedOption && !Array.isArray(selectedOption)) {
											setFieldValue('payment_terms', Number(selectedOption.value) || 0);
										}
									}}
									{...selectMenuProps}
									isValid={!errors.payment_terms}
									isTouched={touched.payment_terms}
									invalidFeedback={errors.payment_terms}
								/>
							</div>

							<div>
								<p className='mb-1 text-[11px] font-semibold text-gray-500 dark:text-gray-300'>Tipo de Documento</p>
								<SelectReact
									name='document_type'
									options={[
										{ value: 'factura', label: 'Factura' },
										{ value: 'boleta', label: 'Boleta' },
									]}
									placeholder='Seleccionar documento...'
									value={
										values.document_type
											? ([
												{ value: 'factura', label: 'Factura' },
												{ value: 'boleta', label: 'Boleta' },
											].find(
												(opt) => opt.value === String(values.document_type),
											) ?? null)
											: null
									}
									onChange={(option) => {
										const selectedOption = option as TSelectOption;
										if (selectedOption && !Array.isArray(selectedOption)) {
											setFieldValue('document_type', selectedOption.value || '');
										}
									}}
									{...selectMenuProps}
								/>
							</div>

							<div>
								<p className='mb-1 text-[11px] font-semibold text-gray-500 dark:text-gray-300'>Estado de la Cotización</p>
								<SelectReact
									name='status'
									options={statusOptions}
									placeholder='Seleccionar estado...'
									value={statusOptions.find((opt) => opt.value === values.status)}
									onChange={(option) => {
										const selectedOption = option as TSelectOption;
										if (selectedOption && !Array.isArray(selectedOption)) {
											setFieldValue('status', selectedOption.value as QuoteStatus);
										}
									}}
									{...selectMenuProps}
								/>
							</div>
							<div className='md:col-span-2 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 p-4 text-xs text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300'>
								Al seleccionar un cliente, se completan automáticamente RUT, giro, direcciones, contacto y correo según la información disponible.
							</div>
						</div>
					</div>
				</div>
			</CardBody>

			<CreateCustomerModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				subsidiaryId={subsidiaryId}
				onCustomerCreated={onCustomerCreated}
			/>
		</Card>
	);
};

export default GeneralInfoCard;
