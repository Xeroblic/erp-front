/**
 * Traceability Thunks - Gestión de Trazabilidad y Estados Comerciales
 * Endpoints para cambios de estado, transferencias, reservas y ventas
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type { RootState } from '@/store/rootReducer';
import type {
	IItem,
	ChangeCommercialStatusPayload,
	ReserveItemPayload,
	MarkAsSoldPayload,
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
 * Cambiar estado comercial de un equipo
 * POST /api/branches/{branch}/technical-reviews/traceability/{traceability}/change-status
 */
export const changeCommercialStatus = createAsyncThunk<
	IItem,
	{
		branchId?: number | null;
		subsidiaryId?: number | null;
		traceabilityId: number;
		data: ChangeCommercialStatusPayload;
	},
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/changeCommercialStatus',
	async ({ branchId, subsidiaryId, traceabilityId, data }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(setTechnicalReviewsContext({ branchId: context.branchId, subsidiaryId: context.subsidiaryId }));
			const response = await ApiService.fetchData<{ data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, `/traceability/${traceabilityId}/change-status`),
				method: 'post',
				data: { ...data },
			});

			return normalizeObject(response.data) as IItem;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'No se pudo cambiar el estado comercial',
			);
		}
	},
);

/**
 * Transferir equipo a otra sucursal/bodega
 * POST /api/branches/{branch}/technical-reviews/traceability/{traceability}/transfer
 */
export const transferItem = createAsyncThunk<
	IItem,
	{
		branchId?: number | null;
		subsidiaryId?: number | null;
		traceabilityId: number;
		data: {
			target_branch_id?: number;
			target_warehouse_id?: number;
			reason: string;
		};
	},
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/transferItem',
	async ({ branchId, subsidiaryId, traceabilityId, data }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(setTechnicalReviewsContext({ branchId: context.branchId, subsidiaryId: context.subsidiaryId }));
			const response = await ApiService.fetchData<{ data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, `/traceability/${traceabilityId}/transfer`),
				method: 'post',
				data,
			});

			return normalizeObject(response.data) as IItem;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'No se pudo transferir el equipo',
			);
		}
	},
);

/**
 * Reservar equipo para cotización
 * POST /api/branches/{branch}/technical-reviews/traceability/{traceability}/reserve
 */
export const reserveItem = createAsyncThunk<
	IItem,
	{ branchId?: number | null; subsidiaryId?: number | null; traceabilityId: number; data: ReserveItemPayload },
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/reserveItem',
	async ({ branchId, subsidiaryId, traceabilityId, data }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(setTechnicalReviewsContext({ branchId: context.branchId, subsidiaryId: context.subsidiaryId }));
			const response = await ApiService.fetchData<{ data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, `/traceability/${traceabilityId}/reserve`),
				method: 'post',
				data: { ...data },
			});

			return normalizeObject(response.data) as IItem;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ?? error?.message ?? 'No se pudo reservar el equipo',
			);
		}
	},
);

/**
 * Liberar reserva de un equipo
 * POST /api/branches/{branch}/technical-reviews/traceability/{traceability}/release-reservation
 */
export const releaseReservation = createAsyncThunk<
	IItem,
	{ branchId?: number | null; subsidiaryId?: number | null; traceabilityId: number; data?: { reason?: string } },
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/releaseReservation',
	async ({ branchId, subsidiaryId, traceabilityId, data }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(setTechnicalReviewsContext({ branchId: context.branchId, subsidiaryId: context.subsidiaryId }));
			const response = await ApiService.fetchData<{ data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, `/traceability/${traceabilityId}/release-reservation`),
				method: 'post',
				data: data ?? {},
			});

			return normalizeObject(response.data) as IItem;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ?? error?.message ?? 'No se pudo liberar la reserva',
			);
		}
	},
);

/**
 * Marcar equipo como vendido
 * POST /api/branches/{branch}/technical-reviews/traceability/{traceability}/mark-as-sold
 */
export const markAsSold = createAsyncThunk<
	IItem,
	{ branchId?: number | null; subsidiaryId?: number | null; traceabilityId: number; data: MarkAsSoldPayload },
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/markAsSold',
	async ({ branchId, subsidiaryId, traceabilityId, data }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(setTechnicalReviewsContext({ branchId: context.branchId, subsidiaryId: context.subsidiaryId }));
			const response = await ApiService.fetchData<{ data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, `/traceability/${traceabilityId}/mark-as-sold`),
				method: 'post',
				data: { ...data },
			});

			return normalizeObject(response.data) as IItem;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'No se pudo marcar como vendido',
			);
		}
	},
);

/**
 * Historial de trazabilidad por número de serie
 * GET /api/branches/{branch}/technical-reviews/traceability/history/{serialNumber}
 */
export const getTraceabilityHistory = createAsyncThunk<
	any, // ITraceabilityHistoryResponse
	{ branchId?: number | null; subsidiaryId?: number | null; serialNumber: string },
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/getTraceabilityHistory',
	async ({ branchId, subsidiaryId, serialNumber }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(setTechnicalReviewsContext({ branchId: context.branchId, subsidiaryId: context.subsidiaryId }));
			const response = await ApiService.fetchData<{ success?: boolean; data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, `/traceability/history/${serialNumber}`),
				method: 'get',
			});

			// La respuesta viene como { success: true, data: { item, traceability, history } }
			// Usamos normalizeObject para extraer el objeto data interno
			return normalizeObject(response.data);
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'No se pudo cargar el historial de trazabilidad',
			);
		}
	},
);

/**
 * Obtener equipos disponibles para venta
 * GET /api/branches/{branch}/technical-reviews/traceability/available-for-sale
 */
export const getAvailableForSale = createAsyncThunk<
	{ items: IItem[]; meta?: any },
	{
		branchId?: number | null;
		subsidiaryId?: number | null;
		params?: { warehouse_id?: number; grade?: string; equipment_type?: string };
	},
	{ state: RootState; rejectValue: string }
>('technicalReviews/getAvailableForSale', async ({ branchId, subsidiaryId, params }, { getState, dispatch, rejectWithValue }) => {
	try {
		const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
		dispatch(setTechnicalReviewsContext({ branchId: context.branchId, subsidiaryId: context.subsidiaryId }));
		const response = await ApiService.fetchData<{ data?: any[]; meta?: any }>({
			url: buildTechnicalReviewsEndpoint(context, '/traceability/available-for-sale'),
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
				'No se pudieron cargar los equipos disponibles',
		);
	}
});
