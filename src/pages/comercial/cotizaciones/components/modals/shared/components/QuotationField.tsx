import React, { type ReactNode } from 'react';
import { getIn, useFormikContext } from 'formik';
import Label from '@/components/form/Label';
import type { FormQuotationValues } from '../types';

interface QuotationFieldState {
	error?: string;
	isTouched: boolean;
	isValid: boolean;
}

interface QuotationFieldProps {
	/** Ruta del campo en Formik; también es el `id` que el rótulo apunta. */
	name: string;
	label?: ReactNode;
	/** Controles que acompañan al rótulo (crear/editar cliente, por ejemplo). */
	labelAction?: ReactNode;
	className?: string;
	children: (state: QuotationFieldState) => ReactNode;
}

const LABEL_ROW_CLASSNAME = 'mb-2 min-h-[28px]';

/**
 * Rótulo, control y error de un campo de la cotización, con la misma disposición que
 * usa Pagos Diferidos para que ambos formularios se lean igual.
 */
const QuotationField: React.FC<QuotationFieldProps> = ({
	name,
	label,
	labelAction,
	className,
	children,
}) => {
	const formik = useFormikContext<FormQuotationValues>();
	const isTouched = Boolean(getIn(formik.touched, name));
	const rawError = getIn(formik.errors, name) as unknown;
	const error = isTouched && typeof rawError === 'string' ? rawError : undefined;

	return (
		<div className={className}>
			{(label || labelAction) && (
				<div className={`${LABEL_ROW_CLASSNAME} flex items-center justify-between gap-2`}>
					{label ? (
						<Label
							htmlFor={name}
							className='mb-0 w-auto font-medium text-zinc-700 dark:text-zinc-300'>
							{label}
						</Label>
					) : (
						<div />
					)}
					{labelAction && <div className='flex items-center gap-1'>{labelAction}</div>}
				</div>
			)}
			{children({ error, isTouched, isValid: error === undefined })}
			{error && <p className='mt-1 text-sm text-red-600 dark:text-red-400'>{error}</p>}
		</div>
	);
};

export default QuotationField;
