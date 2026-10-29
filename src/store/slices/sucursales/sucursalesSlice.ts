// src/store/slices/sucursales/sucursalesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import { normalizeCommunePayload } from '@/utils/apiHelpers';
import { ISucursal } from '@/interface/empresas.interface';

export interface SucursalesState {
	loading: boolean;
	error?: string;
	lista: ISucursal[];
	detalle?: ISucursal;
	createLoading: boolean;
	createError?: string;
	updateLoading: boolean;
	updateError?: string;
	deleteLoading: boolean;
	deleteError?: string;
}

const initialState: SucursalesState = {
	loading: false,
	error: undefined,
	lista: [],
	detalle: undefined,
	createLoading: false,
	createError: undefined,
	updateLoading: false,
	updateError: undefined,
	deleteLoading: false,
	deleteError: undefined,
};

// Normaliza la respuesta de /branches. El backend SÓLO manda campos `branch_*`
// (verificado: GET /branches y las branches anidadas en /subsidiaries nunca incluyen
// alias camel `name/rut/phone/address/email/status`).
const normalizeBranchData = (backendData: any): ISucursal => {
	return {
		...backendData,
		// ✅ Nuevo: Soportar manager_id y relación manager
		manager_id: backendData.manager_id,
		manager: backendData.manager,
		// DEPRECATED: Mantener por compatibilidad temporal
		manager_name: backendData.manager?.name // Backend devuelve "name" directamente
			? backendData.manager.name
			: backendData.manager?.first_name && backendData.manager?.last_name
				? `${backendData.manager.first_name} ${backendData.manager.last_name}`.trim()
				: backendData.branch_manager_name || backendData.manager_name || null,
		manager_phone:
			backendData.manager?.phone ||
			backendData.manager?.phone_number ||
			backendData.branch_manager_phone ||
			backendData.manager_phone ||
			null,
		manager_email:
			backendData.manager?.email ||
			backendData.branch_manager_email ||
			backendData.manager_email ||
			null,

		subsidiary_id: backendData.subsidiary_id || backendData.subempresa_id,
		created_at:
			backendData.branch_created_at || backendData.created_at || new Date().toISOString(),
		updated_at:
			backendData.branch_updated_at || backendData.updated_at || new Date().toISOString(),
		usuarios: backendData.usuarios || [],
		// Datos adicionales de la subsidiaria si están disponibles
		subsidiary_name: backendData.subsidiary_name,
		subsidiary_rut: backendData.subsidiary_rut,
		commune_id: backendData.commune_id,
		// El backend nunca manda un `commune_name` plano: se deriva de la relación anidada.
		commune_name: backendData.commune_name ?? backendData.commune?.name,
	};
};

export const fetchMisSucursales = createAsyncThunk<
	ISucursal[],
	{ force?: boolean } | void,
	{ rejectValue: string; state: any }
