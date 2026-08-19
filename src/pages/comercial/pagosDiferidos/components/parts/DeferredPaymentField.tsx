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
	labelAction?: ReactNode;
	className?: string;
	hiddenErrorMessage?: string;
	children: (state: DeferredPaymentFieldState) => ReactNode;
}

const DeferredPaymentField: React.FC<DeferredPaymentFieldProps> = ({
	name,
	label,
	labelAction,
	className,
	hiddenErrorMessage,
	children,
}) => {
	const formik = useFormikContext<DeferredPaymentFormValues>();
	const isTouched = Boolean(getIn(formik.touched, name));
	const rawError = getIn(formik.errors, name) as unknown;
	const error = isTouched && typeof rawError === 'string' ? rawError : undefined;

	return (
		<div className={className}>
			{(label || labelAction) && (
				<div className='mb-2 flex min-h-[28px] items-center justify-between gap-2'>
					{label ? (
						<Label htmlFor={name} className='mb-0 w-auto'>
							{label}
						</Label>
					) : (
						<div />
					)}
					{labelAction && <div className='flex items-center gap-1'>{labelAction}</div>}
				</div>
			)}
			{children({ error, isTouched, isValid: error === undefined })}
			{error && error !== hiddenErrorMessage && (
				<p className='mt-1 text-sm text-red-600'>{error}</p>
			)}
		</div>
	);
};

export default DeferredPaymentField;
