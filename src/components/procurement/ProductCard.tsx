import React, { FC, ReactNode } from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import type { IProcurementProduct } from '@/interface/procurement.interface';
import { formatDecimalAmount } from '@/utils/procurementDecimal.util';

/**
 * Tarjeta de producto compartida por todo el módulo de abastecimiento.
 *
 * El contrato embebe la ficha completa en cada fila de stock, recepciones,
 * documentos, proveedores del producto, operaciones y reposición, precisamente
 * para que ninguna lista pida un producto extra por fila. Este componente recibe
 * esa ficha y no dispara ninguna carga.
 */

export type TProductCardDensity = 'comfortable' | 'compact';

export interface IProductCardProps {
	product: IProcurementProduct;
	/** `compact` para celdas de tabla; `comfortable` para detalle. */
	density?: TProductCardDensity;
	/** Oculta precio y costo de catálogo donde la pantalla no los necesita. */
	showCatalogPricing?: boolean;
	/** Contenido al costado derecho: cantidades, costo de compra, acciones. */
	aside?: ReactNode;
	className?: string;
}

const ProductThumbnail: FC<{ product: IProcurementProduct; size: string }> = ({
	product,
	size,
}) => {
	const { image, name } = product;

	if (!image?.thumb && !image?.url) {
		return (
			<div
				className={classNames(
					size,
					'flex shrink-0 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800',
				)}>
				{/* Sin imagen no se inventa un placeholder con texto: el icono es decorativo. */}
				<Icon icon='HeroPhoto' className='h-5 w-5 text-zinc-400' aria-hidden='true' />
			</div>
		);
	}

	return (
		<img
			src={image.thumb ?? image.url ?? ''}
			// `alt` ausente es null en el contrato: se cae al nombre del producto,
			// que es lo que el lector necesita, en vez de dejarlo vacío.
			alt={image.alt ?? name}
			className={classNames(size, 'shrink-0 rounded-lg object-cover')}
		/>
	);
};

/** Precio vigente: la oferta manda cuando existe, y se muestra el precio tachado. */
const CatalogPricing: FC<{ product: IProcurementProduct }> = ({ product }) => {
	const price = formatDecimalAmount(product.price, product.currency_code);
	const offerPrice = formatDecimalAmount(product.offer_price, product.currency_code);
	const cost = formatDecimalAmount(product.cost, product.currency_code);

	return (
		<div className='flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm'>
			<span className='text-zinc-500 dark:text-zinc-400'>Precio</span>
			{offerPrice ? (
				<>
					<span className='font-semibold'>{offerPrice}</span>
					<span className='text-zinc-400 line-through'>{price ?? 'Sin precio'}</span>
				</>
			) : (
				<span className='font-semibold'>{price ?? 'Sin precio'}</span>
			)}

			<span className='text-zinc-500 dark:text-zinc-400'>Costo de catálogo</span>
			{/* `cost_basis: "unknown"` es un costo sin base demostrable: se dice
			    «base desconocida», no se afirma que sea neto ni bruto. */}
			<span className='font-semibold'>{cost ?? 'Desconocido'}</span>
			{cost !== null && (
				<span className='text-xs text-zinc-500 dark:text-zinc-400'>
					{product.cost_basis === 'unknown'
						? '(base desconocida)'
						: `(${product.cost_basis === 'net' ? 'neto' : 'bruto'})`}
				</span>
			)}
		</div>
	);
};

const ProductCard: FC<IProductCardProps> = ({
	product,
	density = 'comfortable',
	showCatalogPricing = true,
	aside,
	className,
}) => {
	const isCompact = density === 'compact';

	return (
		<article
			data-component-name='Procurement/ProductCard'
			data-product-id={product.id}
			className={classNames(
				'flex items-start gap-3',
				isCompact ? 'py-1' : 'rounded-xl bg-white p-3 dark:bg-zinc-800/60',
				className,
			)}>
			<ProductThumbnail product={product} size={isCompact ? 'h-9 w-9' : 'h-14 w-14'} />

			<div className='min-w-0 grow'>
				<div className='flex flex-wrap items-center gap-2'>
					<h3
						className={classNames(
							'truncate font-semibold',
							isCompact ? 'text-sm' : 'text-base',
						)}>
						{product.name}
					</h3>
					{product.serial_tracking && (
						<Badge variant='outline' color='violet' className='text-xs'>
							Serializado
						</Badge>
					)}
					{product.grade !== null && (
						<Badge variant='outline' color='zinc' className='text-xs'>
							Grado {product.grade}
						</Badge>
					)}
					{!product.is_active && (
						<Badge variant='outline' color='amber' className='text-xs'>
							Inactivo
						</Badge>
					)}
				</div>

				<p className='mt-0.5 text-xs text-zinc-500 dark:text-zinc-400'>
					<span className='font-mono'>{product.sku}</span>
					{/* `commercial_sku` es null cuando no hay SKU comercial distinto:
					    no se repite el SKU interno para rellenar el hueco. */}
					{product.commercial_sku !== null && (
						<>
							{' · '}
							<span className='font-mono'>{product.commercial_sku}</span>
						</>
					)}
					{product.brand !== null && ` · ${product.brand.name}`}
				</p>

				{!isCompact && product.short_description !== null && (
					<p className='mt-1 text-sm text-zinc-600 dark:text-zinc-300'>
						{product.short_description}
					</p>
				)}

				{!isCompact && product.categories.length > 0 && (
					<div className='mt-2 flex flex-wrap gap-1'>
						{product.categories.map((category) => (
							<Badge
								key={category.id}
								variant='default'
								color='zinc'
								className='text-xs'>
								{category.name}
							</Badge>
						))}
					</div>
				)}

				{!isCompact && showCatalogPricing && (
					<div className='mt-2'>
						<CatalogPricing product={product} />
					</div>
				)}
			</div>

			{aside !== undefined && <div className='shrink-0 text-right'>{aside}</div>}
		</article>
	);
};

export default ProductCard;
