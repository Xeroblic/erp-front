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
import { SelectionCard } from '../../../ui/SelectionCard';
import { YesNoSelector } from '../../../ui/YesNoSelector';
import {
	BATTERY_STATUS_OPTIONS,
	CHARGER_STATUS_OPTIONS,
} from '../../../constants/notebook/notebook.options';
import Icon from '@/components/icon/Icon';
import RangeSlider from '@/components/ui/RangeSlider';

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
			<div className='hover:cursor-pointer rounded-xl border border-amber-200 bg-amber-500/20 p-4 transition-colors duration-200 hover:bg-amber-500/30 dark:border-amber-800 dark:bg-amber-900/10 dark:hover:bg-amber-900/30'>
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
			<div className='hover:cursor-pointer rounded-xl border border-orange-200 bg-orange-500/20 p-4 transition-colors duration-200 hover:bg-orange-500/30 dark:border-orange-800 dark:bg-orange-900/10 dark:hover:bg-orange-900/30'>
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
								setValue('charger_status', null);
							}
						}}
					/>
				</div>

				{includesCharger && (
					<div className='animate-in fade-in zoom-in space-y-4 duration-200'>
						{/* Charger Watts */}
						<div className='hover:cursor-pointer rounded-lg border border-orange-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800'>
							<label className='mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
								<Icon icon='HeroBolt' className='h-4 w-4 text-orange-500' />
								{getNotebookLabel('charger_watts')}
							</label>
							<Controller
								name='charger_watts'
								control={control}
								render={({ field }) => (
									<div className='flex items-center gap-4'>
										<div className='flex-1'>
											<RangeSlider
												value={Number(field.value) || 0}
												onChange={(val) => field.onChange(String(val))}
												min={0}
												max={240}
												step={1}
												unit='W'
												disabled={readOnly}
											/>
										</div>
										<div className='relative w-24'>
											<Input
												name='watts'
												type='number'
												value={field.value || ''}
												onChange={(e) => field.onChange(e.target.value)}
												placeholder='0'
												className='pr-6 text-center'
												disabled={readOnly}
												min={0}
												max={240}
											/>
											<span className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400'>
												W
											</span>
										</div>
									</div>
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
								<div className='hover:cursor-pointer mt-3 animate-pulse rounded-xl border border-red-500 bg-red-100 p-3 text-center text-red-800 dark:bg-red-900/50 dark:text-red-100'>
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
