import React, { useEffect, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import type { FormSectionProps } from '../../shared/types';
import type { NotebookFormData } from '../../../validation/notebook.schema';
import { getNotebookLabel } from '../../../translations/notebook.labels';
import { NOTEBOOK_HINTS, NOTEBOOK_PLACEHOLDERS } from '../../../constants/notebook/notebook.hints';
import { useMarcas } from '@/pages/catalogos/marcas/components/hooks/useMarcas';

const BasicInfoSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	control,
	errors,
	readOnly,
}) => {
	const { brands, loading: loadingBrands } = useMarcas({ search: '', is_active: true });

	const brandOptions: TSelectOption[] = useMemo(() => {
		return brands
			.filter((b) => b.is_active)
			.map((b) => ({
				value: b.name, // Guardamos el nombre como string según el schema
				label: b.name,
			}));
	}, [brands]);

	return (
		<div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
			{/* Brand */}
			<div className='rounded-xl border border-blue-200 bg-blue-500/20 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-blue-500/30 dark:border-blue-800 dark:bg-blue-900/10 dark:hover:bg-blue-900/30'>
				<label className='mb-3 flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-200'>
					<Icon icon='HeroTag' className='h-4 w-4' />
					{getNotebookLabel('brand')} <span className='text-red-500'>*</span>
				</label>
				<Controller
					name='brand'
					control={control}
					render={({ field }) => (
						<SelectReact
							name={field.name}
							options={brandOptions}
							value={brandOptions.find((opt) => opt.value === field.value)}
							onChange={(option) => {
								field.onChange((option as TSelectOption)?.value);
							}}
							isLoading={loadingBrands}
							placeholder={NOTEBOOK_PLACEHOLDERS.brand}
							isDisabled={readOnly}
							isValid={!errors.brand}
							invalidFeedback={errors.brand?.message}
						/>
					)}
				/>
				<p className='mt-1 text-xs text-zinc-500'>{NOTEBOOK_HINTS.brand}</p>
			</div>

			{/* Model */}
			<div className='rounded-xl border border-purple-200 bg-purple-500/20 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-purple-500/30 dark:border-purple-800 dark:bg-purple-900/10 dark:hover:bg-purple-900/30'>
				<label className='mb-3 flex items-center gap-2 text-sm font-bold text-purple-800 dark:text-purple-200'>
					<Icon icon='HeroCpuChip' className='h-4 w-4' />
					{getNotebookLabel('model')} <span className='text-red-500'>*</span>
				</label>
				<Controller
					name='model'
					control={control}
					render={({ field }) => (
						<Input
							{...field}
							name='model'
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

			{/* Line */}
			<div className='rounded-xl border border-teal-200 bg-teal-500/20 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-teal-500/30 dark:border-teal-800 dark:bg-teal-900/10 dark:hover:bg-teal-900/30'>
				<label className='mb-3 flex items-center gap-2 text-sm font-bold text-teal-800 dark:text-teal-200'>
					<Icon icon='HeroListBullet' className='h-4 w-4' />
					{getNotebookLabel('line')} <span className='text-red-500'>*</span>
				</label>
				<Controller
					name='line'
					control={control}
					render={({ field }) => (
						<Input
							{...field}
							name='line'
							value={field.value || ''}
							placeholder={NOTEBOOK_PLACEHOLDERS.line}
							disabled={readOnly}
							className={errors.line ? 'border-red-500' : ''}
						/>
					)}
				/>
				{errors.line && (
					<p className='mt-1 text-xs text-red-500'>{errors.line.message}</p>
				)}
				<p className='mt-1 text-xs text-zinc-500'>{NOTEBOOK_HINTS.line}</p>
			</div>
		</div>
	);
};

export default BasicInfoSection;
