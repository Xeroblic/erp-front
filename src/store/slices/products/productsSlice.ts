import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type {
	FetchProductsParams,
	IProduct,
	ProductInventoryCriticalProduct,
	ProductInventorySummary,
	ProductInventorySummaryResponse,
	ProductListMeta,
	ProductsStateStats,
	UpdateProductPayload,
	IProductResponse,
	IProductListResponse,
	IProductAttributesResponse,
	IMediaUploadResponse,
	ILibraryMediaItem,
	ILibraryMediaResponse,
	ILibraryMediaAttachResponse,
} from '@/interface/product.interface';
import {
	buildUpdatePayload,
	computeProductStats,
	normalizeProduct,
	serializeFilters,
} from '@/components/helper/product.helper';
import { PRODUCT_EMPTY_INVENTORY_SUMMARY, PRODUCT_EMPTY_STATS } from '@/constants/product.constant';
import { validateFile, extractMediaUrl } from '@/utils/apiHelpers';
import { convertFileToWebP } from '@/components/helper/brand.helper';
import { toast } from 'react-toastify';

// ---------------------------------------------------------------------------
// Entity param: determines whether the URL uses /branches or /subsidiaries
// ---------------------------------------------------------------------------
export type ProductEntityParam = 'branches' | 'subsidiaries';

export interface ProductsState {
	items: IProduct[];
	meta: ProductListMeta;
	stats: ProductsStateStats;
	inventory: ProductInventorySummary;
	criticalProducts: ProductInventoryCriticalProduct[];
	current: IProduct | null;
	loading: boolean;
	inventoryLoading: boolean;
	currentLoading: boolean;
	creating: boolean;
	updating: boolean;
	deleting: boolean;
	error: string | null;
	currentError: string | null;
	inventoryError: string | null;
	attributesLoading: boolean;
	attributesUpdating: boolean;
	attributesError: string | null;
	// media/library state
	mediaUploading: boolean;
	libraryLoading: boolean;
	mediaError: string | null;
}

interface ApiValidationError {
	message: string;
	errors?: Record<string, string[]>;
}

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | undefined => {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return value as UnknownRecord;
	}
	return undefined;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
	const errorRecord = asRecord(error);
	const responseRecord = asRecord(errorRecord?.response);
	const message = asRecord(responseRecord?.data);
	const msgFromResponse = message?.message;
	if (typeof msgFromResponse === 'string' && msgFromResponse.trim()) {
		return msgFromResponse;
	}
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}
	return fallback;
};

const getResponseMessage = (error: unknown): string | null => {
	const errorRecord = asRecord(error);
	const responseRecord = asRecord(errorRecord?.response);
	const message = asRecord(responseRecord?.data);
	const msgFromResponse = message?.message;
	if (typeof msgFromResponse === 'string' && msgFromResponse.trim()) {
		return msgFromResponse;
	}
	return null;
};

const getErrorPayload = (error: unknown, fallback: string): ApiValidationError => {
	const errorRecord = asRecord(error);
	const responseRecord = asRecord(errorRecord?.response);
	const responseData = asRecord(responseRecord?.data);
	if (responseData) {
		const message =
			typeof responseData.message === 'string' && responseData.message.trim()
				? responseData.message
				: fallback;
		const errors = asRecord(responseData.errors) as Record<string, string[]> | undefined;
		return { message, errors };
	}
	if (error instanceof Error && error.message.trim()) {
		return { message: error.message };
	}
	return { message: fallback };
};

const getErrorStatus = (error: unknown): number | null => {
	const errorRecord = asRecord(error);
	const responseRecord = asRecord(errorRecord?.response);
	const status = responseRecord?.status;
	if (typeof status === 'number' && Number.isFinite(status)) {
		return status;
	}
	return null;
};

