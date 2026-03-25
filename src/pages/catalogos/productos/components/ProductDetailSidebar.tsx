import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';
import { PRODUCT_TYPE_LABELS } from '../constants/products.constant';
import type { IProduct, IProductCategorySummary } from '@/interface/product.interface';
import { useNavigate } from 'react-router-dom';

interface ProductDetailSidebarProps {
	product: IProduct;
	branches: Array<{ id: number; name?: string }>;
}

export const ProductDetailSidebar: React.FC<ProductDetailSidebarProps> = ({
	product,
	branches,
}) => {
	// constantes
	const navigate = useNavigate();

	// funciones

	const handleNavigateToProduct = (productId: number) => {
		navigate(`/catalogos/productos/${productId}`);
	};

	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader>
					<CardTitle>Resumen rápido</CardTitle>
				</CardHeader>
				<CardBody className='space-y-3 text-sm'>
					<div className='flex items-center justify-between'>
						<span className='text-neutral-500'>Sucursal</span>
						<span className='font-medium text-neutral-800 dark:text-neutral-100'>
							{branches.find((branch) => branch.id === product.branch_id)?.name ??
								`Sucursal ${product.branch_id}`}
						</span>
					</div>
					<div className='flex items-center justify-between'>
						<span className='text-neutral-500'>Tipo de producto</span>
						<span className='font-medium text-neutral-800 dark:text-neutral-100'>
							{PRODUCT_TYPE_LABELS[product.product_type ?? ''] ??
								product.product_type ??
								'Sin tipo'}
						</span>
					</div>
					<div className='flex items-center justify-between'>
						<span className='text-neutral-500'>Serie</span>
						<Badge
							className='px-2'
							variant='outline'
							color={product.serial_tracking ? 'emerald' : 'zinc'}>
							{product.serial_tracking ? 'Con serie' : 'Sin serie'}
						</Badge>
					</div>
					<div className='flex items-center justify-between'>
						<span className='text-neutral-500'>Precio</span>
						<span className='font-semibold text-neutral-800 dark:text-neutral-100'>
							${product.price.toLocaleString('es-CL')}
						</span>
					</div>
					<div className='space-y-1'>
						<p className='text-xs uppercase text-neutral-400'>Categorías</p>
						<div className='flex flex-wrap gap-1'>
							{product.categories?.map((category: IProductCategorySummary) => (
								<Badge
									className='px-2'
									key={category.id}
									variant='outline'
									color='blue'>
									{category.name}
								</Badge>
							)) ?? <span className='text-xs text-neutral-400'>Sin categorías</span>}
						</div>
					</div>
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Auditoría</CardTitle>
				</CardHeader>
				<CardBody className='space-y-3 text-sm text-neutral-500'>
					<div>
						<p className='text-xs uppercase text-neutral-400'>Creado</p>
						<p className='font-medium text-neutral-700 dark:text-neutral-200'>
							{new Date(product.created_at).toLocaleString('es-CL')}
						</p>
					</div>
					<div>
						<p className='text-xs uppercase text-neutral-400'>Actualizado</p>
						<p className='font-medium text-neutral-700 dark:text-neutral-200'>
							{new Date(product.updated_at).toLocaleString('es-CL')}
						</p>
					</div>
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Stock disponibles</CardTitle>
					<p className='text-xs text-neutral-500'>
						Stock Basado en las categorias sincronizadas de este producto.
					</p>
				</CardHeader>
				<CardBody>
					<div className='flex items-center justify-between'>
						{/* <span className='text-neutral-500'>Stock</span> */}
						<span className='flex flex-col gap-2 font-semibold text-neutral-800 dark:text-neutral-100'>
							{product.children && product.children.length > 0
								? product.children
										.filter((child) => child.stock && child.stock > 0)
										.map((child) => (
											<Tooltip
												text={`Ver detalles de ${child.name}`}
												key={child.id}
												placement='left'>
												<div
													className='group flex w-fit cursor-pointer items-center justify-start gap-3 rounded-md p-1 transition-all hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
													onClick={() => handleNavigateToProduct(child.id)}
												>
													<Badge
														className='flex items-center text-md p-0 overflow-hidden'
														variant='outline'
														color='blue'
													>
														<span className='w-6 text-center font-bold px-2 py-1'>
															{child.grade}
														</span>
														<span className='border-l border-blue-200 px-2 py-1 font-normal dark:border-blue-800'>
															Stock: {child.stock}
														</span>
														<Icon
															icon='DuoVisible'
															color='violet'
															className='text-xl text-neutral-400 transition-colors group-hover:text-blue-500'
														/>
													</Badge>
													
												</div>
											</Tooltip>
										))
								: product.parent && (
										<Tooltip
											text={`Ver detalles de ${product.parent.name}`}
											key={product.parent.id}
											placement='left'>
											<div
												className='flex cursor-pointer items-center justify-end gap-2 transition-opacity hover:opacity-80'
												onClick={() => handleNavigateToProduct(product.parent!.id)}>
												<Badge
													className='flex items-center gap-2 text-md'
													variant='outline'
													color='blue'>
													{product.parent.name}
													<Icon
														color='violet'
														icon='DuoVisible'
														className='text-2xl text-neutral-400 transition-colors group-hover:text-blue-500'
													/>
												</Badge>
											</div>
										</Tooltip>
								  )}
						</span>
					</div>
				</CardBody>
			</Card>
		</div>
	);
};
