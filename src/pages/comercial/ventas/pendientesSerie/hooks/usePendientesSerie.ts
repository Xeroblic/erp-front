import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { useDebounce } from 'use-debounce';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector, injectReducer } from '@/store';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import pendingSerialReducer, {
	loadPendingSerialList,
	loadPendingSerialCount,
	selectPendingSerialList,
	selectPendingSerialMeta,
	selectPendingSerialLoading,
	selectPendingSerialError,
} from '@/store/slices/pendingSerial/pendingSerialSlice';
import type { PendingSerialSale } from '@/services/salesService';

injectReducer('pendingSerial', pendingSerialReducer);

const DEFAULT_PAGE_SIZE = 10;

export const usePendientesSerie = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { subsidiaryId, branchId, hasValidBranch } = useCurrentBranch();

	const list = useAppSelector(selectPendingSerialList);
	const meta = useAppSelector(selectPendingSerialMeta);
	const loading = useAppSelector(selectPendingSerialLoading);
	const error = useAppSelector(selectPendingSerialError);

	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebounce(search, 400);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: DEFAULT_PAGE_SIZE,
	});

	// Reinicia a la primera página al cambiar la búsqueda.
	useEffect(() => {
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
	}, [debouncedSearch]);

	const fetchList = useCallback(() => {
		if (!subsidiaryId) return;
		dispatch(
			loadPendingSerialList({
				subsidiaryId,
				filters: {
					page: pagination.pageIndex + 1,
					per_page: pagination.pageSize,
					q: debouncedSearch.trim() || undefined,
				},
			}),
		);
	}, [dispatch, subsidiaryId, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

	useEffect(() => {
		fetchList();
	}, [fetchList]);

	// Mantiene el contador del badge en sincronía al entrar a la bandeja.
	useEffect(() => {
		if (subsidiaryId) dispatch(loadPendingSerialCount({ subsidiaryId }));
	}, [dispatch, subsidiaryId, list.length]);

	const goToSale = useCallback(
		(saleId: number) => navigate(`/comercial/ventas/${saleId}`),
		[navigate],
	);

	const pageCount = meta?.last_page ?? 1;
	const total = meta?.total ?? list.length;

	const emptyMessage = useMemo(
		() =>
			debouncedSearch
				? 'No hay ventas pendientes de serie para esa búsqueda.'
				: 'No hay ventas pendientes de asignar serie.',
		[debouncedSearch],
	);

	return {
		data: { list: list as PendingSerialSale[], total, pageCount },
		state: { loading, error, hasValidBranch, subsidiaryId, branchId, emptyMessage },
		search: { value: search, onChange: setSearch },
		pagination: { state: pagination, onChange: setPagination },
		actions: { goToSale, refetch: fetchList },
	};
};
