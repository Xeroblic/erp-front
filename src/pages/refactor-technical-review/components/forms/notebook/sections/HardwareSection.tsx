import React from 'react';
import { Controller } from 'react-hook-form';
import Input from '@/components/form/Input';
import type { FormSectionProps } from '../../shared/types';
import type { NotebookFormData } from '../../../validation/notebook.schema';
import { getNotebookLabel } from '../../../translations/notebook.labels';
import { NOTEBOOK_HINTS, NOTEBOOK_PLACEHOLDERS } from '../../../constants/notebook/notebook.hints';
import { SelectionCard } from '../../../ui/SelectionCard';
import {
	STORAGE_TECHNOLOGY_OPTIONS,
	RAM_TYPE_OPTIONS,
} from '../../../constants/notebook/notebook.options';
import { ProcessorSelector } from '../../../ui/selectors/ProcessorSelector';

const HardwareSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	control,
	errors,
	readOnly,
	watch,
	setValue,
}) => {
	const ramType = watch('ram_type');
	const storageTech = watch('storage_technology');

	return (
		<div className='space-y-6'>
			{/* Processor */}
			<div className='rounded-xl border border-green-200 bg-green-500/10 p-6 transition-colors duration-200 hover:bg-green-500/20 dark:border-green-800 dark:bg-green-900/10 dark:hover:bg-green-900/20'>
				<label className='mb-4 block text-sm font-bold text-green-800 dark:text-green-200'>
					{getNotebookLabel('processor')} <span className='text-red-500'>*</span>
				</label>
				<Controller
					name='processor'
					control={control}
					render={({ field }) => (
						<ProcessorSelector
							deviceType='Notebook'
							value={field.value || ''}
							onChange={field.onChange}
							readOnly={readOnly}
						/>
					)}
				/>
				{errors.processor && (
					<p className='mt-2 text-xs text-red-500'>{errors.processor.message}</p>
				)}
			</div>

			<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
				{/* Memory RAM Card */}
				<div className='rounded-xl border border-blue-200 bg-blue-500/20 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-blue-500/30 dark:border-blue-800 dark:bg-blue-900/10 dark:hover:bg-blue-900/30'>
					<label className='mb-3 block text-sm font-bold text-blue-800 dark:text-blue-200'>
						Memoria RAM
					</label>

					{/* RAM Type Selection Cards */}
					<label className='mb-2 block text-xs font-semibold text-zinc-500'>Tipo</label>
					<div className='mb-3 grid grid-cols-2 gap-2 md:grid-cols-4'>
						{RAM_TYPE_OPTIONS.map((opt) => (
							<SelectionCard
								key={opt.value}
								label={opt.label}
								value={opt.value}
								isSelected={ramType === opt.value}
								onClick={() => !readOnly && setValue('ram_type', opt.value)}
							/>
						))}
					</div>

					{/* RAM Size */}
					<div className='mb-3'>
						<label className='mb-1 block text-xs font-semibold text-zinc-500'>
							{getNotebookLabel('ram_size')} <span className='text-red-500'>*</span>
						</label>
						<Controller
							name='ram_size'
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									value={field.value || ''}
									placeholder={NOTEBOOK_PLACEHOLDERS.ram_size}
									disabled={readOnly}
									className={errors.ram_size ? 'border-red-500' : ''}
								/>
							)}
						/>
						{errors.ram_size && (
							<p className='mt-1 text-xs text-red-500'>{errors.ram_size.message}</p>
						)}
					</div>

					{/* RAM Slots */}
					<div>
						<label className='mb-1 block text-xs font-semibold text-zinc-500'>
							{getNotebookLabel('ram_slots')}
						</label>
						<Controller
							name='ram_slots'
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									value={field.value || ''}
									placeholder={NOTEBOOK_PLACEHOLDERS.ram_slots}
									disabled={readOnly}
								/>
							)}
						/>
						<p className='mt-1 text-xs text-zinc-400'>{NOTEBOOK_HINTS.ram_slots}</p>
					</div>
				</div>

				{/* Storage Card */}
				<div className='rounded-xl border border-purple-200 bg-purple-500/20 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-purple-500/30 dark:border-purple-800 dark:bg-purple-900/10 dark:hover:bg-purple-900/30'>
					<label className='mb-3 block text-sm font-bold text-purple-800 dark:text-purple-200'>
						Almacenamiento
					</label>

					{/* Storage Technology Selection Cards */}
					<label className='mb-2 block text-xs font-semibold text-zinc-500'>
						Tecnología
					</label>
					<div className='mb-3 grid grid-cols-2 gap-2 md:grid-cols-3'>
						{STORAGE_TECHNOLOGY_OPTIONS.map((opt) => (
							<SelectionCard
								key={opt.value}
								label={opt.label}
								value={opt.value}
								isSelected={storageTech === opt.value}
								onClick={() =>
									!readOnly && setValue('storage_technology', opt.value)
								}
							/>
						))}
					</div>
					{errors.storage_technology && (
						<p className='mb-2 text-xs text-red-500'>
							{errors.storage_technology.message}
						</p>
					)}

					{/* Storage Size */}
					<label className='mb-1 block text-xs font-semibold text-zinc-500'>
						{getNotebookLabel('storage_size')} <span className='text-red-500'>*</span>
					</label>
					<Controller
						name='storage_size'
						control={control}
						render={({ field }) => (
							<Input
								{...field}
								value={field.value || ''}
								placeholder={NOTEBOOK_PLACEHOLDERS.storage_size}
								disabled={readOnly}
								className={errors.storage_size ? 'border-red-500' : ''}
							/>
						)}
					/>
					{errors.storage_size && (
						<p className='mt-1 text-xs text-red-500'>{errors.storage_size.message}</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default HardwareSection;
