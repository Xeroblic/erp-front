import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import { normalizeCommunePayload } from '@/utils/apiHelpers';
import { IEmpresa, ISubempresa, IUsuarioEmpresa } from '@/interface/empresas.interface';

export interface EmpresaState {
  loading: boolean;
  error?: string;
  // 🔥 NUEVO: Estados dinámicos sin hardcoding
  miEmpresa?: IEmpresa;                          // Empresa del usuario actual
  miEmpresaSubsidiarias: ISubempresa[];          // Subsidiarias de mi empresa
  miEmpresaUsuarios: IUsuarioEmpresa[];          // Usuarios de mi empresa

  // 📋 Estados para operaciones específicas
  updateLoading: boolean;
  updateError?: string;
  subsidiaryActionLoading: boolean;
  subsidiaryActionError?: string;

  // 👥 Estados para invitaciones
  inviteLoading: boolean;
  inviteError?: string;
  inviteResponse?: { usuario: IUsuarioEmpresa; password_temporal: string };
}

const initialState: EmpresaState = {
  loading: false,
  error: undefined,
  // 🚀 Estados dinámicos iniciales
  miEmpresa: undefined,
  miEmpresaSubsidiarias: [],
  miEmpresaUsuarios: [],

  // 📋 Estados de operaciones
  updateLoading: false,
  updateError: undefined,
  subsidiaryActionLoading: false,
  subsidiaryActionError: undefined,

  // 👥 Estados de invitaciones
  inviteLoading: false,
  inviteError: undefined,
  inviteResponse: undefined,
};

export const fetchMiEmpresa = createAsyncThunk<IEmpresa, void, { rejectValue: string }>(
  'empresa/fetchMiEmpresa',
  async (_, { rejectWithValue }) => {
    try {
      const empresa = await ApiService.fetchNormalized<IEmpresa>({
        url: '/my-company',
        method: 'get'
      });
      return empresa;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar tu empresa');
    }
  }
);

/**
 * 🔥 Actualizar MI empresa (dinámico, sin ID)
 * Endpoint: PUT /api/my-company
 */
export const updateMiEmpresa = createAsyncThunk<
  IEmpresa,
  Partial<IEmpresa>,
  { rejectValue: string }
>(
  'empresa/updateMiEmpresa',
  async (empresaData, { rejectWithValue }) => {
    try {
      const empresa = await ApiService.fetchNormalized<IEmpresa>({
        url: '/my-company',
        method: 'put',
        data: empresaData,
      });
      return empresa;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar tu empresa');
    }
  }
);


// Función para normalizar datos del backend al formato del frontend
const normalizeSubsidiaryData = (backendData: any): ISubempresa => {
  return {
    ...backendData,
    // Mapear campos del backend al formato del frontend
    name: backendData.subsidiary_name || backendData.name || '',
    rut: backendData.subsidiary_rut || backendData.rut,
    website: backendData.subsidiary_website || backendData.website,
    phone: backendData.subsidiary_phone || backendData.phone,
    address: backendData.subsidiary_address || backendData.address,
    email: backendData.subsidiary_email || backendData.email,
    manager_name: backendData.subsidiary_manager_name || backendData.manager_name,
    manager_phone: backendData.subsidiary_manager_phone || backendData.manager_phone,
    manager_email: backendData.subsidiary_manager_email || backendData.manager_email,
    status: backendData.subsidiary_status ?? backendData.status,
    sucursales: backendData.sucursales || [],
    branches_count: backendData.branches?.length || backendData.branches_count || 0,
    // Comuna (si viene expandida)
    commune_id: backendData.commune_id ?? backendData?.commune?.id,
    commune: backendData.commune
  }
}

export const fetchMiEmpresaSubsidiarias = createAsyncThunk<
  ISubempresa[],
  void,
  { rejectValue: string; state: any }
>(
  'empresa/fetchMiEmpresaSubsidiarias',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const companyId = state?.empresa?.miEmpresa?.id;

      if (companyId) {
        // Preferir datos completos desde /subsidiaries filtrando por company_id
        const response = await ApiService.fetchData<{ data?: any[]; subsidiaries?: any[] }>({
          url: '/subsidiaries',
          method: 'get',
          params: { company_id: companyId, with: 'commune,branches,branches.commune' },
        });

        const rawList: any[] =
          Array.isArray(response.data?.data)
            ? (response.data.data as any[])
            : Array.isArray((response.data as any)?.subsidiaries)
              ? ((response.data as any).subsidiaries as any[])
              : [];

        return rawList.map(normalizeSubsidiaryData);
      }

      // Fallback: usar endpoint de mi empresa (puede traer datos resumidos)
      const response = await ApiService.fetchData<{ subempresas: any[] }>({
        url: '/my-company/subsidiaries',
        method: 'get'
      });
      return response.data.subempresas.map(normalizeSubsidiaryData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar subsidiarias');
    }
  }
);


export const createSubsidiaria = createAsyncThunk<
  ISubempresa,
  Partial<ISubempresa>,
  { rejectValue: string }
>(
  'empresa/createSubsidiaria',
  async (subsidiaryData, { rejectWithValue }) => {
    try {
      const payload = normalizeCommunePayload(subsidiaryData);

      const subsidiary = await ApiService.fetchNormalized<ISubempresa>({
        url: '/subsidiaries',
        method: 'post',
        data: payload,
      });
      return subsidiary;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear subsidiaria');
    }
  }
);

/**
 * 🏪 Actualizar subsidiaria de MI empresa
 * Endpoint: PUT /api/my-company/subsidiaries/{id}
 */
