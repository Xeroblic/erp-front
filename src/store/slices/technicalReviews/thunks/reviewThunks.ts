/**
 * Review Thunks - Flujo de Revisión Técnica
 * Endpoints del proceso paso a paso de revisión de equipos
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type { RootState } from '@/store/rootReducer';
import type {
	IItem,
	UpdateItemDetailsPayload,
	ApproveItemPayload,
} from '../../../../interface/technicalReviews.interface';
import {
	buildTechnicalReviewsEndpoint,
	resolveTechnicalReviewsContext,
} from '../technicalReviewsContext';
import { setTechnicalReviewsContext } from '../slice/technicalReviewsSlice';

const normalizeObject = (payload: any): any => payload?.data ?? payload ?? null;

/**
 * Paso 1: Iniciar revisión técnica
 * POST /api/branches/{branch}/technical-reviews/items/{item}/start-review
 * Efecto: review_status=in_review
 */
export const startReview = createAsyncThunk<
	IItem,
	{ branchId?: number | null; subsidiaryId?: number | null; itemId: number },
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/startReview',
	async ({ branchId, subsidiaryId, itemId }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(
				setTechnicalReviewsContext({
					branchId: context.branchId,
					subsidiaryId: context.subsidiaryId,
				}),
			);
			const response = await ApiService.fetchData<{ data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, `/items/${itemId}/start-review`),
				method: 'post',
			});

			return normalizeObject(response.data) as IItem;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'No se pudo iniciar la revisión',
			);
		}
	},
);

/**
 * Campos de puertos que solo aplican a ciertos tipos de equipos
 */
const PORT_FIELDS = [
	'vga_ports',
	'hdmi_ports',
	'displayport_ports',
	'usb_a_ports',
	'usb_c_ports',
	'sd_readers',
	'sd_readers',
	'rj45_ports',
	'dvi_ports',
	'all_ports_functional',
	'defective_ports_count',
	'defective_ports_critical_count',
];

/**
 * Filtra campos según el tipo de equipo para evitar errores de SQL
 * NOTA: Desktop y AIO ahora SÍ tienen columnas de puertos en sus tablas
 */
const filterFieldsByEquipmentType = (
	data: UpdateItemDetailsPayload,
	equipmentType?: string,
): UpdateItemDetailsPayload => {
	// Si no conocemos el tipo, no filtramos (modo seguro)
	if (!equipmentType) {
		return data;
	}

	const filteredData = { ...data };

	// DESACTIVADO: Desktop y AIO ahora SÍ aceptan campos de puertos
	// if (equipmentType === 'aio' || equipmentType === 'desktop') {
	// 	PORT_FIELDS.forEach((field) => {
	// 		delete filteredData[field];
	// 	});
	// }

	return filteredData;
};

/**
 * Paso 2: Guardar/actualizar detalles técnicos (repetible)
 * PATCH /api/branches/{branch}/technical-reviews/items/{item}/details
 * Acepta charger_status a nivel raíz; backend lo normaliza a extra_attributes
 * battery_status acepta estado o porcentaje ("85%")
 */
export const updateItemDetails = createAsyncThunk<
	IItem,
	{
		branchId?: number | null;
		subsidiaryId?: number | null;
		itemId: number;
		data: UpdateItemDetailsPayload;
		equipmentType?: string;
	},
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/updateItemDetails',
	async (
		{ branchId, subsidiaryId, itemId, data, equipmentType },
		{ getState, dispatch, rejectWithValue },
	) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(
				setTechnicalReviewsContext({
					branchId: context.branchId,
					subsidiaryId: context.subsidiaryId,
				}),
			);
			// Filtrar campos según el tipo de equipo
			const filteredData = filterFieldsByEquipmentType(data, equipmentType);

			// Strip null, undefined and empty-string values.
			// The backend rejects nulls for fields with allowed_values constraints
			// (e.g. cover_condition, charger_status).
			// Algunos campos sí pueden ser null o vacíos explícitamente (ej: borrar observaciones)
			const NULLABLE_FIELDS = ['observations', 'extra_attributes', 'battery_health'];

			const cleanData = Object.fromEntries(
				Object.entries(filteredData).filter(([k, v]) => {
					if (NULLABLE_FIELDS.includes(k)) return v !== undefined;
					return v !== null && v !== undefined && v !== '';
				}),
			);

			const response = await ApiService.fetchData<{ data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, `/items/${itemId}/details`),
				method: 'patch',
				data: cleanData,
			});

			return normalizeObject(response.data) as IItem;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'No se pudieron actualizar los detalles',
			);
		}
	},
);

