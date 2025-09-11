/**
 * Componente de tabla para productos
 * Tabla responsive con acciones y filtros
 */
import React from 'react';
import Button from '../../../../../components/ui/Button';
import Icon from '../../../../../components/icon/Icon';
import {
	IProduct,
	ProductType,
	ProductCategory,
	ProductCondition,
} from '../../types/products.types';
import { TColors } from '@/types/colors.type';
import Badge from '@/components/ui/Badge';

interface ProductsTableProps {
	products: IProduct[];
	isLoading?: boolean;
	onView: (product: IProduct) => void;
	onEdit: (product: IProduct) => void;
	onDelete: (product: IProduct) => void;
	onDuplicate?: (product: IProduct) => void;
}

const ProductsTable: React.FC<ProductsTableProps> = ({
	products,
	isLoading = false,
	onView,
	onEdit,
	onDelete,
	onDuplicate,
}) => {
	const getTypeColor = (type: ProductType): TColors => {
		switch (type) {
			case 'NOTEBOOK':
				return 'blue';
			case 'DESKTOP':
				return 'emerald';
			case 'GENERAL':
				return 'violet';
			default:
				return 'zinc';
		}
	};

	const getCategoryColor = (category: ProductCategory): TColors => {
		switch (category) {
			case 'A':
				return 'emerald';
			case 'B':
				return 'amber';
			case 'C':
				return 'violet';
			case 'M':
				return 'red';
			default:
				return 'zinc';
		}
	};

	const getConditionColor = (condition: ProductCondition): TColors => {
		switch (condition) {
			case 'NEW':
				return 'emerald';
			case 'USED':
				return 'amber';
			case 'REFURBISHED':
				return 'blue';
			case 'DAMAGED':
				return 'red';
			default:
				return 'zinc';
		}
	};

	const getStockColor = (product: IProduct): TColors => {
		if (product.available_stock === 0) return 'red';
		if (product.available_stock <= product.min_stock) return 'amber';
		return 'emerald';
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	const getTypeIcon = (type: ProductType) => {
		switch (type) {
			case 'NOTEBOOK':
				return 'HeroDevicePhoneMobile';
			case 'DESKTOP':
				return 'HeroComputerDesktop';
			case 'GENERAL':
				return 'HeroCube';
			default:
				return 'HeroCube';
		}
	};

	const getTypeLabel = (type: ProductType) => {
		switch (type) {
			case 'NOTEBOOK':
				return 'Notebook';
			case 'DESKTOP':
				return 'Desktop';
			case 'GENERAL':
				return 'General';
			default:
				return type;
		}
	};

	const getConditionLabel = (condition: ProductCondition) => {
		switch (condition) {
			case 'NEW':
				return 'Nuevo';
			case 'USED':
				return 'Usado';
			case 'REFURBISHED':
				return 'Reacondicionado';
			case 'DAMAGED':
				return 'Dañado';
			default:
				return condition;
		}
	};

	if (isLoading) {
		return (
			<div className='p-8'>
				<div className='animate-pulse space-y-4'>
					{[...Array(5)].map((_, index) => (
						<div key={index} className='grid grid-cols-8 gap-4'>
							{[...Array(8)].map((_, colIndex) => (
								<div key={colIndex} className='h-6 rounded bg-gray-200'></div>
							))}
						</div>
					))}
				</div>
			</div>
		);
	}

	if (products.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center py-12'>
				<div className='flex h-20 w-20 items-center justify-center rounded-full bg-gray-100'>
					<Icon icon='HeroCube' className='h-10 w-10 text-gray-400' />
				</div>
				<h3 className='mt-4 text-lg font-medium text-gray-900'>No hay productos</h3>
				<p className='mt-2 text-center text-sm text-gray-600'>
					No se encontraron productos que coincidan con los filtros aplicados.
				</p>
			</div>
		);
	}

	return (
		<div className='overflow-hidden'>
			<div className='overflow-x-auto'>
				<table className='min-w-full divide-y divide-gray-200'>
					<thead className='bg-gray-50'>
						<tr>
							<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
								Producto
							</th>
							<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
								Tipo
							</th>
							<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
								Categoría
							</th>
							<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
								Precio
							</th>
							<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
								Stock
							</th>
							<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
								Condición
							</th>
							<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
								Ubicación
							</th>
							<th className='px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
								Acciones
							</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-gray-200 bg-white'>
						{products.map((product) => (
							<tr key={product.id} className='hover:bg-gray-50'>
								<td className='px-6 py-4'>
									<div className='flex items-center'>
										{product.image_url ? (
											<img
												src={product.image_url}
												alt={product.name}
												className='h-10 w-10 rounded-lg object-cover'
												onError={(e) => {
													const target = e.target as HTMLImageElement;
													target.style.display = 'none';
												}}
											/>
										) : (
											<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
												<Icon
													icon={getTypeIcon(product.type)}
													className='h-5 w-5 text-gray-400'
												/>
											</div>
										)}
										<div className='ml-4'>
											<div className='font-medium text-gray-900'>
												{product.name}
											</div>
											<div className='text-sm text-gray-500'>
												SKU: {product.sku}
											</div>
											{product.brand && (
												<div className='text-xs text-gray-400'>
													{product.brand.name}
												</div>
											)}
										</div>
									</div>
								</td>
								<td className='px-6 py-4'>
									<Badge color={getTypeColor(product.type)}>
										{getTypeLabel(product.type)}
									</Badge>
								</td>
								<td className='px-6 py-4'>
									<Badge color={getCategoryColor(product.category)}>
										Categoría {product.category}
									</Badge>
								</td>
								<td className='px-6 py-4'>
									<div className='text-sm text-gray-900'>
										{formatCurrency(product.unit_price)}
									</div>
									<div className='text-xs text-gray-500'>
										Costo: {formatCurrency(product.cost_price)}
									</div>
								</td>
								<td className='px-6 py-4'>
									<div className='flex items-center space-x-2'>
										<Badge color={getStockColor(product)}>
											{product.available_stock}
										</Badge>
										<span className='text-xs text-gray-500'>
											/ {product.current_stock}
										</span>
									</div>
									{product.available_stock <= product.min_stock && (
										<div className='mt-1 text-xs text-red-600'>Stock bajo</div>
									)}
								</td>
								<td className='px-6 py-4'>
									<Badge color={getConditionColor(product.condition)}>
										{getConditionLabel(product.condition)}
									</Badge>
								</td>
								<td className='px-6 py-4'>
									<div className='text-sm text-gray-900'>
										{product.warehouse?.name || 'Sin asignar'}
									</div>
									{product.location && (
										<div className='text-xs text-gray-500'>
											{product.location}
										</div>
									)}
								</td>
								<td className='px-6 py-4 text-right'>
									<div className='flex items-center justify-end space-x-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() => onView(product)}
											title='Ver detalles'>
											<Icon icon='HeroEye' className='h-4 w-4' />
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() => onEdit(product)}
											title='Editar producto'>
											<Icon icon='HeroPencil' className='h-4 w-4' />
										</Button>
										{onDuplicate && (
											<Button
												variant='outline'
												size='sm'
												onClick={() => onDuplicate(product)}
												title='Duplicar producto'>
												<Icon icon='HeroSquare2Stack' className='h-4 w-4' />
											</Button>
										)}
										<Button
											variant='outline'
											color='red'
											size='sm'
											onClick={() => onDelete(product)}
											title='Eliminar producto'>
											<Icon icon='HeroTrash' className='h-4 w-4' />
										</Button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default ProductsTable;
