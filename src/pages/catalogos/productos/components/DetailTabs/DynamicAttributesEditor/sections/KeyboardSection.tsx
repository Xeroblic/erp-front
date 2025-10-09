import React from 'react';
import Select from '@/components/form/Select';
import { KEYBOARD_LAYOUTS } from '@/pages/catalogos/productos/constants/product-attributes.constants';
import type { SectionBaseProps } from '../types';

const KeyboardSection: React.FC<SectionBaseProps> = ({
	attributes,
	updateAttribute,
	isFieldVisible,
}) => {
	if (!isFieldVisible('keyboard')) {
		return null;
	}

	return (
		<div className='rounded-lg border p-4'>
			<h4 className='mb-4 text-sm font-medium'>Teclado</h4>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
				<div className='space-y-1'>
					<label className='text-sm font-medium'>Distribución</label>
					<Select
						name='keyboard_layout'
						value={attributes.keyboard?.layout || ''}
						onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
							updateAttribute('keyboard.layout', event.target.value)
						}>
						<option value=''>Seleccionar distribución</option>
						{KEYBOARD_LAYOUTS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>

				<div className='space-y-1'>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							checked={attributes.keyboard?.backlit || false}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute('keyboard.backlit', event.target.checked)
							}
							className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
						/>
						<span className='text-sm font-medium'>Retroiluminación</span>
					</label>
				</div>
			</div>
		</div>
	);
};

export default KeyboardSection;
