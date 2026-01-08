import React, { useState } from 'react';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import {
	PRODUCT_STATUS_FILTER_OPTIONS,
	PRODUCT_TYPE_FILTER_OPTIONS,
} from '../constants/products.constant';

interface Brand {
	id: number;
	name: string;
}

interface Category {
	id: number;
	name: string;
}

interface ProductFilters {
	search?: string;
	is_active?: boolean;
	brand_id?: number;
	category_id?: number;
	product_type?: string;
}

interface ProductFiltersCardProps {
	filters: ProductFilters;
	onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onStatusChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	onBrandChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	onCategoryChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	onTypeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	onResetFilters: () => void;
	brands: Brand[];
	categories: Category[];
	brandsLoading: boolean;
	categoriesLoading: boolean;
	totalRecords: number;
	loading: boolean;
}

const ProductFiltersCard: React.FC<ProductFiltersCardProps> = ({
	filters,
	onSearchChange,
	onStatusChange,
	onBrandChange,
	onCategoryChange,
	// onTypeChange,
	onResetFilters,
	brands,
	categories,
	brandsLoading,
	categoriesLoading,
	totalRecords,
	loading,
}) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const brandOptions = brands.map((brand) => ({ value: String(brand.id), label: brand.name }));
	const categoryOptions = categories.map((category) => ({
		value: category.id,
		label: category.name,
	}));

	return (
		<Card className='mb-6'>
			<CardHeader className='pb-3'>
				<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
					<CardTitle className='flex items-center gap-2 text-base font-semibold'>
						<Icon icon='HeroFunnel' className='h-5 w-5' />
						Filtros avanzados
						<button
							onClick={() => setIsExpanded(!isExpanded)}
							className='ml-auto flex items-center gap-1 text-sm font-normal text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 md:hidden'>
							<Icon
								icon={isExpanded ? 'HeroChevronUp' : 'HeroChevronDown'}
								className='h-5 w-5'
							/>
						</button>
					</CardTitle>
					<div className='flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end'>
						<Badge variant='outline' color='blue' className='px-2 py-1 text-sm'>
							{totalRecords.toLocaleString('es-CO')} registros
						</Badge>
						<Button
							variant='outline'
							size='sm'
							icon='HeroArrowPath'
							onClick={onResetFilters}
							isDisable={loading}
							className='w-full sm:w-auto'>
							Limpiar filtros
						</Button>
					</div>
				</div>
			</CardHeader>

			{/* Siempre visible en desktop, colapsable en mobile */}
			<div className={`${isExpanded ? 'block' : 'hidden'} md:block`}>
				<CardBody className='grid gap-4 md:grid-cols-4'>
					<div className='space-y-2'>
						<label className='flex items-center gap-2 text-sm font-medium'>
							<Icon icon='HeroMagnifyingGlass' className='h-4 w-4' />
							Busqueda
						</label>
						<Input
							name='searchInline'
							placeholder='Buscar por nombre, SKU o codigo'
							value={filters.search ?? ''}
							onChange={onSearchChange}
						/>
					</div>
					<div className='space-y-2'>
						<label className='flex items-center gap-2 text-sm font-medium'>
							<Icon icon='HeroAdjustmentsHorizontal' className='h-4 w-4' />
							Estado
						</label>
						<Select
							name='status'
							value={
								filters.is_active === undefined
									? ''
									: filters.is_active
										? 'active'
										: 'inactive'
							}
							onChange={onStatusChange}>
							{PRODUCT_STATUS_FILTER_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>
					<div className='space-y-2'>
						<label className='flex items-center gap-2 text-sm font-medium'>
							<Icon icon='HeroBuildingStorefront' className='h-4 w-4' />
							Marca
						</label>
						<Select
							name='brand'
							value={filters.brand_id ? String(filters.brand_id) : ''}
							onChange={onBrandChange}
							disabled={brandsLoading || !brands.length}>
							<option value=''>Todas las marcas</option>
							{brandOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>
					<div className='space-y-2'>
						<label className='flex items-center gap-2 text-sm font-medium'>
							<Icon icon='HeroSquares2X2' className='h-4 w-4' />
							Categoria
						</label>
						<Select
							name='category'
							value={filters.category_id ? String(filters.category_id) : ''}
							onChange={onCategoryChange}
							disabled={categoriesLoading || !categories.length}>
							<option value=''>Todas las categorias</option>
							{categoryOptions.map((option) => (
								<option key={option.value} value={String(option.value)}>
									{option.label}
								</option>
							))}
						</Select>
					</div>
					{/* <div className='space-y-2'>
						<label className='flex items-center gap-2 text-sm font-medium'>
							<Icon icon='HeroCube' className='h-4 w-4' />
							Tipo de producto
						</label>
						<Select
							name='product_type'
							value={filters.product_type ? String(filters.product_type) : ''}
							onChange={onTypeChange}>
							{PRODUCT_TYPE_FILTER_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div> */}
				</CardBody>
			</div>
		</Card>
	);
};

export default ProductFiltersCard;
