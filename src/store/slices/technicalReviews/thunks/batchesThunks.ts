/**
 * Batches Thunks - Gestión de Lotes
 * Endpoints relacionados con la creación y gestión de lotes de equipos
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type { RootState } from '@/store/rootReducer';
import type {
	IBatch,
	FetchBatchesParams,
	FetchBatchItemsParams,
	IItem,
} from '../../../../interface/technicalReviews.interface.ts';
import {
	buildTechnicalReviewsEndpoint,
	resolveTechnicalReviewsContext,
} from '../technicalReviewsContext';
import { setTechnicalReviewsContext } from '../slice/technicalReviewsSlice';

const normalizeArray = (payload: any): any[] => {
	const raw = payload?.data ?? payload;
	return Array.isArray(raw) ? raw : [];
};

const normalizeObject = (payload: any): any => payload?.data ?? payload ?? null;

/**
 * Listado de Lotes
 * GET /api/branches/{branch}/technical-reviews/batches
 */
export const fetchBatches = createAsyncThunk<
	{ items: IBatch[]; meta?: any },
	{ branchId?: number | null; subsidiaryId?: number | null; params?: FetchBatchesParams },
	{ state: RootState; rejectValue: string }
>('technicalReviews/fetchBatches', async ({ branchId, subsidiaryId, params }, { getState, dispatch, rejectWithValue }) => {
	try {
		const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
		dispatch(setTechnicalReviewsContext({ branchId: context.branchId, subsidiaryId: context.subsidiaryId }));
		const response = await ApiService.fetchData<{ data?: any[]; meta?: any }>({
			url: buildTechnicalReviewsEndpoint(context, '/batches'),
			method: 'get',
			params: {
				warehouse_id: params?.warehouse_id,
				status: params?.status,
				customer_supplier_id: params?.customer_supplier_id,
				year: params?.year,
				start_date: params?.start_date,
				end_date: params?.end_date,
				search: params?.search,
				page: params?.page ?? 1,
				per_page: params?.per_page ?? 20,
				sort_by: params?.sort_by,
				order: params?.order,
			},
		});

		const items = normalizeArray(response.data) as IBatch[];
		const meta = response.data?.meta ?? null;

		return { items, meta };
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudieron cargar los lotes',
		);
	}
});

/**
 * Ver Lote por ID (con items_summary para tabs)
 * GET /api/branches/{branch}/technical-reviews/batches/{batch}
 */
export const fetchBatchById = createAsyncThunk<
	IBatch,
	{ branchId?: number | null; subsidiaryId?: number | null; batchId: number },
	{ state: RootState; rejectValue: string }
>('technicalReviews/fetchBatchById', async ({ branchId, subsidiaryId, batchId }, { getState, dispatch, rejectWithValue }) => {
	try {
		const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
		dispatch(setTechnicalReviewsContext({ branchId: context.branchId, subsidiaryId: context.subsidiaryId }));
		const response = await ApiService.fetchData<{ data?: any }>({
			url: buildTechnicalReviewsEndpoint(context, `/batches/${batchId}`),
			method: 'get',
		});

		return normalizeObject(response.data) as IBatch;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudo cargar el lote',
		);
	}
});

/**
 * Series del Lote (filtradas por tipo/estado)
 * GET /api/branches/{branch}/technical-reviews/batches/{batch}/items
 */
export const fetchBatchItems = createAsyncThunk<
	{ items: IItem[]; meta?: any },
	{ branchId?: number | null; subsidiaryId?: number | null; batchId: number; params?: FetchBatchItemsParams },
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/fetchBatchItems',
	async ({ branchId, subsidiaryId, batchId, params }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(
				setTechnicalReviewsContext({
					branchId: context.branchId,
					subsidiaryId: context.subsidiaryId,
				}),
			);
			const response = await ApiService.fetchData<{ data?: any[]; meta?: any }>({
				url: buildTechnicalReviewsEndpoint(context, `/batches/${batchId}/items`),
				method: 'get',
				params: {
					equipment_type: params?.equipment_type,
					review_status: params?.review_status,
					current_status: params?.current_status,
					grade: params?.grade,
					search: params?.search,
					page: params?.page ?? 1,
					per_page: params?.per_page ?? 30,
				},
			});

			const items = normalizeArray(response.data) as IItem[];
			const meta = response.data?.meta ?? null;

			return { items, meta };
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'No se pudieron cargar las series del lote',
			);
		}
	},
);

/**
 * Crear Lote
 * POST /api/branches/{branch}/technical-reviews/batches
 */
export const createBatch = createAsyncThunk<
	IBatch,
	{
		branchId?: number | null;
		subsidiaryId?: number | null;
		data: {
			warehouse_id: number;
			customer_supplier_id: number;
			entry_date: string; // YYYY-MM-DD
			expected_quantity: number;
			notes?: string;
		};
	},
	{ state: RootState; rejectValue: string }
>('technicalReviews/createBatch', async ({ branchId, subsidiaryId, data }, { getState, dispatch, rejectWithValue }) => {
	try {
		const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
		dispatch(setTechnicalReviewsContext({ branchId: context.branchId, subsidiaryId: context.subsidiaryId }));
		const response = await ApiService.fetchData<{ data?: any }>({
			url: buildTechnicalReviewsEndpoint(context, '/batches'),
			method: 'post',
			data,
		});

		return normalizeObject(response.data) as IBatch;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudo crear el lote',
		);
	}
});

/**
 * Actualizar Lote
 * PATCH /api/branches/{branch}/technical-reviews/batches/{batch}
 */
export const updateBatch = createAsyncThunk<
	IBatch,
	{
		branchId?: number | null;
		subsidiaryId?: number | null;
		batchId: number;
		data: Partial<{
			warehouse_id: number;
			customer_supplier_id: number;
			entry_date: string;
			expected_quantity: number;
			notes: string;
			status: string;
		}>;
	},
	{ state: RootState; rejectValue: string }
>('technicalReviews/updateBatch', async ({ branchId, subsidiaryId, batchId, data }, { getState, dispatch, rejectWithValue }) => {
	try {
		const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
		dispatch(setTechnicalReviewsContext({ branchId: context.branchId, subsidiaryId: context.subsidiaryId }));
		const response = await ApiService.fetchData<{ data?: any }>({
			url: buildTechnicalReviewsEndpoint(context, `/batches/${batchId}`),
			method: 'patch',
			data,
		});

		return normalizeObject(response.data) as IBatch;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudo actualizar el lote',
		);
	}
});

/**
 * Eliminar Lote
 * DELETE /api/branches/{branch}/technical-reviews/batches/{batch}
 */
export const deleteBatch = createAsyncThunk<
	number,
	{ branchId?: number | null; subsidiaryId?: number | null; batchId: number },
	{ state: RootState; rejectValue: string }
>('technicalReviews/deleteBatch', async ({ branchId, subsidiaryId, batchId }, { getState, dispatch, rejectWithValue }) => {
	try {
		const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
		dispatch(setTechnicalReviewsContext({ branchId: context.branchId, subsidiaryId: context.subsidiaryId }));
		await ApiService.fetchData({
			url: buildTechnicalReviewsEndpoint(context, `/batches/${batchId}`),
			method: 'delete',
		});

		return batchId;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudo eliminar el lote',
		);
	}
});
