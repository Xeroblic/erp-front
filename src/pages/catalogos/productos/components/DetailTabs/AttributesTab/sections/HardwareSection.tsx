import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import { STORAGE_TECHNOLOGIES } from '../constants/review-options';
import type { ReviewSectionProps } from '../types';

const HardwareSection: React.FC<ReviewSectionProps> = ({ data, updateField }) => (
	<div className='space-y-4'>
		<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
			<div className='space-y-1'>
				<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
					Procesador
				</label>
				<Input
					name='review_processor'
					placeholder='Ej: Intel Core i5-8350U'
					value={data.processor ?? ''}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						updateField('processor', e.target.value)
					}
				/>
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
					RAM (tamaño)
				</label>
				<Input
					name='review_ram_size'
					placeholder='Ej: 8GB, 16GB'
					value={data.ram_size ?? ''}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						updateField('ram_size', e.target.value)
					}
				/>
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
					RAM slots
				</label>
				<Input
					name='review_ram_slots'
					placeholder='Ej: 2'
					value={data.ram_slots ?? ''}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						updateField('ram_slots', e.target.value)
					}
				/>
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
					Tipo RAM
				</label>
				<Input
					name='review_ram_type'
					placeholder='Ej: DDR4'
					value={data.ram_type ?? ''}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						updateField('ram_type', e.target.value)
					}
				/>
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
					Almacenamiento (tamaño)
				</label>
				<Input
					name='review_storage_size'
					placeholder='Ej: 256GB, 1TB'
					value={data.storage_size ?? ''}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						updateField('storage_size', e.target.value)
					}
				/>
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
					Tecnología almacenamiento
				</label>
				<Select
					name='review_storage_technology'
					value={data.storage_technology ?? ''}
					onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
						updateField('storage_technology', e.target.value)
					}>
					<option value=''>Seleccionar</option>
					{STORAGE_TECHNOLOGIES.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</Select>
			</div>
		</div>
	</div>
);

export default HardwareSection;
