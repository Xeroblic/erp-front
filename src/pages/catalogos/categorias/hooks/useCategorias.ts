import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchCategories,
  fetchCategoryTree,
  createCategory as createCategoryThunk,
  updateCategory as updateCategoryThunk,
  deleteCategory as deleteCategoryThunk,
  toggleCategoryStatus as toggleCategoryStatusThunk,
} from '@/store/slices/categories/categoriesSlice';
import {
  type CreateCategoryPayload,
  type UpdateCategoryPayload,
  type ICategory,
  type ICategoryFilters,
} from '@/interface/category.interface';
import { flattenCategoryTree } from '@/components/helper/category.helper';

export function useCategorias(filters: ICategoryFilters) {
  const dispatch = useAppDispatch();
  const categoriesState = useAppSelector((state) => state.categories);

  useEffect(() => {
    void dispatch(fetchCategories({ search: filters.search, parent_id: filters.parent_id }));
  }, [dispatch, filters.search, filters.parent_id]);

  useEffect(() => {
    if (!categoriesState.tree.length) {
      void dispatch(fetchCategoryTree());
    }
  }, [dispatch, categoriesState.tree.length]);

  const parentOptions = useMemo(() => flattenCategoryTree(categoriesState.tree), [categoriesState.tree]);

  const createCategory = useCallback(
    async (payload: CreateCategoryPayload) => {
      await dispatch(createCategoryThunk(payload)).unwrap();
      await Promise.all([
        dispatch(fetchCategories({ search: filters.search, parent_id: filters.parent_id })),
        dispatch(fetchCategoryTree()),
      ]);
    },
    [dispatch, filters.search, filters.parent_id],
  );

  const updateCategory = useCallback(
    async (payload: UpdateCategoryPayload) => {
      await dispatch(updateCategoryThunk(payload)).unwrap();
      await Promise.all([
        dispatch(fetchCategories({ search: filters.search, parent_id: filters.parent_id })),
        dispatch(fetchCategoryTree()),
      ]);
    },
    [dispatch, filters.search, filters.parent_id],
  );

  const toggleCategoryStatus = useCallback(
    async (category: ICategory) => {
      await dispatch(toggleCategoryStatusThunk(category)).unwrap();
      await dispatch(fetchCategories({ search: filters.search, parent_id: filters.parent_id }));
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
    refresh: () => {
      void dispatch(fetchCategories({ search: filters.search, parent_id: filters.parent_id }));
      void dispatch(fetchCategoryTree());
    },
  };
}

