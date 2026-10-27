import React, { useEffect } from 'react';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Validation from '@/components/form/Validation';
import Checkbox from '@/components/form/Checkbox';
import Icon from '@/components/icon/Icon';
import { AioFormData } from '../../../validation/aio.schema';
import { FormSectionProps } from '../../shared/types';
import { CHARGER_STATUS_OPTIONS } from '../../../constants/aio/aio.options';

export const AioAccessoriesSection: React.FC<FormSectionProps<AioFormData>> = ({
	errors,
	readOnly,
	values,
	setFieldValue,
	onFieldBlur,
}) => {
	const includesCharger = values.includes_power_adapter;

	// Auto-clean charger status if power adapter drops to false
	useEffect(() => {
		if (includesCharger === false) {
			setFieldValue('charger_status', undefined as unknown as AioFormData['charger_status'], {
				touch: true,
			});
		}
	}, [includesCharger, setFieldValue]);

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

					<Checkbox
						variant='switch'
						checked={Boolean(values.includes_power_adapter)}
						onChange={() =>
							!readOnly &&
							setFieldValue('includes_power_adapter', !values.includes_power_adapter)
						}
						disabled={readOnly}
						color='blue'
					/>
				</div>
			</div>

			{includesCharger && (
				<div className='animate-in slide-in-from-top-4 fade-in rounded-xl border border-indigo-200 bg-indigo-500/10 p-6 transition-colors duration-200 hover:cursor-pointer hover:bg-indigo-500/20 dark:border-indigo-800/50 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20'>
					<label
						htmlFor='charger_status'
						className='mb-3 flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-100'>
						Estado del Adaptador <span className='text-red-500'>*</span>
					</label>
					<Validation
						isValid={!errors.charger_status}
						isTouched={Boolean(errors.charger_status)}
						invalidFeedback={errors.charger_status}>
						<SelectReact
							name='charger_status'
							inputId='charger_status'
							options={CHARGER_STATUS_OPTIONS}
							value={
								CHARGER_STATUS_OPTIONS.find(
									(opt) => opt.value === values.charger_status,
								) || null
							}
							onChange={(val) =>
								setFieldValue(
									'charger_status',
									(val as TSelectOption | null)
										?.value as AioFormData['charger_status'],
								)
							}
							onBlur={() => onFieldBlur('charger_status')}
							isDisabled={readOnly}
							placeholder='Selecciona el estado del cargador...'
						/>
					</Validation>
				</div>
			)}
		</div>
	);
};

export default AioAccessoriesSection;
