import React from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import type { TColors } from '@/types/colors.type';
import type { IProduct, ProductListMeta } from '@/interface/product.interface';
import { PRODUCT_TYPE_META } from '../../constants/products.constant';

interface ProductsTableProps {
	products: IProduct[];
	meta: ProductListMeta;
	loading?: boolean;
	onEdit: (product: IProduct) => void;
	onDelete: (product: IProduct) => void;
}

const currencyFormatter = new Intl.NumberFormat('es-CO', {
	style: 'currency',
	currency: 'COP',
});

const DEFAULT_TYPE_META = { label: 'Sin tipo', icon: 'HeroCube', badgeColor: 'zinc' };

const ProductsTable: React.FC<ProductsTableProps> = ({ products, meta, loading = false, onEdit, onDelete }) => {
	const resolveTypeMeta = (type: string | null | undefined) => PRODUCT_TYPE_META[type ?? ''] ?? DEFAULT_TYPE_META;

	const renderSkeleton = () => (
		<tr>
			<td colSpan={6} className='px-6 py-8'>
				<div className='space-y-3'>
					<div className='h-4 w-2/5 animate-pulse rounded border' />
					<div className='h-4 w-3/5 animate-pulse rounded border' />
					<div className='h-4 w-1/3 animate-pulse rounded border' />
				</div>
			</td>
		</tr>
	);

	const renderEmpty = () => (
		<tr>
			<td colSpan={6} className='px-6 py-12 text-center text-sm'>
				No se encontraron productos con los filtros aplicados.
			</td>
		</tr>
	);

	const renderRows = () =>
		products.map((product) => {
			const typeMeta = resolveTypeMeta(product.product_type);

			return (
				<tr key={product.id} className='border-t'>
					<td className='px-6 py-3'>
						<div className='flex items-start justify-between gap-3'>
							<div>
								<div className='flex items-center gap-2'>
									<Icon icon={typeMeta.icon} className='h-4 w-4' />
									<span className='font-medium'>{product.name}</span>
								</div>
								<div className='text-xs text-neutral-500'>SKU: {product.sku}</div>
							</div>
							<Badge variant='outline' color={typeMeta.badgeColor as TColors}>{typeMeta.label}</Badge>
						</div>
					</td>
					<td className='px-6 py-3'>
						<div className='text-sm font-semibold'>{currencyFormatter.format(product.price)}</div>
						{product.cost !== null && product.cost !== undefined && (
							<div className='text-xs text-neutral-500'>Costo: {currencyFormatter.format(product.cost)}</div>
						)}
						{product.offer_price !== null && product.offer_price !== undefined && (
							<div className='text-xs text-neutral-500'>Oferta: {currencyFormatter.format(product.offer_price)}</div>
						)}
					</td>
					<td className='px-6 py-3'>
						{product.brand ? (
							<div className='flex items-center gap-2 text-sm'>
								<Icon icon='HeroTag' className='h-4 w-4' />
								{product.brand.name}
							</div>
						) : (
							<span className='text-xs text-neutral-500'>Sin marca</span>
						)}
					</td>
					<td className='px-6 py-3'>
						<Badge color={product.is_active ? 'emerald' : 'zinc'}>
							{product.is_active ? 'Activo' : 'Inactivo'}
						</Badge>
						{product.serial_tracking && (
							<span className='ml-2 inline-flex items-center gap-1 text-xs'>
								<Icon icon='HeroClipboardDocumentCheck' className='h-4 w-4' />
								Serie
							</span>
						)}
					</td>
					<td className='px-6 py-3'>
						{product.categories?.length ? (
							<div className='flex flex-wrap gap-1'>
								{product.categories.map((category) => (
									<Badge key={category.id} variant='outline' color='blue'>
										{category.name}
									</Badge>
								))}
							</div>
						) : (
							<span className='text-xs text-neutral-500'>Sin categorias</span>
						)}
					</td>
					<td className='px-6 py-3 text-right'>
						<div className='flex items-center justify-end gap-2'>
							<Button variant='outline' size='sm' onClick={() => onEdit(product)} icon='HeroPencil'>
								Editar
							</Button>
							<Button variant='outline' color='red' size='sm' onClick={() => onDelete(product)} icon='HeroTrash'>
								Eliminar
							</Button>
						</div>
					</td>
				</tr>
			);
		});

	return (
		<Card>
			<CardBody className='p-0'>
				<div className='overflow-x-auto'>
					<table className='min-w-full text-sm'>
						<thead>
							<tr className='text-left text-xs font-semibold uppercase tracking-wide'>
								<th className='px-6 py-3'>Producto</th>
								<th className='px-6 py-3'>Precio</th>
								<th className='px-6 py-3'>Marca</th>
								<th className='px-6 py-3'>Estado</th>
								<th className='px-6 py-3'>Categorias</th>
								<th className='px-6 py-3 text-right'>Acciones</th>
							</tr>
						</thead>
						<tbody>{loading ? renderSkeleton() : products.length ? renderRows() : renderEmpty()}</tbody>
					</table>
				</div>
				<div className='px-6 py-3 text-xs text-neutral-500'>
					Mostrando {products.length} de {meta.total} resultados
				</div>
			</CardBody>
		</Card>
	);
};

export default ProductsTable;

