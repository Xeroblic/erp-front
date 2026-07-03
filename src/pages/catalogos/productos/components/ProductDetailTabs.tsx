import React from 'react';
import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';
import {
	GeneralTab,
	ComercialTab,
	ContenidoTab,
	AtributosTab,
	ImagesProduct,
	ReviewsTab,
} from './DetailTabs';
import WooCommercePublishPanel from './modals/components/WooCommercePublishPanel';
import type { IBrand } from '@/interface/brand.interface';
import type { ICategory } from '@/interface/category.interface';
import type { TSelectOption } from '@/components/form/SelectReact';
import type { IProduct } from '@/interface/product.interface';

interface ProductDetailTabsProps {
	activeTab: string;
	onTabChange: (tabId: string) => void;
	brands: IBrand[];
	brandsLoading: boolean;
	categories: ICategory[];
	categoriesLoading: boolean;
	categoryOptions: TSelectOption[];
	onUploadMainImage: (file?: File | null) => Promise<void>;
	onUploadGalleryImage: (file?: File | null) => Promise<void>;
	onOpenLibrary: () => void;
	product?: IProduct | null;
	onDeleteImage?: (imageId: number) => Promise<void>;
	updateProduct?: (payload: { data: Partial<IProduct>; categoryIds?: number[] }) => Promise<void>;
	onProductRefresh?: () => void;
}

const TABS_CONFIG = [
	{ id: 'general', label: 'General', icon: 'HeroCog6Tooth' as const },
	{ id: 'comercial', label: 'Comercial', icon: 'HeroCurrencyDollar' as const },
	{ id: 'contenido', label: 'Contenido', icon: 'HeroDocumentText' as const },
	{ id: 'atributos', label: 'Atributos', icon: 'HeroListBullet' as const },
	{ id: 'imagenes', label: 'Imágenes', icon: 'HeroPhoto' as const },
	{ id: 'revisiones', label: 'Revisiones', icon: 'HeroClipboardDocumentCheck' as const },
	{ id: 'woocommerce', label: 'WooCommerce', icon: 'HeroShoppingBag' as const },
];

export const ProductDetailTabs: React.FC<ProductDetailTabsProps> = ({
	activeTab,
	onTabChange,
	brands,
	brandsLoading,
	categories,
	categoriesLoading,
	categoryOptions,
	onUploadMainImage,
	onUploadGalleryImage,
	onOpenLibrary,
	product,
	onDeleteImage,
	updateProduct,
	onProductRefresh,
}) => {
	const showAtributos = !!(product && product.product_type && product.product_type !== 'general');
	const showWoocommerce = !!product?.id;
	const showRevisiones = !!(product?.id && product.serial_tracking);
	const visibleTabs = TABS_CONFIG.filter((t) => {
		if (t.id === 'atributos') return showAtributos;
		if (t.id === 'woocommerce') return showWoocommerce;
		if (t.id === 'revisiones') return showRevisiones;
		return true;
	});

	const effectiveActiveTab = visibleTabs.find((t) => t.id === activeTab)
		? activeTab
		: visibleTabs[0]?.id || activeTab;

	const renderTabContent = () => {
		switch (effectiveActiveTab) {
			case 'general':
				return <GeneralTab brands={brands} brandsLoading={brandsLoading} />;
			case 'comercial':
				return (
					<ComercialTab
						categories={categories}
						categoriesLoading={categoriesLoading}
						categoryOptions={categoryOptions}
					/>
				);
			case 'contenido':
				return <ContenidoTab />;
			case 'atributos':
				return <AtributosTab product={product} updateProduct={updateProduct} />;
			case 'imagenes':
				return (
					<ImagesProduct
						onUploadMainImage={onUploadMainImage}
						onUploadGalleryImage={onUploadGalleryImage}
						onOpenLibrary={onOpenLibrary}
						productImage={product?.image}
						productGallery={product?.gallery}
						onDeleteImage={onDeleteImage}
					/>
				);
			case 'revisiones': {
				if (!product?.id) return null;
				return <ReviewsTab product={product} />;
			}
			case 'woocommerce': {
				if (!product?.id) return null;
				return (
					<WooCommercePublishPanel
						productId={product.id}
						initialSyncStock={product.sync_stock_with_woo ?? true}
						onProductRefresh={onProductRefresh}
						marketplaceExternalIds={product.marketplace_external_ids}
						channelPrices={product.channel_prices}
						basePrice={product.price_override ?? product.price ?? null}
						baseOfferPrice={product.offer_price_override ?? product.offer_price ?? null}
					/>
				);
			}
			default:
				return null;
		}
	};

	const activeTabConfig = visibleTabs.find((t) => t.id === effectiveActiveTab);

	return (
		<Card className='overflow-hidden border border-neutral-200 shadow-sm dark:border-neutral-700/80'>
			{/* Tab bar */}
			<div className='border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900/50'>
				<div
					className='product-tabs-container overflow-x-auto overflow-y-hidden'
					style={{
						WebkitOverflowScrolling: 'touch',
						scrollbarWidth: 'none',
						msOverflowStyle: 'none',
					}}>
					<nav
						className='flex w-max min-w-full'
						role='tablist'
						aria-label='Secciones del producto'>
						{visibleTabs.map((tab) => {
							const isActive = effectiveActiveTab === tab.id;
							return (
								<button
									key={tab.id}
									type='button'
									role='tab'
									aria-selected={isActive}
									onClick={() => onTabChange(tab.id)}
									className={`relative inline-flex flex-shrink-0 items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors duration-150 ${
										isActive
											? 'text-blue-600 dark:text-blue-400'
											: 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
									}`}
									style={{ minWidth: 'max-content', whiteSpace: 'nowrap' }}>
									<Icon
										icon={tab.icon}
										className={`h-4 w-4 flex-shrink-0 ${
											isActive
												? 'text-blue-500 dark:text-blue-400'
												: 'text-neutral-400 dark:text-neutral-500'
										}`}
									/>
									<span>{tab.label}</span>
									{isActive && (
										<span className='absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-blue-500 dark:bg-blue-400' />
									)}
								</button>
							);
						})}
					</nav>
				</div>
				<style>{`.product-tabs-container::-webkit-scrollbar { display: none; }`}</style>
			</div>

			{/* Active tab header */}
			{activeTabConfig && (
				<div className='border-b border-neutral-100 bg-neutral-50/50 px-6 py-3 dark:border-neutral-800 dark:bg-neutral-900/30'>
					<div className='flex items-center gap-2.5'>
						<Icon
							icon={activeTabConfig.icon}
							className='h-4 w-4 text-blue-500 dark:text-blue-400'
						/>
						<h2 className='text-sm font-bold text-neutral-800 dark:text-neutral-100'>
							{activeTabConfig.label}
						</h2>
						<span className='text-xs text-neutral-400 dark:text-neutral-500'>
							— Edición del producto
						</span>
					</div>
				</div>
			)}

			{/* Tab content */}
			<CardBody className='p-6'>{renderTabContent()}</CardBody>
		</Card>
	);
};
