import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';
import { TDarkMode } from '@/types/darkMode.type';
import { TColors } from '@/types/colors.type';
import { TColorIntensity } from '@/types/colorIntensities.type';
import { TLang } from '@/types/lang.type';
import DARK_MODE from '@/constants/darkMode.constant';
import themeConfig from '@/config/theme.config';
import { IPersonalizacionUsuario } from '@/interface/user.interface';

export interface PersonalizacionState {
  fontSize: number;
  themeColor: TColors;
  themeColorShade: TColorIntensity;
  language: TLang;
  darkMode: TDarkMode;
  asideStatus: boolean;

  personalizacionUsuario?: IPersonalizacionUsuario;
  loading: boolean;
  error?: string;

  isInitialized: boolean;
  hasUnsavedChanges: boolean;
}

const getInitialState = (): PersonalizacionState => ({
  fontSize: themeConfig.fontSize,
  themeColor: themeConfig.themeColor,
  themeColorShade: themeConfig.themeColorShade,
  language: themeConfig.language,
  darkMode: themeConfig.theme,
  asideStatus: true,
  personalizacionUsuario: undefined,
  loading: false,
  error: undefined,
  isInitialized: false,
  hasUnsavedChanges: false,
});

type RejectStr = string | undefined;

export const obtenerPersonalizacionThunk = createAsyncThunk<
  IPersonalizacionUsuario,
  void,
  { rejectValue: RejectStr }
>(
  'personalizacion/obtenerPersonalizacion',
  async (_, { getState, rejectWithValue, signal }) => {
    try {
      const state = getState() as any;
      const token = state.auth?.access || localStorage.getItem('access_token');

      if (state.personalizacion?.isInitialized && state.personalizacion?.personalizacionUsuario) {
        return state.personalizacion.personalizacionUsuario as IPersonalizacionUsuario;
      }

      const resp = await ApiService.fetchData<any>({
        url: '/user/personalization',
        method: 'get',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        dedupe: true,
        cacheTTLms: 300_000,
        signal,
      });

      const personalizationData = resp.data.personalization ?? resp.data;
      return personalizationData as IPersonalizacionUsuario;
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') throw error;
      return rejectWithValue('No se pudo obtener la personalización: ' + (error?.message || String(error)));
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as any;
      if (state.personalizacion?.loading) return false;
      if (state.personalizacion?.isInitialized) return false;
      const hasToken = !!state.auth?.access || !!localStorage.getItem('access_token');
      return hasToken;
    },
  },
);

export const actualizarPersonalizacionThunk = createAsyncThunk<
  IPersonalizacionUsuario,
  Partial<Pick<IPersonalizacionUsuario, 'tema' | 'font_size' | 'tcolor' | 'tcolor_int' | 'dark_mode'>>,
  { rejectValue: string }
>(
  'personalizacion/actualizarPersonalizacion',
  async (data, { getState, rejectWithValue }) => {
    const token = (getState() as any).auth?.access;
    try {
      const resp = await ApiService.fetchData<IPersonalizacionUsuario>({
        url: '/user/personalization',
        method: 'put',
        data,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return resp.data as any;
    } catch (error) {
      return rejectWithValue('No se pudo actualizar la personalización');
    }
  },
);

const persistToLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : String(value));
  } catch {
    /* ignore */
  }
};

