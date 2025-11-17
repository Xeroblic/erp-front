import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchSalesList } from '@/services/salesService';
import type { TSelectOption } from '@/components/form/SelectReact';
import { toast } from '@/utils/toast.utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProducts } from '@/store/slices/products/productsSlice';
import { fetchCustomerSuppliers } from '@/store/slices/customerSuppliers/customerSuppliersSlice';

type SaleLookup = {
	id: number;
	sale_number?: string | null;
};

export const useWarrantyLookups = (
	subsidiaryId?: number | null,
	branchId?: number | null,
) => {
	const dispatch = useAppDispatch();
	const products = useAppSelector((state) => state.products.items);
	const customers = useAppSelector((state) => state.customerSuppliers.items);

	const [saleOptions, setSaleOptions] = useState<TSelectOption[]>([]);

	useEffect(() => {
		if (branchId) {
			dispatch(fetchProducts({ branchId, params: { page: 1, per_page: 200 } }));
		}
	}, [branchId, dispatch]);

	useEffect(() => {
		if (subsidiaryId) {
			dispatch(fetchCustomerSuppliers({ subsidiaryId, with_suppliers: false }));
		}
	}, [subsidiaryId, dispatch]);

	const productOptions = useMemo<TSelectOption[]>(() => {
		if (!products?.length) {
			return [{ value: '', label: 'Sin productos disponibles' }];
		}
		return products.map((product) => ({
			value: String(product.id),
			label: product.sku
				? `${product.name ?? 'Producto'} (${product.sku})`
				: product.name ?? `Producto #${product.id}`,
		}));
	}, [products]);

	const customerOptions = useMemo<TSelectOption[]>(() => {
		if (!customers?.length) {
			return [{ value: '', label: 'Sin clientes disponibles' }];
		}
		return customers.map((customer) => ({
			value: String(customer.id),
			label: customer.name || `Cliente #${customer.id}`,
		}));
	}, [customers]);

	const searchSales = useCallback(
		async (search = ''): Promise<TSelectOption[]> => {
			if (!subsidiaryId) return [];
			try {
				const response = await fetchSalesList(subsidiaryId, {
					q: search || undefined,
					per_page: 20,
				});
				const sales = response.data ?? ([] as SaleLookup[]);
				const options = sales.map((sale) => ({
					value: String(sale.id),
					label: sale.sale_number || `Venta #${sale.id}`,
				}));
				if (!search) setSaleOptions(options);
				return options;
			} catch (err: unknown) {
				const message =
					(err as { response?: { data?: { message?: string } } })?.response?.data
						?.message || 'No se pudieron cargar las ventas';
				toast.error(message);
				return [];
			}
		},
		[subsidiaryId],
	);

	useEffect(() => {
		if (!subsidiaryId) {
			setSaleOptions([]);
			return;
		}
		void searchSales();
	}, [subsidiaryId, searchSales]);

	return {
		productOptions,
		customerOptions,
		saleOptions,
		searchSales,
	};
};
