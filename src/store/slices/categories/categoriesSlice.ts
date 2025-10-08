import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type {
	CreateCategoryPayload,
	FetchCategoriesParams,
	ICategory,
	ICategoryTreeNode,
	UpdateCategoryPayload,
} from '@/interface/category.interface';
import { CATEGORY_EMPTY_STATS, type CategoryStatsShape } from '@/constants/category.constant';
import {
	buildCategoryPayload,
	computeCategoryStats,
	normalizeCategory,
	normalizeCategoryTree,
} from '@/components/helper/category.helper';

export interface CategoryStatsState extends CategoryStatsShape { }

export interface CategoriesState {
	items: ICategory[];
	stats: CategoryStatsState;
	tree: ICategoryTreeNode[];
	loading: boolean;
	treeLoading: boolean;
	creating: boolean;
	updating: boolean;
	deleting: boolean;
	error: string | null;
}

const initialState: CategoriesState = {
	items: [],
	stats: { ...CATEGORY_EMPTY_STATS },
	tree: [],
	loading: false,
	treeLoading: false,
	creating: false,
	updating: false,
	deleting: false,
	error: null,
};

export const fetchCategories = createAsyncThunk<
	{ items: ICategory[]; stats: CategoryStatsState },
	FetchCategoriesParams | undefined,
	{ rejectValue: string }
>('categories/fetchCategories', async (params, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: any[] }>({
			url: '/categories',
			method: 'get',
			params: {
				q: params?.search || undefined,
				parent_id: params?.parent_id,
				per_page: 100,
			},
		});

		const rawItems = Array.isArray(response.data?.data)
			? response.data?.data
			: Array.isArray(response.data)
				? (response.data as any[])
				: [];

		const items = rawItems.map(normalizeCategory);

		return {
			items,
			stats: computeCategoryStats(items),
		};
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'Error al cargar categorias',
		);
	}
});

export const fetchCategoryTree = createAsyncThunk<
	ICategoryTreeNode[],
	void,
	{ rejectValue: string }
>('categories/fetchCategoryTree', async (_, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: any[] }>({
			url: '/categories/tree',
			method: 'get',
		});

		const rawNodes = Array.isArray(response.data?.data)
			? response.data?.data
			: Array.isArray(response.data)
				? (response.data as any[])
				: [];

		return normalizeCategoryTree(rawNodes);
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'Error al cargar arbol de categorias',
		);
	}
});

export const createCategory = createAsyncThunk<
	ICategory,
	CreateCategoryPayload,
	{ rejectValue: string }
>('categories/createCategory', async (payload, { rejectWithValue }) => {
	try {
		const body = buildCategoryPayload(payload);

		const response = await ApiService.fetchData<{ data?: any }, CreateCategoryPayload>({
			url: '/categories',
			method: 'post',
			data: body,
			headers: { 'Content-Type': 'application/json' },
		});

		const raw = response.data?.data ?? response.data;
		return normalizeCategory(raw ?? body);
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'Error al crear categoria',
		);
	}
});

export const updateCategory = createAsyncThunk<
	ICategory,
	UpdateCategoryPayload,
	{ rejectValue: string }
>('categories/updateCategory', async (payload, { rejectWithValue }) => {
	try {
		const body = buildCategoryPayload(payload);

		const response = await ApiService.fetchData<{ data?: any }, CreateCategoryPayload>({
			url: `/categories/${payload.id}`,
			method: 'patch',
			data: body,
			headers: { 'Content-Type': 'application/json' },
		});

		const raw = response.data?.data ?? response.data;
		return normalizeCategory(raw ?? payload);
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'Error al actualizar categoria',
		);
	}
});

export const toggleCategoryStatus = createAsyncThunk<
	ICategory,
	ICategory,
	{ rejectValue: string }
>('categories/toggleCategoryStatus', async (category, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: any }>({
			url: `/categories/${category.id}`,
			method: 'patch',
			data: { is_active: !category.is_active },
			headers: { 'Content-Type': 'application/json' },
		});

		const raw = response.data?.data ?? response.data;
		return normalizeCategory(raw ?? { ...category, is_active: !category.is_active });
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudo actualizar estado',
		);
	}
});

export const deleteCategory = createAsyncThunk<
	number,
	number,
	{ rejectValue: string }
>('categories/deleteCategory', async (categoryId, { rejectWithValue }) => {
	try {
		await ApiService.fetchData({
			url: `/categories/${categoryId}`,
			method: 'delete',
		});
		return categoryId;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudo eliminar la categoria',
		);
	}
});

const categoriesSlice = createSlice({
	name: 'categories/categoriesSlice',
	initialState,
	reducers: {
		clearCategoriesError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch list
			.addCase(fetchCategories.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchCategories.fulfilled, (state, action) => {
				state.loading = false;
				state.items = action.payload.items;
				state.stats = action.payload.stats;
			})
			.addCase(fetchCategories.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'Error al cargar categorias';
			})
			// Fetch tree
			.addCase(fetchCategoryTree.pending, (state) => {
				state.treeLoading = true;
			})
			.addCase(fetchCategoryTree.fulfilled, (state, action) => {
				state.treeLoading = false;
				state.tree = action.payload;
			})
			.addCase(fetchCategoryTree.rejected, (state, action) => {
				state.treeLoading = false;
				state.error = action.payload ?? 'Error al cargar arbol de categorias';
			})
			// Create
			.addCase(createCategory.pending, (state) => {
				state.creating = true;
				state.error = null;
			})
			.addCase(createCategory.fulfilled, (state, action) => {
				state.creating = false;
				state.items.unshift(action.payload);
				state.stats = computeCategoryStats(state.items);
			})
			.addCase(createCategory.rejected, (state, action) => {
				state.creating = false;
				state.error = action.payload ?? 'Error al crear categoria';
			})
			// Update
			.addCase(updateCategory.pending, (state) => {
				state.updating = true;
				state.error = null;
			})
			.addCase(updateCategory.fulfilled, (state, action) => {
				state.updating = false;
				const index = state.items.findIndex((category) => category.id === action.payload.id);
				if (index !== -1) {
					state.items[index] = action.payload;
					state.stats = computeCategoryStats(state.items);
				}
			})
			.addCase(updateCategory.rejected, (state, action) => {
				state.updating = false;
				state.error = action.payload ?? 'Error al actualizar categoria';
			})
			// Toggle status
			.addCase(toggleCategoryStatus.fulfilled, (state, action) => {
				const index = state.items.findIndex((category) => category.id === action.payload.id);
				if (index !== -1) {
					state.items[index] = action.payload;
					state.stats = computeCategoryStats(state.items);
				}
			})
			.addCase(toggleCategoryStatus.rejected, (state, action) => {
				state.error = action.payload ?? 'No se pudo actualizar estado';
			})
			// Delete
			.addCase(deleteCategory.pending, (state) => {
				state.deleting = true;
				state.error = null;
			})
			.addCase(deleteCategory.fulfilled, (state, action) => {
				state.deleting = false;
				state.items = state.items.filter((category) => category.id !== action.payload);
				state.stats = computeCategoryStats(state.items);
			})
			.addCase(deleteCategory.rejected, (state, action) => {
				state.deleting = false;
				state.error = action.payload ?? 'No se pudo eliminar la categoria';
			});
	},
});

export const { clearCategoriesError } = categoriesSlice.actions;

export default categoriesSlice.reducer;


