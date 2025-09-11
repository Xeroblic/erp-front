/**
 * Modal de Creación/Edición de Productos
 * Sistema completo con campos condicionales por tipo de producto
 */
import React, { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import SelectReact from '@/components/form/SelectReact';
import Checkbox from '@/components/form/Checkbox';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import {
	IProduct,
	IProductFormData,
	ICreateProductRequest,
	ProductType,
	ProductCategory,
	ProductCondition,
} from '../../types/products.types';
import { createProductValidationSchema } from '../../validation/products.validation';
import { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';

interface CreateEditProductModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (productData: ICreateProductRequest) => Promise<void>;
	product?: IProduct | null;
	isLoading?: boolean;
}

const CreateEditProductModal: React.FC<CreateEditProductModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	product,
	isLoading = false,
}) => {
	const [selectedType, setSelectedType] = useState<ProductType>('GENERAL');
	const [previewImage, setPreviewImage] = useState<string>('');

	// Mock data - reemplazar con datos reales
	const productTypeOptions: TSelectOptions = [
		{ value: 'NOTEBOOK', label: 'Notebook/Laptop' },
		{ value: 'DESKTOP', label: 'PC Escritorio' },
		{ value: 'GENERAL', label: 'Producto General' },
	];

	const categoryOptions: TSelectOptions = [
		{ value: 'A', label: 'Categoría A - Alta rotación' },
		{ value: 'B', label: 'Categoría B - Media rotación' },
		{ value: 'C', label: 'Categoría C - Baja rotación' },
		{ value: 'M', label: 'Categoría M - Especializada' },
	];

	const conditionOptions: TSelectOptions = [
		{ value: 'NEW', label: 'Nuevo' },
		{ value: 'USED', label: 'Usado' },
		{ value: 'REFURBISHED', label: 'Reacondicionado' },
		{ value: 'DAMAGED', label: 'Dañado' },
	];

	const brandOptions: TSelectOptions = [
		{ value: '', label: 'Seleccionar marca...' },
		{ value: '1', label: 'ASUS' },
		{ value: '2', label: 'HP' },
		{ value: '3', label: 'Dell' },
		{ value: '4', label: 'Lenovo' },
		{ value: '5', label: 'Acer' },
		{ value: '6', label: 'MSI' },
		{ value: '7', label: 'Apple' },
		{ value: '8', label: 'Samsung' },
		{ value: '9', label: 'LG' },
		{ value: '10', label: 'Otro' },
	];

	const supplierOptions: TSelectOptions = [
		{ value: '', label: 'Seleccionar proveedor...' },
		{ value: '1', label: 'TechnoPlus S.A.S.' },
		{ value: '2', label: 'Distribuciones IT Ltda.' },
		{ value: '3', label: 'GlobalTech Colombia' },
		{ value: '4', label: 'Sistemas y Equipos S.A.' },
		{ value: '5', label: 'InnoTech Solutions' },
	];

	const warehouseOptions: TSelectOptions = [
		{ value: '1', label: 'Almacén Central - Bogotá' },
		{ value: '2', label: 'Sucursal Norte - Medellín' },
		{ value: '3', label: 'Sucursal Sur - Cali' },
		{ value: '4', label: 'Sucursal Oriente - Bucaramanga' },
	];

	// Valores iniciales del formulario
	const getInitialValues = (): IProductFormData => {
		if (product) {
			return {
				// Campos básicos
				sku: product.sku,
				name: product.name,
				description: product.description || '',
				type: product.type,
				category: product.category,
				brand_id: product.brand_id?.toString() || '',
				supplier_id: product.supplier_id?.toString() || '',
				warehouse_id: product.warehouse_id.toString(),
				location: product.location || '',
				unit_price: product.unit_price.toString(),
				cost_price: product.cost_price.toString(),
				min_stock: product.min_stock.toString(),
				max_stock: product.max_stock?.toString() || '',
				warranty_months: product.warranty_months?.toString() || '',
				condition: product.condition,
				weight: product.weight?.toString() || '',
				dimensions: product.dimensions || '',
				barcode: product.barcode || '',
				serial_tracking: product.serial_tracking,
				batch_tracking: product.batch_tracking,
				image_url: product.image_url || '',
				tags: product.tags?.join(', ') || '',

				// Especificaciones específicas
				notebook_specs: product.notebook_specs || {
					processor: '',
					ram: '',
					storage: '',
					screen_size: '',
					graphics_card: '',
					operating_system: '',
					battery_life: '',
					weight_kg: 0,
					color: '',
					keyboard_layout: '',
					touchscreen: false,
					webcam: false,
					wifi_standard: '',
					bluetooth_version: '',
					usb_ports: 0,
					hdmi_ports: 0,
					sd_card_slot: false,
				},
				desktop_specs: product.desktop_specs || {
					processor: '',
					ram: '',
					storage: '',
					graphics_card: '',
					motherboard: '',
					power_supply: '',
					case_type: '',
					operating_system: '',
					optical_drive: false,
					wifi_included: false,
					bluetooth_included: false,
					usb_ports: 0,
					audio_ports: 0,
					ethernet_ports: 0,
					expansion_slots: 0,
				},
				general_specs: product.general_specs || {
					material: '',
					color: '',
					size: '',
					compatibility: '',
					power_consumption: '',
					operating_temperature: '',
					certifications: '',
					included_accessories: [],
				},
			};
		}

		return {
			// Valores por defecto para nuevo producto
			sku: '',
			name: '',
			description: '',
			type: 'GENERAL',
			category: 'A',
			brand_id: '',
			supplier_id: '',
			warehouse_id: '1',
			location: '',
			unit_price: '',
			cost_price: '',
			min_stock: '1',
			max_stock: '',
			warranty_months: '',
			condition: 'NEW',
			weight: '',
			dimensions: '',
			barcode: '',
			serial_tracking: false,
			batch_tracking: false,
			image_url: '',
			tags: '',

			notebook_specs: {
				processor: '',
				ram: '',
				storage: '',
				screen_size: '',
				graphics_card: '',
				operating_system: '',
				battery_life: '',
				weight_kg: 0,
				color: '',
				keyboard_layout: 'QWERTY',
				touchscreen: false,
				webcam: true,
				wifi_standard: 'Wi-Fi 6',
				bluetooth_version: '5.0',
				usb_ports: 2,
				hdmi_ports: 1,
				sd_card_slot: false,
			},
			desktop_specs: {
				processor: '',
				ram: '',
				storage: '',
				graphics_card: '',
				motherboard: '',
				power_supply: '',
				case_type: 'Tower',
				operating_system: '',
				optical_drive: false,
				wifi_included: false,
				bluetooth_included: false,
				usb_ports: 4,
				audio_ports: 2,
				ethernet_ports: 1,
				expansion_slots: 2,
			},
			general_specs: {
				material: '',
				color: '',
				size: '',
				compatibility: '',
				power_consumption: '',
				operating_temperature: '',
				certifications: '',
				included_accessories: [],
			},
		};
	};

	const initialValues = getInitialValues();

	useEffect(() => {
		if (isOpen) {
			setSelectedType(product?.type || 'GENERAL');
			setPreviewImage(product?.image_url || '');
		}
	}, [isOpen, product]);

	const handleSubmit = async (values: IProductFormData) => {
		try {
			const tags = values.tags
				? values.tags
						.split(',')
						.map((tag: string) => tag.trim())
						.filter((tag: string) => tag.length > 0)
				: [];

			const productData: ICreateProductRequest = {
				sku: values.sku,
				name: values.name,
				description: values.description || undefined,
				type: values.type,
				category: values.category,
				brand_id: values.brand_id ? parseInt(values.brand_id) : undefined,
				supplier_id: values.supplier_id ? parseInt(values.supplier_id) : undefined,
				warehouse_id: parseInt(values.warehouse_id),
				location: values.location || undefined,
				unit_price: parseFloat(values.unit_price),
				cost_price: parseFloat(values.cost_price),
				min_stock: parseInt(values.min_stock),
				max_stock: values.max_stock ? parseInt(values.max_stock) : undefined,
				warranty_months: values.warranty_months
					? parseInt(values.warranty_months)
					: undefined,
				condition: values.condition,
				weight: values.weight ? parseFloat(values.weight) : undefined,
				dimensions: values.dimensions || undefined,
				barcode: values.barcode || undefined,
				serial_tracking: values.serial_tracking,
				batch_tracking: values.batch_tracking,
				image_url: values.image_url || undefined,
				tags,
			};

			// Agregar especificaciones específicas según el tipo
			switch (values.type) {
				case 'NOTEBOOK':
					productData.notebook_specs = values.notebook_specs;
					break;
				case 'DESKTOP':
					productData.desktop_specs = values.desktop_specs;
					break;
				case 'GENERAL':
					productData.general_specs = values.general_specs;
					break;
			}
			await onSubmit(productData);
			onClose();
		} catch (error) {
			console.error('Error submitting product:', error);
		}
	};

	const renderTypeSpecificFields = (values: IProductFormData, setFieldValue: any) => {
		switch (selectedType) {
			case 'NOTEBOOK':
				return (
					<Card className='border-blue-200 bg-blue-50/30'>
						<CardHeader className='pb-3'>
							<CardTitle className='flex items-center text-blue-700'>
								<Icon icon='HeroComputerDesktop' className='mr-2 h-5 w-5' />
								Especificaciones de Notebook
							</CardTitle>
						</CardHeader>
						<CardBody className='space-y-4'>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<Input
									name='notebook_specs.processor'
									label='Procesador *'
									value={values.notebook_specs.processor}
									onChange={(e) =>
										setFieldValue('notebook_specs.processor', e.target.value)
									}
									placeholder='ej: Intel Core i7-12700H'
								/>
								<Input
									name='notebook_specs.ram'
									label='Memoria RAM *'
									value={values.notebook_specs.ram}
									onChange={(e) =>
										setFieldValue('notebook_specs.ram', e.target.value)
									}
									placeholder='ej: 16 GB DDR4'
								/>
								<Input
									name='notebook_specs.storage'
									label='Almacenamiento *'
									value={values.notebook_specs.storage}
									onChange={(e) =>
										setFieldValue('notebook_specs.storage', e.target.value)
									}
									placeholder='ej: 512 GB SSD NVMe'
								/>
								<Input
									name='notebook_specs.screen_size'
									label='Tamaño de Pantalla *'
									value={values.notebook_specs.screen_size}
									onChange={(e) =>
										setFieldValue('notebook_specs.screen_size', e.target.value)
									}
									placeholder='ej: 15.6"'
								/>
								<Input
									name='notebook_specs.graphics_card'
									label='Tarjeta Gráfica'
									value={values.notebook_specs.graphics_card || ''}
									onChange={(e) =>
										setFieldValue(
											'notebook_specs.graphics_card',
											e.target.value,
										)
									}
									placeholder='ej: NVIDIA RTX 3060'
								/>
								<Input
									name='notebook_specs.operating_system'
									label='Sistema Operativo'
									value={values.notebook_specs.operating_system || ''}
									onChange={(e) =>
										setFieldValue(
											'notebook_specs.operating_system',
											e.target.value,
										)
									}
									placeholder='ej: Windows 11 Pro'
								/>
								<Input
									name='notebook_specs.battery_life'
									label='Duración Batería'
									value={values.notebook_specs.battery_life || ''}
									onChange={(e) =>
										setFieldValue('notebook_specs.battery_life', e.target.value)
									}
									placeholder='ej: 8-10 horas'
								/>
								<Input
									type='number'
									name='notebook_specs.weight_kg'
									label='Peso (kg)'
									value={values.notebook_specs.weight_kg?.toString() || ''}
									onChange={(e) =>
										setFieldValue(
											'notebook_specs.weight_kg',
											parseFloat(e.target.value) || 0,
										)
									}
									placeholder='ej: 2.1'
									step='0.1'
								/>
								<Input
									name='notebook_specs.color'
									label='Color'
									value={values.notebook_specs.color || ''}
									onChange={(e) =>
										setFieldValue('notebook_specs.color', e.target.value)
									}
									placeholder='ej: Negro'
								/>
								<Input
									name='notebook_specs.keyboard_layout'
									label='Layout Teclado'
									value={values.notebook_specs.keyboard_layout || ''}
									onChange={(e) =>
										setFieldValue(
											'notebook_specs.keyboard_layout',
											e.target.value,
										)
									}
									placeholder='ej: QWERTY ES'
								/>
								<Input
									name='notebook_specs.wifi_standard'
									label='Estándar WiFi'
									value={values.notebook_specs.wifi_standard || ''}
									onChange={(e) =>
										setFieldValue(
											'notebook_specs.wifi_standard',
											e.target.value,
										)
									}
									placeholder='ej: Wi-Fi 6'
								/>
								<Input
									name='notebook_specs.bluetooth_version'
									label='Versión Bluetooth'
									value={values.notebook_specs.bluetooth_version || ''}
									onChange={(e) =>
										setFieldValue(
											'notebook_specs.bluetooth_version',
											e.target.value,
										)
									}
									placeholder='ej: 5.2'
								/>
								<Input
									type='number'
									name='notebook_specs.usb_ports'
									label='Puertos USB'
									value={values.notebook_specs.usb_ports?.toString() || ''}
									onChange={(e) =>
										setFieldValue(
											'notebook_specs.usb_ports',
											parseInt(e.target.value) || 0,
										)
									}
									min='0'
									max='10'
								/>
								<Input
									type='number'
									name='notebook_specs.hdmi_ports'
									label='Puertos HDMI'
									value={values.notebook_specs.hdmi_ports?.toString() || ''}
									onChange={(e) =>
										setFieldValue(
											'notebook_specs.hdmi_ports',
											parseInt(e.target.value) || 0,
										)
									}
									min='0'
									max='5'
								/>
							</div>

							<div className='flex flex-wrap gap-4'>
								<Checkbox
									name='notebook_specs.touchscreen'
									label='Pantalla Táctil'
									checked={values.notebook_specs.touchscreen || false}
									onChange={(e) =>
										setFieldValue(
											'notebook_specs.touchscreen',
											e.target.checked,
										)
									}
								/>
								<Checkbox
									name='notebook_specs.webcam'
									label='Cámara Web'
									checked={values.notebook_specs.webcam || false}
									onChange={(e) =>
										setFieldValue('notebook_specs.webcam', e.target.checked)
									}
								/>
								<Checkbox
									name='notebook_specs.sd_card_slot'
									label='Slot SD'
									checked={values.notebook_specs.sd_card_slot || false}
									onChange={(e) =>
										setFieldValue(
											'notebook_specs.sd_card_slot',
											e.target.checked,
										)
									}
								/>
							</div>
						</CardBody>
					</Card>
				);

			case 'DESKTOP':
				return (
					<Card className='border-green-200 bg-green-50/30'>
						<CardHeader className='pb-3'>
							<CardTitle className='flex items-center text-green-700'>
								<Icon icon='HeroComputerDesktop' className='mr-2 h-5 w-5' />
								Especificaciones de PC Escritorio
							</CardTitle>
						</CardHeader>
						<CardBody className='space-y-4'>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<Input
									name='desktop_specs.processor'
									label='Procesador *'
									value={values.desktop_specs.processor}
									onChange={(e) =>
										setFieldValue('desktop_specs.processor', e.target.value)
									}
									placeholder='ej: AMD Ryzen 7 5700X'
								/>
								<Input
									name='desktop_specs.ram'
									label='Memoria RAM *'
									value={values.desktop_specs.ram}
									onChange={(e) =>
										setFieldValue('desktop_specs.ram', e.target.value)
									}
									placeholder='ej: 32 GB DDR4'
								/>
								<Input
									name='desktop_specs.storage'
									label='Almacenamiento *'
									value={values.desktop_specs.storage}
									onChange={(e) =>
										setFieldValue('desktop_specs.storage', e.target.value)
									}
									placeholder='ej: 1TB SSD + 2TB HDD'
								/>
								<Input
									name='desktop_specs.graphics_card'
									label='Tarjeta Gráfica'
									value={values.desktop_specs.graphics_card || ''}
									onChange={(e) =>
										setFieldValue('desktop_specs.graphics_card', e.target.value)
									}
									placeholder='ej: NVIDIA RTX 4070'
								/>
								<Input
									name='desktop_specs.motherboard'
									label='Tarjeta Madre'
									value={values.desktop_specs.motherboard || ''}
									onChange={(e) =>
										setFieldValue('desktop_specs.motherboard', e.target.value)
									}
									placeholder='ej: ASUS B550-F Gaming'
								/>
								<Input
									name='desktop_specs.power_supply'
									label='Fuente de Poder'
									value={values.desktop_specs.power_supply || ''}
									onChange={(e) =>
										setFieldValue('desktop_specs.power_supply', e.target.value)
									}
									placeholder='ej: 650W 80+ Gold'
								/>
								<Input
									name='desktop_specs.case_type'
									label='Tipo de Case'
									value={values.desktop_specs.case_type || ''}
									onChange={(e) =>
										setFieldValue('desktop_specs.case_type', e.target.value)
									}
									placeholder='ej: Mid Tower'
								/>
								<Input
									name='desktop_specs.operating_system'
									label='Sistema Operativo'
									value={values.desktop_specs.operating_system || ''}
									onChange={(e) =>
										setFieldValue(
											'desktop_specs.operating_system',
											e.target.value,
										)
									}
									placeholder='ej: Windows 11 Pro'
								/>
								<Input
									type='number'
									name='desktop_specs.usb_ports'
									label='Puertos USB'
									value={values.desktop_specs.usb_ports?.toString() || ''}
									onChange={(e) =>
										setFieldValue(
											'desktop_specs.usb_ports',
											parseInt(e.target.value) || 0,
										)
									}
									min='0'
									max='20'
								/>
								<Input
									type='number'
									name='desktop_specs.audio_ports'
									label='Puertos Audio'
									value={values.desktop_specs.audio_ports?.toString() || ''}
									onChange={(e) =>
										setFieldValue(
											'desktop_specs.audio_ports',
											parseInt(e.target.value) || 0,
										)
									}
									min='0'
									max='10'
								/>
								<Input
									type='number'
									name='desktop_specs.ethernet_ports'
									label='Puertos Ethernet'
									value={values.desktop_specs.ethernet_ports?.toString() || ''}
									onChange={(e) =>
										setFieldValue(
											'desktop_specs.ethernet_ports',
											parseInt(e.target.value) || 0,
										)
									}
									min='0'
									max='5'
								/>
								<Input
									type='number'
									name='desktop_specs.expansion_slots'
									label='Slots Expansión'
									value={values.desktop_specs.expansion_slots?.toString() || ''}
									onChange={(e) =>
										setFieldValue(
											'desktop_specs.expansion_slots',
											parseInt(e.target.value) || 0,
										)
									}
									min='0'
									max='10'
								/>
							</div>

							<div className='flex flex-wrap gap-4'>
								<Checkbox
									name='desktop_specs.optical_drive'
									label='Unidad Óptica'
									checked={values.desktop_specs.optical_drive || false}
									onChange={(e) =>
										setFieldValue(
											'desktop_specs.optical_drive',
											e.target.checked,
										)
									}
								/>
								<Checkbox
									name='desktop_specs.wifi_included'
									label='WiFi Incluido'
									checked={values.desktop_specs.wifi_included || false}
									onChange={(e) =>
										setFieldValue(
											'desktop_specs.wifi_included',
											e.target.checked,
										)
									}
								/>
								<Checkbox
									name='desktop_specs.bluetooth_included'
									label='Bluetooth Incluido'
									checked={values.desktop_specs.bluetooth_included || false}
									onChange={(e) =>
										setFieldValue(
											'desktop_specs.bluetooth_included',
											e.target.checked,
										)
									}
								/>
							</div>
						</CardBody>
					</Card>
				);

			case 'GENERAL':
				return (
					<Card className='border-purple-200 bg-purple-50/30'>
						<CardHeader className='pb-3'>
							<CardTitle className='flex items-center text-purple-700'>
								<Icon icon='HeroCube' className='mr-2 h-5 w-5' />
								Especificaciones Generales
							</CardTitle>
						</CardHeader>
						<CardBody className='space-y-4'>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<Input
									name='general_specs.material'
									label='Material'
									value={values.general_specs.material || ''}
									onChange={(e) =>
										setFieldValue('general_specs.material', e.target.value)
									}
									placeholder='ej: Plástico ABS'
								/>
								<Input
									name='general_specs.color'
									label='Color'
									value={values.general_specs.color || ''}
									onChange={(e) =>
										setFieldValue('general_specs.color', e.target.value)
									}
									placeholder='ej: Negro'
								/>
								<Input
									name='general_specs.size'
									label='Tamaño'
									value={values.general_specs.size || ''}
									onChange={(e) =>
										setFieldValue('general_specs.size', e.target.value)
									}
									placeholder='ej: Mediano (M)'
								/>
								<Input
									name='general_specs.power_consumption'
									label='Consumo Energía'
									value={values.general_specs.power_consumption || ''}
									onChange={(e) =>
										setFieldValue(
											'general_specs.power_consumption',
											e.target.value,
										)
									}
									placeholder='ej: 65W'
								/>
								<Input
									name='general_specs.operating_temperature'
									label='Temperatura Operativa'
									value={values.general_specs.operating_temperature || ''}
									onChange={(e) =>
										setFieldValue(
											'general_specs.operating_temperature',
											e.target.value,
										)
									}
									placeholder='ej: 0°C - 40°C'
								/>
								<Input
									name='general_specs.certifications'
									label='Certificaciones'
									value={values.general_specs.certifications || ''}
									onChange={(e) =>
										setFieldValue(
											'general_specs.certifications',
											e.target.value,
										)
									}
									placeholder='ej: CE, FCC, RoHS'
								/>
							</div>

							<Textarea
								name='general_specs.compatibility'
								label='Compatibilidad'
								value={values.general_specs.compatibility || ''}
								onChange={(e) =>
									setFieldValue('general_specs.compatibility', e.target.value)
								}
								placeholder='Describe con qué equipos o sistemas es compatible...'
								rows={3}
							/>
						</CardBody>
					</Card>
				);

			default:
				return null;
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='5xl'>
			<ModalHeader className='border-b border-gray-200'>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
						<Icon icon='HeroCube' className='h-6 w-6 text-blue-600' />
					</div>
					<div>
						<h2 className='text-xl font-bold text-gray-900'>
							{product ? 'Editar Producto' : 'Nuevo Producto'}
						</h2>
						<p className='text-sm text-gray-600'>
							{product
								? 'Modifica la información del producto'
								: 'Registra un nuevo producto en el inventario'}
						</p>
					</div>
				</div>
			</ModalHeader>

			<Formik
				initialValues={initialValues}
				validationSchema={createProductValidationSchema(selectedType)}
				onSubmit={handleSubmit}
				enableReinitialize>
				{({ values, errors, touched, setFieldValue }) => (
					<Form>
						<ModalBody className='space-y-6'>
							{/* Información Básica */}
							<Card>
								<CardHeader className='pb-3'>
									<CardTitle className='flex items-center text-gray-700'>
										<Icon
											icon='HeroInformationCircle'
											className='mr-2 h-5 w-5'
										/>
										Información Básica
									</CardTitle>
								</CardHeader>
								<CardBody className='space-y-4'>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
										<Input
											name='sku'
											label='SKU *'
											value={values.sku}
											onChange={(e) =>
												setFieldValue('sku', e.target.value.toUpperCase())
											}
											placeholder='PROD-001'
											errorMessage={touched.sku ? errors.sku : ''}
										/>
										<SelectReact
											name='type'
											label='Tipo de Producto *'
											options={productTypeOptions}
											value={productTypeOptions.find(
												(option) => option.value === values.type,
											)}
											onChange={(selectedOption) => {
												const option = selectedOption as TSelectOption;
												const newType =
													(option?.value as ProductType) || 'GENERAL';
												setFieldValue('type', newType);
												setSelectedType(newType);
											}}
											errorMessage={touched.type ? errors.type : ''}
										/>
										<SelectReact
											name='category'
											label='Categoría *'
											options={categoryOptions}
											value={categoryOptions.find(
												(option) => option.value === values.category,
											)}
											onChange={(selectedOption) => {
												const option = selectedOption as TSelectOption;
												setFieldValue('category', option?.value || 'A');
											}}
											errorMessage={touched.category ? errors.category : ''}
										/>
									</div>

									<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										<Input
											name='name'
											label='Nombre del Producto *'
											value={values.name}
											onChange={(e) => setFieldValue('name', e.target.value)}
											placeholder='Nombre descriptivo del producto'
											errorMessage={touched.name ? errors.name : ''}
										/>
										<SelectReact
											name='condition'
											label='Condición *'
											options={conditionOptions}
											value={conditionOptions.find(
												(option) => option.value === values.condition,
											)}
											onChange={(selectedOption) => {
												const option = selectedOption as TSelectOption;
												setFieldValue('condition', option?.value || 'NEW');
											}}
											errorMessage={touched.condition ? errors.condition : ''}
										/>
									</div>

									<Textarea
										name='description'
										label='Descripción'
										value={values.description}
										onChange={(e) =>
											setFieldValue('description', e.target.value)
										}
										placeholder='Descripción detallada del producto...'
										rows={3}
										errorMessage={touched.description ? errors.description : ''}
									/>

									<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										<SelectReact
											name='brand_id'
											label={selectedType === 'GENERAL' ? 'Marca' : 'Marca *'}
											options={brandOptions}
											value={brandOptions.find(
												(option) => option.value === values.brand_id,
											)}
											onChange={(selectedOption) => {
												const option = selectedOption as TSelectOption;
												setFieldValue('brand_id', option?.value || '');
											}}
											errorMessage={touched.brand_id ? errors.brand_id : ''}
											isClearable
										/>
										<SelectReact
											name='supplier_id'
											label='Proveedor'
											options={supplierOptions}
											value={supplierOptions.find(
												(option) => option.value === values.supplier_id,
											)}
											onChange={(selectedOption) => {
												const option = selectedOption as TSelectOption;
												setFieldValue('supplier_id', option?.value || '');
											}}
											errorMessage={
												touched.supplier_id ? errors.supplier_id : ''
											}
											isClearable
										/>
									</div>
								</CardBody>
							</Card>

							{/* Ubicación e Inventario */}
							<Card>
								<CardHeader className='pb-3'>
									<CardTitle className='flex items-center text-gray-700'>
										<Icon icon='HeroMapPin' className='mr-2 h-5 w-5' />
										Ubicación e Inventario
									</CardTitle>
								</CardHeader>
								<CardBody className='space-y-4'>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										<SelectReact
											name='warehouse_id'
											label='Bodega *'
											options={warehouseOptions}
											value={warehouseOptions.find(
												(option) => option.value === values.warehouse_id,
											)}
											onChange={(selectedOption) => {
												const option = selectedOption as TSelectOption;
												setFieldValue('warehouse_id', option?.value || '1');
											}}
											errorMessage={
												touched.warehouse_id ? errors.warehouse_id : ''
											}
										/>
										<Input
											name='location'
											label='Ubicación Específica'
											value={values.location}
											onChange={(e) =>
												setFieldValue('location', e.target.value)
											}
											placeholder='ej: Estante A-3, Nivel 2'
											errorMessage={touched.location ? errors.location : ''}
										/>
									</div>

									<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
										<Input
											type='number'
											name='min_stock'
											label='Stock Mínimo *'
											value={values.min_stock}
											onChange={(e) =>
												setFieldValue('min_stock', e.target.value)
											}
											placeholder='1'
											min='0'
											errorMessage={touched.min_stock ? errors.min_stock : ''}
										/>
										<Input
											type='number'
											name='max_stock'
											label='Stock Máximo'
											value={values.max_stock}
											onChange={(e) =>
												setFieldValue('max_stock', e.target.value)
											}
											placeholder='100'
											min='1'
											errorMessage={touched.max_stock ? errors.max_stock : ''}
										/>
										<Input
											type='number'
											name='warranty_months'
											label='Garantía (meses)'
											value={values.warranty_months}
											onChange={(e) =>
												setFieldValue('warranty_months', e.target.value)
											}
											placeholder='12'
											min='0'
											errorMessage={
												touched.warranty_months
													? errors.warranty_months
													: ''
											}
										/>
									</div>

									<div className='flex space-x-6'>
										<Checkbox
											name='serial_tracking'
											label='Seguimiento por Serie'
											checked={values.serial_tracking}
											onChange={(e) =>
												setFieldValue('serial_tracking', e.target.checked)
											}
										/>
										<Checkbox
											name='batch_tracking'
											label='Seguimiento por Lote'
											checked={values.batch_tracking}
											onChange={(e) =>
												setFieldValue('batch_tracking', e.target.checked)
											}
										/>
									</div>
								</CardBody>
							</Card>

							{/* Precios y Costos */}
							<Card>
								<CardHeader className='pb-3'>
									<CardTitle className='flex items-center text-gray-700'>
										<Icon icon='HeroCurrencyDollar' className='mr-2 h-5 w-5' />
										Precios y Costos
									</CardTitle>
								</CardHeader>
								<CardBody className='space-y-4'>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										<Input
											type='number'
											name='cost_price'
											label='Precio de Costo *'
											value={values.cost_price}
											onChange={(e) =>
												setFieldValue('cost_price', e.target.value)
											}
											placeholder='0.00'
											step='0.01'
											min='0'
											errorMessage={
												touched.cost_price ? errors.cost_price : ''
											}
										/>
										<Input
											type='number'
											name='unit_price'
											label='Precio de Venta *'
											value={values.unit_price}
											onChange={(e) =>
												setFieldValue('unit_price', e.target.value)
											}
											placeholder='0.00'
											step='0.01'
											min='0'
											errorMessage={
												touched.unit_price ? errors.unit_price : ''
											}
										/>
									</div>

									{values.unit_price && values.cost_price && (
										<div className='rounded-lg bg-gray-50 p-4'>
											<div className='flex items-center justify-between text-sm'>
												<span className='font-medium text-gray-700'>
													Margen de Ganancia:
												</span>
												<Badge color='emerald'>
													{(
														((parseFloat(values.unit_price) -
															parseFloat(values.cost_price)) /
															parseFloat(values.cost_price)) *
														100
													).toFixed(1)}
													%
												</Badge>
											</div>
										</div>
									)}
								</CardBody>
							</Card>

							{/* Especificaciones por Tipo */}
							{renderTypeSpecificFields(values, setFieldValue)}

							{/* Información Adicional */}
							<Card>
								<CardHeader className='pb-3'>
									<CardTitle className='flex items-center text-gray-700'>
										<Icon icon='HeroPlus' className='mr-2 h-5 w-5' />
										Información Adicional
									</CardTitle>
								</CardHeader>
								<CardBody className='space-y-4'>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
										<Input
											name='barcode'
											label='Código de Barras'
											value={values.barcode}
											onChange={(e) =>
												setFieldValue('barcode', e.target.value)
											}
											placeholder='123456789012'
											errorMessage={touched.barcode ? errors.barcode : ''}
										/>
										<Input
											type='number'
											name='weight'
											label='Peso (kg)'
											value={values.weight}
											onChange={(e) =>
												setFieldValue('weight', e.target.value)
											}
											placeholder='0.5'
											step='0.1'
											min='0'
											errorMessage={touched.weight ? errors.weight : ''}
										/>
										<Input
											name='dimensions'
											label='Dimensiones'
											value={values.dimensions}
											onChange={(e) =>
												setFieldValue('dimensions', e.target.value)
											}
											placeholder='L x A x H (cm)'
											errorMessage={
												touched.dimensions ? errors.dimensions : ''
											}
										/>
									</div>

									<Input
										name='image_url'
										label='URL de Imagen'
										value={values.image_url}
										onChange={(e) => {
											setFieldValue('image_url', e.target.value);
											setPreviewImage(e.target.value);
										}}
										placeholder='https://ejemplo.com/imagen.jpg'
										errorMessage={touched.image_url ? errors.image_url : ''}
									/>

									{previewImage && (
										<div className='flex justify-center'>
											<img
												src={previewImage}
												alt='Vista previa'
												className='h-32 w-32 rounded-lg border border-gray-200 object-cover'
												onError={() => setPreviewImage('')}
											/>
										</div>
									)}

									<Input
										name='tags'
										label='Etiquetas'
										value={values.tags}
										onChange={(e) => setFieldValue('tags', e.target.value)}
										placeholder='etiqueta1, etiqueta2, etiqueta3'
										errorMessage={touched.tags ? errors.tags : ''}
									/>
									<p className='text-xs text-gray-500'>
										Separa las etiquetas con comas. Ejemplo: gaming, portátil,
										alta gama
									</p>
								</CardBody>
							</Card>
						</ModalBody>

						<ModalFooter className='border-t border-gray-200'>
							<div className='flex justify-end space-x-3'>
								<Button variant='outline' onClick={onClose} disabled={isLoading}>
									Cancelar
								</Button>
								<Button type='submit' color='blue' isLoading={isLoading}>
									{product ? 'Actualizar' : 'Crear'} Producto
								</Button>
							</div>
						</ModalFooter>
					</Form>
				)}
			</Formik>
		</Modal>
	);
};

export default CreateEditProductModal;