>(
	'sucursales/fetchMisSucursales',
	async (_params, { rejectWithValue, getState }) => {
		try {
			// Obtener sucursales desde /branches con manager incluido
			const branchesResponse = await ApiService.fetchData<{ data?: any[]; branches?: any[] }>(
				{
					url: '/branches',
					method: 'get',
					params: { with: 'subsidiary,commune,manager' }, // ✅ Agregar manager
				},
			);

			const rawBranches: any[] = Array.isArray(branchesResponse.data?.data)
				? branchesResponse.data.data
				: Array.isArray((branchesResponse.data as any)?.branches)
					? ((branchesResponse.data as any).branches as any[])
					: [];

			// Intentar usar subsidiarias de Redux primero
			const state: any = getState();
			const subsidiariesFromRedux = state?.empresa?.miEmpresaSubsidiarias || [];

			const subsidiariesMap: Record<number, any> = {};

			// Si hay subsidiarias en Redux, usarlas
			if (subsidiariesFromRedux.length > 0) {
				subsidiariesFromRedux.forEach((sub: any) => {
					subsidiariesMap[sub.id] = sub;
				});
			} else {
				// Solo si no hay en Redux, cargar desde API
				try {
					const subsidiariesResponse = await ApiService.fetchData<{
						data?: any[];
						subsidiaries?: any[];
					}>({
						url: '/subsidiaries',
						method: 'get',
					});

					const subsidiariesList = Array.isArray(subsidiariesResponse.data?.data)
						? subsidiariesResponse.data.data
						: Array.isArray((subsidiariesResponse.data as any)?.subsidiaries)
							? (subsidiariesResponse.data as any).subsidiaries
							: [];

					// Crear mapa de subsidiarias por ID
					subsidiariesList.forEach((sub: any) => {
						subsidiariesMap[sub.id] = sub;
					});
				} catch (error) {
					// Silenciar error si no se pueden cargar subsidiarias
				}
			}

			// Mapear sucursales con datos de subsidiarias
			const branchesData = rawBranches.map((b: any) => {
				const subsidiary = b.subsidiary || subsidiariesMap[b.subsidiary_id];

				return {
					id: b.id,
					subsidiary_id: b.subsidiary_id ?? subsidiary?.id,
					branch_name: b.branch_name ?? b.name,
					branch_rut: b.branch_rut ?? subsidiary?.subsidiary_rut ?? subsidiary?.rut,
					branch_address: b.branch_address ?? b.address,
					branch_phone: b.branch_phone ?? b.phone,
					branch_email: b.branch_email ?? b.email,
					branch_status: b.branch_status ?? b.status,

					// ✅ Nuevo: Campos de manager
					manager_id: b.manager_id,
					manager: b.manager,

					// DEPRECATED: Mantener por compatibilidad
					branch_manager_name: b.manager?.first_name
						? `${b.manager.first_name} ${b.manager.last_name}`
						: (b.branch_manager_name ?? b.manager_name),
					branch_manager_phone:
						b.manager?.phone_number ?? b.branch_manager_phone ?? b.manager_phone,
					branch_manager_email:
						b.manager?.email ?? b.branch_manager_email ?? b.manager_email,

					branch_created_at: b.branch_created_at ?? b.created_at,
					branch_updated_at: b.branch_updated_at ?? b.updated_at,
					subsidiary_name: subsidiary?.subsidiary_name ?? subsidiary?.name,
					subsidiary_rut: subsidiary?.subsidiary_rut ?? subsidiary?.rut,
					commune_id: b.commune_id ?? b.commune?.id,
					commune_name: b.commune?.name,
				};
			});

			const normalizedBranches = branchesData.map(normalizeBranchData);
			return normalizedBranches;
		} catch (err: any) {
			return rejectWithValue(err.response?.data?.message || 'Error al cargar sucursales');
		}
	},
	{
		condition: (params, { getState }) => {
			const state: any = getState();
			const existingBranches = state?.sucursales?.lista || [];

			// Si ya hay sucursales y no se fuerza, cancelar la ejecución
			if (existingBranches.length > 0 && !params?.force) {
				return false;
			}

			return true;
		},
	},
);

