/**
 * Validation Thunks - Reglas de Validación y Scoring
 * Endpoints para validación de formularios y cálculo de grados
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type { RootState } from '@/store/rootReducer';
import type {
	IValidationRules,
	ITechnicalReviewSchema,
	EquipmentType,
} from '../../../../interface/technicalReviews.interface';
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

const normalizeSchema = (payload: unknown): ITechnicalReviewSchema => {
	if (!payload || typeof payload !== 'object') return {};
	const wrapped = payload as { data?: unknown };
	const data = wrapped.data ?? payload;
	return data && typeof data === 'object' && !Array.isArray(data)
		? (data as ITechnicalReviewSchema)
		: {};
};

/**
 * Obtener reglas completas de validación (comunes + por tipo)
 * GET /api/branches/{branch}/technical-reviews/validation/rules
 */
export const fetchValidationRules = createAsyncThunk<
	IValidationRules,
	{ branchId?: number | null; subsidiaryId?: number | null },
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/fetchValidationRules',
	async ({ branchId, subsidiaryId }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(
				setTechnicalReviewsContext({
					branchId: context.branchId,
					subsidiaryId: context.subsidiaryId,
				}),
			);
			const response = await ApiService.fetchData<{ data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, '/validation/rules'),
				method: 'get',
			});

			return normalizeObject(response.data) as IValidationRules;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'No se pudieron cargar las reglas de validación',
			);
		}
	},
);

/**
 * Obtener reglas de validación por tipo de equipo
 * GET /api/branches/{branch}/technical-reviews/validation/rules/{equipmentType}
 */
export const fetchValidationRulesByType = createAsyncThunk<
	ITechnicalReviewSchema,
	{ branchId?: number | null; subsidiaryId?: number | null; equipmentType: EquipmentType },
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/fetchValidationRulesByType',
	async ({ branchId, subsidiaryId, equipmentType }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(
				setTechnicalReviewsContext({
					branchId: context.branchId,
					subsidiaryId: context.subsidiaryId,
				}),
			);
			const response = await ApiService.fetchData<{ data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, `/validation/rules/${equipmentType}`),
				method: 'get',
			});

			return normalizeSchema(response.data);
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'No se pudieron cargar las reglas de validación',
			);
		}
	},
);

/**
 * Validar un campo en tiempo real
 * POST /api/branches/{branch}/technical-reviews/validation/validate-field
 */
export const validateField = createAsyncThunk<
	{
		valid: boolean;
		message?: string;
		errors?: string[];
		warnings?: string[];
		suggestion?: string;
		help_text?: string;
	},
	{
		branchId?: number | null;
		subsidiaryId?: number | null;
		data: {
			equipment_type: EquipmentType;
			field_name: string;
			field_value: any;
		};
	},
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/validateField',
	async ({ branchId, subsidiaryId, data }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(
				setTechnicalReviewsContext({
					branchId: context.branchId,
					subsidiaryId: context.subsidiaryId,
				}),
			);
			const response = await ApiService.fetchData<{ data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, '/validation/validate-field'),
				method: 'post',
				data,
			});

			return normalizeObject(response.data) as {
				valid: boolean;
				message?: string;
				errors?: string[];
				warnings?: string[];
				suggestion?: string;
				help_text?: string;
			};
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ?? error?.message ?? 'Error al validar el campo',
			);
		}
	},
);

/**
 * Previsualización de calificación (sugerir grado)
 * POST /api/branches/{branch}/technical-reviews/validation/suggest-grade
 */
export const suggestGrade = createAsyncThunk<
	{
		suggested_grade: string;
		grade_label: string;
		confidence: number;
		total_score: number;
		breakdown: Record<string, any>;
		reasoning: string[];
		is_auto_assignable: boolean;
		warnings: string[];
	},
	{ branchId?: number | null; subsidiaryId?: number | null; itemId: number },
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/suggestGrade',
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
				url: buildTechnicalReviewsEndpoint(context, '/validation/suggest-grade'),
				method: 'post',
				data: { item_id: itemId },
			});

			return normalizeObject(response.data) as {
				suggested_grade: string;
				grade_label: string;
				confidence: number;
				total_score: number;
				breakdown: Record<string, any>;
				reasoning: string[];
				is_auto_assignable: boolean;
				warnings: string[];
			};
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'Error al calcular la sugerencia de grado',
			);
		}
	},
);

/**
 * Obtener errores comunes del usuario actual
 * GET /api/branches/{branch}/technical-reviews/validation/my-common-errors
 */
export const getMyCommonErrors = createAsyncThunk<
	any[],
	{ branchId?: number | null; subsidiaryId?: number | null },
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/getMyCommonErrors',
	async ({ branchId, subsidiaryId }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(
				setTechnicalReviewsContext({
					branchId: context.branchId,
					subsidiaryId: context.subsidiaryId,
				}),
			);
			const response = await ApiService.fetchData<{ data?: any[] }>({
				url: buildTechnicalReviewsEndpoint(context, '/validation/my-common-errors'),
				method: 'get',
			});

			return normalizeArray(response.data);
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'No se pudieron cargar los errores comunes',
			);
		}
	},
);

/**
 * Obtener estadísticas de errores
 * GET /api/branches/{branch}/technical-reviews/validation/error-statistics
 */
export const getErrorStatistics = createAsyncThunk<
	any,
	{
		branchId?: number | null;
		subsidiaryId?: number | null;
		params?: { start_date?: string; end_date?: string };
	},
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/getErrorStatistics',
	async ({ branchId, subsidiaryId, params }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(
				setTechnicalReviewsContext({
					branchId: context.branchId,
					subsidiaryId: context.subsidiaryId,
				}),
			);
			const response = await ApiService.fetchData<{ data?: any }>({
				url: buildTechnicalReviewsEndpoint(context, '/validation/error-statistics'),
				method: 'get',
				params,
			});

			return normalizeObject(response.data);
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'No se pudieron cargar las estadísticas de errores',
			);
		}
	},
);
