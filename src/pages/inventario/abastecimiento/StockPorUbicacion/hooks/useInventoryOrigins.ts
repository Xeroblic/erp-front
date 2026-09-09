import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchInventoryOrigins,
	inventoryOriginsQueryKey,
} from '@/store/slices/procurement/inventoryStockSlice';
import { getInventoryOriginFilterOptions } from '@/services/procurement/inventoryStock.service';
import type { IInventoryStockListParams } from '@/interface/procurement.interface';
import { OriginsFiltersSchema } from '@/pages/inventario/abastecimiento/StockPorUbicacion/types';

export default function useInventoryOrigins(
	branchId: number,
	productId: number,
	owner: string,
	location: IInventoryStockListParams,
) {
	const session = useId();
	const dispatch = useAppDispatch();
	const raw = useAppSelector((state) => state.inventoryStock.origins);
	const [pagination, setPagination] = useState({ page: 1, per_page: 15 });
	const [retry, setRetry] = useState(0);
	const formik = useFormik({
		initialValues: { supplier: '', document: '' },
		validationSchema: OriginsFiltersSchema,
		onSubmit: () => undefined,
	});
	const { supplier, document } = formik.values;
	const { setFieldValue } = formik;
	const request = useMemo(
		() => ({
			branchId,
			productId,
			ownerContext: `${owner}:${session}`,
			params: {
				...location,
				supplier_id: supplier ? Number(supplier) : undefined,
				purchase_document_id: document ? Number(document) : undefined,
				...pagination,
			},
		}),
		[branchId, productId, owner, session, location, supplier, document, pagination],
	);
	const isCurrent = raw.ownerContext === inventoryOriginsQueryKey(request);
	useEffect(() => {
		const pending = dispatch(fetchInventoryOrigins(request));
		return () => {
			pending.abort();
		};
	}, [dispatch, request, retry]);
	const setFilter = useCallback(
		(field: 'supplier' | 'document', value: string) => {
			setPagination((current) => ({ ...current, page: 1 }));
			void setFieldValue(field, value);
		},
		[setFieldValue],
	);
	const options = useMemo(
		() => getInventoryOriginFilterOptions(branchId, productId, location),
		[branchId, productId, location],
	);
	const paginate = useCallback(
		(page: number, per_page: number) => setPagination({ page, per_page }),
		[],
	);
	const refresh = useCallback(() => setRetry((value) => value + 1), []);
	return {
		formik,
		setFilter,
		options,
		paginate,
		refresh,
		response: isCurrent ? raw.response : null,
		error: isCurrent ? raw.error : null,
		loading: !isCurrent || raw.loading,
	};
}
