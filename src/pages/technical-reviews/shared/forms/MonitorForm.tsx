/**
 * MonitorForm - Formulario de revisión técnica para Monitores
 * Ajustado con las reglas de validación solicitadas (alimentación, revisión general y listas controladas)
 */
import React, { useEffect, useMemo } from 'react';
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

interface MonitorFormProps {
	branchId: number;
	values: Partial<UpdateItemDetailsPayload>;
	onChange: (field: string, value: unknown) => void;
	readOnly?: boolean;
}

const generalConditionOptions: TSelectOption[] = [
	{ value: 'like_new', label: 'Como nuevo' },
	{ value: 'good_shape', label: 'Buen estado' },
	{ value: 'visible_wear', label: 'Desgaste visible' },
	{ value: 'needs_repair', label: 'Requiere reparación' },
	{ value: 'scrap', label: 'Solo repuestos' },
];

const screenConditionOptions: TSelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'minor_wear', label: 'Desgaste leve' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Faltan piezas' },
	{ value: 'dead_pixels', label: 'Pixeles muertos' },
	{ value: 'broken', label: 'Roto' },
];

const frameConditionOptions: TSelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Faltan piezas' },
	{ value: 'scratched', label: 'Rayado' },
	{ value: 'broken', label: 'Roto' },
];

const standConditionOptions: TSelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Faltan piezas' },
	{ value: 'broken', label: 'Roto' },
	{ value: 'no_stand', label: 'Sin base' },
];

const powerCableStatusOptions: TSelectOption[] = [
	{ value: 'good_condition', label: 'Buen estado' },
	{ value: 'damaged_cable', label: 'Cable dañado' },
	{ value: 'not_matching_equipment', label: 'No corresponde al equipo' },
	{ value: 'not_included', label: 'No incluye' },
];

const portFields: Array<{ name: keyof UpdateItemDetailsPayload; label: string }> = [
	{ name: 'vga_ports', label: 'VGA' },
	{ name: 'dvi_ports', label: 'DVI' },
	{ name: 'hdmi_ports', label: 'HDMI' },
	{ name: 'displayport_ports', label: 'DisplayPort' },
	{ name: 'usb_a_ports', label: 'USB-A' },
	{ name: 'usb_c_ports', label: 'USB-C' },
];

