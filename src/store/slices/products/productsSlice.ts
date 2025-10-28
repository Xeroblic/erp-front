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
import { validateFile, extractMediaUrl } from '@/utils/apiHelpers';
import { convertFileToWebP } from '@/components/helper/brand.helper';

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
	attributesLoading: boolean;
	attributesUpdating: boolean;
	attributesError: string | null;
	// media/library state
	mediaUploading: boolean;
	libraryLoading: boolean;
	mediaError: string | null;
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
	attributesLoading: false,
	attributesUpdating: false,
	attributesError: null,
	mediaUploading: false,
	libraryLoading: false,
	mediaError: null,
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

export const fetchProductsFromMultipleBranches = createAsyncThunk<
	{ items: IProduct[]; meta: ProductListMeta; stats: ProductsStateStats },
	{ branchIds: number[]; params?: FetchProductsParams },
	{ rejectValue: string }
>('products/fetchProductsFromMultipleBranches', async ({ branchIds, params }, { rejectWithValue }) => {
	try {
		// Hacer llamadas paralelas a todas las sucursales
		const promises = branchIds.map(branchId =>
			ApiService.fetchData<{
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
			})
		);

		const responses = await Promise.all(promises);

		// Combinar todos los productos de todas las sucursales
		const allRawItems: any[] = [];
		responses.forEach(response => {
			const rawItems = Array.isArray(response.data?.data)
				? response.data?.data
				: Array.isArray(response.data)
					? (response.data as any[])
					: [];
			allRawItems.push(...rawItems);
		});

		const items = allRawItems.map(normalizeProduct);

		// Meta para paginación combinada
		const meta: ProductListMeta = {
			total: items.length,
			current_page: params?.page ?? 1,
			per_page: params?.per_page ?? 15,
			last_page: Math.ceil(items.length / (params?.per_page ?? 15)),
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

export interface ProductAttributesPatchPayload {
	set?: Record<string, unknown>;
	unset?: string[];
}

export const fetchProductAttributes = createAsyncThunk<
	{ productId: number; attributes: Record<string, unknown> | null },
	{ branchId: number; productId: number },
	{ rejectValue: string }
>('products/fetchProductAttributes', async ({ branchId, productId }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ attributes?: Record<string, unknown> | null }>({
			url: `/branches/${branchId}/products/${productId}/attributes`,
			method: 'get',
		});

		return {
			productId,
			attributes: (response.data?.attributes as Record<string, unknown> | null) ?? null,
		};
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ??
			error?.message ??
			'No se pudieron cargar los atributos del producto',
		);
	}
});

export const patchProductAttributes = createAsyncThunk<
	{ productId: number; attributes: Record<string, unknown> | null },
	{ branchId: number; productId: number; payload: ProductAttributesPatchPayload },
	{ rejectValue: string }
>(
	'products/patchProductAttributes',
	async ({ branchId, productId, payload }, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<
				{ attributes?: Record<string, unknown> | null },
				ProductAttributesPatchPayload
			>({
				url: `/branches/${branchId}/products/${productId}/attributes`,
				method: 'patch',
				data: payload,
			});

			return {
				productId,
				attributes: (response.data?.attributes as Record<string, unknown> | null) ?? null,
			};
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
				error?.message ??
				'No se pudieron actualizar los atributos del producto',
			);
		}
	},
);

export const createProduct = createAsyncThunk<
	IProduct,
	{ branchId: number; data: Partial<IProduct>; categoryIds: number[] },
	{ rejectValue: any }
