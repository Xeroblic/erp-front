import React from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';
import SoftHoldsBadge from '@/components/ui/SoftHoldsBadge';
import { getWooProductLinks } from '@/utils/wooProductMeta.util';
import type { IProduct, IProductChild } from '@/interface/product.interface';
import { composeVariantProduct, formatPriceValue, getGradeBadgeColor } from './productTable.utils';

interface ProductVariantsRowProps {
	product: IProduct;
	childVariants: IProductChild[];
	colSpan: number;
	onView?: (product: IProduct) => void;
}

const VariantRow: React.FC<{
	product: IProduct;
	child: IProductChild;
	onView?: (product: IProduct) => void;
}> = ({ product, child, onView }) => (
	<tr className='bg-white/80 dark:bg-zinc-900/60'>
		<td className='px-3 py-3 align-top'>
			{child.grade ? (
				<Badge variant='outline' color={getGradeBadgeColor(child.grade)}>
					Grado {child.grade}
				</Badge>
			) : (
				<span className='text-zinc-400'>-</span>
			)}
		</td>
		<td className='px-3 py-3 align-top'>
			<div className='text-sm font-medium text-zinc-800 dark:text-zinc-100'>{child.name}</div>
			<div className='text-xs text-zinc-500'>SKU: {child.sku}</div>
			{getWooProductLinks(child.marketplace_external_ids).length > 0 && (
				<Tooltip text='Publicado en WooCommerce'>
					<Badge
						variant='solid'
						color='indigo'
						className='mt-1 flex w-fit items-center gap-1 px-1.5 py-0.5 text-[10px]'>
						<Icon icon='HeroShoppingBag' className='h-2.5 w-2.5' />
						Woo
					</Badge>
				</Tooltip>
			)}
		</td>
		<td className='px-3 py-3 align-top text-sm'>
			<div className='font-semibold text-zinc-900 dark:text-zinc-100'>
				{formatPriceValue(child.price)}
			</div>
			{child.offer_price && (
				<div className='text-xs font-medium text-emerald-600'>
					Oferta: {formatPriceValue(child.offer_price)}
				</div>
			)}
		</td>
		<td className='px-3 py-3 align-top'>
			<div className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
				{child.stock ?? 0}
			</div>
			{child.stock_by_status && (
				<div className='mt-1 grid grid-cols-2 gap-1 text-xs text-zinc-500'>
					<span>
						Disp:{' '}
						<strong className='text-zinc-700 dark:text-zinc-200'>
							{child.stock_by_status.available ?? 0}
						</strong>
					</span>
					<span>
						Res:{' '}
						<strong className='text-zinc-700 dark:text-zinc-200'>
							{child.stock_by_status.reserved ?? 0}
						</strong>
					</span>
					<span>
						Cot:{' '}
						<strong className='text-zinc-700 dark:text-zinc-200'>
							{child.stock_by_status.in_quotation ?? 0}
						</strong>
					</span>
					<span>
						Vend:{' '}
						<strong className='text-zinc-700 dark:text-zinc-200'>
							{child.stock_by_status.sold ?? 0}
						</strong>
					</span>
				</div>
			)}
			{(child.soft_holds?.quantity ?? 0) > 0 ? (
				<div className='mt-1.5'>
					<SoftHoldsBadge softHolds={child.soft_holds} availableStock={child.stock} />
				</div>
			) : (
				<div className='mt-1.5 text-xs text-zinc-400 dark:text-zinc-500'>
					Apart: <strong className='text-zinc-500 dark:text-zinc-300'>0</strong>
				</div>
			)}
		</td>
		<td className='px-3 py-3 text-right align-top'>
			{onView && (
				<Button
					size='xs'
					variant='outline'
					icon='HeroArrowTopRightOnSquare'
					onClick={() => onView(composeVariantProduct(product, child))}>
					Ver grado
				</Button>
			)}
		</td>
	</tr>
);

const ProductVariantsRow: React.FC<ProductVariantsRowProps> = ({
	product,
	childVariants,
	colSpan,
	onView,
}) => (
	<tr className='bg-zinc-50/40 hover:bg-zinc-50 dark:bg-zinc-900/40 dark:hover:bg-zinc-900'>
		<td colSpan={colSpan} className='px-6 pb-6 pt-0'>
			<div className='mt-2 rounded-xl border border-dashed border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70'>
				<div>
					<p className='text-sm font-semibold text-zinc-800 dark:text-zinc-100'>
						Variantes por grado
					</p>
					<p className='text-xs text-zinc-500'>
						{childVariants.length
							? `Este producto tiene ${childVariants.length} variantes registradas.`
							: 'No se encontraron variantes para este producto.'}
					</p>
				</div>

				{childVariants.length ? (
					<div className='mt-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700'>
						<table className='w-full text-xs'>
							<thead className='bg-zinc-50 dark:bg-zinc-900/40'>
								<tr className='text-left text-xs font-semibold uppercase tracking-wide text-zinc-500'>
									<th className='px-3 py-2'>Grado</th>
									<th className='px-3 py-2'>Producto</th>
									<th className='px-3 py-2'>Precio</th>
									<th className='px-3 py-2'>Stock</th>
									<th className='px-3 py-2 text-right'>Acciones</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-zinc-200 dark:divide-zinc-800'>
								{childVariants.map((child) => (
									<VariantRow
										key={child.id}
										product={product}
										child={child}
										onView={onView}
									/>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className='mt-4 rounded-lg border border-dashed border-zinc-200 bg-white/80 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50'>
						No hay unidades clasificadas por grado todavía.
					</div>
				)}
			</div>
		</td>
	</tr>
);

export default ProductVariantsRow;