export const updateSubsidiaria = createAsyncThunk<
  ISubempresa,
  { id: number; data: Partial<ISubempresa> },
  { rejectValue: string }
>(
  'empresa/updateSubsidiaria',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const subsidiary = await ApiService.fetchNormalized<ISubempresa>({
        url: `/subsidiaries/${id}`,
        method: 'put',
        data,
      });
      return subsidiary;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar subsidiaria');
    }
  }
);

/**
 * 👥 Obtener usuarios de MI empresa (dinámico)
 * Endpoint: GET /api/my-company/users
 */
export const fetchMiEmpresaUsuarios = createAsyncThunk<IUsuarioEmpresa[], void, { rejectValue: string }>(
  'empresa/fetchMiEmpresaUsuarios',
  async (_, { rejectWithValue }) => {
    try {
      const users = await ApiService.fetchNormalized<IUsuarioEmpresa[]>({
        url: '/my-company/users',
        method: 'get'
      });
      return users;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar usuarios');
    }
  }
);

/**
 * 👥 Invitar usuario a MI empresa (dinámico)
 * Endpoint: POST /api/my-company/invite
 */
export const inviteUsuarioToMiEmpresa = createAsyncThunk<
  { usuario: IUsuarioEmpresa; password_temporal: string },
  { nombre: string; email: string },
  { rejectValue: string }
>(
  'empresa/inviteUsuarioToMiEmpresa',
  async ({ nombre, email }, { rejectWithValue }) => {
    try {
      const response = await ApiService.fetchData<{ usuario: IUsuarioEmpresa; password_temporal: string }>({
        url: '/my-company/invite',
        method: 'post',
        data: { nombre, email },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error invitando usuario');
    }
  }
);

// 🔥 NUEVO SLICE DINÁMICO
const empresaSlice = createSlice({
  name: 'empresa',
  initialState,
  reducers: {
    // 🧹 Limpiar errores manualmente
    clearErrors: (state) => {
      state.error = undefined;
      state.updateError = undefined;
      state.subsidiaryActionError = undefined;
      state.inviteError = undefined;
    },

    // 🔄 Reset del estado
    resetEmpresaState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // 🏢 ===== MI EMPRESA =====
      .addCase(fetchMiEmpresa.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchMiEmpresa.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.miEmpresa = payload;
        state.error = undefined;
      })
      .addCase(fetchMiEmpresa.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // 📝 ===== ACTUALIZAR MI EMPRESA =====
      .addCase(updateMiEmpresa.pending, (state) => {
        state.updateLoading = true;
        state.updateError = undefined;
      })
      .addCase(updateMiEmpresa.fulfilled, (state, { payload }) => {
        state.updateLoading = false;
        state.miEmpresa = payload;
        state.updateError = undefined;
      })
      .addCase(updateMiEmpresa.rejected, (state, { payload }) => {
        state.updateLoading = false;
        state.updateError = payload;
      })

      // 🏪 ===== SUBSIDIARIAS =====
      .addCase(fetchMiEmpresaSubsidiarias.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchMiEmpresaSubsidiarias.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.miEmpresaSubsidiarias = payload;
        state.error = undefined;
      })
      .addCase(fetchMiEmpresaSubsidiarias.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // ➕ ===== CREAR SUBSIDIARIA =====
      .addCase(createSubsidiaria.pending, (state) => {
        state.subsidiaryActionLoading = true;
        state.subsidiaryActionError = undefined;
      })
      .addCase(createSubsidiaria.fulfilled, (state, { payload }) => {
        state.subsidiaryActionLoading = false;
        state.miEmpresaSubsidiarias.push(payload);
        state.subsidiaryActionError = undefined;
      })
      .addCase(createSubsidiaria.rejected, (state, { payload }) => {
        state.subsidiaryActionLoading = false;
        state.subsidiaryActionError = payload;
      })

      // ✏️ ===== ACTUALIZAR SUBSIDIARIA =====
      .addCase(updateSubsidiaria.pending, (state) => {
        state.subsidiaryActionLoading = true;
        state.subsidiaryActionError = undefined;
      })
      .addCase(updateSubsidiaria.fulfilled, (state, { payload }) => {
        state.subsidiaryActionLoading = false;
        const index = state.miEmpresaSubsidiarias.findIndex(sub => sub.id === payload.id);
        if (index !== -1) {
          state.miEmpresaSubsidiarias[index] = payload;
        }
        state.subsidiaryActionError = undefined;
      })
      .addCase(updateSubsidiaria.rejected, (state, { payload }) => {
        state.subsidiaryActionLoading = false;
        state.subsidiaryActionError = payload;
      })

      // 👥 ===== USUARIOS DE MI EMPRESA =====
      .addCase(fetchMiEmpresaUsuarios.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchMiEmpresaUsuarios.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.miEmpresaUsuarios = payload;
        state.error = undefined;
      })
      .addCase(fetchMiEmpresaUsuarios.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // 📧 ===== INVITAR USUARIO =====
      .addCase(inviteUsuarioToMiEmpresa.pending, (state) => {
        state.inviteLoading = true;
        state.inviteError = undefined;
      })
      .addCase(inviteUsuarioToMiEmpresa.fulfilled, (state, { payload }) => {
        state.inviteLoading = false;
        state.inviteResponse = payload;
        state.inviteError = undefined;
      })
      .addCase(inviteUsuarioToMiEmpresa.rejected, (state, { payload }) => {
        state.inviteLoading = false;
        state.inviteError = payload;
      });
  },
});

// 🚀 Exportar actions y reducer
export const { clearErrors, resetEmpresaState } = empresaSlice.actions;
export default empresaSlice.reducer;
