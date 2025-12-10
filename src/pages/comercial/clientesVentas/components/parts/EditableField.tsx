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

	if (!isEditable) {
		return (
			<div className='space-y-1'>
				<Label htmlFor={inputId}>{label}</Label>
				<p id={inputId} className='text-base text-zinc-800 dark:text-zinc-200'>
					{value ? String(value) : '—'}
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

	const handleChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
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
				<Textarea
					{...commonProps}
					rows={4}
					id={inputId}
					onChange={handleChange}
				/>
			) : (
				<Input {...commonProps} id={inputId} onChange={handleChange} />
			)}
		</div>
	);
};

export default EditableField;
