import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchInventoryStock,
	inventoryStockQueryKey,
} from '@/store/slices/procurement/inventoryStockSlice';
import { getInventoryWarehouses } from '@/services/procurement/inventoryStock.service';
import {
	inventoryLocationParams,
	StockFiltersSchema,
} from '@/pages/inventario/abastecimiento/StockPorUbicacion/types';

/** Mounted by a keyed, authorized session; the key changes with user/branch/subsidiary. */
export default function useStockPorUbicacion(branchId: number, context: string) {
	const session = useId();
	const dispatch = useAppDispatch();
	const raw = useAppSelector((state) => state.inventoryStock.list);
	const [pagination, setPagination] = useState({ page: 1, per_page: 15 });
	const [expandedId, setExpandedId] = useState<number | null>(null);
	const [retry, setRetry] = useState(0);
	const formik = useFormik({
		initialValues: { search: '', location: 'branch' },
		validationSchema: StockFiltersSchema,
		onSubmit: () => undefined,
	});
	const { search, location } = formik.values;
	const { setFieldValue, resetForm } = formik;
	const locationParams = useMemo(() => inventoryLocationParams(location), [location]);
	const request = useMemo(
		() => ({
			branchId,
			ownerContext: `${context}:${session}`,
			params: { ...locationParams, search: search.trim() || undefined, ...pagination },
		}),
		[branchId, context, session, locationParams, search, pagination],
	);
	const queryKey = inventoryStockQueryKey(request);
	const isCurrent = raw.ownerContext === queryKey;
	const response = isCurrent ? raw.response : null;
	const error = isCurrent ? raw.error : null;
	const loading = !isCurrent || raw.loading;
	useEffect(() => {
		const pending = dispatch(fetchInventoryStock(request));
		return () => {
			pending.abort();
		};
	}, [dispatch, request, retry]);
	const setFilter = useCallback(
		(field: 'search' | 'location', value: string) => {
			setExpandedId(null);
			setPagination((current) => ({ ...current, page: 1 }));
			void setFieldValue(field, value);
		},
		[setFieldValue],
	);
	const clearFilters = useCallback(() => {
		resetForm();
		setExpandedId(null);
		setPagination({ page: 1, per_page: 15 });
	}, [resetForm]);
	const paginate = useCallback((page: number, per_page: number) => {
		setExpandedId(null);
		setPagination({ page, per_page });
	}, []);
	const toggleExpanded = useCallback(
		(id: number) => setExpandedId((current) => (current === id ? null : id)),
		[],
	);
	const refresh = useCallback(() => setRetry((value) => value + 1), []);
	const warehouses = useMemo(() => getInventoryWarehouses(branchId), [branchId]);
	return {
		formik,
		setFilter,
		clearFilters,
		response,
		error,
		loading,
		expandedId,
		toggleExpanded,
		paginate,
		refresh,
		warehouses,
		locationParams,
		queryKey,
	};
}
