import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Textarea from '@/components/form/Textarea';
import { FormQuotationValues } from '../types';
import { QUOTATION_CARD_CLASSNAME, QUOTATION_SUBTITLE_CLASSNAME } from '../styles';
import QuotationField from './QuotationField';

interface PaymentInfoCardProps {
	values: FormQuotationValues;
	setFieldValue: (field: string, value: unknown, shouldValidate?: boolean) => void;
}

const PaymentInfoCard: React.FC<PaymentInfoCardProps> = ({ values, setFieldValue }) => (
	<Card className={QUOTATION_CARD_CLASSNAME}>
		<CardHeader className='pb-2'>
			<div>
				<CardTitle className='text-lg'>Observaciones</CardTitle>
				<p className={QUOTATION_SUBTITLE_CLASSNAME}>
					Notas adicionales que acompañan a la cotización.
				</p>
			</div>
		</CardHeader>
		<CardBody>
			<QuotationField name='notes' label='Notas'>
				{({ error, isTouched, isValid }) => (
					<Textarea
						id='notes'
						name='notes'
						placeholder='Observaciones adicionales...'
						value={values.notes ?? ''}
						onChange={(e) => setFieldValue('notes', e.target.value)}
						rows={4}
						isValid={isValid}
						isTouched={isTouched}
						invalidFeedback={error}
					/>
				)}
			</QuotationField>
		</CardBody>
	</Card>
);

export default PaymentInfoCard;
