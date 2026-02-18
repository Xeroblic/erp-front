import React, { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';

import { notebookSchema, NotebookFormData } from '../../validation/notebook.schema';
import {
	NOTEBOOK_GROUP_ORDER,
	NOTEBOOK_FIELDS_BY_GROUP,
	NotebookGroup,
} from '../../constants/notebook/notebook.groups';
import {
	NOTEBOOK_HINTS,
	NOTEBOOK_PLACEHOLDERS,
	NOTEBOOK_WARNINGS,
} from '../../constants/notebook/notebook.hints';
// Importa las opciones desde el barrel
import * as NotebookOptions from '../../constants/notebook/notebook.options';
import { getNotebookLabel } from '../../translations/notebook.labels';

import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Label from '@/components/form/Label';
import Checkbox from '@/components/form/Checkbox';

interface NotebookFormProps {
	defaultValues?: Partial<NotebookFormData>;
	onSubmit: (data: NotebookFormData) => Promise<void>;
	onBack: () => void;
	isSubmitting?: boolean;
	readOnly?: boolean;
}

// Mapa de iconos por grupo
const GROUP_ICONS: Record<NotebookGroup, string> = {
	Identificación: 'HeroTag',
	Condición: 'HeroSparkles',
	Hardware: 'HeroCpuChip',
	Pantalla: 'HeroComputerDesktop',
	Carcasa: 'HeroSwatch',
	Batería: 'HeroBattery50',
	Puertos: 'HeroPuzzlePiece',
	Accesorios: 'HeroPower',
	Software: 'HeroCommandLine',
	Otros: 'HeroWifi',
	Notas: 'HeroDocumentText',
	Extras: 'HeroCube',
};

// Mapa de tipos de campo (para renderizado dinámico)
const FIELD_TYPES: Record<string, 'text' | 'number' | 'select' | 'textarea' | 'checkbox'> = {
	// Identificación
	brand: 'text',
	model: 'text',
	// Condición
	general_condition: 'select',
	// Hardware
	processor: 'text',
	ram_size: 'text', // Es text porque puede ser "8GB", "16GB" etc, aunque options sugiere select. El schema dice string.
	ram_slots: 'text',
	ram_type: 'select',
	storage_size: 'text',
	storage_technology: 'select',
	// Pantalla
	screen_inches: 'text',
	screen_condition: 'select',
	is_touchscreen: 'checkbox',
	// Carcasa
	cover_condition: 'select',
	keyboard_condition: 'select',
	keyboard_layout: 'select',
	hinge_condition: 'select',
	touchpad_condition: 'select',
	bottom_condition: 'select',
	has_numeric_keypad: 'checkbox',
	has_backlit_keyboard: 'checkbox',
	// Batería
	battery_health: 'text',
	battery_status: 'select',
	battery_percentage: 'number',
	// Puertos
	vga_ports: 'number',
	hdmi_ports: 'number',
	displayport_ports: 'number',
	usb_c_ports: 'number',
	usb_a_ports: 'number',
	sd_readers: 'number',
	rj45_ports: 'number',
	all_ports_functional: 'checkbox',
	defective_ports_count: 'number',
	// Accesorios
	includes_charger: 'checkbox',
	charger_watts: 'text',
	charger_status: 'select',
	// Software
	operating_system: 'select',
	// Otros
	has_biometric: 'checkbox',
	has_wifi: 'checkbox',
	has_bluetooth: 'checkbox',
	// Notas
	observations: 'textarea',
	// Extras
	extra_attributes: 'textarea', // JSON o texto
};

// Mapa de opciones para selects (vinculado a notebook.options.ts)
const SELECT_OPTIONS_MAP: Record<string, TSelectOption[]> = {
	general_condition: NotebookOptions.GENERAL_CONDITION_OPTIONS,
	storage_technology: NotebookOptions.STORAGE_TECHNOLOGY_OPTIONS,
	ram_type: NotebookOptions.RAM_TYPE_OPTIONS,
	screen_condition: NotebookOptions.SCREEN_CONDITION_OPTIONS,
	cover_condition: NotebookOptions.COVER_CONDITION_OPTIONS,
	keyboard_condition: NotebookOptions.KEYBOARD_CONDITION_OPTIONS,
	keyboard_layout: NotebookOptions.KEYBOARD_LAYOUT_OPTIONS,
	hinge_condition: NotebookOptions.HINGE_CONDITION_OPTIONS,
	touchpad_condition: NotebookOptions.TOUCHPAD_CONDITION_OPTIONS,
	bottom_condition: NotebookOptions.BOTTOM_CONDITION_OPTIONS,
	battery_status: NotebookOptions.BATTERY_STATUS_OPTIONS,
	charger_status: NotebookOptions.CHARGER_STATUS_OPTIONS,
	operating_system: NotebookOptions.OPERATING_SYSTEM_OPTIONS,
};

const NotebookForm: React.FC<NotebookFormProps> = ({
	defaultValues,
	onSubmit,
	onBack,
	isSubmitting = false,
	readOnly = false,
}) => {
	const [activeGroupIndex, setActiveGroupIndex] = useState(0);

	// Filtrar grupos vacíos o que no quiero mostrar (si hubiera lógica condicional)
	const visibleGroups = NOTEBOOK_GROUP_ORDER;

	const methods = useForm<NotebookFormData>({
		resolver: yupResolver(notebookSchema),
		defaultValues: defaultValues || {},
		mode: 'onBlur',
	});

	const {
		control,
		handleSubmit,
		trigger,
		formState: { errors },
	} = methods;

	// Scroll al top al cambiar de grupo
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [activeGroupIndex]);

	const currentGroup = visibleGroups[activeGroupIndex];
	const currentFields = NOTEBOOK_FIELDS_BY_GROUP[currentGroup];

	// Validar el grupo actual antes de avanzar
	const handleNextGroup = async () => {
		const result = await trigger(currentFields as any);
		if (result) {
			if (activeGroupIndex < visibleGroups.length - 1) {
				setActiveGroupIndex((prev) => prev + 1);
			}
		} else {
			toast.warn('Por favor corrige los errores antes de continuar.');
		}
	};

	const handlePrevGroup = () => {
		if (activeGroupIndex > 0) {
			setActiveGroupIndex((prev) => prev - 1);
		}
	};

	const handleNavClick = async (index: number) => {
		// Permitir navegar atrás libremente. Para navegar adelante, validar pasos intermedios?
		// Para simplificar, permitimos clic si el paso destino es anterior o igual al actual,
		// o si validamos "todo hasta el destino".
		// Mejor: validamos solo el paso actual si vamos adelante.
		if (readOnly) {
			setActiveGroupIndex(index);
			return;
		}

		if (index < activeGroupIndex) {
			setActiveGroupIndex(index);
		} else if (index > activeGroupIndex) {
			const result = await trigger(currentFields as any); // Valida actual
			if (result) {
				// Avanzamos solo uno por uno o permitimos salto si intermedios son validos?
				// Simple: permitir avanzar al siguiente solo si el actual es valido
				if (index === activeGroupIndex + 1) {
					setActiveGroupIndex(index);
				}
			}
		}
	};

	// Auto-save logic or "Submit" on last step
	const onFormSubmit = handleSubmit(async (data) => {
		try {
			await onSubmit(data);
		} catch (error) {
			console.error(error);
			toast.error('Error al guardar el formulario');
		}
	});

	return (
		<div className='flex flex-col gap-6 lg:flex-row'>
			{/* ─── Sidebar de Navegación ────────────────────────────── */}
			<div className='w-full flex-shrink-0 lg:w-64'>
				<Card className='sticky top-24'>
					<CardBody className='p-2'>
						<nav className='flex flex-col gap-1'>
							{visibleGroups.map((group, index) => {
								const isActive = index === activeGroupIndex;
								const isCompleted = index < activeGroupIndex;
								const hasError = NOTEBOOK_FIELDS_BY_GROUP[group].some(
									(field) => !!errors[field as keyof NotebookFormData],
								);

								return (
									<button
										key={group}
										type='button'
										onClick={() => handleNavClick(index)}
										className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
											isActive
												? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
												: 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
										}`}>
										<div className='flex items-center gap-3'>
											<Icon
												icon={GROUP_ICONS[group] as any}
												className={`h-5 w-5 ${
													isActive
														? 'text-blue-500'
														: hasError
															? 'text-red-500'
															: 'text-zinc-400'
												}`}
											/>
											<span>{group}</span>
										</div>
										{hasError && (
											<Icon
												icon='HeroExclamationCircle'
												className='h-4 w-4 text-red-500'
											/>
										)}
										{/* {!hasError && isCompleted && (
											<Icon icon='HeroCheck' className='h-4 w-4 text-green-500' />
										)} */}
									</button>
								);
							})}
						</nav>
					</CardBody>
				</Card>
			</div>

			{/* ─── Formulario Principal ─────────────────────────────── */}
			<div className='flex-1'>
				<form onSubmit={(e) => e.preventDefault()} className='space-y-6'>
					<Card>
						<div className='border-b border-zinc-200 px-6 py-4 dark:border-zinc-700'>
							<h3 className='flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100'>
								<Icon
									icon={GROUP_ICONS[currentGroup] as any}
									className='h-6 w-6 text-blue-600'
								/>
								{currentGroup}
							</h3>
							<p className='text-sm text-zinc-500 dark:text-zinc-400'>
								Ingresa la información correspondiente a la sección{' '}
								{currentGroup.toLowerCase()}.
							</p>
						</div>
						<CardBody className='grid grid-cols-1 gap-6 p-6 md:grid-cols-2'>
							{currentFields.map((field) => {
								const fieldType = FIELD_TYPES[field] || 'text';
								const options = SELECT_OPTIONS_MAP[field];
								const label = getNotebookLabel(field);
								const placeholder = NOTEBOOK_PLACEHOLDERS[field];
								const hint = NOTEBOOK_HINTS[field];
								const warning = NOTEBOOK_WARNINGS[field];
								const isFullWidth =
									fieldType === 'textarea' || field === 'general_condition';

								return (
									<div
										key={field}
										className={
											isFullWidth ? 'space-y-2 md:col-span-2' : 'space-y-2'
										}>
										<Label
											htmlFor={field}
											className='font-medium text-zinc-700 dark:text-zinc-300'>
											{label}
											{/* Indicador de requerido si está en el esquema (podríamos inferirlo pero por ahora manual) */}
											{notebookSchema.fields[
												field as keyof typeof notebookSchema.fields
											]?.exclusiveTests?.required && (
												<span className='ml-1 text-red-500'>*</span>
											)}
										</Label>

										{warning && (
											<div className='mb-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200'>
												<Icon
													icon='HeroExclamationTriangle'
													className='mt-0.5 h-4 w-4 flex-shrink-0'
												/>
												<span>{warning}</span>
											</div>
										)}

										<Controller
											name={field as keyof NotebookFormData}
											control={control}
											render={({
												field: { onChange, value, ref, onBlur },
												fieldState: { error },
											}) => {
												if (fieldType === 'select') {
													return (
														<SelectReact
															options={options}
															value={
																options?.find(
																	(o) => o.value === value,
																) || null
															}
															onChange={(opt) =>
																onChange(
																	(opt as TSelectOption)?.value,
																)
															}
															onBlur={onBlur}
															placeholder={
																placeholder ||
																`Seleccionar ${label.toLowerCase()}`
															}
															className={
																error ? 'border-red-500' : ''
															}
															isValid={!error}
															invalidFeedback={error?.message}
															disabled={readOnly}
														/>
													);
												}

												if (fieldType === 'checkbox') {
													return (
														<div className='flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50'>
															<Checkbox
																id={field}
																name={field}
																checked={value === true}
																onChange={(e) =>
																	onChange(e.target.checked)
																}
																disabled={readOnly}
															/>
															<label
																htmlFor={field}
																className='flex-1 cursor-pointer select-none text-sm'>
																{placeholder || `¿${label}?`}
															</label>
														</div>
													);
												}

												if (fieldType === 'textarea') {
													return (
														<Textarea
															ref={ref}
															value={(value as string) || ''}
															onChange={onChange}
															onBlur={onBlur}
															placeholder={placeholder}
															className={`w-full ${error ? 'border-red-500' : ''}`}
															disabled={readOnly}
															rows={4}
														/>
													);
												}

												return (
													<Input
														ref={ref}
														type={
															fieldType === 'number'
																? 'number'
																: 'text'
														}
														value={(value as string | number) || ''}
														onChange={onChange}
														onBlur={onBlur}
														placeholder={placeholder}
														className={error ? 'border-red-500' : ''}
														isValid={!error}
														invalidFeedback={error?.message}
														disabled={readOnly}
														min={fieldType === 'number' ? 0 : undefined}
													/>
												);
											}}
										/>

										{methods.formState.errors[
											field as keyof NotebookFormData
										] && (
											<p className='mt-1 flex items-center gap-1 text-xs text-red-500'>
												<Icon
													icon='HeroExclamationCircle'
													className='h-3 w-3'
												/>
												{
													methods.formState.errors[
														field as keyof NotebookFormData
													]?.message
												}
											</p>
										)}

										{hint &&
											!methods.formState.errors[
												field as keyof NotebookFormData
											] && (
												<p className='text-xs text-zinc-500 dark:text-zinc-400'>
													{hint}
												</p>
											)}
									</div>
								);
							})}
						</CardBody>
						<div className='flex justify-between rounded-b-xl border-t border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-700 dark:bg-zinc-800/20'>
							<div className='flex gap-3'>
								<Button
									variant='outline'
									onClick={activeGroupIndex === 0 ? onBack : handlePrevGroup}
									disabled={isSubmitting}>
									<Icon icon='HeroArrowLeft' className='mr-2 h-4 w-4' />
									{activeGroupIndex === 0 ? 'Volver' : 'Anterior'}
								</Button>
							</div>

							<div className='flex gap-3'>
								{activeGroupIndex < visibleGroups.length - 1 ? (
									<Button
										variant='solid'
										color='blue'
										onClick={handleNextGroup}
										disabled={readOnly}>
										Siguiente
										<Icon icon='HeroArrowRight' className='ml-2 h-4 w-4' />
									</Button>
								) : (
									<Button
										variant='solid'
										color='emerald'
										onClick={onFormSubmit}
										isLoading={isSubmitting}
										disabled={isSubmitting || readOnly}>
										Finalizar Revisión
										<Icon icon='HeroCheck' className='ml-2 h-4 w-4' />
									</Button>
								)}
							</div>
						</div>
					</Card>
				</form>
			</div>
		</div>
	);
};

export default NotebookForm;