const initialState: ProductsState = {
	items: [],
	meta: {
		total: 0,
		current_page: 1,
		per_page: 15,
		last_page: 1,
	},
	stats: { ...PRODUCT_EMPTY_STATS },
	inventory: { ...PRODUCT_EMPTY_INVENTORY_SUMMARY },
	criticalProducts: [],
	current: null,
	loading: false,
	inventoryLoading: false,
	currentLoading: false,
	creating: false,
	updating: false,
	deleting: false,
	error: null,
	currentError: null,
	inventoryError: null,
	attributesLoading: false,
	attributesUpdating: false,
	attributesError: null,
	mediaUploading: false,
	libraryLoading: false,
	mediaError: null,
};

const parseProductsResponse = (
	response: { data?: unknown; meta?: Partial<ProductListMeta> & UnknownRecord },
	params?: FetchProductsParams,
) => {
	const payload = response?.data ?? response ?? {};
	const payloadRecord = asRecord(payload);
	const payloadData = payloadRecord?.data;
	const rawItems = Array.isArray(payloadData)
		? payloadData
		: Array.isArray(payload)
			? payload
			: [];

	const items = rawItems.map(normalizeProduct);

	const metaSource = asRecord(payloadRecord?.meta) ?? {};
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
};

const getOptionalBranchFilter = (params?: FetchProductsParams): Record<string, number> => {
	const maybeBranchId = (params as Record<string, unknown> | undefined)?.branchId;
	if (typeof maybeBranchId === 'number' && Number.isFinite(maybeBranchId)) {
		return { branchId: maybeBranchId };
	}
	return {};
};

export const fetchProductsList = createAsyncThunk<
	{ items: IProduct[]; meta: ProductListMeta; stats: ProductsStateStats },
	{ entityParam: ProductEntityParam; entityId: number; params?: FetchProductsParams },
	{ rejectValue: string }
>('products/fetchProductsList', async ({ entityParam, entityId, params }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<IProductListResponse>({
			url: `/${entityParam}/${entityId}/products`,
			method: 'get',
			params: {
				page: params?.page ?? 1,
				per_page: params?.per_page ?? 15,
				...serializeFilters(params ?? {}),
				...getOptionalBranchFilter(params),
			},
		});

		return parseProductsResponse(response, params);
	} catch (error: unknown) {
		return rejectWithValue(getErrorMessage(error, 'No se pudieron cargar los productos'));
	}
});

export const fetchInventorySummary = createAsyncThunk<
	{
		stats: ProductsStateStats;
		inventory: ProductInventorySummary;
		criticalProducts: ProductInventoryCriticalProduct[];
		entityId: number;
	},
	{ entityParam: ProductEntityParam; entityId: number; criticalThreshold?: number },
	{ rejectValue: string }
