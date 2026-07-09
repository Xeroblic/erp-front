import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import { PRODUCT_STATUS_LABELS } from '../constants/products.constant';
import type { IProduct } from '@/interface/product.interface';
import { getWooProductLinks } from '@/utils/wooProductMeta.util';

interface ProductDetailHeaderProps {
	product: IProduct;
	branches: Array<{ id: number; name?: string }>;
	branchId: number | null;
	effectiveBranchId: number | null;
	onBranchChange: (branchId: number | null) => void;
	onSave: () => void;
	isSubmitting: boolean;
	isUpdating: boolean;
}

const formatProductStatus = (status: string | null | undefined) =>
	PRODUCT_STATUS_LABELS[status ?? ''] ?? 'Sin estado';

export const ProductDetailHeader: React.FC<ProductDetailHeaderProps> = ({
	product,
	// branches,
	// branchId,
	// effectiveBranchId,
	// onBranchChange,
	onSave,
	isSubmitting,
	isUpdating,
}) => {
	const navigate = useNavigate();

	return (
		<>
			<SubheaderLeft>
				<div className='flex items-center gap-3'>
					<div className='flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'>
						{product.image?.thumb ? (
							<img
								src={product.image.thumb}
								alt={product.image.alt ?? product.name}
								className='h-12 w-12 rounded-lg object-cover'
							/>
						) : (
							<Icon icon='HeroCube' className='h-6 w-6' />
						)}
					</div>
					<div>
						<h1 className='text-xl font-semibold text-neutral-800 dark:text-neutral-100'>
							{product.name}
						</h1>
						<div className='flex flex-wrap items-center gap-2 text-sm text-neutral-500'>
							<span>SKU: {product.sku}</span>
							<span>•</span>
							<Badge className='px-2' variant='outline' color={product.is_active ? 'emerald' : 'zinc'}>
								{product.is_active ? 'Activo' : 'Inactivo'}
							</Badge>
							<span>•</span>
							<Badge className='px-2' variant='outline' color='violet'>
								{formatProductStatus(product.product_status)}
							</Badge>
							{(() => {
								// Fuente única: vínculo real en marketplace_external_ids (igual
								// que el panel WooCommerce); no se usa is_synced_with_woo.
								const directStores = getWooProductLinks(
									product.marketplace_external_ids,
								).length;
								const syncedChildren = (product.children ?? []).filter(
									(child) =>
										getWooProductLinks(child.marketplace_external_ids).length > 0,
								).length;
								if (directStores === 0 && syncedChildren === 0) return null;
								const onlyChildren = directStores === 0 && syncedChildren > 0;
								return (
									<>
										<span>•</span>
										<Badge className='flex items-center gap-1 px-2' color='indigo'>
											<Icon icon='HeroShoppingBag' className='h-3 w-3' />
											{onlyChildren
												? 'Variantes en Woo'
												: directStores > 1
													? `En Woo ×${directStores}`
													: 'Publicado en Woo'}
										</Badge>
									</>
								);
							})()}
						</div>
					</div>
				</div>
			</SubheaderLeft>
			<SubheaderRight>
				<div className='flex flex-wrap items-center gap-3'>
					{/* {branches.length > 1 && (
						<div className='flex items-center gap-2'>
							<Icon
								icon='HeroBuildingStorefront'
								className='h-4 w-4 text-neutral-400'
							/>
							<select
								className='min-w-[180px] rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-900'
								value={branchId ?? effectiveBranchId ?? ''}
								onChange={(event) => {
									const nextValue = event.target.value
										? Number(event.target.value)
										: null;
									onBranchChange(nextValue);
								}}>
								<option value=''>Sucursal</option>
								{branches.map((branch) => (
									<option key={branch.id} value={branch.id}>
										{branch.name ?? `Sucursal ${branch.id}`}
									</option>
								))}
							</select>
						</div>
					)} */}
					<Button
						variant='outline'
						icon='HeroListBullet'
						onClick={() => navigate('/catalogos/productos')}>
						Ver listado
					</Button>
					<Button
						color='blue'
						icon='HeroArrowDownCircle'
						isLoading={isSubmitting || isUpdating}
						isDisable={isSubmitting || isUpdating}
						onClick={onSave}>
						Guardar cambios
					</Button>
				</div>
			</SubheaderRight>
		</>
	);
};
