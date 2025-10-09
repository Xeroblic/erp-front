import React, { useState, useEffect, ChangeEvent } from 'react';
import { useFormikContext } from 'formik';
import Input from '../../../../../components/form/Input';
import Select from '../../../../../components/form/Select';
import type { ProductDetailForm } from '../../types/products.types';
import {
	PRODUCT_DEVICE_TYPES,
	CATEGORY_GRADES,
	CPU_BRANDS,
	CPU_FAMILIES,
	CPU_GENERATIONS,
	RAM_TYPES,
	RAM_CAPACITIES,
	RAM_MODULES,
	RAM_CHANNELS,
	STORAGE_CONFIGS,
	STORAGE_TYPES,
	STORAGE_CAPACITIES,
	GPU_TYPES,
	OS_NAMES,
	OS_VERSIONS,
	LICENSE_TYPES,
	WIFI_STANDARDS,
	BLUETOOTH_VERSIONS,
	ETHERNET_SPEEDS,
	DISPLAY_SIZES,
	DISPLAY_RESOLUTIONS,
	DISPLAY_PANELS,
	DISPLAY_REFRESH_RATES,
	MONITOR_CONNECTORS,
	KEYBOARD_LAYOUTS,
	CHARGER_TYPES,
	CAMERA_RESOLUTIONS,
} from '../../constants/product-attributes.constants';

interface AttributesData {
	product_kind?: string;
	category_grade?: string;
	cpu?: {
		brand?: string;
		family?: string;
		generation?: string;
		model?: string;
		cores?: number;
		threads?: number;
		base_clock_mhz?: number;
		boost_clock_mhz?: number;
	};
	ram?: {
		type?: string;
		capacity_gb?: number;
		modules?: number;
		channel?: string;
		upgradable?: boolean;
		max_supported_gb?: number;
	};
	storage?: {
		config?: string;
		primary?: {
			type?: string;
			capacity_gb?: number;
		};
		secondary?: {
			type?: string;
			capacity_gb?: number;
		};
		upgradable?: boolean;
		max_supported_gb?: number;
		available_slots?: {
			m2?: number;
			sata?: number;
		};
	};
	gpu?: {
		type?: string;
		model?: string;
		vram_gb?: number | null;
	};
	display?: {
		size_inches?: number;
		resolution?: string;
		panel?: string;
		refresh_hz?: number;
		response_time_ms?: number;
		aspect_ratio?: string;
		brightness_nits?: number;
		connectors?: string[];
		adjustable_stand?: boolean;
		pivot?: boolean;
		integrated_speakers?: boolean;
		touch?: boolean;
	};
	os?: {
		name?: string;
		version?: string;
		license?: {
			type?: string;
			activated?: boolean;
		};
		can_upgrade_edition?: boolean;
	};
	connectivity?: {
		wifi?: string;
		bluetooth?: string;
		ethernet?: string;
		power_input?: string;
		signal_inputs?: string[];
	};
	camera?: {
		present?: boolean;
		resolution_mp?: number;
	};
	audio?: {
		speakers?: boolean;
		microphone?: boolean;
	};
	keyboard?: {
		layout?: string;
		backlit?: boolean;
	};
	packaging?: {
		charger_included?: boolean;
		charger_type?: string;
	};
	notes?: {
		functional?: string;
		cosmetic?: string;
		defects?: string | null;
	};
}