export const fetchSucursalDetail = createAsyncThunk<ISucursal, number, { rejectValue: string }>(
	'sucursales/fetchSucursalDetail',
	async (sucursalId, { rejectWithValue }) => {
		try {
			const resp = await ApiService.fetchData<{ data: any }>({
				url: `/branches/${sucursalId}`,
				method: 'get',
				params: { with: 'commune,manager' }, // ✅ Agregar manager
			});
			const raw: any = (resp as any).data?.data ?? (resp as any).data;
			const minimal = {
				id: raw?.id,
				subsidiary_id: raw?.subsidiary_id,
				branch_name: raw?.branch_name,
				branch_address: raw?.branch_address,
				branch_phone: raw?.branch_phone,
				branch_email: raw?.branch_email,
				branch_status: raw?.branch_status,

				// ✅ Nuevo: Campos de manager
				manager_id: raw?.manager_id,
				manager: raw?.manager,

				// DEPRECATED: Mantener por compatibilidad
				branch_manager_name: raw?.manager?.name // Backend devuelve "name" directamente
					? raw.manager.name
					: raw?.manager?.first_name
						? `${raw.manager.first_name} ${raw.manager.last_name}`
						: raw?.branch_manager_name,
				branch_manager_phone:
					raw?.manager?.phone ?? raw?.manager?.phone_number ?? raw?.branch_manager_phone,
				branch_manager_email: raw?.manager?.email ?? raw?.branch_manager_email,

				branch_opening_hours: raw?.branch_opening_hours,
				branch_location: raw?.branch_location,
				branch_created_at: raw?.branch_created_at,
				branch_updated_at: raw?.branch_updated_at,
				created_at: raw?.created_at,
				updated_at: raw?.updated_at,
				subsidiary_rut: raw?.subsidiary_rut,
				subsidiary_name: raw?.subsidiary_name,
			};
			return normalizeBranchData(minimal);
		} catch (err: any) {
			return rejectWithValue(
				err.response?.data?.message || 'Error al cargar detalle de sucursal',
			);
		}
	},
);

export const createSucursal = createAsyncThunk<
	ISucursal,
	Partial<ISucursal>,
	{ rejectValue: string }
>('sucursales/createSucursal', async (sucursalData, { rejectWithValue }) => {
	try {
		const normalizeCommunePayload = (d: any) => {
			const p: any = { ...d };
			if (p.commune !== undefined) {
				const v = p.commune?.value ?? p.commune?.id ?? p.commune;
				p.commune_id = v || v === 0 ? Number(v) : null;
				delete p.commune;
			}
			if (p.comuna !== undefined) {
				const v = p.comuna?.value ?? p.comuna?.id ?? p.comuna;
				p.commune_id = v || v === 0 ? Number(v) : null;
				delete p.comuna;
			}
			if (p.commune_id !== undefined) {
				p.commune_id =
					p.commune_id === '' || p.commune_id === null ? null : Number(p.commune_id);
				if (Number.isNaN(p.commune_id)) p.commune_id = null;
			}
			return p;
		};

		const payload = normalizeCommunePayload(sucursalData);

		const branch = await ApiService.fetchNormalized<ISucursal>({
			url: '/branches',
			method: 'post',
			data: payload,
			params: { with: 'subsidiary,commune,manager' }, // ✅ Incluir manager en respuesta
		});
		return normalizeBranchData(branch);
	} catch (err: any) {
		return rejectWithValue(err.response?.data?.message || 'Error al crear sucursal');
	}
});

export const updateSucursal = createAsyncThunk<
	ISucursal,
	{ id: number; data: Partial<ISucursal> },
	{ rejectValue: string }
>('sucursales/updateSucursal', async ({ id, data }, { rejectWithValue }) => {
	try {
		const normalizeCommunePayload = (d: any) => {
			const p: any = { ...d };
			if (p.commune !== undefined) {
				const v = p.commune?.value ?? p.commune?.id ?? p.commune;
				p.commune_id = v || v === 0 ? Number(v) : null;
				delete p.commune;
			}
			if (p.comuna !== undefined) {
				const v = p.comuna?.value ?? p.comuna?.id ?? p.comuna;
				p.commune_id = v || v === 0 ? Number(v) : null;
				delete p.comuna;
			}
			if (p.commune_id !== undefined) {
				p.commune_id =
					p.commune_id === '' || p.commune_id === null ? null : Number(p.commune_id);
				if (Number.isNaN(p.commune_id)) p.commune_id = null;
			}
			return p;
		};

		const payload = normalizeCommunePayload(data);

		const branch = await ApiService.fetchNormalized<ISucursal>({
			url: `/branches/${id}`,
			method: 'patch', // ✅ Cambiar a PATCH para coincidir con el backend
			data: payload,
			params: { with: 'subsidiary,commune,manager' }, // ✅ Incluir manager en respuesta
		});
		return normalizeBranchData(branch);
	} catch (err: any) {
		return rejectWithValue(err.response?.data?.message || 'Error al actualizar sucursal');
	}
});

