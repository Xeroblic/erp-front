import React from 'react';
import type { ReviewSectionProps } from '../types';

const ObservationsSection: React.FC<ReviewSectionProps> = ({ data, updateField }) => (
	<div className='space-y-4'>
		<div className='space-y-1'>
			<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
				Observaciones generales
			</label>
			<textarea
				name='review_observations'
				rows={4}
				className='w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-blue-400'
				placeholder='Notas adicionales sobre el equipo…'
				value={data.observations ?? ''}
				onChange={(e) => updateField('observations', e.target.value)}
			/>
		</div>
	</div>
);

export default ObservationsSection;