const DynamicAttributesEditor: React.FC = () => {
	const { values, setFieldValue } = useFormikContext<ProductDetailForm>();
	const [attributes, setAttributes] = useState<AttributesData>({});

	// Cargar atributos existentes
	useEffect(() => {
		if (values.attributes_json) {
			try {
				const parsedAttributes =
					typeof values.attributes_json === 'string'
						? JSON.parse(values.attributes_json)
						: values.attributes_json;
				setAttributes(parsedAttributes || {});
			} catch (error) {
				console.error('Error parsing attributes_json:', error);
				setAttributes({});
			}
		}
	}, [values.attributes_json]);

	// Actualizar FormikValues cuando cambian los atributos
	useEffect(() => {
		setFieldValue('attributes_json', attributes);
	}, [attributes, setFieldValue]);

	const updateAttribute = (path: string, value: any) => {
		setAttributes((prev) => {
			const newAttributes = { ...prev };
			const keys = path.split('.');
			let current: any = newAttributes;

			for (let i = 0; i < keys.length - 1; i++) {
				if (!current[keys[i]]) {
					current[keys[i]] = {};
				}
				current = current[keys[i]];
			}

			current[keys[keys.length - 1]] = value;
			return newAttributes;
		});
	};

	// Obtener el tipo de producto del formulario principal para determinar qué campos mostrar
	const productType = values.product_type || 'general';
	const currentProductKind = attributes.product_kind || getDefaultProductKind(productType);
	const currentCpuBrand = attributes.cpu?.brand || '';

	// Función para mapear product_type a product_kind
	function getDefaultProductKind(productType: string): string {
		switch (productType) {
			case 'computador_reacondicionado':
				return 'desktop_pc';
			case 'notebook_reacondicionado':
				return 'notebook';
			case 'aio_reacondicionado':
				return 'aio';
			case 'monitor_reacondicionado':
				return 'monitor';
			default:
				return 'desktop_pc';
		}
	}

	// Actualizar product_kind automáticamente cuando cambie el product_type
	useEffect(() => {
		const newProductKind = getDefaultProductKind(productType);
		if (attributes.product_kind !== newProductKind) {
			updateAttribute('product_kind', newProductKind);
		}
	}, [productType, attributes.product_kind]);

	const shouldShowField = (productKind: string, fieldName: string): boolean => {
		const fieldsToHide: Record<string, string[]> = {
			desktop_pc: [
				'cpu.cores',
				'cpu.threads',
				'cpu.base_clock_mhz',
				'cpu.boost_clock_mhz',
				'gpu.model',
				'gpu.vram_gb',
				'os.license.type',
				'os.license.activated',
				'audio',
				'notes',
				'display',
				'camera',
				'keyboard',
			],
			notebook: [
				'cpu.cores',
				'cpu.threads',
				'cpu.base_clock_mhz',
				'cpu.boost_clock_mhz',
				'gpu.model',
				'gpu.vram_gb',
				'os.license.type',
				'os.license.activated',
				'display.panel',
				'display.refresh_hz',
				'camera',
				'audio',
				'keyboard',
				'notes',
			],
			aio: [
				'cpu.cores',
				'cpu.threads',
				'cpu.base_clock_mhz',
				'cpu.boost_clock_mhz',
				'gpu.model',
				'gpu.vram_gb',
				'os.license.type',
				'os.license.activated',
				'display.panel',
				'display.refresh_hz',
				'camera',
				'audio',
				'keyboard',
				'notes',
			],
			monitor: [
				'cpu',
				'ram',
				'storage',
				'gpu',
				'os',
				'camera',
				'audio',
				'keyboard',
				'display.response_time_ms',
				'display.aspect_ratio',
				'display.brightness_nits',
				'connectivity.wifi',
				'connectivity.bluetooth',
				'connectivity.ethernet',
			],
		};

		return !fieldsToHide[productKind]?.includes(fieldName);
	};

	return (
		<div className='space-y-6'>
			{/* Configuración básica */}
			<div className='rounded-lg border p-4'>
				<h4 className='mb-4 text-sm font-medium'>Configuración básica</h4>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Tipo de producto</label>
						<Select
							name='product_kind'
							value={attributes.product_kind || ''}
							onChange={(e: ChangeEvent<HTMLSelectElement>) =>
								updateAttribute('product_kind', e.target.value)
							}>
							<option value=''>Seleccionar tipo</option>
							{PRODUCT_DEVICE_TYPES.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>

					<div className='space-y-1'>
						<label className='text-sm font-medium'>Grado de categoría</label>
						<Select
							name='category_grade'
							value={attributes.category_grade || ''}
							onChange={(e: ChangeEvent<HTMLSelectElement>) =>
								updateAttribute('category_grade', e.target.value)
							}>
							<option value=''>Seleccionar grado</option>
							{CATEGORY_GRADES.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>
				</div>
			</div>

			{/* CPU */}
			{shouldShowField(currentProductKind, 'cpu') && (
				<div className='rounded-lg border p-4'>
					<h4 className='mb-4 text-sm font-medium'>Procesador (CPU)</h4>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
						<div className='space-y-1'>
							<label className='text-sm font-medium'>Marca</label>
							<Select
								name='cpu_brand'
								value={attributes.cpu?.brand || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('cpu.brand', e.target.value)
								}>
								<option value=''>Seleccionar marca</option>
								{CPU_BRANDS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						{currentCpuBrand && (
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Familia</label>
								<Select
									name='cpu_family'
									value={attributes.cpu?.family || ''}
									onChange={(e: ChangeEvent<HTMLSelectElement>) =>
										updateAttribute('cpu.family', e.target.value)
									}>
									<option value=''>Seleccionar familia</option>
									{CPU_FAMILIES[
										currentCpuBrand as keyof typeof CPU_FAMILIES
									]?.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</Select>
							</div>
						)}

						{currentCpuBrand && (
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Generación</label>
								<Select
									name='cpu_generation'
									value={attributes.cpu?.generation || ''}
									onChange={(e: ChangeEvent<HTMLSelectElement>) =>
										updateAttribute('cpu.generation', e.target.value)
									}>
									<option value=''>Seleccionar generación</option>
									{CPU_GENERATIONS[
										currentCpuBrand as keyof typeof CPU_GENERATIONS
									]?.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</Select>
							</div>
						)}

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Modelo</label>
							<Input
								name='cpu_model'
								placeholder='Ej: i5-8500'
								value={attributes.cpu?.model || ''}
								onChange={(e: ChangeEvent<HTMLInputElement>) =>
									updateAttribute('cpu.model', e.target.value)
								}
							/>
						</div>

						{!shouldShowField(currentProductKind, 'cpu.cores') ? null : (
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Núcleos</label>
								<Input
									name='cpu_cores'
									type='number'
									placeholder='Ej: 6'
									value={attributes.cpu?.cores || ''}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute('cpu.cores', Number(e.target.value))
									}
								/>
							</div>
						)}

						{!shouldShowField(currentProductKind, 'cpu.threads') ? null : (
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Hilos</label>
								<Input
									name='cpu_threads'
									type='number'
									placeholder='Ej: 6'
									value={attributes.cpu?.threads || ''}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute('cpu.threads', Number(e.target.value))
									}
								/>
							</div>
						)}

						{!shouldShowField(currentProductKind, 'cpu.base_clock_mhz') ? null : (
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Frecuencia base (MHz)</label>
								<Input
									name='cpu_base_clock_mhz'
									type='number'
									placeholder='Ej: 3200'
									value={attributes.cpu?.base_clock_mhz || ''}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute(
											'cpu.base_clock_mhz',
											Number(e.target.value),
										)
									}
								/>
							</div>
						)}

						{!shouldShowField(currentProductKind, 'cpu.boost_clock_mhz') ? null : (
							<div className='space-y-1'>
								<label className='text-sm font-medium'>
									Frecuencia turbo (MHz)
								</label>
								<Input
									name='cpu_boost_clock_mhz'
									type='number'
									placeholder='Ej: 4100'
									value={attributes.cpu?.boost_clock_mhz || ''}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute(
											'cpu.boost_clock_mhz',
											Number(e.target.value),
										)
									}
								/>
							</div>
						)}
					</div>
				</div>
			)}

			{/* RAM */}
			{shouldShowField(currentProductKind, 'ram') && (
				<div className='rounded-lg border p-4'>
					<h4 className='mb-4 text-sm font-medium'>Memoria RAM</h4>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
						<div className='space-y-1'>
							<label className='text-sm font-medium'>Tipo</label>
							<Select
								name='ram_type'
								value={attributes.ram?.type || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('ram.type', e.target.value)
								}>
								<option value=''>Seleccionar tipo</option>
								{RAM_TYPES.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Capacidad</label>
							<Select
								name='ram_capacity'
								value={attributes.ram?.capacity_gb || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('ram.capacity_gb', Number(e.target.value))
								}>
								<option value=''>Seleccionar capacidad</option>
								{RAM_CAPACITIES.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Módulos</label>
							<Select
								name='ram_modules'
								value={attributes.ram?.modules || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('ram.modules', Number(e.target.value))
								}>
								<option value=''>Seleccionar módulos</option>
								{RAM_MODULES.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Canal</label>
							<Select
								name='ram_channel'
								value={attributes.ram?.channel || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('ram.channel', e.target.value)
								}>
								<option value=''>Seleccionar canal</option>
								{RAM_CHANNELS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Máximo soportado (GB)</label>
							<Select
								name='ram_max_supported'
								value={attributes.ram?.max_supported_gb || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('ram.max_supported_gb', Number(e.target.value))
								}>
								<option value=''>Seleccionar máximo</option>
								{RAM_CAPACITIES.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						<div className='space-y-1'>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={attributes.ram?.upgradable || false}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute('ram.upgradable', e.target.checked)
									}
									className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-sm font-medium'>Actualizable</span>
							</label>
						</div>
					</div>
				</div>
			)}

			{/* Storage */}
			{shouldShowField(currentProductKind, 'storage') && (
				<div className='rounded-lg border p-4'>
					<h4 className='mb-4 text-sm font-medium'>Almacenamiento</h4>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div className='space-y-1'>
							<label className='text-sm font-medium'>Configuración</label>
							<Select
								name='storage_config'
								value={attributes.storage?.config || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('storage.config', e.target.value)
								}>
								<option value=''>Seleccionar configuración</option>
								{STORAGE_CONFIGS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						<div className='space-y-1'>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={attributes.storage?.upgradable || false}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute('storage.upgradable', e.target.checked)
									}
									className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-sm font-medium'>Actualizable</span>
							</label>
						</div>

						{attributes.storage?.upgradable && (
							<>
								<div className='space-y-1'>
									<label className='text-sm font-medium'>
										Máximo soportado (GB)
									</label>
									<Input
										name='storage_max_supported_gb'
										type='number'
										placeholder='Ej: 2000'
										value={attributes.storage?.max_supported_gb || ''}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											updateAttribute(
												'storage.max_supported_gb',
												Number(e.target.value),
											)
										}
									/>
								</div>

								<div className='space-y-1'>
									<label className='text-sm font-medium'>
										Slots M.2 disponibles
									</label>
									<Input
										name='storage_available_slots_m2'
										type='number'
										placeholder='Ej: 1'
										value={attributes.storage?.available_slots?.m2 || ''}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											updateAttribute(
												'storage.available_slots.m2',
												Number(e.target.value),
											)
										}
									/>
								</div>

								<div className='space-y-1'>
									<label className='text-sm font-medium'>
										Slots SATA disponibles
									</label>
									<Input
										name='storage_available_slots_sata'
										type='number'
										placeholder='Ej: 2'
										value={attributes.storage?.available_slots?.sata || ''}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											updateAttribute(
												'storage.available_slots.sata',
												Number(e.target.value),
											)
										}
									/>
								</div>
							</>
						)}
					</div>

					{/* Almacenamiento primario */}
					<div className='mt-4'>
						<h5 className='mb-2 text-sm font-medium'>Almacenamiento primario</h5>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Tipo</label>
								<Select
									name='storage_primary_type'
									value={attributes.storage?.primary?.type || ''}
									onChange={(e: ChangeEvent<HTMLSelectElement>) =>
										updateAttribute('storage.primary.type', e.target.value)
									}>
									<option value=''>Seleccionar tipo</option>
									{STORAGE_TYPES.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</Select>
							</div>

							<div className='space-y-1'>
								<label className='text-sm font-medium'>Capacidad</label>
								<Select
									name='storage_primary_capacity'
									value={attributes.storage?.primary?.capacity_gb || ''}
									onChange={(e: ChangeEvent<HTMLSelectElement>) =>
										updateAttribute(
											'storage.primary.capacity_gb',
											Number(e.target.value),
										)
									}>
									<option value=''>Seleccionar capacidad</option>
									{STORAGE_CAPACITIES.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</Select>
							</div>
						</div>
					</div>

					{/* Almacenamiento secundario (solo si es híbrido) */}
					{attributes.storage?.config === 'hybrid' && (
						<div className='mt-4'>
							<h5 className='mb-2 text-sm font-medium'>Almacenamiento secundario</h5>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div className='space-y-1'>
									<label className='text-sm font-medium'>Tipo</label>
									<Select
										name='storage_secondary_type'
										value={attributes.storage?.secondary?.type || ''}
										onChange={(e: ChangeEvent<HTMLSelectElement>) =>
											updateAttribute(
												'storage.secondary.type',
												e.target.value,
											)
										}>
										<option value=''>Seleccionar tipo</option>
										{STORAGE_TYPES.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</Select>
								</div>

								<div className='space-y-1'>
									<label className='text-sm font-medium'>Capacidad</label>
									<Select
										name='storage_secondary_capacity'
										value={attributes.storage?.secondary?.capacity_gb || ''}
										onChange={(e: ChangeEvent<HTMLSelectElement>) =>
											updateAttribute(
												'storage.secondary.capacity_gb',
												Number(e.target.value),
											)
										}>
										<option value=''>Seleccionar capacidad</option>
										{STORAGE_CAPACITIES.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</Select>
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* GPU */}
			{shouldShowField(currentProductKind, 'gpu') && (
				<div className='rounded-lg border p-4'>
					<h4 className='mb-4 text-sm font-medium'>Tarjeta gráfica (GPU)</h4>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div className='space-y-1'>
							<label className='text-sm font-medium'>Tipo</label>
							<Select
								name='gpu_type'
								value={attributes.gpu?.type || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('gpu.type', e.target.value)
								}>
								<option value=''>Seleccionar tipo</option>
								{GPU_TYPES.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Modelo</label>
							<Input
								name='gpu_model'
								placeholder='Ej: Intel UHD Graphics 630'
								value={attributes.gpu?.model || ''}
								onChange={(e: ChangeEvent<HTMLInputElement>) =>
									updateAttribute('gpu.model', e.target.value)
								}
							/>
						</div>

						{!shouldShowField(currentProductKind, 'gpu.vram_gb') ? null : (
							<div className='space-y-1'>
								<label className='text-sm font-medium'>VRAM (GB)</label>
								<Input
									name='gpu_vram_gb'
									type='number'
									placeholder='Ej: 4'
									value={attributes.gpu?.vram_gb || ''}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute('gpu.vram_gb', Number(e.target.value))
									}
								/>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Display - Solo para notebook, AIO y monitor */}
			{shouldShowField(currentProductKind, 'display') && (
				<div className='rounded-lg border p-4'>
					<h4 className='mb-4 text-sm font-medium'>Pantalla</h4>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
						<div className='space-y-1'>
							<label className='text-sm font-medium'>Tamaño (pulgadas)</label>
							<Select
								name='display_size'
								value={attributes.display?.size_inches || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('display.size_inches', Number(e.target.value))
								}>
								<option value=''>Seleccionar tamaño</option>
								{DISPLAY_SIZES.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Resolución</label>
							<Select
								name='display_resolution'
								value={attributes.display?.resolution || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('display.resolution', e.target.value)
								}>
								<option value=''>Seleccionar resolución</option>
								{DISPLAY_RESOLUTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Panel</label>
							<Select
								name='display_panel'
								value={attributes.display?.panel || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('display.panel', e.target.value)
								}>
								<option value=''>Seleccionar panel</option>
								{DISPLAY_PANELS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Frecuencia de refresco</label>
							<Select
								name='display_refresh'
								value={attributes.display?.refresh_hz || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('display.refresh_hz', Number(e.target.value))
								}>
								<option value=''>Seleccionar frecuencia</option>
								{DISPLAY_REFRESH_RATES.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						{(currentProductKind === 'notebook' || currentProductKind === 'aio') && (
							<div className='space-y-1'>
								<label className='flex items-center gap-2'>
									<input
										type='checkbox'
										checked={attributes.display?.touch || false}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											updateAttribute('display.touch', e.target.checked)
										}
										className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
									/>
									<span className='text-sm font-medium'>Pantalla táctil</span>
								</label>
							</div>
						)}

						{currentProductKind === 'monitor' && (
							<>
								<div className='space-y-1'>
									<label className='flex items-center gap-2'>
										<input
											type='checkbox'
											checked={attributes.display?.adjustable_stand || false}
											onChange={(e: ChangeEvent<HTMLInputElement>) =>
												updateAttribute(
													'display.adjustable_stand',
													e.target.checked,
												)
											}
											className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
										/>
										<span className='text-sm font-medium'>
											Soporte ajustable
										</span>
									</label>
								</div>

								<div className='space-y-1'>
									<label className='flex items-center gap-2'>
										<input
											type='checkbox'
											checked={attributes.display?.pivot || false}
											onChange={(e: ChangeEvent<HTMLInputElement>) =>
												updateAttribute('display.pivot', e.target.checked)
											}
											className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
										/>
										<span className='text-sm font-medium'>
											Rotación (Pivot)
										</span>
									</label>
								</div>

								<div className='space-y-1'>
									<label className='flex items-center gap-2'>
										<input
											type='checkbox'
											checked={
												attributes.display?.integrated_speakers || false
											}
											onChange={(e: ChangeEvent<HTMLInputElement>) =>
												updateAttribute(
													'display.integrated_speakers',
													e.target.checked,
												)
											}
											className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
										/>
										<span className='text-sm font-medium'>
											Altavoces integrados
										</span>
									</label>
								</div>
							</>
						)}
					</div>
				</div>
			)}

			{/* Sistema operativo */}
			{shouldShowField(currentProductKind, 'os') && (
				<div className='rounded-lg border p-4'>
					<h4 className='mb-4 text-sm font-medium'>Sistema operativo</h4>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
						<div className='space-y-1'>
							<label className='text-sm font-medium'>Sistema</label>
							<Select
								name='os_name'
								value={attributes.os?.name || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('os.name', e.target.value)
								}>
								<option value=''>Seleccionar sistema</option>
								{OS_NAMES.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						{attributes.os?.name === 'Windows' && (
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Versión</label>
								<Select
									name='os_version'
									value={attributes.os?.version || ''}
									onChange={(e: ChangeEvent<HTMLSelectElement>) =>
										updateAttribute('os.version', e.target.value)
									}>
									<option value=''>Seleccionar versión</option>
									{OS_VERSIONS.Windows.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</Select>
							</div>
						)}

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Tipo de licencia</label>
							<Select
								name='os_license_type'
								value={attributes.os?.license?.type || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('os.license.type', e.target.value)
								}>
								<option value=''>Seleccionar licencia</option>
								{LICENSE_TYPES.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						<div className='space-y-1'>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={attributes.os?.license?.activated || false}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute('os.license.activated', e.target.checked)
									}
									className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-sm font-medium'>Licencia activada</span>
							</label>
						</div>

						<div className='space-y-1'>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={attributes.os?.can_upgrade_edition || false}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute('os.can_upgrade_edition', e.target.checked)
									}
									className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-sm font-medium'>
									Puede actualizar edición
								</span>
							</label>
						</div>
					</div>
				</div>
			)}

			{/* Conectividad */}
			{shouldShowField(currentProductKind, 'connectivity') && (
				<div className='rounded-lg border p-4'>
					<h4 className='mb-4 text-sm font-medium'>Conectividad</h4>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
						<div className='space-y-1'>
							<label className='text-sm font-medium'>Wi-Fi</label>
							<Select
								name='connectivity_wifi'
								value={attributes.connectivity?.wifi || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('connectivity.wifi', e.target.value)
								}>
								<option value=''>Seleccionar Wi-Fi</option>
								{WIFI_STANDARDS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Bluetooth</label>
							<Select
								name='connectivity_bluetooth'
								value={attributes.connectivity?.bluetooth || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('connectivity.bluetooth', e.target.value)
								}>
								<option value=''>Seleccionar Bluetooth</option>
								{BLUETOOTH_VERSIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Ethernet</label>
							<Select
								name='connectivity_ethernet'
								value={attributes.connectivity?.ethernet || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('connectivity.ethernet', e.target.value)
								}>
								<option value=''>Seleccionar Ethernet</option>
								{ETHERNET_SPEEDS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						{currentProductKind === 'monitor' && (
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Entrada de corriente</label>
								<Input
									name='connectivity_power_input'
									placeholder='Ej: 100-240V AC'
									value={attributes.connectivity?.power_input || ''}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute('connectivity.power_input', e.target.value)
									}
								/>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Packaging */}
			{shouldShowField(currentProductKind, 'packaging') && (
				<div className='rounded-lg border p-4'>
					<h4 className='mb-4 text-sm font-medium'>Empaquetado</h4>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div className='space-y-1'>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={attributes.packaging?.charger_included || false}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute(
											'packaging.charger_included',
											e.target.checked,
										)
									}
									className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-sm font-medium'>Cargador incluido</span>
							</label>
						</div>

						{attributes.packaging?.charger_included && (
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Tipo de cargador</label>
								<Select
									name='packaging_charger_type'
									value={attributes.packaging?.charger_type || ''}
									onChange={(e: ChangeEvent<HTMLSelectElement>) =>
										updateAttribute('packaging.charger_type', e.target.value)
									}>
									<option value=''>Seleccionar tipo</option>
									{CHARGER_TYPES.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</Select>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Camera - Solo para notebook y AIO */}
			{shouldShowField(currentProductKind, 'camera') && (
				<div className='rounded-lg border p-4'>
					<h4 className='mb-4 text-sm font-medium'>Cámara</h4>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div className='space-y-1'>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={attributes.camera?.present || false}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute('camera.present', e.target.checked)
									}
									className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-sm font-medium'>Cámara presente</span>
							</label>
						</div>

						{attributes.camera?.present && (
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Resolución (MP)</label>
								<Select
									name='camera_resolution_mp'
									value={attributes.camera?.resolution_mp || ''}
									onChange={(e: ChangeEvent<HTMLSelectElement>) =>
										updateAttribute(
											'camera.resolution_mp',
											Number(e.target.value),
										)
									}>
									<option value=''>Seleccionar resolución</option>
									<option value='0.3'>0.3 MP</option>
									<option value='0.9'>0.9 MP</option>
									<option value='1'>1 MP</option>
									<option value='2'>2 MP</option>
									<option value='5'>5 MP</option>
									<option value='8'>8 MP</option>
								</Select>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Audio - Solo para notebook y AIO */}
			{shouldShowField(currentProductKind, 'audio') && (
				<div className='rounded-lg border p-4'>
					<h4 className='mb-4 text-sm font-medium'>Audio</h4>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div className='space-y-1'>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={attributes.audio?.speakers || false}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute('audio.speakers', e.target.checked)
									}
									className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-sm font-medium'>Altavoces integrados</span>
							</label>
						</div>

						<div className='space-y-1'>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={attributes.audio?.microphone || false}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute('audio.microphone', e.target.checked)
									}
									className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-sm font-medium'>Micrófono integrado</span>
							</label>
						</div>
					</div>
				</div>
			)}

			{/* Keyboard - Solo para notebook */}
			{shouldShowField(currentProductKind, 'keyboard') && (
				<div className='rounded-lg border p-4'>
					<h4 className='mb-4 text-sm font-medium'>Teclado</h4>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div className='space-y-1'>
							<label className='text-sm font-medium'>Distribución</label>
							<Select
								name='keyboard_layout'
								value={attributes.keyboard?.layout || ''}
								onChange={(e: ChangeEvent<HTMLSelectElement>) =>
									updateAttribute('keyboard.layout', e.target.value)
								}>
								<option value=''>Seleccionar distribución</option>
								{KEYBOARD_LAYOUTS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>

						<div className='space-y-1'>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={attributes.keyboard?.backlit || false}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute('keyboard.backlit', e.target.checked)
									}
									className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-sm font-medium'>Retroiluminación</span>
							</label>
						</div>
					</div>
				</div>
			)}

			{/* Monitor specific fields */}
			{currentProductKind === 'monitor' && (
				<div className='rounded-lg border p-4'>
					<h4 className='mb-4 text-sm font-medium'>
						Características específicas del monitor
					</h4>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
						<div className='space-y-1'>
							<label className='text-sm font-medium'>Conectores disponibles</label>
							<div className='space-y-2'>
								{MONITOR_CONNECTORS.map((connector) => (
									<label
										key={connector.value}
										className='flex items-center gap-2'>
										<input
											type='checkbox'
											checked={
												attributes.connectivity?.signal_inputs?.includes(
													connector.value,
												) || false
											}
											onChange={(e: ChangeEvent<HTMLInputElement>) => {
												const currentInputs =
													attributes.connectivity?.signal_inputs || [];
												let newInputs;
												if (e.target.checked) {
													newInputs = [...currentInputs, connector.value];
												} else {
													newInputs = currentInputs.filter(
														(input) => input !== connector.value,
													);
												}
												updateAttribute(
													'connectivity.signal_inputs',
													newInputs,
												);
											}}
											className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
										/>
										<span className='text-sm'>{connector.label}</span>
									</label>
								))}
							</div>
						</div>

						{!shouldShowField(currentProductKind, 'display.response_time_ms') ? null : (
							<div className='space-y-1'>
								<label className='text-sm font-medium'>
									Tiempo de respuesta (ms)
								</label>
								<Input
									name='display_response_time_ms'
									type='number'
									placeholder='Ej: 1'
									value={attributes.display?.response_time_ms || ''}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute(
											'display.response_time_ms',
											Number(e.target.value),
										)
									}
								/>
							</div>
						)}

						{!shouldShowField(currentProductKind, 'display.brightness_nits') ? null : (
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Brillo (nits)</label>
								<Input
									name='display_brightness_nits'
									type='number'
									placeholder='Ej: 300'
									value={attributes.display?.brightness_nits || ''}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateAttribute(
											'display.brightness_nits',
											Number(e.target.value),
										)
									}
								/>
							</div>
						)}

						{!shouldShowField(currentProductKind, 'display.aspect_ratio') ? null : (
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Relación de aspecto</label>
								<Select
									name='display_aspect_ratio'
									value={attributes.display?.aspect_ratio || ''}
									onChange={(e: ChangeEvent<HTMLSelectElement>) =>
										updateAttribute('display.aspect_ratio', e.target.value)
									}>
									<option value=''>Seleccionar aspecto</option>
									<option value='16:9'>16:9</option>
									<option value='16:10'>16:10</option>
									<option value='21:9'>21:9</option>
									<option value='32:9'>32:9</option>
									<option value='4:3'>4:3</option>
									<option value='5:4'>5:4</option>
								</Select>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Notes - Notas sobre el estado del equipo */}
			{shouldShowField(currentProductKind, 'notes') && (
				<div className='rounded-lg border p-4'>
					<h4 className='mb-4 text-sm font-medium'>Notas del estado</h4>
					<div className='grid grid-cols-1 gap-4'>
						<div className='space-y-1'>
							<label className='text-sm font-medium'>Estado funcional</label>
							<textarea
								name='notes_functional'
								placeholder='Descripción del estado funcional del equipo'
								value={attributes.notes?.functional || ''}
								onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
									updateAttribute('notes.functional', e.target.value)
								}
								className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
								rows={3}
							/>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Estado cosmético</label>
							<textarea
								name='notes_cosmetic'
								placeholder='Descripción del estado cosmético del equipo'
								value={attributes.notes?.cosmetic || ''}
								onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
									updateAttribute('notes.cosmetic', e.target.value)
								}
								className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
								rows={3}
							/>
						</div>

						<div className='space-y-1'>
							<label className='text-sm font-medium'>Defectos conocidos</label>
							<textarea
								name='notes_defects'
								placeholder='Descripción de defectos conocidos (opcional)'
								value={attributes.notes?.defects || ''}
								onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
									updateAttribute('notes.defects', e.target.value)
								}
								className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
								rows={3}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Vista previa del JSON */}
			<div className='rounded-lg border p-4'>
				<h4 className='mb-4 text-sm font-medium'>Vista previa del JSON</h4>
				<pre className='max-h-60 overflow-auto rounded border bg-gray-50 p-3 text-xs'>
					{JSON.stringify(attributes, null, 2)}
				</pre>
			</div>
		</div>
	);
};

export default DynamicAttributesEditor;
