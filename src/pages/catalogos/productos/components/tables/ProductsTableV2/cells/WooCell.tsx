import React from 'react';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';
import { getWooProductLinks } from '@/utils/wooProductMeta.util';
import type { IProduct } from '@/interface/product.interface';

const WooCell: React.FC<{ product: IProduct }> = ({ product }) => {
	// Fuente única de verdad: el vínculo real en `marketplace_external_ids`
	// (lo mismo que lee el panel WooCommerce del detalle). NO se usa
	// `is_synced_with_woo` porque el pivote del backend puede quedar
	// desincronizado del mirror y mostrar "Publicado" cuando el panel dice
	// "No vinculado". Cada grado es independiente.
	const directStores = getWooProductLinks(product.marketplace_external_ids).length;
	const publishedChildren = (product.children ?? []).filter(
		(child) => getWooProductLinks(child.marketplace_external_ids).length > 0,
	);
	const hasDirectLink = directStores > 0;

	if (!hasDirectLink && publishedChildren.length === 0) {
		return (
			<Badge variant='outline' color='zinc' className='w-fit px-2'>
				No publicado
			</Badge>
		);
	}

	// Producto simple (sin variantes) publicado directamente.
	if (hasDirectLink && publishedChildren.length === 0) {
		return (
			<Tooltip
				text={
					directStores > 1
						? `Publicado en ${directStores} tiendas WooCommerce`
						: 'Publicado en WooCommerce'
				}>
				<Badge
					variant='solid'
					color='indigo'
					className='flex w-fit items-center gap-1 px-2'>
					<Icon icon='HeroShoppingBag' className='h-3 w-3' />
					{directStores > 1 ? `Publicado ×${directStores}` : 'Publicado'}
				</Badge>
			</Tooltip>
		);
	}

	// Con variantes: un pill por cada grado publicado.
	return (
		<div className='flex flex-wrap gap-1'>
			{hasDirectLink && (
				<Tooltip text='Producto base publicado en WooCommerce'>
					<Badge
						variant='solid'
						color='indigo'
						className='flex w-fit items-center gap-1 px-2'>
						<Icon icon='HeroShoppingBag' className='h-3 w-3' />
						Base
					</Badge>
				</Tooltip>
			)}
			{publishedChildren.map((child) => (
				<Tooltip key={child.id} text={`${child.name} publicado en WooCommerce`}>
					<Badge
						variant='solid'
						color='indigo'
						className='flex w-fit items-center gap-1 px-2'>
						<Icon icon='HeroShoppingBag' className='h-3 w-3' />
						{child.grade ? `Grado ${child.grade}` : 'Variante'}
					</Badge>
				</Tooltip>
			))}
		</div>
	);
};

export default WooCell;
