import React from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import SelectReact, { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import { FormikErrors, FormikTouched } from 'formik';
import { FormQuotationValues } from '../types';
import { QuoteStatus } from '@/interface';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';

interface PaymentInfoCardProps {
	values: FormQuotationValues;
	setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
	errors: FormikErrors<FormQuotationValues>;
	touched: FormikTouched<FormQuotationValues>;
	paymentMethodOptions: TSelectOptions;
	paymentTermsOptions: TSelectOptions;
	statusOptions: TSelectOptions;
}

const PaymentInfoCard: React.FC<PaymentInfoCardProps> = ({
	values,
	setFieldValue,
	errors,
	touched,
	paymentMethodOptions,
	paymentTermsOptions,
	statusOptions,
}) => {
	return (
		<Card
			rounded='rounded-2xl'
			className='border border-white/80 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-lg/10'>
			<CardHeader className='pb-2'>
				<CardHeaderChild className='w-full items-center justify-between'>
					<div>
						<CardTitle className='flex items-center gap-3 text-lg font-semibold dark:text-white text-gray-900'>
							<span className='flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-400/40 dark:bg-sky-400/10 dark:text-sky-200'>
								<Icon icon='DuoCreditCard' className='text-xl' />
							</span>
							<span>Información de Pago</span>
						</CardTitle>
						<p className='text-xs text-gray-500 dark:text-gray-300'>
							Selecciona condiciones comerciales y documento a emitir.
						</p>
					</div>
					<Badge className='rounded-full bg-sky-50 px-4 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-400/20 dark:text-sky-100'>
						Paso 2
					</Badge>
				</CardHeaderChild>
			</CardHeader>
			<CardBody className='space-y-6 pt-2'>
				<div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
					<div className='rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 shadow-inner dark:border-white/10 dark:bg-white/5 dark:shadow-none'>
						<p className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
							Método de Pago *
						</p>
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
							isValid={!errors.payment_method}
							isTouched={touched.payment_method}
							invalidFeedback={errors.payment_method}
						/>
					</div>

					<div className='rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 shadow-inner dark:border-white/10 dark:bg-white/5 dark:shadow-none'>
						<p className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
							Orden de Compra (OC)
						</p>
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

					<div className='rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 shadow-inner dark:border-white/10 dark:bg-white/5 dark:shadow-none'>
						<p className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
							Términos de Pago
						</p>
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
									setFieldValue(
										'payment_terms',
										Number(selectedOption.value) || 0,
									);
								}
							}}
							isValid={!errors.payment_terms}
							isTouched={touched.payment_terms}
							invalidFeedback={errors.payment_terms}
						/>
					</div>
				</div>

				<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
					<div className='rounded-2xl border border-zinc-100 bg-white/80 p-4 shadow-inner dark:border-white/10 dark:bg-white/5 dark:shadow-none'>
						<p className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
							Estado de la Cotización
						</p>
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
						/>
					</div>

					<div className='md:col-span-2 rounded-2xl border border-zinc-100 bg-white/80 p-4 shadow-inner dark:border-white/10 dark:bg-white/5 dark:shadow-none'>
						<p className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
							Observaciones
						</p>
						<Textarea
							name='notes'
							placeholder='Observaciones adicionales...'
							value={values.notes ?? ''}
							onChange={(e) => setFieldValue('notes', e.target.value)}
							rows={3}
							isValid={!errors.notes}
							isTouched={touched.notes}
							invalidFeedback={errors.notes}
						/>
					</div>

					<div className='rounded-2xl border border-zinc-100 bg-white/80 p-4 shadow-inner dark:border-white/10 dark:bg-white/5 dark:shadow-none'>
						<p className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
							Tipo de Documento
						</p>
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
						/>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default PaymentInfoCard;
