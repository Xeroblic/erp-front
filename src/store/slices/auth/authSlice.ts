import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import ApiService from "@/services/ApiService";
import { RootState, AppDispatch } from "@/store";
import { IGruposUsuarios, IUserMe } from "@/interface/user.interface";
import { obtenerPersonalizacionThunk as obtenerPersonalizacionFromSlice } from "@/store/slices/personalizacion/personalizacionSlice";

interface LoginResponse {
  access: string
  refresh: string
}

export interface AuthState {
  access?: string;
  refresh: string | undefined
  loading: boolean;
  error?: string;
  isAuthenticated: boolean;
  permisos: string[];
  user?: IUserMe & { authority?: string[] };
  listaGrupos: IGruposUsuarios | undefined
  userLastFetched?: number; // Timestamp del último fetch exitoso
}

const initialState: AuthState = {
  access: localStorage.getItem('access_token') || undefined,
  refresh: localStorage.getItem('refresh_token') || undefined,
  loading: false,
  error: undefined,
  isAuthenticated: false, // Se establecerá a true solo después de validar con el servidor
  permisos: [],
  user: undefined,
  listaGrupos: undefined,
  userLastFetched: undefined,
};

export const loginThunk = createAsyncThunk<LoginResponse, { email: string; password: string }, { rejectValue: string; dispatch: AppDispatch }>(
  "auth/login",
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      const resp = await ApiService.fetchData<{ token: string }>({
        url: "/login",
        method: "post",
        data: { email, password },
      });

      const token = resp.data.token;
      dispatch(setToken(token));
      await dispatch(userMeThunk() as any);

      // Obtener personalización usando el nuevo slice
      // COMENTADO TEMPORALMENTE para evitar bucles en cambios de tema
      // await dispatch(obtenerPersonalizacionFromSlice() as any);

      return { access: token, refresh: "" };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Error de autenticación");
    }
  });

export const userMeThunk = createAsyncThunk<
  { user: IUserMe; permisos: string[]; roles?: string[] },
  void,
  { state: RootState; rejectValue: string }
>("auth/userMe", async (_, { getState, rejectWithValue, signal }) => {
  const token = getState().auth.access;
  if (!token) return rejectWithValue("Token inválido");

  try {
    const resp = await ApiService.fetchData<{
      success?: boolean;
      data?: {
        id?: number;
        email?: string;
        first_name?: string;
        last_name?: string;
        global_roles?: string[];
        all_permissions?: string[];
        direct_permissions?: string[];
        role_permissions?: string[];
        branch?: any;
        companies?: any[];
        [key: string]: any;
      };
      user_context?: {
        current_user_id: number;
        is_super_admin: boolean;
        can_manage_users: boolean;
        access_level: string;
      };
      user?: IUserMe;
      permisos?: string[];
      roles?: string[];
      personalization?: any;
    }>({
      url: "/perfil",
      method: "get",
      headers: { Authorization: `Bearer ${token}` },
      dedupe: true,
      signal: signal,
    });

    let userData: IUserMe;
    let permisos: string[];
    let roles: string[];

    if (resp.data.data && resp.data.data.id) {
      const data = resp.data.data;
      userData = {
        id: data.id!,
        email: data.email!,
        first_name: data.first_name!,
        last_name: data.last_name!,
        ...data
      } as IUserMe;

      permisos = [
        ...(data.all_permissions || []),
        ...(data.direct_permissions || []),
        ...(data.role_permissions || []),
        ...(data.global_roles || [])
      ];

      roles = data.global_roles || [];
    } else {
      // Estructura antigua (compatibilidad)
      userData = resp.data.user || ({} as IUserMe);
      permisos = resp.data.permisos || [];
      roles = resp.data.roles || [];
    }

    return {
      user: userData,
      permisos: Array.from(new Set(permisos)), // Eliminar Duplicados
      roles: Array.from(new Set(roles))
    };
  } catch (error: any) {
    console.error('Error en userMeThunk:', error);
    return rejectWithValue("No se pudo obtener el perfil");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      // Resetear completamente el estado
      state.access = undefined;
      state.user = undefined;
      state.refresh = undefined;
      state.permisos = [];
      state.isAuthenticated = false;
      state.loading = false;
      state.error = undefined;
      state.listaGrupos = undefined;

      // Limpiar localStorage completamente
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('persist:fyr');
      localStorage.removeItem('zentria_themeColor');
      localStorage.removeItem('zentria_themeColorShade');
      localStorage.removeItem('zentria_fontSize');
      localStorage.removeItem('theme');
      localStorage.removeItem('zentria_language');
      localStorage.removeItem('zentria_asideStatus');

    },
    setToken: (state, action: PayloadAction<string>) => {
      state.access = action.payload;
      localStorage.setItem('access_token', action.payload);
    },
    // Nuevo reducer para validar token al inicio
    validateSession: (state) => {
      const token = localStorage.getItem('access_token');
      if (!token && !state.access) {
        state.isAuthenticated = false;
        state.access = undefined;
        state.user = undefined;
        state.refresh = undefined;
        state.permisos = [];
      } else if (token && !state.access) {
        // Si hay token en localStorage pero no en state, restaurarlo
        state.access = token;
        // No marcar como autenticado hasta que se valide con el servidor
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false
        state.access = action.payload.access
        state.refresh = action.payload.refresh
        state.isAuthenticated = true
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(userMeThunk.pending, (s) => {
        s.loading = true;
      })
      .addCase(userMeThunk.fulfilled, (s, { payload }) => {
        s.loading = false;

        const authority = [
          ...payload.permisos,
          ...(payload.user.position ? [payload.user.position] : []),
        ];

        s.user = {
          ...payload.user,
          authority,
          roles: payload.roles || []
        };
        s.permisos = authority;
        s.isAuthenticated = true;
      })
      .addCase(userMeThunk.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload;
        toast.error(action.payload);
      });
  },
});

export const { logout, setToken, validateSession } = authSlice.actions;

// Selectores
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectUserAuthority = (state: RootState) => state.auth.permisos;
export default authSlice.reducer;
