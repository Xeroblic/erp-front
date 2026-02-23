import React, { useEffect, useState } from 'react';
import type { MultiValue, SingleValue } from 'react-select';
import Card, { CardBody } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import Checkbox from '@/components/form/Checkbox';
import Icon from '@/components/icon/Icon';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchValidationRulesByType } from '@/store/slices/technicalReviews';
import { fetchBrands } from '@/store/slices/brands/brandsSlice';
import type { UpdateItemDetailsPayload } from '@/interface/technicalReviews.interface';
import { ProcessorSelector } from '../components/ProcessorSelector';
import { SoSelector } from '../components/SoSelector';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { RangeSlider } from '../components/RangerSlider';
import { StepperInput } from '../components/StepperInput';
import { SelectionCard } from '../components/SelectionCard';
import { YesNoSelector } from '../components/YesNoSelector';
import {
	GENERAL_CONDITION_OPTIONS,
	RAM_TYPE_OPTIONS,
	STORAGE_TECH_OPTIONS,
	type OptionType,
} from '../constants/formOptions';

// Desktop-specific options — backend allowed values differ per equipment type
const DESKTOP_COVER_CONDITION_OPTIONS: OptionType[] = [
	{ value: 'ok', label: 'OK', color: 'green' },
	{ value: 'good_condition', label: 'Buen estado', color: 'green' },
	{ value: 'light_scratches', label: 'Rayas leves', color: 'yellow' },
	{ value: 'noticeable_wear', label: 'Desgaste notorio', color: 'yellow' },
	{ value: 'broken', label: 'Roto', color: 'red' },
];

const DESKTOP_CHARGER_STATUS_OPTIONS: OptionType[] = [
	{ value: 'good_condition', label: 'Buen estado', color: 'green' },
	{ value: 'damaged_cable', label: 'Cable en mal estado', color: 'yellow' },
	{ value: 'not_matching_equipment', label: 'No corresponde al equipo', color: 'red' },
	{ value: 'not_included', label: 'No incluye', color: 'red' },
	{ value: 'broken_charger', label: 'Cargador roto', color: 'red' },
	{ value: 'broken_port', label: 'Entrada rota', color: 'red' },
];

// --- MAIN COMPONENT ---

interface DesktopFormProps {
	branchId: number;
	values: Partial<UpdateItemDetailsPayload>;
	onChange: (field: string, value: unknown) => void;
	readOnly?: boolean;
}

