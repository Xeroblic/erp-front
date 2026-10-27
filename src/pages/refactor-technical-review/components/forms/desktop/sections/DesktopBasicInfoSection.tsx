import React, { useMemo } from 'react';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Validation from '@/components/form/Validation';
import Icon from '@/components/icon/Icon';
import { useMarcas } from '@/pages/catalogos/marcas/components/hooks/useMarcas';
import type { FormSectionProps } from '../../shared/types';
import type { DesktopFormData } from '../../../validation/desktop.schema';
import { getDesktopLabel } from '../../../translations/desktop.labels';
import { DESKTOP_HINTS, DESKTOP_PLACEHOLDERS } from '../../../constants/desktop/desktop.hints';
// Hook for brands

const DesktopBasicInfoSection: React.FC<FormSectionProps<DesktopFormData>> = ({
	values,
	setFieldValue,
	onFieldBlur,
	errors,
	readOnly,
}) => {
	const { brands, loading: loadingBrands } = useMarcas({ search: '', is_active: true });

	const brandOptions: TSelectOption[] = useMemo(() => {
		return brands
			.filter((b) => b.is_active)
			.map((b) => ({
				value: b.name,
				label: b.name,
			}));
	}, [brands]);

	return (
		<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
			{/* Brand */}
			<div className='rounded-xl border border-blue-200 bg-blue-50 p-4 transition-colors hover:bg-blue-100/50 dark:border-blue-900/30 dark:bg-blue-900/10'>
				<label className='mb-2 flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-200'>
					<Icon icon='HeroTag' className='h-4 w-4' />
					{getDesktopLabel('brand')} <span className='text-red-500'>*</span>
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
							setFieldValue('brand', (option as TSelectOption)?.value);
						}}
						isLoading={loadingBrands}
						placeholder={DESKTOP_PLACEHOLDERS.brand}
						onBlur={() => onFieldBlur('brand')}
						isDisabled={readOnly}
					/>
				</Validation>
				<p className='mt-1 text-xs text-zinc-500'>{DESKTOP_HINTS.brand}</p>
			</div>

			{/* Model */}
			<div className='rounded-xl border border-purple-200 bg-purple-50 p-4 transition-colors hover:bg-purple-100/50 dark:border-purple-900/30 dark:bg-purple-900/10'>
				<label className='mb-2 flex items-center gap-2 text-sm font-bold text-purple-800 dark:text-purple-200'>
					<Icon icon='HeroCpuChip' className='h-4 w-4' />
					{getDesktopLabel('model')} <span className='text-red-500'>*</span>
				</label>
				<Input
					name='model'
					onChange={(event) => setFieldValue('model', event.target.value)}
					onBlur={() => onFieldBlur('model')}
					value={values.model || ''}
					placeholder={DESKTOP_PLACEHOLDERS.model}
					disabled={readOnly}
					className={errors.model ? 'border-red-500' : ''}
				/>
				{errors.model && <p className='mt-1 text-xs text-red-500'>{errors.model}</p>}
				<p className='mt-1 text-xs text-zinc-500'>{DESKTOP_HINTS.model}</p>
			</div>

			{/* Line (Product Line) - New for Desktop */}
			<div className='rounded-xl border border-indigo-200 bg-indigo-50 p-4 transition-colors hover:bg-indigo-100/50 dark:border-indigo-900/30 dark:bg-indigo-900/10'>
				<label className='mb-2 flex items-center gap-2 text-sm font-bold text-indigo-800 dark:text-indigo-200'>
					<Icon icon='HeroQueueList' className='h-4 w-4' />
					{getDesktopLabel('line')}
				</label>
				<Input
					name='line'
					onChange={(event) => setFieldValue('line', event.target.value)}
					onBlur={() => onFieldBlur('line')}
					value={values.line || ''}
					placeholder={DESKTOP_PLACEHOLDERS.line}
					disabled={readOnly}
				/>
				<p className='mt-1 text-xs text-zinc-500'>{DESKTOP_HINTS.line}</p>
			</div>
		</div>
	);
};

export default DesktopBasicInfoSection;
