import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import {
	CreateBrandPayload,
	FetchBrandsParams,
	IBrand,
	IBrandImage,
	UpdateBrandPayload,
} from '@/interface/brand.interface';
import { EMPTY_STATS } from '@/constants/brand.constant';
import {
	convertFileToWebP,
	ensureAbsoluteUrl,
	computeStats,
	normalizeBrand,
} from '@/components/helper/brand.helper';
import { validateFile, extractMediaUrl as extractMediaUrlUtil } from '@/utils/apiHelpers';

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

// use extractMediaUrl from utils

const ensureImageObject = (url: string, base: unknown, fallbackAlt: string): IBrandImage => {
	if (typeof base === 'string') {
		const absolute = ensureAbsoluteUrl(base);
		return { url, thumb: absolute ?? url, alt: fallbackAlt };
	}

	const cast = base as IBrandImage | null | undefined;
	const thumb = cast?.thumb ? (ensureAbsoluteUrl(cast.thumb) ?? url) : url;
	return {
		id: cast?.id,
		url,
		thumb,
		alt: cast?.alt ?? fallbackAlt,
	};
};

const mergeBrandWithLogo = (brand: IBrand, url: string | null): IBrand => {
	if (!url) return brand;

	return {
		...brand,
		logo_url: url,
		photo_url: url,
		image: ensureImageObject(url, brand.image as unknown, brand.name),
	};
};

const fetchBrandDetails = async (branchId: number, brandId: number): Promise<IBrand | null> => {
	try {
		const response = await ApiService.fetchData<{ data?: any }>({
			url: `/branches/${branchId}/brands/${brandId}`,
			method: 'get',
		});

		const raw = response.data?.data ?? response.data;
		return raw ? normalizeBrand(raw) : null;
	} catch {
		return null;
	}
};

const uploadBrandLogo = async (
	branchId: number,
	brandId: number,
	file: File,
): Promise<string | null> => {
	// validate original file before heavy processing
	const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
	const v = validateFile(file, { maxKB: 8192, allowedMimes: allowed });
	if (!v.ok) {
		// small UX-friendly warning; keep silent failure for now
		console.warn('[brandsSlice] uploadBrandLogo: file validation failed', v.reason);
		return null;
	}

	const processed = await convertFileToWebP(file);
	if (!processed) return null;

	const formData = new FormData();
	formData.append('files[]', processed, processed.name);
	formData.append('collection', 'logo');
	formData.append('primary', 'first');

	try {
		const response = await ApiService.fetchData<{ data?: any }, FormData>({
			url: `/branches/${branchId}/brands/${brandId}/media/upload-multiple`,
			method: 'post',
			data: formData,
		});

		const payload = response.data?.data ?? response.data;
		const url = extractMediaUrlUtil(payload);
		const absolute = ensureAbsoluteUrl(url);

		if (absolute) return absolute;

		const refreshed = await fetchBrandDetails(branchId, brandId);
		return refreshed?.logo_url ?? refreshed?.photo_url ?? null;
	} catch {
		const refreshed = await fetchBrandDetails(branchId, brandId);
		return refreshed?.logo_url ?? refreshed?.photo_url ?? null;
	}
};

type BrandRequestShape = {
	name: string;
	is_active?: boolean;
	code?: string;
};