>(
	'products/fetchInventorySummary',
	async ({ entityParam, entityId, criticalThreshold }, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<ProductInventorySummaryResponse>({
				url: `/${entityParam}/${entityId}/products/summary`,
				method: 'get',
				params:
					typeof criticalThreshold === 'number'
						? { critical_threshold: criticalThreshold }
						: undefined,
			});

			const payload = response.data ?? {};
			const summary = payload.summary ?? {};
			const reqParams = payload.params ?? {};

			const stats: ProductsStateStats = {
				total: Number(summary.products_total ?? 0),
				actives: Number(summary.active ?? 0),
				inactives: Number(summary.inactive ?? 0),
				with_offer: Number(summary.with_offer ?? 0),
				serial_tracked: Number(
					summary.serial_tracking_count ?? summary.with_serial_tracking ?? 0,
				),
			};

			const inventory: ProductInventorySummary = {
				branchId:
					Number(payload.branch_id ?? payload.subsidiary_id ?? entityId) || entityId,
				criticalThreshold:
					typeof reqParams?.critical_threshold === 'number'
						? Number(reqParams.critical_threshold)
						: typeof criticalThreshold === 'number'
							? criticalThreshold
							: PRODUCT_EMPTY_INVENTORY_SUMMARY.criticalThreshold,
				stockTotal: Number(summary.stock_total ?? 0),
				stockAverage: Number(summary.stock_average ?? 0),
				lowStockCount: Number(summary.low_stock_count ?? 0),
				outOfStock: Number(summary.out_of_stock ?? 0),
				withStockAvailable: Number(summary.with_stock_available ?? 0),
				syncedProducts: Number(summary.synced_products ?? summary.products_total ?? 0),
				serialTrackingCount: Number(
					summary.serial_tracking_count ?? summary.with_serial_tracking ?? 0,
				),
				// Campos ampliados
				productsTotal: Number(summary.products_total ?? 0),
				totalChildrenProducts: Number(summary.total_children_products ?? 0),
				productsTotalAll: Number(summary.products_total_all ?? 0),
				withoutSerialTracking: Number(summary.without_serial_tracking ?? 0),
				stockWithoutSerials: Number(summary.stock_without_serials ?? 0),
				serialsAvailable: Number(summary.serials_available ?? 0),
				serialsOnHold: Number(summary.serials_on_hold ?? 0),
				serialsReserved: Number(summary.serials_reserved ?? 0),
				serialsInQuotation: Number(summary.serials_in_quotation ?? 0),
				serialsSold: Number(summary.serials_sold ?? 0),
				serialsTotalApproved: Number(summary.serials_total_approved ?? 0),
			};

			const criticalProducts: ProductInventoryCriticalProduct[] = Array.isArray(
				payload.critical_products,
			)
				? payload.critical_products
						.map((item) => ({
							id: Number(item?.id ?? 0),
							name: String(item?.name ?? ''),
							sku: String(item?.sku ?? ''),
							brand_name:
								item?.brand_name !== undefined && item?.brand_name !== null
									? String(item.brand_name)
									: null,
							stock: (() => {
								const source = asRecord(item);
								if (!source || source.stock === undefined || source.stock === null)
									return null;
								const num = Number(source.stock);
								return Number.isFinite(num) ? num : null;
							})(),
						}))
						.filter((item) => Number.isFinite(item.id) && item.id > 0)
				: [];

			return { stats, inventory, criticalProducts, entityId };
		} catch (error: unknown) {
			return rejectWithValue(
				getErrorMessage(error, 'No se pudo cargar el resumen de inventario'),
			);
		}
	},
);

export const fetchProductById = createAsyncThunk<
	IProduct,
	{ entityParam: ProductEntityParam; entityId: number; productId: number },
	{ rejectValue: string }
>(
	'products/fetchProductById',
	async ({ entityParam, entityId, productId }, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<IProductResponse>({
				url: `/${entityParam}/${entityId}/products/${productId}`,
				method: 'get',
			});

			const raw = response.data?.data ?? response.data;
			return normalizeProduct((raw as IProduct) ?? { id: productId, branch_id: entityId });
		} catch (error: unknown) {
			if (getErrorStatus(error) === 404) {
				const backendMessage = getResponseMessage(error);
				const message =
					backendMessage && backendMessage.trim().length > 0
						? backendMessage
						: 'El producto no esta asignado a esta sucursal';
				toast.error(message);
				return rejectWithValue(message);
			}
			return rejectWithValue(getErrorMessage(error, 'No se pudo obtener el producto'));
		}
	},
);

export interface ProductAttributesPatchPayload {
	set?: Record<string, unknown>;
	unset?: string[];
}

export const fetchProductAttributes = createAsyncThunk<
	{ productId: number; attributes: Record<string, unknown> | null },
	{ entityParam: ProductEntityParam; entityId: number; productId: number },
	{ rejectValue: string }
>(
	'products/fetchProductAttributes',
	async ({ entityParam, entityId, productId }, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<IProductAttributesResponse>({
				url: `/${entityParam}/${entityId}/products/${productId}/attributes`,
				method: 'get',
			});

			return {
				productId,
				attributes: response.data?.attributes ?? null,
			};
		} catch (error: unknown) {
			return rejectWithValue(
				getErrorMessage(error, 'No se pudieron cargar los atributos del producto'),
			);
		}
	},
);

export const patchProductAttributes = createAsyncThunk<
	{ productId: number; attributes: Record<string, unknown> | null },
	{
		entityParam: ProductEntityParam;
		entityId: number;
		productId: number;
		payload: ProductAttributesPatchPayload;
	},
	{ rejectValue: string }
