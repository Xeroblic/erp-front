import React from 'react';
import type { FormSectionProps } from '../../shared/types';
import type { NotebookFormData } from '../../../validation/notebook.schema';
import { getNotebookLabel } from '../../../translations/notebook.labels';
import { NOTEBOOK_HINTS, NOTEBOOK_WARNINGS } from '../../../constants/notebook/notebook.hints';
import { SelectionCard } from '@/pages/technical-reviews/shared/components/SelectionCard';
import { YesNoSelector } from '@/pages/technical-reviews/shared/components/YesNoSelector';
import {
	COVER_CONDITION_OPTIONS,
	KEYBOARD_CONDITION_OPTIONS,
	KEYBOARD_LAYOUT_OPTIONS,
	HINGE_CONDITION_OPTIONS,
	TOUCHPAD_CONDITION_OPTIONS,
	BOTTOM_CONDITION_OPTIONS,
} from '../../../constants/notebook/notebook.options';
import Icon from '@/components/icon/Icon';

const InputSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	errors,
	readOnly,
	watch,
	setValue,
}) => {
	return (
		<div className='space-y-6'>
			{/* Cover Condition */}
			<div className='rounded-xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-800 dark:bg-orange-900/10'>
				<label className='mb-3 block text-center text-sm font-bold text-orange-800 dark:text-orange-200'>
					{getNotebookLabel('cover_condition')} <span className='text-red-500'>*</span>
				</label>
				{NOTEBOOK_WARNINGS.cover_condition && (
					<div className='mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200'>
						<Icon
							icon='HeroExclamationTriangle'
							className='mt-0.5 h-4 w-4 flex-shrink-0'
						/>
						<span>{NOTEBOOK_WARNINGS.cover_condition}</span>
					</div>
				)}
				<div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
					{COVER_CONDITION_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={watch('cover_condition') === opt.value}
							onClick={() => !readOnly && setValue('cover_condition', opt.value)}
						/>
					))}
				</div>
				{errors.cover_condition && (
					<p className='mt-2 text-center text-xs text-red-500'>
						{errors.cover_condition.message}
					</p>
				)}
			</div>

			{/* Keyboard Condition */}
			<div className='rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/10'>
				<label className='mb-3 block text-center text-sm font-bold text-blue-800 dark:text-blue-200'>
					{getNotebookLabel('keyboard_condition')} <span className='text-red-500'>*</span>
				</label>
				{NOTEBOOK_WARNINGS.keyboard_condition && (
					<div className='mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200'>
						<Icon
							icon='HeroExclamationTriangle'
							className='mt-0.5 h-4 w-4 flex-shrink-0'
						/>
						<span>{NOTEBOOK_WARNINGS.keyboard_condition}</span>
					</div>
				)}
				<div className='grid grid-cols-2 gap-2 md:grid-cols-4'>
					{KEYBOARD_CONDITION_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={watch('keyboard_condition') === opt.value}
							onClick={() => !readOnly && setValue('keyboard_condition', opt.value)}
						/>
					))}
				</div>
				{errors.keyboard_condition && (
					<p className='mt-2 text-center text-xs text-red-500'>
						{errors.keyboard_condition.message}
					</p>
				)}
			</div>

			{/* Keyboard Layout */}
			<div className='rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30'>
				<label className='mb-3 block text-center text-sm font-bold text-zinc-700 dark:text-zinc-200'>
					{getNotebookLabel('keyboard_layout')}
				</label>
				<div className='grid grid-cols-3 gap-2'>
					{KEYBOARD_LAYOUT_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={watch('keyboard_layout') === opt.value}
							onClick={() => !readOnly && setValue('keyboard_layout', opt.value)}
						/>
					))}
				</div>
			</div>

			<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
				{/* Hinge Condition */}
				<div className='rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30'>
					<label className='mb-3 block text-center text-xs font-bold text-zinc-600 dark:text-zinc-300'>
						{getNotebookLabel('hinge_condition')}
					</label>
					<div className='grid grid-cols-2 gap-2'>
						{HINGE_CONDITION_OPTIONS.map((opt) => (
							<SelectionCard
								key={opt.value}
								label={opt.label}
								value={opt.value}
								isSelected={watch('hinge_condition') === opt.value}
								onClick={() => !readOnly && setValue('hinge_condition', opt.value)}
							/>
						))}
					</div>
				</div>

				{/* Touchpad Condition */}
				<div className='rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30'>
					<label className='mb-3 block text-center text-xs font-bold text-zinc-600 dark:text-zinc-300'>
						{getNotebookLabel('touchpad_condition')}
					</label>
					<div className='grid grid-cols-2 gap-2'>
						{TOUCHPAD_CONDITION_OPTIONS.map((opt) => (
							<SelectionCard
								key={opt.value}
								label={opt.label}
								value={opt.value}
								isSelected={watch('touchpad_condition') === opt.value}
								onClick={() =>
									!readOnly && setValue('touchpad_condition', opt.value)
								}
							/>
						))}
					</div>
				</div>

				{/* Bottom Condition */}
				<div className='rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30'>
					<label className='mb-3 block text-center text-xs font-bold text-zinc-600 dark:text-zinc-300'>
						{getNotebookLabel('bottom_condition')}
					</label>
					<div className='grid grid-cols-2 gap-2'>
						{BOTTOM_CONDITION_OPTIONS.map((opt) => (
							<SelectionCard
								key={opt.value}
								label={opt.label}
								value={opt.value}
								isSelected={watch('bottom_condition') === opt.value}
								onClick={() => !readOnly && setValue('bottom_condition', opt.value)}
							/>
						))}
					</div>
				</div>
			</div>

			{/* Boolean toggles */}
			<div className='grid grid-cols-2 gap-4'>
				<YesNoSelector
					label='¿Teclado Numérico?'
					value={watch('has_numeric_keypad')}
					onChange={(val) => !readOnly && setValue('has_numeric_keypad', val)}
				/>
				<YesNoSelector
					label='¿Teclado Retroiluminado?'
					value={watch('has_backlit_keyboard')}
					onChange={(val) => !readOnly && setValue('has_backlit_keyboard', val)}
				/>
			</div>
		</div>
	);
};

export default InputSection;
