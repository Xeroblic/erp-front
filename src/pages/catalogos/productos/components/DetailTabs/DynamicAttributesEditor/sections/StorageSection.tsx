import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import {
	STORAGE_CAPACITIES,
	STORAGE_CONFIGS,
	STORAGE_TYPES,
} from '@/pages/catalogos/productos/constants/product-attributes.constants';
import type { SectionBaseProps } from '../types';

const StorageSection: React.FC<SectionBaseProps> = ({
	attributes,
	updateAttribute,
	isFieldVisible,
}) => {
	if (!isFieldVisible('storage')) {
		return null;
	}

	const isHybrid = attributes.storage?.config === 'hybrid';

	return (
		<div className='rounded-lg border p-4'>
			<h4 className='mb-4 text-sm font-medium'>Almacenamiento</h4>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
				<div className='space-y-1'>
					<label className='text-sm font-medium'>Configuración</label>
					<Select
						name='storage_config'
						value={attributes.storage?.config || ''}
						onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
							updateAttribute('storage.config', event.target.value)
						}>
						<option value=''>Seleccionar configuración</option>
						{STORAGE_CONFIGS.map((option) => (
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
							checked={attributes.storage?.upgradable || false}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute('storage.upgradable', event.target.checked)
							}
							className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
						/>
						<span className='text-sm font-medium'>Actualizable</span>
					</label>
				</div>

				{attributes.storage?.upgradable && (
					<>
						<div className='space-y-1'>
							<label className='text-sm font-medium'>Máximo soportado (GB)</label>
							<Input
								name='storage_max_supported_gb'
								type='number'
								placeholder='Ej: 2000'
								value={attributes.storage?.max_supported_gb || ''}
								onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
									updateAttribute(
										'storage.max_supported_gb',
										Number(event.target.value),
									)
								}
							/>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Slots M.2 disponibles</label>
							<Input
								name='storage_available_slots_m2'
								type='number'
								placeholder='Ej: 1'
								value={attributes.storage?.available_slots?.m2 || ''}
								onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
									updateAttribute(
										'storage.available_slots.m2',
										Number(event.target.value),
									)
								}
							/>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Slots SATA disponibles</label>
							<Input
								name='storage_available_slots_sata'
								type='number'
								placeholder='Ej: 2'
								value={attributes.storage?.available_slots?.sata || ''}
								onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
									updateAttribute(
										'storage.available_slots.sata',
										Number(event.target.value),
									)
								}
							/>
						</div>
					</>
				)}
			</div>

			<div className='mt-4'>
				<h5 className='mb-2 text-sm font-medium'>Almacenamiento primario</h5>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Tipo</label>
						<Select
							name='storage_primary_type'
							value={attributes.storage?.primary?.type || ''}
							onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
								updateAttribute('storage.primary.type', event.target.value)
							}>
							<option value=''>Seleccionar tipo</option>
							{STORAGE_TYPES.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>

					<div className='space-y-1'>
						<label className='text-sm font-medium'>Capacidad</label>
						<Select
							name='storage_primary_capacity'
							value={attributes.storage?.primary?.capacity_gb || ''}
							onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
								updateAttribute(
									'storage.primary.capacity_gb',
									Number(event.target.value),
								)
							}>
							<option value=''>Seleccionar capacidad</option>
							{STORAGE_CAPACITIES.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>
				</div>
			</div>

			{isHybrid && (
				<div className='mt-4'>
					<h5 className='mb-2 text-sm font-medium'>Almacenamiento secundario</h5>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div className='space-y-1'>
							<label className='text-sm font-medium'>Tipo</label>
							<Select
								name='storage_secondary_type'
								value={attributes.storage?.secondary?.type || ''}
								onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('storage.secondary.type', event.target.value)
								}>
								<option value=''>Seleccionar tipo</option>
								{STORAGE_TYPES.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Capacidad</label>
							<Select
								name='storage_secondary_capacity'
								value={attributes.storage?.secondary?.capacity_gb || ''}
								onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
									updateAttribute(
										'storage.secondary.capacity_gb',
										Number(event.target.value),
									)
								}>
								<option value=''>Seleccionar capacidad</option>
								{STORAGE_CAPACITIES.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default StorageSection;
