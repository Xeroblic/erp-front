/**
 * DesktopForm - Formulario de revisión para Desktop
 * Reordena secciones (puertos, cargador, estado físico) y normaliza catálogos
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

interface DesktopFormProps {
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

const coverConditionOptions: TSelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'good_condition', label: 'Buen estado' },
	{ value: 'light_scratches', label: 'Rayas leves' },
	{ value: 'noticeable_wear', label: 'Desgaste visible' },
	{ value: 'broken', label: 'Roto' },
];

const chargerStatusOptions: TSelectOption[] = [
	{ value: 'good_condition', label: 'Buen estado' },
	{ value: 'damaged_cable', label: 'Cable dañado' },
	{ value: 'not_matching_equipment', label: 'No corresponde al equipo' },
	{ value: 'not_included', label: 'No incluye' },
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

const DesktopForm: React.FC<DesktopFormProps> = ({
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
		dispatch(fetchValidationRulesByType({ branchId, equipmentType: 'desktop' }));
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
		onChange(name, Number.isNaN(val) ? 0 : val);
	};

	const getNumericValue = (fieldName: keyof UpdateItemDetailsPayload): number => {
		const value = values[fieldName];
		return typeof value === 'number' ? value : 0;
	};

	const includesCharger = values.includes_charger ?? true;

	const handleChargerToggle = (checked: boolean) => {
		onChange('includes_charger', checked);
		if (!checked) {
			onChange('charger_status', 'not_included');
		} else if (values.charger_status === 'not_included') {
			onChange('charger_status', null);
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
			{/* Información general */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroInformationCircle' className='h-5 w-5 text-blue-600' />
						<h3 className='text-lg font-semibold'>Información general</h3>
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
							placeholder='Ej: OPTIPLEX 7090'
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
							placeholder='Ej: Optiplex'
							disabled={readOnly}
						/>
					</div>
				</CardBody>
			</Card>

			{/* Especificaciones técnicas */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroCpuChip' className='h-5 w-5 text-purple-600' />
						<h3 className='text-lg font-semibold'>Especificaciones técnicas</h3>
					</div>
				</CardHeader>
				<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div>
						<label className='mb-2 block text-sm font-medium'>
							Procesador <span className='text-red-500'>*</span>
						</label>
						<Input
							type='text'
							name='processor'
							value={values.processor || ''}
							onChange={handleInputChange}
							placeholder='Ej: I7-10700 2.90GHz'
							disabled={readOnly}
						/>
					</div>
					<div>
						<label className='mb-2 block text-sm font-medium'>
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
						<label className='mb-2 block text-sm font-medium'>Slots RAM</label>
						<Input
							type='text'
							name='ram_slots'
							value={values.ram_slots || ''}
							onChange={handleInputChange}
							placeholder='Ej: 16X1'
							disabled={readOnly}
						/>
					</div>
					<div>
						<label className='mb-2 block text-sm font-medium'>Tipo RAM</label>
						<SelectReact
							name='ram_type'
							options={ramTypeOptions}
							value={
								values.ram_type
									? ramTypeOptions.find((o) => o.value === values.ram_type) || null
									: null
							}
							onChange={handleSelectChange('ram_type')}
							placeholder='Seleccionar'
							isDisabled={readOnly}
						/>
					</div>
					<div>
						<label className='mb-2 block text-sm font-medium'>
							Tamaño almacenamiento <span className='text-red-500'>*</span>
						</label>
						<Input
							type='text'
							name='storage_size'
							value={values.storage_size || ''}
							onChange={handleInputChange}
							placeholder='Ej: 512 GB'
							disabled={readOnly}
						/>
					</div>
					<div>
						<label className='mb-2 block text-sm font-medium'>Tecnología almacenamiento</label>
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
							placeholder='Seleccionar'
							isDisabled={readOnly}
						/>
					</div>
				</CardBody>
			</Card>

			{/* Puertos y conectividad */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroSignal' className='h-5 w-5 text-blue-600' />
						<h3 className='text-lg font-semibold'>Puertos y conectividad</h3>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
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
								id='has_cd_drive'
								name='has_cd_drive'
								checked={values.has_cd_drive || false}
								onChange={handleCheckboxChange('has_cd_drive')}
								disabled={readOnly}
								label='Tiene unidad CD/DVD'
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
				<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div className='flex items-center'>
						<Checkbox
							id='includes_charger'
							name='includes_charger'
							checked={includesCharger}
							onChange={handleCheckboxChange('includes_charger', handleChargerToggle)}
							disabled={readOnly}
							label='Incluye cargador'
						/>
					</div>
					{includesCharger ? (
						<div>
							<label className='mb-2 block text-sm font-medium'>Estado cargador</label>
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
					) : (
						<div className='rounded-lg bg-amber-50 p-3 text-sm text-amber-700'>
							Al marcar “No incluye” se asigna automáticamente el estado “No incluye”.
						</div>
					)}
				</CardBody>
			</Card>

			{/* Estado físico */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroSparkles' className='h-5 w-5 text-emerald-600' />
						<h3 className='text-lg font-semibold'>Estado físico</h3>
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

			{/* Sistema operativo y observaciones */}
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroDocumentText' className='h-5 w-5 text-gray-600' />
						<h3 className='text-lg font-semibold'>Sistema operativo y observaciones</h3>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div>
						<label className='mb-2 block text-sm font-medium'>Sistema operativo</label>
						<Input
							type='text'
							name='operating_system'
							value={values.operating_system || ''}
							onChange={handleInputChange}
							placeholder='Ej: Windows 11 Pro'
							disabled={readOnly}
						/>
					</div>
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

export default DesktopForm;
