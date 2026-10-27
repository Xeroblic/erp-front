import React, { useMemo } from 'react';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Validation from '@/components/form/Validation';
import Icon from '@/components/icon/Icon';
import { useMarcas } from '@/pages/catalogos/marcas/components/hooks/useMarcas';
import type { FormSectionProps } from '../../shared/types';
import type { NotebookFormData } from '../../../validation/notebook.schema';
import { getNotebookLabel } from '../../../translations/notebook.labels';
import { NOTEBOOK_HINTS, NOTEBOOK_PLACEHOLDERS } from '../../../constants/notebook/notebook.hints';

const BasicInfoSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	values,
	errors,
	readOnly,
	setFieldValue,
	onFieldBlur,
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
				<Validation
					isValid={!errors.brand}
					isTouched={Boolean(errors.brand)}
					invalidFeedback={errors.brand}>
					<SelectReact
						name='brand'
						options={brandOptions}
						value={brandOptions.find((opt) => opt.value === values.brand)}
						onChange={(option) => {
							setFieldValue(
								'brand',
								(option as TSelectOption | null)?.value as string,
							);
						}}
						isLoading={loadingBrands}
						placeholder={NOTEBOOK_PLACEHOLDERS.brand}
						onBlur={() => onFieldBlur('brand')}
						isDisabled={readOnly}
					/>
				</Validation>
				<p className='mt-1 text-xs text-zinc-500'>{NOTEBOOK_HINTS.brand}</p>
			</div>

			{/* Model */}
			<div className='rounded-xl border border-purple-200 bg-purple-500/20 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-purple-500/30 dark:border-purple-800 dark:bg-purple-900/10 dark:hover:bg-purple-900/30'>
				<label className='mb-3 flex items-center gap-2 text-sm font-bold text-purple-800 dark:text-purple-200'>
					<Icon icon='HeroCpuChip' className='h-4 w-4' />
					{getNotebookLabel('model')} <span className='text-red-500'>*</span>
				</label>
				<Input
					name='model'
					value={values.model || ''}
					onChange={(event) => setFieldValue('model', event.target.value)}
					onBlur={() => onFieldBlur('model')}
					placeholder={NOTEBOOK_PLACEHOLDERS.model}
					disabled={readOnly}
					className={errors.model ? 'border-red-500' : ''}
				/>
				{errors.model && <p className='mt-1 text-xs text-red-500'>{errors.model}</p>}
				<p className='mt-1 text-xs text-zinc-500'>{NOTEBOOK_HINTS.model}</p>
			</div>

			{/* Line */}
			<div className='rounded-xl border border-teal-200 bg-teal-500/20 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-teal-500/30 dark:border-teal-800 dark:bg-teal-900/10 dark:hover:bg-teal-900/30'>
				<label className='mb-3 flex items-center gap-2 text-sm font-bold text-teal-800 dark:text-teal-200'>
					<Icon icon='HeroListBullet' className='h-4 w-4' />
					{getNotebookLabel('line')} <span className='text-red-500'>*</span>
				</label>
				<Input
					name='line'
					value={values.line || ''}
					onChange={(event) => setFieldValue('line', event.target.value)}
					onBlur={() => onFieldBlur('line')}
					placeholder={NOTEBOOK_PLACEHOLDERS.line}
					disabled={readOnly}
					className={errors.line ? 'border-red-500' : ''}
				/>
				{errors.line && <p className='mt-1 text-xs text-red-500'>{errors.line}</p>}
				<p className='mt-1 text-xs text-zinc-500'>{NOTEBOOK_HINTS.line}</p>
			</div>
		</div>
	);
};

export default BasicInfoSection;
