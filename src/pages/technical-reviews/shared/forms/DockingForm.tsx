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
import { StepperInput } from '../components/StepperInput';
import { YesNoSelector } from '../components/YesNoSelector';
import { SelectionCard } from '../components/SelectionCard';
import { 
	GENERAL_CONDITION_OPTIONS,
	COVER_CONDITION_OPTIONS 
} from '../constants/formOptions';



// --- MAIN FORM ---

interface DockingFormProps {
	branchId: number;
	values: Partial<UpdateItemDetailsPayload>;
	onChange: (field: string, value: unknown) => void;
	readOnly?: boolean;
}

const DockingForm: React.FC<DockingFormProps> = ({ branchId, values, onChange, readOnly = false }) => {
	const dispatch = useAppDispatch();
	const [step, setStep] = useState(0);
	const MAX_STEPS = 5;

	useEffect(() => {
		if (branchId) {
			dispatch(fetchBrands({ branchId }));
		}
	}, [dispatch, branchId]);

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
				const newObs = currentObs ? `${currentObs}\n\n${connectivityText}` : connectivityText;
				onChange('observations', newObs);
			}
		}
	}, [values.all_ports_functional, values.defective_ports_count, values.usb_a_ports, values.usb_c_ports, values.hdmi_ports, values.displayport_ports, values.vga_ports, values.rj45_ports, values.sd_readers]);

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
									placeholder='Ej: WD19S, TB16'
									disabled={readOnly}
								/>
							</div>

							<div className='rounded-xl border p-4 bg-gray-50/50 dark:bg-gray-900/10'>
								<label className='block text-sm font-bold mb-3 dark:text-gray-300'>Línea (Opcional)</label>
								<Input
									type='text'
									name='line'
									value={values.line || ''}
									onChange={handleInputChange}
									placeholder='Ej: Thunderbolt, USB-C'
									disabled={readOnly}
								/>
							</div>
						</div>
					</motion.div>
				);

			case 1: // Puertos
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
						key='step1'
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
									<div className='mt-4 p-3 bg-red-400/50 dark:bg-red-900/50 backdrop-blur-sm rounded-xl border border-red-200 flex flex-col items-center animate-in zoom-in'>
										<label className='text-red-800 font-bold mb-1 text-sm'>Cant. Puertos Malos</label>
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

			case 2: // Conectividad y Alimentación
				return (
					<motion.div
						key='step2'
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}
					>
						<div className='space-y-6'>
							<h3 className='text-lg font-bold mb-4 text-center'>Conectividad y Alimentación</h3>

							<YesNoSelector
								label='¿Tiene WiFi?'
								value={values.has_wifi}
								onChange={(val) => onChange('has_wifi', val)}
							/>

							<YesNoSelector
								label='¿Incluye Adaptador de Poder?'
								value={values.includes_power_adapter}
								onChange={(val) => onChange('includes_power_adapter', val)}
							/>
						</div>
					</motion.div>
				);

			case 3: // Condición
				return (
					<motion.div
						key='step3'
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}
					>
						<div className='space-y-6'>
							<h3 className='text-lg font-bold mb-4 text-center'>Condición</h3>

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
									Condición de Carcasa
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
									placeholder='Ej: Puerto USB-C izquierdo con contacto flojo...'
									rows={6}
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

export default DockingForm;
