/**
 * Items Thunks - Gestión de Series/Ítems (Vista Global)
 * Endpoints relacionados con la gestión individual de series de equipos
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type { IItem, FetchItemsParams, EquipmentType } from '../../../../interface/technicalReviews.interface.ts';

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
 * Listado de Series (vista global)
 * GET /api/branches/{branch}/technical-reviews/items
 */
export const fetchItems = createAsyncThunk<
    { items: IItem[]; meta?: any },
    { branchId: number; params?: FetchItemsParams },
    { rejectValue: string }
>(
    'technicalReviews/fetchItems',
    async ({ branchId, params }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any[]; meta?: any }>({
                url: ep(branchId, '/items'),
                method: 'get',
                params: {
                    batch_id: params?.batch_id,
                    warehouse_id: params?.warehouse_id,
                    equipment_type: params?.equipment_type,
                    review_status: params?.review_status,
                    current_status: params?.current_status,
                    grade: params?.grade,
                    serial_number: params?.serial_number,
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
                'No se pudieron cargar las series'
            );
        }
    }
);

/**
 * Detalle de Serie
 * GET /api/branches/{branch}/technical-reviews/items/{item}
 */
export const fetchItemDetail = createAsyncThunk<
    IItem,
    { branchId: number; itemId: number },
    { rejectValue: string }
>(
    'technicalReviews/fetchItemDetail',
    async ({ branchId, itemId }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any }>({
                url: ep(branchId, `/items/${itemId}`),
                method: 'get',
            });

            return normalizeObject(response.data) as IItem;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudo cargar el detalle de la serie'
            );
        }
    }
);

/**
 * Registrar nueva serie en el sistema
 * POST /api/branches/{branch}/technical-reviews/items
 * Efecto: review_status=pending, current_status=received
 */
export const createItem = createAsyncThunk<
    IItem,
    {
        branchId: number;
        data: {
            batch_id: number;
            serial_number: string;
            product_id?: number;
            equipment_type?: EquipmentType;
        };
    },
    { rejectValue: string }
>(
    'technicalReviews/createItem',
    async ({ branchId, data }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any }>({
                url: ep(branchId, '/items'),
                method: 'post',
                data,
            });

            return normalizeObject(response.data) as IItem;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudo ingresar la serie'
            );
        }
    }
);

/**
 * Actualizar datos básicos del ítem
 * PATCH /api/branches/{branch}/technical-reviews/items/{item}
 */
export const updateItem = createAsyncThunk<
    IItem,
    {
        branchId: number;
        itemId: number;
        data: Partial<{
            batch_id: number;
            serial_number: string;
            product_id: number;
            equipment_type: EquipmentType;
        }>;
    },
    { rejectValue: string }
>(
    'technicalReviews/updateItem',
    async ({ branchId, itemId, data }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any }>({
                url: ep(branchId, `/items/${itemId}`),
                method: 'patch',
                data,
            });

            return normalizeObject(response.data) as IItem;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudo actualizar el ítem'
            );
        }
    }
);

/**
 * Eliminar serie
 * DELETE /api/branches/{branch}/technical-reviews/items/{item}
 */
export const deleteItem = createAsyncThunk<
    number,
    { branchId: number; itemId: number },
    { rejectValue: string }
>(
    'technicalReviews/deleteItem',
    async ({ branchId, itemId }, { rejectWithValue }) => {
        try {
            await ApiService.fetchData({
                url: ep(branchId, `/items/${itemId}`),
                method: 'delete',
            });

            return itemId;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudo eliminar la serie'
            );
        }
    }
);