>('products/createProduct', async ({ branchId, data, categoryIds }, { rejectWithValue }) => {
	try {
		// Build a permissive payload: only send defined, non-null values.
		const body: Record<string, any> = {};

		const assignIfDefined = (key: string, val: any) => {
			if (val !== undefined && val !== null && val !== '') body[key] = val;
		};

		assignIfDefined('sku', data.sku);
		assignIfDefined('name', data.name);
		if (data.price !== undefined && data.price !== null) body.price = Number(data.price);
		assignIfDefined('commercial_sku', data.commercial_sku);
		assignIfDefined('barcode', data.barcode);
		if (data.brand_id !== undefined && data.brand_id !== null) body.brand_id = Number(data.brand_id);
		if (data.branch_id !== undefined && data.branch_id !== null) body.branch_id = Number(data.branch_id);
		assignIfDefined('product_type', data.product_type);
		if (data.serial_tracking !== undefined) body.serial_tracking = Boolean(data.serial_tracking);
		assignIfDefined('condition_policy', data.condition_policy);
		assignIfDefined('uom', data.uom);
		if (data.warranty_months !== undefined) body.warranty_months = Number(data.warranty_months);
		if (data.cost !== undefined) body.cost = Number(data.cost);
		if (data.offer_price !== undefined) body.offer_price = Number(data.offer_price);
		if (data.attributes_json !== undefined && data.attributes_json !== null) body.attributes_json = data.attributes_json;
		if (data.is_active !== undefined) body.is_active = Boolean(data.is_active);
		if (data.product_status !== undefined) body.product_status = data.product_status;
		if (data.snippet_description !== undefined) body.snippet_description = data.snippet_description;
		if (data.short_description !== undefined) body.short_description = data.short_description;
		if (data.long_description !== undefined) body.long_description = data.long_description;
		if (data.stock !== undefined) body.stock = Number(data.stock);

		if (Array.isArray(categoryIds) && categoryIds.length) body.category_ids = categoryIds;

		const response = await ApiService.fetchData<{ data?: any }, any>({
			url: `/branches/${branchId}/products`,
			method: 'post',
			data: body,
		});

		const raw = response.data?.data ?? response.data;
		return normalizeProduct(raw ?? body);
	} catch (error: any) {
		// Forward the server response body when possible so callers can map validation errors
		const payload = error?.response?.data ?? { message: error?.message ?? 'No se pudo crear el producto' };
		return rejectWithValue(payload);
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

// Upload multiple files directly to a product (FormData files[])
export const uploadProductMedia = createAsyncThunk<
	string | null,
	{ branchId: number; productId: number; file: File; meta?: string },
	{ rejectValue: string }
>('products/uploadProductMedia', async ({ branchId, productId, file, meta }, { rejectWithValue }) => {
	try {
		const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
		const v = validateFile(file, { maxKB: 8192, allowedMimes: allowed });
		if (!v.ok) return null;

		const processed = await convertFileToWebP(file);
		if (!processed) return null;

		const formData = new FormData();
		formData.append('files[]', processed, processed.name);
		if (meta) formData.append('meta', meta);

		const response = await ApiService.fetchData<{ data?: any }, FormData>({
			url: `/branches/${branchId}/products/${productId}/media/upload-multiple`,
			method: 'post',
			data: formData,
		});

		const payload = response.data?.data ?? response.data;
		const url = extractMediaUrl(payload);
		return url;
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'Error uploading media');
	}
});

// Attach existing library media to a product
export const attachProductMediaFromLibrary = createAsyncThunk<
	{ id?: number; url?: string; thumb_url?: string } | null,
	{ branchId: number; productId: number; payload: { library_media_id: number; collection?: string; sort_order?: number; alt_text?: string } },
	{ rejectValue: string }
>('products/attachProductMediaFromLibrary', async ({ branchId, productId, payload }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ status?: string; id?: number; url?: string; thumb_url?: string }, any>({
			url: `/branches/${branchId}/products/${productId}/media/attach-from-library`,
			method: 'post',
			data: payload,
		});
		return response.data ?? null;
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'Error attaching media from library');
	}
});

// Fetch branch library media (simple wrapper)
export const fetchBranchLibraryMedia = createAsyncThunk<
	{ data: any[]; meta?: any },
	{ branchId: number; params?: Record<string, any> },
	{ rejectValue: string }
>('products/fetchBranchLibraryMedia', async ({ branchId, params }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: any[]; meta?: any }>({
			url: `/branches/${branchId}/library/media`,
			method: 'get',
			params,
		});
		const dataArr = Array.isArray(response.data?.data) ? response.data?.data : Array.isArray(response.data) ? response.data : [];
		return { data: dataArr ?? [], meta: response.data?.meta };
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'Error fetching library media');
	}
});

// Delete attributes via query param or body
export const deleteProductAttributes = createAsyncThunk<
	boolean,
	{ branchId: number; productId: number; paths?: string[]; path?: string },
	{ rejectValue: string }
