/**
 * Validation Thunks - Reglas de Validación y Scoring
 * Endpoints para validación de formularios y cálculo de grados
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type {
	IValidationRules,
	IValidationRule,
	EquipmentType,
} from '../../../../interface/technicalReviews.interface.ts';

// --- Helpers ---
const TECHNICAL_REVIEWS_PREFIX = (import.meta as any)?.env?.VITE_API_TECHNICAL_REVIEWS_PREFIX || '';
const join = (a: string, b: string) => `${a}${b}`.replace(/([^:])\/\/+/, '$1/');
const ep = (branchId: number, path: string) =>
	join(TECHNICAL_REVIEWS_PREFIX, `/branches/${branchId}/technical-reviews${path}`);

const normalizeArray = (payload: any): any[] => {
	const raw = payload?.data ?? payload;
	return Array.isArray(raw) ? raw : [];
};

const normalizeObject = (payload: any): any => payload?.data ?? payload ?? null;

/**
 * Obtener reglas completas de validación (comunes + por tipo)
 * GET /api/branches/{branch}/technical-reviews/validation/rules
 */
export const fetchValidationRules = createAsyncThunk<
	IValidationRules,
	{ branchId: number },
	{ rejectValue: string }
>('technicalReviews/fetchValidationRules', async ({ branchId }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: any }>({
			url: ep(branchId, '/validation/rules'),
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
});

/**
 * Obtener reglas de validación por tipo de equipo
 * GET /api/branches/{branch}/technical-reviews/validation/rules/{equipmentType}
 */
export const fetchValidationRulesByType = createAsyncThunk<
	IValidationRule[],
	{ branchId: number; equipmentType: EquipmentType },
	{ rejectValue: string }
>(
	'technicalReviews/fetchValidationRulesByType',
	async ({ branchId, equipmentType }, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<{ data?: any }>({
				url: ep(branchId, `/validation/rules/${equipmentType}`),
				method: 'get',
			});

			return normalizeArray(response.data) as IValidationRule[];
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
		branchId: number;
		data: {
			equipment_type: EquipmentType;
			field_name: string;
			field_value: any;
		};
	},
	{ rejectValue: string }
>('technicalReviews/validateField', async ({ branchId, data }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: any }>({
			url: ep(branchId, '/validation/validate-field'),
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
});

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
	{ branchId: number; itemId: number },
	{ rejectValue: string }
>('technicalReviews/suggestGrade', async ({ branchId, itemId }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: any }>({
			url: ep(branchId, '/validation/suggest-grade'),
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
});

/**
 * Obtener errores comunes del usuario actual
 * GET /api/branches/{branch}/technical-reviews/validation/my-common-errors
 */
export const getMyCommonErrors = createAsyncThunk<
	any[],
	{ branchId: number },
	{ rejectValue: string }
>('technicalReviews/getMyCommonErrors', async ({ branchId }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: any[] }>({
			url: ep(branchId, '/validation/my-common-errors'),
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
});

/**
 * Obtener estadísticas de errores
 * GET /api/branches/{branch}/technical-reviews/validation/error-statistics
 */
export const getErrorStatistics = createAsyncThunk<
	any,
	{ branchId: number; params?: { start_date?: string; end_date?: string } },
	{ rejectValue: string }
>('technicalReviews/getErrorStatistics', async ({ branchId, params }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: any }>({
			url: ep(branchId, '/validation/error-statistics'),
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
});
