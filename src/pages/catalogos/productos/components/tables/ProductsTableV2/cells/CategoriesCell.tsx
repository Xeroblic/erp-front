import React from 'react';
import Badge from '@/components/ui/Badge';
import type { IProduct } from '@/interface/product.interface';

const CategoriesCell: React.FC<{ product: IProduct }> = ({ product }) => {
	const { categories } = product;
	return categories?.length ? (
		<div className='flex flex-col items-start gap-1'>
			<div className='flex flex-col gap-1'>
				{categories.slice(0, 3).map((category) => (
					<Badge
						key={category.id}
						variant='outline'
						color='blue'
						className='truncate px-2 text-xs'>
						{category.name}
					</Badge>
				))}
				{categories.length > 3 && (
					<Badge variant='outline' color='blue' className='text-xs'>
						+{categories.length - 3}
					</Badge>
				)}
			</div>
		</div>
	) : (
		<span className='text-xs text-neutral-400'>Sin categorías</span>
	);
};

export default CategoriesCell;
