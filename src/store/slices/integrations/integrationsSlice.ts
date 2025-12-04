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
		} catch (error: any) {
			return rejectWithValue(
				error.response?.data?.message || 'Error al cargar integraciones',
			);
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
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Error al cargar integración');
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
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Error al crear integración');
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
		} catch (error: any) {
			return rejectWithValue(
				error.response?.data?.message || 'Error al actualizar integración',
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
		} catch (error: any) {
			return rejectWithValue(
				error.response?.data?.message || 'Error al eliminar integración',
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
