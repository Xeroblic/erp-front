import React from 'react';
// import ProductsTable from '../tables/ProductsTableV2.tsx';
import ProductFiltersCard from '../ProductFiltersCard';
import ActiveFiltersDisplay from '../ActiveFiltersDisplay';
import Pagination from '../Pagination';
import type { IProduct } from '@/interface/product.interface';
import type { IBrand } from '@/interface/brand.interface';
import type { ICategory } from '@/interface/category.interface';
import { ProductsTableV2 } from '../tables';

interface ProductFilters {
	search?: string;
	is_active?: boolean;
	brand_id?: number;
	category_id?: number;
	product_type?: string;
}

interface Meta {
	total: number;
	last_page: number;
	current_page: number;
	per_page: number;
}

interface ProductListTabProps {
	products: IProduct[];
	meta: Meta;
	loading: boolean;
	filters: ProductFilters;
	onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onStatusChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	onBrandChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	onCategoryChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	onTypeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	onResetFilters: () => void;
	brands: IBrand[];
	categories: ICategory[];
	brandsLoading: boolean;
	categoriesLoading: boolean;
	page: number;
	onPageChange: (page: number) => void;
	onView: (product: IProduct) => void;
	onDelete: (product: IProduct) => void;
}

const ProductListTab: React.FC<ProductListTabProps> = ({
	products,
	meta,
	loading,
	filters,
	onSearchChange,
	onStatusChange,
	onBrandChange,
	onCategoryChange,
	onTypeChange,
	onResetFilters,
	brands,
	categories,
	brandsLoading,
	categoriesLoading,
	page,
	onPageChange,
	onView,
	onDelete,
}) => {
	const totalPages = Math.max(1, meta.last_page);

	return (
		<div className='space-y-6'>
			<ProductFiltersCard
				filters={filters}
				onSearchChange={onSearchChange}
				onStatusChange={onStatusChange}
				onBrandChange={onBrandChange}
				onCategoryChange={onCategoryChange}
				onTypeChange={onTypeChange}
				onResetFilters={onResetFilters}
				brands={brands}
				categories={categories}
				brandsLoading={brandsLoading}
				categoriesLoading={categoriesLoading}
				totalRecords={meta.total}
				loading={loading}
			/>

			<ActiveFiltersDisplay filters={filters} />

			<ProductsTableV2
				products={products}
				meta={meta}
				loading={loading}
				onView={onView}
				onDelete={onDelete}
			/>

			<Pagination
				currentPage={page}
				totalPages={totalPages}
				loading={loading}
				onPageChange={onPageChange}
			/>
		</div>
	);
};

export default ProductListTab;