>(
	'products/patchProductAttributes',
	async ({ entityParam, entityId, productId, payload }, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<
				IProductAttributesResponse,
				ProductAttributesPatchPayload
			>({
				url: `/${entityParam}/${entityId}/products/${productId}/attributes`,
				method: 'patch',
				data: payload,
			});

			return {
				productId,
				attributes: response.data?.attributes ?? null,
			};
		} catch (error: unknown) {
			return rejectWithValue(
				getErrorMessage(error, 'No se pudieron actualizar los atributos del producto'),
			);
		}
	},
);

export const createProduct = createAsyncThunk<
	IProduct,
	{
		entityParam: ProductEntityParam;
		entityId: number;
		data: Partial<IProduct>;
		categoryIds: number[];
	},
	{ rejectValue: ApiValidationError }
>(
	'products/createProduct',
	async ({ entityParam, entityId, data, categoryIds }, { rejectWithValue }) => {
		try {
			const body: Record<string, unknown> = {};

			const assignIfDefined = (key: string, val: unknown) => {
				if (val !== undefined && val !== null && val !== '') body[key] = val;
			};

			assignIfDefined('sku', data.sku);
			assignIfDefined('name', data.name);
			if (data.price !== undefined && data.price !== null) body.price = Number(data.price);
			assignIfDefined('commercial_sku', data.commercial_sku);
			assignIfDefined('barcode', data.barcode);
			if (data.brand_id !== undefined && data.brand_id !== null)
				body.brand_id = Number(data.brand_id);
			if (data.branch_id !== undefined && data.branch_id !== null)
				body.branch_id = Number(data.branch_id);
			assignIfDefined('product_type', data.product_type);
			if (data.serial_tracking !== undefined)
				body.serial_tracking = Boolean(data.serial_tracking);
			assignIfDefined('condition_policy', data.condition_policy);
			assignIfDefined('uom', data.uom);
			if (data.warranty_months !== undefined)
				body.warranty_months = Number(data.warranty_months);
			if (data.cost !== undefined) body.cost = Number(data.cost);
			if (data.offer_price !== undefined) body.offer_price = Number(data.offer_price);
			if (data.attributes_json !== undefined && data.attributes_json !== null)
				body.attributes_json = data.attributes_json;
			if (data.is_active !== undefined) body.is_active = Boolean(data.is_active);
			if (data.product_status !== undefined) body.product_status = data.product_status;
			if (data.snippet_description !== undefined)
				body.snippet_description = data.snippet_description;
			if (data.short_description !== undefined)
				body.short_description = data.short_description;
			if (data.long_description !== undefined) body.long_description = data.long_description;
			if (data.stock !== undefined) body.stock = Number(data.stock);

			if (Array.isArray(categoryIds) && categoryIds.length) body.category_ids = categoryIds;

			const response = await ApiService.fetchData<IProductResponse, Record<string, unknown>>({
				url: `/${entityParam}/${entityId}/products`,
				method: 'post',
				data: body,
			});

			const raw = response.data?.data ?? response.data;
			return normalizeProduct((raw as IProduct) ?? body);
		} catch (error: unknown) {
			return rejectWithValue(getErrorPayload(error, 'No se pudo crear el producto'));
		}
	},
);

export const updateProduct = createAsyncThunk<
	IProduct,
	{
		entityParam: ProductEntityParam;
		entityId: number;
		productId: number;
		data: Partial<IProduct>;
		categoryIds?: number[];
	},
	{ rejectValue: string }
>(
	'products/updateProduct',
	async ({ entityParam, entityId, productId, data, categoryIds }, { rejectWithValue }) => {
		try {
			const body = buildUpdatePayload(productId, data, categoryIds);

			const response = await ApiService.fetchData<IProductResponse, UpdateProductPayload>({
				url: `/${entityParam}/${entityId}/products/${productId}`,
				method: 'patch',
				data: body,
			});

			const raw = response.data?.data ?? response.data;
			return normalizeProduct((raw as IProduct) ?? { ...data, id: productId });
		} catch (error: unknown) {
			return rejectWithValue(getErrorMessage(error, 'No se pudo actualizar el producto'));
		}
	},
);

