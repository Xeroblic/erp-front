import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import ApiService from "@/services/ApiService";
import { RootState } from "@/store/rootReducer";
import { IPersonalizacionUsuario, IUserMe } from "@/interface/user.interface";

// Estado de autenticación
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

// Login y obtención de token + perfil
export const loginThunk = createAsyncThunk<
  void,
  { email: string; password: string },
  { rejectValue: string }
>(
  "auth/login",
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const response = await ApiService.fetchData<{ token: string }>({
        url: "/login",
        method: "post",
        data: { email, password },
        isLoginRequest: true,
      });
      const token = response.data.token;
      // Guardar token
      dispatch(setToken(token));
      // Traer perfil y permisos del usuario
      // await dispatch(userMeThunk());
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Error de autenticación"
      );
    }
  }
);

// Obtener perfil y permisos del usuario logueado
export const userMeThunk = createAsyncThunk<
  any,
  void,
  { state: RootState; rejectValue: string }
>(
  "auth/userMe",
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.access;
    if (!token) return rejectWithValue("No autenticado");
    try {
      const response = await ApiService.fetchData<any>({
        url: "/perfil",
        method: "get",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data; // espera { usuario fields..., permisos: string[] }
    } catch (error: any) {
      return rejectWithValue("No se pudo obtener el perfil");
    }
  }
);

// Personalización del usuario
export const obtenerPersonalizacionThunk = createAsyncThunk<
  IPersonalizacionUsuario,
  void,
  { state: RootState; rejectValue: string }
>(
  "auth/obtenerPersonalizacion",
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.access;
    try {
      const response = await ApiService.fetchData<IPersonalizacionUsuario>({
        url: "/usuario/personalizacion",
        method: "get",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue("No se pudo obtener la personalización");
    }
  }
);

export const actualizarPersonalizacionThunk = createAsyncThunk<
  IPersonalizacionUsuario,
  { tema: string; font_size: number },
  { state: RootState; rejectValue: string }
>(
  "auth/actualizarPersonalizacion",
  async ({ tema, font_size }, { getState, rejectWithValue }) => {
    const token = getState().auth.access;
    try {
      const response = await ApiService.fetchData<IPersonalizacionUsuario>({
        url: "/usuario/personalizacion",
        method: "put",
        data: { tema, font_size },
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue("No se pudo actualizar la personalización");
    }
  }
);

// Slice
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
    // Login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(loginThunk.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });

    // Perfil y permisos
    builder
      .addCase(userMeThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(userMeThunk.fulfilled, (state, action) => {
        state.loading = false;
        // action.payload debe incluir todos los campos de user + permisos
        state.user = { ...action.payload, authority: action.payload.permisos };
        state.permisos = action.payload.permisos;
        state.isAuthenticated = true;
      })
      .addCase(userMeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });

    // Personalización
    builder
      .addCase(obtenerPersonalizacionThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(obtenerPersonalizacionThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.personalizacionUsuario = action.payload;
      })
      .addCase(obtenerPersonalizacionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });

    builder
      .addCase(actualizarPersonalizacionThunk.fulfilled, (state, action) => {
        state.personalizacionUsuario = action.payload;
        state.loading = false;
      })
      .addCase(actualizarPersonalizacionThunk.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.payload);
      });
  },
});

export const { logout, setToken } = authSlice.actions;

// Selector para permisos
export const selectUserAuthority = (state: RootState) => state.auth.permisos;

export default authSlice.reducer;
