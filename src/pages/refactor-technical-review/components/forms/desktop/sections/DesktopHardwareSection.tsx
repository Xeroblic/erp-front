import React from 'react';
import { toast } from 'react-toastify';
import { Controller } from 'react-hook-form';
import Input from '@/components/form/Input';
import type { FormSectionProps } from '../../shared/types';
import type { DesktopFormData } from '../../../validation/desktop.schema';
import { getDesktopLabel } from '../../../translations/desktop.labels';
import { DESKTOP_HINTS, DESKTOP_PLACEHOLDERS } from '../../../constants/desktop/desktop.hints';
// Reusing styled SelectionCard
import { SelectionCard } from '../../../ui/SelectionCard';
import {
	STORAGE_TECHNOLOGY_OPTIONS,
	RAM_TYPE_OPTIONS,
} from '../../../constants/desktop/desktop.options';
// Reusing ProcessorSelector
import { ProcessorSelector } from '../../../ui/selectors/ProcessorSelector';
import InputUnitSelector from '../../../ui/InputUnitSelector';
import { NoEnciendeButton } from '../../shared/NoEnciendeButton';
import NoHardwareToggle from '../../shared/NoHardwareToggle';

const DesktopHardwareSection: React.FC<FormSectionProps<DesktopFormData>> = ({
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
	const setRamAbsence = (active: boolean) => { setValue('has_no_ram', active, { shouldDirty: true, shouldValidate: true }); if (active) { setValue('ram_size', '', { shouldDirty: true }); setValue('ram_slots', '', { shouldDirty: true }); setValue('ram_type', undefined, { shouldDirty: true }); } };
	const setStorageAbsence = (active: boolean) => { setValue('has_no_storage', active, { shouldDirty: true, shouldValidate: true }); if (active) { setValue('storage_size', '', { shouldDirty: true }); setValue('storage_technology', undefined, { shouldDirty: true }); } };

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

							if (
								(!noRam && (!ramSize || !ramSlots || !ramType)) ||
								(!noStorage && (!storageSize || !storageTech))
							) {
								toast.warning(
									'Debes completar la Memoria RAM y el Almacenamiento, ya que pueden ser revisados visualmente.',
								);
								return false;
							}
							return true;
						}}
						onConfirm={() => {
							onDirectSubmit({
								processor: watch('processor') || '0',
								has_no_ram: noRam, has_no_storage: noStorage,
								ram_size: watch('ram_size') || undefined, ram_slots: watch('ram_slots') || undefined, ram_type: watch('ram_type') || undefined,
								storage_size: watch('storage_size') || undefined, storage_technology: watch('storage_technology') || undefined,
								general_condition: 'scrap',
								cover_condition: 'broken',
								vga_ports: 0,
								hdmi_ports: 0,
								displayport_ports: 0,
								usb_c_ports: 0,
								usb_a_ports: 0,
								sd_readers: 0,
								rj45_ports: 0,
								all_ports_functional: false,
								defective_ports_count: 5,
								includes_charger: false,
								operating_system: 'Ninguno',
								has_cd_drive: false,
								has_wifi: false,
								has_bluetooth: false,
								observations: 'Equipo no enciende',
							});
						}}
					/>
				</div>
			)}

			{/* Processor */}
			<div className='rounded-xl border border-green-200 bg-green-50 p-6 transition-colors hover:bg-green-100/50 dark:border-green-900/30 dark:bg-green-900/10'>
				<label className='mb-4 block text-sm font-bold text-green-800 dark:text-green-200'>
					{getDesktopLabel('processor')} <span className='text-red-500'>*</span>
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

			<div className='flex flex-wrap gap-3'>
				{!readOnly && <NoHardwareToggle isActive={noRam} onToggle={setRamAbsence} hardwareLabel='RAM' />}
				{!readOnly && <NoHardwareToggle isActive={noStorage} onToggle={setStorageAbsence} hardwareLabel='disco' />}
			</div>
			<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
				{/* Memory RAM Card */}
				<div className={noRam ? 'hidden' : 'rounded-xl border border-blue-200 bg-blue-50 p-4 transition-colors hover:bg-blue-100/50 dark:border-blue-900/30 dark:bg-blue-900/10'}>
					<label className='mb-3 block text-sm font-bold text-blue-800 dark:text-blue-200'>
						Memoria RAM
					</label>

					{/* RAM Type Selection Cards */}
					<label className='mb-2 block text-xs font-semibold text-zinc-500'>Tipo</label>
					<div className='mb-3 grid grid-cols-3 gap-2'>
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
							{getDesktopLabel('ram_size')} <span className='text-red-500'>*</span>
						</label>
						<Controller
							name='ram_size'
							control={control}
							render={({ field }) => (
								<InputUnitSelector
									value={field.value || ''}
									onChange={field.onChange}
									placeholder={DESKTOP_PLACEHOLDERS.ram_size}
									disabled={readOnly}
									isValid={!errors.ram_size}
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
							{getDesktopLabel('ram_slots')}
						</label>
						<Controller
							name='ram_slots'
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									value={field.value || ''}
									placeholder={DESKTOP_PLACEHOLDERS.ram_slots}
									disabled={readOnly}
								/>
							)}
						/>
						<p className='mt-1 text-xs text-zinc-400'>{DESKTOP_HINTS.ram_slots}</p>
					</div>
				</div>

				{/* Storage Card */}
				<div className={noStorage ? 'hidden' : 'rounded-xl border border-purple-200 bg-purple-50 p-4 transition-colors hover:bg-purple-100/50 dark:border-purple-900/30 dark:bg-purple-900/10'}>
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
						{getDesktopLabel('storage_size')} <span className='text-red-500'>*</span>
					</label>
					<Controller
						name='storage_size'
						control={control}
						render={({ field }) => (
							<Input
								{...field}
								value={field.value || ''}
								placeholder={DESKTOP_PLACEHOLDERS.storage_size}
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

export default DesktopHardwareSection;