>('products/deleteProductAttributes', async ({ branchId, productId, paths, path }, { rejectWithValue }) => {
	try {
		const params: Record<string, any> = {};
		if (path) params.path = path;
		if (paths) params['paths[]'] = paths;

		await ApiService.fetchData({
			url: `/branches/${branchId}/products/${productId}/attributes`,
			method: 'delete',
			params,
		});
		return true;
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'Error deleting attributes');
	}
});

// Delete product media/image
export const deleteProductMedia = createAsyncThunk<
	boolean,
	{ branchId: number; productId: number; mediaId: number },
	{ rejectValue: string }
>('products/deleteProductMedia', async ({ branchId, productId, mediaId }, { rejectWithValue }) => {
	try {
		await ApiService.fetchData({
			url: `/branches/${branchId}/media/${mediaId}`,
			method: 'delete',
		});
		return true;
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'Error al eliminar la imagen');
	}
});

// Set product main image
export const setProductMainImage = createAsyncThunk<
	IProduct,
	{ branchId: number; productId: number; mediaId: number },
	{ rejectValue: string }
>('products/setProductMainImage', async ({ branchId, productId, mediaId }, { rejectWithValue }) => {
	try {
		// El backend espera que la imagen principal se suba directamente a 'main'
		// Solución: Descargar la imagen de gallery y re-subirla a 'main'

		// Paso 1: Obtener el producto actual para acceder a la imagen de gallery
		const currentProductResponse = await ApiService.fetchData<{ data: any }>({
			url: `/branches/${branchId}/products/${productId}`,
			method: 'get',
		});
		const currentProduct = normalizeProduct(currentProductResponse.data?.data ?? currentProductResponse.data);

		// Paso 2: Buscar la imagen en la gallery por su ID
		const galleryImage = currentProduct.gallery?.find((img) => img.id === mediaId);

		if (!galleryImage) {
			return rejectWithValue('La imagen no se encuentra en la galería');
		}

		// Paso 3: Descargar la imagen como blob
		// Como la URL es /storage/media/... y requiere autenticación,
		// extraemos la ruta relativa y usamos un endpoint del backend
		// O, si no hay endpoint, usamos fetch con credentials
		let imageBlob: Blob;

		try {
			// Intentar descargar con credentials para incluir cookies de sesión
			const response = await fetch(galleryImage.url, {
				credentials: 'include', // Incluye cookies de autenticación
				headers: {
					'Accept': 'image/*',
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			imageBlob = await response.blob();
		} catch (fetchError) {
			// Si falla con fetch, intentar con ApiService
			// Convertir la URL de storage a una relativa
			const urlPath = galleryImage.url.replace(/^https?:\/\/[^/]+/, '');

			const imageResponse = await ApiService.fetchData<Blob>({
				url: urlPath,
				method: 'get',
				responseType: 'blob',
			});

			imageBlob = imageResponse.data as unknown as Blob;
		}

		// Paso 4: Crear un File desde el blob
		const fileName = galleryImage.url.split('/').pop()?.split('?')[0] || `image-${mediaId}.jpg`;
		const imageFile = new File([imageBlob], fileName, { type: imageBlob.type });

		// Paso 5: Subir la imagen a la colección 'main' usando uploadMultipleDirect
		const formData = new FormData();
		formData.append('files', imageFile);
		formData.append('collection', 'main');
		formData.append('alt_text', galleryImage.alt || 'Imagen principal');

		await ApiService.fetchData({
			url: `/branches/${branchId}/products/${productId}/media/upload-multiple`,
			method: 'post',
			data: formData,
		});

		// Paso 6: Eliminar la imagen de gallery
		try {
			await ApiService.fetchData({
				url: `/branches/${branchId}/media/${mediaId}`,
				method: 'delete',
			});
		} catch (deleteError) {
			// Si falla la eliminación, no es crítico
			console.warn('No se pudo eliminar la imagen de gallery:', deleteError);
		}

		// Paso 7: Recargar el producto para obtener el estado actualizado
		const finalProductResponse = await ApiService.fetchData<{ data: any }>({
			url: `/branches/${branchId}/products/${productId}`,
			method: 'get',
		});

		return normalizeProduct(finalProductResponse.data?.data ?? finalProductResponse.data);
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'Error al establecer imagen principal');
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
			// Casos para fetchProductsFromMultipleBranches
			.addCase(fetchProductsFromMultipleBranches.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchProductsFromMultipleBranches.fulfilled, (state, action) => {
				state.loading = false;
				state.items = action.payload.items;
				state.meta = action.payload.meta;
				state.stats = action.payload.stats;
			})
			.addCase(fetchProductsFromMultipleBranches.rejected, (state, action) => {
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
			.addCase(fetchProductAttributes.pending, (state) => {
				state.attributesLoading = true;
				state.attributesError = null;
			})
			.addCase(fetchProductAttributes.fulfilled, (state, action) => {
				state.attributesLoading = false;
				state.attributesError = null;
				const { productId, attributes } = action.payload;
				if (state.current && state.current.id === productId) {
					state.current.attributes_json = attributes;
				}
				const index = state.items.findIndex((product) => product.id === productId);
				if (index !== -1) {
					state.items[index].attributes_json = attributes;
				}
			})
			.addCase(fetchProductAttributes.rejected, (state, action) => {
				state.attributesLoading = false;
				state.attributesError =
					action.payload ?? 'No se pudieron cargar los atributos del producto';
			})
			.addCase(patchProductAttributes.pending, (state) => {
				state.attributesUpdating = true;
				state.attributesError = null;
			})
			.addCase(patchProductAttributes.fulfilled, (state, action) => {
				state.attributesUpdating = false;
				state.attributesError = null;
				const { productId, attributes } = action.payload;
				if (state.current && state.current.id === productId) {
					state.current.attributes_json = attributes;
				}
				const index = state.items.findIndex((product) => product.id === productId);
				if (index !== -1) {
					state.items[index].attributes_json = attributes;
				}
			})
			.addCase(patchProductAttributes.rejected, (state, action) => {
				state.attributesUpdating = false;
				state.attributesError =
					action.payload ?? 'No se pudieron actualizar los atributos del producto';
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

		// Media thunks
		builder
			.addCase(uploadProductMedia.pending, (state) => {
				state.mediaUploading = true;
				state.mediaError = null;
			})
			.addCase(uploadProductMedia.fulfilled, (state) => {
				state.mediaUploading = false;
				state.mediaError = null;
			})
			.addCase(uploadProductMedia.rejected, (state, action) => {
				state.mediaUploading = false;
				state.mediaError = action.payload ?? 'Error al subir media';
			})
			.addCase(fetchBranchLibraryMedia.pending, (state) => {
				state.libraryLoading = true;
			})
			.addCase(fetchBranchLibraryMedia.fulfilled, (state) => {
				state.libraryLoading = false;
			})
			.addCase(fetchBranchLibraryMedia.rejected, (state) => {
				state.libraryLoading = false;
			})
			.addCase(attachProductMediaFromLibrary.pending, (state) => {
				state.mediaUploading = true;
			})
			.addCase(attachProductMediaFromLibrary.fulfilled, (state) => {
				state.mediaUploading = false;
			})
			.addCase(attachProductMediaFromLibrary.rejected, (state, action) => {
				state.mediaUploading = false;
				state.mediaError = action.payload ?? 'Error al adjuntar media';
			})
			.addCase(deleteProductAttributes.pending, (state) => {
				state.attributesUpdating = true;
			})
			.addCase(deleteProductAttributes.fulfilled, (state) => {
				state.attributesUpdating = false;
			})
			.addCase(deleteProductAttributes.rejected, (state, action) => {
				state.attributesUpdating = false;
				state.attributesError = action.payload ?? 'Error al borrar atributos';
			})
			.addCase(deleteProductMedia.pending, (state) => {
				state.mediaUploading = true;
				state.mediaError = null;
			})
			.addCase(deleteProductMedia.fulfilled, (state) => {
				state.mediaUploading = false;
			})
			.addCase(deleteProductMedia.rejected, (state, action) => {
				state.mediaUploading = false;
				state.mediaError = action.payload ?? 'Error al eliminar imagen';
			})
			.addCase(setProductMainImage.pending, (state) => {
				state.updating = true;
			})
			.addCase(setProductMainImage.fulfilled, (state, action) => {
				state.updating = false;
				state.current = action.payload;
			})
			.addCase(setProductMainImage.rejected, (state, action) => {
				state.updating = false;
				state.mediaError = action.payload ?? 'Error al establecer imagen principal';
			});
	},
});

export const { clearProductsError } = productsSlice.actions;
export default productsSlice.reducer;