export const deleteProduct = createAsyncThunk<
	number,
	{ entityParam: ProductEntityParam; entityId: number; productId: number },
	{ rejectValue: string }
>('products/deleteProduct', async ({ entityParam, entityId, productId }, { rejectWithValue }) => {
	try {
		await ApiService.fetchData({
			url: `/${entityParam}/${entityId}/products/${productId}`,
			method: 'delete',
		});

		return productId;
	} catch (error: unknown) {
		return rejectWithValue(getErrorMessage(error, 'No se pudo eliminar el producto'));
	}
});

export const toggleProductStatus = createAsyncThunk<
	IProduct,
	{ entityParam: ProductEntityParam; entityId: number; productId: number },
	{ rejectValue: string }
>(
	'products/toggleProductStatus',
	async ({ entityParam, entityId, productId }, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<IProductResponse>({
				url: `/${entityParam}/${entityId}/products/${productId}/toggle-status`,
				method: 'patch',
			});
			const raw = response.data?.data ?? response.data;
			return normalizeProduct((raw as IProduct) ?? { id: productId, branch_id: entityId });
		} catch (error: unknown) {
			return rejectWithValue(
				getErrorMessage(error, 'No se pudo cambiar el estado del producto'),
			);
		}
	},
);

export const fetchSaleableProducts = createAsyncThunk<
	IProduct[],
	{ entityParam: ProductEntityParam; entityId: number },
	{ rejectValue: string }
>('products/fetchSaleableProducts', async ({ entityParam, entityId }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<IProductListResponse>({
			url: `/${entityParam}/${entityId}/products/saleables`,
			method: 'get',
		});
		const rawItems = Array.isArray(response.data?.data)
			? response.data?.data
			: Array.isArray(response.data)
				? response.data
				: [];
		return (rawItems as IProduct[]).map(normalizeProduct);
	} catch (error: unknown) {
		return rejectWithValue(
			getErrorMessage(error, 'No se pudieron cargar los productos vendibles'),
		);
	}
});

export const uploadProductMedia = createAsyncThunk<
	string | null,
	{
		entityParam: ProductEntityParam;
		entityId: number;
		productId: number;
		file: File;
		meta?: string;
	},
	{ rejectValue: string }
>(
	'products/uploadProductMedia',
	async ({ entityParam, entityId, productId, file, meta }, { rejectWithValue }) => {
		try {
			const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
			const v = validateFile(file, { maxKB: 8192, allowedMimes: allowed });
			if (!v.ok) return null;

			const processed = await convertFileToWebP(file);
			if (!processed) return null;

			const formData = new FormData();
			formData.append('files[]', processed, processed.name);
			if (meta) formData.append('meta', meta);

			const response = await ApiService.fetchData<IMediaUploadResponse, FormData>({
				url: `/${entityParam}/${entityId}/products/${productId}/media/upload-multiple`,
				method: 'post',
				data: formData,
			});

			const payload = response.data?.data ?? response.data;
			const url = extractMediaUrl(payload);
			return url;
		} catch (error: unknown) {
			return rejectWithValue(getErrorMessage(error, 'Error uploading media'));
		}
	},
);

export const attachProductMediaFromLibrary = createAsyncThunk<
	{ id?: number; url?: string; thumb_url?: string } | null,
	{
		entityParam: ProductEntityParam;
		entityId: number;
		productId: number;
		payload: {
			library_media_id: number;
			collection?: string;
			sort_order?: number;
			alt_text?: string;
		};
	},
	{ rejectValue: string }
>(
	'products/attachProductMediaFromLibrary',
	async ({ entityParam, entityId, productId, payload }, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<
				ILibraryMediaAttachResponse,
				{
					library_media_id: number;
					collection?: string;
					sort_order?: number;
					alt_text?: string;
				}
			>({
				url: `/${entityParam}/${entityId}/products/${productId}/media/attach-from-library`,
				method: 'post',
				data: payload,
			});
			return response.data ?? null;
		} catch (error: unknown) {
			return rejectWithValue(getErrorMessage(error, 'Error attaching media from library'));
		}
	},
);

