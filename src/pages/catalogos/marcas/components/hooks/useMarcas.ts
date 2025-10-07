import { useEffect, useMemo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchMisSucursales } from "@/store/slices/sucursales/sucursalesSlice";
import {
  fetchBrands,
  createBrand as createBrandThunk,
  updateBrand as updateBrandThunk,
  deleteBrand as deleteBrandThunk,
  toggleBrandStatus as toggleBrandStatusThunk,
} from "@/store/slices/brands/brandsSlice";
import type { CreateBrandInput, IBrandFilters, IBrand, IBrandStats, UpdateBrandInput } from "@/interface/brand.interface";

const computeStats = (items: IBrand[]): IBrandStats => {
  if (!items.length) {
    return {
      total_brands: 0,
      active_brands: 0,
      inactive_brands: 0,
      total_products: 0,
      total_sales: 0,
    };
  }

  const total_brands = items.length;
  const active_brands = items.filter((brand) => brand.is_active).length;
  const inactive_brands = total_brands - active_brands;
  const total_products = items.reduce((sum, brand) => sum + (brand.products_count || 0), 0);
  const total_sales = items.reduce((sum, brand) => sum + (brand.total_sales || 0), 0);

  return {
    total_brands,
    active_brands,
    inactive_brands,
    total_products,
    total_sales,
  };
};

const applyLocalFilters = (items: IBrand[], filters: IBrandFilters): IBrand[] => {
  let result = [...items];

  if (filters.search) {
    const query = filters.search.toLowerCase();
    result = result.filter((brand) =>
      brand.name.toLowerCase().includes(query) ||
      (brand.code ?? '').toLowerCase().includes(query) ||
      (brand.manufacturer ?? '').toLowerCase().includes(query),
    );
  }

  if (filters.origin_country) {
    const origin = filters.origin_country.toLowerCase();
    result = result.filter((brand) => (brand.origin_country ?? '').toLowerCase() === origin);
  }

  if (filters.is_active !== undefined) {
    result = result.filter((brand) => brand.is_active === filters.is_active);
  }

  return result;
};

export function useMarcas(filters: IBrandFilters) {
  const dispatch = useAppDispatch();
  const { lista: branches, loading: branchesLoading } = useAppSelector((state) => state.sucursales);
  const brandsState = useAppSelector((state) => state.brands);

  useEffect(() => {
    if (!branches.length && !branchesLoading) {
      void dispatch(fetchMisSucursales());
    }
  }, [branches.length, branchesLoading, dispatch]);

  const activeBranchId = useMemo<number | null>(() => {
    if (filters.branch_id) return filters.branch_id;
    return branches[0]?.id ?? null;
  }, [branches, filters.branch_id]);

  useEffect(() => {
    if (!activeBranchId) return;
    void dispatch(fetchBrands({ branchId: activeBranchId, search: filters.search }));
  }, [dispatch, activeBranchId, filters.search]);

  const visibleBrands = useMemo(() => applyLocalFilters(brandsState.items, filters), [brandsState.items, filters]);
  const visibleStats = useMemo(() => computeStats(visibleBrands), [visibleBrands]);

  const createBrand = useCallback(
    async (payload: CreateBrandInput) => {
      const branchId = filters.branch_id ?? activeBranchId;
      if (!branchId) throw new Error('Debe seleccionar una sucursal para crear una marca');
      if (!payload.name) throw new Error('El nombre de la marca es obligatorio');
      await dispatch(createBrandThunk({ branchId, data: payload })).unwrap();
    },
    [dispatch, filters.branch_id, activeBranchId],
  );

  const updateBrand = useCallback(
    async (payload: UpdateBrandInput) => {
      const branchId = payload.branch_id ?? filters.branch_id ?? activeBranchId;
      if (!branchId) throw new Error('No se encontro la sucursal asociada a la marca');
      await dispatch(updateBrandThunk({ branchId, data: payload })).unwrap();
    },
    [dispatch, filters.branch_id, activeBranchId],
  );

  const toggleBrandStatus = useCallback(
    async (brand: IBrand) => {
      const branchId = brand.branch_id ?? filters.branch_id ?? activeBranchId;
      if (!branchId) throw new Error('No se encontro la sucursal asociada a la marca');
      await dispatch(toggleBrandStatusThunk({ branchId, brand })).unwrap();
    },
    [dispatch, filters.branch_id, activeBranchId],
  );

  const deleteBrand = useCallback(
    async (brandId: number, branchId?: number) => {
      const targetBranchId = branchId ?? filters.branch_id ?? activeBranchId;
      if (!targetBranchId) throw new Error('No se encontro la sucursal asociada a la marca');
      await dispatch(deleteBrandThunk({ branchId: targetBranchId, brandId })).unwrap();
    },
    [dispatch, filters.branch_id, activeBranchId],
  );

  return {
    brands: visibleBrands,
    stats: visibleStats,
    loading: brandsState.loading || branchesLoading,
    error: brandsState.error,
    branches,
    activeBranchId,
    creating: brandsState.creating,
    updating: brandsState.updating,
    deleting: brandsState.deleting,
    createBrand,
    updateBrand,
    toggleBrandStatus,
    deleteBrand,
  };
}
