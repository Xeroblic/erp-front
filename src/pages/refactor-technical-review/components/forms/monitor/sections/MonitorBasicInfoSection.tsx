import React, { useEffect, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { FormSectionProps } from '../../shared/types';
import { MonitorFormData } from '../../../validation/monitor.schema';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { useMarcas } from '@/pages/catalogos/marcas/components/hooks/useMarcas';
import { SelectionCard } from '../../../ui/SelectionCard';
import Textarea from '@/components/form/Textarea';
import { MONITOR_HINTS, MONITOR_PLACEHOLDERS } from '../../../constants/monitor/monitor.hints';
import { GENERAL_CONDITION_OPTIONS } from '../../../constants/monitor/monitor.options';
import { getMonitorLabel } from '../../../translations/monitor.labels';
import Icon from '@/components/icon/Icon';

const MonitorBasicInfoSection: React.FC<FormSectionProps<MonitorFormData>> = ({
	control,
	errors,
	readOnly,
	watch,
	setValue,
}) => {
	const currentCondition = watch('general_condition');
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
		<div className='space-y-6'>
			<p className='text-sm text-zinc-500'>
				Ingresa la información básica de identificación del Monitor.
			</p>

			<div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
				{/* Brand */}
				<div className='rounded-xl border border-blue-200 bg-blue-500/10 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-blue-500/20 dark:border-blue-800/50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20'>
					<label className='mb-3 flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-200'>
						<span className='flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300'>
							🏷️
						</span>
						{getMonitorLabel('brand')}
					</label>
					<Controller
						name='brand'
						control={control}
						render={({ field }) => (
							<SelectReact
								name={field.name}
								options={brandOptions}
								value={
									brandOptions.find((opt) => opt.value === field.value) || null
								}
								onChange={(option) => {
									field.onChange((option as TSelectOption)?.value);
								}}
								isLoading={loadingBrands}
								placeholder={MONITOR_PLACEHOLDERS.brand}
								isDisabled={readOnly}
								isValid={!errors.brand}
								invalidFeedback={errors.brand?.message}
							/>
						)}
					/>
					<p className='mt-1 text-xs text-zinc-500'>{MONITOR_HINTS.brand}</p>
				</div>

				{/* Model */}
				<div className='rounded-xl border border-fuchsia-200 bg-fuchsia-500/10 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-fuchsia-500/20 dark:border-fuchsia-800/50 dark:bg-fuchsia-900/10 dark:hover:bg-fuchsia-900/20'>
					<label className='mb-3 flex items-center gap-2 text-sm font-bold text-fuchsia-800 dark:text-fuchsia-200'>
						<span className='flex h-6 w-6 items-center justify-center rounded-md bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-800 dark:text-fuchsia-300'>
							⚏
						</span>
						{getMonitorLabel('model')}
					</label>
					<Controller
						name='model'
						control={control}
						render={({ field }) => (
							<Input
								{...field}
								value={field.value ?? ''}
								placeholder={MONITOR_PLACEHOLDERS.model}
								disabled={readOnly}
								className={errors.model ? 'border-red-500' : ''}
							/>
						)}
					/>
					{errors.model && (
						<p className='mt-1 text-xs text-red-500'>{errors.model.message}</p>
					)}
					<p className='mt-1 text-xs text-zinc-500'>{MONITOR_HINTS.model}</p>
				</div>

				{/* Line */}
				<div className='rounded-xl border border-violet-200 bg-violet-500/10 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-violet-500/20 dark:border-violet-800/50 dark:bg-violet-900/10 dark:hover:bg-violet-900/20'>
					<label className='mb-3 flex items-center gap-2 text-sm font-bold text-violet-800 dark:text-violet-200'>
						<span className='flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-violet-600 dark:bg-violet-800 dark:text-violet-300'>
							❖
						</span>
						{getMonitorLabel('line')}
					</label>
					<Controller
						name='line'
						control={control}
						render={({ field }) => (
							<Input
								{...field}
								value={field.value ?? ''}
								placeholder={MONITOR_PLACEHOLDERS.line}
								disabled={readOnly}
								className={errors.line ? 'border-red-500' : ''}
							/>
						)}
					/>
					{errors.line && (
						<p className='mt-1 text-xs text-red-500'>{errors.line.message}</p>
					)}
					<p className='mt-1 text-xs text-zinc-500'>{MONITOR_HINTS.line}</p>
				</div>
			</div>

			{/* General Condition */}
			<div className='rounded-xl border border-emerald-200 bg-emerald-500/10 p-6 shadow-sm transition-colors duration-200 hover:bg-emerald-500/20 dark:border-emerald-800/50 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20'>
				<label className='mb-3 flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200'>
					<Icon icon='HeroSparkles' className='h-5 w-5' />
					{getMonitorLabel('general_condition')}
				</label>
				<p className='mb-4 text-xs text-emerald-700/80 dark:text-emerald-300/80'>
					{MONITOR_HINTS.general_condition}
				</p>

				<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5'>
					{GENERAL_CONDITION_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label as string}
							value={opt.value as string}
							isSelected={currentCondition === opt.value}
							color='emerald'
							onClick={() => {
								if (readOnly) return;
								setValue('general_condition', opt.value as any, {
									shouldValidate: true,
								});
							}}
						/>
					))}
				</div>

				{errors.general_condition && (
					<p className='mt-3 text-xs font-semibold text-red-500'>
						{errors.general_condition.message}
					</p>
				)}
			</div>

			{/* Observations */}
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors duration-200 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700'>
				<label className='mb-3 flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300'>
					<Icon icon='HeroDocumentText' className='h-5 w-5' />
					{getMonitorLabel('observations')}
				</label>
				<p className='mb-4 text-xs text-zinc-500'>{MONITOR_HINTS.observations}</p>
				<Controller
					name='observations'
					control={control}
					render={({ field }) => (
						<Textarea
							{...field}
							value={field.value ?? ''}
							placeholder={MONITOR_PLACEHOLDERS.observations}
							disabled={readOnly}
							rows={4}
							className={`w-full ${errors.observations ? 'border-red-500' : ''}`}
						/>
					)}
				/>
				{errors.observations && (
					<p className='mt-2 text-xs font-semibold text-red-500'>
						{errors.observations.message}
					</p>
				)}
			</div>
		</div>
	);
};

export default MonitorBasicInfoSection;
