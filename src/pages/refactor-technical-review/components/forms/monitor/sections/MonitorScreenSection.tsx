import React, { useId } from 'react';
import { toast } from 'react-toastify';
import Input from '@/components/form/Input';
import SelectReact from '@/components/form/SelectReact';
import Validation from '@/components/form/Validation';
import Checkbox from '@/components/form/Checkbox';
import Icon from '@/components/icon/Icon';
import { FormSectionProps } from '../../shared/types';
import { MonitorFormData } from '../../../validation/monitor.schema';
import { StepperInput } from '../../../ui/StepperInput';
import { SelectionCard } from '../../../ui/SelectionCard';
import { MONITOR_PLACEHOLDERS } from '../../../constants/monitor/monitor.hints';
import {
	SCREEN_RESOLUTION_OPTIONS,
	SCREEN_CONDITION_OPTIONS,
	STAND_CONDITION_OPTIONS,
	FRAME_CONDITION_OPTIONS,
} from '../../../constants/monitor/monitor.options';
import { getMonitorLabel } from '../../../translations/monitor.labels';
import {
	getScreenCounterValue,
	SCREEN_COUNTER_MIN,
	resolveScreenCounterOnSelection,
} from '../../../utils/screenCounters';
import { NoEnciendeButton } from '../../shared/NoEnciendeButton';

