import React from 'react';
import { Controller } from 'react-hook-form';
import Input from '@/components/form/Input';
import type { FormSectionProps } from '../../shared/types';
import type { NotebookFormData } from '../../../validation/notebook.schema';
import { getNotebookLabel } from '../../../translations/notebook.labels';
import { NOTEBOOK_HINTS, NOTEBOOK_PLACEHOLDERS } from '../../../constants/notebook/notebook.hints';

const BasicInfoSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	control,
	errors,
	readOnly,
}) => {
	return (
		<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
			{/* Brand */}
			<div className='rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/10'>
				<label className='mb-3 block text-sm font-bold text-blue-800 dark:text-blue-200'>
					{getNotebookLabel('brand')} <span className='text-red-500'>*</span>
				</label>
				<Controller
					name='brand'
					control={control}
					render={({ field }) => (
						<Input
							{...field}
							value={field.value || ''}
							placeholder={NOTEBOOK_PLACEHOLDERS.brand}
							disabled={readOnly}
							className={errors.brand ? 'border-red-500' : ''}
						/>
					)}
				/>
				{errors.brand && (
					<p className='mt-1 text-xs text-red-500'>{errors.brand.message}</p>
				)}
				<p className='mt-1 text-xs text-zinc-500'>{NOTEBOOK_HINTS.brand}</p>
			</div>

			{/* Model */}
			<div className='rounded-xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-800 dark:bg-purple-900/10'>
				<label className='mb-3 block text-sm font-bold text-purple-800 dark:text-purple-200'>
					{getNotebookLabel('model')} <span className='text-red-500'>*</span>
				</label>
				<Controller
					name='model'
					control={control}
					render={({ field }) => (
						<Input
							{...field}
							value={field.value || ''}
							placeholder={NOTEBOOK_PLACEHOLDERS.model}
							disabled={readOnly}
							className={errors.model ? 'border-red-500' : ''}
						/>
					)}
				/>
				{errors.model && (
					<p className='mt-1 text-xs text-red-500'>{errors.model.message}</p>
				)}
				<p className='mt-1 text-xs text-zinc-500'>{NOTEBOOK_HINTS.model}</p>
			</div>
		</div>
	);
};

export default BasicInfoSection;