export const deleteSucursal = createAsyncThunk<number, number, { rejectValue: string }>(
	'sucursales/deleteSucursal',
	async (sucursalId, { rejectWithValue }) => {
		try {
			await ApiService.fetchData<void>({
				url: `/branches/${sucursalId}`,
				method: 'delete',
			});
			return sucursalId;
		} catch (err: any) {
			return rejectWithValue(err.response?.data?.message || 'Error al eliminar sucursal');
		}
	},
);

const sucursalesSlice = createSlice({
	name: 'sucursales',
	initialState,
	reducers: {
		clearDetalle(state) {
			state.detalle = undefined;
			state.error = undefined;
		},
		clearErrors(state) {
			state.error = undefined;
			state.createError = undefined;
			state.updateError = undefined;
			state.deleteError = undefined;
		},
		resetSucursalesState: () => initialState,
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchMisSucursales.pending, (state) => {
				state.loading = true;
				state.error = undefined;
			})
			.addCase(fetchMisSucursales.fulfilled, (state, action: PayloadAction<ISucursal[]>) => {
				state.loading = false;
				state.lista = action.payload;
				state.error = undefined;
			})
			.addCase(fetchMisSucursales.rejected, (state, { payload }) => {
				state.loading = false;
				state.error = payload;
			});

		builder
			.addCase(fetchSucursalDetail.pending, (state) => {
				state.loading = true;
				state.error = undefined;
			})
			.addCase(fetchSucursalDetail.fulfilled, (state, action: PayloadAction<ISucursal>) => {
				state.loading = false;
				state.detalle = action.payload;
				state.error = undefined;
			})
			.addCase(fetchSucursalDetail.rejected, (state, { payload }) => {
				state.loading = false;
				state.error = payload;
			});

		builder
			.addCase(createSucursal.pending, (state) => {
				state.createLoading = true;
				state.createError = undefined;
			})
			.addCase(createSucursal.fulfilled, (state, action: PayloadAction<ISucursal>) => {
				state.createLoading = false;
				state.lista.push(action.payload);
				state.createError = undefined;
			})
			.addCase(createSucursal.rejected, (state, { payload }) => {
				state.createLoading = false;
				state.createError = payload;
			});

		builder
			.addCase(updateSucursal.pending, (state) => {
				state.updateLoading = true;
				state.updateError = undefined;
			})
			.addCase(updateSucursal.fulfilled, (state, action: PayloadAction<ISucursal>) => {
				state.updateLoading = false;
				const idx = state.lista.findIndex((s) => s.id === action.payload.id);
				if (idx !== -1) state.lista[idx] = action.payload;
				if (state.detalle?.id === action.payload.id) {
					state.detalle = action.payload;
				}
				state.updateError = undefined;
			})
			.addCase(updateSucursal.rejected, (state, { payload }) => {
				state.updateLoading = false;
				state.updateError = payload;
			});

		builder
			.addCase(deleteSucursal.pending, (state) => {
				state.deleteLoading = true;
				state.deleteError = undefined;
			})
			.addCase(deleteSucursal.fulfilled, (state, action: PayloadAction<number>) => {
				state.deleteLoading = false;
				state.lista = state.lista.filter((s) => s.id !== action.payload);
				if (state.detalle?.id === action.payload) {
					state.detalle = undefined;
				}
				state.deleteError = undefined;
			})
			.addCase(deleteSucursal.rejected, (state, { payload }) => {
				state.deleteLoading = false;
				state.deleteError = payload;
			});
	},
});

export const { clearDetalle, clearErrors, resetSucursalesState } = sucursalesSlice.actions;
export default sucursalesSlice.reducer;
