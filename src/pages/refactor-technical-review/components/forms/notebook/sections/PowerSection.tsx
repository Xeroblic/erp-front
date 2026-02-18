import React from 'react';
import { Controller } from 'react-hook-form';
import Input from '@/components/form/Input';
import type { FormSectionProps } from '../../shared/types';
import type { NotebookFormData } from '../../../validation/notebook.schema';
import { getNotebookLabel } from '../../../translations/notebook.labels';
import {
	NOTEBOOK_HINTS,
	NOTEBOOK_PLACEHOLDERS,
	NOTEBOOK_WARNINGS,
} from '../../../constants/notebook/notebook.hints';
import { SelectionCard } from '@/pages/technical-reviews/shared/components/SelectionCard';
import { YesNoSelector } from '@/pages/technical-reviews/shared/components/YesNoSelector';
import {
	BATTERY_STATUS_OPTIONS,
	CHARGER_STATUS_OPTIONS,
} from '../../../constants/notebook/notebook.options';
import Icon from '@/components/icon/Icon';

const PowerSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	control,
	errors,
	readOnly,
	watch,
	setValue,
}) => {
	const batteryStatus = watch('battery_status');
	const includesCharger = watch('includes_charger');

	return (
		<div className='space-y-6'>
			{/* Battery Section */}
			<div className='rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-900/10'>
				<label className='mb-3 block text-sm font-bold text-amber-800 dark:text-amber-200'>
					Batería
				</label>

				{/* Battery Status */}
				<label className='mb-2 block text-xs font-semibold text-zinc-500'>
					{getNotebookLabel('battery_status')}
				</label>
				<div className='mb-4 grid grid-cols-3 gap-2 md:grid-cols-5'>
					{BATTERY_STATUS_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={batteryStatus === opt.value}
							onClick={() => {
								if (readOnly) return;
								setValue('battery_status', opt.value);
								if (opt.value === 'no_battery') {
									setValue('battery_percentage', 0);
								}
							}}
						/>
					))}
				</div>

				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					{/* Battery Health */}
					<div>
						<label className='mb-1 block text-xs font-semibold text-zinc-500'>
							{getNotebookLabel('battery_health')}
						</label>
						<Controller
							name='battery_health'
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									value={field.value || ''}
									placeholder={NOTEBOOK_PLACEHOLDERS.battery_health}
									disabled={readOnly}
								/>
							)}
						/>
						<p className='mt-1 text-xs text-zinc-400'>
							{NOTEBOOK_HINTS.battery_health}
						</p>
					</div>

					{/* Battery Percentage */}
					<div>
						<label className='mb-1 block text-xs font-semibold text-zinc-500'>
							{getNotebookLabel('battery_percentage')}
						</label>
						<Controller
							name='battery_percentage'
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									type='number'
									value={field.value ?? ''}
									onChange={(e) =>
										field.onChange(
											e.target.value === '' ? null : Number(e.target.value),
										)
									}
									placeholder={NOTEBOOK_PLACEHOLDERS.battery_percentage}
									disabled={readOnly || batteryStatus === 'no_battery'}
									min={0}
									max={100}
									className={errors.battery_percentage ? 'border-red-500' : ''}
								/>
							)}
						/>
						{errors.battery_percentage && (
							<p className='mt-1 text-xs text-red-500'>
								{errors.battery_percentage.message}
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Charger Section */}
			<div className='rounded-xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-800 dark:bg-orange-900/10'>
				<label className='mb-3 block text-sm font-bold text-orange-800 dark:text-orange-200'>
					Cargador
				</label>

				<div className='mb-4 flex justify-center'>
					<YesNoSelector
						label='¿Incluye Cargador?'
						value={includesCharger}
						onChange={(val) => {
							if (readOnly) return;
							setValue('includes_charger', val);
							if (!val) {
								setValue('charger_status', undefined as any);
							}
						}}
					/>
				</div>

				{includesCharger && (
					<div className='animate-in fade-in zoom-in space-y-4 duration-200'>
						{/* Charger Watts */}
						<div>
							<label className='mb-1 block text-xs font-semibold text-zinc-500'>
								{getNotebookLabel('charger_watts')}
							</label>
							<Controller
								name='charger_watts'
								control={control}
								render={({ field }) => (
									<Input
										{...field}
										value={field.value || ''}
										placeholder={NOTEBOOK_PLACEHOLDERS.charger_watts}
										disabled={readOnly}
									/>
								)}
							/>
						</div>

						{/* Charger Status */}
						<div>
							<label className='mb-2 block text-center text-xs font-semibold text-zinc-500'>
								{getNotebookLabel('charger_status')}{' '}
								<span className='text-red-500'>*</span>
							</label>
							<div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
								{CHARGER_STATUS_OPTIONS.map((opt) => (
									<SelectionCard
										key={opt.value}
										label={opt.label}
										value={opt.value}
										isSelected={watch('charger_status') === opt.value}
										onClick={() =>
											!readOnly && setValue('charger_status', opt.value)
										}
									/>
								))}
							</div>
							{errors.charger_status && (
								<p className='mt-2 text-center text-xs text-red-500'>
									{errors.charger_status.message}
								</p>
							)}

							{/* Critical Alert for broken_port */}
							{watch('charger_status') === 'broken_port' && (
								<div className='mt-3 animate-pulse rounded-xl border border-red-500 bg-red-100 p-3 text-center text-red-800 dark:bg-red-900/50 dark:text-red-100'>
									<Icon
										icon='HeroExclamationTriangle'
										className='mr-1 inline h-4 w-4'
									/>
									<span className='text-sm font-bold'>
										CRÍTICO: Entrada de carga dañada = Grado M (Malo)
									</span>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default PowerSection;
