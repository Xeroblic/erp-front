import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchCategories,
	fetchCategoryTree,
	createCategory as createCategoryThunk,
	updateCategory as updateCategoryThunk,
	deleteCategory as deleteCategoryThunk,
	toggleCategoryStatus as toggleCategoryStatusThunk,
	uploadCategoryGallery as uploadCategoryGalleryThunk,
} from '@/store/slices/categories/categoriesSlice';
import { fetchMisSucursales } from '@/store/slices/sucursales/sucursalesSlice';
import {
	type CreateCategoryPayload,
	type UpdateCategoryPayload,
	type ICategory,
	type ICategoryFilters,
	ICategoryTreeNode,
} from '@/interface/category.interface';
import { buildCategoryParentOptions } from '@/components/helper/category.helper';
import { CATEGORY_EMPTY_STATS } from '@/constants/category.constant';

const INITIAL_SAFE_STATE = {
	items: [] as ICategory[],
	stats: { ...CATEGORY_EMPTY_STATS },
	tree: [] as ICategoryTreeNode[],
	loading: false,
	treeLoading: false,
	creating: false,
	updating: false,
	deleting: false,
	error: null as string | null,
};

export function useCategorias(filters: ICategoryFilters) {
	const dispatch = useAppDispatch();
	const categoriesStateRaw = useAppSelector((state) => state.categories);
	const categoriesState = categoriesStateRaw ?? INITIAL_SAFE_STATE;

	useEffect(() => {
		void dispatch(fetchCategories({ search: filters.search, parent_id: filters.parent_id }));
	}, [dispatch, filters.search, filters.parent_id]);

	// Cargar sucursales para disponer de branchId al subir media
	const branchesState = useAppSelector((s) => s.sucursales);
	useEffect(() => {
		if (!branchesState.lista.length && !branchesState.loading) {
			void dispatch(fetchMisSucursales());
		}
	}, [branchesState.lista.length, branchesState.loading, dispatch]);

	const activeBranchId = useMemo<number | null>(() => {
		if (filters.branch_id) return filters.branch_id;
		return branchesState.lista[0]?.id ?? null;
	}, [branchesState.lista, filters.branch_id]);

	useEffect(() => {
		if (!categoriesState.tree.length) {
			void dispatch(fetchCategoryTree());
		}
	}, [dispatch, categoriesState.tree.length]);

	const parentOptions = useMemo(
		() => buildCategoryParentOptions(categoriesState.items, categoriesState.tree),
		[categoriesState.items, categoriesState.tree],
	);

	const createCategory = useCallback(
		async (payload: CreateCategoryPayload) => {
			const branchId = activeBranchId;
			if (!branchId) throw new Error('Debe seleccionar una sucursal para subir imágenes');
			const created = await dispatch(
				createCategoryThunk({ branchId, data: payload }),
			).unwrap();
			await Promise.all([
				dispatch(fetchCategories({ search: filters.search, parent_id: filters.parent_id })),
				dispatch(fetchCategoryTree()),
			]);
			return created;
		},
		[dispatch, filters.search, filters.parent_id, activeBranchId],
	);

	const updateCategory = useCallback(
		async (payload: UpdateCategoryPayload) => {
			const branchId = activeBranchId;
			if (!branchId) throw new Error('No se encontró una sucursal para subir imágenes');
			const updated = await dispatch(
				updateCategoryThunk({ branchId, data: payload }),
			).unwrap();
			await Promise.all([
				dispatch(fetchCategories({ search: filters.search, parent_id: filters.parent_id })),
				dispatch(fetchCategoryTree()),
			]);
			return updated;
		},
		[dispatch, filters.search, filters.parent_id, activeBranchId],
	);

	const toggleCategoryStatus = useCallback(
		async (category: ICategory) => {
			await dispatch(toggleCategoryStatusThunk(category)).unwrap();
			await dispatch(
				fetchCategories({ search: filters.search, parent_id: filters.parent_id }),
			);
		},
		[dispatch, filters.search, filters.parent_id],
	);

	const deleteCategory = useCallback(
		async (categoryId: number) => {
			await dispatch(deleteCategoryThunk(categoryId)).unwrap();
			await Promise.all([
				dispatch(fetchCategories({ search: filters.search, parent_id: filters.parent_id })),
				dispatch(fetchCategoryTree()),
			]);
		},
		[dispatch, filters.search, filters.parent_id],
	);

	return {
		categories: categoriesState.items,
		stats: categoriesState.stats,
		tree: categoriesState.tree,
		parentOptions,
		branches: branchesState.lista,
		activeBranchId,
		loading: categoriesState.loading,
		treeLoading: categoriesState.treeLoading,
		creating: categoriesState.creating,
		updating: categoriesState.updating,
		deleting: categoriesState.deleting,
		error: categoriesState.error,
		createCategory,
		updateCategory,
		toggleCategoryStatus,
		deleteCategory,
		uploadCategoryGallery: useCallback(
			async (categoryId: number, files: File[]) => {
				const branchId = activeBranchId;
				if (!branchId) throw new Error('Debe seleccionar una sucursal para subir galería');
				await dispatch(
					uploadCategoryGalleryThunk({ categoryId, branchId, files }),
				).unwrap();
				await dispatch(
					fetchCategories({ search: filters.search, parent_id: filters.parent_id }),
				);
			},
			[activeBranchId, dispatch, filters.parent_id, filters.search],
		),
		refresh: () => {
			void dispatch(
				fetchCategories({ search: filters.search, parent_id: filters.parent_id }),
			);
			void dispatch(fetchCategoryTree());
		},
	};
}
