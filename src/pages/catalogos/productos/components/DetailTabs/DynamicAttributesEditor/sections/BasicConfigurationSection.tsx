import React from 'react';
import Select from '@/components/form/Select';
import {
	CATEGORY_GRADES,
	PRODUCT_DEVICE_TYPES,
} from '@/pages/catalogos/productos/constants/product-attributes.constants';
import type { SectionBaseProps } from '../types';

interface BasicConfigurationSectionProps extends SectionBaseProps {}

const BasicConfigurationSection: React.FC<BasicConfigurationSectionProps> = ({
	attributes,
	updateAttribute,
	currentProductKind,
}) => {
	return (
		<div className='rounded-lg border p-4'>
			<h4 className='mb-4 text-sm font-medium'>Configuración básica</h4>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
				<div className='space-y-1'>
					<label className='text-sm font-medium'>Tipo de producto</label>
					<Select
						name='product_kind'
						value={
							PRODUCT_DEVICE_TYPES.some(opt => opt.value === currentProductKind)
								? currentProductKind
								: ''
						}
						onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
							updateAttribute('product_kind', event.target.value)
						}>
						<option value=''>Seleccionar tipo</option>
						{PRODUCT_DEVICE_TYPES.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>

				<div className='space-y-1'>
					<label className='text-sm font-medium'>Grado de categoría</label>
					<Select
						name='category_grade'
						value={attributes.category_grade || ''}
						onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
							updateAttribute('category_grade', event.target.value)
						}>
						<option value=''>Seleccionar grado</option>
						{CATEGORY_GRADES.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>
			</div>
		</div>
	);
};

export default BasicConfigurationSection;
