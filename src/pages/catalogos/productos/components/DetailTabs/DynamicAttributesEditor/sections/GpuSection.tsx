import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import { GPU_TYPES } from '@/pages/catalogos/productos/constants/product-attributes.constants';
import type { SectionBaseProps } from '../types';

const GpuSection: React.FC<SectionBaseProps> = ({
	attributes,
	updateAttribute,
	isFieldVisible,
}) => {
	if (!isFieldVisible('gpu')) {
		return null;
	}

	return (
		<div className='rounded-lg border p-4'>
			<h4 className='mb-4 text-sm font-medium'>Tarjeta gráfica (GPU)</h4>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
				<div className='space-y-1'>
					<label className='text-sm font-medium'>Tipo</label>
					<Select
						name='gpu_type'
						value={attributes.gpu?.type || ''}
						onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
							updateAttribute('gpu.type', event.target.value)
						}>
						<option value=''>Seleccionar tipo</option>
						{GPU_TYPES.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>

				<div className='space-y-1'>
					<label className='text-sm font-medium'>Modelo</label>
					<Input
						name='gpu_model'
						placeholder='Ej: Intel UHD Graphics 630'
						value={attributes.gpu?.model || ''}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
							updateAttribute('gpu.model', event.target.value)
						}
					/>
				</div>

				{isFieldVisible('gpu.vram_gb') && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>VRAM (GB)</label>
						<Input
							name='gpu_vram_gb'
							type='number'
							placeholder='Ej: 4'
							value={attributes.gpu?.vram_gb || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute('gpu.vram_gb', Number(event.target.value))
							}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default GpuSection;
