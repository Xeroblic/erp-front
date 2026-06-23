/**
 * Redux Slice para el módulo de Integraciones
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
	Integration,
	CreateIntegrationPayload,
	UpdateIntegrationPayload,
	IntegrationsQueryParams,
} from '@/types/integrations.types';
import * as integrationsService from '@/services/integrationsService';

// ==================== HELPERS (zero-any) ====================

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;

/**
 * Extrae el mensaje de error de una respuesta del backend. Concatena todos los
 * errores de validación por campo (`errors`) si existen; si no, usa `message`.
 */
const getApiErrorMessage = (error: unknown, fallback: string): string => {
	const data = asRecord(asRecord(asRecord(error)?.response)?.data);
	const errors = asRecord(data?.errors);
	if (errors) {
		const seen = new Set<string>();
		const msgs: string[] = [];
		for (const fieldMsgs of Object.values(errors)) {
			if (!Array.isArray(fieldMsgs)) continue;
			for (const m of fieldMsgs) {
				if (typeof m === 'string' && m.trim() && !seen.has(m)) {
					seen.add(m);
					msgs.push(m);
				}
			}
		}
		if (msgs.length > 0) return msgs.join(' · ');
	}
	const message = data?.message;
	if (typeof message === 'string' && message.trim()) return message;
	return fallback;
};

// ==================== STATE ====================

interface IntegrationsState {
	integrations: Integration[];
	selectedIntegration: Integration | null;
	loading: boolean;
	error: string | null;
	lastFetch: number | null;
}

const initialState: IntegrationsState = {
	integrations: [],
	selectedIntegration: null,
	loading: false,
	error: null,
	lastFetch: null,
};

// ==================== THUNKS ====================

/**
 * Fetch todas las integraciones de una subsidiaria
 */
export const fetchIntegrations = createAsyncThunk(
	'integrations/fetchAll',
	async (
		{ subsidiaryId, params }: { subsidiaryId: number; params?: IntegrationsQueryParams },
		{ rejectWithValue },
	) => {
		try {
			const response = await integrationsService.getIntegrations(subsidiaryId, params);
			return response.data;
		} catch (error: unknown) {
			return rejectWithValue(getApiErrorMessage(error, 'Error al cargar integraciones'));
		}
	},
);

/**
 * Fetch detalle de una integración
 */
export const fetchIntegration = createAsyncThunk(
	'integrations/fetchOne',
	async (
		{ subsidiaryId, integrationId }: { subsidiaryId: number; integrationId: string },
		{ rejectWithValue },
	) => {
		try {
			const response = await integrationsService.getIntegration(subsidiaryId, integrationId);
			return response.data;
		} catch (error: unknown) {
			return rejectWithValue(getApiErrorMessage(error, 'Error al cargar integración'));
		}
	},
);

/**
 * Crear nueva integración
 */
export const createIntegration = createAsyncThunk(
	'integrations/create',
	async (
		{ subsidiaryId, payload }: { subsidiaryId: number; payload: CreateIntegrationPayload },
		{ rejectWithValue },
	) => {
		try {
			const response = await integrationsService.createIntegration(subsidiaryId, payload);
			return response;
		} catch (error: unknown) {
			return rejectWithValue(getApiErrorMessage(error, 'Error al crear integración'));
		}
	},
);

/**
 * Actualizar integración existente
 */
export const updateIntegration = createAsyncThunk(
	'integrations/update',
	async (
		{
			subsidiaryId,
			integrationId,
			payload,
		}: { subsidiaryId: number; integrationId: string; payload: UpdateIntegrationPayload },
		{ rejectWithValue },
	) => {
		try {
			const response = await integrationsService.updateIntegration(
				subsidiaryId,
				integrationId,
				payload,
			);
			return response;
		} catch (error: unknown) {
			return rejectWithValue(
				getApiErrorMessage(error, 'Error al actualizar integración'),
			);
		}
	},
);

/**
 * Eliminar integración
 */
export const deleteIntegration = createAsyncThunk(
	'integrations/delete',
	async (
		{ subsidiaryId, integrationId }: { subsidiaryId: number; integrationId: string },
		{ rejectWithValue },
	) => {
		try {
			await integrationsService.deleteIntegration(subsidiaryId, integrationId);
			return integrationId;
		} catch (error: unknown) {
			return rejectWithValue(
				getApiErrorMessage(error, 'Error al eliminar integración'),
			);
		}
	},
);

// ==================== SLICE ====================

const integrationsSlice = createSlice({
	name: 'integrations',
	initialState,
	reducers: {
		setSelectedIntegration: (state, action: PayloadAction<Integration | null>) => {
			state.selectedIntegration = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
		clearIntegrations: (state) => {
			state.integrations = [];
			state.selectedIntegration = null;
			state.lastFetch = null;
		},
	},
	extraReducers: (builder) => {
		// Fetch All
		builder
			.addCase(fetchIntegrations.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchIntegrations.fulfilled, (state, action) => {
				state.loading = false;
				state.integrations = action.payload;
				state.lastFetch = Date.now();
			})
			.addCase(fetchIntegrations.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});

		// Fetch One
		builder
			.addCase(fetchIntegration.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchIntegration.fulfilled, (state, action) => {
				state.loading = false;
				state.selectedIntegration = action.payload;
			})
			.addCase(fetchIntegration.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});

		// Create
		builder
			.addCase(createIntegration.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(createIntegration.fulfilled, (state, action) => {
				state.loading = false;
				state.integrations.push(action.payload.data);
			})
			.addCase(createIntegration.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});

		// Update
		builder
			.addCase(updateIntegration.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateIntegration.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.integrations.findIndex((i) => i.id === action.payload.data.id);
				if (index !== -1) {
					state.integrations[index] = action.payload.data;
				}
				if (state.selectedIntegration?.id === action.payload.data.id) {
					state.selectedIntegration = action.payload.data;
				}
			})
			.addCase(updateIntegration.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});

		// Delete
		builder
			.addCase(deleteIntegration.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteIntegration.fulfilled, (state, action) => {
				state.loading = false;
				state.integrations = state.integrations.filter((i) => i.id !== action.payload);
				if (state.selectedIntegration?.id === action.payload) {
					state.selectedIntegration = null;
				}
			})
			.addCase(deleteIntegration.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});
	},
});

export const { setSelectedIntegration, clearError, clearIntegrations } = integrationsSlice.actions;

export default integrationsSlice.reducer;
