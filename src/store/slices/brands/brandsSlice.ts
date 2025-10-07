import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import { CreateBrandPayload, FetchBrandsParams, IBrand, UpdateBrandPayload } from '@/interface/brand.interface';
import { EMPTY_STATS } from '@/constants/brand.constant';
import { buildFormData, computeStats, normalizeBrand } from '@/components/helper/brand.helper';


export interface BrandStatsState {
	total_brands: number;
	active_brands: number;
	inactive_brands: number;
	total_products: number;
	total_sales: number;
}

export interface BrandsState {
	items: IBrand[];
	stats: BrandStatsState;
	loading: boolean;
	creating: boolean;
	updating: boolean;
	deleting: boolean;
	error: string | null;
}

export const initialState: BrandsState = {
	items: [],
	stats: EMPTY_STATS,
	loading: false,
	creating: false,
	updating: false,
	deleting: false,
	error: null,
};


export const fetchBrands = createAsyncThunk<
	{ items: IBrand[]; stats: BrandStatsState },
	FetchBrandsParams,
	{ rejectValue: string }
>('brands/fetchBrands', async ({ branchId, search }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: any[] }>({
			url: `/branches/${branchId}/brands`,
			method: 'get',
			params: {
				q: search || undefined,
				per_page: 100,
			},
		});

		const rawItems = Array.isArray(response.data?.data)
			? response.data?.data
			: Array.isArray(response.data)
				? (response.data as any[])
				: [];

		const items = rawItems.map(normalizeBrand);

		return {
			items,
			stats: computeStats(items),
		};
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'Error al cargar las marcas',
		);
	}
});

export const createBrand = createAsyncThunk<
	IBrand,
	{ branchId: number; data: CreateBrandPayload },
	{ rejectValue: string }
>('brands/createBrand', async ({ branchId, data }, { rejectWithValue }) => {
	try {
		const formData = await buildFormData(data);

		const response = await ApiService.fetchData<{ data?: any }, FormData>({
			url: `/branches/${branchId}/brands`,
			method: 'post',
			data: formData,
			headers: { 'Content-Type': 'multipart/form-data' },
		});

		const raw = response.data?.data ?? response.data;
		return normalizeBrand(raw ?? { ...data, id: Date.now(), company_id: 0 });
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'Error al crear la marca',
		);
	}
});

export const updateBrand = createAsyncThunk<
	IBrand,
	{ branchId: number; data: UpdateBrandPayload },
	{ rejectValue: string }
>('brands/updateBrand', async ({ branchId, data }, { rejectWithValue }) => {
	try {
		const formData = await buildFormData(data);

		const response = await ApiService.fetchData<{ data?: any }, FormData>({
			url: `/branches/${branchId}/brands/${data.id}`,
			method: 'patch',
			data: formData,
			headers: { 'Content-Type': 'multipart/form-data' },
		});

		const raw = response.data?.data ?? response.data;
		return normalizeBrand(raw ?? data);
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'Error al actualizar la marca',
		);
	}
});

export const toggleBrandStatus = createAsyncThunk<
	IBrand,
	{ branchId: number; brand: IBrand },
	{ rejectValue: string }
>('brands/toggleBrandStatus', async ({ branchId, brand }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: any }>({
			url: `/branches/${branchId}/brands/${brand.id}`,
			method: 'patch',
			data: { is_active: !brand.is_active },
		});

		const raw = response.data?.data ?? response.data;
		return normalizeBrand(raw ?? { ...brand, is_active: !brand.is_active });
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudo actualizar el estado',
		);
	}
});

export const deleteBrand = createAsyncThunk<
	number,
	{ branchId: number; brandId: number },
	{ rejectValue: string }
>('brands/deleteBrand', async ({ branchId, brandId }, { rejectWithValue }) => {
	try {
		await ApiService.fetchData({
			url: `/branches/${branchId}/brands/${brandId}`,
			method: 'delete',
		});
		return brandId;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudo eliminar la marca',
		);
	}
});

const brandsSlice = createSlice({
	name: 'brands/brandsSlice',
	initialState,
	reducers: {
		clearBrandsError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch
			.addCase(fetchBrands.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchBrands.fulfilled, (state, action) => {
				state.loading = false;
				state.items = action.payload.items;
				state.stats = action.payload.stats;
			})
			.addCase(fetchBrands.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'Error al cargar las marcas';
			})
			// Create
			.addCase(createBrand.pending, (state) => {
				state.creating = true;
				state.error = null;
			})
			.addCase(createBrand.fulfilled, (state, action) => {
				state.creating = false;
				state.items.unshift(action.payload);
				state.stats = computeStats(state.items);
			})
			.addCase(createBrand.rejected, (state, action) => {
				state.creating = false;
				state.error = action.payload ?? 'Error al crear la marca';
			})
			// Update
			.addCase(updateBrand.pending, (state) => {
				state.updating = true;
				state.error = null;
			})
			.addCase(updateBrand.fulfilled, (state, action) => {
				state.updating = false;
				const index = state.items.findIndex((brand) => brand.id === action.payload.id);
				if (index !== -1) {
					state.items[index] = action.payload;
					state.stats = computeStats(state.items);
				}
			})
			.addCase(updateBrand.rejected, (state, action) => {
				state.updating = false;
				state.error = action.payload ?? 'Error al actualizar la marca';
			})
			// Toggle status
			.addCase(toggleBrandStatus.fulfilled, (state, action) => {
				const index = state.items.findIndex((brand) => brand.id === action.payload.id);
				if (index !== -1) {
					state.items[index] = action.payload;
					state.stats = computeStats(state.items);
				}
			})
			.addCase(toggleBrandStatus.rejected, (state, action) => {
				state.error = action.payload ?? 'No se pudo actualizar el estado';
			})
			// Delete
			.addCase(deleteBrand.pending, (state) => {
				state.deleting = true;
				state.error = null;
			})
			.addCase(deleteBrand.fulfilled, (state, action) => {
				state.deleting = false;
				state.items = state.items.filter((brand) => brand.id !== action.payload);
				state.stats = computeStats(state.items);
			})
			.addCase(deleteBrand.rejected, (state, action) => {
				state.deleting = false;
				state.error = action.payload ?? 'No se pudo eliminar la marca';
			});
	},
});

export const { clearBrandsError } = brandsSlice.actions;

export default brandsSlice.reducer;
