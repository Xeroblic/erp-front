import React from 'react';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';

interface ProductFilters {
	search?: string;
	is_active?: boolean;
	brand_id?: number;
	category_id?: number;
	product_type?: string;
}

interface ActiveFiltersDisplayProps {
	filters: ProductFilters;
}

const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({ filters }) => {
	const hasFiltersApplied =
		(filters.search && filters.search.trim().length > 0) ||
		typeof filters.is_active === 'boolean' ||
		filters.brand_id ||
		filters.category_id ||
		filters.product_type;

	if (!hasFiltersApplied) {
		return null;
	}

	return (
		<div className='mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide'>
			<span className='flex items-center gap-1'>
				<Icon icon='HeroSparkles' className='h-4 w-4' />
				Filtros activos
			</span>
			{filters.search && (
				<Badge className='px-2'  variant='outline' color='violet'>
					Busqueda: "{filters.search}"
				</Badge>
			)}
			{typeof filters.is_active === 'boolean' && (
				<Badge className='px-2'  variant='outline' color='emerald'>
					Estado: {filters.is_active ? 'Activo' : 'Inactivo'}
				</Badge>
			)}
			{filters.brand_id && (
				<Badge className='px-2'  variant='outline' color='blue'>
					Marca #{filters.brand_id}
				</Badge>
			)}
			{filters.category_id && (
				<Badge className='px-2'  variant='outline' color='amber'>
					Categoria #{filters.category_id}
				</Badge>
			)}
			{filters.product_type && (
				<Badge className='px-2'  variant='outline' color='violet'>
					Tipo: {filters.product_type}
				</Badge>
			)}
		</div>
	);
};

export default ActiveFiltersDisplay;
