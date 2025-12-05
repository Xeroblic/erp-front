import React from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import SelectReact, { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';
import Input from '@/components/form/Input';
import { FormikErrors, FormikTouched } from 'formik';
import { FormQuotationValues } from '../types';

interface GeneralInfoCardProps {
	values: FormQuotationValues;
	setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
	errors: FormikErrors<FormQuotationValues>;
	touched: FormikTouched<FormQuotationValues>;
	customerOptions: TSelectOptions;
}

const GeneralInfoCard: React.FC<GeneralInfoCardProps> = ({
	values,
	setFieldValue,
	errors,
	touched,
	customerOptions,
}) => {
	return (
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle>Información General</CardTitle>
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700'>
							Cliente *
						</label>
						<SelectReact
							name='customer_id'
							options={customerOptions}
							placeholder='Seleccionar cliente...'
							value={customerOptions.find(
								(opt) => opt.value === String(values.customer_id),
							)}
							onChange={(option) => {
								const selectedOption = option as TSelectOption;
								if (selectedOption && !Array.isArray(selectedOption)) {
									setFieldValue('customer_id', Number(selectedOption.value) || 0);
								}
							}}
							isValid={!errors.customer_id}
							isTouched={touched.customer_id}
							invalidFeedback={errors.customer_id}
						/>
					</div>

					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700'>
							Fecha de Cotización *
						</label>
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

					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700'>
							Válida Hasta *
						</label>
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
			</CardBody>
		</Card>
	);
};

export default GeneralInfoCard;
