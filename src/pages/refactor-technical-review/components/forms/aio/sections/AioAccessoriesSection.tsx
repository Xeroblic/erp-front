import React, { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { FormSectionProps } from '../../shared/types';
import { AioFormData } from '../../../validation/aio.schema';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Checkbox from '@/components/form/Checkbox';
import Icon from '@/components/icon/Icon';
import { getAioLabel } from '../../../translations/aio.labels';
import { CHARGER_STATUS_OPTIONS } from '../../../constants/aio/aio.options';

export const AioAccessoriesSection: React.FC<FormSectionProps<AioFormData>> = ({
	control,
	errors,
	readOnly,
	watch,
	setValue,
}) => {
	const includesCharger = watch('includes_power_adapter');

	// Auto-clean charger status if power adapter drops to false
	useEffect(() => {
		if (includesCharger === false) {
			setValue('charger_status', undefined as unknown as AioFormData['charger_status'], {
				shouldValidate: true,
			});
		}
	}, [includesCharger, setValue]);

	return (
		<div className='mx-auto max-w-2xl space-y-6'>
			<div className='rounded-xl border border-blue-200 bg-blue-500/10 p-6 transition-colors duration-200 hover:cursor-pointer hover:bg-blue-500/20 dark:border-blue-800/50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20'>
				<div className='flex items-center justify-between'>
					<div>
						<h3 className='flex items-center gap-2 text-sm font-bold text-blue-900 dark:text-blue-100'>
							<Icon icon='HeroBolt' className='h-5 w-5' />
							Adaptador de Poder (Fuente / Cargador)
						</h3>
						<p className='mt-1 text-xs text-blue-800/70 dark:text-blue-200/70'>
							¿Se incluye cargador original o compatible con el equipo?
						</p>
					</div>

					<Controller
						name='includes_power_adapter'
						control={control}
						render={({ field }) => (
							<Checkbox
								variant='switch'
								checked={Boolean(field.value)}
								onChange={() => !readOnly && field.onChange(!field.value)}
								disabled={readOnly}
								color='blue'
							/>
						)}
					/>
				</div>
			</div>

			{includesCharger && (
				<div className='animate-in slide-in-from-top-4 fade-in rounded-xl border border-indigo-200 bg-indigo-500/10 p-6 transition-colors duration-200 hover:cursor-pointer hover:bg-indigo-500/20 dark:border-indigo-800/50 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20'>
					<label className='mb-3 flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-100'>
						Estado del Adaptador <span className='text-red-500'>*</span>
					</label>
					<Controller
						name='charger_status'
						control={control}
						render={({ field }) => (
							<SelectReact
								name={field.name}
								options={CHARGER_STATUS_OPTIONS}
								value={
									CHARGER_STATUS_OPTIONS.find(
										(opt) => opt.value === field.value,
									) || null
								}
								onChange={(val) => field.onChange((val as TSelectOption)?.value)}
								isDisabled={readOnly}
								className={errors.charger_status ? 'border-red-500' : ''}
								placeholder='Selecciona el estado del cargador...'
							/>
						)}
					/>
					{errors.charger_status && (
						<p className='mt-2 text-sm text-red-500'>{errors.charger_status.message}</p>
					)}
				</div>
			)}
		</div>
	);
};

export default AioAccessoriesSection;
