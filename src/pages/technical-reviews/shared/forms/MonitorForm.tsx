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
import { fetchValidationRulesByType } from '@/store/slices/technicalReviews';
import { MultiValue, SingleValue } from 'react-select';
import { StepperInput } from '../components/StepperInput';
import { YesNoSelector } from '../components/YesNoSelector';
import { SelectionCard } from '../components/SelectionCard';
import {
	GENERAL_CONDITION_OPTIONS,
	SCREEN_CONDITION_OPTIONS,
	STAND_CONDITION_OPTIONS,
} from '../constants/formOptions';

// --- MAIN FORM ---

interface MonitorFormProps {
	branchId: number;
	values: Partial<UpdateItemDetailsPayload>;
	onChange: (field: string, value: unknown) => void;
	readOnly?: boolean;
}

const MonitorForm: React.FC<MonitorFormProps> = ({
	branchId,
	values,
	onChange,
	readOnly = false,
}) => {
	const dispatch = useAppDispatch();
	const [step, setStep] = useState(0);
	const MAX_STEPS = 5;

	useEffect(() => {
		dispatch(fetchBrands({ branchId: branchId }));
	}, [dispatch, branchId]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		onChange(e.target.name, e.target.value);
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
	const screenConditionOptions = SCREEN_CONDITION_OPTIONS;
	const standConditionOptions = STAND_CONDITION_OPTIONS;

	const frameConditionOptions = [
		{ value: 'ok', label: 'OK', color: 'green' },
		{ value: 'worn', label: 'Desgastado', color: 'yellow' },
		{ value: 'missing_pieces', label: 'Piezas faltantes', color: 'red' },
		{ value: 'scratched', label: 'Rayado', color: 'yellow' },
		{ value: 'broken', label: 'Roto', color: 'red' },
	];

	useEffect(() => {
		if (branchId) {
			// dispatch(fetchValidationRulesByType({ branchId, equipmentType: 'monitor' }));
			dispatch(fetchBrands({ branchId }));
		}
	}, [dispatch, branchId]);
	const brands = useAppSelector((s) => s.brands.items);
	const brandsLoading = useAppSelector((s) => s.brands.loading);
	const validationLoading = useAppSelector((s) => s.technicalReviews.validationRulesLoading);

	const brandOptions: TSelectOption[] = brands.map((brand) => ({
		value: brand.name,
		label: brand.name,
	}));

	if (validationLoading || brandsLoading) {
		return (
			<Card className='h-full'>
				<CardBody className='flex h-full items-center justify-center p-6'>
					<Icon icon='HeroArrowPath' className='h-10 w-10 animate-spin text-blue-500' />
				</CardBody>
			</Card>
		);
	}

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

	const renderStepContent = () => {
		switch (step) {
			case 0: // Información Básica
				return (
					<motion.div
						key='step0'
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}>
						<div className='space-y-6'>
							<h3 className='mb-4 text-center text-lg font-bold'>
								Información Básica
							</h3>

							<div className='rounded-xl border bg-blue-50 p-4 dark:bg-blue-900/10'>
								<label className='mb-3 block text-sm font-bold text-blue-800 dark:text-blue-200'>
									Marca
								</label>
								<div className='col-span-full md:col-span-1'>
									{/* <label className='block text-sm font-bold mb-2 dark:text-gray-300'>Marca *</label> */}
									<SelectReact
										name='brand'
										options={brandOptions}
										value={
											brandOptions.find((o) => o.value === values.brand) ||
											null
										}
										onChange={handleSelectChange('brand')}
										placeholder='Seleccionar marca'
										isDisabled={readOnly}
									/>
								</div>
							</div>

							<div className='rounded-xl border bg-purple-50 p-4 dark:bg-purple-900/10'>
								<label className='mb-3 block text-sm font-bold text-purple-800 dark:text-purple-200'>
									Modelo
								</label>
								<Input
									type='text'
									name='model'
									value={values.model || ''}
									onChange={handleInputChange}
									placeholder='Ej: P2422H'
								/>
							</div>

							<div className='rounded-xl border bg-gray-50 p-4 dark:bg-gray-900/10'>
								<label className='mb-3 block text-sm font-bold dark:text-gray-300'>
									Línea (Opcional)
								</label>
								<Input
									type='text'
									name='line'
									value={values.line || ''}
									onChange={handleInputChange}
									placeholder='Ej: Professional, UltraSharp'
								/>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div className='rounded-xl border bg-green-50 p-4 dark:bg-green-900/10'>
									<label className='mb-3 block text-sm font-bold text-green-800 dark:text-green-200'>
										Pulgadas
									</label>
									<Input
										type='text'
										name='screen_inches'
										value={values.screen_inches || ''}
										onChange={handleInputChange}
										placeholder='Ej: 24"'
									/>
								</div>

								<div className='rounded-xl border bg-orange-50 p-4 dark:bg-orange-900/10'>
									<label className='mb-3 block text-sm font-bold text-orange-800 dark:text-orange-200'>
										Resolución
									</label>
									<Input
										type='text'
										name='screen_resolution'
										value={values.screen_resolution || ''}
										onChange={handleInputChange}
										placeholder='Ej: 1920x1080'
									/>
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

			case 1: // Puertos
				const ports = [
					{ label: 'VGA', name: 'vga_ports' },
					{ label: 'HDMI', name: 'hdmi_ports' },
					{ label: 'DisplayPort', name: 'displayport_ports' },
					{ label: 'DVI', name: 'dvi_ports' },
				];
				return (
					<motion.div
						key='step1'
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}>
						<div className='space-y-6'>
							<h3 className='mb-4 text-center text-lg font-bold'>Conectividad</h3>
							<div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
								{ports.map((port) => (
									<div
										key={port.name}
										className='flex flex-col items-center gap-1'>
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

							<div className='rounded-xl border border-blue-200 bg-blue-50 p-4 dark:bg-blue-900/10'>
								<YesNoSelector
									label='¿Tiene Hub USB?'
									value={values.has_usb_hub}
									onChange={(val) => onChange('has_usb_hub', val)}
								/>
								{values.has_usb_hub && (
									<div className='animate-in fade-in zoom-in mt-4 flex flex-col items-center gap-2'>
										<label className='text-sm font-bold'>
											Puertos USB en el Hub
										</label>
										<StepperInput
											value={getNumericValue('usb_hub_ports')}
											onChange={(val) => onChange('usb_hub_ports', val)}
											max={12}
										/>
									</div>
								)}
							</div>

							<div className='rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:bg-gray-900/10'>
								<YesNoSelector
									label='¿Todos los Puertos OK?'
									value={values.all_ports_functional}
									onChange={(val) => {
										onChange('all_ports_functional', val);
										if (val === true) {
											onChange('defective_ports_count', 0);
											onChange('defective_ports_critical_count', 0);
										}
									}}
								/>

								{values.all_ports_functional === false && (
									<div className='animate-in zoom-in mt-4 space-y-4 rounded-xl border border-red-200 bg-red-50 p-3'>
										<div className='flex flex-col items-center gap-2'>
											<label className='text-sm font-bold text-red-800'>
												Puertos Defectuosos
											</label>
											<StepperInput
												value={getNumericValue('defective_ports_count')}
												onChange={(val) =>
													onChange('defective_ports_count', val)
												}
											/>
											<p className='mt-1 text-center text-xs text-red-700'>
												⚠️ Más de 1 puerto = Grado M automático
											</p>
										</div>

										<div className='flex flex-col items-center gap-2'>
											<label className='text-sm font-bold text-red-900'>
												Puertos Críticos Defectuosos
											</label>
											<StepperInput
												value={getNumericValue(
													'defective_ports_critical_count',
												)}
												onChange={(val) =>
													onChange('defective_ports_critical_count', val)
												}
											/>
											<p className='mt-1 text-center text-xs text-red-800'>
												🔴 1 puerto crítico = Máximo C. Más de 1 = M
												automático
											</p>
										</div>
									</div>
								)}
							</div>
						</div>
					</motion.div>
				);

			case 2: // Condición
				return (
					<motion.div
						key='step2'
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}>
						<div className='space-y-6'>
							<h3 className='mb-4 text-center text-lg font-bold'>Condición</h3>

							<div className='rounded-xl border bg-purple-50 p-4 dark:bg-purple-900/10'>
								<label className='mb-3 block text-center text-sm font-bold text-purple-800 dark:text-purple-200'>
									Pantalla
								</label>
								<div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
									{screenConditionOptions.map((opt) => (
										<SelectionCard
											key={opt.value}
											label={opt.label}
											value={opt.value}
											isSelected={values.screen_condition === opt.value}
											onClick={() => {
												onChange('screen_condition', opt.value);
												// Limpiar contadores al cambiar
												if (opt.value !== 'spots')
													onChange('spots_count', null);
												if (opt.value !== 'dead_pixels')
													onChange('dead_pixels_count', null);
											}}
											color={opt.color as 'green' | 'red' | 'yellow'}
										/>
									))}
								</div>

								{/* Conditional Inputs */}
								{values.screen_condition === 'spots' && (
									<div className='animate-in zoom-in mx-auto mt-4 max-w-xs duration-300'>
										<div className='rounded-xl border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-900/20'>
											<label className='mb-2 block text-center text-sm font-bold text-yellow-800 dark:text-yellow-200'>
												Cantidad de Manchas
											</label>
											<StepperInput
												value={
													typeof values.spots_count === 'number'
														? values.spots_count
														: 1
												}
												onChange={(val) => onChange('spots_count', val)}
												min={1}
												max={50}
											/>
										</div>
									</div>
								)}

								{values.screen_condition === 'dead_pixels' && (
									<div className='animate-in zoom-in mx-auto mt-4 max-w-xs duration-300'>
										<div className='rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-700 dark:bg-red-900/20'>
											<label className='mb-2 block text-center text-sm font-bold text-red-800 dark:text-red-200'>
												Píxeles Muertos
											</label>
											<StepperInput
												value={
													typeof values.dead_pixels_count === 'number'
														? values.dead_pixels_count
														: 1
												}
												onChange={(val) =>
													onChange('dead_pixels_count', val)
												}
												min={1}
												max={50}
											/>
										</div>
									</div>
								)}
							</div>

							<div className='rounded-xl border bg-blue-50 p-4 dark:bg-blue-900/10'>
								<label className='mb-3 block text-center text-sm font-bold text-blue-800 dark:text-blue-200'>
									Base/Soporte
								</label>
								<div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
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

							<div className='rounded-xl border bg-orange-50 p-4 dark:bg-orange-900/10'>
								<label className='mb-3 block text-center text-sm font-bold text-orange-800 dark:text-orange-200'>
									Marco/Carcasa
								</label>
								<div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
									{frameConditionOptions.map((opt) => (
										<SelectionCard
											key={opt.value}
											label={opt.label}
											value={opt.value}
											isSelected={values.frame_condition === opt.value}
											onClick={() => onChange('frame_condition', opt.value)}
											color={opt.color as 'green' | 'red' | 'yellow'}
										/>
									))}
								</div>
							</div>

							<div className='rounded-xl border bg-green-50 p-4 dark:bg-green-900/10'>
								<label className='mb-3 block text-center text-sm font-bold text-green-800 dark:text-green-200'>
									Condición General
								</label>
								<div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
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
						</div>
					</motion.div>
				);

			case 3: // Accesorios
				return (
					<motion.div
						key='step3'
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}>
						<div className='space-y-6'>
							<h3 className='mb-4 text-center text-lg font-bold'>Accesorios</h3>

							<YesNoSelector
								label='¿Incluye Cable de Poder?'
								value={values.includes_power_cable}
								onChange={(val) => onChange('includes_power_cable', val)}
							/>

							<YesNoSelector
								label='¿Incluye Cable de Video?'
								value={values.includes_video_cable}
								onChange={(val) => onChange('includes_video_cable', val)}
							/>

							<YesNoSelector
								label='¿Incluye Base/Soporte?'
								value={values.includes_stand}
								onChange={(val) => onChange('includes_stand', val)}
							/>
						</div>
					</motion.div>
				);

			case 4: // Observaciones
				return (
					<motion.div
						key='step4'
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}>
						<div className='space-y-6'>
							<h3 className='mb-4 text-center text-lg font-bold'>Observaciones</h3>

							<div className='rounded-xl border bg-gray-50 p-4 dark:bg-gray-900/10'>
								<label className='mb-3 block text-sm font-bold dark:text-gray-300'>
									Notas Adicionales
								</label>
								<Textarea
									name='observations'
									value={values.observations || ''}
									onChange={handleInputChange}
									placeholder='Ej: Base con pequeño rayón en la parte trasera...'
									rows={6}
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
				<div className='mt-6 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800'>
					<Button
						variant='outline'
						onClick={handlePreviousStep}
						isDisable={step === 0}
						icon='HeroArrowLeft'>
						Anterior
					</Button>

					<div className='flex gap-2'>
						{Array.from({ length: MAX_STEPS }).map((_, i) => (
							<div
								key={i}
								className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
									i === step
										? 'w-8 bg-blue-600'
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
						icon={step === MAX_STEPS - 1 ? 'HeroCheckCircle' : 'HeroArrowRight'}>
						{step === MAX_STEPS - 1 ? 'Finalizar Revisión' : 'Siguiente'}
					</Button>
				</div>
			</CardBody>
		</Card>
	);
};

export default MonitorForm;
