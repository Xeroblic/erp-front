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
	const brand = watch('brand');
	const isDell = brand?.toLowerCase().includes('dell') || brand?.toLowerCase().includes('Dell');

	return (
		<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
			{/* --- LEFT: Cargador --- */}
			<div className='rounded-xl border border-orange-200 bg-orange-50 p-4 transition-colors duration-200 dark:border-orange-800 dark:bg-orange-900/10'>
				<label className='mb-3 block text-center text-sm font-bold uppercase tracking-wide text-orange-800 dark:text-orange-200'>
					Energía
				</label>

				<label className='mb-2 block text-center text-xs font-semibold text-zinc-500'>
					¿Incluye Cargador Original?
				</label>

				<div className='mb-6 flex justify-center'>
					<YesNoSelector
						label=''
						value={includesCharger}
						onChange={(val) => {
							if (readOnly) return;
							setValue('includes_charger', val);
							if (!val) {
								setValue('charger_status', null);
								setValue('charger_watts', undefined);
							}
						}}
					/>
				</div>

				{includesCharger && (
					<div className='animate-in fade-in slide-in-from-top-4 space-y-6 duration-300'>
						{/* Charger Watts */}
						<div className='rounded-lg border border-orange-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800'>
							<label className='mb-3 flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
								<span>POTENCIA (WATTS)</span>
								<Icon icon='HeroBolt' className='h-4 w-4 text-orange-500' />
							</label>
							<Controller
								name='charger_watts'
								control={control}
								render={({ field }) => (
									<div className='space-y-2'>
										<div className='flex items-center gap-4'>
											<div className='flex-1'>
												<RangeSlider
													value={Number(field.value) || 0}
													onChange={(val) => field.onChange(String(val))}
													min={0}
													max={300}
													step={5}
													unit='W'
													disabled={readOnly}
													className='h-2'
												/>
											</div>
											<div className='relative w-20'>
												<Input
													name='watts'
													type='number'
													value={field.value || ''}
													onChange={(e) => field.onChange(e.target.value)}
													placeholder='0'
													className='pr-6 text-center text-sm'
													disabled={readOnly}
													min={0}
													max={300}
												/>
												<span className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400'>
													W
												</span>
											</div>
										</div>
										<div className='flex justify-between text-[10px] text-zinc-400'>
											<span>0W</span>
											<span>300W</span>
										</div>
									</div>
								)}
							/>
						</div>

						{/* Charger Status */}
						<div>
							<div className='grid grid-cols-2 gap-2'>
								{CHARGER_STATUS_OPTIONS.map((opt) => (
									<SelectionCard
										key={opt.value}
										label={opt.label}
										value={opt.value}
										isSelected={watch('charger_status') === opt.value}
										onClick={() =>
											!readOnly && setValue('charger_status', opt.value)
										}
										variant='default'
										className='text-xs'
										color={
											opt.value === 'buen_estado'
												? 'green'
												: opt.value.includes('broken') ||
													  opt.value.includes('mal')
													? 'red'
													: 'gray'
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
								<div className='mt-3 animate-pulse rounded-lg border border-red-500 bg-red-100 p-2 text-center text-xs font-bold text-red-800 dark:bg-red-900/50 dark:text-red-100'>
									CRÍTICO: Entrada rota = Grado M
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* --- RIGHT: Batería --- */}
			<div className='rounded-xl border border-emerald-200 bg-emerald-50 p-4 transition-colors duration-200 dark:border-emerald-800 dark:bg-emerald-900/10'>
				<label className='mb-4 block text-center text-sm font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-200'>
					{isDell ? 'Estado Batería (BIOS)' : 'Salud Batería'}
				</label>

				{isDell ? (
					<>
						{/* Dell: Buttons only (BIOS info already gives health) */}
						<div className='mb-6 grid grid-cols-2 gap-3'>
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
											setValue('battery_health', 'Sin Batería');
										}
									}}
									color={
										opt.value === 'excellent' || opt.value === 'good'
											? 'green'
											: opt.value === 'fair'
												? 'orange'
												: opt.value === 'poor'
													? 'red'
													: 'gray'
									}
									className='py-3 text-xs'
								/>
							))}
						</div>
					</>
				) : (
					/* Non-Dell: Big Percentage Input Only */
					<div className='flex flex-col items-center justify-center space-y-4 py-4'>
						<div className='relative w-32'>
							<Controller
								name='battery_percentage'
								control={control}
								render={({ field }) => (
									<div className='relative'>
										<Input
											{...field}
											type='number'
											value={field.value ?? ''}
											onChange={(e) => {
												const val =
													e.target.value === ''
														? null
														: Number(e.target.value);
												field.onChange(val);
											}}
											placeholder='0'
											className='h-16 text-center text-3xl font-bold text-zinc-700 dark:text-zinc-200'
											disabled={readOnly}
											min={0}
											max={100}
										/>
										<span className='absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400'>
											%
										</span>
									</div>
								)}
							/>
						</div>
					</div>
				)}

				<div className='mt-4 text-center text-[10px] text-zinc-400'>
					Información de salud del componente
				</div>
			</div>
		</div>
	);
};

export default PowerSection;
