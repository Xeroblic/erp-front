import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';
import {
	GENERAL_CONDITIONS,
	COVER_CONDITIONS_NOTEBOOK,
	COVER_CONDITIONS_DESKTOP,
	COVER_CONDITIONS_GENERIC,
	HINGE_CONDITIONS,
	TOUCHPAD_CONDITIONS,
	BOTTOM_CONDITIONS,
	KEYBOARD_CONDITIONS,
	KEYBOARD_LAYOUTS,
	BATTERY_STATUSES,
} from '../constants/review-options';
import type { ReviewSectionProps } from '../types';

const ConditionSection: React.FC<ReviewSectionProps> = ({ data, updateField, productKind }) => {
	const isNotebook = productKind === 'notebook';
	const coverOpts =
		productKind === 'desktop_pc'
			? COVER_CONDITIONS_DESKTOP
			: isNotebook
				? COVER_CONDITIONS_NOTEBOOK
				: COVER_CONDITIONS_GENERIC;

	const showCover = productKind !== 'monitor';
	const showKeyboard = isNotebook;
	const showBattery = isNotebook;

	return (
		<div className='space-y-6'>
			{/* General + Carcasa */}
			<div>
				<h5 className='mb-3 flex items-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200'>
					<span className='inline-block h-1.5 w-1.5 rounded-full bg-amber-500' />
					Condición general & Carcasa
				</h5>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
					<div className='space-y-1'>
						<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
							Condición general
						</label>
						<Select
							name='review_general_condition'
							value={data.general_condition ?? ''}
							onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
								updateField('general_condition', e.target.value)
							}>
							<option value=''>Seleccionar</option>
							{GENERAL_CONDITIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</Select>
					</div>
					{showCover && (
						<div className='space-y-1'>
							<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								Carcasa
							</label>
							<Select
								name='review_cover_condition'
								value={data.cover_condition ?? ''}
								onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
									updateField('cover_condition', e.target.value)
								}>
								<option value=''>Seleccionar</option>
								{coverOpts.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</Select>
						</div>
					)}
					{isNotebook && (
						<>
							<div className='space-y-1'>
								<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
									Bisagras
								</label>
								<Select
									name='review_hinge'
									value={data.hinge_condition ?? ''}
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
										updateField('hinge_condition', e.target.value)
									}>
									<option value=''>Seleccionar</option>
									{HINGE_CONDITIONS.map((o) => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</Select>
							</div>
							<div className='space-y-1'>
								<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
									Touchpad
								</label>
								<Select
									name='review_touchpad'
									value={data.touchpad_condition ?? ''}
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
										updateField('touchpad_condition', e.target.value)
									}>
									<option value=''>Seleccionar</option>
									{TOUCHPAD_CONDITIONS.map((o) => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</Select>
							</div>
							<div className='space-y-1'>
								<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
									Parte inferior
								</label>
								<Select
									name='review_bottom'
									value={data.bottom_condition ?? ''}
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
										updateField('bottom_condition', e.target.value)
									}>
									<option value=''>Seleccionar</option>
									{BOTTOM_CONDITIONS.map((o) => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</Select>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Teclado (notebook) */}
			{showKeyboard && (
				<div>
					<h5 className='mb-3 flex items-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200'>
						<span className='inline-block h-1.5 w-1.5 rounded-full bg-emerald-500' />
						Teclado
					</h5>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
						<div className='space-y-1'>
							<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								Condición
							</label>
							<Select
								name='review_keyboard_cond'
								value={data.keyboard_condition ?? ''}
								onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
									updateField('keyboard_condition', e.target.value)
								}>
								<option value=''>Seleccionar</option>
								{KEYBOARD_CONDITIONS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</Select>
						</div>
						<div className='space-y-1'>
							<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								Layout
							</label>
							<Select
								name='review_keyboard_layout'
								value={data.keyboard_layout ?? ''}
								onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
									updateField('keyboard_layout', e.target.value)
								}>
								<option value=''>Seleccionar</option>
								{KEYBOARD_LAYOUTS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</Select>
						</div>
						<div className='flex flex-col justify-end gap-2 pb-1'>
							<Checkbox
								id='review_numpad'
								name='review_numpad'
								checked={data.has_numeric_keypad ?? false}
								onChange={() =>
									updateField('has_numeric_keypad', !data.has_numeric_keypad)
								}
								label='Numérico'
							/>
							<Checkbox
								id='review_backlit'
								name='review_backlit'
								checked={data.has_backlit_keyboard ?? false}
								onChange={() =>
									updateField('has_backlit_keyboard', !data.has_backlit_keyboard)
								}
								label='Retroiluminación'
							/>
						</div>
					</div>
				</div>
			)}

			{/* Batería (notebook) */}
			{showBattery && (
				<div>
					<h5 className='mb-3 flex items-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200'>
						<span className='inline-block h-1.5 w-1.5 rounded-full bg-sky-500' />
						Batería
					</h5>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
						<div className='space-y-1'>
							<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								Estado
							</label>
							<Select
								name='review_battery_status'
								value={data.battery_status ?? ''}
								onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
									updateField('battery_status', e.target.value)
								}>
								<option value=''>Seleccionar</option>
								{BATTERY_STATUSES.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</Select>
						</div>
						{data.battery_status !== 'no_battery' && (
							<div className='space-y-1'>
								<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
									Porcentaje
								</label>
								<Input
									name='review_battery_pct'
									type='number'
									placeholder='0 – 100'
									value={data.battery_percentage ?? ''}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										updateField('battery_percentage', Number(e.target.value))
									}
								/>
							</div>
						)}
						<div className='space-y-1'>
							<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								Salud
							</label>
							<Input
								name='review_battery_health'
								placeholder='Ej: Good, Normal'
								value={data.battery_health ?? ''}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									updateField('battery_health', e.target.value)
								}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ConditionSection;
