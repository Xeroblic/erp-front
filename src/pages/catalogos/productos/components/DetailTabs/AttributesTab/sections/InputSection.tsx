import React from 'react';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';
import { KEYBOARD_CONDITIONS, KEYBOARD_LAYOUTS } from '../constants/review-options';
import type { ReviewSectionProps } from '../types';

const InputSection: React.FC<ReviewSectionProps> = ({ data, updateField }) => (
	<div className='space-y-4'>
		<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
			<div className='space-y-1'>
				<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
					Condición del teclado
				</label>
				<Select
					name='review_keyboard_condition'
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
					Layout de teclado
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

			<div className='flex flex-col justify-end gap-3 pb-1'>
				<Checkbox
					id='review_has_numeric_keypad'
					name='review_has_numeric_keypad'
					checked={data.has_numeric_keypad ?? false}
					onChange={() => updateField('has_numeric_keypad', !data.has_numeric_keypad)}
					label='Teclado numérico'
				/>
				<Checkbox
					id='review_has_backlit_keyboard'
					name='review_has_backlit_keyboard'
					checked={data.has_backlit_keyboard ?? false}
					onChange={() => updateField('has_backlit_keyboard', !data.has_backlit_keyboard)}
					label='Retroiluminación'
				/>
			</div>
		</div>
	</div>
);

export default InputSection;
