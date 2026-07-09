// src/store/slices/subempresa/subempresaSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import { normalizeCommunePayload } from '@/utils/apiHelpers';
import { ISubempresa } from '@/interface/empresas.interface';

export interface SubempresaState {
	loading: boolean;
	error?: string;
	lista: ISubempresa[];
	detalle?: ISubempresa;
	createLoading: boolean;
	createError?: string;
	updateLoading: boolean;
	updateError?: string;
	deleteLoading: boolean;
	deleteError?: string;
}

const initialState: SubempresaState = {
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

const normalizeBranchForSubsidiary = (branch: any = {}): any => {
	const name =
		branch.name ||
		branch.branch_name ||
		branch.nombre ||
		(branch.id ? `Sucursal ${branch.id}` : 'Sucursal');

	return {
		...branch,
		id: branch.id,
		name,
		branch_name: branch.branch_name ?? name,
		address: branch.address || branch.branch_address || branch.direccion,
		branch_address: branch.branch_address || branch.address || branch.direccion,
		commune_id:
			branch.commune_id ??
			branch.commune?.id ??
			branch.communeId ??
			branch.comuna_id ??
			branch.comuna?.id,
		commune_name:
			branch.commune_name ||
			branch.commune?.name ||
			branch.comuna?.nombre ||
			branch.comuna?.name,
		commune: branch.commune || branch.comuna,
	};
};

// Normaliza la respuesta de GET/PATCH /subsidiaries. El backend SÓLO manda campos
// `subsidiary_*` (verificado contra SubsidiaryResource): ya no se fabrican alias camel
// (name/rut/phone/...) ni fallbacks a claves sin prefijo que el backend nunca envía.
const normalizeSubsidiaryData = (backendData: any): ISubempresa => {
	const managerObj = backendData.manager || backendData.manager_data || null;

	return {
		...backendData,
		company_id: backendData.company_id,
		manager:
			managerObj && typeof managerObj === 'object'
				? {
						id: managerObj.id ?? managerObj.user_id,
						name:
							managerObj.name ||
							`${managerObj.first_name ?? ''} ${managerObj.last_name ?? ''}`.trim() ||
							undefined,
						first_name: managerObj.first_name,
						last_name: managerObj.last_name,
						email: managerObj.email,
						phone: managerObj.phone ?? managerObj.phone_number ?? null,
						phone_number: managerObj.phone_number,
					}
				: undefined,
		sucursales: (backendData.sucursales && backendData.sucursales.length
			? backendData.sucursales
			: backendData.branches || []
		).map(normalizeBranchForSubsidiary),
		branches: backendData.branches?.map(normalizeBranchForSubsidiary),
		branches_count:
			backendData.branches_count ||
			backendData.branches?.length ||
			backendData.sucursales?.length ||
			0,
		commune_id: backendData.commune_id ?? backendData?.commune?.id,
		commune: backendData.commune,
	};
};

export const fetchMisSubsidiarias = createAsyncThunk<ISubempresa[], void, { rejectValue: string }>(
	'subempresa/fetchMisSubsidiarias',
	async (_, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<{ data?: any[]; subsidiaries?: any[] }>({
				url: '/subsidiaries',
				method: 'get',
				params: { with: 'commune,manager,branches,branches.manager,branches.commune' },
			});

			const rawList: any[] = Array.isArray(response.data?.data)
				? response.data.data
				: Array.isArray((response.data as any)?.subsidiaries)
					? ((response.data as any).subsidiaries as any[])
					: [];

			const normalizedSubsidiaries = rawList.map(normalizeSubsidiaryData);
			return normalizedSubsidiaries;
		} catch (err: any) {
			return rejectWithValue(err.response?.data?.message || 'Error al cargar subsidiarias');
		}
	},
);

export const fetchSubsidiariaDetail = createAsyncThunk<
	ISubempresa,
	number,
	{ rejectValue: string }
>('subempresa/fetchSubsidiariaDetail', async (subsidiariaId, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<any>({
			url: `/subsidiaries/${subsidiariaId}`,
			method: 'get',
			params: { with: 'commune,manager,branches,branches.manager,branches.commune' },
		});
		const raw = response.data?.data ?? response.data?.subsidiary ?? response.data;
		return normalizeSubsidiaryData(raw);
	} catch (err: any) {
		return rejectWithValue(
			err.response?.data?.message || 'Error al cargar detalle de subsidiaria',
		);
	}
});

export const createSubsidiaria = createAsyncThunk<
	ISubempresa,
	Partial<ISubempresa>,
	{ rejectValue: string }
>('subempresa/createSubsidiaria', async (subsidiariaData, { rejectWithValue }) => {
	try {
		const payload = normalizeCommunePayload(subsidiariaData);

		const subsidiary = await ApiService.fetchNormalized<ISubempresa>({
			url: '/subsidiaries',
			method: 'post',
			data: payload,
		});
		return subsidiary;
	} catch (err: any) {
		return rejectWithValue(err.response?.data?.message || 'Error al crear subsidiaria');
	}
});

