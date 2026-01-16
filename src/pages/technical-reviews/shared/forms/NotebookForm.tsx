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
import { 
	GENERAL_CONDITION_OPTIONS,
	RAM_TYPE_OPTIONS,
	STORAGE_TECH_OPTIONS,
	CHARGER_STATUS_OPTIONS 
} from '../constants/formOptions';
import { SelectionCard } from '../components/SelectionCard';
import { YesNoSelector } from '../components/YesNoSelector';



// --- MAIN COMPONENT ---

interface NotebookFormProps {
	branchId: number;
	values: Partial<UpdateItemDetailsPayload>;
	onChange: (field: string, value: unknown) => void;
	readOnly?: boolean;
	onFinalize?: () => void | Promise<void>;
	onBack?: () => void;
	isUpdating?: boolean;
	isFormValid?: boolean;
}

const NotebookForm: React.FC<NotebookFormProps> = ({
	branchId,
	values,
	onChange,
	readOnly = false,
	onFinalize,
	isUpdating = false,
	isFormValid = true,
}) => {
	const dispatch = useAppDispatch();
	// const validationRules = useAppSelector((s) => s.technicalReviews.validationRules);
	const validationLoading = useAppSelector((s) => s.technicalReviews.validationRulesLoading);

	const brands = useAppSelector((s) => s.brands.items);
	const brandsLoading = useAppSelector((s) => s.brands.loading);

	const [step, setStep] = useState(0);

	useEffect(() => {
		if (branchId) {
			dispatch(fetchValidationRulesByType({ branchId, equipmentType: 'notebook' }));
			dispatch(fetchBrands({ branchId }));
		}
	}, [dispatch, branchId]);

	const isDell = values.brand?.toLowerCase() === 'dell';
	const doesNotTurnOn = values.extra_attributes?.does_not_turn_on === true;

	const brandOptions: TSelectOption[] = brands.map((brand) => ({
		value: brand.name,
		label: brand.name,
	}));

	// Using shared constants from formOptions
	const generalConditionOptions = GENERAL_CONDITION_OPTIONS;
	const ramTypeOptions = RAM_TYPE_OPTIONS;
	const storageTechOptions = STORAGE_TECH_OPTIONS;
	const chargerStatusOptions = CHARGER_STATUS_OPTIONS;

	// NotebookForm-specific constants
	const batteryStatusDellOptions = [
		{ value: 'excellent', label: 'Excellent', color: 'green' },
		{ value: 'good', label: 'Good', color: 'green' },
		{ value: 'fair', label: 'Fair', color: 'yellow' },
		{ value: 'poor', label: 'Poor', color: 'red' },
		{ value: 'no_battery', label: 'No Battery', color: 'gray' },
	];

	const conditionOptions = [
		{ value: 'ok', label: 'OK', color: 'green' },
		{ value: 'worn', label: 'Desgastado', color: 'yellow' },
		{ value: 'missing_pieces', label: 'Faltan piezas', color: 'red' },
		{ value: 'broken', label: 'Roto', color: 'red' },
	];

	const keyboardLayoutOptions = [
		{ value: 'es', label: 'Español (ES)', icon: 'HeroLanguage' },
		{ value: 'us', label: 'Inglés (US)', icon: 'HeroGlobeAmericas' },
	];

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

	const handleCheckboxChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(name, e.target.checked);
	};

	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.name, e.target.value);
	};

	// --- WIZARD LOGIC ---

	const MAX_STEPS = 9;

	const handleNextStep = () => {
		if (step < MAX_STEPS - 1) setStep((prev) => prev + 1);
		else toast.info('Formulario completo.');
	};

	const handlePreviousStep = () => {
		if (step > 0) setStep((prev) => prev - 1);
	};

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
			case 0: // Información General
				return (
					<div className='space-y-6'>
						<h3 className='text-xl font-bold mb-4 text-center dark:text-gray-100'>Información Básica</h3>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<div className='col-span-full md:col-span-1'>
								<label className='block text-sm font-bold mb-2 dark:text-gray-300'>Marca *</label>
								<SelectReact
									name='brand'
									options={brandOptions}
									value={brandOptions.find((o) => o.value === values.brand) || null}
									onChange={handleSelectChange('brand')}
									placeholder='Seleccionar marca'
									isDisabled={readOnly}
								/>
							</div>
							<div className='col-span-full md:col-span-1'>
								<label className='block text-sm font-bold mb-2 dark:text-gray-300'>Modelo *</label>
								<Input
									type='text'
									name='model'
									value={values.model || ''}
									onChange={handleInputChange}
									placeholder='LATITUDE 5420'
									className='h-11 text-lg'
								/>
							</div>
							<div className='col-span-full'>
								<label className='block text-sm font-bold mb-2 dark:text-gray-300'>Línea / Serie</label>
								<Input
									type='text'
									name='line'
									value={values.line || ''}
									onChange={handleInputChange}
									placeholder='Ej: EliteBook'
									className='h-11'
								/>
							</div>
						</div>
					</div>
				);
			case 1: // Specs
				return (
					<div className='space-y-6'>
						<h3 className='text-xl font-bold mb-4 text-center dark:text-gray-100'>Hardware</h3>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<div className='col-span-full'>
								<label className='block text-sm font-bold mb-2 dark:text-gray-300'>Procesador *</label>
								<ProcessorSelector
									deviceType='Notebook'
									value={values.processor || ''}
									onChange={(val) => onChange('processor', val)}
									disabled={readOnly}
								/>
							</div>
							
							{/* RAM Section */}
							<div className='rounded-xl border p-4 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-900/30'>
								<label className='block text-sm font-bold mb-4 text-blue-800 dark:text-blue-200'>Memoria RAM</label>
								<div className='grid grid-cols-2 gap-4 mb-4'>
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
										placeholder='Slots (Ej: 8x2)'
									/>
								</div>
								<label className='block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400'>Tipo</label>
								<div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
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

							{/* Storage Section */}
							<div className='rounded-xl border p-4 bg-purple-50/50 dark:bg-purple-900/10 dark:border-purple-900/30'>
								<label className='block text-sm font-bold mb-4 text-purple-800 dark:text-purple-200'>Almacenamiento</label>
								<div className='mb-4'>
									<Input
										type='text'
										name='storage_size'
										value={values.storage_size || ''}
										onChange={handleInputChange}
										placeholder='Capacidad (Ej: 512 GB)'
									/>
								</div>
								<label className='block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400'>Tecnología</label>
								<div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
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
						</div>
					</div>
				);
			case 2: // Power
				return (
						<div className='max-w-6xl mx-auto space-y-4 p-2'>
							<h3 className='text-lg font-bold text-center dark:text-gray-100 uppercase tracking-wider'>Energía</h3>

							<div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
							
							{/* Columna Izquierda: Cargador (7/12 del ancho) */}
							<section className='lg:col-span-7 space-y-4'>
								<div className='bg-gray-800/20 p-4 rounded-2xl border border-gray-700/50'>
								<YesNoSelector
									className='w-full'
									label='¿Incluye Cargador Original?'
									value={values.includes_charger}
									onChange={(val) => onChange('includes_charger', val)}
								/>

								{values.includes_charger && (
									<div className='mt-4 space-y-4 animate-in fade-in zoom-in-95 duration-300'>
									{/* Slider Compacto */}
									<div className='px-4 py-2 border rounded-xl bg-white/5 dark:bg-gray-800/50'>
										<RangeSlider
										label='Potencia (Watts)'
										value={values.charger_watts || '0'}
										onChange={(val) => onChange('charger_watts', val)}
										max={300}
										/>
									</div>

									{/* Grid de estados pequeño */}
									<div className='grid grid-cols-2 gap-2'>
										{chargerStatusOptions.map((opt) => (
										<SelectionCard
											key={opt.value}
											label={opt.label}
											value={opt.value}
											isSelected={values.charger_status === opt.value}
											onClick={() => onChange('charger_status', opt.value)}
											color={opt.color as any}
											className='py-2 text-sm' // Hacemos las tarjetas más bajas
										/>
										))}
									</div>
									</div>
								)}
								</div>
							</section>

							{/* Columna Derecha: Batería (5/12 del ancho) */}
							<section className='lg:col-span-5 h-full'>
								<div className='bg-gray-800/20 p-4 rounded-2xl border border-gray-700/50 h-full flex flex-col justify-center'>
								<label className='block text-sm font-semibold mb-4 text-center text-gray-400 uppercase'>
									Estado Batería {isDell && '(BIOS)'}
								</label>
								
								{isDell ? (
									<div className='grid grid-cols-2 gap-2'>
									{batteryStatusDellOptions.map((opt) => (
										<SelectionCard
										key={opt.value}
										label={opt.label}
										value={opt.value}
										isSelected={values.battery_status === opt.value}
										onClick={() => onChange('battery_status', opt.value)}
										color={opt.color as any}
										className='py-3'
										/>
									))}
									</div>
								) : (
									<div className='flex items-center justify-center gap-4'>
									<div className='relative w-32'>
										<Input
										name='status_batery'
										type='number'
										value={values.battery_status?.replace('%', '') || ''}
										onChange={(e) => {
											const val = Math.min(100, Math.max(0, Number(e.target.value)));
											onChange('battery_status', val ? `${val}%` : '');
										}}
										className='text-center text-4xl h-20 rounded-xl font-bold bg-transparent border-2 border-primary/30'
										/>
										<span className='absolute -right-8 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-500'>%</span>
									</div>
									</div>
								)}
								<p className='text-[10px] text-center mt-4 text-gray-500 italic'>Información de salud del componente</p>
								</div>
							</section>

							</div>
						</div>
					);

			case 3: // Ports
				const ports = [
					{ label: 'USB-A', name: 'usb_a_ports' },
					{ label: 'USB-C', name: 'usb_c_ports' },
					{ label: 'HDMI', name: 'hdmi_ports' },
					{ label: 'DisplayPort', name: 'displayport_ports' },
					{ label: 'RJ45', name: 'rj45_ports' },
					{ label: 'VGA', name: 'vga_ports' },
				];
				return (
					<div className='space-y-6'>
						<h3 className='text-xl font-bold mb-6 text-center dark:text-gray-100'>Conectividad</h3>
						<div className='grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8'>
							{ports.map((port) => (
								<div key={port.name} className='flex flex-col items-center gap-2'>
									<label className='font-semibold text-gray-600 dark:text-gray-300'>{port.label}</label>
									<StepperInput
										value={values[port.name as keyof UpdateItemDetailsPayload] as number || 0}
										onChange={(val) => onChange(port.name, val)}
										max={10}
									/>
								</div>
							))}
						</div>
						<div className='pt-8 grid grid-cols-1 md:grid-cols-3 gap-6'>
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
							<YesNoSelector
								label='¿Todos los Puertos OK?'
								value={values.all_ports_functional}
								onChange={(val) => onChange('all_ports_functional', val)}
							/>
						</div>
						{values.all_ports_functional === false && (
							<div className='mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-900/50 flex flex-col items-center animate-in zoom-in duration-300'>
								<label className='text-red-800 dark:text-red-200 font-bold mb-2'>Puertos Dañados</label>
								<StepperInput
									value={values.defective_ports_count || 0}
									onChange={(val) => onChange('defective_ports_count', val)}
								/>
							</div>
						)}
					</div>
				);
			case 4: // Screen
				return (
					<div className='space-y-6'>
						<h3 className='text-xl font-bold mb-4 text-center dark:text-gray-100'>Pantalla</h3>
						<div className='space-y-8 max-w-3xl mx-auto'>
							<div>
								<Input
									type='text'
									name='screen_inches'
									value={values.screen_inches || ''}
									onChange={handleInputChange}
									placeholder='Tamaño/Resolución (Ej: 14" FHD)'
									className='text-center text-lg h-14'
								/>
							</div>
							
							<div>
								<label className='block text-sm font-bold mb-3 text-center dark:text-gray-300'>Estado Físico</label>
								<div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
									{conditionOptions.map((opt) => (
										<SelectionCard
											key={opt.value}
											label={opt.label}
											value={opt.value}
											isSelected={values.screen_condition === opt.value}
											onClick={() => onChange('screen_condition', opt.value)}
											color={opt.color as any}
										/>
									))}
								</div>
							</div>

							<div className='flex justify-center'>
								<div className='w-full max-w-xs'>
									<YesNoSelector
										label='¿Pantalla Táctil?'
										value={values.is_touchscreen}
										onChange={(val) => onChange('is_touchscreen', val)}
									/>
								</div>
							</div>
						</div>
					</div>
				);
			case 5: // Input Devices
				return (
					<div className='space-y-8'>
						<h3 className='text-xl font-bold mb-4 text-center dark:text-gray-100'>Teclado y Touchpad</h3>
						
						{/* Keyboard Layout */}
						<div className='flex justify-center gap-4'>
							{keyboardLayoutOptions.map((opt) => (
								<SelectionCard
									key={opt.value}
									label={opt.label}
									value={opt.value}
									isSelected={values.keyboard_layout === opt.value}
									onClick={() => onChange('keyboard_layout', opt.value)}
									icon={opt.icon}
									className='w-40'
								/>
							))}
						</div>

						{/* Keyboard Condition */}
						<div>
							<label className='block text-sm font-bold mb-2 dark:text-gray-300'>Condición Teclado</label>
							<div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
								{conditionOptions.map((opt) => (
									<SelectionCard
										key={`kb-${opt.value}`}
										label={opt.label}
										value={opt.value}
										isSelected={values.keyboard_condition === opt.value}
										onClick={() => onChange('keyboard_condition', opt.value)}
										color={opt.color as any}
									/>
								))}
							</div>
						</div>

						{/* Features */}
						<div className='grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto'>
							<YesNoSelector
								label='¿Teclado Numérico?'
								value={values.has_numeric_keypad}
								onChange={(val) => onChange('has_numeric_keypad', val)}
							/>
							<YesNoSelector
								label='¿Retroiluminado?'
								value={values.has_backlit_keyboard}
								onChange={(val) => onChange('has_backlit_keyboard', val)}
							/>
						</div>

						{/* Touchpad */}
						<div>
							<label className='block text-sm font-bold mb-2 dark:text-gray-300'>Condición Touchpad</label>
							<div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
								{conditionOptions.map((opt) => (
									<SelectionCard
										key={`tp-${opt.value}`}
										label={opt.label}
										value={opt.value}
										isSelected={values.touchpad_condition === opt.value}
										onClick={() => onChange('touchpad_condition', opt.value)}
										color={opt.color as any}
									/>
								))}
							</div>
						</div>
					</div>
				);
			case 6: // Aesthetics
				const aestheticParts = [
					{ label: 'Tapa Superior (Cover)', field: 'cover_condition' },
					{ label: 'Bisagras', field: 'hinge_condition' },
					{ label: 'Base Inferior', field: 'bottom_condition' },
				];

				return (
					<div className='space-y-8'>
						<h3 className='text-xl font-bold mb-4 text-center dark:text-gray-100'>Estética General</h3>
						
						{/* Overall Grade Card Grid */}
						<div className='grid grid-cols-2 md:grid-cols-3 gap-3 mb-8'>
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

						{/* Detail Parts */}
						<div className='space-y-6'>
							{aestheticParts.map((part) => (
								<div key={part.field}>
									<label className='block text-sm font-semibold mb-2 text-gray-500 dark:text-gray-400'>{part.label}</label>
									<div className='flex gap-2 overflow-x-auto pb-2'>
										{conditionOptions.map((opt) => (
											<div 
												key={opt.value}
												onClick={() => onChange(part.field, opt.value)}
												className={`
													flex-1 min-w-[80px] p-2 text-center text-sm rounded-lg border cursor-pointer transition-colors
													${values[part.field as keyof UpdateItemDetailsPayload] === opt.value
														? `bg-${opt.color}-100 border-${opt.color}-500 font-bold text-${opt.color}-800 dark:bg-${opt.color}-900/60 dark:text-${opt.color}-200`
														: `bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700`
													}
												`}
											>
												{opt.label}
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				);
			case 7: // OS
				return (
					<div className='flex flex-col items-center justify-center h-full'>
						<h3 className='text-2xl font-bold mb-8 dark:text-gray-100'>Sistema Operativo</h3>
						<div className='w-full max-w-md scale-110 origin-top'>
							<SoSelector
								value={values.operating_system || ''}
								onChange={(val) => onChange('operating_system', val)}
								disabled={readOnly}
							/>
						</div>
					</div>
				);
			case 8: // Obs
				return (
					<div className='h-full flex flex-col'>
						<h3 className='text-xl font-bold mb-4 text-center dark:text-gray-100'>Observaciones Finales</h3>
						<Textarea
							name='observations'
							value={values.observations || ''}
							onChange={handleTextareaChange}
							placeholder='Detalles, fallas específicas, número de activo fijo, etc...'
							className='flex-grow text-lg p-4'
						/>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div className='flex flex-col h-[calc(100vh-250px)] min-h-[600px] select-none'>
			<div className='flex-grow overflow-y-auto overflow-x-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 p-6 dark:border-gray-700 dark:bg-gray-800/50 relative'>
				<AnimatePresence mode='wait'>
					<motion.div
						key={step}
						initial={{ opacity: 0, x: 50 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -50 }}
						transition={{ duration: 0.2 }}
						className='h-full'
					>
						{renderStepContent()}
					</motion.div>
				</AnimatePresence>
			</div>

			<div className='mt-6 flex items-center justify-between'>
				<Button
					color='gray'
					variant='outline'
					onClick={handlePreviousStep}
					disabled={step === 0}
					className='w-32 h-12 text-lg dark:text-white dark:border-gray-600 dark:hover:bg-gray-700'
				>
					Anterior
				</Button>

				<div className='flex gap-1.5'>
					{Array.from({ length: MAX_STEPS }).map((_, i) => (
						<div
							key={i}
							className={`h-3 rounded-full transition-all duration-300 ${
								i === step ? 'w-8 bg-blue-600' : 'w-3 bg-gray-300 dark:bg-gray-600'
							}`}
						/>
					))}
				</div>

				<Button
				color={step === MAX_STEPS - 1 ? 'green' : 'blue'}
				onClick={step === MAX_STEPS - 1 && onFinalize ? onFinalize : handleNextStep}
				disabled={isUpdating || (step === MAX_STEPS - 1 && !isFormValid)}
				className='w-32 h-12 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all'
			>
				{isUpdating ? 'Procesando...' : (step === MAX_STEPS - 1 ? 'Finalizar Revisión' : 'Siguiente')}
			</Button>
			</div>
		</div>
	);
};

export default NotebookForm;
