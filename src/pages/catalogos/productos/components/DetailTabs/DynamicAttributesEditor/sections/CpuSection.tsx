import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import {
	CPU_BRANDS,
	CPU_FAMILIES,
	CPU_GENERATIONS,
} from '@/pages/catalogos/productos/constants/product-attributes.constants';
import type { CpuSectionProps } from '../types';

const CpuSection: React.FC<CpuSectionProps> = ({
	attributes,
	updateAttribute,
	currentCpuBrand,
	isFieldVisible,
}) => {
	if (!isFieldVisible('cpu')) {
		return null;
	}

	return (
		<div className='rounded-lg border p-4'>
			<h4 className='mb-4 text-sm font-medium'>Procesador (CPU)</h4>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
				<div className='space-y-1'>
					<label className='text-sm font-medium'>Marca</label>
					<Select
						name='cpu_brand'
						value={attributes.cpu?.brand || ''}
						onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
							updateAttribute('cpu.brand', event.target.value)
						}>
						<option value=''>Seleccionar marca</option>
						{CPU_BRANDS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>

				{currentCpuBrand && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Familia</label>
						<Select
							name='cpu_family'
							value={attributes.cpu?.family || ''}
							onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
								updateAttribute('cpu.family', event.target.value)
							}>
							<option value=''>Seleccionar familia</option>
							{CPU_FAMILIES[currentCpuBrand as keyof typeof CPU_FAMILIES]?.map(
								(option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								),
							)}
						</Select>
					</div>
				)}

				{currentCpuBrand && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Generación</label>
						<Select
							name='cpu_generation'
							value={attributes.cpu?.generation || ''}
							onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
								updateAttribute('cpu.generation', event.target.value)
							}>
							<option value=''>Seleccionar generación</option>
							{CPU_GENERATIONS[
								currentCpuBrand as keyof typeof CPU_GENERATIONS
							]?.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>
				)}

				<div className='space-y-1'>
					<label className='text-sm font-medium'>Modelo</label>
					<Input
						name='cpu_model'
						placeholder='Ej: i5-8500'
						value={attributes.cpu?.model || ''}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
							updateAttribute('cpu.model', event.target.value)
						}
					/>
				</div>

				{isFieldVisible('cpu.cores') && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Núcleos</label>
						<Input
							name='cpu_cores'
							type='number'
							placeholder='Ej: 6'
							value={attributes.cpu?.cores || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute('cpu.cores', Number(event.target.value))
							}
						/>
					</div>
				)}

				{isFieldVisible('cpu.threads') && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Hilos</label>
						<Input
							name='cpu_threads'
							type='number'
							placeholder='Ej: 6'
							value={attributes.cpu?.threads || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute('cpu.threads', Number(event.target.value))
							}
						/>
					</div>
				)}

				{isFieldVisible('cpu.base_clock_mhz') && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Frecuencia base (MHz)</label>
						<Input
							name='cpu_base_clock_mhz'
							type='number'
							placeholder='Ej: 3200'
							value={attributes.cpu?.base_clock_mhz || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute(
									'cpu.base_clock_mhz',
									Number(event.target.value),
								)
							}
						/>
					</div>
				)}

				{isFieldVisible('cpu.boost_clock_mhz') && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Frecuencia turbo (MHz)</label>
						<Input
							name='cpu_boost_clock_mhz'
							type='number'
							placeholder='Ej: 4100'
							value={attributes.cpu?.boost_clock_mhz || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute(
									'cpu.boost_clock_mhz',
									Number(event.target.value),
								)
							}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default CpuSection;