const MonitorScreenSection: React.FC<FormSectionProps<MonitorFormData>> = (sectionProps) => {
	const { values, errors, readOnly, setFieldValue, onFieldBlur, onDirectSubmit } = sectionProps;
	const spotsLabelId = useId();
	const deadPixelsLabelId = useId();
	const currentScreen = values.screen_condition;
	const currentStand = values.stand_condition;
	const currentFrame = values.frame_condition;
	const currentSpotsCount = values.spots_count;
	const currentDeadPixelsCount = values.dead_pixels_count;
	const currentScreenResolution = values.screen_resolution;

	return (
		<div className='space-y-8'>
			{/* ═══ Botón de Bypass (No enciende) ═══ */}
			{!readOnly && onDirectSubmit && (
				<div className='mb-6'>
					<NoEnciendeButton
						onValidate={() => {
							const inches = values.screen_inches;
							const resolution = values.screen_resolution;

							if (!inches || !resolution) {
								toast.warning(
									'Debes completar las Pulgadas y la Resolución, ya que pueden ser revisados visualmente.',
								);
								return false;
							}
							return true;
						}}
						onConfirm={() => {
							onDirectSubmit({
								line: values.line || 'Ninguna',
								screen_inches: values.screen_inches || '0',
								screen_resolution: values.screen_resolution || '0',
								is_touchscreen: false,
								screen_condition: 'broken',
								spots_count: 0,
								dead_pixels_count: 0,
								stand_condition: 'broken',
								frame_condition: 'broken',
								has_usb_hub: false,
								vga_ports: 0,
								hdmi_ports: 0,
								displayport_ports: 0,
								dvi_ports: 0,
								usb_a_ports: 0,
								usb_c_ports: 0,
								sd_readers: 0,
								rj45_ports: 0,
								charging_ports: 0,
								all_ports_functional: false,
								defective_ports_count: 5,
								defective_ports_critical_count: 5,
								includes_power_cable: false,
								includes_video_cable: false,
								includes_stand: false,
								general_condition: 'scrap',
								observations: 'Equipo no enciende',
							});
						}}
					/>
				</div>
			)}

			{/* Display Specs */}
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50'>
				<h3 className='mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
					<Icon icon='HeroTv' className='h-5 w-5' />
					Especificaciones del Panel
				</h3>
				<div className='grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4'>
					<div className='col-span-1'>
						<label className='mb-2 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							{getMonitorLabel('screen_inches')}
						</label>
						<Input
							name='screen_inches'
							onChange={(event) => setFieldValue('screen_inches', event.target.value)}
							onBlur={() => onFieldBlur('screen_inches')}
							value={values.screen_inches ?? ''}
							placeholder={MONITOR_PLACEHOLDERS.screen_inches}
							disabled={readOnly}
							className={errors.screen_inches ? 'border-red-500' : ''}
						/>
						{errors.screen_inches && (
							<p className='mt-1 text-xs text-red-500'>{errors.screen_inches}</p>
						)}
					</div>

					<div className='col-span-1 md:col-span-2 lg:col-span-2'>
						<label className='mb-2 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							{getMonitorLabel('screen_resolution')}
						</label>
						<Validation
							isValid={!errors.screen_resolution}
							isTouched={Boolean(errors.screen_resolution)}
							invalidFeedback={errors.screen_resolution}>
							<SelectReact
								name='screen_resolution'
								value={(() => {
									const currentValue = (values.screen_resolution ?? '')
										.toString()
										.trim();
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
									if (!option || Array.isArray(option) || !('value' in option)) {
										setFieldValue('screen_resolution', '');
										return;
									}

									setFieldValue('screen_resolution', option.value);
								}}
								onCreateOption={(inputValue) => {
									const nextValue = inputValue.trim();
									if (!nextValue) return;
									setFieldValue('screen_resolution', nextValue);
								}}
								placeholder={MONITOR_PLACEHOLDERS.screen_resolution}
								onBlur={() => onFieldBlur('screen_resolution')}
								isDisabled={readOnly}
								isClearable
								isCreatable
								noOptionsMessage={() =>
									'Escribe para agregar una resolución manual'
								}
							/>
						</Validation>
					</div>

					<div className='col-span-1 flex items-end pb-2'>
						<div className='flex items-center gap-2'>
							<Checkbox
								variant='switch'
								color='indigo'
								checked={Boolean(values.is_touchscreen)}
								onChange={() =>
									!readOnly &&
									setFieldValue('is_touchscreen', !values.is_touchscreen)
								}
								disabled={readOnly}
							/>
							<label className='text-sm font-bold text-zinc-700 dark:text-zinc-300'>
								{getMonitorLabel('is_touchscreen')}
							</label>
						</div>
					</div>
				</div>
			</div>

			{/* Condición de Pantalla */}
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50'>
				<label className='mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
					<Icon icon='HeroStop' className='h-5 w-5' />
					{getMonitorLabel('screen_condition')}
				</label>
				<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6'>
					{SCREEN_CONDITION_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={currentScreen === opt.value}
							color='blue'
							onClick={() => {
								if (readOnly) return;
								const nextScreenCondition =
									opt.value as MonitorFormData['screen_condition'];

								setFieldValue('screen_condition', nextScreenCondition, {
									touch: true,
								});
								setFieldValue(
									'spots_count',
									resolveScreenCounterOnSelection(
										currentScreen,
										nextScreenCondition,
										'spots',
										currentSpotsCount,
									),
									{ touch: true },
								);
								setFieldValue(
									'dead_pixels_count',
									resolveScreenCounterOnSelection(
										currentScreen,
										nextScreenCondition,
										'dead_pixels',
										currentDeadPixelsCount,
									),
									{ touch: true },
								);
							}}
						/>
					))}
				</div>
				{currentScreen === 'spots' && (
					<div
						className='mt-5 w-full max-w-[220px]'
						role='group'
						aria-labelledby={spotsLabelId}>
						<p
							id={spotsLabelId}
							className='mb-2 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							{getMonitorLabel('spots_count')}
						</p>
						<StepperInput
							value={getScreenCounterValue(currentSpotsCount)}
							onChange={(val) => {
								if (readOnly) return;
								setFieldValue('spots_count', val, { touch: true });
							}}
							min={SCREEN_COUNTER_MIN}
							max={50}
							disabled={readOnly}
						/>
						{errors.spots_count && (
							<p className='mt-2 text-xs text-red-500'>{errors.spots_count}</p>
						)}
					</div>
				)}
				{currentScreen === 'dead_pixels' && (
					<div
						className='mt-5 w-full max-w-[220px]'
						role='group'
						aria-labelledby={deadPixelsLabelId}>
						<p
							id={deadPixelsLabelId}
							className='mb-2 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							{getMonitorLabel('dead_pixels_count')}
						</p>
						<StepperInput
							value={getScreenCounterValue(currentDeadPixelsCount)}
							onChange={(value) => {
								if (readOnly) return;
								setFieldValue('dead_pixels_count', value, { touch: true });
							}}
							min={SCREEN_COUNTER_MIN}
							max={50}
							disabled={readOnly}
						/>
						{errors.dead_pixels_count && (
							<p className='mt-2 text-xs text-red-500'>{errors.dead_pixels_count}</p>
						)}
					</div>
				)}
				{errors.screen_condition && (
					<p className='mt-3 text-xs text-red-500'>{errors.screen_condition}</p>
				)}
			</div>

			{/* Condición de Base (Stand) */}
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50'>
				<label className='mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
					<Icon icon='HeroBarsArrowDown' className='h-5 w-5' />
					{getMonitorLabel('stand_condition')}
				</label>
				<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5'>
					{STAND_CONDITION_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={currentStand === opt.value}
							color='orange'
							onClick={() => {
								if (readOnly) return;
								setFieldValue(
									'stand_condition',
									opt.value as
										| 'ok'
										| 'worn'
										| 'missing_pieces'
										| 'broken'
										| 'no_stand',
									{ touch: true },
								);
							}}
						/>
					))}
				</div>
				{errors.stand_condition && (
					<p className='mt-3 text-xs text-red-500'>{errors.stand_condition}</p>
				)}
			</div>

			{/* Condición del Marco (Frame) */}
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50'>
				<label className='mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
					<Icon icon='HeroPhoto' className='h-5 w-5' />
					{getMonitorLabel('frame_condition')}
				</label>
				<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5'>
					{FRAME_CONDITION_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={currentFrame === opt.value}
							color='yellow'
							onClick={() => {
								if (readOnly) return;
								setFieldValue(
									'frame_condition',
									opt.value as
										| 'ok'
										| 'worn'
										| 'missing_pieces'
										| 'scratched'
										| 'broken',
									{ touch: true },
								);
							}}
						/>
					))}
				</div>
				{errors.frame_condition && (
					<p className='mt-3 text-xs text-red-500'>{errors.frame_condition}</p>
				)}
			</div>
		</div>
	);
};

export default MonitorScreenSection;
