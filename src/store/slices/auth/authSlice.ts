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

}

const initialState: AuthState = {
  access: undefined,
  refresh: undefined,
  loading: false,
  error: undefined,
  isAuthenticated: false,
  permisos: [],
  user: undefined,
  listaGrupos: undefined,

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
      await dispatch(obtenerPersonalizacionFromSlice() as any);

      return { access: token, refresh: "" };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Error de autenticación");
    }
  });

export const userMeThunk = createAsyncThunk<
  { user: IUserMe; permisos: string[]; roles?: string[] },
  void,
  { state: RootState; rejectValue: string }
>("auth/userMe", async (_, { getState, rejectWithValue }) => {
  const token = getState().auth.access;
  if (!token) return rejectWithValue("Token inválido");

  try {
    const resp = await ApiService.fetchData<{
      user: IUserMe;
      permisos: string[];
      roles?: string[];
      personalization?: any; // La personalización puede venir con el perfil
    }>({
      url: "/perfil",
      method: "get",
      headers: { Authorization: `Bearer ${token}` },
    });

    return resp.data;
  } catch {
    return rejectWithValue("No se pudo obtener el perfil");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.access = undefined;
      state.user = undefined;
      state.refresh = undefined;
      state.permisos = [];
      state.isAuthenticated = false;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.access = action.payload;
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

export const { logout, setToken } = authSlice.actions;

// Selectores
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectUserAuthority = (state: RootState) => state.auth.permisos;
export default authSlice.reducer;
