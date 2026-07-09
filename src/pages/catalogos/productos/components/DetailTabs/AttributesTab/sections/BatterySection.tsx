import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import { BATTERY_STATUSES } from '../constants/review-options';
import type { ReviewSectionProps } from '../types';

const BatterySection: React.FC<ReviewSectionProps> = ({ data, updateField }) => (
	<div className='space-y-4'>
		<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
			<div className='space-y-1'>
				<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
					Estado de batería
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
						Porcentaje de batería
					</label>
					<Input
						name='review_battery_percentage'
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
					Salud de batería
				</label>
				<Input
					name='review_battery_health'
					placeholder='Ej: Good, Normal, Replace'
					value={data.battery_health ?? ''}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						updateField('battery_health', e.target.value)
					}
				/>
			</div>
		</div>
	</div>
);

export default BatterySection;
