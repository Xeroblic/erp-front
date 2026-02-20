import React from 'react';
import { Controller } from 'react-hook-form';
import { FormSectionProps } from '../../shared/types';
import { DockingFormData } from '../../../validation/docking.schema';
import Input from '@/components/form/Input';
import { SelectionCard } from '../../../ui/SelectionCard';
import { DOCKING_HINTS, DOCKING_PLACEHOLDERS } from '../../../constants/docking/docking.hints';
import { GENERAL_CONDITION_OPTIONS } from '../../../constants/docking/docking.options';
import { getDockingLabel } from '../../../translations/docking.labels';
import Icon from '@/components/icon/Icon';

const DockingBasicInfoSection: React.FC<FormSectionProps<DockingFormData>> = ({
	control,
	errors,
	readOnly,
	watch,
	setValue,
}) => {
	const currentCondition = watch('general_condition');

	return (
		<div className='space-y-8'>
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50'>
				<h3 className='mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
					<Icon icon='HeroIdentification' className='h-5 w-5' />
					Identidad del Equipo
				</h3>
				<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
					<div className='col-span-1'>
						<label className='mb-2 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							{getDockingLabel('brand')}
						</label>
						<Controller
							name='brand'
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									value={field.value ?? ''}
									placeholder={DOCKING_PLACEHOLDERS.brand}
									disabled={readOnly}
									className={errors.brand ? 'border-red-500' : ''}
								/>
							)}
						/>
						{errors.brand && (
							<p className='mt-1 text-xs text-red-500'>{errors.brand.message}</p>
						)}
					</div>

					<div className='col-span-1'>
						<label className='mb-2 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							{getDockingLabel('model')}
						</label>
						<Controller
							name='model'
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									value={field.value ?? ''}
									placeholder={DOCKING_PLACEHOLDERS.model}
									disabled={readOnly}
									className={errors.model ? 'border-red-500' : ''}
								/>
							)}
						/>
						{errors.model && (
							<p className='mt-1 text-xs text-red-500'>{errors.model.message}</p>
						)}
					</div>

					<div className='col-span-1'>
						<label className='mb-2 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							{getDockingLabel('line')}
						</label>
						<Controller
							name='line'
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									value={field.value ?? ''}
									placeholder={DOCKING_PLACEHOLDERS.line}
									disabled={readOnly}
									className={errors.line ? 'border-red-500' : ''}
								/>
							)}
						/>
						{errors.line && (
							<p className='mt-1 text-xs text-red-500'>{errors.line.message}</p>
						)}
					</div>
				</div>
			</div>

			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50'>
				<label className='mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
					<Icon icon='HeroSparkles' className='h-5 w-5' />
					{getDockingLabel('general_condition')}
				</label>
				<p className='mb-4 text-xs text-zinc-500'>{DOCKING_HINTS.general_condition}</p>

				<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5'>
					{GENERAL_CONDITION_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label as string}
							value={opt.value as string}
							isSelected={currentCondition === opt.value}
							onClick={() => {
								if (readOnly) return;
								setValue(
									'general_condition',
									opt.value as
										| 'like_new'
										| 'good_shape'
										| 'visible_wear'
										| 'needs_repair'
										| 'scrap',
									{ shouldValidate: true },
								);
							}}
						/>
					))}
				</div>

				{errors.general_condition && (
					<p className='mt-3 text-xs text-red-500'>{errors.general_condition.message}</p>
				)}
			</div>
		</div>
	);
};

export default DockingBasicInfoSection;
