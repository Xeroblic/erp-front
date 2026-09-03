import React from 'react';
import { Controller } from 'react-hook-form';
import { FormSectionProps } from '../../shared/types';
import { DockingFormData } from '../../../validation/docking.schema';
import { SelectionCard } from '../../../ui/SelectionCard';
import Textarea from '@/components/form/Textarea';
import Checkbox from '@/components/form/Checkbox';
import { DOCKING_HINTS, DOCKING_PLACEHOLDERS } from '../../../constants/docking/docking.hints';
import { COVER_CONDITION_OPTIONS } from '../../../constants/docking/docking.options';
import { getDockingLabel } from '../../../translations/docking.labels';
import { getSchemaFieldOptions } from '../../../validation/technicalReviewSchema';
import Icon from '@/components/icon/Icon';

const DockingExtrasSection: React.FC<FormSectionProps<DockingFormData>> = ({
	control,
	errors,
	readOnly,
	watch,
	setValue,
	schemaFields,
}) => {
	const currentCover = watch('cover_condition');
	// ZF-99. El sector del candado nace con esta card: no hay constante local con sus
	// valores, e inventarlos produciría un 422. Se muestra sólo cuando el backend lo
	// publica, que es el comportamiento de `develop`, donde el campo no existe.
	const lockAreaField = schemaFields?.lock_area_condition;

	return (
		<div className='space-y-8'>
			{/* Hardware Toggles */}
			<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
				<div className='rounded-xl border border-blue-200 bg-blue-500/10 p-6 transition-colors duration-200 hover:cursor-pointer hover:bg-blue-500/20 dark:border-blue-800/50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20'>
					<div className='flex items-center justify-between'>
						<h3 className='flex items-center gap-2 text-sm font-bold text-blue-900 dark:text-blue-100'>
							<Icon icon='HeroBolt' className='h-5 w-5' />
							{getDockingLabel('includes_power_adapter')}
						</h3>
						<Controller
							name='includes_power_adapter'
							control={control}
							render={({ field }) => (
								<Checkbox
									variant='switch'
									color='blue'
									checked={Boolean(field.value)}
									onChange={() => !readOnly && field.onChange(!field.value)}
									disabled={readOnly}
								/>
							)}
						/>
					</div>
					<p className='mt-2 text-xs text-blue-700/80 dark:text-blue-300/80'>
						Marcar si la docking vino con su fuente de poder.
					</p>
				</div>

				<div className='rounded-xl border border-teal-200 bg-teal-500/10 p-6 transition-colors duration-200 hover:cursor-pointer hover:bg-teal-500/20 dark:border-teal-800/50 dark:bg-teal-900/10 dark:hover:bg-teal-900/20'>
					<div className='flex items-center justify-between'>
						<h3 className='flex items-center gap-2 text-sm font-bold text-teal-900 dark:text-teal-100'>
							<Icon icon='HeroWifi' className='h-5 w-5' />
							{getDockingLabel('has_wifi')}
						</h3>
						<Controller
							name='has_wifi'
							control={control}
							render={({ field }) => (
								<Checkbox
									variant='switch'
									color='teal'
									checked={Boolean(field.value)}
									onChange={() => !readOnly && field.onChange(!field.value)}
									disabled={readOnly}
								/>
							)}
						/>
					</div>
					<p className='mt-2 text-xs text-teal-700/80 dark:text-teal-300/80'>
						Marcar si la docking tiene módulo Wi-Fi integrado.
					</p>
				</div>
			</div>

			{/* Cover Condition */}
			<div className='rounded-xl border border-orange-200 bg-orange-500/10 p-6 shadow-sm transition-colors duration-200 hover:bg-orange-500/20 dark:border-orange-800/50 dark:bg-orange-900/10 dark:hover:bg-orange-900/20'>
				<label className='mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-orange-800 dark:text-orange-200'>
					<Icon icon='HeroStop' className='h-5 w-5' />
					{getDockingLabel('cover_condition')}
				</label>

				<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5'>
					{COVER_CONDITION_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label as string}
							value={opt.value as string}
							isSelected={currentCover === opt.value}
							color='orange'
							onClick={() => {
								if (readOnly) return;
								setValue(
									'cover_condition',
									opt.value as
										| 'ok'
										| 'worn'
										| 'missing_pieces'
										| 'scratched'
										| 'broken',
									{ shouldValidate: true },
								);
							}}
						/>
					))}
				</div>
				{errors.cover_condition && (
					<p className='mt-3 text-xs text-red-500'>{errors.cover_condition.message}</p>
				)}
			</div>

			{/* Sector del candado (ZF-99) */}
			{lockAreaField && (
				<div className='rounded-xl border border-amber-200 bg-amber-500/10 p-6 shadow-sm transition-colors duration-200 hover:bg-amber-500/20 dark:border-amber-800/50 dark:bg-amber-900/10 dark:hover:bg-amber-900/20'>
					<p
						className='mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200'
						id='lock-area-condition-label'>
						<Icon icon='HeroLockClosed' className='h-5 w-5' />
						{lockAreaField.label ?? getDockingLabel('lock_area_condition')}
						{lockAreaField.required && <span className='text-red-500'> *</span>}
					</p>

					<div
						role='radiogroup'
						aria-labelledby='lock-area-condition-label'
						aria-required={lockAreaField.required ?? false}
						className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
						{getSchemaFieldOptions(lockAreaField).map((opt) => (
							<SelectionCard
								key={opt.value}
								label={opt.label}
								value={opt.value}
								isSelected={watch('lock_area_condition') === opt.value}
								color='yellow'
								disabled={readOnly}
								onClick={() => {
									if (readOnly) return;
									setValue('lock_area_condition', opt.value, {
										shouldValidate: true,
									});
								}}
							/>
						))}
					</div>
					{errors.lock_area_condition && (
						<p className='mt-3 text-xs text-red-500'>
							{errors.lock_area_condition.message}
						</p>
					)}
					{(lockAreaField.hint ?? lockAreaField.warning) && (
						<p className='mt-3 text-xs text-amber-800/80 dark:text-amber-200/80'>
							{lockAreaField.hint ?? lockAreaField.warning}
						</p>
					)}
				</div>
			)}

			{/* Observations */}
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors duration-200 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700'>
				<label className='mb-3 flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300'>
					<Icon icon='HeroDocumentText' className='h-5 w-5' />
					{getDockingLabel('observations')}
				</label>
				<p className='mb-4 text-xs text-zinc-500'>{DOCKING_HINTS.observations}</p>
				<Controller
					name='observations'
					control={control}
					render={({ field }) => (
						<Textarea
							{...field}
							value={field.value ?? ''}
							placeholder={DOCKING_PLACEHOLDERS.observations}
							disabled={readOnly}
							rows={4}
							className={`w-full ${errors.observations ? 'border-red-500' : ''}`}
						/>
					)}
				/>
				{errors.observations && (
					<p className='mt-2 text-xs text-red-500'>{errors.observations.message}</p>
				)}
			</div>
		</div>
	);
};

export default DockingExtrasSection;
