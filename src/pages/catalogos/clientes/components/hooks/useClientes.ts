import { useEffect, useMemo } from 'react';
import { ICustomerSupplierFilters } from '../types';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchCustomerSuppliers,
	selectCustomerSuppliersMeta,
} from '@/store/slices/customerSuppliers/customerSuppliersSlice';
import type { ICustomerSupplier } from '@/interface/customerSupplier.interface';

interface UseClientesParams {
	subsidiaryId?: number | null;
	filters: ICustomerSupplierFilters;
	page?: number;
	per_page?: number;
}


export function useClientes({ subsidiaryId, filters, page = 1, per_page = 5 }: UseClientesParams) {
	const dispatch = useAppDispatch();
	const { items, loading } = useAppSelector((s) => s.customerSuppliers);
	const meta = useAppSelector(selectCustomerSuppliersMeta);
	const currentUser = useAppSelector((state) => state.auth.user);

	const accessibleSubsidiaryIds = useMemo(() => {
		const subsidiaries = new Set<number>();

		(currentUser as any)?.access?.subsidiaries?.forEach((sub: any) => {
			if (sub?.id) subsidiaries.add(sub.id);
			else if (typeof sub === 'number') subsidiaries.add(sub);
		});

		return subsidiaries;
	}, [currentUser]);

	// Calcular el subsidiaryId activo
	const activeSubsidiaryId = useMemo<number | null>(() => {
		if (subsidiaryId === null || subsidiaryId === undefined || subsidiaryId === 0) {
			return null;
		}
		if (currentUser && accessibleSubsidiaryIds.size > 0) {
			if (!accessibleSubsidiaryIds.has(subsidiaryId)) {
				return null;
			}
		} else if (!currentUser) {
			return null;
		}
		return subsidiaryId;
	}, [subsidiaryId, accessibleSubsidiaryIds, currentUser]);

	useEffect(() => {
		if (!activeSubsidiaryId || activeSubsidiaryId === 0) {
			return;
		}

		void dispatch(
			fetchCustomerSuppliers({
				subsidiaryId: activeSubsidiaryId,
				search: filters.search || undefined,
				with_suppliers: true,
				page,
				per_page,
			}),
		);
	}, [dispatch, activeSubsidiaryId, filters.search, page, per_page]); // Mapear items del store (ya vienen filtrados por el subsidiaryId que pedimos)
	const customers = useMemo<ICustomerSupplier[]>(() => {
		return (items || []).map((c: any) => ({
			id: c.id,
			subsidiary_id: c.subsidiary_id ?? activeSubsidiaryId ?? 0,
			name: c.name ?? `Cliente ${c.id}`,
			created_at: c.created_at ?? new Date().toISOString(),
			updated_at: c.updated_at ?? new Date().toISOString(),
			suppliers_count: c.suppliers_count ?? 0,
			suppliers: c.suppliers ?? [],
			subsidiary: c.subsidiary ?? null,
		}));
	}, [items, activeSubsidiaryId]);

	// Estadísticas básicas de clientes
	const stats = useMemo(() => {
		const total = customers.length;
		const withSuppliers = customers.filter((c) => (c.suppliers_count ?? 0) > 0).length;
		const totalSuppliers = customers.reduce((acc, c) => acc + (c.suppliers_count ?? 0), 0);

		return {
			total_customers: total,
			with_suppliers: withSuppliers,
			without_suppliers: total - withSuppliers,
			total_suppliers_relations: totalSuppliers,
		};
	}, [customers]);

	return {
		customers,
		stats,
		loading,
		activeSubsidiaryId,
		meta,
	};
}
