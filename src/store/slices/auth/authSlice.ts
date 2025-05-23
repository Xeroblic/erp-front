// src/store/slices/auth/authSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import ApiService from "@/services/ApiService";
import { RootState } from "@/store"; // Aquí importas tu RootState
import { IPersonalizacionUsuario, IUserMe } from "@/interface/user.interface";

export interface AuthState {
  access?: string;
  permisos: string[];
  loading: boolean;
  error?: string;
  isAuthenticated: boolean;
  personalizacionUsuario?: IPersonalizacionUsuario;
  user?: IUserMe & { authority?: string[] };
}

const initialState: AuthState = {
  access: undefined,
  permisos: [],
  loading: false,
  error: undefined,
  isAuthenticated: false,
  user: undefined,
};

// 1) loginThunk obtiene el token y falla si algo sale mal
export const loginThunk = createAsyncThunk<
  void,
  { email: string; password: string },
  { rejectValue: string }
>(
  "auth/login",
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const resp = await ApiService.fetchData<{ token: string }>({
        url: "/login",
        method: "post",
        data: { email, password },
        isLoginRequest: true,
      });
      const token = resp.data.token;
      dispatch(setToken(token));
      // NOTA: no usamos unwrap aquí
      await (dispatch as import("@reduxjs/toolkit").ThunkDispatch<RootState, any, any>)(userMeThunk());
    } catch (err: any) {
      const msg = err.response?.data?.error || "Error de autenticación";
      return rejectWithValue(msg);
    }
  }
);


export const userMeThunk = createAsyncThunk<
  { user: IUserMe; permisos: string[] },
  void,
  { state: RootState; rejectValue: string }
>(
  "auth/userMe",
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.access;
    if (!token) return rejectWithValue("No autenticado");
    try {
      const resp = await ApiService.fetchData<{
        user: IUserMe;
        permisos: string[];
      }>({
        url: "/perfil",
        method: "get",
      });
      return { user: resp.data.user, permisos: resp.data.permisos };
    } catch {
      return rejectWithValue("No se pudo obtener el perfil");
    }
  }
);

// 3) personalización
export const obtenerPersonalizacionThunk = createAsyncThunk<
  IPersonalizacionUsuario,
  void,
  { rejectValue: string }
>(
  "auth/obtenerPersonalizacion",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await ApiService.fetchData<IPersonalizacionUsuario>({
        url: "/usuario/personalizacion",
        method: "get",
      });
      return resp.data;
    } catch {
      return rejectWithValue("No se pudo obtener la personalización");
    }
  }
);

export const actualizarPersonalizacionThunk = createAsyncThunk<
  IPersonalizacionUsuario,
  { tema: string; font_size: number },
  { rejectValue: string }
>(
  "auth/actualizarPersonalizacion",
  async ({ tema, font_size }, { rejectWithValue }) => {
    try {
      const resp = await ApiService.fetchData<IPersonalizacionUsuario>({
        url: "/usuario/personalizacion",
        method: "put",
        data: { tema, font_size },
      });
      return resp.data;
    } catch {
      return rejectWithValue("No se pudo actualizar la personalización");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.access = undefined;
      state.permisos = [];
      state.user = undefined;
      state.isAuthenticated = false;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.access = action.payload;
    },
  },
  extraReducers: (builder) => {
    // ---- login ----
    builder
      .addCase(loginThunk.pending, (s) => {
        s.loading = true;
        s.error = undefined;
      })
      .addCase(loginThunk.fulfilled, (s) => {
        s.loading = false;
      })
      .addCase(loginThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
        toast.error(a.payload);
      });

    // ---- userMe ----
    builder
      .addCase(userMeThunk.pending, (s) => {
        s.loading = true;
      })
      .addCase(userMeThunk.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.user = { ...payload.user, authority: payload.permisos };
        s.permisos = payload.permisos;
        s.isAuthenticated = true;
      })
      .addCase(userMeThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
        toast.error(a.payload);
      });

    // ---- personalización ----
    builder
      .addCase(obtenerPersonalizacionThunk.pending, (s) => {
        s.loading = true;
      })
      .addCase(obtenerPersonalizacionThunk.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.personalizacionUsuario = payload;
      })
      .addCase(obtenerPersonalizacionThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
        toast.error(a.payload);
      });

    builder
      .addCase(actualizarPersonalizacionThunk.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.personalizacionUsuario = payload;
      })
      .addCase(actualizarPersonalizacionThunk.rejected, (s, a) => {
        s.loading = false;
        toast.error(a.payload);
      });
  },
});

export const { logout, setToken } = authSlice.actions;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;

export const selectUserAuthority = (state: RootState) => state.auth.permisos;

export default authSlice.reducer;