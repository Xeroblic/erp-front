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
	labelClassName?: string;
	labelAction?: ReactNode;
	/**
	 * Reserva la altura del rótulo en campos sin etiqueta propia, para que el control
	 * quede alineado con los inputs vecinos sin replicar esa medida fuera de aquí.
	 */
	reservesLabelSpace?: boolean;
	className?: string;
	hiddenErrorMessage?: string;
	children: (state: DeferredPaymentFieldState) => ReactNode;
}

const LABEL_ROW_CLASSNAME = 'mb-2 min-h-[28px]';

const DeferredPaymentField: React.FC<DeferredPaymentFieldProps> = ({
	name,
	label,
	labelClassName,
	labelAction,
	reservesLabelSpace,
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
				<div className={`${LABEL_ROW_CLASSNAME} flex items-center justify-between gap-2`}>
					{label ? (
						<Label htmlFor={name} className={`mb-0 w-auto ${labelClassName ?? ''}`}>
							{label}
						</Label>
					) : (
						<div />
					)}
					{labelAction && <div className='flex items-center gap-1'>{labelAction}</div>}
				</div>
			)}
			{!label && !labelAction && reservesLabelSpace && (
				<div aria-hidden className={`${LABEL_ROW_CLASSNAME} hidden md:block`} />
			)}
			{children({ error, isTouched, isValid: error === undefined })}
			{error && error !== hiddenErrorMessage && (
				<p className='mt-1 text-sm text-red-600'>{error}</p>
			)}
		</div>
	);
};

export default DeferredPaymentField;
