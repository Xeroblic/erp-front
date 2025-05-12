import ApiService from "@/services/ApiService";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface AuthState {
  access: string | undefined;
  loading: boolean;
  error: string | undefined;
  isAuthenticated: boolean;
  user: any | undefined;

}

const initialState: AuthState = {
  access: undefined,
  isAuthenticated: false,
  loading: false,
  error: undefined,
  user: undefined,
};

export const loginThunk = createAsyncThunk<
  { token: string },
  { email: string; password: string },
  { rejectValue: string }
>("auth/loginThunk", async ({ email, password }, { rejectWithValue, dispatch }) => {
  try {
    const response = await ApiService.fetchData({
      url: "/login",
      method: "post",
      data: { email, password },
      isLoginRequest: true,
    });
    const token = (response.data as { token: string }).token;
    dispatch(userMeThunk({ token }));
    return { token };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || "Error de autenticación");
  }
});

export const userMeThunk = createAsyncThunk<
  any,
  { token: string | undefined },
  { rejectValue: string }
>("auth/userMeThunk", async ({ token }, { rejectWithValue }) => {
  try {
    const response = await ApiService.fetchData({
      url: "/perfil",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    return rejectWithValue("No se pudo obtener el perfil");
  }
});
export const obtenerPersonalizacionThunk = createAsyncThunk<
  any,
  { token: string },
  { rejectValue: string }
>("auth/obtenerPersonalizacionThunk", async ({ token }, { rejectWithValue }) => {
  try {
    const response = await ApiService.fetchData({
      url: "/usuario/personalizacion",
      method: "get",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    return rejectWithValue("No se pudo obtener la personalización");
  }
});


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    LOGOUT: (state) => {
      state.access = undefined;
      state.isAuthenticated = false;
      state.user = undefined;
    },
    GUARDAR_TOKEN: (state, action) => {
      state.access = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.access = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      .addCase(userMeThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(userMeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(userMeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
        .addCase(obtenerPersonalizacionThunk.pending, (state) => {
            state.loading = true;
        })
        .addCase(obtenerPersonalizacionThunk.fulfilled, (state, action) => {
            state.loading = false;
            state.user = {
                ...state.user,
                personalizacion: action.payload,
            };
        })
        .addCase(obtenerPersonalizacionThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
            toast.error(action.payload);
        }
      );
  },
});

export const { LOGOUT, GUARDAR_TOKEN } = authSlice.actions;
export default authSlice.reducer;
