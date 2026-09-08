import React, { useId } from 'react';
import { Controller } from 'react-hook-form';
import { FormSectionProps } from '../../shared/types';
import { AioFormData } from '../../../validation/aio.schema';
import { SelectionCard } from '../../../ui/SelectionCard';
import { StepperInput } from '../../../ui/StepperInput';
import Input from '@/components/form/Input';
import { YesNoSelector } from '../../../ui/YesNoSelector';
import { getAioLabel } from '../../../translations/aio.labels';
import { AIO_HINTS, AIO_PLACEHOLDERS } from '../../../constants/aio/aio.hints';
import {
	getScreenCounterValue,
	SCREEN_COUNTER_MIN,
	resolveScreenCounterOnSelection,
} from '../../../utils/screenCounters';
import {
	SCREEN_CONDITION_OPTIONS,
	STAND_CONDITION_OPTIONS,
	COVER_CONDITION_OPTIONS,
} from '../../../constants/aio/aio.options';
import Icon from '@/components/icon/Icon';

export const AioScreenSection: React.FC<FormSectionProps<AioFormData>> = ({
	control,
	errors,
	readOnly,
	watch,
	setValue,
}) => {
	const deadPixelsLabelId = useId();
	const screenCondition = watch('screen_condition');
	const deadPixelsCount = watch('dead_pixels_count');
	const standCondition = watch('stand_condition');
	const coverCondition = watch('cover_condition');

	return (
		<div className='space-y-8'>
			<p className='text-sm text-zinc-500'>
				Ingresa la información sobre la pantalla y el soporte del All-In-One.
			</p>

			<div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
				{/* Screen Inches */}
				<div className='rounded-xl border border-emerald-200 bg-emerald-500/10 p-5 transition-colors duration-200 hover:cursor-pointer hover:bg-emerald-500/20 dark:border-emerald-800/50 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20'>
					<label className='mb-3 flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200'>
						<Icon icon='HeroComputerDesktop' className='h-5 w-5' />
						{getAioLabel('screen_inches')}
					</label>
					<Controller
						name='screen_inches'
						control={control}
						render={({ field }) => (
							<Input
								{...field}
								value={field.value || ''}
								placeholder={AIO_PLACEHOLDERS.screen_inches}
								disabled={readOnly}
							/>
						)}
					/>
					<p className='mt-2 text-xs text-emerald-700/70 dark:text-emerald-400/70'>
						{AIO_HINTS.screen_inches}
					</p>
				</div>

				{/* Is Touchscreen (ZF-102) */}
				{/* El switch pintaba `checked={Boolean(field.value)}`: sin responder se veía
				    apagado, igual que un «No», y el paso se trababa sin explicar por qué.
				    El selector de tres estados deja el campo visiblemente vacío hasta que
				    alguien contesta, y el error se muestra junto al control. */}
				<div className='rounded-xl border border-blue-200 bg-blue-500/20 p-5 transition-colors duration-200 hover:bg-blue-500/30 dark:border-blue-800/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 md:col-span-1 lg:col-span-2'>
					<p className='mb-3 flex items-center justify-center gap-2 text-xs text-blue-800/70 dark:text-blue-200/70'>
						<Icon icon='HeroHandRaised' className='h-5 w-5' />
						¿La pantalla del AIO cuenta con digitalizador táctil nativo?
					</p>
					<Controller
						name='is_touchscreen'
						control={control}
						render={({ field }) => (
							<YesNoSelector
								label={getAioLabel('is_touchscreen')}
								required
								disabled={readOnly}
								value={field.value}
								onChange={(value) => !readOnly && field.onChange(value)}
							/>
						)}
					/>
					{errors.is_touchscreen && (
						<p className='mt-2 text-center text-xs text-red-500'>
							{errors.is_touchscreen.message}
						</p>
					)}
				</div>
			</div>

			<div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
				{/* Screen Condition */}
				<div className='rounded-xl border border-purple-200 bg-purple-500/10 p-5 transition-colors duration-200 hover:cursor-pointer hover:bg-purple-500/20 dark:border-purple-800/50 dark:bg-purple-900/10 dark:hover:bg-purple-900/20'>
					<label className='mb-4 flex items-center justify-center gap-2 text-center text-sm font-bold text-purple-900 dark:text-purple-100'>
						<Icon icon='HeroSparkles' className='h-5 w-5' />
						{getAioLabel('screen_condition')} <span className='text-red-500'>*</span>
					</label>
					<div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
						{SCREEN_CONDITION_OPTIONS.map((opt) => (
							<SelectionCard
								key={opt.value}
								label={opt.label}
								value={opt.value}
								isSelected={screenCondition === opt.value}
								onClick={() => {
									if (readOnly) return;

									const nextScreenCondition =
										opt.value as AioFormData['screen_condition'];

									setValue('screen_condition', nextScreenCondition, {
										shouldValidate: true,
									});
									setValue(
										'dead_pixels_count',
										resolveScreenCounterOnSelection(
											screenCondition,
											nextScreenCondition,
											'dead_pixels',
											deadPixelsCount,
										),
										{ shouldValidate: true },
									);
								}}
							/>
						))}
					</div>
					{errors.screen_condition && (
						<p className='mt-3 text-center text-xs text-red-500'>
							{errors.screen_condition.message}
						</p>
					)}
					{screenCondition === 'dead_pixels' && (
						<div
							className='mt-5 w-full max-w-[220px]'
							role='group'
							aria-labelledby={deadPixelsLabelId}>
							<p
								id={deadPixelsLabelId}
								className='mb-2 block text-xs font-bold text-purple-900 dark:text-purple-100'>
								{getAioLabel('dead_pixels_count')}
							</p>
							<StepperInput
								value={getScreenCounterValue(deadPixelsCount)}
								onChange={(value) => {
									if (readOnly) return;
									setValue('dead_pixels_count', value, { shouldValidate: true });
								}}
								min={SCREEN_COUNTER_MIN}
								max={50}
								disabled={readOnly}
							/>
							{errors.dead_pixels_count && (
								<p className='mt-2 text-xs text-red-500'>
									{errors.dead_pixels_count.message}
								</p>
							)}
						</div>
					)}
				</div>

				<div className='flex flex-col gap-8'>
					{/* Stand Condition */}
					<div className='rounded-xl border border-amber-200 bg-amber-500/10 p-5 transition-colors duration-200 hover:cursor-pointer hover:bg-amber-500/20 dark:border-amber-800/50 dark:bg-amber-900/10 dark:hover:bg-amber-900/20'>
						<label className='mb-3 flex items-center justify-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-100'>
							<Icon icon='HeroBars2' className='h-5 w-5' />
							{getAioLabel('stand_condition')} <span className='text-red-500'>*</span>
						</label>
						<div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
							{STAND_CONDITION_OPTIONS.map((opt) => (
								<SelectionCard
									key={opt.value}
									label={opt.label}
									value={opt.value}
									isSelected={standCondition === opt.value}
									onClick={() =>
										!readOnly &&
										setValue(
											'stand_condition',
											opt.value as AioFormData['stand_condition'],
										)
									}
								/>
							))}
						</div>
						{errors.stand_condition && (
							<p className='mt-3 text-center text-xs text-red-500'>
								{errors.stand_condition.message}
							</p>
						)}
					</div>

					{/* Cover Condition */}
					<div className='rounded-xl border border-rose-200 bg-rose-500/10 p-5 transition-colors duration-200 hover:cursor-pointer hover:bg-rose-500/20 dark:border-rose-800/50 dark:bg-rose-900/10 dark:hover:bg-rose-900/20'>
						<label className='mb-3 flex items-center justify-center gap-2 text-sm font-bold text-rose-900 dark:text-rose-100'>
							<Icon icon='HeroSquare3Stack3D' className='h-5 w-5' />
							{getAioLabel('cover_condition')} <span className='text-red-500'>*</span>
						</label>
						<div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
							{COVER_CONDITION_OPTIONS.map((opt) => (
								<SelectionCard
									key={opt.value}
									label={opt.label}
									value={opt.value}
									isSelected={coverCondition === opt.value}
									onClick={() =>
										!readOnly &&
										setValue(
											'cover_condition',
											opt.value as AioFormData['cover_condition'],
										)
									}
								/>
							))}
						</div>
						{errors.cover_condition && (
							<p className='mt-3 text-center text-xs text-red-500'>
								{errors.cover_condition.message}
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default AioScreenSection;
