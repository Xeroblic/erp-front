import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import {
	RAM_CAPACITIES,
	RAM_CHANNELS,
	RAM_MODULES,
	RAM_TYPES,
} from '@/pages/catalogos/productos/constants/product-attributes.constants';
import type { SectionBaseProps } from '../types';

const RamSection: React.FC<SectionBaseProps> = ({
	attributes,
	updateAttribute,
	isFieldVisible,
}) => {
	if (!isFieldVisible('ram')) {
		return null;
	}

	return (
		<div className='rounded-lg border p-4'>
			<h4 className='mb-4 text-sm font-medium'>Memoria RAM</h4>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
				<div className='space-y-1'>
					<label className='text-sm font-medium'>Tipo</label>
					<Select
						name='ram_type'
						value={attributes.ram?.type || ''}
						onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
							updateAttribute('ram.type', event.target.value)
						}>
						<option value=''>Seleccionar tipo</option>
						{RAM_TYPES.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>

				<div className='space-y-1'>
					<label className='text-sm font-medium'>Capacidad</label>
					<Select
						name='ram_capacity'
						value={attributes.ram?.capacity_gb || ''}
						onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
							updateAttribute('ram.capacity_gb', Number(event.target.value))
						}>
						<option value=''>Seleccionar capacidad</option>
						{RAM_CAPACITIES.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>

				<div className='space-y-1'>
					<label className='text-sm font-medium'>Módulos</label>
					<Select
						name='ram_modules'
						value={attributes.ram?.modules || ''}
						onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
							updateAttribute('ram.modules', Number(event.target.value))
						}>
						<option value=''>Seleccionar módulos</option>
						{RAM_MODULES.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>

				<div className='space-y-1'>
					<label className='text-sm font-medium'>Canal</label>
					<Select
						name='ram_channel'
						value={attributes.ram?.channel || ''}
						onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
							updateAttribute('ram.channel', event.target.value)
						}>
						<option value=''>Seleccionar canal</option>
						{RAM_CHANNELS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>

				<div className='space-y-1'>
					<label className='text-sm font-medium'>Máximo soportado (GB)</label>
					<Select
						name='ram_max_supported'
						value={attributes.ram?.max_supported_gb || ''}
						onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
							updateAttribute('ram.max_supported_gb', Number(event.target.value))
						}>
						<option value=''>Seleccionar máximo</option>
						{RAM_CAPACITIES.map((option) => (
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
							checked={attributes.ram?.upgradable || false}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute('ram.upgradable', event.target.checked)
							}
							className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
						/>
						<span className='text-sm font-medium'>Actualizable</span>
					</label>
				</div>
			</div>
		</div>
	);
};

export default RamSection;
