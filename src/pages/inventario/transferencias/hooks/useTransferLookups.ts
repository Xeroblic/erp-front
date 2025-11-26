import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchWarehouses } from '@/store/slices/warehouses/warehouseSlice';
import { fetchProducts } from '@/store/slices/products/productsSlice';
import { fetchUsers } from '@/store/slices/usersAdmin/usersAdminSlice';
import type { IWarehouse } from '@/interface/warehouse.interface';
import type { IProduct } from '@/interface/product.interface';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';

export const useTransferLookups = (branchId?: number | null, subsidiaryId?: number | null) => {
	const dispatch = useAppDispatch();
	const warehouseState = useAppSelector((state) => state.warehouse);
	const productsState = useAppSelector((state) => state.products);
	const usersState = useAppSelector((state) => state.usersAdmin);

	useEffect(() => {
		if (!branchId) return;
		dispatch(fetchWarehouses({ branchId, params: { per_page: 200 } }));
	}, [branchId, dispatch]);

	useEffect(() => {
		if (!branchId) return;
		dispatch(fetchProducts({ branchId, params: { per_page: 200 } }));
	}, [branchId, dispatch]);

	useEffect(() => {
		if (!branchId && !subsidiaryId) return;
		dispatch(
			fetchUsers({
				per_page: 100,
				status: 'active',
				branch_id: branchId ?? undefined,
				subsidiary_id: subsidiaryId ?? undefined,
			}),
		);
	}, [branchId, subsidiaryId, dispatch]);

	const warehouses = useMemo<IWarehouse[]>(
		() =>
			branchId
				? warehouseState.warehouses.filter((warehouse) => warehouse.branch_id === branchId)
				: warehouseState.warehouses,
		[branchId, warehouseState.warehouses],
	);

	const products = useMemo<IProduct[]>(
		() =>
			branchId
				? productsState.items.filter((product) => product.branch_id === branchId)
				: productsState.items,
		[branchId, productsState.items],
	);

	const responsibles = useMemo<UserWithDetails[]>(() => usersState.users ?? [], [usersState.users]);

	return {
		warehouses,
		products,
		responsibles,
		loading: {
			warehouses: warehouseState.loading,
			products: productsState.loading,
			responsibles: usersState.loading.users,
		},
	};
};
