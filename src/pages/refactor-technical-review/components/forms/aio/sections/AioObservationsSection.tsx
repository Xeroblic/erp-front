import React from 'react';
import { Controller } from 'react-hook-form';
import { FormSectionProps } from '../../shared/types';
import { AioFormData } from '../../../validation/aio.schema';
import Input from '@/components/form/Input';
import Checkbox from '@/components/form/Checkbox';
import Textarea from '@/components/form/Textarea';
import { SoSelector } from '../../../ui/selectors/SoSelector';
import { getAioLabel } from '../../../translations/aio.labels';
import { AIO_HINTS, AIO_PLACEHOLDERS } from '../../../constants/aio/aio.hints';
import Icon from '@/components/icon/Icon';

export const AioObservationsSection: React.FC<FormSectionProps<AioFormData>> = ({
	control,
	errors,
	readOnly,
}) => {
	return (
		<div className='space-y-8'>
			{/* Software y Extras */}
			<div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
				<div className='rounded-xl border border-emerald-200 bg-emerald-500/10 p-5 transition-colors duration-200 hover:cursor-pointer hover:bg-emerald-500/20 dark:border-emerald-800/50 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20'>
					<label className='mb-3 flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200'>
						<Icon icon='HeroWindow' className='h-5 w-5' />
						{getAioLabel('operating_system')}
					</label>
					<Controller
						name='operating_system'
						control={control}
						render={({ field }) => (
							<SoSelector
								value={field.value || ''}
								onChange={(val: string) => field.onChange(val)}
								readOnly={readOnly}
							/>
						)}
					/>
				</div>

				<div className='rounded-xl border border-teal-200 bg-teal-500/10 p-5 transition-colors duration-200 hover:cursor-pointer hover:bg-teal-500/20 dark:border-teal-800/50 dark:bg-teal-900/10 dark:hover:bg-teal-900/20'>
					<div className='mb-4 flex items-center gap-2 text-teal-800 dark:text-teal-200'>
						<Icon icon='HeroWifi' className='h-5 w-5' />
						<h4 className='text-sm font-bold'>Conectividad y ODD</h4>
					</div>
					<div className='space-y-5'>
						<div className='flex items-center justify-between'>
							<span className='text-sm'>{getAioLabel('has_wifi')}</span>
							<Controller
								name='has_wifi'
								control={control}
								render={({ field }) => (
									<Checkbox
										variant='switch'
										checked={Boolean(field.value)}
										onChange={() => !readOnly && field.onChange(!field.value)}
										disabled={readOnly}
									/>
								)}
							/>
						</div>
						<div className='flex items-center justify-between'>
							<span className='text-sm'>{getAioLabel('has_bluetooth')}</span>
							<Controller
								name='has_bluetooth'
								control={control}
								render={({ field }) => (
									<Checkbox
										variant='switch'
										checked={Boolean(field.value)}
										onChange={() => !readOnly && field.onChange(!field.value)}
										disabled={readOnly}
									/>
								)}
							/>
						</div>
						<div className='flex items-center justify-between'>
							<span className='text-sm'>{getAioLabel('has_cd_drive')}</span>
							<Controller
								name='has_cd_drive'
								control={control}
								render={({ field }) => (
									<Checkbox
										variant='switch'
										checked={Boolean(field.value)}
										onChange={() => !readOnly && field.onChange(!field.value)}
										disabled={readOnly}
									/>
								)}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Observaciones */}
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors duration-200 hover:cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/50 hover:dark:bg-zinc-900/80'>
				<label className='mb-3 flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-200'>
					<Icon icon='HeroPencilSquare' className='h-5 w-5' />
					{getAioLabel('observations')}
				</label>
				<Controller
					name='observations'
					control={control}
					render={({ field }) => (
						<Textarea
							{...field}
							value={field.value || ''}
							placeholder={AIO_PLACEHOLDERS.observations}
							disabled={readOnly}
							rows={4}
							className={errors.observations ? 'border-red-500' : ''}
						/>
					)}
				/>
				{errors.observations && (
					<p className='mt-2 text-sm text-red-500'>{errors.observations.message}</p>
				)}
				<p className='mt-2 text-xs text-zinc-500'>{AIO_HINTS.observations}</p>
			</div>
		</div>
	);
};

export default AioObservationsSection;
