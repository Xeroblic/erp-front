import React from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import SelectReact, { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import { FormikErrors, FormikTouched } from 'formik';
import { FormQuotationValues } from '../types';
import { QuoteStatus } from '@/interface';

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
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle>Información de Pago</CardTitle>
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700'>
							Método de Pago *
						</label>
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

					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700'>
							Orden de Compra (OC)
						</label>
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
						<label className='mb-2 block text-sm font-medium text-gray-700'>
							Términos de Pago
						</label>
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

				<div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700'>
							Estado de la Cotización
						</label>
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

					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700'>
							Observaciones
						</label>
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

					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700'>
							Tipo de Documento
						</label>
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
