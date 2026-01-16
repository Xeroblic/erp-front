import React, { useEffect, useState } from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Icon from '@/components/icon/Icon';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBrands } from '@/store/slices/brands/brandsSlice';
import type { UpdateItemDetailsPayload } from '@/interface/technicalReviews.interface';
import Button from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { MultiValue, SingleValue } from 'react-select';
import { ProcessorSelector } from '../components/ProcessorSelector';
import { SoSelector } from '../components/SoSelector';
import { StepperInput } from '../components/StepperInput';
import { SelectionCard } from '../components/SelectionCard';
import { YesNoSelector } from '../components/YesNoSelector';
import { 
	GENERAL_CONDITION_OPTIONS,
	RAM_TYPE_OPTIONS,
	STORAGE_TECH_OPTIONS,
	CHARGER_STATUS_OPTIONS,
	COVER_CONDITION_OPTIONS,
	SCREEN_CONDITION_OPTIONS,
	STAND_CONDITION_OPTIONS 
} from '../constants/formOptions';

// --- HELPER COMPONENTS ---


// --- MAIN FORM ---

interface AioFormProps {
	branchId: number;
	values: Partial<UpdateItemDetailsPayload>;
	onChange: (field: string, value: unknown) => void;
	readOnly?: boolean;
}

