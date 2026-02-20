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
import { SCREEN_CONDITION_OPTIONS } from '../../../constants/notebook/notebook.options';
import Icon from '@/components/icon/Icon';

const ScreenSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	control,
	errors,
	readOnly,
	watch,
	setValue,
}) => {
	const screenCondition = watch('screen_condition');
	const isTouchscreen = watch('is_touchscreen');
	const showDefectsCount = screenCondition === 'dead_pixels' || screenCondition === 'spots';

	return (
		<div className='space-y-8'>
			{/* Screen Inches */}
			<div className='hover:cursor-pointerrounded-xl border border-green-200 bg-green-500/20 p-4 transition-colors duration-200 hover:bg-green-500/30 dark:border-green-800 dark:bg-green-900/10 dark:hover:bg-green-900/30'>
				<label className='mb-3 flex items-center gap-2 text-sm font-bold text-green-800 dark:text-green-200'>
					<Icon icon='HeroComputerDesktop' className='h-4 w-4' />
					{getNotebookLabel('screen_inches')}
				</label>
				<Controller
					name='screen_inches'
					control={control}
					render={({ field }) => (
						<Input
							{...field}
							value={field.value || ''}
							placeholder={NOTEBOOK_PLACEHOLDERS.screen_inches}
							disabled={readOnly}
						/>
					)}
				/>
				<p className='mt-1 text-xs text-zinc-400'>{NOTEBOOK_HINTS.screen_inches}</p>
			</div>

			{/* Screen Condition */}
			<div className='rounded-xl border border-purple-200 bg-purple-500/20 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-purple-500/30 dark:border-purple-800 dark:bg-purple-900/10 dark:hover:bg-purple-900/30'>
				<label className='mb-3 flex items-center justify-center gap-2 text-center text-sm font-bold text-purple-800 dark:text-purple-200'>
					<Icon icon='HeroSparkles' className='h-4 w-4' />
					{getNotebookLabel('screen_condition')} <span className='text-red-500'>*</span>
				</label>

				{/* Warning */}
				{NOTEBOOK_WARNINGS.screen_condition && (
					<div className='mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200'>
						<Icon
							icon='HeroExclamationTriangle'
							className='mt-0.5 h-4 w-4 flex-shrink-0'
						/>
						<span>{NOTEBOOK_WARNINGS.screen_condition}</span>
					</div>
				)}

				<div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
					{SCREEN_CONDITION_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={screenCondition === opt.value}
							onClick={() => !readOnly && setValue('screen_condition', opt.value)}
						/>
					))}
				</div>
				{errors.screen_condition && (
					<p className='mt-2 text-center text-xs text-red-500'>
						{errors.screen_condition.message}
					</p>
				)}

				{/* Conditional Defect Count: Dead Pixels */}
				{screenCondition === 'dead_pixels' && (
					<div className='animate-in fade-in slide-in-from-top-2 mt-4 duration-300 hover:cursor-pointer'>
						<div className='mx-auto max-w-xs'>
							<label className='mb-2 block text-center text-sm font-bold text-purple-900 dark:text-purple-100'>
								¿Cuántos píxeles muertos? <span className='text-red-500'>*</span>
							</label>
							<Controller
								name='dead_pixels_count'
								control={control}
								render={({ field }) => (
									<Input
										{...field}
										type='number'
										min={1}
										placeholder='Ingresa cantidad'
										value={field.value ?? ''}
										onChange={(e) =>
											field.onChange(
												e.target.value ? Number(e.target.value) : null,
											)
										}
										disabled={readOnly}
										className={
											errors.dead_pixels_count
												? 'border-red-500 text-center'
												: 'text-center'
										}
									/>
								)}
							/>
							{errors.dead_pixels_count && (
								<p className='mt-1 text-center text-xs text-red-500'>
									{errors.dead_pixels_count.message}
								</p>
							)}
						</div>
					</div>
				)}

				{/* Conditional Defect Count: Spots */}
				{screenCondition === 'spots' && (
					<div className='animate-in fade-in slide-in-from-top-2 mt-4 duration-300 hover:cursor-pointer'>
						<div className='mx-auto max-w-xs'>
							<label className='mb-2 block text-center text-sm font-bold text-purple-900 dark:text-purple-100'>
								¿Cuántas manchas? <span className='text-red-500'>*</span>
							</label>
							<Controller
								name='spots_count'
								control={control}
								render={({ field }) => (
									<Input
										{...field}
										type='number'
										min={1}
										placeholder='Ingresa cantidad'
										value={field.value ?? ''}
										onChange={(e) =>
											field.onChange(
												e.target.value ? Number(e.target.value) : null,
											)
										}
										disabled={readOnly}
										className={
											errors.spots_count
												? 'border-red-500 text-center'
												: 'text-center'
										}
									/>
								)}
							/>
							{errors.spots_count && (
								<p className='mt-1 text-center text-xs text-red-500'>
									{errors.spots_count.message}
								</p>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Touchscreen */}
			<div className='flex justify-center'>
				<YesNoSelector
					label='¿Es Pantalla Táctil?'
					value={isTouchscreen}
					onChange={(val) => !readOnly && setValue('is_touchscreen', val)}
				/>
			</div>
		</div>
	);
};

export default ScreenSection;
