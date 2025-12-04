import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchSuppliers } from '@/store/slices/suppliers/suppliersSlice';
import { ISupplierFilters } from '../types';
import type { ISupplier } from '@/interface/supplier.interface';

interface UseProveedoresParams {
	subsidiaryId?: number | null;
	filters: ISupplierFilters;
}

export function useProveedores({ subsidiaryId, filters }: UseProveedoresParams) {
	const dispatch = useAppDispatch();
	const { items, loading } = useAppSelector((s) => s.suppliers);
	const currentUser = useAppSelector((state) => state.auth.user);

	// Obtener lista de subsidiarias accesibles del usuario
	const accessibleSubsidiaryIds = useMemo(() => {
		const subsidiaries = new Set<number>();

		// ✅ USAR SOLO access.subsidiaries - Es la fuente autoritativa del backend
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

		// ✅ VALIDAR ACCESO: Solo validar si tenemos lista de subsidiarias accesibles Y currentUser está cargado
		if (currentUser && accessibleSubsidiaryIds.size > 0) {
			if (!accessibleSubsidiaryIds.has(subsidiaryId)) {
				// NO hacer fetch si sabemos que no tiene acceso
				return null;
			}
		} else if (!currentUser) {
			return null;
		}

		return subsidiaryId;
	}, [subsidiaryId, accessibleSubsidiaryIds, currentUser]);

	// Fetch proveedores cuando cambia el subsidiaryId o el filtro
	useEffect(() => {
		if (!activeSubsidiaryId || activeSubsidiaryId === 0) {
			return;
		}

		void dispatch(
			fetchSuppliers({
				subsidiaryId: activeSubsidiaryId,
				search: filters.search || undefined,
				with_customers: true,
			}),
		);
	}, [dispatch, activeSubsidiaryId, filters.search]); // Mapear items del store
	const suppliers = useMemo<ISupplier[]>(() => {
		return (items || []).map((s: any) => ({
			id: s.id,
			subsidiary_id: s.subsidiary_id ?? activeSubsidiaryId ?? 0,
			name: s.name ?? `Proveedor ${s.id}`,
			created_at: s.created_at ?? new Date().toISOString(),
			updated_at: s.updated_at ?? new Date().toISOString(),
			customer_suppliers_count: s.customer_suppliers_count ?? 0,
			customerSuppliers: s.customerSuppliers ?? s.customer_suppliers ?? [],
			subsidiary: s.subsidiary ?? null,
		}));
	}, [items, activeSubsidiaryId]);

	// Estadísticas básicas de proveedores
	const stats = useMemo(() => {
		const total = suppliers.length;
		const withCustomers = suppliers.filter((s) => (s.customer_suppliers_count ?? 0) > 0).length;
		const totalCustomers = suppliers.reduce(
			(acc, s) => acc + (s.customer_suppliers_count ?? 0),
			0,
		);

		return {
			total_suppliers: total,
			with_customers: withCustomers,
			without_customers: total - withCustomers,
			total_customer_relations: totalCustomers,
		};
	}, [suppliers]);

	return {
		suppliers,
		stats,
		loading,
		activeSubsidiaryId,
	};
}
