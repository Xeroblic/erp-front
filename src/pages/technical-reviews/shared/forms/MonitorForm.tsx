/**
 * MonitorForm - Formulario de revisión técnica para Monitores
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

interface MonitorFormProps {
	branchId: number;
	values: Partial<UpdateItemDetailsPayload>;
	onChange: (field: string, value: any) => void;
	readOnly?: boolean;
}

const MonitorForm: React.FC<MonitorFormProps> = ({
	branchId,
	values,
	onChange,
	readOnly = false,
}) => {
	const dispatch = useAppDispatch();
	const validationLoading = useAppSelector((s) => s.technicalReviews.validationRulesLoading);

	useEffect(() => {
		if (branchId) {
			dispatch(fetchValidationRulesByType({ branchId, equipmentType: 'monitor' }));
		}
	}, [dispatch, branchId]);

	const generalConditionOptions: TSelectOption[] = [
		{ value: 'like_new', label: 'Como nuevo' },
		{ value: 'good_shape', label: 'Buen estado' },
		{ value: 'visible_wear', label: 'Desgaste visible' },
		{ value: 'needs_repair', label: 'Requiere reparación' },
		{ value: 'scrap', label: 'Solo repuestos' },
	];

	const conditionOptions: TSelectOption[] = [
		{ value: 'ok', label: 'OK' },
		{ value: 'worn', label: 'Desgastado' },
		{ value: 'missing_pieces', label: 'Faltan piezas' },
		{ value: 'scratched', label: 'Rayado' },
		{ value: 'broken', label: 'Roto' },
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
						<span className='text-gray-600 dark:text-gray-400'>Cargando reglas...</span>
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
							<label className='mb-2 block text-sm font-medium'>
								Marca <span className='text-red-500'>*</span>
							</label>
							<Input
								type='text'
								name='brand'
								value={values.brand || ''}
								onChange={handleInputChange}
								placeholder='Ej: Dell, HP, LG'
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium'>
								Modelo <span className='text-red-500'>*</span>
							</label>
							<Input
								type='text'
								name='model'
								value={values.model || ''}
								onChange={handleInputChange}
								placeholder='Ej: P2419H'
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium'>Línea</label>
							<Input
								type='text'
								name='line'
								value={values.line || ''}
								onChange={handleInputChange}
								placeholder='Ej: Professional'
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium'>
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
								placeholder='Seleccionar'
								isDisabled={readOnly}
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
							<label className='mb-2 block text-sm font-medium'>
								Pulgadas <span className='text-red-500'>*</span>
							</label>
							<Input
								type='text'
								name='screen_inches'
								value={values.screen_inches || ''}
								onChange={handleInputChange}
								placeholder='Ej: 24"FHD'
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium'>Resolución</label>
							<Input
								type='text'
								name='screen_resolution'
								value={values.screen_resolution || ''}
								onChange={handleInputChange}
								placeholder='Ej: 1920x1080'
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium'>
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
					</div>

					<div className='flex items-center'>
						<Checkbox
							id='is_touchscreen'
							name='is_touchscreen'
							checked={values.is_touchscreen || false}
							onChange={handleCheckboxChange('is_touchscreen')}
							disabled={readOnly}
							label='Pantalla Táctil'
						/>
					</div>
				</CardBody>
			</Card>

			{/* Marco y Soporte */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroShieldCheck' className='h-5 w-5 text-gray-600' />
						<h3 className='text-lg font-semibold'>Marco y Soporte</h3>
					</div>
				</CardHeader>
				<CardBody>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<label className='mb-2 block text-sm font-medium'>Estado Marco</label>
							<SelectReact
								name='frame_condition'
								options={conditionOptions}
								value={
									values.frame_condition
										? conditionOptions.find(
												(o) => o.value === values.frame_condition,
											) || null
										: null
								}
								onChange={handleSelectChange('frame_condition')}
								placeholder='Seleccionar'
								isDisabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium'>
								Estado Soporte/Base
							</label>
							<SelectReact
								name='stand_condition'
								options={conditionOptions}
								value={
									values.stand_condition
										? conditionOptions.find(
												(o) => o.value === values.stand_condition,
											) || null
										: null
								}
								onChange={handleSelectChange('stand_condition')}
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
							<label className='mb-2 block text-sm font-medium'>VGA</label>
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
							<label className='mb-2 block text-sm font-medium'>DVI</label>
							<Input
								type='number'
								name='dvi_ports'
								value={values.dvi_ports || 0}
								onChange={handleNumberChange('dvi_ports')}
								min='0'
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium'>HDMI</label>
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
							<label className='mb-2 block text-sm font-medium'>DisplayPort</label>
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
							<label className='mb-2 block text-sm font-medium'>USB-A</label>
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
							<label className='mb-2 block text-sm font-medium'>USB-C</label>
							<Input
								type='number'
								name='usb_c_ports'
								value={values.usb_c_ports || 0}
								onChange={handleNumberChange('usb_c_ports')}
								min='0'
								disabled={readOnly}
							/>
						</div>
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

					{!values.all_ports_functional && (
						<div>
							<label className='mb-2 block text-sm font-medium'>
								Cantidad de Puertos Defectuosos Críticos
							</label>
							<Input
								type='number'
								name='critical_defective_ports_count'
								value={values.critical_defective_ports_count || 0}
								onChange={handleNumberChange('critical_defective_ports_count')}
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
						placeholder='Notas adicionales...'
						disabled={readOnly}
					/>
				</CardBody>
			</Card>
		</div>
	);
};

export default MonitorForm;