// Subir múltiples imágenes a la galería de la marca
const uploadBrandGalleryFiles = async (
	branchId: number,
	brandId: number,
	files: File[],
): Promise<IBrand | null> => {
	if (!files?.length) return fetchBrandDetails(branchId, brandId);

	const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
	const valid: File[] = [];
	for (const f of files) {
		const v = validateFile(f, { maxKB: 8192, allowedMimes: allowed });
		if (!v.ok) continue;
		const processed = await convertFileToWebP(f);
		if (processed) valid.push(processed);
	}
	if (!valid.length) return fetchBrandDetails(branchId, brandId);

	const formData = new FormData();
	valid.forEach((f) => formData.append('files[]', f, f.name));
	const meta = valid.map((_, idx) => ({
		index: idx,
		collection: 'gallery',
		sort_order: idx,
		alt_text: 'Galería',
		primary: false,
	}));
	formData.append('meta', JSON.stringify(meta));

	try {
		await ApiService.fetchData<{ data?: any }, FormData>({
			url: `/branches/${branchId}/brands/${brandId}/media/upload-multiple`,
			method: 'post',
			data: formData,
		});
		const refreshed = await fetchBrandDetails(branchId, brandId);
		return refreshed;
	} catch {
		const refreshed = await fetchBrandDetails(branchId, brandId);
		return refreshed;
	}
};

export const uploadBrandGallery = createAsyncThunk<
	IBrand | null,
	{ branchId: number; brandId: number; files: File[] },
	{ rejectValue: string }
>('brands/uploadBrandGallery', async ({ branchId, brandId, files }, { rejectWithValue }) => {
	try {
		const refreshed = await uploadBrandGalleryFiles(branchId, brandId, files);
		return refreshed;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ??
				error?.message ??
				'Error al subir galería de la marca',
		);
	}
});

const makeBrandRequestBody = (payload: BrandRequestShape) => {
	const body: Record<string, unknown> = {
		name: payload.name,
	};
	if (payload.is_active !== undefined) {
		body.is_active = payload.is_active;
	}

	if (payload.code) body.code = payload.code;
	// Campos removidos del formulario (no entregados por backend): origin_country, manufacturer

	return body;
};

export const createBrand = createAsyncThunk<
	IBrand,
	{ branchId: number; data: CreateBrandPayload },
	{ rejectValue: string }
>('brands/createBrand', async ({ branchId, data }, { rejectWithValue }) => {
	try {
		const { image, ...brandPayload } = data;
		const response = await ApiService.fetchData<{ data?: any }>({
			url: `/branches/${branchId}/brands`,
			method: 'post',
			data: makeBrandRequestBody(brandPayload),
		});

		const raw = response.data?.data ?? response.data;
		let normalized = normalizeBrand(raw ?? { ...brandPayload, id: Date.now(), company_id: 0 });

		if (image instanceof File) {
			const uploadedUrl = await uploadBrandLogo(branchId, normalized.id, image);
			if (uploadedUrl) {
				normalized = mergeBrandWithLogo(normalized, uploadedUrl);
			} else {
				const refreshed = await fetchBrandDetails(branchId, normalized.id);
				if (refreshed) normalized = refreshed;
			}
		}

		return normalized;
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
		const { image, id, ...rest } = data;
		const response = await ApiService.fetchData<{ data?: any }>({
			url: `/branches/${branchId}/brands/${id}`,
			method: 'patch',
			data: makeBrandRequestBody(rest),
		});

		const raw = response.data?.data ?? response.data;
		let normalized = normalizeBrand(raw ?? data);

		if (image instanceof File) {
			const uploadedUrl = await uploadBrandLogo(branchId, normalized.id, image);
			if (uploadedUrl) {
				normalized = mergeBrandWithLogo(normalized, uploadedUrl);
			} else {
				const refreshed = await fetchBrandDetails(branchId, normalized.id);
				if (refreshed) normalized = refreshed;
			}
		}

		return normalized;
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
			})
			// Upload gallery
			.addCase(uploadBrandGallery.fulfilled, (state, action) => {
				const { payload } = action;
				if (!payload) return;
				const index = state.items.findIndex((b) => b.id === payload.id);
				if (index !== -1) {
					state.items[index] = payload;
					state.stats = computeStats(state.items);
				}
			})
			.addCase(uploadBrandGallery.rejected, (state, action) => {
				state.error = action.payload ?? 'No se pudo subir la galería de la marca';
			});
	},
});

export const { clearBrandsError } = brandsSlice.actions;

export default brandsSlice.reducer;