const AioForm: React.FC<AioFormProps> = ({ branchId, values, onChange, readOnly = false }) => {
	const dispatch = useAppDispatch();
	const [step, setStep] = useState(0);
	const MAX_STEPS = 7;

	useEffect(() => {
		if (branchId) {
			dispatch(fetchBrands({ branchId }));
		}
	}, [dispatch, branchId]);

	const brands = useAppSelector((s) => s.brands.items);
	const brandsLoading = useAppSelector((s) => s.brands.loading);

	const brandOptions: TSelectOption[] = brands.map((brand) => ({
		value: brand.name,
		label: brand.name,
	}));

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

	const handleNextStep = () => {
		if (step < MAX_STEPS - 1) setStep(step + 1);
	};

	const handlePreviousStep = () => {
		if (step > 0) setStep(step - 1);
	};

	const getNumericValue = (field: string): number => {
		const val = values[field as keyof UpdateItemDetailsPayload];
		return typeof val === 'number' ? val : 0;
	};

	// Using shared constants from formOptions
	const generalConditionOptions = GENERAL_CONDITION_OPTIONS;
	const storageTechOptions = STORAGE_TECH_OPTIONS;
	const ramTypeOptions = RAM_TYPE_OPTIONS;
	const chargerStatusOptions = CHARGER_STATUS_OPTIONS;
	const screenConditionOptions = SCREEN_CONDITION_OPTIONS;
	const standConditionOptions = STAND_CONDITION_OPTIONS;
	const coverConditionOptions = COVER_CONDITION_OPTIONS;

	if (brandsLoading) {
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
			case 0: // Info Básica
				return (
					<motion.div
						key='step0'
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}
					>
						<div className='space-y-6'>
							<h3 className='text-lg font-bold mb-4 text-center'>Información Básica</h3>

							<div className='rounded-xl border p-4 bg-blue-50/50 dark:bg-blue-900/10'>
								<label className='block text-sm font-bold mb-3 text-blue-800 dark:text-blue-200'>
									Marca
								</label>
								<SelectReact
									name='brand'
									options={brandOptions}
									value={brandOptions.find((o) => o.value === values.brand) || null}
									onChange={handleSelectChange('brand')}
									placeholder='Seleccionar marca'
									isDisabled={readOnly}
									isCreatable
								/>
							</div>

							<div className='rounded-xl border p-4 bg-purple-50/50 dark:bg-purple-900/10'>
								<label className='block text-sm font-bold mb-3 text-purple-800 dark:text-purple-200'>
									Modelo
								</label>
								<Input
									type='text'
									name='model'
									value={values.model || ''}
									onChange={handleInputChange}
									placeholder='Ej: OptiPlex 7470'
									disabled={readOnly}
								/>
							</div>

							<div className='rounded-xl border p-4 bg-green-50/50 dark:bg-green-900/10'>
								<label className='block text-sm font-bold mb-3 text-green-800 dark:text-green-200'>
									Procesador
								</label>
								<ProcessorSelector
									deviceType='AIO'
									value={values.processor || ''}
									onChange={(processorText) => onChange('processor', processorText)}
									disabled={readOnly}
								/>
							</div>

							<div className='rounded-xl border p-4 bg-orange-50/50 dark:bg-orange-900/10'>
								<label className='block text-sm font-bold mb-3 text-orange-800 dark:text-orange-200'>
									Pulgadas Pantalla
								</label>
								<Input
									type='text'
									name='screen_inches'
									value={values.screen_inches || ''}
									onChange={handleInputChange}
									placeholder='Ej: 24"'
									disabled={readOnly}
								/>
							</div>
						</div>
					</motion.div>
				);

			case 1: // RAM
				return (
					<motion.div
						key='step1'
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}
					>
						<div className='space-y-6'>
							<h3 className='text-lg font-bold mb-4 text-center'>Memoria RAM</h3>

							<div className='rounded-xl border p-4 bg-green-50/50 dark:bg-green-900/10'>
								<label className='block text-sm font-bold mb-3 text-green-800 dark:text-green-200'>
									Tamaño
								</label>
								<Input
									type='text'
									name='ram_size'
									value={values.ram_size || ''}
									onChange={handleInputChange}
									placeholder='Ej: 16'
									disabled={readOnly}
								/>
							</div>

							<div className='rounded-xl border p-4 bg-blue-50/50 dark:bg-blue-900/10'>
								<label className='block text-sm font-bold mb-3 text-blue-800 dark:text-blue-200'>
									Slots
								</label>
								<Input
									type='text'
									name='ram_slots'
									value={values.ram_slots || ''}
									onChange={handleInputChange}
									placeholder='Ej: 8x2'
									disabled={readOnly}
								/>
							</div>

							<div className='rounded-xl border p-4 bg-purple-50/50 dark:bg-purple-900/10'>
								<label className='block text-sm font-bold mb-3 text-purple-800 dark:text-purple-200 text-center'>
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
					</motion.div>
				);

			case 2: // Storage
				return (
					<motion.div
						key='step2'
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}
					>
						<div className='space-y-6'>
							<h3 className='text-lg font-bold mb-4 text-center'>Almacenamiento</h3>

							<div className='rounded-xl border p-4 bg-purple-50/50 dark:bg-purple-900/10'>
								<label className='block text-sm font-bold mb-3 text-purple-800 dark:text-purple-200'>
									Capacidad
								</label>
								<Input
									type='text'
									name='storage_size'
									value={values.storage_size || ''}
									onChange={handleInputChange}
									placeholder='Ej: 512 GB'
									disabled={readOnly}
								/>
							</div>

							<div className='rounded-xl border p-4 bg-orange-50/50 dark:bg-orange-900/10'>
								<label className='block text-sm font-bold mb-3 text-orange-800 dark:text-orange-200 text-center'>
									Tecnología
								</label>
								<div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
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
					</motion.div>
				);

			case 3: // Pantalla
				return (
					<motion.div
						key='step3'
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}
					>
						<div className='space-y-6'>
							<h3 className='text-lg font-bold mb-4 text-center'>Pantalla y Base</h3>

							<div className='rounded-xl border p-4 bg-purple-50/50 dark:bg-purple-900/10'>
								<label className='block text-sm font-bold mb-3 text-purple-800 dark:text-purple-200 text-center'>
									Condición Pantalla
								</label>
								<div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
									{screenConditionOptions.map((opt) => (
										<SelectionCard
											key={opt.value}
											label={opt.label}
											value={opt.value}
											isSelected={values.screen_condition === opt.value}
											onClick={() => onChange('screen_condition', opt.value)}
											color={opt.color as 'green' | 'red' | 'yellow'}
										/>
									))}
								</div>
							</div>

							<div className='rounded-xl border p-4 bg-blue-50/50 dark:bg-blue-900/10'>
								<label className='block text-sm font-bold mb-3 text-blue-800 dark:text-blue-200 text-center'>
									Condición Base/Soporte
								</label>
								<div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
									{standConditionOptions.map((opt) => (
										<SelectionCard
											key={opt.value}
											label={opt.label}
											value={opt.value}
											isSelected={values.stand_condition === opt.value}
											onClick={() => onChange('stand_condition', opt.value)}
											color={opt.color as 'green' | 'red' | 'yellow'}
										/>
									))}
								</div>
							</div>

							<YesNoSelector
								label='¿Es Táctil?'
								value={values.is_touchscreen}
								onChange={(val) => onChange('is_touchscreen', val)}
							/>
						</div>
					</motion.div>
				);

			case 4: // Puertos
				const ports = [
					{ label: 'USB-A', name: 'usb_a_ports' },
					{ label: 'USB-C', name: 'usb_c_ports' },
					{ label: 'HDMI', name: 'hdmi_ports' },
					{ label: 'DisplayPort', name: 'displayport_ports' },
					{ label: 'VGA', name: 'vga_ports' },
					{ label: 'RJ45', name: 'rj45_ports' },
					{ label: 'L. SD', name: 'sd_readers' },
				];
				return (
					<motion.div
						key='step4'
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}
					>
						<div className='space-y-6'>
							<h3 className='text-lg font-bold mb-4 text-center'>Puertos</h3>
							<div className='grid grid-cols-3 md:grid-cols-4 gap-3'>
								{ports.map((port) => (
									<div key={port.name} className='flex flex-col items-center gap-1'>
										<label className='text-[10px] font-bold text-gray-500 uppercase'>{port.label}</label>
										<StepperInput
											value={getNumericValue(port.name)}
											onChange={(val) => onChange(port.name, val)}
											max={12}
										/>
									</div>
								))}
							</div>

							<div className='rounded-xl border border-gray-200 p-4 bg-gray-50/50 dark:bg-gray-900/10'>
								<YesNoSelector
									label='¿Todos los Puertos OK?'
									value={values.all_ports_functional}
									onChange={(val) => {
										onChange('all_ports_functional', val);
										if (val === true) {
											onChange('defective_ports_count', 0);
										}
									}}
								/>

								{values.all_ports_functional === false && (
									<div className='mt-4 p-3 bg-red-50 rounded-xl border border-red-200 flex flex-col items-center animate-in zoom-in'>
										<label className='text-red-800 font-bold mb-1 text-sm'>Puertos Defectuosos</label>
										<StepperInput
											value={getNumericValue('defective_ports_count')}
											onChange={(val) => onChange('defective_ports_count', val)}
										/>
										<p className='text-xs text-red-700 text-center mt-2'>
											⚠️ Más de 1 puerto = Grado M automático
										</p>
									</div>
								)}
							</div>
						</div>
					</motion.div>
				);

			case 5: // Conectividad & Alimentación
				return (
					<motion.div
						key='step5'
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}
					>
						<div className='space-y-6'>
							<h3 className='text-lg font-bold mb-4 text-center'>Conectividad y Alimentación</h3>

							<div className='grid grid-cols-2 gap-4'>
								<YesNoSelector
									label='¿Tiene WiFi?'
									value={values.has_wifi}
									onChange={(val) => onChange('has_wifi', val)}
								/>

								<YesNoSelector
									label='¿Tiene Bluetooth?'
									value={values.has_bluetooth}
									onChange={(val) => onChange('has_bluetooth', val)}
								/>
							</div>

							<YesNoSelector
								label='¿Tiene Unidad Óptica (CD/DVD)?'
								value={values.has_cd_drive}
								onChange={(val) => onChange('has_cd_drive', val)}
							/>

							<div className='rounded-xl border p-4 bg-yellow-50/50 dark:bg-yellow-900/10'>
								<YesNoSelector
									label='¿Incluye Cargador/Adaptador?'
									value={values.includes_charger || values.includes_power_adapter}
									onChange={(val) => {
										onChange('includes_charger', val);
										onChange('includes_power_adapter', val);
										if (!val) {
											onChange('charger_status', 'not_included');
										}
									}}
								/>

								{(values.includes_charger || values.includes_power_adapter) && (
									<div className='mt-4 animate-in fade-in zoom-in'>
										<label className='block text-sm font-bold mb-2 text-center dark:text-gray-300'>
											Estado del Cargador
										</label>
										<div className='grid grid-cols-2 gap-2'>
											{chargerStatusOptions
												.filter((opt) => opt.value !== 'not_included')
												.map((opt) => (
													<SelectionCard
														key={opt.value}
														label={opt.label}
														value={opt.value}
														isSelected={values.charger_status === opt.value}
														onClick={() => onChange('charger_status', opt.value)}
														color={opt.color as 'green' | 'red' | 'yellow'}
													/>
												))}
										</div>
									</div>
								)}
							</div>
						</div>
					</motion.div>
				);

			case 6: // Condición & OS
				return (
					<motion.div
						key='step6'
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}
					>
						<div className='space-y-6'>
							<h3 className='text-lg font-bold mb-4 text-center'>Condición y Sistema</h3>

							<div className='rounded-xl border p-4 bg-green-50/50 dark:bg-green-900/10'>
								<label className='block text-sm font-bold mb-3 text-green-800 dark:text-green-200 text-center'>
									Condición General
								</label>
								<div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
									{generalConditionOptions.map((opt) => (
										<SelectionCard
											key={opt.value}
											label={opt.label}
											value={opt.value}
											isSelected={values.general_condition === opt.value}
											onClick={() => onChange('general_condition', opt.value)}
											color={opt.color as 'green' | 'red' | 'yellow'}
										/>
									))}
								</div>
							</div>

							<div className='rounded-xl border p-4 bg-orange-50/50 dark:bg-orange-900/10'>
								<label className='block text-sm font-bold mb-3 text-orange-800 dark:text-orange-200 text-center'>
									Condición Carcasa
								</label>
								<div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
									{coverConditionOptions.map((opt) => (
										<SelectionCard
											key={opt.value}
											label={opt.label}
											value={opt.value}
											isSelected={values.cover_condition === opt.value}
											onClick={() => onChange('cover_condition', opt.value)}
											color={opt.color as 'green' | 'red' | 'yellow'}
										/>
									))}
								</div>
							</div>

							<div className='rounded-xl border p-4 bg-blue-50/50 dark:bg-blue-900/10'>
								<label className='block text-sm font-bold mb-3 text-blue-800 dark:text-blue-200'>
									Sistema Operativo
								</label>
								<SoSelector
									value={values.operating_system || ''}
									onChange={(os) => onChange('operating_system', os)}
									disabled={readOnly}
								/>
							</div>

							<div className='rounded-xl border p-4 bg-gray-50/50 dark:bg-gray-900/10'>
								<label className='block text-sm font-bold mb-3 dark:text-gray-300'>
									Observaciones
								</label>
								<Textarea
									name='observations'
									value={values.observations || ''}
									onChange={handleInputChange}
									placeholder='Ej: Base con pequeño rayón en la parte trasera...'
									rows={4}
									disabled={readOnly}
								/>
							</div>
						</div>
					</motion.div>
				);

			default:
				return null;
		}
	};

	return (
		<Card>
			<CardBody>
				<AnimatePresence mode='wait'>{renderStepContent()}</AnimatePresence>

				{/* Navigation */}
				<div className='flex items-center justify-between rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800 mt-6'>
					<Button
						variant='outline'
						onClick={handlePreviousStep}
						isDisable={step === 0}
						icon='HeroArrowLeft'
					>
						Anterior
					</Button>

					<div className='flex gap-2'>
						{Array.from({ length: MAX_STEPS }).map((_, i) => (
							<div
								key={i}
								className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
									i === step
										? 'bg-blue-600 w-8'
										: i < step
											? 'bg-blue-400'
											: 'bg-gray-300 dark:bg-gray-600'
								}`}
							/>
						))}
					</div>

					<Button
						color='green'
						onClick={handleNextStep}
						isDisable={false}
						icon={step === MAX_STEPS - 1 ? 'HeroCheckCircle' : 'HeroArrowRight'}
					>
						{step === MAX_STEPS - 1 ? 'Finalizar Revisión' : 'Siguiente'}
					</Button>
				</div>
			</CardBody>
		</Card>
	);
};

export default AioForm;
