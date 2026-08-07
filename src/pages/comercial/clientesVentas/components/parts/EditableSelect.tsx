import React, { useId } from 'react';
import SelectReact, { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';
import Label from '@/components/form/Label';
import { FormikProps } from 'formik';

interface EditableSelectProps<FormValues extends Record<string, any>> {
	formik: FormikProps<FormValues>;
	name: keyof FormValues & string;
	label: string;
	options: TSelectOptions;
	isEditable: boolean;
	placeholder?: string;
}

const EditableSelect = <FormValues extends Record<string, any>>({
	formik,
	name,
	label,
	options,
	isEditable,
	placeholder,
}: EditableSelectProps<FormValues>) => {
	const value = (formik.values as Record<string, any>)[name];
	const touched = (formik.touched as Record<string, any>)[name];
	const error = (formik.errors as Record<string, any>)[name];
	const inputId = useId();
	const hasValue = typeof value === 'string' ? value.trim().length > 0 : Boolean(value);

	if (!isEditable) {
		const display =
			options.find((opt) => opt.value === String(value))?.label ||
			(hasValue ? String(value) : 'Sin información registrada.');
		return (
			<div className='border-t border-zinc-200 pt-3 dark:border-zinc-700'>
				<p className='text-sm text-zinc-500 dark:text-zinc-400'>{label}</p>
				<p id={inputId} className='mt-1 font-semibold text-zinc-800 dark:text-zinc-200'>
					{display}
				</p>
			</div>
		);
	}

	return (
		<div className='space-y-1'>
			<Label htmlFor={inputId}>{label}</Label>
			<SelectReact
				inputId={inputId}
				name={name}
				options={options}
				placeholder={placeholder}
				value={
					value != null
						? (options.find((opt) => opt.value === String(value)) ?? null)
						: null
				}
				onChange={(option) => {
					const selected = option as TSelectOption | null;
					if (selected) {
						formik.setFieldValue(name, selected.value);
					} else {
						formik.setFieldValue(name, null);
					}
				}}
				isValid={!error}
				isTouched={Boolean(touched)}
				invalidFeedback={touched ? error : undefined}
				isClearable
			/>
		</div>
	);
};

export default EditableSelect;
