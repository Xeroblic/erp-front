import React from 'react';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { GeneralTab, ComercialTab, ContenidoTab, AtributosTab } from './DetailTabs';
import type { IBrand } from '@/interface/brand.interface';
import type { ICategory } from '@/interface/category.interface';
import type { TSelectOption } from '@/components/form/SelectReact';

interface ProductDetailTabsProps {
	activeTab: string;
	onTabChange: (tabId: string) => void;
	brands: IBrand[];
	brandsLoading: boolean;
	categories: ICategory[];
	categoriesLoading: boolean;
	categoryOptions: TSelectOption[];
	onUploadFile: (file?: File | null) => Promise<void>;
	onOpenLibrary: () => void;
}

const TABS_CONFIG = [
	{
		id: 'general',
		label: 'General',
		icon: 'HeroCog6Tooth' as const,
	},
	{
		id: 'comercial',
		label: 'Comercial',
		icon: 'HeroCurrencyDollar' as const,
	},
	{
		id: 'contenido',
		label: 'Contenido',
		icon: 'HeroDocumentText' as const,
	},
	{
		id: 'atributos',
		label: 'Atributos',
		icon: 'HeroListBullet' as const,
	},
];

export const ProductDetailTabs: React.FC<ProductDetailTabsProps> = ({
	activeTab,
	onTabChange,
	brands,
	brandsLoading,
	categories,
	categoriesLoading,
	categoryOptions,
	onUploadFile,
	onOpenLibrary,
}) => {
	const renderTabContent = () => {
		switch (activeTab) {
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
				return <ContenidoTab onUploadFile={onUploadFile} onOpenLibrary={onOpenLibrary} />;
			case 'atributos':
				return <AtributosTab />;
			default:
				return null;
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Edición del producto</CardTitle>
				<p className='text-sm text-neutral-500'>
					Actualiza la información comercial y técnica del producto utilizando las
					pestañas.
				</p>
			</CardHeader>
			<CardBody className='p-0'>
				<div className='w-full'>
					<div
						className='product-tabs-container overflow-x-auto overflow-y-hidden border-b border-gray-200 dark:border-gray-700'
						style={{
							WebkitOverflowScrolling: 'touch',
							scrollbarWidth: 'none',
							msOverflowStyle: 'none',
						}}>
						<div className='flex w-max min-w-full' style={{ gap: '0px' }}>
							{TABS_CONFIG.map((tab) => (
								<button
									key={tab.id}
									type='button'
									onClick={() => onTabChange(tab.id)}
									className={`inline-flex flex-shrink-0 items-center gap-2 border-b-2 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
										activeTab === tab.id
											? 'border-blue-500 bg-blue-50/50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
											: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
									}`}
									style={{
										minWidth: 'max-content',
										whiteSpace: 'nowrap' as const,
									}}>
									<Icon
										icon={tab.icon}
										className={`h-5 w-5 flex-shrink-0 ${
											activeTab === tab.id
												? 'text-blue-500 dark:text-blue-400'
												: 'text-gray-400'
										}`}
									/>
									<span className='flex-shrink-0'>{tab.label}</span>
								</button>
							))}
						</div>
					</div>
					<style>{`
						.product-tabs-container::-webkit-scrollbar {
							display: none;
						}
					`}</style>
				</div>
				<div className='p-6'>{renderTabContent()}</div>
			</CardBody>
		</Card>
	);
};
