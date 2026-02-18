import React from 'react';
import type { FormSectionProps } from '../../shared/types';
import type { NotebookFormData } from '../../../validation/notebook.schema';
import { getNotebookLabel } from '../../../translations/notebook.labels';
import { NOTEBOOK_HINTS, NOTEBOOK_WARNINGS } from '../../../constants/notebook/notebook.hints';
import { SelectionCard } from '../../../ui/SelectionCard';
import { YesNoSelector } from '../../../ui/YesNoSelector';
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
		<div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
			{/* ─── ZONE 1: INPUT DEVICES (The "Control Center") ─── */}
			<div className='flex flex-col gap-6 lg:col-span-8'>
				{/* Keyboard Main Widget */}
				<div className='relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50'>
					<div className='mb-6 flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'>
								<Icon icon='HeroCommandLine' className='h-6 w-6' />
							</div>
							<div>
								<h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
									Teclado
								</h3>
								<p className='text-xs text-zinc-500'>
									Estado funcional y distribución física
								</p>
							</div>
						</div>
						{/* Warning Badge */}
						{NOTEBOOK_WARNINGS.keyboard_condition && (
							<div className='hidden items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400 sm:flex'>
								<Icon icon='HeroExclamationTriangle' className='h-3.5 w-3.5' />
								<span>Atención Requerida</span>
							</div>
						)}
					</div>

					{/* Inline Warning for Mobile */}
					{NOTEBOOK_WARNINGS.keyboard_condition && (
						<div className='mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-200 sm:hidden'>
							<Icon
								icon='HeroExclamationTriangle'
								className='mt-0.5 h-4 w-4 flex-shrink-0'
							/>
							<span>{NOTEBOOK_WARNINGS.keyboard_condition}</span>
						</div>
					)}

					<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
						{/* Condition */}
						<div>
							<label className='mb-3 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
								Condición Física <span className='text-red-500'>*</span>
							</label>
							<div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
								{KEYBOARD_CONDITION_OPTIONS.map((opt) => (
									<SelectionCard
										key={opt.value}
										label={opt.label}
										value={opt.value}
										isSelected={watch('keyboard_condition') === opt.value}
										onClick={() =>
											!readOnly && setValue('keyboard_condition', opt.value)
										}
										variant='compact'
									/>
								))}
							</div>
							{errors.keyboard_condition && (
								<p className='mt-2 text-xs text-red-500'>
									{errors.keyboard_condition.message}
								</p>
							)}
						</div>

						{/* Layout */}
						<div>
							<label className='mb-3 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
								Distribución
							</label>
							<div className='space-y-2'>
								{KEYBOARD_LAYOUT_OPTIONS.map((opt) => (
									<button
										key={opt.value}
										type='button'
										onClick={() =>
											!readOnly && setValue('keyboard_layout', opt.value)
										}
										className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-all ${
											watch('keyboard_layout') === opt.value
												? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-300'
												: 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800'
										}`}>
										<span className='font-medium'>{opt.label}</span>
										{watch('keyboard_layout') === opt.value && (
											<Icon
												icon='HeroCheckCircle'
												className='h-4 w-4 text-blue-500'
											/>
										)}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Toggles Row */}
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
					{/* Numeric Keypad Toggle */}
					<button
						type='button'
						onClick={() =>
							!readOnly &&
							setValue('has_numeric_keypad', !watch('has_numeric_keypad'))
						}
						className={`group relative flex items-center gap-4 rounded-2xl border p-4 transition-all ${
							watch('has_numeric_keypad')
								? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10'
								: 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/50'
						}`}>
						<div
							className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
								watch('has_numeric_keypad')
									? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
									: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
							}`}>
							<Icon icon='HeroCalculator' className='h-6 w-6' />
						</div>
						<div className='text-left'>
							<span
								className={`block text-sm font-bold ${
									watch('has_numeric_keypad')
										? 'text-emerald-900 dark:text-emerald-100'
										: 'text-zinc-700 dark:text-zinc-300'
								}`}>
								Teclado Numérico
							</span>
							<span className='text-xs text-zinc-500'>
								{watch('has_numeric_keypad') ? 'Incluido' : 'No incluido'}
							</span>
						</div>
						<div
							className={`absolute right-4 top-4 h-3 w-3 rounded-full ${
								watch('has_numeric_keypad')
									? 'bg-emerald-500'
									: 'bg-zinc-200 dark:bg-zinc-700'
							}`}
						/>
					</button>

					{/* Backlit Toggle */}
					<button
						type='button'
						onClick={() =>
							!readOnly &&
							setValue('has_backlit_keyboard', !watch('has_backlit_keyboard'))
						}
						className={`group relative flex items-center gap-4 rounded-2xl border p-4 transition-all ${
							watch('has_backlit_keyboard')
								? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-900/10'
								: 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/50'
						}`}>
						<div
							className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
								watch('has_backlit_keyboard')
									? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
									: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
							}`}>
							<Icon icon='HeroLightBulb' className='h-6 w-6' />
						</div>
						<div className='text-left'>
							<span
								className={`block text-sm font-bold ${
									watch('has_backlit_keyboard')
										? 'text-indigo-900 dark:text-indigo-100'
										: 'text-zinc-700 dark:text-zinc-300'
								}`}>
								Retroiluminación
							</span>
							<span className='text-xs text-zinc-500'>
								{watch('has_backlit_keyboard') ? 'Sí' : 'No'}
							</span>
						</div>
						<div
							className={`absolute right-4 top-4 h-3 w-3 rounded-full ${
								watch('has_backlit_keyboard')
									? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
									: 'bg-zinc-200 dark:bg-zinc-700'
							}`}
						/>
					</button>
				</div>
			</div>

			{/* ─── ZONE 1.5: TOUCHPAD (Side Widget) ─── */}
			<div className='lg:col-span-4'>
				<div className='h-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50'>
					<div className='mb-4 flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'>
							<Icon icon='HeroHandRaised' className='h-6 w-6' />
						</div>
						<h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
							Touchpad
						</h3>
					</div>

					<div className='mt-10 grid grid-cols-2 gap-3'>
						{TOUCHPAD_CONDITION_OPTIONS.map((opt) => (
							<SelectionCard
								key={opt.value}
								label={opt.label}
								value={opt.value}
								isSelected={watch('touchpad_condition') === opt.value}
								onClick={() =>
									!readOnly && setValue('touchpad_condition', opt.value)
								}
								variant='compact'
							/>
						))}
					</div>
				</div>
			</div>

			{/* ─── ZONE 2: CHASSIS & STRUCTURE (The "Body") ─── */}
			<div className='mt-2 lg:col-span-12'>
				<div className='rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/20'>
					<h3 className='mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
						<Icon icon='HeroCube' className='h-4 w-4' />
						Estructura y Carcasa
					</h3>

					<div className='flex flex-col gap-8'>
						{/* Cover */}
						<div>
							<div className='mb-3 flex items-center justify-between'>
								<label className='block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
									Tapa Superior <span className='text-red-500'>*</span>
								</label>
								{NOTEBOOK_WARNINGS.cover_condition && (
									<div className='flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'>
										<Icon
											icon='HeroExclamationTriangle'
											className='h-3.5 w-3.5'
										/>
										<span>{NOTEBOOK_WARNINGS.cover_condition}</span>
									</div>
								)}
							</div>
							<div className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4'>
								{COVER_CONDITION_OPTIONS.map((opt) => (
									<SelectionCard
										key={opt.value}
										label={opt.label}
										value={opt.value}
										isSelected={watch('cover_condition') === opt.value}
										onClick={() =>
											!readOnly && setValue('cover_condition', opt.value)
										}
										variant='compact'
									/>
								))}
							</div>
							{errors.cover_condition && (
								<p className='mt-2 text-xs text-red-500'>
									{errors.cover_condition.message}
								</p>
							)}
						</div>

						{/* Hinge */}
						<div>
							<label className='mb-3 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
								Bisagras
							</label>
							<div className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4'>
								{HINGE_CONDITION_OPTIONS.map((opt) => (
									<SelectionCard
										key={opt.value}
										label={opt.label}
										value={opt.value}
										isSelected={watch('hinge_condition') === opt.value}
										onClick={() =>
											!readOnly && setValue('hinge_condition', opt.value)
										}
										variant='compact'
									/>
								))}
							</div>
						</div>

						{/* Bottom */}
						<div>
							<label className='mb-3 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
								Tapa Inferior
							</label>
							<div className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4'>
								{BOTTOM_CONDITION_OPTIONS.map((opt) => (
									<SelectionCard
										key={opt.value}
										label={opt.label}
										value={opt.value}
										isSelected={watch('bottom_condition') === opt.value}
										onClick={() =>
											!readOnly && setValue('bottom_condition', opt.value)
										}
										variant='compact'
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default InputSection;
