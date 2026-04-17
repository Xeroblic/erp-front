import React from 'react';
import { Controller } from 'react-hook-form';
import { FormSectionProps } from '../../shared/types';
import { MonitorFormData } from '../../../validation/monitor.schema';
import Input from '@/components/form/Input';
import SelectReact from '@/components/form/SelectReact';
import { StepperInput } from '../../../ui/StepperInput';
import { SelectionCard } from '../../../ui/SelectionCard';
import Checkbox from '@/components/form/Checkbox';
import { MONITOR_PLACEHOLDERS } from '../../../constants/monitor/monitor.hints';
import {
	SCREEN_RESOLUTION_OPTIONS,
	SCREEN_CONDITION_OPTIONS,
	STAND_CONDITION_OPTIONS,
	FRAME_CONDITION_OPTIONS,
} from '../../../constants/monitor/monitor.options';
import { getMonitorLabel } from '../../../translations/monitor.labels';
import Icon from '@/components/icon/Icon';

const MonitorScreenSection: React.FC<FormSectionProps<MonitorFormData>> = ({
	control,
	errors,
	readOnly,
	watch,
	setValue,
}) => {
	const currentScreen = watch('screen_condition');
	const currentStand = watch('stand_condition');
	const currentFrame = watch('frame_condition');
	const currentSpotsCount = watch('spots_count');
	const currentScreenResolution = watch('screen_resolution');

	return (
		<div className='space-y-8'>
			{/* Display Specs */}
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50'>
				<h3 className='mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
					<Icon icon='HeroTv' className='h-5 w-5' />
					Especificaciones del Panel
				</h3>
				<div className='grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4'>
					<div className='col-span-1'>
						<label className='mb-2 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							{getMonitorLabel('screen_inches')}
						</label>
						<Controller
							name='screen_inches'
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									value={field.value ?? ''}
									placeholder={MONITOR_PLACEHOLDERS.screen_inches}
									disabled={readOnly}
									className={errors.screen_inches ? 'border-red-500' : ''}
								/>
							)}
						/>
						{errors.screen_inches && (
							<p className='mt-1 text-xs text-red-500'>
								{errors.screen_inches.message}
							</p>
						)}
					</div>

					<div className='col-span-1 md:col-span-2 lg:col-span-2'>
						<label className='mb-2 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							{getMonitorLabel('screen_resolution')}
						</label>
						<Controller
							name='screen_resolution'
							control={control}
							render={({ field }) => (
								<SelectReact
									name='screen_resolution'
									value={(() => {
										const currentValue = (field.value ?? '').toString().trim();
										if (!currentValue) return null;

										return (
											SCREEN_RESOLUTION_OPTIONS.find(
												(opt) => opt.value === currentValue,
											) || { value: currentValue, label: currentValue }
										);
									})()}
									options={(() => {
										const currentValue = (currentScreenResolution ?? '')
											.toString()
											.trim();
										if (
											!currentValue ||
											SCREEN_RESOLUTION_OPTIONS.some(
												(opt) => opt.value === currentValue,
											)
										) {
											return SCREEN_RESOLUTION_OPTIONS;
										}

										return [
											{ value: currentValue, label: currentValue },
											...SCREEN_RESOLUTION_OPTIONS,
										];
									})()}
									onChange={(option) => {
										if (
											!option ||
											Array.isArray(option) ||
											!('value' in option)
										) {
											field.onChange('');
											return;
										}

										field.onChange(option.value);
									}}
									onCreateOption={(inputValue) => {
										const nextValue = inputValue.trim();
										if (!nextValue) return;
										field.onChange(nextValue);
									}}
									placeholder={MONITOR_PLACEHOLDERS.screen_resolution}
									isDisabled={readOnly}
									isClearable
									isCreatable
									noOptionsMessage={() =>
										'Escribe para agregar una resolución manual'
									}
								/>
							)}
						/>
						{errors.screen_resolution && (
							<p className='mt-1 text-xs text-red-500'>
								{errors.screen_resolution.message}
							</p>
						)}
					</div>

					<div className='col-span-1 flex items-end pb-2'>
						<div className='flex items-center gap-2'>
							<Controller
								name='is_touchscreen'
								control={control}
								render={({ field }) => (
									<Checkbox
										variant='switch'
										color='indigo'
										checked={Boolean(field.value)}
										onChange={() => !readOnly && field.onChange(!field.value)}
										disabled={readOnly}
									/>
								)}
							/>
							<label className='text-sm font-bold text-zinc-700 dark:text-zinc-300'>
								{getMonitorLabel('is_touchscreen')}
							</label>
						</div>
					</div>
				</div>
			</div>

			{/* Condición de Pantalla */}
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50'>
				<label className='mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
					<Icon icon='HeroStop' className='h-5 w-5' />
					{getMonitorLabel('screen_condition')}
				</label>
				<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6'>
					{SCREEN_CONDITION_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label as string}
							value={opt.value as string}
							isSelected={currentScreen === opt.value}
							color='blue'
							onClick={() => {
								if (readOnly) return;
								setValue(
									'screen_condition',
									opt.value as
										| 'ok'
										| 'minor_wear'
										| 'worn'
										| 'dead_pixels'
										| 'broken'
										| 'spots'
										| 'scratched'
										| 'lines',
									{ shouldValidate: true },
								);
							}}
						/>
					))}
				</div>
				{currentScreen === 'spots' && (
					<div className='mt-5 w-full max-w-[220px]'>
						<label className='mb-2 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							{getMonitorLabel('spots_count')}
						</label>
						<StepperInput
							value={typeof currentSpotsCount === 'number' ? currentSpotsCount : 0}
							onChange={(val) => {
								if (readOnly) return;
								setValue('spots_count', val, { shouldValidate: true });
							}}
							max={50}
						/>
						{errors.spots_count && (
							<p className='mt-2 text-xs text-red-500'>
								{errors.spots_count.message}
							</p>
						)}
					</div>
				)}
				{errors.screen_condition && (
					<p className='mt-3 text-xs text-red-500'>{errors.screen_condition.message}</p>
				)}
			</div>

			{/* Condición de Base (Stand) */}
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50'>
				<label className='mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
					<Icon icon='HeroBarsArrowDown' className='h-5 w-5' />
					{getMonitorLabel('stand_condition')}
				</label>
				<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5'>
					{STAND_CONDITION_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label as string}
							value={opt.value as string}
							isSelected={currentStand === opt.value}
							color='orange'
							onClick={() => {
								if (readOnly) return;
								setValue(
									'stand_condition',
									opt.value as
										| 'ok'
										| 'worn'
										| 'missing_pieces'
										| 'broken'
										| 'no_stand',
									{ shouldValidate: true },
								);
							}}
						/>
					))}
				</div>
				{errors.stand_condition && (
					<p className='mt-3 text-xs text-red-500'>{errors.stand_condition.message}</p>
				)}
			</div>

			{/* Condición del Marco (Frame) */}
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50'>
				<label className='mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
					<Icon icon='HeroPhoto' className='h-5 w-5' />
					{getMonitorLabel('frame_condition')}
				</label>
				<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5'>
					{FRAME_CONDITION_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label as string}
							value={opt.value as string}
							isSelected={currentFrame === opt.value}
							color='yellow'
							onClick={() => {
								if (readOnly) return;
								setValue(
									'frame_condition',
									opt.value as
										| 'ok'
										| 'worn'
										| 'missing_pieces'
										| 'scratched'
										| 'broken',
									{ shouldValidate: true },
								);
							}}
						/>
					))}
				</div>
				{errors.frame_condition && (
					<p className='mt-3 text-xs text-red-500'>{errors.frame_condition.message}</p>
				)}
			</div>
		</div>
	);
};

export default MonitorScreenSection;
