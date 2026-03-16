import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { PRODUCT_TYPE_LABELS } from '../constants/products.constant';
import type { IProduct, IProductCategorySummary } from '@/interface/product.interface';

interface ProductDetailSidebarProps {
	product: IProduct;
	branches: Array<{ id: number; name?: string }>;
}

export const ProductDetailSidebar: React.FC<ProductDetailSidebarProps> = ({
	product,
	branches,
}) => {
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
		</div>
	);
};
