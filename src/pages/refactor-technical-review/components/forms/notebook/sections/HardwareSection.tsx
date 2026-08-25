import React from 'react';
import { toast } from 'react-toastify';
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
import SelectReact from '@/components/form/SelectReact';
import InputUnitSelector from '../../../ui/InputUnitSelector';
import { NoEnciendeButton } from '../../shared/NoEnciendeButton';
import NoHardwareToggle from '../../shared/NoHardwareToggle';
import {
	getHardwareVisualValidationMessage,
	useHardwareAbsence,
} from '../../shared/useHardwareAbsence';
import HardwareAbsenceStatus from '../../shared/HardwareAbsenceStatus';

const HardwareSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	control,
	errors,
	readOnly,
	watch,
	setValue,
	onDirectSubmit,
}) => {
	const ramType = watch('ram_type');
	const storageTech = watch('storage_technology');
	const noRam = watch('has_no_ram') === true;
	const noStorage = watch('has_no_storage') === true;
	const { setRamAbsence, setStorageAbsence } = useHardwareAbsence<NotebookFormData>({
		setHasNoRam: (value, options) => setValue('has_no_ram', value, options),
		setRamSize: (value, options) => setValue('ram_size', value, options),
		setRamSlots: (value, options) => setValue('ram_slots', value, options),
		setRamType: (value, options) => setValue('ram_type', value, options),
		setHasNoStorage: (value, options) => setValue('has_no_storage', value, options),
		setStorageSize: (value, options) => setValue('storage_size', value, options),
		setStorageTechnology: (value, options) => setValue('storage_technology', value, options),
	});

	return (
		<div className='space-y-6'>
			{/* No Enciende Quick Action */}
			{!readOnly && onDirectSubmit && (
				<div className='mb-6'>
					<NoEnciendeButton
						onValidate={() => {
							const ramSize = watch('ram_size');
							const ramSlots = watch('ram_slots');
							const ramType = watch('ram_type');
							const storageSize = watch('storage_size');
							const storageTech = watch('storage_technology');

							const missingRam = !noRam && (!ramSize || !ramSlots || !ramType);
							const missingStorage = !noStorage && (!storageSize || !storageTech);

							if (missingRam || missingStorage) {
								toast.warning(
									getHardwareVisualValidationMessage(missingRam, missingStorage),
								);
								return false;
							}
							return true;
						}}
						onConfirm={() => {
							onDirectSubmit({
								processor: watch('processor') || '0',
								has_no_ram: noRam,
								has_no_storage: noStorage,
								ram_size: watch('ram_size') || undefined,
								ram_slots: watch('ram_slots') || undefined,
								ram_type: watch('ram_type') || undefined,
								storage_size: watch('storage_size') || undefined,
								storage_technology: watch('storage_technology') || undefined,
								general_condition: 'scrap',
								screen_condition: 'broken',
								cover_condition: 'broken',
								keyboard_condition: 'broken',
								hinge_condition: 'broken',
								touchpad_condition: 'broken',
								bottom_condition: 'broken',
								battery_status: 'no_battery',
								battery_percentage: 0,
								includes_charger: false,
								operating_system: 'Ninguno',
								has_biometric: false,
								has_wifi: false,
								has_bluetooth: false,
								is_touchscreen: false,
								screen_inches: watch('screen_inches') || '0',
								keyboard_layout: 'es',
								has_numeric_keypad: false,
								has_backlit_keyboard: false,
								observations: 'Equipo no enciende',
							});
						}}
					/>
				</div>
			)}

			{/* Processor */}
			<div className='rounded-xl border border-green-200 bg-green-500/10 p-6 transition-colors duration-200 hover:cursor-pointer hover:bg-green-500/20 dark:border-green-800 dark:bg-green-900/10 dark:hover:bg-green-900/20'>
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

			<div className='flex flex-wrap gap-3'>
				{!readOnly && (
					<NoHardwareToggle
						isActive={noRam}
						onToggle={setRamAbsence}
						hardwareLabel='RAM'
					/>
				)}
				{!readOnly && (
					<NoHardwareToggle
						isActive={noStorage}
						onToggle={setStorageAbsence}
						hardwareLabel='disco'
					/>
				)}
				{readOnly && <HardwareAbsenceStatus hasNoRam={noRam} hasNoStorage={noStorage} />}
			</div>
			<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
				{/* Memory RAM Card */}
				<div
					className={
						noRam
							? 'hidden'
							: 'rounded-xl border border-blue-200 bg-blue-500/20 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-blue-500/30 dark:border-blue-800 dark:bg-blue-900/10 dark:hover:bg-blue-900/30'
					}>
					<label className='mb-3 block text-sm font-bold text-blue-800 dark:text-blue-200'>
						Memoria RAM
						<span className='text-red-500'>*</span>
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
								<InputUnitSelector
									value={field.value || ''}
									onChange={field.onChange}
									placeholder={NOTEBOOK_PLACEHOLDERS.ram_size}
									disabled={readOnly}
									isValid={!errors.ram_size}
								/>
							)}
						/>
						{errors.ram_size && (
							<p className='mt-1 text-xs text-red-500'>{errors.ram_size.message}</p>
						)}
					</div>
					<div></div>

					{/* RAM Slots */}
					<div>
						<label className='mb-1 block text-xs font-semibold text-zinc-500'>
							{getNotebookLabel('	ram_slots')} <span className='text-red-500'>*</span>
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
				<div
					className={
						noStorage
							? 'hidden'
							: 'rounded-xl border border-purple-200 bg-purple-500/20 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-purple-500/30 dark:border-purple-800 dark:bg-purple-900/10 dark:hover:bg-purple-900/30'
					}>
					<label className='mb-3 block text-sm font-bold text-purple-800 dark:text-purple-200'>
						Almacenamiento
					</label>

					{/* Storage Technology Selection Cards */}
					<label className='mb-2 block text-xs font-semibold text-zinc-500'>
						Tecnología
						<span className='text-red-500'>*</span>
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
