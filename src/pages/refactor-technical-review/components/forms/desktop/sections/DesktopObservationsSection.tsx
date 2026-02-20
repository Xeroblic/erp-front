import React from 'react';
import { Controller } from 'react-hook-form';
import Textarea from '@/components/form/Textarea';
import type { FormSectionProps } from '../../shared/types';
import type { DesktopFormData } from '../../../validation/desktop.schema';
import { getDesktopLabel } from '../../../translations/desktop.labels';
import { DESKTOP_HINTS, DESKTOP_PLACEHOLDERS } from '../../../constants/desktop/desktop.hints';

const DesktopObservationsSection: React.FC<FormSectionProps<DesktopFormData>> = ({
	control,
	errors,
	readOnly,
}) => {
	return (
		<div className='space-y-6'>
			{/* Observations */}
			<div className='rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:bg-zinc-100/50 dark:border-zinc-700 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50'>
				<label className='mb-3 block text-sm font-bold text-zinc-700 dark:text-zinc-200'>
					{getDesktopLabel('observations')}
				</label>
				<Controller
					name='observations'
					control={control}
					render={({ field }) => (
						<Textarea
							{...field}
							value={field.value || ''}
							placeholder={DESKTOP_PLACEHOLDERS.observations}
							disabled={readOnly}
							rows={6}
							className={`w-full resize-none ${
								errors.observations ? 'border-red-500' : ''
							}`}
						/>
					)}
				/>
				{errors.observations && (
					<p className='mt-1 text-xs text-red-500'>{errors.observations.message}</p>
				)}
				<p className='mt-1 text-xs text-zinc-400'>{DESKTOP_HINTS.observations}</p>
			</div>

			{/* Extra Attributes */}
			<div className='rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:bg-zinc-100/50 dark:border-zinc-700 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50'>
				<label className='mb-3 block text-sm font-bold text-zinc-700 dark:text-zinc-200'>
					{getDesktopLabel('extra_attributes')}
				</label>
				<Controller
					name='extra_attributes'
					control={control}
					render={({ field }) => (
						<Textarea
							{...field}
							value={
								typeof field.value === 'string'
									? field.value
									: field.value
										? JSON.stringify(field.value, null, 2)
										: ''
							}
							onChange={(e) => field.onChange(e.target.value)}
							placeholder='Atributos adicionales (JSON u otro formato)'
							disabled={readOnly}
							rows={4}
							className='w-full resize-none font-mono text-sm'
						/>
					)}
				/>
				<p className='mt-1 text-xs text-zinc-400'>{DESKTOP_HINTS.extra_attributes}</p>
			</div>
		</div>
	);
};

export default DesktopObservationsSection;
