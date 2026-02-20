import React, { useEffect, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { FormSectionProps } from '../../shared/types';
import { AioFormData } from '../../../validation/aio.schema';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { fetchBrands } from '@/store/slices/brands/brandsSlice';
import { AIO_HINTS, AIO_PLACEHOLDERS } from '../../../constants/aio/aio.hints';
import { getAioLabel } from '../../../translations/aio.labels';
import { GENERAL_CONDITION_OPTIONS } from '../../../constants/aio/aio.options';
import { SelectionCard } from '../../../ui/SelectionCard';

const AioBasicInfoSection: React.FC<FormSectionProps<AioFormData>> = ({
	control,
	errors,
	readOnly,
	watch,
	setValue,
}) => {
	const generalCondition = watch('general_condition');
	const dispatch = useAppDispatch();
	const { items: brands, loading: loadingBrands } = useAppSelector((state) => state.brands);
	const { user } = useAppSelector((state) => state.auth);
	const activeBranchId = user?.branch_id || user?.branch?.id;

	useEffect(() => {
		if (activeBranchId) {
			dispatch(fetchBrands({ branchId: activeBranchId }));
		}
	}, [dispatch, activeBranchId]);

	const brandOptions: TSelectOption[] = useMemo(() => {
		return brands
			.filter((b) => b.is_active)
			.map((b) => ({
				value: b.name,
				label: b.name,
			}));
	}, [brands]);

	return (
		<div className='space-y-6'>
			<p className='text-sm text-zinc-500'>
				Ingresa la información básica de identificación del equipo All-In-One.
			</p>

			<div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
				{/* Brand */}
				<div className='rounded-xl border border-blue-200 bg-blue-500/20 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-blue-500/30 dark:border-blue-800 dark:bg-blue-900/10 dark:hover:bg-blue-900/30'>
					<label className='mb-3 flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-200'>
						<span className='flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300'>
							🏷️
						</span>
						{getAioLabel('brand')} <span className='text-red-500'>*</span>
					</label>
					<Controller
						name='brand'
						control={control}
						render={({ field }) => (
							<SelectReact
								name={field.name}
								options={brandOptions}
								value={
									brandOptions.find((opt) => opt.value === field.value) || null
								}
								onChange={(option) => {
									field.onChange((option as TSelectOption)?.value);
								}}
								isLoading={loadingBrands}
								placeholder={AIO_PLACEHOLDERS.brand}
								isDisabled={readOnly}
								isValid={!errors.brand}
								invalidFeedback={errors.brand?.message}
							/>
						)}
					/>
					<p className='mt-1 text-xs text-zinc-500'>{AIO_HINTS.brand}</p>
				</div>

				{/* Model */}
				<div className='rounded-xl border border-fuchsia-200 bg-fuchsia-500/20 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-fuchsia-500/30 dark:border-fuchsia-800 dark:bg-fuchsia-900/10 dark:hover:bg-fuchsia-900/30'>
					<label className='mb-3 flex items-center gap-2 text-sm font-bold text-fuchsia-800 dark:text-fuchsia-200'>
						<span className='flex h-6 w-6 items-center justify-center rounded-md bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-800 dark:text-fuchsia-300'>
							⚏
						</span>
						{getAioLabel('model')} <span className='text-red-500'>*</span>
					</label>
					<Controller
						name='model'
						control={control}
						render={({ field }) => (
							<Input
								{...field}
								value={field.value || ''}
								placeholder={AIO_PLACEHOLDERS.model}
								disabled={readOnly}
								className={errors.model ? 'border-red-500' : ''}
							/>
						)}
					/>
					{errors.model && (
						<p className='mt-1 text-xs text-red-500'>{errors.model.message}</p>
					)}
					<p className='mt-1 text-xs text-zinc-500'>{AIO_HINTS.model}</p>
				</div>

				{/* General Condition */}
				<div className='rounded-xl border border-emerald-200 bg-emerald-500/20 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-emerald-500/30 dark:border-emerald-800 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/30 md:col-span-2'>
					<label className='mb-3 flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200'>
						{getAioLabel('general_condition')} <span className='text-red-500'>*</span>
					</label>

					<div className='grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5'>
						{GENERAL_CONDITION_OPTIONS.map((opt) => (
							<SelectionCard
								key={opt.value}
								label={opt.label}
								value={opt.value}
								isSelected={generalCondition === opt.value}
								onClick={() =>
									!readOnly &&
									setValue(
										'general_condition',
										opt.value as AioFormData['general_condition'],
									)
								}
							/>
						))}
					</div>

					{errors.general_condition && (
						<p className='mt-2 text-xs text-red-500'>
							{errors.general_condition.message}
						</p>
					)}
					<p className='mt-2 text-xs text-zinc-500'>{AIO_HINTS.general_condition}</p>
				</div>
			</div>
		</div>
	);
};

export default AioBasicInfoSection;
