import React from 'react';
import { Controller } from 'react-hook-form';
import { FormSectionProps } from '../../shared/types';
import { AioFormData } from '../../../validation/aio.schema';
import Input from '@/components/form/Input';
import { AIO_HINTS, AIO_PLACEHOLDERS } from '../../../constants/aio/aio.hints';
import { getAioLabel } from '../../../translations/aio.labels';
import { STORAGE_TECHNOLOGY_OPTIONS } from '../../../constants/aio/aio.options';

import { ProcessorSelector } from '../../../ui/selectors/ProcessorSelector';
import Icon from '@/components/icon/Icon';

interface SelectionCardProps {
	label: string;
	value: string;
	isSelected: boolean;
	onClick: () => void;
	hint?: string;
	variant?: string;
	color?: string;
	className?: string;
}

/** Selection Card UI for Storage Technology */
const SelectionCard = ({ label, value, isSelected, onClick, hint }: SelectionCardProps) => (
	<div
		onClick={onClick}
		data-value={value}
		className={`cursor-pointer rounded-lg border-2 p-3 transition-colors duration-200 ${
			isSelected
				? 'border-orange-500 bg-orange-500/20 dark:border-orange-500 dark:bg-orange-500/30'
				: 'border-orange-200/50 bg-orange-500/5 hover:border-orange-300 dark:border-orange-800/50 dark:bg-orange-900/10 dark:hover:border-orange-700'
		}`}>
		<div className='flex items-center justify-between'>
			<span
				className={`font-medium ${
					isSelected
						? 'text-orange-900 dark:text-orange-100'
						: 'text-orange-700 dark:text-orange-300'
				}`}>
				{label}
			</span>
			<div
				className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
					isSelected
						? 'border-orange-500 bg-orange-500 dark:border-orange-400 dark:bg-orange-400'
						: 'border-orange-300 dark:border-orange-700'
				}`}>
				{isSelected && <Icon icon='HeroCheck' className='h-3 w-3 text-white' />}
			</div>
		</div>
		{hint && (
			<p className='mt-1 text-[10px] text-orange-600/70 dark:text-orange-400/70'>{hint}</p>
		)}
	</div>
);

const AioHardwareSection: React.FC<FormSectionProps<AioFormData>> = ({
	control,
	errors,
	readOnly,
	setValue,
	watch,
}) => {
	const storageTech = watch('storage_technology');

	return (
		<div className='space-y-6'>
			{/* Processor */}
			<div className='rounded-xl border border-indigo-200 bg-indigo-500/10 p-5 transition-colors duration-200 hover:cursor-pointer hover:bg-indigo-500/20 dark:border-indigo-800/50 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20'>
				<label className='mb-3 flex items-center gap-2 text-sm font-bold text-indigo-800 dark:text-indigo-200'>
					<Icon icon='HeroCpuChip' className='h-5 w-5' />
					{getAioLabel('processor')} <span className='text-red-500'>*</span>
				</label>
				<Controller
					name='processor'
					control={control}
					render={({ field }) => (
						<ProcessorSelector
							deviceType='Desktop'
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

			{/* RAM Memory Group */}
			<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
				{/* RAM Size */}
				<div className='rounded-xl border border-teal-200 bg-teal-500/10 p-5 transition-colors duration-200 hover:cursor-pointer hover:bg-teal-500/20 dark:border-teal-800/50 dark:bg-teal-900/10 dark:hover:bg-teal-900/20'>
					<label className='mb-3 flex items-center gap-2 text-sm font-bold text-teal-800 dark:text-teal-200'>
						<Icon icon='HeroServerStack' className='h-5 w-5' />
						{getAioLabel('ram_size')} <span className='text-red-500'>*</span>
					</label>
					<Controller
						name='ram_size'
						control={control}
						render={({ field }) => (
							<Input
								{...field}
								value={field.value || ''}
								placeholder={AIO_PLACEHOLDERS.ram_size}
								disabled={readOnly}
								className={errors.ram_size ? 'border-red-500' : ''}
							/>
						)}
					/>
					{errors.ram_size && (
						<p className='mt-2 text-xs text-red-500'>{errors.ram_size.message}</p>
					)}
				</div>

				{/* RAM Slots */}
				<div className='rounded-xl border border-cyan-200 bg-cyan-500/10 p-5 transition-colors duration-200 hover:cursor-pointer hover:bg-cyan-500/20 dark:border-cyan-800/50 dark:bg-cyan-900/10 dark:hover:bg-cyan-900/20'>
					<label className='mb-3 flex items-center gap-2 text-sm font-bold text-cyan-800 dark:text-cyan-200'>
						<Icon icon='HeroSquaresPlus' className='h-5 w-5' />
						{getAioLabel('ram_slots')}
					</label>
					<Controller
						name='ram_slots'
						control={control}
						render={({ field }) => (
							<Input
								{...field}
								value={field.value || ''}
								placeholder={AIO_PLACEHOLDERS.ram_slots}
								disabled={readOnly}
							/>
						)}
					/>
					<p className='mt-2 text-xs text-cyan-700/70 dark:text-cyan-400/70'>
						{AIO_HINTS.ram_slots}
					</p>
				</div>

				{/* RAM Type */}
				<div className='rounded-xl border border-sky-200 bg-sky-500/10 p-5 transition-colors duration-200 hover:cursor-pointer hover:bg-sky-500/20 dark:border-sky-800/50 dark:bg-sky-900/10 dark:hover:bg-sky-900/20'>
					<label className='mb-3 flex items-center gap-2 text-sm font-bold text-sky-800 dark:text-sky-200'>
						<Icon icon='HeroWrenchScrewdriver' className='h-5 w-5' />
						{getAioLabel('ram_type')}
					</label>
					<Controller
						name='ram_type'
						control={control}
						render={({ field }) => (
							<Input
								{...field}
								value={field.value || ''}
								placeholder={AIO_PLACEHOLDERS.ram_type}
								disabled={readOnly}
							/>
						)}
					/>
				</div>
			</div>

			<div className='rounded-xl border border-orange-200 bg-orange-500/10 p-6 transition-colors duration-200 hover:cursor-pointer hover:bg-orange-500/20 dark:border-orange-800/50 dark:bg-orange-900/10 dark:hover:bg-orange-900/20'>
				<div className='mb-4 flex items-center gap-2 text-orange-800 dark:text-orange-200'>
					<Icon icon='HeroCircleStack' className='h-6 w-6' />
					<h4 className='text-sm font-bold uppercase tracking-wider'>
						Almacenamiento Principal
					</h4>
				</div>

				{/* Storage Technology */}
				<label className='mb-3 block text-sm font-bold text-orange-900 dark:text-orange-100'>
					{getAioLabel('storage_technology')} <span className='text-red-500'>*</span>
				</label>
				<div className='mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5'>
					{STORAGE_TECHNOLOGY_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={storageTech === opt.value}
							onClick={() =>
								!readOnly &&
								setValue(
									'storage_technology',
									opt.value as AioFormData['storage_technology'],
								)
							}
						/>
					))}
				</div>
				{errors.storage_technology && (
					<p className='mb-4 text-xs text-red-500'>{errors.storage_technology.message}</p>
				)}

				{/* Storage Size */}
				<div className='max-w-md'>
					<label className='mb-2 block text-sm font-bold text-orange-900 dark:text-orange-100'>
						{getAioLabel('storage_size')} <span className='text-red-500'>*</span>
					</label>
					<Controller
						name='storage_size'
						control={control}
						render={({ field }) => (
							<Input
								{...field}
								value={field.value || ''}
								placeholder={AIO_PLACEHOLDERS.storage_size}
								disabled={readOnly}
								className={errors.storage_size ? 'border-red-500' : ''}
							/>
						)}
					/>
					{errors.storage_size && (
						<p className='mt-2 text-xs text-red-500'>{errors.storage_size.message}</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default AioHardwareSection;
