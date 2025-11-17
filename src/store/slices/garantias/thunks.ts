import { createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type {
	Warranty,
	WarrantyCreateDTO,
	WarrantyDetail,
	WarrantyListResponse,
	WarrantyUpdateDTO,
} from '@/interface/warranties.interface';

interface FetchParams {
	subsidiaryId: number;
	page?: number;
	perPage?: number;
	status?: string;
	product_id?: number;
	customer_id?: number;
	sale_id?: number;
	q?: string;
}

type ApiError = {
	response?: {
		data?: {
			message?: string;
		};
	};
};

const buildUrl = (subsidiaryId: number, suffix = '') =>
	`/subsidiaries/${subsidiaryId}/warranties${suffix}`;

const getErrorMessage = (error: unknown, fallback: string) => {
	if (typeof error === 'object' && error !== null) {
		const apiError = error as ApiError;
		if (apiError.response?.data?.message) {
			return apiError.response.data.message;
		}
	}
	return fallback;
};

export const fetchWarranties = createAsyncThunk<
	WarrantyListResponse,
	FetchParams,
	{ rejectValue: string }
>('warranties/fetchAll', async (params, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<WarrantyListResponse>({
			url: buildUrl(params.subsidiaryId),
			method: 'get',
			params: {
				page: params.page,
				per_page: params.perPage,
				status: params.status,
				product_id: params.product_id,
				customer_id: params.customer_id,
				sale_id: params.sale_id,
				q: params.q,
				with_product: 1,
			},
		});
		return response.data;
	} catch (error: unknown) {
		return rejectWithValue(
			getErrorMessage(error, 'No se pudieron cargar las garantías'),
		);
	}
});

export const fetchWarrantyDetails = createAsyncThunk<
	WarrantyDetail,
	{ subsidiaryId: number; warrantyId: number },
	{ rejectValue: string }
>('warranties/fetchDetail', async ({ subsidiaryId, warrantyId }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data: WarrantyDetail }>({
			url: buildUrl(subsidiaryId, `/${warrantyId}`),
			method: 'get',
			params: { with_product: 1, with_customer: 1, with_sale: 1 },
		});
		return response.data.data;
	} catch (error: unknown) {
		return rejectWithValue(getErrorMessage(error, 'No se pudo cargar la garantía'));
	}
});

export const createWarranty = createAsyncThunk<
	Warranty,
	{ subsidiaryId: number; payload: WarrantyCreateDTO },
	{ rejectValue: string }
>('warranties/create', async ({ subsidiaryId, payload }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<
			{ data: Warranty },
			Record<string, unknown>
		>({
			url: buildUrl(subsidiaryId),
			method: 'post',
			data: payload as Record<string, unknown>,
		});
		return response.data.data;
	} catch (error: unknown) {
		return rejectWithValue(getErrorMessage(error, 'No se pudo crear la garantía'));
	}
});

export const updateWarranty = createAsyncThunk<
	Warranty,
	{ subsidiaryId: number; warrantyId: number; payload: WarrantyUpdateDTO },
	{ rejectValue: string }
>('warranties/update', async ({ subsidiaryId, warrantyId, payload }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<
			{ data: Warranty },
			Record<string, unknown>
		>({
			url: buildUrl(subsidiaryId, `/${warrantyId}`),
			method: 'patch',
			data: payload as Record<string, unknown>,
		});
		return response.data.data;
	} catch (error: unknown) {
		return rejectWithValue(
			getErrorMessage(error, 'No se pudo actualizar la garantía'),
		);
	}
});

export const deleteWarranty = createAsyncThunk<
	{ id: number },
	{ subsidiaryId: number; warrantyId: number },
	{ rejectValue: string }
>('warranties/delete', async ({ subsidiaryId, warrantyId }, { rejectWithValue }) => {
	try {
		await ApiService.fetchData({
			url: buildUrl(subsidiaryId, `/${warrantyId}`),
			method: 'delete',
		});
		return { id: warrantyId };
	} catch (error: unknown) {
		return rejectWithValue(getErrorMessage(error, 'No se pudo eliminar la garantía'));
	}
});
