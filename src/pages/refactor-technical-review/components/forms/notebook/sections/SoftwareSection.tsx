import { Controller } from 'react-hook-form';
import { LuMonitor, LuInfo } from 'react-icons/lu';
import React from 'react';
import type { FormSectionProps } from '../../shared/types';
import type { NotebookFormData } from '../../../validation/notebook.schema';
import { getNotebookLabel } from '../../../translations/notebook.labels';
import { NOTEBOOK_HINTS } from '../../../constants/notebook/notebook.hints';
// Update path as correct
import { SoSelector } from '../../../ui/selectors/SoSelector';

const SoftwareSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	control,
	readOnly,
	watch,
}) => {
	// Escuchamos el valor en tiempo real
	const currentOS = watch('operating_system');

	return (
		<div className='space-y-6'>
			<div className='relative mx-auto max-w-2xl rounded-2xl border border-blue-200 bg-white p-6 shadow-xl shadow-blue-500/5 dark:border-blue-900/30 dark:bg-zinc-950'>
				{/* Header con Badge de Estado */}
				<div className='mb-8 flex flex-col items-center gap-2'>
					<div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'>
						<LuMonitor className='h-6 w-6' />
					</div>
					<label className='text-lg font-black tracking-tight text-zinc-800 dark:text-zinc-100'>
						{getNotebookLabel('operating_system')}
					</label>

					{/* AQUÍ APARECE EL SO SELECCIONADO SIEMPRE VISIBLE */}
					<div
						className={`rounded-full border px-4 py-1 text-xs font-bold transition-all duration-500 ${
							currentOS
								? 'border-emerald-200 bg-emerald-100 text-emerald-700 opacity-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
								: 'border-zinc-200 bg-zinc-100 text-zinc-400 opacity-50 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-500'
						}`}>
						{currentOS ? `Seleccionado: ${currentOS}` : 'Pendiente de selección'}
					</div>
				</div>

				<Controller
					name='operating_system'
					control={control}
					render={({ field }) => (
						<SoSelector
							value={field.value || ''}
							onChange={field.onChange}
							readOnly={readOnly}
						/>
					)}
				/>

				<div className='mt-6 flex items-center justify-center gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/50'>
					<LuInfo className='h-4 w-4 text-blue-500' />
					<p className='text-xs font-medium text-zinc-500'>
						{NOTEBOOK_HINTS.operating_system}
					</p>
				</div>
			</div>
		</div>
	);
};

export default SoftwareSection;
