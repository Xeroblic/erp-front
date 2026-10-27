import React from 'react';
import { toast } from 'react-toastify';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import { FormSectionProps } from '../../shared/types';
import { AioFormData } from '../../../validation/aio.schema';
import { AIO_HINTS, AIO_PLACEHOLDERS } from '../../../constants/aio/aio.hints';
import { getAioLabel } from '../../../translations/aio.labels';
import { STORAGE_TECHNOLOGY_OPTIONS, RAM_TYPE_OPTIONS } from '../../../constants/aio/aio.options';

import { ProcessorSelector } from '../../../ui/selectors/ProcessorSelector';
import { InputUnitSelector } from '../../../ui/InputUnitSelector';
import { SelectionCard } from '../../../ui/SelectionCard';
import { NoEnciendeButton } from '../../shared/NoEnciendeButton';
import HardwareCard from '../../shared/HardwareCard';
import {
	getHardwareVisualValidationMessage,
	useHardwareAbsence,
} from '../../shared/useHardwareAbsence';

const AioHardwareSection: React.FC<FormSectionProps<AioFormData>> = ({
	onFieldBlur,
	errors,
	readOnly,
	setFieldValue,
	values,
	onDirectSubmit,
}) => {
	const ramType = values.ram_type;
	const storageTech = values.storage_technology;
	const noRam = values.has_no_ram === true;
	const noStorage = values.has_no_storage === true;
	const { setRamAbsence, setStorageAbsence } = useHardwareAbsence<AioFormData>({
		setHasNoRam: (value, options) => setFieldValue('has_no_ram', value, options),
		setHasNoStorage: (value, options) => setFieldValue('has_no_storage', value, options),
	});

	return (
		<div className='space-y-6'>
			{/* No Enciende Quick Action */}
			{!readOnly && onDirectSubmit && (
				<div className='mb-6'>
					<NoEnciendeButton
						onValidate={() => {
							const ramSize = values.ram_size;
							const ramSlots = values.ram_slots;
							const watchedRamType = values.ram_type;
							const storageSize = values.storage_size;
							const watchedStorageTech = values.storage_technology;

							const missingRam = !noRam && (!ramSize || !ramSlots || !watchedRamType);
							const missingStorage =
								!noStorage && (!storageSize || !watchedStorageTech);

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
								processor: values.processor || '0',
								has_no_ram: noRam,
								has_no_storage: noStorage,
								ram_size: values.ram_size || undefined,
								ram_slots: values.ram_slots || undefined,
								ram_type: values.ram_type || undefined,
								storage_size: values.storage_size || undefined,
								storage_technology: values.storage_technology || undefined,
								general_condition: 'scrap',
								screen_condition: 'broken',
								dead_pixels_count: 0,
								stand_condition: 'broken',
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
								includes_power_adapter: false,
								operating_system: 'Ninguno',
								has_cd_drive: false,
								has_wifi: false,
								has_bluetooth: false,
								is_touchscreen: false,
								screen_inches: values.screen_inches || '0',
								observations: 'Equipo no enciende',
							});
						}}
					/>
				</div>
			)}

			{/* Processor */}
			<div className='rounded-xl border border-indigo-200 bg-indigo-500/10 p-5 transition-colors duration-200 hover:cursor-pointer hover:bg-indigo-500/20 dark:border-indigo-800/50 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20'>
				<label className='mb-3 flex items-center gap-2 text-sm font-bold text-indigo-800 dark:text-indigo-200'>
					<Icon icon='HeroCpuChip' className='h-5 w-5' />
					{getAioLabel('processor')} <span className='text-red-500'>*</span>
				</label>
				<ProcessorSelector
					deviceType='Desktop'
					value={values.processor || ''}
					onChange={(value) => setFieldValue('processor', value)}
					readOnly={readOnly}
				/>
				{errors.processor && (
					<p className='mt-2 text-xs text-red-500'>{errors.processor}</p>
				)}
			</div>

			<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
				{/* Memory RAM Card */}
				<HardwareCard
					title='Memoria RAM'
					accent='blue'
					isRequired
					isAbsent={noRam}
					onToggleAbsence={setRamAbsence}
					hardwareLabel='RAM'
					readOnly={readOnly}>
					{/* RAM Type Selection Cards */}
					<p className='mb-2 block text-xs font-semibold text-zinc-500'>Tipo</p>
					<div className='mb-3 grid grid-cols-2 gap-2 md:grid-cols-5'>
						{RAM_TYPE_OPTIONS.map((opt) => (
							<SelectionCard
								key={opt.value}
								label={opt.label}
								value={opt.value}
								isSelected={ramType === opt.value}
								onClick={() => !readOnly && setFieldValue('ram_type', opt.value)}
								disabled={readOnly}
							/>
						))}
					</div>

					{/* RAM Size */}
					<div className='mb-3'>
						<label className='mb-1 block text-xs font-semibold text-zinc-500'>
							{getAioLabel('ram_size')} <span className='text-red-500'>*</span>
						</label>
						<InputUnitSelector
							value={values.ram_size || ''}
							onChange={(value) => setFieldValue('ram_size', value)}
							placeholder={AIO_PLACEHOLDERS.ram_size}
							disabled={readOnly}
							isValid={!errors.ram_size}
						/>
						{errors.ram_size && (
							<p className='mt-1 text-xs text-red-500'>{errors.ram_size}</p>
						)}
					</div>

					{/* RAM Slots */}
					<div>
						<label className='mb-1 block text-xs font-semibold text-zinc-500'>
							{getAioLabel('ram_slots')} <span className='text-red-500'>*</span>
						</label>
						<Input
							name='ram_slots'
							onChange={(event) => setFieldValue('ram_slots', event.target.value)}
							onBlur={() => onFieldBlur('ram_slots')}
							value={values.ram_slots || ''}
							placeholder={AIO_PLACEHOLDERS.ram_slots}
							disabled={readOnly}
						/>
						<p className='mt-1 text-xs text-zinc-400'>{AIO_HINTS.ram_slots}</p>
					</div>
				</HardwareCard>

				{/* Storage Card */}
				<HardwareCard
					title='Almacenamiento'
					accent='purple'
					isAbsent={noStorage}
					onToggleAbsence={setStorageAbsence}
					hardwareLabel='disco'
					readOnly={readOnly}>
					{/* Storage Technology Selection Cards */}
					<p className='mb-2 block text-xs font-semibold text-zinc-500'>
						Tecnología
						<span className='text-red-500'>*</span>
					</p>
					<div className='mb-3 grid grid-cols-2 gap-2 md:grid-cols-3'>
						{STORAGE_TECHNOLOGY_OPTIONS.map((opt) => (
							<SelectionCard
								key={opt.value}
								label={opt.label}
								value={opt.value}
								isSelected={storageTech === opt.value}
								onClick={() =>
									!readOnly &&
									setFieldValue(
										'storage_technology',
										opt.value as AioFormData['storage_technology'],
									)
								}
								disabled={readOnly}
							/>
						))}
					</div>
					{errors.storage_technology && (
						<p className='mb-2 text-xs text-red-500'>{errors.storage_technology}</p>
					)}

					{/* Storage Size */}
					<label className='mb-1 block text-xs font-semibold text-zinc-500'>
						{getAioLabel('storage_size')} <span className='text-red-500'>*</span>
					</label>
					<Input
						name='storage_size'
						onChange={(event) => setFieldValue('storage_size', event.target.value)}
						onBlur={() => onFieldBlur('storage_size')}
						value={values.storage_size || ''}
						placeholder={AIO_PLACEHOLDERS.storage_size}
						disabled={readOnly}
						className={errors.storage_size ? 'border-red-500' : ''}
					/>
					{errors.storage_size && (
						<p className='mt-1 text-xs text-red-500'>{errors.storage_size}</p>
					)}
				</HardwareCard>
			</div>
		</div>
	);
};

export default AioHardwareSection;
