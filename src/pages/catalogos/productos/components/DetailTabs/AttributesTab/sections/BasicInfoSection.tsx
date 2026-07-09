import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import { GENERAL_CONDITIONS } from '../constants/review-options';
import type { ReviewSectionProps } from '../types';

const BasicInfoSection: React.FC<ReviewSectionProps> = ({ data, updateField, productKind }) => {
	const showLine = productKind !== 'aio';

	return (
		<div className='space-y-4'>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
				<div className='space-y-1'>
					<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
						Marca
					</label>
					<Input
						name='review_brand'
						placeholder='Ej: Lenovo, Dell, HP'
						value={data.brand ?? ''}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							updateField('brand', e.target.value)
						}
					/>
				</div>

				<div className='space-y-1'>
					<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
						Modelo
					</label>
					<Input
						name='review_model'
						placeholder='Ej: ThinkPad T480'
						value={data.model ?? ''}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							updateField('model', e.target.value)
						}
					/>
				</div>

				{showLine && (
					<div className='space-y-1'>
						<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
							Línea
						</label>
						<Input
							name='review_line'
							placeholder='Ej: ThinkPad, Latitude'
							value={data.line ?? ''}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								updateField('line', e.target.value)
							}
						/>
					</div>
				)}

				<div className='space-y-1'>
					<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
						Condición general
					</label>
					<Select
						name='review_general_condition'
						value={data.general_condition ?? ''}
						onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
							updateField('general_condition', e.target.value)
						}>
						<option value=''>Seleccionar condición</option>
						{GENERAL_CONDITIONS.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</Select>
				</div>
			</div>
		</div>
	);
};

export default BasicInfoSection;
