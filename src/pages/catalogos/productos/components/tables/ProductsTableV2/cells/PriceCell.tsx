import React from 'react';
import type { IProduct } from '@/interface/product.interface';
import { currencyFormatter } from '../productTable.utils';

const PriceCell: React.FC<{ product: IProduct }> = ({ product }) => {
	const hasOffer = product.offer_price !== null && product.offer_price !== undefined;

	return (
		<div className='space-y-1'>
			<div className={`font-semibold ${hasOffer ? 'text-sm line-through opacity-60' : ''}`}>
				{currencyFormatter.format(product.price)}
			</div>
			{hasOffer && product.offer_price && (
				<div className='text-base font-bold text-emerald-600 dark:text-emerald-400'>
					{currencyFormatter.format(product.offer_price)}
				</div>
			)}
			{product.cost !== null && product.cost !== undefined && (
				<div className='text-xs text-neutral-500'>
					Costo: {currencyFormatter.format(product.cost)}
				</div>
			)}
		</div>
	);
};

export default PriceCell;
