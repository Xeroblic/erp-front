import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import type { TSelectOption } from '@/components/form/SelectReact';
import type { WarrantyFilters } from '../types';
import { mapListResponse } from '../utils/warranty.utils';
import { useWarrantyLookups } from './useWarrantyLookups';
import { getUserSubsidiaryId } from '../utils/subsidiary.utils';
import { fetchWarranties } from '@/store/slices/garantias/thunks';

const statusOptions: TSelectOption[] = [
	{ value: 'Activa', label: 'Activa' },
	{ value: 'Expirada', label: 'Expirada' },
	{ value: 'Usada', label: 'Usada' },
	{ value: 'Anulada', label: 'Anulada' },
];

const initialFilters: WarrantyFilters = {
	q: '',
	status: '',
	product_id: null,
	customer_id: null,
	sale_id: null,
};

export const useWarranties = () => {
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.auth.user);
	const { list, meta, loading, error } = useAppSelector((state) => state.garantias);

	const [filters, setFilters] = useState<WarrantyFilters>(initialFilters);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(20);
	const subsidiaryId = getUserSubsidiaryId(user);
	const branchId = user?.branch?.id ?? null;
	const { productOptions, customerOptions, saleOptions, searchSales } = useWarrantyLookups(
		subsidiaryId,
		branchId,
	);

	const loadWarranties = useCallback(async () => {
		if (!subsidiaryId) return;
		await dispatch(
			fetchWarranties({
				subsidiaryId,
				page,
				perPage,
				status: filters.status || undefined,
				product_id: filters.product_id || undefined,
				customer_id: filters.customer_id || undefined,
				sale_id: filters.sale_id || undefined,
				q: filters.q?.trim() || undefined,
			}),
		);
	}, [dispatch, subsidiaryId, page, perPage, filters]);

	useEffect(() => {
		loadWarranties();
	}, [loadWarranties]);

	const updateFilter = useCallback(
		<K extends keyof WarrantyFilters>(key: K, value: WarrantyFilters[K]) => {
			setFilters((prev) => ({
				...prev,
				[key]: value,
			}));
			setPage(1);
		},
		[],
	);

	const clearFilters = useCallback(() => {
		setFilters(initialFilters);
		setPage(1);
	}, []);

	const formattedList = useMemo(() => mapListResponse(list), [list]);

	const handlePageChange = useCallback((nextPage: number) => {
		setPage(nextPage);
	}, []);

	const handlePerPageChange = useCallback((nextPerPage: number) => {
		setPerPage(nextPerPage);
		setPage(1);
	}, []);

	return {
		subsidiaryId,
		warranties: formattedList,
		rawWarranties: list,
		meta,
		loading,
		error,
		filters,
		page,
		perPage,
		statusOptions,
		productOptions,
		customerOptions,
		saleOptions,
		setFilter: updateFilter,
		clearFilters,
		handlePageChange,
		handlePerPageChange,
		reload: loadWarranties,
		searchSales,
	};
};

export const warrantyStatusOptions = statusOptions;