export const updateSubsidiaria = createAsyncThunk<
	ISubempresa,
	{ id: number; company_id?: number; data: Partial<ISubempresa> },
	{ rejectValue: string }
>('subempresa/updateSubsidiaria', async ({ id, company_id, data }, { rejectWithValue }) => {
	try {
		const payloadBase = normalizeCommunePayload(data);
		// En este proyecto la compañía no cambia: forzamos company_id=1 si no viene
		const finalCompanyId = typeof company_id === 'number' && company_id > 0 ? company_id : 1;
		const payload = { ...payloadBase, company_id: finalCompanyId };

		const response = await ApiService.fetchData<any>({
			url: `/subsidiaries/${id}`,
			method: 'patch',
			data: payload,
		});
		const raw = response.data?.data ?? response.data?.subsidiary ?? response.data;
		return normalizeSubsidiaryData(raw);
	} catch (err: any) {
		return rejectWithValue(err.response?.data?.message || 'Error al actualizar subsidiaria');
	}
});

export const deleteSubsidiaria = createAsyncThunk<number, number, { rejectValue: string }>(
	'subempresa/deleteSubsidiaria',
	async (subsidiariaId, { rejectWithValue }) => {
		try {
			await ApiService.fetchData<void>({
				url: `/subsidiaries/${subsidiariaId}`,
				method: 'delete',
			});
			return subsidiariaId;
		} catch (err: any) {
			return rejectWithValue(err.response?.data?.message || 'Error al eliminar subsidiaria');
		}
	},
);

const subempresaSlice = createSlice({
	name: 'subempresa',
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
		resetSubempresaState: () => initialState,
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchMisSubsidiarias.pending, (state) => {
				state.loading = true;
				state.error = undefined;
			})
			.addCase(
				fetchMisSubsidiarias.fulfilled,
				(state, action: PayloadAction<ISubempresa[]>) => {
					state.loading = false;
					state.lista = action.payload;
					state.error = undefined;
				},
			)
			.addCase(fetchMisSubsidiarias.rejected, (state, { payload }) => {
				state.loading = false;
				state.error = payload;
			});

		builder
			.addCase(fetchSubsidiariaDetail.pending, (state) => {
				state.loading = true;
				state.error = undefined;
			})
			.addCase(
				fetchSubsidiariaDetail.fulfilled,
				(state, action: PayloadAction<ISubempresa>) => {
					state.loading = false;
					state.detalle = action.payload;
					state.error = undefined;
				},
			)
			.addCase(fetchSubsidiariaDetail.rejected, (state, { payload }) => {
				state.loading = false;
				state.error = payload;
			});

		builder
			.addCase(createSubsidiaria.pending, (state) => {
				state.createLoading = true;
				state.createError = undefined;
			})
			.addCase(createSubsidiaria.fulfilled, (state, action: PayloadAction<ISubempresa>) => {
				state.createLoading = false;
				state.lista.push(action.payload);
				state.createError = undefined;
			})
			.addCase(createSubsidiaria.rejected, (state, { payload }) => {
				state.createLoading = false;
				state.createError = payload;
			});

		builder
			.addCase(updateSubsidiaria.pending, (state) => {
				state.updateLoading = true;
				state.updateError = undefined;
			})
			.addCase(updateSubsidiaria.fulfilled, (state, action: PayloadAction<ISubempresa>) => {
				state.updateLoading = false;
				const idx = state.lista.findIndex((s) => s.id === action.payload.id);
				if (idx !== -1) state.lista[idx] = action.payload;
				if (state.detalle?.id === action.payload.id) {
					state.detalle = action.payload;
				}
				state.updateError = undefined;
			})
			.addCase(updateSubsidiaria.rejected, (state, { payload }) => {
				state.updateLoading = false;
				state.updateError = payload;
			});

		builder
			.addCase(deleteSubsidiaria.pending, (state) => {
				state.deleteLoading = true;
				state.deleteError = undefined;
			})
			.addCase(deleteSubsidiaria.fulfilled, (state, action: PayloadAction<number>) => {
				state.deleteLoading = false;
				state.lista = state.lista.filter((s) => s.id !== action.payload);
				if (state.detalle?.id === action.payload) {
					state.detalle = undefined;
				}
				state.deleteError = undefined;
			})
			.addCase(deleteSubsidiaria.rejected, (state, { payload }) => {
				state.deleteLoading = false;
				state.deleteError = payload;
			});
	},
});

export const { clearDetalle, clearErrors, resetSubempresaState } = subempresaSlice.actions;
export default subempresaSlice.reducer;
