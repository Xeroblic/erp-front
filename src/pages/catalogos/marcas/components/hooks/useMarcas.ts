import { useEffect, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMisSucursales } from '@/store/slices/sucursales/sucursalesSlice';
import {
	fetchBrands,
	createBrand as createBrandThunk,
	updateBrand as updateBrandThunk,
	deleteBrand as deleteBrandThunk,
	toggleBrandStatus as toggleBrandStatusThunk,
	uploadBrandGallery as uploadBrandGalleryThunk,
} from '@/store/slices/brands/brandsSlice';
import type {
	CreateBrandInput,
	IBrandFilters,
	IBrand,
	IBrandStats,
	UpdateBrandInput,
} from '@/interface/brand.interface';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';

export interface BranchOption {
	id: number;
	name: string;
}

interface BranchCandidate {
	id?: number | string | null;
	branch_id?: number | string | null;
	sucursal_id?: number | string | null;
	name?: string | null;
	branch_name?: string | null;
	nombre?: string | null;
	alias?: string | null;
}

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
		result = result.filter(
			(brand) =>
				brand.name.toLowerCase().includes(query) ||
				(brand.code ?? '').toLowerCase().includes(query) ||
				(brand.slug ?? '').toLowerCase().includes(query),
		);
	}
	// Filtro por origen eliminado: backend no entrega origin_country

	if (filters.is_active !== undefined) {
		result = result.filter((brand) => brand.is_active === filters.is_active);
	}

	return result;
};

const normalizeBranches = (branches: unknown[]): BranchOption[] => {
	if (!Array.isArray(branches)) return [];
	return branches
		.map((branch) => {
			if (!branch || typeof branch !== 'object') return null;
			const candidate = branch as BranchCandidate;
			const rawId = candidate.id ?? candidate.branch_id ?? candidate.sucursal_id ?? null;
			const id =
				typeof rawId === 'string'
					? Number.parseInt(rawId, 10)
					: typeof rawId === 'number'
						? rawId
						: null;
			if (!id || Number.isNaN(id)) return null;
			const name =
				candidate.name ??
				candidate.branch_name ??
				candidate.nombre ??
				candidate.alias ??
				`Sucursal ${id}`;
			return { id, name };
		})
		.filter((branch): branch is BranchOption => Boolean(branch));
};

export function useMarcas(filters: IBrandFilters) {
	const dispatch = useAppDispatch();
	const { lista: branches = [], loading: branchesLoading } = useAppSelector(
		(state) => state.sucursales ?? { lista: [], loading: false },
	) as { lista: unknown[]; loading: boolean };
	const brandsState = useAppSelector((state) => state.brands);
	const { branchId: currentBranchId, visibleBranches: hookVisibleBranches = [] } =
		useCurrentBranch();

	useEffect(() => {
		if (!branches.length && !branchesLoading) {
			void dispatch(fetchMisSucursales());
		}
	}, [branches.length, branchesLoading, dispatch]);

	const allowedBranches = useMemo<BranchOption[]>(() => {
		if (hookVisibleBranches.length) return hookVisibleBranches;
		return normalizeBranches(branches);
	}, [hookVisibleBranches, branches]);

	const allowedBranchIds = useMemo(
		() => new Set(allowedBranches.map((branch) => branch.id)),
		[allowedBranches],
	);

	const activeBranchId = useMemo<number | null>(() => {
		if (filters.branch_id && allowedBranchIds.has(filters.branch_id)) {
			return filters.branch_id;
		}

		if (currentBranchId && allowedBranchIds.has(currentBranchId)) {
			return currentBranchId;
		}

		return allowedBranches[0]?.id ?? null;
	}, [allowedBranchIds, allowedBranches, currentBranchId, filters.branch_id]);

	useEffect(() => {
		if (!activeBranchId) return;
		void dispatch(fetchBrands({ branchId: activeBranchId, search: filters.search }));
	}, [dispatch, activeBranchId, filters.search]);

	const visibleBrands = useMemo(
		() => applyLocalFilters(brandsState.items, filters),
		[brandsState.items, filters],
	);
	const visibleStats = useMemo(() => computeStats(visibleBrands), [visibleBrands]);

	const createBrand = useCallback(
		async (payload: CreateBrandInput) => {
			const branchId = payload.branch_id ?? filters.branch_id ?? activeBranchId;
			if (!branchId) throw new Error('Debe seleccionar una sucursal para crear una marca');
			if (!payload.name) throw new Error('El nombre de la marca es obligatorio');
			const { branch_id: _branchId, ...brandPayload } = payload;
			const created = await dispatch(
				createBrandThunk({ branchId, data: brandPayload }),
			).unwrap();
			return created;
		},
		[dispatch, filters.branch_id, activeBranchId],
	);

	const updateBrand = useCallback(
		async (payload: UpdateBrandInput) => {
			const branchId = payload.branch_id ?? filters.branch_id ?? activeBranchId;
			if (!branchId) throw new Error('No se encontro la sucursal asociada a la marca');
			const updated = await dispatch(updateBrandThunk({ branchId, data: payload })).unwrap();
			return updated;
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
		branches: allowedBranches,
		visibleBranches: allowedBranches,
		activeBranchId,
		creating: brandsState.creating,
		updating: brandsState.updating,
		deleting: brandsState.deleting,
		createBrand,
		updateBrand,
		toggleBrandStatus,
		deleteBrand,
		uploadBrandGallery: useCallback(
			async (brandId: number, files: File[], branchIdOverride?: number | null) => {
				const branchId = branchIdOverride ?? filters.branch_id ?? activeBranchId;
				if (!branchId) throw new Error('Debe seleccionar una sucursal para subir galería');
				await dispatch(uploadBrandGalleryThunk({ branchId, brandId, files })).unwrap();
				await dispatch(fetchBrands({ branchId, search: filters.search }));
			},
			[activeBranchId, dispatch, filters.branch_id, filters.search],
		),
	};
}
