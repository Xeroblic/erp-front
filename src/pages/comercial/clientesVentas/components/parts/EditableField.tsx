import React, { useId } from 'react';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import type { FormikProps } from 'formik';
import Label from '@/components/form/Label';

interface EditableFieldProps<FormValues extends Record<string, any>> {
	formik: FormikProps<FormValues>;
	name: keyof FormValues & string;
	label: string;
	isEditable: boolean;
	placeholder?: string;
	textarea?: boolean;
	onChangeValue?: (value: string) => void;
}

const EditableField = <FormValues extends Record<string, any>>({
	formik,
	name,
	label,
	isEditable,
	placeholder,
	textarea = false,
	onChangeValue,
}: EditableFieldProps<FormValues>) => {
	const value = (formik.values as Record<string, any>)[name] ?? '';
	const touched = (formik.touched as Record<string, any>)[name];
	const error = (formik.errors as Record<string, any>)[name];
	const inputId = useId();
	const hasValue = typeof value === 'string' ? value.trim().length > 0 : Boolean(value);

	if (!isEditable) {
		return (
			<div
				className={`border-t border-zinc-200 pt-3 dark:border-zinc-700 ${
					textarea ? 'min-h-24' : ''
				}`}>
				<p className='text-sm text-zinc-500 dark:text-zinc-400'>{label}</p>
				<p
					id={inputId}
					className={`mt-1 font-semibold text-zinc-800 dark:text-zinc-200 ${
						textarea ? 'whitespace-pre-wrap font-normal' : ''
					}`}>
					{hasValue ? String(value) : 'Sin información registrada.'}
				</p>
			</div>
		);
	}

	const commonProps = {
		name,
		placeholder,
		value: value ?? '',
		onBlur: formik.handleBlur,
		isTouched: Boolean(touched),
		isValid: !error,
		invalidFeedback: touched ? error : undefined,
	};

	const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (onChangeValue) {
			onChangeValue(event.target.value);
		} else {
			formik.handleChange(event);
		}
	};

	return (
		<div className='space-y-1'>
			<Label htmlFor={inputId}>{label}</Label>
			{textarea ? (
				<Textarea {...commonProps} rows={4} id={inputId} onChange={handleChange} />
			) : (
				<Input {...commonProps} id={inputId} onChange={handleChange} />
			)}
		</div>
	);
};

export default EditableField;