const personalizacionSlice = createSlice({
  name: 'personalizacion',
  initialState: getInitialState(),
  reducers: {
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = action.payload;
      state.hasUnsavedChanges = true;
      persistToLocalStorage('zentria_fontSize', action.payload);
    },
    setThemeColor: (state, action: PayloadAction<TColors>) => {
      state.themeColor = action.payload;
      state.hasUnsavedChanges = true;
      persistToLocalStorage('zentria_themeColor', action.payload);
    },
    setThemeColorShade: (state, action: PayloadAction<TColorIntensity>) => {
      state.themeColorShade = action.payload;
      state.hasUnsavedChanges = true;
      persistToLocalStorage('zentria_themeColorShade', action.payload);
    },
    setLanguage: (state, action: PayloadAction<TLang>) => {
      state.language = action.payload;
      state.hasUnsavedChanges = true;
      persistToLocalStorage('zentria_language', action.payload);
    },
    setDarkMode: (state, action: PayloadAction<TDarkMode>) => {
      state.darkMode = action.payload;
      state.hasUnsavedChanges = true;
      persistToLocalStorage('theme', action.payload);
    },
    setAsideStatus: (state, action: PayloadAction<boolean>) => {
      state.asideStatus = action.payload;
      persistToLocalStorage('zentria_asideStatus', action.payload);
    },
    syncWithApiData: (state, action: PayloadAction<IPersonalizacionUsuario>) => {
      const apiData = action.payload;
      if (!state.isInitialized) {
        if (apiData.tcolor) {
          state.themeColor = apiData.tcolor as TColors;
          persistToLocalStorage('zentria_themeColor', apiData.tcolor);
        }
        if (apiData.tcolor_int) {
          state.themeColorShade = apiData.tcolor_int as TColorIntensity;
          persistToLocalStorage('zentria_themeColorShade', apiData.tcolor_int);
        }
        if (apiData.font_size) {
          state.fontSize = apiData.font_size;
          persistToLocalStorage('zentria_fontSize', apiData.font_size);
        }
        if (apiData.tema !== undefined && apiData.tema !== null) {
          const darkModeValue = apiData.tema === 1 ? DARK_MODE.LIGHT : apiData.tema === 2 ? DARK_MODE.DARK : DARK_MODE.SYSTEM;
          state.darkMode = darkModeValue;
          persistToLocalStorage('theme', darkModeValue);
        }
      }
      state.personalizacionUsuario = apiData;
      state.isInitialized = true;
    },
    markAsInitialized: (state) => {
      state.isInitialized = true;
    },
    clearUnsavedChanges: (state) => {
      state.hasUnsavedChanges = false;
    },
    resetToDefaults: (state) => {
      state.fontSize = themeConfig.fontSize;
      state.themeColor = themeConfig.themeColor;
      state.themeColorShade = themeConfig.themeColorShade;
      state.language = themeConfig.language;
      state.darkMode = themeConfig.theme;
      state.hasUnsavedChanges = true;
      localStorage.removeItem('zentria_fontSize');
      localStorage.removeItem('zentria_themeColor');
      localStorage.removeItem('zentria_themeColorShade');
      localStorage.removeItem('zentria_language');
      localStorage.removeItem('theme');
    },
    clearPersonalizacionState: (state) => {
      state.personalizacionUsuario = undefined;
      state.loading = false;
      state.error = undefined;
      state.isInitialized = false;
      state.hasUnsavedChanges = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(obtenerPersonalizacionThunk.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(obtenerPersonalizacionThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = undefined;
        const apiData = action.payload;
        state.personalizacionUsuario = apiData;
        if (apiData.tcolor) {
          state.themeColor = apiData.tcolor as TColors;
          persistToLocalStorage('zentria_themeColor', apiData.tcolor);
        }
        if (apiData.tcolor_int) {
          state.themeColorShade = apiData.tcolor_int as TColorIntensity;
          persistToLocalStorage('zentria_themeColorShade', apiData.tcolor_int);
        }
        if (apiData.font_size) {
          state.fontSize = apiData.font_size;
          persistToLocalStorage('zentria_fontSize', apiData.font_size);
        }
        if (apiData.tema !== undefined && apiData.tema !== null) {
          const darkModeValue = apiData.tema === 1 ? DARK_MODE.LIGHT : apiData.tema === 2 ? DARK_MODE.DARK : DARK_MODE.SYSTEM;
          state.darkMode = darkModeValue;
          persistToLocalStorage('theme', darkModeValue);
        }
        state.isInitialized = true;
      })
      .addCase(obtenerPersonalizacionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as any;
        state.isInitialized = true;
      })
      .addCase(actualizarPersonalizacionThunk.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(actualizarPersonalizacionThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = undefined;
        state.personalizacionUsuario = action.payload;
      })
      .addCase(actualizarPersonalizacionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as any;
        toast.error((action.payload as any) || 'Error al actualizar personalización');
      });
  },
});

export const {
  setFontSize,
  setThemeColor,
  setThemeColorShade,
  setLanguage,
  setDarkMode,
  setAsideStatus,
  syncWithApiData,
  markAsInitialized,
  clearUnsavedChanges,
  resetToDefaults,
  clearPersonalizacionState,
} = personalizacionSlice.actions;

interface LocalRootState { personalizacion?: PersonalizacionState }
export const selectPersonalizacion = (s: LocalRootState) => s.personalizacion;
export const selectFontSize = (s: LocalRootState) => s.personalizacion?.fontSize || 16;
export const selectThemeColor = (s: LocalRootState) => s.personalizacion?.themeColor || 'emerald';
export const selectThemeColorShade = (s: LocalRootState) => s.personalizacion?.themeColorShade || '500';
export const selectLanguage = (s: LocalRootState) => s.personalizacion?.language || 'es';
export const selectDarkMode = (s: LocalRootState) => s.personalizacion?.darkMode || 'light';
export const selectAsideStatus = (s: LocalRootState) => s.personalizacion?.asideStatus || true;
export const selectPersonalizacionUsuario = (s: LocalRootState) => s.personalizacion?.personalizacionUsuario || null;
export const selectIsLoading = (s: LocalRootState) => s.personalizacion?.loading || false;
export const selectHasUnsavedChanges = (s: LocalRootState) => s.personalizacion?.hasUnsavedChanges || false;
export const selectIsInitialized = (s: LocalRootState) => s.personalizacion?.isInitialized || false;
export const selectIsDarkTheme = (s: LocalRootState) => {
  const darkMode = s.personalizacion?.darkMode || 'light';
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return darkMode === DARK_MODE.DARK || (darkMode === DARK_MODE.SYSTEM && isSystemDark);
};

export default personalizacionSlice.reducer;

