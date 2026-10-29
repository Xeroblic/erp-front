import React from 'react';
import { FormikErrors, FormikTouched } from 'formik';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import SelectReact, { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';
import Input from '@/components/form/Input';
import CustomerSaleSelect, {
	type CustomerSaleOption,
} from '@/components/customers/CustomerSaleSelect';
import { useAppDispatch } from '@/store';
import { fetchCustomerDetailThunk } from '@/store/slices/customerSales/customerSalesSlice';
import type { ICustomerSale } from '@/interface/customerSales.interface';
import { QuoteStatus } from '@/interface';
import { FormQuotationValues } from '../types';
import {
	QUOTATION_CARD_CLASSNAME,
	QUOTATION_MUTED_TEXT_CLASSNAME,
	QUOTATION_SUBTITLE_CLASSNAME,
} from '../styles';
import QuotationField from './QuotationField';

const DOCUMENT_TYPE_OPTIONS: TSelectOptions = [
	{ value: 'factura', label: 'Factura' },
	{ value: 'boleta', label: 'Boleta' },
];

const SECTION_TITLE_CLASSNAME = 'text-sm font-semibold text-zinc-900 dark:text-white';

/** Campos de la cotización que se autocompletan con el detalle del cliente. */
const toCustomerAutofill = (customer: ICustomerSale) => ({
	customer_rut: customer.rut ?? customer.document_number ?? '',
	customer_giro: customer.giro ?? customer.trade_activity ?? '',
	customer_shipping_address: customer.shipping_address_1 ?? customer.address ?? '',
	customer_billing_address: customer.billing_address_1 ?? customer.address ?? '',
	customer_contact_name: customer.contact_name ?? customer.primary_contact?.name ?? customer.name,
	customer_email: customer.email ?? customer.primary_contact?.email ?? '',
});

const EMPTY_CUSTOMER_AUTOFILL = {
	customer_rut: '',
	customer_giro: '',
	customer_shipping_address: '',
	customer_billing_address: '',
	customer_contact_name: '',
	customer_email: '',
};

interface GeneralInfoCardProps {
	values: FormQuotationValues;
	setFieldValue: (field: string, value: unknown, shouldValidate?: boolean) => void;
	errors: FormikErrors<FormQuotationValues>;
	touched: FormikTouched<FormQuotationValues>;
	subsidiaryId: number | null;
	/** Mientras es `false` el modal está cerrado: no se consulta ni se autocompleta. */
	isActive: boolean;
	/** Cliente ya guardado de la cotización en edición, para que siga visible. */
	fallbackCustomerOption?: CustomerSaleOption | null;
	paymentMethodOptions: TSelectOptions;
	paymentTermsOptions: TSelectOptions;
	statusOptions: TSelectOptions;
}

const GeneralInfoCard: React.FC<GeneralInfoCardProps> = ({
	values,
	setFieldValue,
	errors,
	touched,
	subsidiaryId,
	isActive,
	fallbackCustomerOption = null,
	paymentMethodOptions,
	paymentTermsOptions,
	statusOptions,
}) => {
	const dispatch = useAppDispatch();
	const [isLoadingCustomerDetail, setIsLoadingCustomerDetail] = React.useState(false);
	/** Último cliente cuyo detalle ya se volcó al formulario, para no pisar ediciones. */
	const autofilledCustomerIdRef = React.useRef<number | null>(null);
	const detailRequestIdRef = React.useRef(0);
	const customerId = values.customer_id || null;

	const applyCustomerDetail = React.useCallback(
		(customer: ICustomerSale, force = false) => {
			if (!force && autofilledCustomerIdRef.current === customer.id) return;
			autofilledCustomerIdRef.current = customer.id;
			Object.entries(toCustomerAutofill(customer)).forEach(([field, value]) => {
				setFieldValue(field, value, false);
			});
		},
		[setFieldValue],
	);

	React.useEffect(() => {
		if (!isActive || customerId === null || subsidiaryId === null) return undefined;
		if (autofilledCustomerIdRef.current === customerId) return undefined;
		const requestId = detailRequestIdRef.current + 1;
		detailRequestIdRef.current = requestId;
		setIsLoadingCustomerDetail(true);
		const request = dispatch(
			fetchCustomerDetailThunk({ subsidiary: subsidiaryId, id: customerId }),
		);
		request
			.unwrap()
			.then((customer) => {
				if (requestId === detailRequestIdRef.current) applyCustomerDetail(customer);
			})
			.catch(() => undefined)
			.finally(() => {
				if (requestId === detailRequestIdRef.current) setIsLoadingCustomerDetail(false);
			});
		return () => request.abort();
	}, [applyCustomerDetail, customerId, dispatch, isActive, subsidiaryId]);

	React.useEffect(() => {
		if (customerId !== null || autofilledCustomerIdRef.current === null) return;
		detailRequestIdRef.current += 1;
		autofilledCustomerIdRef.current = null;
		setIsLoadingCustomerDetail(false);
		Object.entries(EMPTY_CUSTOMER_AUTOFILL).forEach(([field, value]) => {
			setFieldValue(field, value, false);
		});
	}, [customerId, setFieldValue]);

	return (
		<Card className={QUOTATION_CARD_CLASSNAME}>
			<CardHeader className='pb-2'>
				<div>
					<CardTitle className='text-lg'>Información general</CardTitle>
					<p className={QUOTATION_SUBTITLE_CLASSNAME}>
						Define los datos del cliente y la vigencia de la cotización.
					</p>
				</div>
			</CardHeader>
			<CardBody className='grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1fr]'>
				<section>
					<div className='mb-3'>
						<h3 className={SECTION_TITLE_CLASSNAME}>Datos del cliente</h3>
						<p className={`text-xs ${QUOTATION_MUTED_TEXT_CLASSNAME}`}>
							{isLoadingCustomerDetail
								? 'Cargando el detalle del cliente…'
								: 'Se completan al elegir un cliente y quedan en esta cotización. Para cambiar su ficha, usá el botón de editar.'}
						</p>
					</div>
					<div className='grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2'>
						<CustomerSaleSelect
							name='customer_id'
							inputId='customer_id'
							subsidiaryId={subsidiaryId}
							isActive={isActive}
							value={customerId}
							fallbackOption={fallbackCustomerOption}
							releasesOnSubsidiaryChange
							isClearable
							isValid={!errors.customer_id}
							isTouched={touched.customer_id}
							invalidFeedback={errors.customer_id}
							onChange={(customer) => setFieldValue('customer_id', customer?.id ?? 0)}
							onCustomerCreated={(customer) => {
								setFieldValue('customer_id', customer.id);
								applyCustomerDetail(customer, true);
							}}
							onCustomerUpdated={(customer) => applyCustomerDetail(customer, true)}>
							{({ select, createButton, editButton }) => (
								<QuotationField
									name='customer_id'
									label='Cliente'
									labelAction={
										<>
											{editButton}
											{createButton}
										</>
									}
									className='md:col-span-2'>
									{() => select}
								</QuotationField>
							)}
						</CustomerSaleSelect>

						<QuotationField name='customer_rut' label='RUT'>
							{({ error, isTouched, isValid }) => (
								<Input
									id='customer_rut'
									name='customer_rut'
									placeholder='76.123.456-7'
									value={values.customer_rut ?? ''}
									onChange={(e) => setFieldValue('customer_rut', e.target.value)}
									isValid={isValid}
									isTouched={isTouched}
									invalidFeedback={error}
								/>
							)}
						</QuotationField>

						<QuotationField name='customer_giro' label='Giro'>
							{() => (
								<Input
									id='customer_giro'
									name='customer_giro'
									placeholder='Actividad comercial'
									value={values.customer_giro ?? ''}
									onChange={(e) => setFieldValue('customer_giro', e.target.value)}
								/>
							)}
						</QuotationField>

						<QuotationField name='customer_contact_name' label='Contacto'>
							{() => (
								<Input
									id='customer_contact_name'
									name='customer_contact_name'
									placeholder='Nombre de contacto'
									value={values.customer_contact_name ?? ''}
									onChange={(e) =>
										setFieldValue('customer_contact_name', e.target.value)
									}
								/>
							)}
						</QuotationField>

						<QuotationField name='customer_email' label='Correo'>
							{() => (
								<Input
									id='customer_email'
									name='customer_email'
									type='email'
									placeholder='contacto@empresa.cl'
									value={values.customer_email ?? ''}
									onChange={(e) =>
										setFieldValue('customer_email', e.target.value)
									}
								/>
							)}
						</QuotationField>

						<QuotationField name='customer_shipping_address' label='Dirección de envío'>
							{() => (
								<Input
									id='customer_shipping_address'
									name='customer_shipping_address'
									placeholder='Calle, número, comuna'
									value={values.customer_shipping_address ?? ''}
									onChange={(e) =>
										setFieldValue('customer_shipping_address', e.target.value)
									}
								/>
							)}
						</QuotationField>

						<QuotationField
							name='customer_billing_address'
							label='Dirección de facturación'>
							{() => (
								<Input
									id='customer_billing_address'
									name='customer_billing_address'
									placeholder='Calle, número, comuna'
									value={values.customer_billing_address ?? ''}
									onChange={(e) =>
										setFieldValue('customer_billing_address', e.target.value)
									}
								/>
							)}
						</QuotationField>
					</div>
				</section>

				<section className='border-t border-zinc-200 pt-6 dark:border-zinc-700 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0'>
					<div className='mb-3'>
						<h3 className={SECTION_TITLE_CLASSNAME}>Datos de la cotización</h3>
						<p className={`text-xs ${QUOTATION_MUTED_TEXT_CLASSNAME}`}>
							Vigencia, documento y condiciones de pago.
						</p>
					</div>
					<div className='grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2'>
						<QuotationField name='quote_date' label='Fecha de cotización'>
							{({ error, isTouched, isValid }) => (
								<Input
									id='quote_date'
									name='quote_date'
									type='date'
									value={values.quote_date}
									onChange={(e) => setFieldValue('quote_date', e.target.value)}
									isValid={isValid}
									isTouched={isTouched}
									invalidFeedback={error}
								/>
							)}
						</QuotationField>

						<QuotationField name='expiry_date' label='Válida hasta'>
							{({ error, isTouched, isValid }) => (
								<Input
									id='expiry_date'
									name='expiry_date'
									type='date'
									value={values.expiry_date ?? ''}
									onChange={(e) => setFieldValue('expiry_date', e.target.value)}
									isValid={isValid}
									isTouched={isTouched}
									invalidFeedback={error}
								/>
							)}
						</QuotationField>

						<QuotationField
							name='purchase_order'
							label='N° orden de compra'
							className='md:col-span-2'>
							{({ error, isTouched, isValid }) => (
								<Input
									id='purchase_order'
									name='purchase_order'
									placeholder='OC-2024-001'
									value={values.purchase_order ?? ''}
									onChange={(e) =>
										setFieldValue('purchase_order', e.target.value)
									}
									isValid={isValid}
									isTouched={isTouched}
									invalidFeedback={error}
								/>
							)}
						</QuotationField>

						<QuotationField name='payment_method' label='Método de pago'>
							{({ error, isTouched, isValid }) => (
								<SelectReact
									name='payment_method'
									inputId='payment_method'
									options={paymentMethodOptions}
									placeholder='Seleccionar método...'
									value={
										values.payment_method
											? (paymentMethodOptions.find(
													(opt) =>
														opt.value === String(values.payment_method),
												) ?? null)
											: null
									}
									onChange={(option) => {
										const selectedOption = option as TSelectOption;
										if (selectedOption && !Array.isArray(selectedOption)) {
											setFieldValue(
												'payment_method',
												selectedOption.value || null,
											);
										}
									}}
									isValid={isValid}
									isTouched={isTouched}
									invalidFeedback={error}
								/>
							)}
						</QuotationField>

						<QuotationField name='payment_terms' label='Términos de pago'>
							{({ error, isTouched, isValid }) => (
								<SelectReact
									name='payment_terms'
									inputId='payment_terms'
									options={paymentTermsOptions}
									placeholder='Seleccionar términos...'
									value={paymentTermsOptions.find(
										(opt) => opt.value === String(values.payment_terms),
									)}
									onChange={(option) => {
										const selectedOption = option as TSelectOption;
										if (selectedOption && !Array.isArray(selectedOption)) {
											setFieldValue(
												'payment_terms',
												Number(selectedOption.value) || 0,
											);
										}
									}}
									isValid={isValid}
									isTouched={isTouched}
									invalidFeedback={error}
								/>
							)}
						</QuotationField>

						<QuotationField name='document_type' label='Tipo de documento'>
							{({ error, isTouched, isValid }) => (
								<SelectReact
									name='document_type'
									inputId='document_type'
									options={DOCUMENT_TYPE_OPTIONS}
									placeholder='Seleccionar documento...'
									value={
										values.document_type
											? (DOCUMENT_TYPE_OPTIONS.find(
													(opt) =>
														opt.value === String(values.document_type),
												) ?? null)
											: null
									}
									onChange={(option) => {
										const selectedOption = option as TSelectOption;
										if (selectedOption && !Array.isArray(selectedOption)) {
											setFieldValue(
												'document_type',
												selectedOption.value || '',
											);
										}
									}}
									isValid={isValid}
									isTouched={isTouched}
									invalidFeedback={error}
								/>
							)}
						</QuotationField>

						<QuotationField name='status' label='Estado'>
							{({ error, isTouched, isValid }) => (
								<SelectReact
									name='status'
									inputId='status'
									options={statusOptions}
									placeholder='Seleccionar estado...'
									value={statusOptions.find((opt) => opt.value === values.status)}
									onChange={(option) => {
										const selectedOption = option as TSelectOption;
										if (selectedOption && !Array.isArray(selectedOption)) {
											setFieldValue(
												'status',
												selectedOption.value as QuoteStatus,
											);
										}
									}}
									isValid={isValid}
									isTouched={isTouched}
									invalidFeedback={error}
								/>
							)}
						</QuotationField>
					</div>
				</section>
			</CardBody>
		</Card>
	);
};

export default GeneralInfoCard;