export const fetchLibraryMedia = createAsyncThunk<
	{ data: ILibraryMediaItem[]; meta?: unknown },
	{ entityParam: ProductEntityParam; entityId: number; params?: Record<string, unknown> },
	{ rejectValue: string }
>('products/fetchLibraryMedia', async ({ entityParam, entityId, params }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<ILibraryMediaResponse>({
			url: `/${entityParam}/${entityId}/library/media`,
			method: 'get',
			params,
		});
		const dataArr = Array.isArray(response.data?.data)
			? response.data?.data
			: Array.isArray(response.data)
				? response.data
				: [];
		return { data: (dataArr as ILibraryMediaItem[]) ?? [], meta: response.data?.meta };
	} catch (error: unknown) {
		return rejectWithValue(getErrorMessage(error, 'Error fetching library media'));
	}
});

export const deleteProductAttributes = createAsyncThunk<
	boolean,
	{
		entityParam: ProductEntityParam;
		entityId: number;
		productId: number;
		paths?: string[];
		path?: string;
	},
	{ rejectValue: string }
>(
	'products/deleteProductAttributes',
	async ({ entityParam, entityId, productId, paths, path }, { rejectWithValue }) => {
		try {
			const params: Record<string, string | string[]> = {};
			if (path) params.path = path;
			if (paths) params['paths[]'] = paths;

			await ApiService.fetchData({
				url: `/${entityParam}/${entityId}/products/${productId}/attributes`,
				method: 'delete',
				params,
			});
			return true;
		} catch (error: unknown) {
			return rejectWithValue(getErrorMessage(error, 'Error deleting attributes'));
		}
	},
);

export const deleteProductMedia = createAsyncThunk<
	boolean,
	{ entityParam: ProductEntityParam; entityId: number; productId: number; mediaId: number },
	{ rejectValue: string }
>(
	'products/deleteProductMedia',
	async ({ entityParam, entityId, productId, mediaId }, { rejectWithValue }) => {
		try {
			await ApiService.fetchData({
				url: `/${entityParam}/${entityId}/media/${mediaId}`,
				method: 'delete',
				data: { product_id: productId },
			});
			return true;
		} catch (error: unknown) {
			return rejectWithValue(getErrorMessage(error, 'Error al eliminar la imagen'));
		}
	},
);

export const setProductMainImage = createAsyncThunk<
	IProduct,
	{ entityParam: ProductEntityParam; entityId: number; productId: number; mediaId: number },
	{ rejectValue: string }
>(
	'products/setProductMainImage',
	async ({ entityParam, entityId, productId, mediaId }, { rejectWithValue }) => {
		try {
			const currentProductResponse = await ApiService.fetchData<{ data: unknown }>({
				url: `/${entityParam}/${entityId}/products/${productId}`,
				method: 'get',
			});
			const currentProduct = normalizeProduct(
				currentProductResponse.data?.data ?? currentProductResponse.data,
			);

			const galleryImage = currentProduct.gallery?.find((img) => img.id === mediaId);
			if (!galleryImage) {
				return rejectWithValue('La imagen no se encuentra en la galería');
			}

			let imageBlob: Blob;
			try {
				const response = await fetch(galleryImage.url, {
					credentials: 'include',
					headers: { Accept: 'image/*' },
				});
				if (!response.ok)
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				imageBlob = await response.blob();
			} catch {
				const urlPath = galleryImage.url.replace(/^https?:\/\/[^/]+/, '');
				const imageResponse = await ApiService.fetchData<Blob>({
					url: urlPath,
					method: 'get',
					responseType: 'blob',
				});
				imageBlob = imageResponse.data as unknown as Blob;
			}

			const fileName =
				galleryImage.url.split('/').pop()?.split('?')[0] || `image-${mediaId}.jpg`;
			const imageFile = new File([imageBlob], fileName, { type: imageBlob.type });

			const formData = new FormData();
			formData.append('files', imageFile);
			formData.append('collection', 'main');
			formData.append('alt_text', galleryImage.alt || 'Imagen principal');

			await ApiService.fetchData({
				url: `/${entityParam}/${entityId}/products/${productId}/media/upload-multiple`,
				method: 'post',
				data: formData,
			});

			try {
				await ApiService.fetchData({
					url: `/${entityParam}/${entityId}/media/${mediaId}`,
					method: 'delete',
				});
			} catch (deleteError) {
				console.warn('No se pudo eliminar la imagen de gallery:', deleteError);
			}

			const finalProductResponse = await ApiService.fetchData<{ data: unknown }>({
				url: `/${entityParam}/${entityId}/products/${productId}`,
				method: 'get',
			});

			return normalizeProduct(finalProductResponse.data?.data ?? finalProductResponse.data);
		} catch (error: unknown) {
			return rejectWithValue(getErrorMessage(error, 'Error al establecer imagen principal'));
		}
	},
);

