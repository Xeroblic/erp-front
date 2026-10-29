import React, { useEffect, useMemo, useRef, useState } from 'react';
// import ProductsTable from '../tables/ProductsTableV2.tsx';
import ProductFiltersCard from '../ProductFiltersCard';
import ActiveFiltersDisplay from '../ActiveFiltersDisplay';
import Pagination from '../Pagination';
import type { IProduct } from '@/interface/product.interface';
import type { IBrand } from '@/interface/brand.interface';
import type { ICategory } from '@/interface/category.interface';
import { ProductsTableV2 } from '../tables';
import Icon from '@/components/icon/Icon';
import Calendar, { type CalendarOutputData } from '@/components/ui/Calendar';

/** Date → 'YYYY-MM-DD' en hora local. */
const toLocalISODate = (d: Date): string => {
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

/** 'YYYY-MM-DD' → Date (hora local) o null. */
const parseISODate = (s: string): Date | null => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
	const d = new Date(`${s}T00:00:00`);
	return Number.isNaN(d.getTime()) ? null : d;
};

/** 'YYYY-MM-DD' → 'dd-mm-yyyy' para display. */
const toDisplayDate = (s: string): string => {
	const d = parseISODate(s);
	if (!d) return '';
	return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

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
	subsidiaryId?: number | null;
	onRefresh?: () => Promise<void> | void;
	/** Filtro client-side: mostrar solo productos publicados/sincronizados con Woo. */
	wooOnly?: boolean;
	onToggleWooOnly?: () => void;
	/** Rango de fechas de actualización (YYYY-MM-DD), filtrado client-side. */
	dateFrom?: string;
	dateTo?: string;
	/** Fecha del producto más antiguo: límite inferior del calendario. */
	minProductDate?: Date;
	onDateFromChange?: (value: string) => void;
	onDateToChange?: (value: string) => void;
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
	subsidiaryId,
	onRefresh,
	wooOnly = false,
	onToggleWooOnly,
	dateFrom = '',
	dateTo = '',
	minProductDate,
	onDateFromChange,
	onDateToChange,
}) => {
	const totalPages = Math.max(1, meta.last_page);

	// Range picker de fechas de actualización (mismo Calendar 'pro' de reportes).
	const [calendarOpen, setCalendarOpen] = useState(false);
	const dateDropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!calendarOpen) return;
		const onDoc = (event: MouseEvent) => {
			if (
				dateDropdownRef.current &&
				!dateDropdownRef.current.contains(event.target as Node)
			) {
				setCalendarOpen(false);
			}
		};
		document.addEventListener('mousedown', onDoc);
		return () => document.removeEventListener('mousedown', onDoc);
	}, [calendarOpen]);

	const calendarValue = useMemo<Date[]>(() => {
		const dates: Date[] = [];
		const from = parseISODate(dateFrom);
		const to = parseISODate(dateTo);
		if (from) dates.push(from);
		if (to) dates.push(to);
		return dates;
	}, [dateFrom, dateTo]);

	const displayFrom = toDisplayDate(dateFrom);
	const displayTo = toDisplayDate(dateTo);
	const hasDateRange = Boolean(displayFrom || displayTo);

	const handleCalendarChange = (data: CalendarOutputData) => {
		const rawDates = data.rawDates;
		if (rawDates.length === 0) {
			onDateFromChange?.('');
			onDateToChange?.('');
			return;
		}
		onDateFromChange?.(toLocalISODate(rawDates[0]));
		onDateToChange?.(rawDates.length >= 2 ? toLocalISODate(rawDates[1]) : '');
	};

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

			<div className='flex flex-wrap items-center justify-between gap-3'>
				<ActiveFiltersDisplay filters={filters} />
				<div className='flex flex-wrap items-center gap-3'>
					{/* Rango de fechas de actualización (Calendar 'pro' con accesos rápidos) */}
					<div ref={dateDropdownRef} className='relative'>
						<div
							className='flex w-64 cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition-colors hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-600'
							onClick={() => setCalendarOpen((prev) => !prev)}>
							<Icon
								icon='HeroCalendarDays'
								className='h-4 w-4 flex-shrink-0 text-zinc-400'
							/>
							{hasDateRange ? (
								<span className='flex-1 truncate text-zinc-800 dark:text-zinc-200'>
									{displayFrom || '...'}
									{` → ${displayTo || '...'}`}
								</span>
							) : (
								<span className='flex-1 text-zinc-400'>
									Actualizado: seleccionar rango…
								</span>
							)}
							{hasDateRange && (
								<button
									type='button'
									className='rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800'
									onClick={(event) => {
										event.stopPropagation();
										onDateFromChange?.('');
										onDateToChange?.('');
									}}>
									<Icon icon='HeroXMark' className='h-3.5 w-3.5' />
								</button>
							)}
							<Icon
								icon='HeroChevronDown'
								className={`h-4 w-4 text-zinc-400 transition-transform ${calendarOpen ? 'rotate-180' : ''}`}
							/>
						</div>
						{calendarOpen && (
							<div className='absolute left-0 z-50 mt-2'>
								<Calendar
									value={calendarValue.length > 0 ? calendarValue : undefined}
									selectionMode='range'
									variant='pro'
									rounded='rounded-2xl'
									minDate={minProductDate}
									maxDate={new Date()}
									onChange={handleCalendarChange}
								/>
							</div>
						)}
					</div>
					{onToggleWooOnly && (
						<button
							type='button'
							onClick={onToggleWooOnly}
							aria-pressed={wooOnly}
							className={`inline-flex flex-shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
								wooOnly
									? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-300'
									: 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
							}`}>
							<Icon icon='HeroShoppingBag' className='h-4 w-4' />
							{wooOnly ? 'Solo Woo ✓' : 'Solo Woo'}
						</button>
					)}
				</div>
			</div>

			<ProductsTableV2
				products={products}
				meta={meta}
				loading={loading}
				onView={onView}
				onDelete={onDelete}
				subsidiaryId={subsidiaryId}
				onRefresh={onRefresh}
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
