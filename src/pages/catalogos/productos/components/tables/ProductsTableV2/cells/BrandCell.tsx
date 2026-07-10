import React from 'react';
import Icon from '@/components/icon/Icon';
import type { IProduct } from '@/interface/product.interface';

const BrandCell: React.FC<{ product: IProduct }> = ({ product }) => {
	const { brand } = product;
	return brand ? (
		<div className='flex items-center gap-2 text-sm'>
			<Icon icon='HeroTag' className='h-4 w-4 text-neutral-400' />
			<span>{brand.name}</span>
		</div>
	) : (
		<span className='text-xs text-neutral-400'>Sin marca</span>
	);
};

export default BrandCell;
