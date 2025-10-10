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
	onView?: (product: IProduct) => void;
	onEdit: (product: IProduct) => void;
	onDelete: (product: IProduct) => void;
}

const currencyFormatter = new Intl.NumberFormat('es-CO', {
	style: 'currency',
	currency: 'COP',
});

const DEFAULT_TYPE_META = { label: 'Sin tipo', icon: 'HeroCube', badgeColor: 'zinc' };

const ProductsTable: React.FC<ProductsTableProps> = ({
	products,
	meta,
	loading = false,
	onView,
	onEdit,
	onDelete,
}) => {
	const resolveTypeMeta = (type: keyof typeof PRODUCT_TYPE_META | null | undefined) =>
		PRODUCT_TYPE_META[type as keyof typeof PRODUCT_TYPE_META] ?? DEFAULT_TYPE_META;

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
			const typeMeta = resolveTypeMeta(product.product_type as keyof typeof PRODUCT_TYPE_META | null | undefined);

			return (
				<tr key={product.id} className='border-t border-zinc-200 dark:border-zinc-800'>
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
							{onView && (
								<Button variant='outline' size='sm' onClick={() => onView(product)} icon='HeroEye'>
									Detalle
								</Button>
							)}
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

	const renderMobileSkeleton = () =>
		Array.from({ length: 3 }).map((_, index) => (
			<div key={index} className='space-y-3 border-b border-zinc-200 p-4 last:border-b-0 dark:border-zinc-800'>
				<div className='h-4 w-2/3 animate-pulse rounded bg-zinc-200/80 dark:bg-zinc-700/60' />
				<div className='h-3 w-1/2 animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-700/40' />
				<div className='h-3 w-1/3 animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-700/40' />
				<div className='h-9 w-full animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-700/40' />
			</div>
		));

	const renderMobileRows = () =>
		products.map((product) => {
			const typeMeta = resolveTypeMeta(product.product_type as keyof typeof PRODUCT_TYPE_META | null | undefined);

			return (
				<div
					key={product.id}
					className='space-y-4 border-b border-zinc-200 p-4 last:border-b-0 dark:border-zinc-800'>
					<div className='flex flex-col gap-3'>
						<div className='flex items-start justify-between gap-3'>
							<div>
								<div className='flex items-center gap-2 text-sm font-medium'>
									<Icon icon={typeMeta.icon} className='h-4 w-4' />
									{product.name}
								</div>
								<div className='text-xs text-neutral-500'>SKU: {product.sku}</div>
							</div>
							<Badge variant='outline' color={typeMeta.badgeColor as TColors}>
								{typeMeta.label}
							</Badge>
						</div>
						{product.brand ? (
							<div className='flex items-center gap-2 text-xs text-neutral-500'>
								<Icon icon='HeroTag' className='h-4 w-4' />
								{product.brand.name}
							</div>
						) : (
							<span className='text-xs text-neutral-500'>Sin marca</span>
						)}
					</div>

					<div className='grid gap-3 text-sm sm:grid-cols-2'>
						<div>
							<p className='text-xs uppercase text-neutral-400'>Precio</p>
							<p className='font-semibold'>
								{currencyFormatter.format(product.price)}
							</p>
						</div>
						{product.cost !== null && product.cost !== undefined && (
							<div>
								<p className='text-xs uppercase text-neutral-400'>Costo</p>
								<p>{currencyFormatter.format(product.cost)}</p>
							</div>
						)}
						{product.offer_price !== null && product.offer_price !== undefined && (
							<div>
								<p className='text-xs uppercase text-neutral-400'>Oferta</p>
								<p>{currencyFormatter.format(product.offer_price)}</p>
							</div>
						)}
					</div>

					<div className='flex flex-wrap gap-2 text-xs'>
						<Badge color={product.is_active ? 'emerald' : 'zinc'}>
							{product.is_active ? 'Activo' : 'Inactivo'}
						</Badge>
						{product.serial_tracking && (
							<span className='inline-flex items-center gap-1'>
								<Icon icon='HeroClipboardDocumentCheck' className='h-4 w-4' />
								Serie
							</span>
						)}
					</div>

					<div>
						<p className='text-xs uppercase text-neutral-400'>Categorias</p>
						{product.categories?.length ? (
							<div className='mt-1 flex flex-wrap gap-1'>
								{product.categories.map((category) => (
									<Badge key={category.id} variant='outline' color='blue'>
										{category.name}
									</Badge>
								))}
							</div>
						) : (
							<span className='text-xs text-neutral-500'>Sin categorias</span>
						)}
					</div>

					<div className='flex flex-col gap-2'>
						{onView && (
							<Button
								variant='outline'
								size='sm'
								onClick={() => onView(product)}
								icon='HeroEye'
								className='w-full'>
								Detalle
							</Button>
						)}
						<Button
							variant='outline'
							size='sm'
							onClick={() => onEdit(product)}
							icon='HeroPencil'
							className='w-full'>
							Editar
						</Button>
						<Button
							variant='outline'
							color='red'
							size='sm'
							onClick={() => onDelete(product)}
							icon='HeroTrash'
							className='w-full'>
							Eliminar
						</Button>
					</div>
				</div>
			);
		});

	const renderMobileEmpty = () => (
		<div className='p-6 text-center text-sm text-neutral-500'>
			No se encontraron productos con los filtros aplicados.
		</div>
	);

	return (
		<Card>
			<CardBody className='p-0'>
				<div className='hidden overflow-x-auto md:block'>
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
				<div className='md:hidden'>
					{loading ? renderMobileSkeleton() : products.length ? renderMobileRows() : renderMobileEmpty()}
				</div>
				<div className='px-4 py-3 text-xs text-neutral-500 md:px-6'>
					Mostrando {products.length} de {meta.total} resultados
				</div>
			</CardBody>
		</Card>
	);
};

export default ProductsTable;
