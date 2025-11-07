/**
 * Batches Thunks - Gestión de Lotes
 * Endpoints relacionados con la creación y gestión de lotes de equipos
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type { IBatch, FetchBatchesParams, FetchBatchItemsParams, IItem } from '../../../../interface/technicalReviews.interface.ts';

// --- Helpers ---
const TECHNICAL_REVIEWS_PREFIX =
    (import.meta as any)?.env?.VITE_API_TECHNICAL_REVIEWS_PREFIX || '';
const join = (a: string, b: string) => `${a}${b}`.replace(/([^:])\/\/+/, '$1/');
const ep = (branchId: number, path: string) =>
    join(TECHNICAL_REVIEWS_PREFIX, `/branches/${branchId}/technical-reviews${path}`);

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
    { branchId: number; params?: FetchBatchesParams },
    { rejectValue: string }
>(
    'technicalReviews/fetchBatches',
    async ({ branchId, params }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any[]; meta?: any }>({
                url: ep(branchId, '/batches'),
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
                },
            });

            const items = normalizeArray(response.data) as IBatch[];
            const meta = response.data?.meta ?? null;

            return { items, meta };
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudieron cargar los lotes'
            );
        }
    }
);

/**
 * Ver Lote por ID (con items_summary para tabs)
 * GET /api/branches/{branch}/technical-reviews/batches/{batch}
 */
export const fetchBatchById = createAsyncThunk<
    IBatch,
    { branchId: number; batchId: number },
    { rejectValue: string }
>(
    'technicalReviews/fetchBatchById',
    async ({ branchId, batchId }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any }>({
                url: ep(branchId, `/batches/${batchId}`),
                method: 'get',
            });

            return normalizeObject(response.data) as IBatch;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudo cargar el lote'
            );
        }
    }
);

/**
 * Series del Lote (filtradas por tipo/estado)
 * GET /api/branches/{branch}/technical-reviews/batches/{batch}/items
 */
export const fetchBatchItems = createAsyncThunk<
    { items: IItem[]; meta?: any },
    { branchId: number; batchId: number; params?: FetchBatchItemsParams },
    { rejectValue: string }
>(
    'technicalReviews/fetchBatchItems',
    async ({ branchId, batchId, params }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any[]; meta?: any }>({
                url: ep(branchId, `/batches/${batchId}/items`),
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
                'No se pudieron cargar las series del lote'
            );
        }
    }
);

/**
 * Crear Lote
 * POST /api/branches/{branch}/technical-reviews/batches
 */
export const createBatch = createAsyncThunk<
    IBatch,
    {
        branchId: number;
        data: {
            warehouse_id: number;
            customer_supplier_id: number;
            entry_date: string; // YYYY-MM-DD
            expected_quantity: number;
            notes?: string;
        };
    },
    { rejectValue: string }
>(
    'technicalReviews/createBatch',
    async ({ branchId, data }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any }>({
                url: ep(branchId, '/batches'),
                method: 'post',
                data,
            });

            return normalizeObject(response.data) as IBatch;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudo crear el lote'
            );
        }
    }
);

/**
 * Actualizar Lote
 * PATCH /api/branches/{branch}/technical-reviews/batches/{batch}
 */
export const updateBatch = createAsyncThunk<
    IBatch,
    {
        branchId: number;
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
    { rejectValue: string }
>(
    'technicalReviews/updateBatch',
    async ({ branchId, batchId, data }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any }>({
                url: ep(branchId, `/batches/${batchId}`),
                method: 'patch',
                data,
            });

            return normalizeObject(response.data) as IBatch;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudo actualizar el lote'
            );
        }
    }
);

/**
 * Eliminar Lote
 * DELETE /api/branches/{branch}/technical-reviews/batches/{batch}
 */
export const deleteBatch = createAsyncThunk<
    number,
    { branchId: number; batchId: number },
    { rejectValue: string }
>(
    'technicalReviews/deleteBatch',
    async ({ branchId, batchId }, { rejectWithValue }) => {
        try {
            await ApiService.fetchData({
                url: ep(branchId, `/batches/${batchId}`),
                method: 'delete',
            });

            return batchId;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudo eliminar el lote'
            );
        }
    }
);
