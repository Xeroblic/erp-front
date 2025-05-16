import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import { IEmpresa, IUsuarioEmpresa } from '@/interface/empresas.interface';

export interface EmpresaState {
  loading: boolean;
  error?: string;
  listaEmpresas: IEmpresa[];
  detalleEmpresa?: IEmpresa;
  listaSubempresas: IEmpresa['subempresas'];
  empresaUsuarios?: IEmpresa;
  inviteLoading: boolean;
  inviteError?: string;
  inviteResponse?: { usuario: IUsuarioEmpresa; password_temporal: string };
}

const initialState: EmpresaState = {
  loading: false,
  error: undefined,
  listaEmpresas: [],
  detalleEmpresa: undefined,
  listaSubempresas: [],
  empresaUsuarios: undefined,
  inviteLoading: false,
  inviteError: undefined,
  inviteResponse: undefined,
};

// Obtener todas las empresas
export const fetchEmpresas = createAsyncThunk<IEmpresa[], void, { rejectValue: string }>(
  'empresa/fetchEmpresas',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ApiService.fetchData<IEmpresa[]>({ url: '/empresas/${id}', method: 'get' });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching empresas');
    }
  }
);

// Obtener detalle de una empresa
export const fetchEmpresaPrincipal = createAsyncThunk<IEmpresa, void, { rejectValue: string }>(
  'empresa/fetchEmpresaPrincipal',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await ApiService.fetchData<IEmpresa>({
        url: '/empresa',
        method: 'get'
      });
      return data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Error al cargar empresa');
    }
  }
);


export const fetchEmpresaDetail = createAsyncThunk<IEmpresa, number>(
  'empresa/fetchEmpresaDetail',
  async (empresaId, { rejectWithValue }) => {
    try {
      const response = await ApiService.fetchData<IEmpresa>({
        url: `/empresas/${empresaId}`,
        method: 'get'
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar la empresa');
    }
  }
);


// Obtener subempresas de una empresa
export const fetchSubempresas = createAsyncThunk<IEmpresa['subempresas'], number, { rejectValue: string }>(
  'empresa/fetchSubempresas',
  async (empresaId, { rejectWithValue }) => {
    try {
      const response = await ApiService.fetchData<IEmpresa>({ url: `/empresas/${empresaId}/subempresas`, method: 'get' });
      return response.data.subempresas;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching subempresas');
    }
  }
);

// Obtener usuarios de una empresa (incluye subempresas y sucursales)
export const fetchEmpresaUsuarios = createAsyncThunk<IEmpresa, number, { rejectValue: string }>(
  'empresa/fetchEmpresaUsuarios',
  async (empresaId, { rejectWithValue }) => {
    try {
      const response = await ApiService.fetchData<IEmpresa>({ url: `/empresas/${empresaId}/usuarios`, method: 'get' });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching usuarios');
    }
  }
);

// Invitar a un nuevo usuario a la empresa
export const inviteUsuario = createAsyncThunk<
  { usuario: IUsuarioEmpresa; password_temporal: string },
  { empresaId: number; nombre: string; email: string },
  { rejectValue: string }
>(
  'empresa/inviteUsuario',
  async ({ empresaId, nombre, email }, { rejectWithValue }) => {
    try {
      const response = await ApiService.fetchData<{ usuario: IUsuarioEmpresa; password_temporal: string }>({
        url: `/empresas/${empresaId}/invitar`,
        method: 'post',
        data: { nombre, email },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error inviting usuario');
    }
  }
);

const empresaSlice = createSlice({
  name: 'empresa',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmpresas.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchEmpresas.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.listaEmpresas = payload;
      })
      .addCase(fetchEmpresas.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })

      .addCase(fetchEmpresaDetail.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchEmpresaDetail.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.detalleEmpresa = payload;
      })
      .addCase(fetchEmpresaDetail.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })
      .addCase(fetchEmpresaPrincipal.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchEmpresaPrincipal.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.detalleEmpresa = payload;
      })
      .addCase(fetchEmpresaPrincipal.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })

      .addCase(fetchSubempresas.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchSubempresas.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.listaSubempresas = payload;
      })
      .addCase(fetchSubempresas.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      .addCase(fetchEmpresaUsuarios.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchEmpresaUsuarios.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.empresaUsuarios = payload;
      })
      .addCase(fetchEmpresaUsuarios.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      .addCase(inviteUsuario.pending, (state) => {
        state.inviteLoading = true;
        state.inviteError = undefined;
      })
      .addCase(inviteUsuario.fulfilled, (state, { payload }) => {
        state.inviteLoading = false;
        state.inviteResponse = payload;
      })
      .addCase(inviteUsuario.rejected, (state, { payload }) => {
        state.inviteLoading = false;
        state.inviteError = payload;
      });
  },
});

export default empresaSlice.reducer;
