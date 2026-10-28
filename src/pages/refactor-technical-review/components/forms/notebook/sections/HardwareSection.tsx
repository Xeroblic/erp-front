import React from 'react';
import { toast } from 'react-toastify';
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
import { InputUnitSelector } from '../../../ui/InputUnitSelector';
import { NoEnciendeButton } from '../../shared/NoEnciendeButton';
import HardwareCard from '../../shared/HardwareCard';
import {
	getHardwareVisualValidationMessage,
	useHardwareAbsence,
} from '../../shared/useHardwareAbsence';
import { getSchemaFieldOptions } from '../../../validation/technicalReviewSchema';

/** Valor de `speakers_condition` que el backend publica para «sin audio o distorsionado». */
const NON_FUNCTIONAL_SPEAKERS = 'broken';

const HardwareSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	onFieldBlur,
	errors,
	readOnly,
	values,
	setFieldValue,
	onDirectSubmit,
	schemaFields,
}) => {
	// ZF-102. El atajo cierra la revisión de una sola pasada, así que tiene que responder los
	// campos que el backend exige al completar: `powers_on` —el motivo mismo del atajo— y el
	// contador de teclas se fijan siempre; los parlantes dependen del catálogo remoto y sólo
	// se responden si el backend publica ese valor, porque inventarlo produciría un 422 en el
	// submit final, que no sanea por `allowed_values`.
	const speakersBroken = getSchemaFieldOptions(schemaFields?.speakers_condition).some(
		(option) => option.value === NON_FUNCTIONAL_SPEAKERS,
	);
	const ramType = values.ram_type;
	const storageTech = values.storage_technology;
	const noRam = values.has_no_ram === true;
	const noStorage = values.has_no_storage === true;
	const { setRamAbsence, setStorageAbsence } = useHardwareAbsence<NotebookFormData>({
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
								powers_on: false,
								non_functional_keys_count: values.non_functional_keys_count ?? 0,
								...(speakersBroken
									? { speakers_condition: NON_FUNCTIONAL_SPEAKERS }
									: {}),
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
								screen_inches: values.screen_inches || '0',
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
				<ProcessorSelector
					deviceType='Notebook'
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
							{getNotebookLabel('ram_size')} <span className='text-red-500'>*</span>
						</label>
						<InputUnitSelector
							value={values.ram_size || ''}
							onChange={(value) => setFieldValue('ram_size', value)}
							placeholder={NOTEBOOK_PLACEHOLDERS.ram_size}
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
							{getNotebookLabel('ram_slots')} <span className='text-red-500'>*</span>
						</label>
						<Input
							name='ram_slots'
							onChange={(event) => setFieldValue('ram_slots', event.target.value)}
							onBlur={() => onFieldBlur('ram_slots')}
							value={values.ram_slots || ''}
							placeholder={NOTEBOOK_PLACEHOLDERS.ram_slots}
							disabled={readOnly}
						/>
						<p className='mt-1 text-xs text-zinc-400'>{NOTEBOOK_HINTS.ram_slots}</p>
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
									!readOnly && setFieldValue('storage_technology', opt.value)
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
						{getNotebookLabel('storage_size')} <span className='text-red-500'>*</span>
					</label>
					<Input
						name='storage_size'
						onChange={(event) => setFieldValue('storage_size', event.target.value)}
						onBlur={() => onFieldBlur('storage_size')}
						value={values.storage_size || ''}
						placeholder={NOTEBOOK_PLACEHOLDERS.storage_size}
						disabled={readOnly}
						className={errors.storage_size ? 'border-red-500!' : ''}
					/>
					{errors.storage_size && (
						<p className='mt-1 text-xs text-red-500'>{errors.storage_size}</p>
					)}
				</HardwareCard>
			</div>
		</div>
	);
};

export default HardwareSection;
