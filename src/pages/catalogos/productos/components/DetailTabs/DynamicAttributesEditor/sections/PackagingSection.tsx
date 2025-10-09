import React from 'react';
import Select from '@/components/form/Select';
import { CHARGER_TYPES } from '@/pages/catalogos/productos/constants/product-attributes.constants';
import type { SectionBaseProps } from '../types';

const PackagingSection: React.FC<SectionBaseProps> = ({
	attributes,
	updateAttribute,
	isFieldVisible,
}) => {
	if (!isFieldVisible('packaging')) {
		return null;
	}

	return (
		<div className='rounded-lg border p-4'>
			<h4 className='mb-4 text-sm font-medium'>Empaquetado</h4>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
				<div className='space-y-1'>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							checked={attributes.packaging?.charger_included || false}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute(
									'packaging.charger_included',
									event.target.checked,
								)
							}
							className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
						/>
						<span className='text-sm font-medium'>Cargador incluido</span>
					</label>
				</div>

				{attributes.packaging?.charger_included && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Tipo de cargador</label>
						<Select
							name='packaging_charger_type'
							value={attributes.packaging?.charger_type || ''}
							onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
								updateAttribute('packaging.charger_type', event.target.value)
							}>
							<option value=''>Seleccionar tipo</option>
							{CHARGER_TYPES.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>
				)}
			</div>
		</div>
	);
};

export default PackagingSection;
