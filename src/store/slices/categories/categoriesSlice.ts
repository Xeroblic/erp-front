import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type { RootState } from '@/store/rootReducer';
import type {
	CreateCategoryPayload,
	FetchCategoriesParams,
	ICategory,
	ICategoryTreeNode,
	UpdateCategoryPayload,
} from '@/interface/category.interface';
import { CATEGORY_EMPTY_STATS, type CategoryStatsShape } from '@/constants/category.constant';
import { convertFileToWebP, ensureAbsoluteUrl } from '@/components/helper/brand.helper';
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

const extractMediaUrl = (payload: any): string | null => {
    if (!payload) return null;
    const pickCandidate = (value: any): any => {
        if (!value) return null;
        if (Array.isArray(value)) return value[0] ?? null;
        if (Array.isArray(value?.data)) return value.data[0] ?? null;
        if (Array.isArray(value?.media)) return value.media[0] ?? null;
        return value;
    };
    const candidate = pickCandidate(payload);
    if (!candidate || typeof candidate !== 'object') return null;
    const possibilities = [
        candidate.url,
        candidate.original_url,
        candidate.preview_url,
        candidate.full_url,
        candidate.thumbnail_url,
        candidate.thumb,
    ];
    const raw = possibilities.find((item) => typeof item === 'string' && item.length > 0) ?? null;
    return ensureAbsoluteUrl(raw);
};

const fetchCategoryDetails = async (id: number): Promise<ICategory | null> => {
    try {
        const response = await ApiService.fetchData<{ data?: any }>({
            url: `/categories/${id}`,
            method: 'get',
        });
        const raw = response.data?.data ?? response.data;
        return raw ? normalizeCategory(raw) : null;
    } catch {
        return null;
    }
};

const uploadCategoryImage = async (
    categoryId: number,
    branchId: number | null | undefined,
    file: File,
): Promise<string | null> => {
    if (!branchId) {
        // La ruta requiere branches/{branch}/...; sin branch no se puede subir
        if (typeof window !== 'undefined') {
            console.warn('[categoriesSlice] uploadCategoryImage: branchId es requerido para subir media');
        }
        return null;
    }
    const processed = await convertFileToWebP(file);
    if (!processed) return null;

    const formData = new FormData();
    formData.append('files[]', processed, processed.name);
    formData.append('collection', 'image');
    formData.append('primary', 'first');

    try {
        const response = await ApiService.fetchData<{ data?: any }, FormData>({
            url: `/branches/${branchId}/categories/${categoryId}/media/upload-multiple`,
            method: 'post',
            data: formData,
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        const payload = response.data?.data ?? response.data;
        const url = extractMediaUrl(payload);
        const absolute = ensureAbsoluteUrl(url);
        if (absolute) return absolute;
        const refreshed = await fetchCategoryDetails(categoryId);
        return refreshed?.image?.url ?? null;
    } catch {
        const refreshed = await fetchCategoryDetails(categoryId);
        return refreshed?.image?.url ?? null;
    }
};

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
	{ branchId: number; data: CreateCategoryPayload },
 	{ rejectValue: string }
>('categories/createCategory', async ({ branchId, data }, { rejectWithValue }) => {
	try {
		const { image, ...rest } = data;
		const body = buildCategoryPayload(rest);

		const response = await ApiService.fetchData<{ data?: any }, CreateCategoryPayload>({
			url: '/categories',
			method: 'post',
			data: body,
			headers: { 'Content-Type': 'application/json' },
		});

		const raw = response.data?.data ?? response.data;
		let normalized = normalizeCategory(raw ?? body);

		if (image instanceof File) {
			const uploadedUrl = await uploadCategoryImage(normalized.id, branchId, image);
			if (uploadedUrl) {
				// merge
				normalized = { ...normalized, image: { id: normalized.image?.id, url: uploadedUrl, thumb: uploadedUrl, alt: normalized.name } };
			} else {
				const refreshed = await fetchCategoryDetails(normalized.id);
				if (refreshed) normalized = refreshed;
			}
		}

		return normalized;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'Error al crear categoria',
		);
	}
});

export const updateCategory = createAsyncThunk<
	ICategory,
	{ branchId: number; data: UpdateCategoryPayload },
 	{ rejectValue: string }
>('categories/updateCategory', async ({ branchId, data }, { rejectWithValue }) => {
	try {
		const { image, id, ...rest } = data as any;
		const body = buildCategoryPayload(rest);

		const response = await ApiService.fetchData<{ data?: any }, CreateCategoryPayload>({
			url: `/categories/${id}`,
			method: 'patch',
			data: body,
			headers: { 'Content-Type': 'application/json' },
		});

		const raw = response.data?.data ?? response.data;
		let normalized = normalizeCategory(raw ?? data);

		if (image instanceof File) {
			const uploadedUrl = await uploadCategoryImage(normalized.id, branchId, image);
			if (uploadedUrl) {
				normalized = { ...normalized, image: { id: normalized.image?.id, url: uploadedUrl, thumb: uploadedUrl, alt: normalized.name } };
			} else {
				const refreshed = await fetchCategoryDetails(normalized.id);
				if (refreshed) normalized = refreshed;
			}
		}

		return normalized;
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


