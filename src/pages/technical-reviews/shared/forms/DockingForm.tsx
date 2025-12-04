/**
 * DockingForm - Formulario de revisión técnica para Docking Stations
 */
import React, { useEffect, useMemo } from 'react';
import type { MultiValue, SingleValue } from 'react-select';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import Checkbox from '@/components/form/Checkbox';
import Icon from '@/components/icon/Icon';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchValidationRulesByType } from '@/store/slices/technicalReviews';
import type { UpdateItemDetailsPayload } from '@/interface/technicalReviews.interface';
import { fetchBrands } from '@/store/slices/brands/brandsSlice';

interface DockingFormProps {
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

const powerCableStatusOptions: TSelectOption[] = [
	{ value: 'good_condition', label: 'Buen estado' },
	{ value: 'damaged_cable', label: 'Cable dañado' },
	{ value: 'not_matching_equipment', label: 'No corresponde al equipo' },
	{ value: 'not_included', label: 'No incluye' },
];

const coverConditionOptions: TSelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Faltan piezas' },
	{ value: 'scratched', label: 'Rayado' },
	{ value: 'broken', label: 'Roto' },
];

const portFields: Array<{ name: keyof UpdateItemDetailsPayload; label: string }> = [
	{ name: 'vga_ports', label: 'VGA' },
	{ name: 'hdmi_ports', label: 'HDMI' },
	{ name: 'displayport_ports', label: 'DisplayPort' },
	{ name: 'usb_a_ports', label: 'USB-A' },
	{ name: 'usb_c_ports', label: 'USB-C' },
	{ name: 'sd_readers', label: 'Lectores SD' },
	{ name: 'rj45_ports', label: 'RJ45' },
];

const isMultiValue = (
	option: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null,
): option is MultiValue<TSelectOption> => Array.isArray(option);

const DockingForm: React.FC<DockingFormProps> = ({
	branchId,
	values,
	onChange,
	readOnly = false,
}) => {
	const dispatch = useAppDispatch();
	const validationLoading = useAppSelector(
		(state) => state.technicalReviews.validationRulesLoading,
	);
	const brands = useAppSelector((state) => state.brands.items);
	const brandsLoading = useAppSelector((state) => state.brands.loading);

	useEffect(() => {
		if (branchId) {
			dispatch(fetchValidationRulesByType({ branchId, equipmentType: 'docking' }));
			dispatch(fetchBrands({ branchId, search: '' }));
		}
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
		onChange(name, Number.isNaN(val) ? 0 : val);
	};

	const getNumericValue = (fieldName: keyof UpdateItemDetailsPayload): number => {
		const value = values[fieldName];
		return typeof value === 'number' ? value : 0;
	};

	const includesPowerAdapter = Boolean(values.includes_power_adapter);
	const powerCableStatusValue = values.power_cable_status ?? null;

	const handleTogglePowerAdapter = (checked: boolean) => {
		if (!checked) {
			onChange('power_cable_status', 'not_included');
		}
	};

	if (validationLoading && brandsLoading) {
		return (
			<Card>
				<CardBody className='p-6'>
					<div className='flex items-center justify-center py-8'>
						<Icon icon='HeroArrowPath' className='mr-2 h-5 w-5 animate-spin' />
						<span className='text-gray-600 dark:text-gray-400'>
							Cargando configuraciones…
						</span>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
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
							isDisabled={readOnly || brandsLoading}
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
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroBolt' className='h-5 w-5 text-yellow-600' />
						<h3 className='text-lg font-semibold'>Cargador</h3>
					</div>
				</CardHeader>
				<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div className='flex items-center'>
						<Checkbox
							id='includes_power_adapter'
							name='includes_power_adapter'
							checked={includesPowerAdapter}
							onChange={handleCheckboxChange(
								'includes_power_adapter',
								handleTogglePowerAdapter,
							)}
							disabled={readOnly}
							label='Incluye cargador'
						/>
					</div>
					{includesPowerAdapter && (
						<div>
							<label className='mb-2 block text-sm font-medium'>
								Estado del cargador
							</label>
							<SelectReact
								name='power_cable_status'
								options={powerCableStatusOptions}
								value={
									powerCableStatusValue
										? powerCableStatusOptions.find(
												(o) => o.value === powerCableStatusValue,
											) || null
										: null
								}
								onChange={handleSelectChange('power_cable_status')}
								placeholder='Seleccionar'
								isDisabled={readOnly}
							/>
						</div>
					)}
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroSignal' className='h-5 w-5 text-blue-600' />
						<h3 className='text-lg font-semibold'>Puertos y conectividad</h3>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
						{portFields.map((field) => (
							<div key={field.name as string}>
								<label className='mb-2 block text-sm font-medium'>
									{field.label}
								</label>
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
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
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
								id='all_ports_functional'
								name='all_ports_functional'
								checked={values.all_ports_functional || false}
								onChange={handleCheckboxChange('all_ports_functional')}
								disabled={readOnly}
								label='Todos los puertos funcionan'
							/>
						</div>
					</div>
					{values.all_ports_functional === false && (
						<div>
							<label className='mb-2 block text-sm font-medium'>
								Puertos defectuosos
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

			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroShieldCheck' className='h-5 w-5 text-gray-600' />
						<h3 className='text-lg font-semibold'>Estado general y carcasa</h3>
					</div>
				</CardHeader>
				<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
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
						<label className='mb-2 block text-sm font-medium'>Condición carcasa</label>
						<SelectReact
							name='cover_condition'
							options={coverConditionOptions}
							value={
								values.cover_condition
									? coverConditionOptions.find(
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