/**
 * Paso 3: Finalizar revisión y calcular grado sugerido
 * POST /api/branches/{branch}/technical-reviews/items/{item}/complete-review
 * Efecto: review_status=reviewed
 * Respuesta: suggested_grade, confidence, breakdown
 */
export const completeReview = createAsyncThunk<
	IItem,
	{ branchId?: number | null; subsidiaryId?: number | null; itemId: number },
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/completeReview',
	async ({ branchId, subsidiaryId, itemId }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(
				setTechnicalReviewsContext({
					branchId: context.branchId,
					subsidiaryId: context.subsidiaryId,
				}),
			);
			const response = await ApiService.fetchData<{ data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, `/items/${itemId}/complete-review`),
				method: 'post',
			});

			return normalizeObject(response.data) as IItem;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'No se pudo finalizar la revisión',
			);
		}
	},
);

/**
 * Paso 4: Aprobar serie con grado final
 * POST /api/branches/{branch}/technical-reviews/items/{item}/approve
 * Efecto: review_status=approved
 * No cambia automáticamente el estado comercial
 */
export const approveItem = createAsyncThunk<
	IItem,
	{
		branchId?: number | null;
		subsidiaryId?: number | null;
		itemId: number;
		data: ApproveItemPayload;
	},
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/approveItem',
	async ({ branchId, subsidiaryId, itemId, data }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(
				setTechnicalReviewsContext({
					branchId: context.branchId,
					subsidiaryId: context.subsidiaryId,
				}),
			);
			const response = await ApiService.fetchData<{ data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, `/items/${itemId}/approve`),
				method: 'post',
				data: { ...data },
			});

			return normalizeObject(response.data) as IItem;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ?? error?.message ?? 'No se pudo aprobar la serie',
			);
		}
	},
);

/**
 * Obtener grado sugerido sin finalizar revisión
 * GET /api/branches/{branch}/technical-reviews/items/{item}/suggested-grade
 */
export const getSuggestedGrade = createAsyncThunk<
	{ suggested_grade: string; confidence: number; breakdown: Record<string, any> },
	{ branchId?: number | null; subsidiaryId?: number | null; itemId: number },
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/getSuggestedGrade',
	async ({ branchId, subsidiaryId, itemId }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(
				setTechnicalReviewsContext({
					branchId: context.branchId,
					subsidiaryId: context.subsidiaryId,
				}),
			);
			const response = await ApiService.fetchData<{ data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, `/items/${itemId}/suggested-grade`),
				method: 'get',
			});

			return normalizeObject(response.data) as {
				suggested_grade: string;
				confidence: number;
				breakdown: Record<string, any>;
			};
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'No se pudo calcular el grado sugerido',
			);
		}
	},
);

/**
 * Volver item a estado "in_review" para permitir re-edición
 * POST /api/branches/{branch}/technical-reviews/items/{item}/reopen-review
 * Efecto: review_status cambia de 'reviewed' → 'in_review'
 */
export const reopenReview = createAsyncThunk<
	IItem,
	{ branchId?: number | null; subsidiaryId?: number | null; itemId: number },
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/reopenReview',
	async ({ branchId, subsidiaryId, itemId }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(
				setTechnicalReviewsContext({
					branchId: context.branchId,
					subsidiaryId: context.subsidiaryId,
				}),
			);
			const response = await ApiService.fetchData<{ data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, `/items/${itemId}/reopen-review`),
				method: 'post', // ← Cambiado de 'patch' a 'post'
			});

			return normalizeObject(response.data) as IItem;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'No se pudo reabrir la revisión',
			);
		}
	},
);
