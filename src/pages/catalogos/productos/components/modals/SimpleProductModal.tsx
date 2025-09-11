import React, { useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../../../../components/ui/Modal';
import Button from '../../../../../components/ui/Button';
import Icon from '../../../../../components/icon/Icon';
import { IProduct } from '../../types/products.types';

interface SimpleProductModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (productData: any) => Promise<void>;
	product: IProduct | null;
	isLoading?: boolean;
}

const SimpleProductModal: React.FC<SimpleProductModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	product,
	isLoading = false,
}) => {
	const [formData, setFormData] = useState({
		sku: product?.sku || '',
		name: product?.name || '',
		description: product?.description || '',
		type: product?.type || 'GENERAL',
		category: product?.category || 'A',
		unit_price: product?.unit_price?.toString() || '',
		cost_price: product?.cost_price?.toString() || '',
		min_stock: product?.min_stock?.toString() || '1',
		condition: product?.condition || 'NEW',
	});

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSubmit = async () => {
		try {
			await onSubmit({
				...formData,
				unit_price: parseFloat(formData.unit_price) || 0,
				cost_price: parseFloat(formData.cost_price) || 0,
				min_stock: parseInt(formData.min_stock) || 1,
				warehouse_id: 1, // Default warehouse
			});
		} catch (error) {
			console.error('Error submitting product:', error);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='2xl'>
			<ModalHeader>
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

			<ModalBody className='space-y-4'>
				{/* SKU */}
				<div>
					<label className='mb-1 block text-sm font-medium text-gray-700'>SKU *</label>
					<input
						type='text'
						value={formData.sku}
						onChange={(e) => handleInputChange('sku', e.target.value)}
						placeholder='PROD-001'
						className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
						required
					/>
				</div>

				{/* Nombre */}
				<div>
					<label className='mb-1 block text-sm font-medium text-gray-700'>
						Nombre del Producto *
					</label>
					<input
						type='text'
						value={formData.name}
						onChange={(e) => handleInputChange('name', e.target.value)}
						placeholder='Nombre del producto'
						className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
						required
					/>
				</div>

				{/* Descripción */}
				<div>
					<label className='mb-1 block text-sm font-medium text-gray-700'>
						Descripción
					</label>
					<textarea
						value={formData.description}
						onChange={(e) => handleInputChange('description', e.target.value)}
						placeholder='Descripción del producto'
						rows={3}
						className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
					/>
				</div>

				{/* Tipo y Categoría */}
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700'>
							Tipo *
						</label>
						<select
							value={formData.type}
							onChange={(e) => handleInputChange('type', e.target.value)}
							className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
							required>
							<option value='GENERAL'>Producto General</option>
							<option value='NOTEBOOK'>Notebook/Laptop</option>
							<option value='DESKTOP'>PC Escritorio</option>
						</select>
					</div>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700'>
							Categoría *
						</label>
						<select
							value={formData.category}
							onChange={(e) => handleInputChange('category', e.target.value)}
							className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
							required>
							<option value='A'>Categoría A - Alta rotación</option>
							<option value='B'>Categoría B - Media rotación</option>
							<option value='C'>Categoría C - Baja rotación</option>
							<option value='M'>Categoría M - Especializada</option>
						</select>
					</div>
				</div>

				{/* Precios */}
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700'>
							Precio de Costo *
						</label>
						<input
							type='number'
							value={formData.cost_price}
							onChange={(e) => handleInputChange('cost_price', e.target.value)}
							placeholder='0.00'
							step='0.01'
							min='0'
							className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
							required
						/>
					</div>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700'>
							Precio de Venta *
						</label>
						<input
							type='number'
							value={formData.unit_price}
							onChange={(e) => handleInputChange('unit_price', e.target.value)}
							placeholder='0.00'
							step='0.01'
							min='0'
							className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
							required
						/>
					</div>
				</div>

				{/* Stock y Condición */}
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700'>
							Stock Mínimo *
						</label>
						<input
							type='number'
							value={formData.min_stock}
							onChange={(e) => handleInputChange('min_stock', e.target.value)}
							placeholder='1'
							min='0'
							className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
							required
						/>
					</div>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-700'>
							Condición *
						</label>
						<select
							value={formData.condition}
							onChange={(e) => handleInputChange('condition', e.target.value)}
							className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
							required>
							<option value='NEW'>Nuevo</option>
							<option value='USED'>Usado</option>
							<option value='REFURBISHED'>Reacondicionado</option>
							<option value='DAMAGED'>Dañado</option>
						</select>
					</div>
				</div>
			</ModalBody>

			<ModalFooter>
				<div className='flex justify-end space-x-3'>
					<Button variant='outline' onClick={onClose} isDisable={isLoading}>
						Cancelar
					</Button>
					<Button color='blue' isLoading={isLoading} onClick={handleSubmit}>
						{product ? 'Actualizar' : 'Crear'} Producto
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default SimpleProductModal;
