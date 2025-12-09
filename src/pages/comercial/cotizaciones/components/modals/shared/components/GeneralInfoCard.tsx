import React from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import SelectReact, { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';
import Input from '@/components/form/Input';
import { FormikErrors, FormikTouched } from 'formik';
import { FormQuotationValues } from '../types';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';

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
		<Card
			rounded='rounded-2xl'
			className='border border-white/80 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-lg/10'>
			<CardHeader className='pb-2'>
				<CardHeaderChild className='w-full items-center justify-between'>
					<div>
						<CardTitle className='flex items-center gap-3 text-lg font-semibold dark:text-white text-gray-900'>
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
				<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
					<div className='rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 shadow-inner dark:border-white/10 dark:bg-white/5 dark:shadow-none'>
						<p className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
							Cliente *
						</p>
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

					<div className='rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 shadow-inner dark:border-white/10 dark:bg-white/5 dark:shadow-none'>
						<p className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
							Fecha de Cotización *
						</p>
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

					<div className='rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 shadow-inner dark:border-white/10 dark:bg-white/5 dark:shadow-none'>
						<p className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
							Válida Hasta *
						</p>
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
