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

// --- HELPER COMPONENTS ---

interface SelectionCardProps {
	label: string;
	value: string;
	isSelected: boolean;
	onClick: () => void;
	color?: 'green' | 'red' | 'yellow' | 'gray';
	icon?: string;
	className?: string;
	
}

const SelectionCard: React.FC<SelectionCardProps> = ({
	label,
	value,
	isSelected,
	onClick,
	color = 'gray',
	icon,
	className = '',
}) => {
	const colorStyles = {
		green: isSelected
			? 'bg-green-100 border-green-500 text-green-800 shadow-md ring-1 ring-green-500 ring-offset-1 dark:bg-green-900/60 dark:border-green-400 dark:text-green-100'
			: 'bg-green-50/50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/10 dark:border-green-900/30 dark:text-green-400',
		red: isSelected
			? 'bg-red-100 border-red-500 text-red-800 shadow-md ring-1 ring-red-500 ring-offset-1 dark:bg-red-900/60 dark:border-red-400 dark:text-red-100'
			: 'bg-red-50/50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400',
		yellow: isSelected
			? 'bg-yellow-100 border-yellow-500 text-yellow-800 shadow-md ring-1 ring-yellow-500 ring-offset-1 dark:bg-yellow-900/60 dark:border-yellow-400 dark:text-yellow-100'
			: 'bg-yellow-50/50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-900/30 dark:text-yellow-400',
		gray: isSelected
			? 'bg-blue-100 border-blue-500 text-blue-800 shadow-md ring-1 ring-blue-500 ring-offset-1 dark:bg-blue-900/60 dark:border-blue-400 dark:text-blue-100'
			: 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400',
	};

	return (
		<div
			data-value={value}
			onClick={onClick}
			className={`cursor-pointer rounded-xl border-2 p-3 text-center transition-all duration-200 ${
				isSelected ? 'scale-105 z-10' : 'scale-100'
			} ${colorStyles[color]} flex flex-col items-center justify-center gap-2 min-h-[70px] ${className}`}
		>
			{icon && <Icon icon={icon} className={`h-6 w-6 ${isSelected ? '' : 'opacity-80'}`} />}
			<span className={`text-sm font-semibold ${isSelected ? 'font-bold' : ''}`}>{label}</span>
		</div>
	);
};

interface YesNoSelectorProps {
	label: string;
	value: boolean | undefined | null;
	onChange: (val: boolean) => void;
}

const YesNoSelector: React.FC<YesNoSelectorProps> = ({ label, value, onChange }) => {
	return (
		<div className='flex flex-col gap-2'>
			<label className='block text-sm font-bold text-center dark:text-gray-300'>{label}</label>
			<div className='grid grid-cols-2 gap-4'>
				<SelectionCard
					label='Sí'
					value='yes'
					isSelected={value === true}
					onClick={() => onChange(true)}
					color='green'
					icon='HeroCheck'
					className='h-16 min-h-[60px]'
				/>
				<SelectionCard
					label='No'
					value='no'
					isSelected={value === false}
					onClick={() => onChange(false)}
					color='red'
					icon='HeroXMark'
					className='h-16 min-h-[60px]'
				/>
			</div>
		</div>
	);
};

interface StepperInputProps {
	value: number;
	onChange: (val: number) => void;
	min?: number;
	max?: number;
}

const StepperInput: React.FC<StepperInputProps> = ({ value, onChange, min = 0, max = 99 }) => {
	const handleDecrement = () => {
		if (value > min) onChange(value - 1);
	};

	const handleIncrement = () => {
		if (value < max) onChange(value + 1);
	};

	return (
		<div className='flex items-center gap-2'>
			<button
				type='button'
				onClick={handleDecrement}
				disabled={value <= min}
				className='h-10 w-10 rounded-lg bg-red-500 text-white font-bold text-xl hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95'
			>
				-
			</button>
			<div className='h-10 w-14 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 font-bold text-lg'>
				{value}
			</div>
			<button
				type='button'
				onClick={handleIncrement}
				disabled={value >= max}
				className='h-10 w-10 rounded-lg bg-blue-500 text-white font-bold text-xl hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95'
			>
				+
			</button>
		</div>
	);
};

// --- MAIN FORM ---

interface MonitorFormProps {
	branchId: number;
	values: Partial<UpdateItemDetailsPayload>;
	onChange: (field: string, value: unknown) => void;
	readOnly?: boolean;
}

