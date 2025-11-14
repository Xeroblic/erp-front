/**
 * Traceability Thunks - Gestión de Trazabilidad y Estados Comerciales
 * Endpoints para cambios de estado, transferencias, reservas y ventas
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type {
    IItem,
    ChangeCommercialStatusPayload,
    ReserveItemPayload,
    MarkAsSoldPayload,
} from '../../../../interface/technicalReviews.interface.ts';

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
 * Cambiar estado comercial de un equipo
 * POST /api/branches/{branch}/technical-reviews/traceability/{traceability}/change-status
 */
export const changeCommercialStatus = createAsyncThunk<
    IItem,
    { branchId: number; traceabilityId: number; data: ChangeCommercialStatusPayload },
    { rejectValue: string }
>(
    'technicalReviews/changeCommercialStatus',
    async ({ branchId, traceabilityId, data }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any }>({
                url: ep(branchId, `/traceability/${traceabilityId}/change-status`),
                method: 'post',
                data: { ...data },
            });

            return normalizeObject(response.data) as IItem;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudo cambiar el estado comercial'
            );
        }
    }
);

/**
 * Transferir equipo a otra sucursal/bodega
 * POST /api/branches/{branch}/technical-reviews/traceability/{traceability}/transfer
 */
export const transferItem = createAsyncThunk<
    IItem,
    {
        branchId: number;
        traceabilityId: number;
        data: {
            target_branch_id?: number;
            target_warehouse_id?: number;
            reason: string;
        };
    },
    { rejectValue: string }
>(
    'technicalReviews/transferItem',
    async ({ branchId, traceabilityId, data }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any }>({
                url: ep(branchId, `/traceability/${traceabilityId}/transfer`),
                method: 'post',
                data,
            });

            return normalizeObject(response.data) as IItem;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudo transferir el equipo'
            );
        }
    }
);

/**
 * Reservar equipo para cotización
 * POST /api/branches/{branch}/technical-reviews/traceability/{traceability}/reserve
 */
export const reserveItem = createAsyncThunk<
    IItem,
    { branchId: number; traceabilityId: number; data: ReserveItemPayload },
    { rejectValue: string }
>(
    'technicalReviews/reserveItem',
    async ({ branchId, traceabilityId, data }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any }>({
                url: ep(branchId, `/traceability/${traceabilityId}/reserve`),
                method: 'post',
                data: { ...data },
            });

            return normalizeObject(response.data) as IItem;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudo reservar el equipo'
            );
        }
    }
);

/**
 * Liberar reserva de un equipo
 * POST /api/branches/{branch}/technical-reviews/traceability/{traceability}/release-reservation
 */
export const releaseReservation = createAsyncThunk<
    IItem,
    { branchId: number; traceabilityId: number; data?: { reason?: string } },
    { rejectValue: string }
>(
    'technicalReviews/releaseReservation',
    async ({ branchId, traceabilityId, data }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any }>({
                url: ep(branchId, `/traceability/${traceabilityId}/release-reservation`),
                method: 'post',
                data: data ?? {},
            });

            return normalizeObject(response.data) as IItem;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudo liberar la reserva'
            );
        }
    }
);

/**
 * Marcar equipo como vendido
 * POST /api/branches/{branch}/technical-reviews/traceability/{traceability}/mark-as-sold
 */
export const markAsSold = createAsyncThunk<
    IItem,
    { branchId: number; traceabilityId: number; data: MarkAsSoldPayload },
    { rejectValue: string }
>(
    'technicalReviews/markAsSold',
    async ({ branchId, traceabilityId, data }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any }>({
                url: ep(branchId, `/traceability/${traceabilityId}/mark-as-sold`),
                method: 'post',
                data: { ...data },
            });

            return normalizeObject(response.data) as IItem;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudo marcar como vendido'
            );
        }
    }
);

/**
 * Historial de trazabilidad por número de serie
 * GET /api/branches/{branch}/technical-reviews/traceability/history/{serialNumber}
 */
export const getTraceabilityHistory = createAsyncThunk<
    any[],
    { branchId: number; serialNumber: string },
    { rejectValue: string }
>(
    'technicalReviews/getTraceabilityHistory',
    async ({ branchId, serialNumber }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any[] }>({
                url: ep(branchId, `/traceability/history/${serialNumber}`),
                method: 'get',
            });

            return normalizeArray(response.data);
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudo cargar el historial de trazabilidad'
            );
        }
    }
);

/**
 * Obtener equipos disponibles para venta
 * GET /api/branches/{branch}/technical-reviews/traceability/available-for-sale
 */
export const getAvailableForSale = createAsyncThunk<
    { items: IItem[]; meta?: any },
    { branchId: number; params?: { warehouse_id?: number; grade?: string; equipment_type?: string } },
    { rejectValue: string }
>(
    'technicalReviews/getAvailableForSale',
    async ({ branchId, params }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ data?: any[]; meta?: any }>({
                url: ep(branchId, '/traceability/available-for-sale'),
                method: 'get',
                params,
            });

            const items = normalizeArray(response.data) as IItem[];
            const meta = response.data?.meta ?? null;

            return { items, meta };
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ??
                error?.message ??
                'No se pudieron cargar los equipos disponibles'
            );
        }
    }
);
