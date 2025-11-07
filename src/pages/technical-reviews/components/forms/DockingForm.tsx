/**
 * DockingForm - Formulario de revisión técnica para Docking Stations
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

interface DockingFormProps {
	branchId: number;
	values: Partial<UpdateItemDetailsPayload>;
	onChange: (field: string, value: any) => void;
	readOnly?: boolean;
}

const DockingForm: React.FC<DockingFormProps> = ({
	branchId,
	values,
	onChange,
	readOnly = false,
}) => {
	const dispatch = useAppDispatch();
	const validationLoading = useAppSelector((s) => s.technicalReviews.validationRulesLoading);

	useEffect(() => {
		if (branchId) {
			dispatch(fetchValidationRulesByType({ branchId, equipmentType: 'docking' }));
		}
	}, [dispatch, branchId]);

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
		{ value: 'conector_roto', label: 'Conector roto' },
		{ value: 'no_incluye', label: 'No incluye' },
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
								placeholder='Ej: Dell, HP'
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
								placeholder='Ej: WD19S'
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
								placeholder='Ej: Docking'
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

			{/* Cargador */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroBolt' className='h-5 w-5 text-yellow-600' />
						<h3 className='text-lg font-semibold'>Cargador</h3>
					</div>
				</CardHeader>
				<CardBody>
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
								<label className='mb-2 block text-sm font-medium'>
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
					</div>
				</CardBody>
			</Card>

			{/* Carcasa */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroShieldCheck' className='h-5 w-5 text-gray-600' />
						<h3 className='text-lg font-semibold'>Carcasa</h3>
					</div>
				</CardHeader>
				<CardBody>
					<div>
						<label className='mb-2 block text-sm font-medium'>Estado Cubierta</label>
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
						<div>
							<label className='mb-2 block text-sm font-medium'>Lector de tarjetas SD</label>
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
							<label className='mb-2 block text-sm font-medium'>RJ45</label>
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
								label='Todos Funcionales'
							/>
						</div>
					</div>

					{!values.all_ports_functional && (
						<div>
							<label className='mb-2 block text-sm font-medium'>
								Puertos Defectuosos
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
						placeholder='Notas adicionales...'
						disabled={readOnly}
					/>
				</CardBody>
			</Card>
		</div>
	);
};

export default DockingForm;
