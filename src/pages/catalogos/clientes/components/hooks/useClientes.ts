import { useEffect, useMemo } from 'react';
import { ICustomerSupplierFilters } from '../types';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCustomerSuppliers } from '@/store/slices/customerSuppliers/customerSuppliersSlice';
import type { ICustomerSupplier } from '@/interface/customerSupplier.interface';

interface UseClientesParams {
  subsidiaryId?: number | null;
  filters: ICustomerSupplierFilters;
}

export function useClientes({ subsidiaryId, filters }: UseClientesParams) {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((s) => s.customerSuppliers);
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
        // ❌ NO hacer fetch si sabemos que no tiene acceso
        return null;
      }
    } else if (!currentUser) {
      return null;
    }

    return subsidiaryId;
  }, [subsidiaryId, accessibleSubsidiaryIds, currentUser]);

  // Fetch clientes cuando cambia el subsidiaryId o el filtro
  useEffect(() => {
    if (!activeSubsidiaryId || activeSubsidiaryId === 0) {
      return;
    }

    void dispatch(fetchCustomerSuppliers({
      subsidiaryId: activeSubsidiaryId,
      search: filters.search || undefined,
      with_suppliers: true
    }));
  }, [dispatch, activeSubsidiaryId, filters.search]);  // Mapear items del store (ya vienen filtrados por el subsidiaryId que pedimos)
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
    activeSubsidiaryId
  };
}