const MonitorForm: React.FC<MonitorFormProps> = ({
	branchId,
	values,
	onChange,
	readOnly = false,
}) => {
	const dispatch = useAppDispatch();
	const validationLoading = useAppSelector((state) => state.technicalReviews.validationRulesLoading);
	const brands = useAppSelector((state) => state.brands.items);
	const brandsLoading = useAppSelector((state) => state.brands.loading);

	useEffect(() => {
		if (!branchId) return;
		dispatch(fetchValidationRulesByType({ branchId, equipmentType: 'monitor' }));
		dispatch(fetchBrands({ branchId }));
	}, [dispatch, branchId]);

	const brandOptions = useMemo(() => {
		const unique = new Map<string, TSelectOption>();

		brands
			.filter((brand) => Boolean(brand?.name))
			.forEach((brand) => {
				const name = String(brand.name);
				if (!unique.has(name)) {
					unique.set(name, { value: name, label: name });
				}
			});
		if (values.brand && !unique.has(values.brand)) {
			unique.set(values.brand, { value: values.brand, label: values.brand });
		}
		return Array.from(unique.values());
	}, [brands, values.brand]);

	const brandSelectValue = useMemo(() => {
		if (!values.brand) return null;
		return (
			brandOptions.find((option) => option.value === values.brand) ?? {
				value: values.brand,
				label: values.brand,
			}
		);
	}, [brandOptions, values.brand]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.name, e.target.value);
	};

	const handleSelectChange =
		(name: string) =>
		(option: TSelectOption | null) => {
			onChange(name, option?.value ?? null);
		};

	const handleCheckboxChange =
		(name: string, extra?: (checked: boolean) => void) =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			onChange(name, e.target.checked);
			extra?.(e.target.checked);
		};

	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.name, e.target.value);
	};

	const handleNumberChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
		onChange(name, val);
	};

	const includesPowerCable = values.includes_power_cable ?? true;
	const includesStand = values.includes_stand ?? true;

	const getNumericValue = (fieldName: keyof UpdateItemDetailsPayload): number => {
		const numericCandidate = values[fieldName];
		return typeof numericCandidate === 'number' ? numericCandidate : 0;
	};

	const handleTogglePowerCable = (checked: boolean) => {
		onChange('includes_power_cable', checked);
		if (!checked) {
			onChange('power_cable_status', 'not_included');
		} else if (values.power_cable_status === 'not_included') {
			onChange('power_cable_status', null);
		}
	};

	const handleToggleStand = (checked: boolean) => {
		onChange('includes_stand', checked);
		if (!checked) {
			onChange('stand_condition', 'no_stand');
		} else if (values.stand_condition === 'no_stand') {
			onChange('stand_condition', null);
		}
	};

	if (validationLoading || (brandsLoading && !brandOptions.length)) {
		return (
			<Card>
				<CardBody className='p-6'>
					<div className='flex items-center justify-center py-8'>
						<Icon icon='HeroArrowPath' className='mr-2 h-5 w-5 animate-spin' />
						<span className='text-gray-600 dark:text-gray-400'>Cargando formulario…</span>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Identificación */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroInformationCircle' className='h-5 w-5 text-blue-600' />
						<h3 className='text-lg font-semibold'>Identificación</h3>
					</div>
				</CardHeader>
				<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div>
						<label className='mb-2 block text-sm font-medium'>
							Marca <span className='text-red-500'>*</span>
						</label>
						<SelectReact
							name='brand'
							options={brandOptions}
							value={brandSelectValue}
							onChange={handleSelectChange('brand')}
							placeholder='Seleccionar marca'
							isDisabled={readOnly}
							isCreatable
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
							placeholder='Ej: P2222H'
							disabled={readOnly}
						/>
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
				<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div>
						<label className='mb-2 block text-sm font-medium'>
							Pulgadas <span className='text-red-500'>*</span>
						</label>
						<Input
							type='text'
							name='screen_inches'
							value={values.screen_inches || ''}
							onChange={handleInputChange}
							placeholder='Ej: 22" FHD'
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
				</CardBody>
			</Card>

			{/* Alimentación */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroBolt' className='h-5 w-5 text-yellow-600' />
						<h3 className='text-lg font-semibold'>Cargador / Alimentación</h3>
					</div>
				</CardHeader>
				<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div className='flex items-center'>
						<Checkbox
							id='includes_power_cable'
							name='includes_power_cable'
							checked={includesPowerCable}
							onChange={handleCheckboxChange('includes_power_cable', handleTogglePowerCable)}
							disabled={readOnly}
							label='Incluye cable de alimentación'
						/>
					</div>
					{includesPowerCable ? (
						<div>
							<label className='mb-2 block text-sm font-medium'>Estado cable</label>
							<SelectReact
								name='power_cable_status'
								options={powerCableStatusOptions}
								value={
									values.power_cable_status
										? powerCableStatusOptions.find(
												(o) => o.value === values.power_cable_status,
											) || null
										: null
								}
								onChange={handleSelectChange('power_cable_status')}
								placeholder='Seleccionar estado'
								isDisabled={readOnly}
							/>
						</div>
					) : (
						<div className='rounded-lg bg-amber-50 p-3 text-sm text-amber-700'>
							Al marcar “No incluye” se fija automáticamente el estado en “No incluye”.
						</div>
					)}
				</CardBody>
			</Card>

			{/* Puertos y conectividad */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroSignal' className='h-5 w-5 text-blue-600' />
						<h3 className='text-lg font-semibold'>Puertos y Conectividad</h3>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
						{portFields.map((field) => (
							<div key={field.name as string}>
								<label className='mb-2 block text-sm font-medium'>{field.label}</label>
								<Input
									type='number'
									name={field.name as string}
									value={getNumericValue(field.name)}
									onChange={handleNumberChange(field.name as string)}
									min='0'
									disabled={readOnly}
								/>
							</div>
						))}
					</div>
					<div className='flex items-center'>
						<Checkbox
							id='all_ports_functional'
							name='all_ports_functional'
							checked={values.all_ports_functional || false}
							onChange={handleCheckboxChange('all_ports_functional')}
							disabled={readOnly}
							label='Todos los puertos funcionan'
						/>
					</div>
					{values.all_ports_functional === false && (
						<div>
							<label className='mb-2 block text-sm font-medium'>
								puertos defectuosos críticos
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

			{/* Revisión general (Marco y soporte) */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroSparkles' className='h-5 w-5 text-emerald-600' />
						<h3 className='text-lg font-semibold'>Revisión general</h3>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<label className='mb-2 block text-sm font-medium'>
								Condición general <span className='text-red-500'>*</span>
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
						<div>
							<label className='mb-2 block text-sm font-medium'>Condición pantalla</label>
							<SelectReact
								name='screen_condition'
								options={screenConditionOptions}
								value={
									values.screen_condition
										? screenConditionOptions.find(
												(o) => o.value === values.screen_condition,
											) || null
										: null
								}
								onChange={handleSelectChange('screen_condition')}
								placeholder='Seleccionar'
								isDisabled={readOnly}
							/>
						</div>
						<div>
							<label className='mb-2 block text-sm font-medium'>Condición marco</label>
							<SelectReact
								name='frame_condition'
								options={frameConditionOptions}
								value={
									values.frame_condition
										? frameConditionOptions.find(
												(o) => o.value === values.frame_condition,
											) || null
										: null
								}
								onChange={handleSelectChange('frame_condition')}
								placeholder='Seleccionar'
								isDisabled={readOnly}
							/>
						</div>
						<div className='flex items-center pt-2'>
							<Checkbox
								id='includes_stand'
								name='includes_stand'
								checked={includesStand}
								onChange={handleCheckboxChange('includes_stand', handleToggleStand)}
								disabled={readOnly}
								label='Incluye base/soporte'
							/>
						</div>
						{includesStand && (
							<div>
								<label className='mb-2 block text-sm font-medium'>
									Condición soporte/base
								</label>
								<SelectReact
									name='stand_condition'
									options={standConditionOptions}
									value={
										values.stand_condition
											? standConditionOptions.find(
													(o) => o.value === values.stand_condition,
												) || null
											: null
									}
									onChange={handleSelectChange('stand_condition')}
									placeholder='Seleccionar'
									isDisabled={readOnly}
								/>
							</div>
						)}
					</div>
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
						placeholder='Notas adicionales…'
						disabled={readOnly}
					/>
				</CardBody>
			</Card>
		</div>
	);
};

export default MonitorForm;