const MonitorForm: React.FC<MonitorFormProps> = ({ branchId, values, onChange, readOnly = false }) => {
	const dispatch = useAppDispatch();
	const [step, setStep] = useState(0);
	const MAX_STEPS = 5;

	useEffect(() => {
		dispatch(fetchBrands({ branchId: branchId}));
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

	const generalConditionOptions = [
		{ value: 'like_new', label: 'Como nuevo', color: 'green' },
		{ value: 'good_shape', label: 'Buen estado', color: 'green' },
		{ value: 'visible_wear', label: 'Desgaste visible', color: 'yellow' },
		{ value: 'needs_repair', label: 'Requiere reparación', color: 'red' },
		{ value: 'scrap', label: 'Solo repuestos', color: 'red' },
	];

	const screenConditionOptions = [
		{ value: 'ok', label: 'OK', color: 'green' },
		{ value: 'minor_wear', label: 'Desgaste menor', color: 'yellow' },
		{ value: 'worn', label: 'Desgastado', color: 'yellow' },
		{ value: 'missing_pieces', label: 'Piezas faltantes', color: 'red' },
		{ value: 'dead_pixels', label: 'Píxeles muertos', color: 'red' },
		{ value: 'broken', label: 'Roto', color: 'red' },
	];

	const standConditionOptions = [
		{ value: 'ok', label: 'OK', color: 'green' },
		{ value: 'worn', label: 'Desgastado', color: 'yellow' },
		{ value: 'missing_pieces', label: 'Piezas faltantes', color: 'red' },
		{ value: 'broken', label: 'Roto', color: 'red' },
		{ value: 'no_stand', label: 'Sin base', color: 'red' },
	];

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
						transition={{ duration: 0.3 }}
					>
						<div className='space-y-6'>
							<h3 className='text-lg font-bold mb-4 text-center'>Información Básica</h3>

							<div className='rounded-xl border p-4 bg-blue-50/50 dark:bg-blue-900/10'>
								<label className='block text-sm font-bold mb-3 text-blue-800 dark:text-blue-200'>
									Marca
								</label>
								<div className='col-span-full md:col-span-1'>
								{/* <label className='block text-sm font-bold mb-2 dark:text-gray-300'>Marca *</label> */}
								<SelectReact
									name='brand'
									options={brandOptions}
									value={brandOptions.find((o) => o.value === values.brand) || null}
									onChange={handleSelectChange('brand')}
									placeholder='Seleccionar marca'
									isDisabled={readOnly}
								/>
							</div>
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
									placeholder='Ej: P2422H'
								/>
							</div>

							<div className='rounded-xl border p-4 bg-gray-50/50 dark:bg-gray-900/10'>
								<label className='block text-sm font-bold mb-3 dark:text-gray-300'>Línea (Opcional)</label>
								<Input
									type='text'
									name='line'
									value={values.line || ''}
									onChange={handleInputChange}
									placeholder='Ej: Professional, UltraSharp'
								/>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div className='rounded-xl border p-4 bg-green-50/50 dark:bg-green-900/10'>
									<label className='block text-sm font-bold mb-3 text-green-800 dark:text-green-200'>
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

								<div className='rounded-xl border p-4 bg-orange-50/50 dark:bg-orange-900/10'>
									<label className='block text-sm font-bold mb-3 text-orange-800 dark:text-orange-200'>
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
						transition={{ duration: 0.3 }}
					>
						<div className='space-y-6'>
							<h3 className='text-lg font-bold mb-4 text-center'>Conectividad</h3>
							<div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
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

							<div className='rounded-xl border border-blue-200 p-4 bg-blue-50/30 dark:bg-blue-900/10'>
								<YesNoSelector
									label='¿Tiene Hub USB?'
									value={values.has_usb_hub}
									onChange={(val) => onChange('has_usb_hub', val)}
								/>
								{values.has_usb_hub && (
									<div className='mt-4 flex flex-col items-center gap-2 animate-in fade-in zoom-in'>
										<label className='text-sm font-bold'>Puertos USB en el Hub</label>
										<StepperInput
											value={getNumericValue('usb_hub_ports')}
											onChange={(val) => onChange('usb_hub_ports', val)}
											max={12}
										/>
									</div>
								)}
							</div>

							<div className='rounded-xl border border-gray-200 p-4 bg-gray-50/50 dark:bg-gray-900/10'>
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
									<div className='mt-4 space-y-4 p-3 bg-red-50 rounded-xl border border-red-200 animate-in zoom-in'>
										<div className='flex flex-col items-center gap-2'>
											<label className='text-red-800 font-bold text-sm'>Puertos Defectuosos</label>
											<StepperInput
												value={getNumericValue('defective_ports_count')}
												onChange={(val) => onChange('defective_ports_count', val)}
											/>
											<p className='text-xs text-red-700 text-center mt-1'>
												⚠️ Más de 1 puerto = Grado M automático
											</p>
										</div>

										<div className='flex flex-col items-center gap-2'>
											<label className='text-red-900 font-bold text-sm'>
												Puertos Críticos Defectuosos
											</label>
											<StepperInput
												value={getNumericValue('defective_ports_critical_count')}
												onChange={(val) => onChange('defective_ports_critical_count', val)}
											/>
											<p className='text-xs text-red-800 text-center mt-1'>
												🔴 1 puerto crítico = Máximo C. Más de 1 = M automático
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
						transition={{ duration: 0.3 }}
					>
						<div className='space-y-6'>
							<h3 className='text-lg font-bold mb-4 text-center'>Condición</h3>

							<div className='rounded-xl border p-4 bg-purple-50/50 dark:bg-purple-900/10'>
								<label className='block text-sm font-bold mb-3 text-purple-800 dark:text-purple-200 text-center'>
									Pantalla
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
									Base/Soporte
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

							<div className='rounded-xl border p-4 bg-orange-50/50 dark:bg-orange-900/10'>
								<label className='block text-sm font-bold mb-3 text-orange-800 dark:text-orange-200 text-center'>
									Marco/Carcasa
								</label>
								<div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
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
						transition={{ duration: 0.3 }}
					>
						<div className='space-y-6'>
							<h3 className='text-lg font-bold mb-4 text-center'>Accesorios</h3>

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
						transition={{ duration: 0.3 }}
					>
						<div className='space-y-6'>
							<h3 className='text-lg font-bold mb-4 text-center'>Observaciones</h3>

							<div className='rounded-xl border p-4 bg-gray-50/50 dark:bg-gray-900/10'>
								<label className='block text-sm font-bold mb-3 dark:text-gray-300'>
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

export default MonitorForm;
