import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type {
	CreateProductPayload,
	FetchProductsParams,
	IProduct,
	ProductListMeta,
	ProductsStateStats,
	UpdateProductPayload,
} from '@/interface/product.interface';
import {
	buildProductPayload,
	buildUpdatePayload,
	computeProductStats,
	normalizeProduct,
	serializeFilters,
} from '@/components/helper/product.helper';
import { PRODUCT_EMPTY_STATS } from '@/constants/product.constant';

export interface ProductsState {
	items: IProduct[];
	meta: ProductListMeta;
	stats: ProductsStateStats;
	current: IProduct | null;
	loading: boolean;
	currentLoading: boolean;
	creating: boolean;
	updating: boolean;
	deleting: boolean;
	error: string | null;
	currentError: string | null;
}

const initialState: ProductsState = {
	items: [],
	meta: {
		total: 0,
		current_page: 1,
		per_page: 15,
		last_page: 1,
	},
	stats: { ...PRODUCT_EMPTY_STATS },
	current: null,
	loading: false,
	currentLoading: false,
	creating: false,
	updating: false,
	deleting: false,
	error: null,
	currentError: null,
};

export const fetchProducts = createAsyncThunk<
	{ items: IProduct[]; meta: ProductListMeta; stats: ProductsStateStats },
	{ branchId: number; params?: FetchProductsParams },
	{ rejectValue: string }
>('products/fetchProducts', async ({ branchId, params }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{
			data?: any[];
			meta?: Partial<ProductListMeta> & Record<string, any>;
		}>({
			url: `/branches/${branchId}/products`,
			method: 'get',
			params: {
				page: params?.page ?? 1,
				per_page: params?.per_page ?? 15,
				...serializeFilters(params ?? {}),
			},
		});

		const rawItems = Array.isArray(response.data?.data)
			? response.data?.data
			: Array.isArray(response.data)
				? (response.data as any[])
				: [];

		const items = rawItems.map(normalizeProduct);

		const metaSource = response.data?.meta ?? {};
		const meta: ProductListMeta = {
			total: Number(metaSource.total ?? items.length),
			current_page: Number(metaSource.current_page ?? params?.page ?? 1),
			per_page: Number((metaSource.per_page ?? params?.per_page ?? items.length) || 1),
			last_page: Number(metaSource.last_page ?? 1),
		};

		return {
			items,
			meta,
			stats: computeProductStats(items),
		};
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudieron cargar los productos',
		);
	}
});

export const fetchProductById = createAsyncThunk<
	IProduct,
	{ branchId: number; productId: number },
	{ rejectValue: string }
>('products/fetchProductById', async ({ branchId, productId }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: any }>({
			url: `/branches/${branchId}/products/${productId}`,
			method: 'get',
		});

		const raw = response.data?.data ?? response.data;
		return normalizeProduct(raw ?? { id: productId, branch_id: branchId });
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudo obtener el producto',
		);
	}
});

export const createProduct = createAsyncThunk<
	IProduct,
	{ branchId: number; data: Partial<IProduct>; categoryIds: number[] },
	{ rejectValue: string }
>('products/createProduct', async ({ branchId, data, categoryIds }, { rejectWithValue }) => {
	try {
		const body = buildProductPayload(data, categoryIds);

		const response = await ApiService.fetchData<{ data?: any }, CreateProductPayload>({
			url: `/branches/${branchId}/products`,
			method: 'post',
			data: body,
		});

		const raw = response.data?.data ?? response.data;
		return normalizeProduct(raw ?? body);
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudo crear el producto',
		);
	}
});

export const updateProduct = createAsyncThunk<
	IProduct,
	{ branchId: number; productId: number; data: Partial<IProduct>; categoryIds?: number[] },
	{ rejectValue: string }
>(
	'products/updateProduct',
	async ({ branchId, productId, data, categoryIds }, { rejectWithValue }) => {
		try {
			const body = buildUpdatePayload(productId, data, categoryIds);

			const response = await ApiService.fetchData<{ data?: any }, UpdateProductPayload>({
				url: `/branches/${branchId}/products/${productId}`,
				method: 'patch',
				data: body,
			});

			const raw = response.data?.data ?? response.data;
			return normalizeProduct(raw ?? { ...data, id: productId });
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ?? error?.message ?? 'No se pudo actualizar el producto',
			);
		}
	},
);

export const deleteProduct = createAsyncThunk<
	number,
	{ branchId: number; productId: number },
	{ rejectValue: string }
>('products/deleteProduct', async ({ branchId, productId }, { rejectWithValue }) => {
	try {
		await ApiService.fetchData({
			url: `/branches/${branchId}/products/${productId}`,
			method: 'delete',
		});

		return productId;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudo eliminar el producto',
		);
	}
});

const productsSlice = createSlice({
	name: 'products/productsSlice',
	initialState,
	reducers: {
		clearProductsError: (state) => {
			state.error = null;
			state.currentError = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProducts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchProducts.fulfilled, (state, action) => {
				state.loading = false;
				state.items = action.payload.items;
				state.meta = action.payload.meta;
				state.stats = action.payload.stats;
			})
			.addCase(fetchProducts.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'No se pudieron cargar los productos';
			})
			.addCase(fetchProductById.pending, (state) => {
				state.currentLoading = true;
				state.currentError = null;
			})
			.addCase(fetchProductById.fulfilled, (state, action) => {
				state.currentLoading = false;
				state.current = action.payload;
				const index = state.items.findIndex((product) => product.id === action.payload.id);
				if (index !== -1) {
					state.items[index] = action.payload;
				}
			})
			.addCase(fetchProductById.rejected, (state, action) => {
				state.currentLoading = false;
				state.currentError = action.payload ?? 'No se pudo obtener el producto';
			})
			.addCase(createProduct.pending, (state) => {
				state.creating = true;
				state.error = null;
			})
			.addCase(createProduct.fulfilled, (state, action) => {
				state.creating = false;
				state.items.unshift(action.payload);
				state.stats = computeProductStats(state.items);
				state.meta.total += 1;
			})
			.addCase(createProduct.rejected, (state, action) => {
				state.creating = false;
				state.error = action.payload ?? 'No se pudo crear el producto';
			})
			.addCase(updateProduct.pending, (state) => {
				state.updating = true;
				state.error = null;
			})
			.addCase(updateProduct.fulfilled, (state, action) => {
				state.updating = false;
				const index = state.items.findIndex((product) => product.id === action.payload.id);
				if (index !== -1) {
					state.items[index] = action.payload;
					state.stats = computeProductStats(state.items);
				}
				if (state.current && state.current.id === action.payload.id) {
					state.current = action.payload;
				}
			})
			.addCase(updateProduct.rejected, (state, action) => {
				state.updating = false;
				state.error = action.payload ?? 'No se pudo actualizar el producto';
			})
			.addCase(deleteProduct.pending, (state) => {
				state.deleting = true;
				state.error = null;
			})
			.addCase(deleteProduct.fulfilled, (state, action) => {
				state.deleting = false;
				state.items = state.items.filter((product) => product.id !== action.payload);
				state.meta.total = Math.max(0, state.meta.total - 1);
				state.stats = computeProductStats(state.items);
				if (state.current && state.current.id === action.payload) {
					state.current = null;
				}
			})
			.addCase(deleteProduct.rejected, (state, action) => {
				state.deleting = false;
				state.error = action.payload ?? 'No se pudo eliminar el producto';
			});
	},
});

export const { clearProductsError } = productsSlice.actions;
export default productsSlice.reducer;