const productsSlice = createSlice({
	name: 'products',
	initialState,
	reducers: {
		clearProductsError: (state) => {
			state.error = null;
			state.currentError = null;
		},
		clearCurrentProduct: (state) => {
			state.current = null;
			state.currentError = null;
			state.currentLoading = false;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProductsList.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchProductsList.fulfilled, (state, action) => {
				state.loading = false;
				state.items = action.payload.items;
				state.meta = action.payload.meta;
				state.stats = action.payload.stats;
			})
			.addCase(fetchProductsList.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'No se pudieron cargar los productos';
			})
			.addCase(fetchInventorySummary.pending, (state) => {
				state.inventoryLoading = true;
				state.inventoryError = null;
			})
			.addCase(fetchInventorySummary.fulfilled, (state, action) => {
				state.inventoryLoading = false;
				state.stats = action.payload.stats;
				state.inventory = { ...action.payload.inventory };
				state.criticalProducts = action.payload.criticalProducts;
			})
			.addCase(fetchInventorySummary.rejected, (state, action) => {
				state.inventoryLoading = false;
				state.inventoryError =
					action.payload ?? 'No se pudo cargar el resumen de inventario';
			})
			.addCase(fetchProductById.pending, (state) => {
				state.currentLoading = true;
				state.currentError = null;
			})
			.addCase(fetchProductById.fulfilled, (state, action) => {
				state.currentLoading = false;
				state.current = action.payload;
				const index = state.items.findIndex((p) => p.id === action.payload.id);
				if (index !== -1) state.items[index] = action.payload;
			})
			.addCase(fetchProductById.rejected, (state, action) => {
				state.currentLoading = false;
				state.current = null;
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
				state.error = action.payload?.message ?? 'No se pudo crear el producto';
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
			.addCase(fetchLibraryMedia.pending, (state) => {
				state.libraryLoading = true;
			})
			.addCase(fetchLibraryMedia.fulfilled, (state) => {
				state.libraryLoading = false;
			})
			.addCase(fetchLibraryMedia.rejected, (state) => {
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
			.addCase(deleteProductMedia.fulfilled, (state, action) => {
				state.mediaUploading = false;
				if (state.current && state.current.gallery && action.meta?.arg?.mediaId) {
					state.current.gallery = state.current.gallery.filter(
						(img) => img.id !== action.meta.arg.mediaId,
					);
				}
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
			})
			.addCase(toggleProductStatus.pending, (state) => {
				state.updating = true;
				state.error = null;
			})
			.addCase(toggleProductStatus.fulfilled, (state, action) => {
				state.updating = false;
				const index = state.items.findIndex((p) => p.id === action.payload.id);
				if (index !== -1) {
					state.items[index] = action.payload;
					state.stats = computeProductStats(state.items);
				}
				if (state.current && state.current.id === action.payload.id) {
					state.current = action.payload;
				}
			})
			.addCase(toggleProductStatus.rejected, (state, action) => {
				state.updating = false;
				state.error = action.payload ?? 'No se pudo cambiar el estado del producto';
			});
	},
});

export const { clearProductsError, clearCurrentProduct } = productsSlice.actions;
export default productsSlice.reducer;
