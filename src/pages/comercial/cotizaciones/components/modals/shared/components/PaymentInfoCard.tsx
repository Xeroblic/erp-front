import React from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Textarea from '@/components/form/Textarea';
import { FormikErrors, FormikTouched } from 'formik';
import { FormQuotationValues } from '../types';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';

interface PaymentInfoCardProps {
	values: FormQuotationValues;
	setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
	errors: FormikErrors<FormQuotationValues>;
	touched: FormikTouched<FormQuotationValues>;
}

const PaymentInfoCard: React.FC<PaymentInfoCardProps> = ({
	values,
	setFieldValue,
	errors,
	touched,
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
							Agrega observaciones adicionales para la cotización.
						</p>
					</div>
					<Badge className='rounded-full bg-sky-50 px-4 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-400/20 dark:text-sky-100'>
						Paso 3
					</Badge>
				</CardHeaderChild>
			</CardHeader>
			<CardBody className='pt-2'>
				<div>
					<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
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
			</CardBody>
		</Card>
	);
};

export default PaymentInfoCard;
