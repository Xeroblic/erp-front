import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import SoftHoldsBadge from '@/components/ui/SoftHoldsBadge';
import {
	summarizeProductSoftHolds,
	getEffectiveAvailableStock,
} from '@/components/helper/product.helper';
import { PRODUCT_TYPE_META } from '@/pages/catalogos/productos/constants/products.constant';
import type { TColors } from '@/types/colors.type';
import type { IProduct } from '@/interface/product.interface';
import { DEFAULT_TYPE_META } from '../productTable.utils';

const ProductCell: React.FC<{ product: IProduct }> = ({ product }) => {
	const typeMeta = product.product_type
		? PRODUCT_TYPE_META[product.product_type] || DEFAULT_TYPE_META
		: DEFAULT_TYPE_META;

	const softHolds = summarizeProductSoftHolds(product);

	const imageUrl = product.image?.url ?? null;
	const [failedUrl, setFailedUrl] = useState<string | null>(null);
	const showImage = !!imageUrl && failedUrl !== imageUrl;

	return (
		<div className='flex items-start gap-3'>
			<div className='h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800'>
				{showImage ? (
					<img
						src={imageUrl}
						alt={product.name}
						className='h-full w-full object-cover'
						onError={() => setFailedUrl(imageUrl)}
					/>
				) : (
					<div className='flex h-full w-full items-center justify-center'>
						<Icon icon={typeMeta.icon} className='h-6 w-6 text-zinc-400' />
					</div>
				)}
			</div>

			{/* Info del producto */}
			<div className='min-w-0 flex-1'>
				<div className='flex items-center gap-2'>
					<span className='truncate font-medium'>{product.name}</span>
				</div>

				<div className='mt-1 flex flex-wrap items-start gap-2'>
					<Badge
						variant='outline'
						color={typeMeta.badgeColor as TColors}
						className='flex flex-shrink-0 items-center gap-1 px-2'>
						<Icon icon={typeMeta.icon} className='h-3 w-3' />
						{typeMeta.label}
					</Badge>
				</div>

				<div className='mt-1 flex items-center gap-2 text-xs text-neutral-500'>
					<span>SKU: {product.sku}</span>
					{product.commercial_sku && (
						<span className='text-neutral-400'>• {product.commercial_sku}</span>
					)}
				</div>

				{softHolds ? (
					<div className='mt-1.5'>
						<SoftHoldsBadge
							softHolds={softHolds}
							availableStock={getEffectiveAvailableStock(
								product.serial_tracking,
								product.stock,
								softHolds,
							)}
						/>
					</div>
				) : null}
			</div>
		</div>
	);
};

export default ProductCell;
