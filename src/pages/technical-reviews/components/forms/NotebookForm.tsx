/**
 * NotebookForm - Formulario de revisión técnica para Notebooks
 * Mapea todos los campos según UpdateItemDetailsPayload
 */
import React, { useEffect } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import Checkbox from '@/components/form/Checkbox';
import Icon from '@/components/icon/Icon';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchValidationRulesByType } from '@/store/slices/technicalReviews';
import type { UpdateItemDetailsPayload } from '@/interface/technicalReviews.interface';

interface NotebookFormProps {
	branchId: number;
	values: Partial<UpdateItemDetailsPayload>;
	onChange: (field: string, value: any) => void;
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

	useEffect(() => {
		if (branchId) {
			dispatch(fetchValidationRulesByType({ branchId, equipmentType: 'notebook' }));
		}
	}, [dispatch, branchId]);

	// Opciones para selects
	const generalConditionOptions: TSelectOption[] = [
		{ value: 'excellent', label: 'Excelente' },
		{ value: 'good_shape', label: 'Buen estado' },
		{ value: 'visible_wear', label: 'Desgaste visible' },
		{ value: 'damaged', label: 'Dañado' },
	];

	const chargerStatusOptions: TSelectOption[] = [
		{ value: 'buen_estado', label: 'Buen estado' },
		{ value: 'cable_en_mal_estado', label: 'Cable en mal estado' },
		{ value: 'conector_roto', label: 'Conector roto' },
		{ value: 'no_incluye', label: 'No incluye' },
	];

	const batteryStatusOptions: TSelectOption[] = [
		{ value: 'excellent', label: 'Excelente (>80%)' },
		{ value: 'good', label: 'Bueno (60-80%)' },
		{ value: 'fair', label: 'Regular (40-60%)' },
		{ value: 'poor', label: 'Malo (<40%)' },
		{ value: 'not_detected', label: 'No detectada' },
	];

	const conditionOptions: TSelectOption[] = [
		{ value: 'ok', label: 'OK' },
		{ value: 'worn', label: 'Desgastado' },
		{ value: 'scratched', label: 'Rayado' },
		{ value: 'damaged', label: 'Dañado' },
	];

	const keyboardLayoutOptions: TSelectOption[] = [
		{ value: 'ES', label: 'Español (ES)' },
		{ value: 'EN', label: 'Inglés (EN)' },
		{ value: 'LA', label: 'Latinoamericano (LA)' },
	];

	const ramTypeOptions: TSelectOption[] = [
		{ value: 'DDR3', label: 'DDR3' },
		{ value: 'DDR4', label: 'DDR4' },
		{ value: 'DDR5', label: 'DDR5' },
	];

	const storageTechOptions: TSelectOption[] = [
		{ value: 'HDD', label: 'HDD' },
		{ value: 'SSD', label: 'SSD' },
		{ value: 'M.2', label: 'M.2' },
		{ value: 'NVMe', label: 'NVMe' },
	];

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.name, e.target.value);
	};

	const handleSelectChange = (name: string) => (option: any) => {
		const selectedOption = option as TSelectOption | null;
		onChange(name, selectedOption?.value || null);
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

	if (validationLoading) {
		return (
			<Card>
				<CardBody className='p-6'>
					<div className='flex items-center justify-center py-8'>
						<Icon icon='HeroArrowPath' className='mr-2 h-5 w-5 animate-spin' />
						<span className='text-gray-600 dark:text-gray-400'>
							Cargando reglas de validación...
						</span>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Información General */}
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
							<Input
								type='text'
								name='brand'
								value={values.brand || ''}
								onChange={handleInputChange}
								placeholder='Ej: Dell, HP, Lenovo'
								disabled={readOnly}
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
						<div>
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
					</div>
				</CardBody>
			</Card>

			{/* Especificaciones Técnicas */}
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
								placeholder='Ej: 16 GB'
								disabled={readOnly}
							/>
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
								placeholder='Ej: 8X2, 16X1'
								disabled={readOnly}
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
								placeholder='Seleccionar tipo'
								isDisabled={readOnly}
							/>
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
								placeholder='Ej: 512 GB, 1 TB'
								disabled={readOnly}
							/>
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
								placeholder='Seleccionar tecnología'
								isDisabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Sistema Operativo
							</label>
							<Input
								type='text'
								name='operating_system'
								value={values.operating_system || ''}
								onChange={handleInputChange}
								placeholder='Ej: Windows 11 Pro'
								disabled={readOnly}
							/>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* Pantalla */}
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

			{/* Teclado y Touchpad */}
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
								options={conditionOptions}
								value={
									values.keyboard_condition
										? conditionOptions.find(
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
								Layout Teclado
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
								options={conditionOptions}
								value={
									values.touchpad_condition
										? conditionOptions.find(
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

			{/* Carcasa y Estructura */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroShieldCheck' className='h-5 w-5 text-gray-600' />
						<h3 className='text-lg font-semibold'>Carcasa y Estructura</h3>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Estado Cubierta
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
								Estado Bisagras
							</label>
							<SelectReact
								name='hinge_condition'
								options={conditionOptions}
								value={
									values.hinge_condition
										? conditionOptions.find(
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
								Estado Base
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

			{/* Cargador y Batería */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroBolt' className='h-5 w-5 text-yellow-600' />
						<h3 className='text-lg font-semibold'>Cargador y Batería</h3>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
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
						)}
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Estado Batería
							</label>
							<SelectReact
								name='battery_status'
								options={batteryStatusOptions}
								value={
									values.battery_status
										? batteryStatusOptions.find(
												(o) => o.value === values.battery_status,
											) || null
										: null
								}
								onChange={handleSelectChange('battery_status')}
								placeholder='Seleccionar'
								isDisabled={readOnly}
							/>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* Puertos y Conectividad */}
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
								SD Readers
							</label>
							<Input
								type='number'
								name='sd_readers'
								value={values.sd_readers || 0}
								onChange={handleNumberChange('sd_readers')}
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
						</div>
					)}
				</CardBody>
			</Card>

			{/* Observaciones */}
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
