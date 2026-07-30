import React, { type ReactNode } from 'react';
import { getIn, useFormikContext } from 'formik';
import Label from '@/components/form/Label';
import type { DeferredPaymentFormValues } from '../../types';

interface DeferredPaymentFieldState {
	error?: string;
	isTouched: boolean;
	isValid: boolean;
}

interface DeferredPaymentFieldProps {
	name: string;
	label?: ReactNode;
	className?: string;
	children: (state: DeferredPaymentFieldState) => ReactNode;
}

const DeferredPaymentField: React.FC<DeferredPaymentFieldProps> = ({
	name,
	label,
	className,
	children,
}) => {
	const formik = useFormikContext<DeferredPaymentFormValues>();
	const isTouched = Boolean(getIn(formik.touched, name));
	const rawError = getIn(formik.errors, name) as unknown;
	const error = isTouched && typeof rawError === 'string' ? rawError : undefined;

	return (
		<div className={className}>
			{label && <Label htmlFor={name}>{label}</Label>}
			{children({ error, isTouched, isValid: error === undefined })}
			{error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
		</div>
	);
};

export default DeferredPaymentField;