const DesktopForm: React.FC<DesktopFormProps> = ({
	branchId,
	values,
	onChange,
	readOnly = false,
}) => {
	const dispatch = useAppDispatch();
	const validationLoading = useAppSelector((s) => s.technicalReviews.validationRulesLoading);
	const brands = useAppSelector((s) => s.brands.items);
	const brandsLoading = useAppSelector((s) => s.brands.loading);
	const [step, setStep] = useState(0);

	useEffect(() => {
		if (branchId) {
			dispatch(fetchValidationRulesByType({ branchId, equipmentType: 'desktop' }));
			dispatch(fetchBrands({ branchId }));
		}
	}, [dispatch, branchId]);

	const brandOptions: TSelectOption[] = brands.map((brand) => ({
		value: brand.name,
		label: brand.name,
	}));

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.name, e.target.value);
	};

	const handleSelectChange =
		(name: string) =>
		(newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null) => {
			if (Array.isArray(newValue)) {
				onChange(
					name,
					newValue.map((option) => option.value),
				);
			} else {
				const option = newValue as TSelectOption | null;
				onChange(name, option?.value ?? null);
			}
		};

	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.name, e.target.value);
	};

	// --- OPTIONS ALIGNED WITH RULES ---
	// Using shared constants from formOptions
	const generalConditionOptions = GENERAL_CONDITION_OPTIONS;
	const coverConditionOptions = DESKTOP_COVER_CONDITION_OPTIONS;
	const ramTypeOptions = RAM_TYPE_OPTIONS;
	const storageTechOptions = STORAGE_TECH_OPTIONS;
	const chargerStatusOptions = DESKTOP_CHARGER_STATUS_OPTIONS;

	// DesktopForm-specific constants
	const formFactorOptions = [
		{ value: 'Tower', label: 'Torre' },
		{ value: 'SFF', label: 'SFF (Small)' },
		{ value: 'USFF', label: 'USFF (Ultra)' },
		{ value: 'Micro', label: 'Micro/Mini' },
		{ value: 'AIO', label: 'All-in-One' },
	];

	const MAX_STEPS = 7;

	const handleNextStep = () => {
		if (step < MAX_STEPS - 1) setStep((prev) => prev + 1);
		else toast.info('Formulario completo.');
	};

	const handlePreviousStep = () => {
		if (step > 0) setStep((prev) => prev - 1);
	};

	// Helper to safely get numeric values
	const getNumericValue = (fieldName: string): number => {
		const val = values[fieldName as keyof UpdateItemDetailsPayload];
		return typeof val === 'number' ? val : 0;
	};

	// Auto-fill observations with connectivity text when issues are detected
	useEffect(() => {
		const portFields = {
			usb_a_ports: 'USB-A',
			usb_c_ports: 'USB-C',
			hdmi_ports: 'HDMI',
			displayport_ports: 'DisplayPort',
			vga_ports: 'VGA',
			rj45_ports: 'RJ45',
			sd_readers: 'Lector SD',
		};

		const activePorts: string[] = [];

		Object.entries(portFields).forEach(([field, label]) => {
			const value = values[field as keyof UpdateItemDetailsPayload];
			const numValue = typeof value === 'number' ? value : parseInt(String(value)) || 0;

			if (numValue > 0) {
				activePorts.push(label);
			}
		});

		if (activePorts.length > 0) {
			const connectivityText = `PUERTOS CON PROBLEMAS:\nPuertos presentes: \n${activePorts.join(', \n')}\n\nIndica a continuación cuántos están dañados y qué fallas tienen:`;
			const currentObs = values.observations || '';

			// Solo agregar si no existe ya en observaciones
			if (!currentObs.includes('PUERTOS CON PROBLEMAS')) {
				const newObs = currentObs
					? `${currentObs}\n\n${connectivityText}`
					: connectivityText;
				onChange('observations', newObs);
			}
		}
	}, [
		values.all_ports_functional,
		values.defective_ports_count,
		values.usb_a_ports,
		values.usb_c_ports,
		values.hdmi_ports,
		values.displayport_ports,
		values.vga_ports,
		values.rj45_ports,
		values.sd_readers,
	]);

	if (validationLoading || brandsLoading) {
		return (
			<Card className='h-full'>
				<CardBody className='flex h-full items-center justify-center p-6'>
					<Icon icon='HeroArrowPath' className='h-10 w-10 animate-spin text-blue-500' />
				</CardBody>
			</Card>
		);
	}

	const renderStepContent = () => {
		switch (step) {
			case 0: // Info
				return (
					<div className='space-y-6'>
						<h3 className='mb-4 text-center text-lg font-bold dark:text-gray-100'>
							Información Básica
						</h3>
						<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
							<div>
								<label className='mb-1 block text-xs font-bold dark:text-gray-300'>
									Marca *
								</label>
								<SelectReact
									name='brand'
									options={brandOptions}
									value={
										brandOptions.find((o) => o.value === values.brand) || null
									}
									onChange={handleSelectChange('brand')}
									placeholder='Seleccionar marca'
									isDisabled={readOnly}
								/>
							</div>
							<div>
								<label className='mb-1 block text-xs font-bold dark:text-gray-300'>
									Modelo *
								</label>
								<Input
									type='text'
									name='model'
									value={values.model || ''}
									onChange={handleInputChange}
									placeholder='OptiPlex 7050'
								/>
							</div>
						</div>

						{/* Added Line Input */}
						<div className='mx-auto max-w-md'>
							<label className='mb-1 block text-xs font-bold dark:text-gray-300'>
								Línea (Opcional)
							</label>
							<Input
								type='text'
								name='line'
								value={values.line || ''}
								onChange={handleInputChange}
								placeholder='Ej: OptiPlex, EliteDesk'
							/>
						</div>

						<div>
							<label className='mb-3 block text-center text-sm font-bold dark:text-gray-300'>
								Factor de Forma
							</label>
							<div className='grid grid-cols-3 gap-2 md:grid-cols-5'>
								{formFactorOptions.map((opt) => (
									<SelectionCard
										key={opt.value}
										label={opt.label}
										value={opt.value}
										isSelected={values.form_factor === opt.value}
										onClick={() => onChange('form_factor', opt.value)}
									/>
								))}
							</div>
						</div>
					</div>
				);
			case 1: // Specs - Proc/RAM
				return (
					<div className='space-y-6'>
						<h3 className='mb-4 text-center text-lg font-bold'>Procesador y RAM</h3>
						<div>
							<label className='mb-1 block text-xs font-bold'>Procesador *</label>
							<ProcessorSelector
								deviceType='Desktop'
								value={values.processor || ''}
								onChange={(val) => onChange('processor', val)}
								disabled={readOnly}
							/>
						</div>

						<div className='rounded-xl border bg-blue-50 p-4 dark:bg-blue-900/10'>
							<label className='mb-3 block text-sm font-bold text-blue-800 dark:text-blue-200'>
								Memoria RAM
							</label>
							<div className='mb-3 grid grid-cols-2 gap-3'>
								<Input
									type='text'
									name='ram_size'
									value={values.ram_size || ''}
									onChange={handleInputChange}
									placeholder='Tamaño (Ej: 16 GB)'
								/>
								<Input
									type='text'
									name='ram_slots'
									value={values.ram_slots || ''}
									onChange={handleInputChange}
									placeholder='Slots (Ej: 4x4)'
								/>
							</div>
							<label className='mb-2 block text-xs font-semibold text-gray-500'>
								Tipo
							</label>
							<div className='grid grid-cols-3 gap-2'>
								{ramTypeOptions.map((opt) => (
									<SelectionCard
										key={opt.value}
										label={opt.label}
										value={opt.value}
										isSelected={values.ram_type === opt.value}
										onClick={() => onChange('ram_type', opt.value)}
									/>
								))}
							</div>
						</div>
					</div>
				);
			case 2: // Specs - Storage/GPU
				return (
					<div className='space-y-6'>
						<h3 className='mb-4 text-center text-lg font-bold'>
							Almacenamiento y Gráficos
						</h3>

						<div className='rounded-xl border bg-purple-50 p-4 dark:bg-purple-900/10'>
							<label className='mb-3 block text-sm font-bold text-purple-800 dark:text-purple-200'>
								Almacenamiento
							</label>
							<Input
								type='text'
								name='storage_size'
								value={values.storage_size || ''}
								onChange={handleInputChange}
								placeholder='Capacidad (Ej: 1 TB)'
								className='mb-3'
							/>
							<div className='grid grid-cols-2 gap-2 md:grid-cols-4'>
								{storageTechOptions.map((opt) => (
									<SelectionCard
										key={opt.value}
										label={opt.label}
										value={opt.value}
										isSelected={values.storage_technology === opt.value}
										onClick={() => onChange('storage_technology', opt.value)}
									/>
								))}
							</div>
						</div>

						<div className='rounded-xl border bg-orange-50 p-4 dark:bg-orange-900/10'>
							<div className='mb-3 flex items-center justify-between'>
								<label className='text-sm font-bold text-orange-800 dark:text-orange-200'>
									Tarjeta Gráfica Dedicada
								</label>
								<div className='w-24'>
									<YesNoSelector
										label=''
										value={values.has_dedicated_gpu as boolean | undefined}
										onChange={(val) => onChange('has_dedicated_gpu', val)}
									/>
								</div>
							</div>
							{Boolean(values.has_dedicated_gpu) && (
								<Input
									type='text'
									name='gpu_model'
									value={(values.gpu_model as string) || ''}
									onChange={handleInputChange}
									placeholder='Modelo (Ej: NVIDIA GTX 1050)'
									className='animate-in fade-in slide-in-from-top-2'
								/>
							)}
						</div>
					</div>
				);
			case 3: // Power
				return (
					<div className='mx-auto max-w-lg space-y-8'>
						<h3 className='mb-4 text-center text-lg font-bold'>Fuente de Poder</h3>

						<div className='rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-800'>
							<div className='space-y-2'>
								<RangeSlider
									label='Potencia Fuente (Watts)'
									value={(values.charger_watts as string | number) || '0'}
									onChange={(val) => onChange('charger_watts', val)}
									max={300}
								/>
							</div>
						</div>

						<div className='space-y-4'>
							<div className='flex justify-center'>
								<YesNoSelector
									label='¿Incluye Cable de Poder?'
									value={values.includes_charger}
									onChange={(val) => onChange('includes_charger', val)}
								/>
							</div>

							{values.includes_charger && (
								<div className='animate-in fade-in zoom-in duration-200'>
									<label className='mb-2 block text-center text-xs font-bold dark:text-gray-300'>
										Estado del Cable
									</label>
									<div className='grid grid-cols-2 gap-2'>
										{chargerStatusOptions
											.filter((o) => o.value !== 'not_included')
											.map((opt) => (
												<SelectionCard
													key={opt.value}
													label={opt.label}
													value={opt.value}
													isSelected={values.charger_status === opt.value}
													onClick={() =>
														onChange('charger_status', opt.value)
													}
													color={opt.color as any}
												/>
											))}
									</div>
								</div>
							)}
						</div>
					</div>
				);
			case 4: // Connectivity
				const ports = [
					{ label: 'USB-A', name: 'usb_a_ports' },
					{ label: 'USB-C', name: 'usb_c_ports' },
					{ label: 'HDMI', name: 'hdmi_ports' },
					{ label: 'DisplayPort', name: 'displayport_ports' },
					{ label: 'RJ45', name: 'rj45_ports' },
					{ label: 'VGA', name: 'vga_ports' },
					{ label: 'L. SD', name: 'sd_readers' },
				];
				return (
					<div className='space-y-6'>
						<h3 className='mb-4 text-center text-lg font-bold'>Conectividad</h3>
						<div className='grid grid-cols-3 gap-3 md:grid-cols-4'>
							{ports.map((port) => (
								<div key={port.name} className='flex flex-col items-center gap-1'>
									<label className='text-[10px] font-bold uppercase text-gray-500'>
										{port.label}
									</label>
									<StepperInput
										value={getNumericValue(port.name)}
										onChange={(val) => onChange(port.name, val)}
										max={12}
									/>
								</div>
							))}
						</div>

						{/* Added WiFi and Bluetooth */}
						<div className='grid grid-cols-2 gap-6 pt-4'>
							<YesNoSelector
								label='¿Tiene Wi-Fi?'
								value={values.has_wifi}
								onChange={(val) => onChange('has_wifi', val)}
							/>
							<YesNoSelector
								label='¿Tiene Bluetooth?'
								value={values.has_bluetooth}
								onChange={(val) => onChange('has_bluetooth', val)}
							/>
						</div>

						<div className='grid grid-cols-2 gap-6 pt-4'>
							<YesNoSelector
								label='¿Unidad Óptica?'
								value={values.has_cd_drive}
								onChange={(val) => onChange('has_cd_drive', val)}
							/>
							<YesNoSelector
								label='¿Todos los puertos OK?'
								value={values.all_ports_functional}
								onChange={(val) => {
									onChange('all_ports_functional', val);
									if (val === true) {
										onChange('defective_ports_count', 0);
									}
								}}
							/>
						</div>

						{values.all_ports_functional === false && (
							<div className='animate-in zoom-in mt-4 flex flex-col items-center rounded-xl border border-red-200 bg-red-400/50 p-3 backdrop-blur-sm dark:bg-red-900/50'>
								<label className='mb-1 text-sm font-bold text-red-800'>
									Cant. Puertos Malos
								</label>
								<StepperInput
									value={values.defective_ports_count || 0}
									onChange={(val) => {
										onChange('defective_ports_count', val);
										if (val > 0) onChange('all_ports_functional', false);
									}}
								/>
							</div>
						)}
					</div>
				);
			case 5: // Aesthetics
				return (
					<div className='space-y-6'>
						<h3 className='mb-4 text-center text-lg font-bold'>Estética</h3>

						{/* General Condition */}
						<div className='mb-6 grid grid-cols-2 gap-3 md:grid-cols-3'>
							{generalConditionOptions.map((opt) => (
								<SelectionCard
									key={opt.value}
									label={opt.label}
									value={opt.value}
									isSelected={values.general_condition === opt.value}
									onClick={() => onChange('general_condition', opt.value)}
									color={opt.color as any}
									icon={opt.icon}
								/>
							))}
						</div>

						{/* Cover Condition */}
						<div className='rounded-xl border bg-gray-50 p-4 dark:bg-gray-800/30'>
							<label className='mb-3 block text-center text-sm font-bold dark:text-gray-300'>
								Estado Carcasa (Cover)
							</label>
							<div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
								{coverConditionOptions.map((opt) => (
									<SelectionCard
										key={opt.value}
										label={opt.label}
										value={opt.value}
										isSelected={values.cover_condition === opt.value}
										onClick={() => onChange('cover_condition', opt.value)}
										color={opt.color as any}
									/>
								))}
							</div>
						</div>
					</div>
				);
			case 6: // OS & Obs
				return (
					<div className='flex h-full flex-col space-y-6'>
						<h3 className='mb-4 text-center text-lg font-bold'>Sistema y Notas</h3>
						<div className='mb-4 flex justify-center'>
							<div className='w-full max-w-sm'>
								<SoSelector
									value={values.operating_system || ''}
									onChange={(val) => onChange('operating_system', val)}
									disabled={readOnly}
								/>
							</div>
						</div>
						<div className='flex flex-grow flex-col'>
							<label className='mb-2 block text-sm font-bold'>Observaciones</label>
							<Textarea
								name='observations'
								value={values.observations || ''}
								onChange={handleTextareaChange}
								placeholder='Observaciones finales...'
								className='flex-grow resize-none'
							/>
						</div>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div className='flex h-[calc(100vh-250px)] min-h-[500px] select-none flex-col'>
			<div className='relative flex-grow overflow-y-auto overflow-x-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50'>
				<AnimatePresence mode='wait'>
					<motion.div
						key={step}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.2 }}
						className='h-full'>
						{renderStepContent()}
					</motion.div>
				</AnimatePresence>
			</div>

			<div className='mt-4 flex items-center justify-between'>
				<Button
					color='gray'
					variant='outline'
					onClick={handlePreviousStep}
					disabled={step === 0}
					className='h-10 w-24'>
					Anterior
				</Button>

				<div className='flex gap-1'>
					{Array.from({ length: MAX_STEPS }).map((_, i) => (
						<div
							key={i}
							className={`h-2 rounded-full transition-all duration-300 ${
								i === step ? 'w-6 bg-blue-600' : 'w-2 bg-gray-300 dark:bg-gray-600'
							}`}
						/>
					))}
				</div>

				<Button
					color={step === MAX_STEPS - 1 ? 'green' : 'blue'}
					onClick={handleNextStep}
					className='h-10 w-24 shadow-md'>
					{step === MAX_STEPS - 1 ? 'Finalizar' : 'Siguiente'}
				</Button>
			</div>
		</div>
	);
};

export default DesktopForm;
