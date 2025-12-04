/**
 * NotebookForm - Formulario de revisión técnica para Notebooks
 * Mapea todos los campos según UpdateItemDetailsPayload
 */
import React, { useEffect } from 'react';
import type { MultiValue, SingleValue } from 'react-select';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import Checkbox from '@/components/form/Checkbox';
import Icon from '@/components/icon/Icon';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchValidationRulesByType } from '@/store/slices/technicalReviews';
import { fetchBrands } from '@/store/slices/brands/brandsSlice';
import type { UpdateItemDetailsPayload } from '@/interface/technicalReviews.interface';

interface NotebookFormProps {
	branchId: number;
	values: Partial<UpdateItemDetailsPayload>;
	onChange: (field: string, value: unknown) => void;
	readOnly?: boolean;
}

const NotebookForm: React.FC<NotebookFormProps> = ({
	branchId,
	values,
	onChange,
	readOnly = false,
}) => {
	const dispatch = useAppDispatch();
	const validationRules = useAppSelector((s) => s.technicalReviews.validationRules);
	const validationLoading = useAppSelector((s) => s.technicalReviews.validationRulesLoading);

	// Cargar marcas desde el slice de brands
	const brands = useAppSelector((s) => s.brands.items);
	const brandsLoading = useAppSelector((s) => s.brands.loading);

	useEffect(() => {
		if (branchId) {
			dispatch(fetchValidationRulesByType({ branchId, equipmentType: 'notebook' }));
			dispatch(fetchBrands({ branchId }));
		}
	}, [dispatch, branchId]);

	// Detectar si es marca Dell para lógica de batería
	const isDell = values.brand?.toLowerCase() === 'dell';

	// Detectar si el equipo NO enciende (para bloquear campos)
	const doesNotTurnOn = values.extra_attributes?.does_not_turn_on === true;

	// Opciones de marcas desde el slice brands (filtradas por branchId)
	const brandOptions: TSelectOption[] = brands.map((brand) => ({
		value: brand.name,
		label: brand.name,
	}));

	// Opciones hardcodeadas (validationRules no tiene estas propiedades)
	const generalConditionOptions: TSelectOption[] = [
		{ value: 'like_new', label: 'Como nuevo' },
		{ value: 'good_shape', label: 'Buen estado' },
		{ value: 'visible_wear', label: 'Desgaste visible' },
		{ value: 'needs_repair', label: 'Requiere reparación' },
		{ value: 'scrap', label: 'Solo repuestos' },
	];

	const chargerStatusOptions: TSelectOption[] = [
		{ value: 'buen_estado', label: 'Buen estado' },
		{ value: 'cable_en_mal_estado', label: 'Cable en mal estado' },
		{ value: 'no_corresponde_a_equipo', label: 'No corresponde al equipo' },
		{ value: 'no_incluye', label: 'No incluye' },
	];

	// Batería Dell: opciones en inglés (como las muestra la BIOS)
	const batteryStatusDellOptions: TSelectOption[] = [
		{ value: 'excellent', label: 'Excellent' },
		{ value: 'good', label: 'Good' },
		{ value: 'fair', label: 'Fair' },
		{ value: 'poor', label: 'Poor' },
		{ value: 'no_battery', label: 'No Battery' },
	];

	const conditionOptions: TSelectOption[] = [
		{ value: 'ok', label: 'OK' },
		{ value: 'worn', label: 'Desgastado' },
		{ value: 'missing_pieces', label: 'Faltan piezas' },
		// { value: 'scratched', label: 'Rayado' },
		{ value: 'broken', label: 'Roto' },
	];

	const hingeKeyboardOptions: TSelectOption[] = [
		{ value: 'ok', label: 'OK' },
		{ value: 'worn', label: 'Desgastado' },
		{ value: 'missing_pieces', label: 'Faltan piezas' },
		{ value: 'broken', label: 'Roto' },
	];

	const keyboardLayoutOptions: TSelectOption[] = [
		{ value: 'es', label: 'Español (ES)' },
		{ value: 'us', label: 'Inglés (US)' },
		// { value: 'latam', label: 'Latinoamericano' },
	];

	const ramTypeOptions: TSelectOption[] = [
		{ value: 'no_ram', label: 'Sin RAM' },
		{ value: 'DDR3', label: 'DDR3' },
		{ value: 'DDR4', label: 'DDR4' },
		{ value: 'DDR5', label: 'DDR5' },
	];

	const storageTechOptions: TSelectOption[] = [
		{ value: 'no_storage', label: 'Sin disco / No aplica' },
		{ value: 'HDD', label: 'Disco duro (HDD)' },
		{ value: 'SSD', label: 'Unidad sólida (SSD)' },
		{ value: 'M2', label: 'M.2' },
		// { value: 'NVME', label: 'NVMe' },
		{ value: 'HYBRID', label: 'Híbrido' },
	];

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.name, e.target.value);
	};

	const isMultiValue = (
		option: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null,
	): option is MultiValue<TSelectOption> => Array.isArray(option);

	const handleSelectChange =
		(name: string) =>
		(newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null) => {
			if (isMultiValue(newValue)) {
				onChange(
					name,
					newValue.map((option) => option.value),
				);
				return;
			}
			const option = newValue as TSelectOption | null;
			onChange(name, option?.value ?? null);
		};

	const handleCheckboxChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(name, e.target.checked);
	};

	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.name, e.target.value);
	};

	const handleNumberChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value === '' ? 0 : parseInt(e.target.value);
		onChange(name, val);
	};

	const handleTurnOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const doesNotTurnOn = e.target.checked;
		// Actualizar extra_attributes
		onChange('extra_attributes', {
			...values.extra_attributes,
			does_not_turn_on: doesNotTurnOn,
		});
	};

	if (validationLoading || brandsLoading) {
		return (
			<Card>
				<CardBody className='p-6'>
					<div className='flex items-center justify-center py-8'>
						<Icon icon='HeroArrowPath' className='mr-2 h-5 w-5 animate-spin' />
						<span className='text-gray-600 dark:text-gray-400'>
							{validationLoading
								? 'Cargando reglas de validación...'
								: 'Cargando marcas...'}
						</span>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			{/* 1️⃣ Información General */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroInformationCircle' className='h-5 w-5 text-blue-600' />
						<h3 className='text-lg font-semibold'>Información General</h3>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Marca <span className='text-red-500'>*</span>
							</label>
							<SelectReact
								name='brand'
								options={brandOptions}
								value={
									values.brand
										? brandOptions.find((o) => o.value === values.brand) || null
										: null
								}
								onChange={handleSelectChange('brand')}
								placeholder='Seleccionar marca'
								isDisabled={readOnly}
								isLoading={brandsLoading}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Modelo <span className='text-red-500'>*</span>
							</label>
							<Input
								type='text'
								name='model'
								value={values.model || ''}
								onChange={handleInputChange}
								placeholder='Ej: LATITUDE 5420'
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Línea
							</label>
							<Input
								type='text'
								name='line'
								value={values.line || ''}
								onChange={handleInputChange}
								placeholder='Ej: Latitude, EliteBook'
								disabled={readOnly}
							/>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* 2️⃣ Especificaciones Técnicas */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroCpuChip' className='h-5 w-5 text-purple-600' />
						<h3 className='text-lg font-semibold'>Especificaciones Técnicas</h3>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Procesador <span className='text-red-500'>*</span>
							</label>
							<Input
								type='text'
								name='processor'
								value={values.processor || ''}
								onChange={handleInputChange}
								placeholder='Ej: I7-1165G7 2.80GHz'
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Tamaño RAM <span className='text-red-500'>*</span>
							</label>
							<Input
								type='text'
								name='ram_size'
								value={values.ram_size || ''}
								onChange={handleInputChange}
								placeholder={
									doesNotTurnOn ? 'Ej: Sin RAM, No aplica' : 'Ej: 16 GB, 8 GB'
								}
								disabled={readOnly}
							/>
							{doesNotTurnOn && (
								<p className='mt-1 text-xs text-amber-600'>
									Si no enciende, indicar "Sin RAM" o dejar vacío
								</p>
							)}
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Slots RAM
							</label>
							<Input
								type='text'
								name='ram_slots'
								value={values.ram_slots || ''}
								onChange={handleInputChange}
								placeholder={doesNotTurnOn ? 'No aplica' : 'Ej: 8x2, 16x1'}
								disabled={readOnly || doesNotTurnOn}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Tipo RAM
							</label>
							<SelectReact
								name='ram_type'
								options={ramTypeOptions}
								value={
									values.ram_type
										? ramTypeOptions.find((o) => o.value === values.ram_type) ||
											null
										: null
								}
								onChange={handleSelectChange('ram_type')}
								placeholder={doesNotTurnOn ? 'Sin RAM' : 'Seleccionar tipo'}
								isDisabled={readOnly}
							/>
							{doesNotTurnOn && (
								<p className='mt-1 text-xs text-amber-600'>
									Seleccionar "Sin RAM" si no se puede verificar
								</p>
							)}
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Tamaño Almacenamiento <span className='text-red-500'>*</span>
							</label>
							<Input
								type='text'
								name='storage_size'
								value={values.storage_size || ''}
								onChange={handleInputChange}
								placeholder={
									doesNotTurnOn ? 'Ej: Sin disco, No aplica' : 'Ej: 512 GB, 1 TB'
								}
								disabled={readOnly}
							/>
							{doesNotTurnOn && (
								<p className='mt-1 text-xs text-amber-600'>
									Si no enciende, indicar "Sin disco" o dejar vacío
								</p>
							)}
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Tecnología Almacenamiento
							</label>
							<SelectReact
								name='storage_technology'
								options={storageTechOptions}
								value={
									values.storage_technology
										? storageTechOptions.find(
												(o) => o.value === values.storage_technology,
											) || null
										: null
								}
								onChange={handleSelectChange('storage_technology')}
								placeholder={doesNotTurnOn ? 'Sin disco' : 'Seleccionar tecnología'}
								isDisabled={readOnly}
							/>
							{doesNotTurnOn && (
								<p className='mt-1 text-xs text-amber-600'>
									Seleccionar "Sin disco / No aplica" si no se puede verificar
								</p>
							)}
						</div>
					</div>
				</CardBody>
			</Card>

			{/* 3️⃣ Cargador y Batería */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroBolt' className='h-5 w-5 text-yellow-600' />
						<h3 className='text-lg font-semibold'>Cargador y Batería</h3>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						{/* Cargador */}
						<div className='flex items-center'>
							<Checkbox
								id='includes_charger'
								name='includes_charger'
								checked={values.includes_charger || false}
								onChange={handleCheckboxChange('includes_charger')}
								disabled={readOnly}
								label='Incluye Cargador'
							/>
						</div>
						{values.includes_charger && (
							<>
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Watts Cargador
									</label>
									<Input
										type='text'
										name='charger_watts'
										value={values.charger_watts || ''}
										onChange={handleInputChange}
										placeholder='Ej: 65W, 90W'
										disabled={readOnly}
									/>
								</div>
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Estado Cargador
									</label>
									<SelectReact
										name='charger_status'
										options={chargerStatusOptions}
										value={
											values.charger_status
												? chargerStatusOptions.find(
														(o) => o.value === values.charger_status,
													) || null
												: null
										}
										onChange={handleSelectChange('charger_status')}
										placeholder='Seleccionar'
										isDisabled={readOnly}
									/>
								</div>
							</>
						)}

						{/* Batería - Lógica condicional Dell vs otras marcas */}
						<div className='col-span-full'>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Estado Batería
							</label>
							{isDell ? (
								<SelectReact
									name='battery_status'
									options={batteryStatusDellOptions}
									value={
										values.battery_status
											? batteryStatusDellOptions.find(
													(o) => o.value === values.battery_status,
												) || null
											: null
									}
									onChange={handleSelectChange('battery_status')}
									placeholder={
										doesNotTurnOn
											? 'No se puede verificar'
											: 'Seleccionar (BIOS format)'
									}
									isDisabled={readOnly || doesNotTurnOn}
								/>
							) : (
								<Input
									type='text'
									name='battery_status'
									value={values.battery_status || ''}
									onChange={handleInputChange}
									placeholder={
										doesNotTurnOn ? 'No se puede verificar' : 'Ej: 83%, 80'
									}
									disabled={readOnly || doesNotTurnOn}
								/>
							)}
							<p className='mt-1 text-xs text-gray-500'>
								{doesNotTurnOn ? (
									<span className='text-amber-600'>
										Equipo sin encendido - No se puede verificar estado de
										batería
									</span>
								) : isDell ? (
									'Dell: Seleccionar estado según BIOS (Excellent, Good, Fair, Poor)'
								) : (
									'Otras marcas: Ingresar porcentaje exacto (Ej: 82%)'
								)}
							</p>
						</div>

						{/* <div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Health Batería
							</label>
							<Input
								type='text'
								name='battery_health'
								value={values.battery_health || ''}
								onChange={handleInputChange}
								placeholder={
									doesNotTurnOn ? 'No aplica' : 'Ej: Design Capacity 50000 mWh'
								}
								disabled={readOnly || doesNotTurnOn}
							/>
						</div> */}
					</div>
				</CardBody>
			</Card>

			{/* 4️⃣ Puertos y Conectividad */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroSignal' className='h-5 w-5 text-blue-600' />
						<h3 className='text-lg font-semibold'>Puertos y Conectividad</h3>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								VGA
							</label>
							<Input
								type='number'
								name='vga_ports'
								value={values.vga_ports || 0}
								onChange={handleNumberChange('vga_ports')}
								min='0'
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								HDMI
							</label>
							<Input
								type='number'
								name='hdmi_ports'
								value={values.hdmi_ports || 0}
								onChange={handleNumberChange('hdmi_ports')}
								min='0'
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								DisplayPort
							</label>
							<Input
								type='number'
								name='displayport_ports'
								value={values.displayport_ports || 0}
								onChange={handleNumberChange('displayport_ports')}
								min='0'
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								USB-A
							</label>
							<Input
								type='number'
								name='usb_a_ports'
								value={values.usb_a_ports || 0}
								onChange={handleNumberChange('usb_a_ports')}
								min='0'
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								USB-C
							</label>
							<Input
								type='number'
								name='usb_c_ports'
								value={values.usb_c_ports || 0}
								onChange={handleNumberChange('usb_c_ports')}
								min='0'
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Lector de tarjetas SD
							</label>
							<Input
								type='number'
								name='lector_de_tarjetas_sd'
								value={values.lector_de_tarjetas_sd || 0}
								onChange={handleNumberChange('lector_de_tarjetas_sd')}
								min='0'
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								RJ45
							</label>
							<Input
								type='number'
								name='rj45_ports'
								value={values.rj45_ports || 0}
								onChange={handleNumberChange('rj45_ports')}
								min='0'
								disabled={readOnly}
							/>
						</div>
					</div>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
						<div className='flex items-center'>
							<Checkbox
								id='has_wifi'
								name='has_wifi'
								checked={values.has_wifi || false}
								onChange={handleCheckboxChange('has_wifi')}
								disabled={readOnly}
								label='Tiene Wi-Fi'
							/>
						</div>
						<div className='flex items-center'>
							<Checkbox
								id='has_bluetooth'
								name='has_bluetooth'
								checked={values.has_bluetooth || false}
								onChange={handleCheckboxChange('has_bluetooth')}
								disabled={readOnly}
								label='Tiene Bluetooth'
							/>
						</div>
						<div className='flex items-center'>
							<Checkbox
								id='all_ports_functional'
								name='all_ports_functional'
								checked={values.all_ports_functional || false}
								onChange={handleCheckboxChange('all_ports_functional')}
								disabled={readOnly}
								label='Todos los Puertos Funcionales'
							/>
						</div>
					</div>

					{!values.all_ports_functional && (
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Cantidad de Puertos Defectuosos
							</label>
							<Input
								type='number'
								name='defective_ports_count'
								value={values.defective_ports_count || 0}
								onChange={handleNumberChange('defective_ports_count')}
								min='0'
								disabled={readOnly}
							/>
							<p className='mt-1 text-xs text-amber-600'>
								Solo 1 puerto dañado = Máximo Grado C. Más de 1 = Grado M automático
							</p>
						</div>
					)}
				</CardBody>
			</Card>

			{/* 5️⃣ Pantalla */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroComputerDesktop' className='h-5 w-5 text-green-600' />
						<h3 className='text-lg font-semibold'>Pantalla</h3>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Pulgadas <span className='text-red-500'>*</span>
							</label>
							<Input
								type='text'
								name='screen_inches'
								value={values.screen_inches || ''}
								onChange={handleInputChange}
								placeholder='Ej: 14"FHD, 15.6"'
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Estado Pantalla
							</label>
							<SelectReact
								name='screen_condition'
								options={conditionOptions}
								value={
									values.screen_condition
										? conditionOptions.find(
												(o) => o.value === values.screen_condition,
											) || null
										: null
								}
								onChange={handleSelectChange('screen_condition')}
								placeholder='Seleccionar'
								isDisabled={readOnly}
							/>
						</div>
						<div className='flex items-center pt-8'>
							<Checkbox
								id='is_touchscreen'
								name='is_touchscreen'
								checked={values.is_touchscreen || false}
								onChange={handleCheckboxChange('is_touchscreen')}
								disabled={readOnly}
								label='Pantalla Táctil'
							/>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* 6️⃣ Teclado y Touchpad */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroCommandLine' className='h-5 w-5 text-orange-600' />
						<h3 className='text-lg font-semibold'>Teclado y Touchpad</h3>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Estado Teclado
							</label>
							<SelectReact
								name='keyboard_condition'
								options={hingeKeyboardOptions}
								value={
									values.keyboard_condition
										? hingeKeyboardOptions.find(
												(o) => o.value === values.keyboard_condition,
											) || null
										: null
								}
								onChange={handleSelectChange('keyboard_condition')}
								placeholder='Seleccionar'
								isDisabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Idioma Teclado
							</label>
							<SelectReact
								name='keyboard_layout'
								options={keyboardLayoutOptions}
								value={
									values.keyboard_layout
										? keyboardLayoutOptions.find(
												(o) => o.value === values.keyboard_layout,
											) || null
										: null
								}
								onChange={handleSelectChange('keyboard_layout')}
								placeholder='Seleccionar'
								isDisabled={readOnly}
							/>
						</div>
						<div className='flex items-center'>
							<Checkbox
								id='has_numeric_keypad'
								name='has_numeric_keypad'
								checked={values.has_numeric_keypad || false}
								onChange={handleCheckboxChange('has_numeric_keypad')}
								disabled={readOnly}
								label='Tiene Teclado Numérico'
							/>
						</div>
						<div className='flex items-center'>
							<Checkbox
								id='has_backlit_keyboard'
								name='has_backlit_keyboard'
								checked={values.has_backlit_keyboard || false}
								onChange={handleCheckboxChange('has_backlit_keyboard')}
								disabled={readOnly}
								label='Teclado Retroiluminado'
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Estado Touchpad
							</label>
							<SelectReact
								name='touchpad_condition'
								options={hingeKeyboardOptions}
								value={
									values.touchpad_condition
										? hingeKeyboardOptions.find(
												(o) => o.value === values.touchpad_condition,
											) || null
										: null
								}
								onChange={handleSelectChange('touchpad_condition')}
								placeholder='Seleccionar'
								isDisabled={readOnly}
							/>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* 7️⃣ Estética (Estado General + Carcasa y Estructura) */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroSparkles' className='h-5 w-5 text-pink-600' />
						<h3 className='text-lg font-semibold'>Estética</h3>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div className='col-span-full'>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Estado General <span className='text-red-500'>*</span>
							</label>
							<SelectReact
								name='general_condition'
								options={generalConditionOptions}
								value={
									values.general_condition
										? generalConditionOptions.find(
												(o) => o.value === values.general_condition,
											) || null
										: null
								}
								onChange={handleSelectChange('general_condition')}
								placeholder='Seleccionar estado'
								isDisabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Tapa Superior (Cubierta)
							</label>
							<SelectReact
								name='cover_condition'
								options={conditionOptions}
								value={
									values.cover_condition
										? conditionOptions.find(
												(o) => o.value === values.cover_condition,
											) || null
										: null
								}
								onChange={handleSelectChange('cover_condition')}
								placeholder='Seleccionar'
								isDisabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Bisagras
							</label>
							<SelectReact
								name='hinge_condition'
								options={hingeKeyboardOptions}
								value={
									values.hinge_condition
										? hingeKeyboardOptions.find(
												(o) => o.value === values.hinge_condition,
											) || null
										: null
								}
								onChange={handleSelectChange('hinge_condition')}
								placeholder='Seleccionar'
								isDisabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Tapa Inferior (Base)
							</label>
							<SelectReact
								name='bottom_condition'
								options={conditionOptions}
								value={
									values.bottom_condition
										? conditionOptions.find(
												(o) => o.value === values.bottom_condition,
											) || null
										: null
								}
								onChange={handleSelectChange('bottom_condition')}
								placeholder='Seleccionar'
								isDisabled={readOnly}
							/>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* 8️⃣ Sistema Operativo */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroCommandLine' className='h-5 w-5 text-indigo-600' />
						<h3 className='text-lg font-semibold'>Sistema Operativo</h3>
					</div>
				</CardHeader>
				<CardBody>
					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Sistema Operativo
						</label>
						<Input
							type='text'
							name='operating_system'
							value={values.operating_system || ''}
							onChange={handleInputChange}
							placeholder='Ej: Windows 11 Pro, Windows 10 Home'
							disabled={readOnly}
						/>
					</div>
				</CardBody>
			</Card>

			{/* 9️⃣ Observaciones */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroDocumentText' className='h-5 w-5 text-gray-600' />
						<h3 className='text-lg font-semibold'>Observaciones</h3>
					</div>
				</CardHeader>
				<CardBody>
					<Textarea
						name='observations'
						value={values.observations || ''}
						onChange={handleTextareaChange}
						rows={4}
						placeholder='Notas adicionales sobre el estado del equipo...'
						disabled={readOnly}
					/>
				</CardBody>
			</Card>
		</div>
	);
};

export default NotebookForm;
