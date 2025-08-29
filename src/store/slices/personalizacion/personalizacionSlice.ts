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

// Interface para el estado local del slice
export interface PersonalizacionState {
    // Configuraciones locales
    fontSize: number;
    themeColor: TColors;
    themeColorShade: TColorIntensity;
    language: TLang;
    darkMode: TDarkMode;
    asideStatus: boolean;

    // Estado de la API
    personalizacionUsuario?: IPersonalizacionUsuario;
    loading: boolean;
    error?: string;

    // Flags de control
    isInitialized: boolean;
    hasUnsavedChanges: boolean;
}

// Estado inicial con valores desde localStorage o defaults
const getInitialState = (): PersonalizacionState => {
    return {
        // Configuraciones locales (localStorage + defaults)
        fontSize: Number(localStorage.getItem('zentria_fontSize')) || themeConfig.fontSize,
        themeColor: (localStorage.getItem('zentria_themeColor') as TColors) || themeConfig.themeColor,
        themeColorShade: (localStorage.getItem('zentria_themeColorShade') as TColorIntensity) || themeConfig.themeColorShade,
        language: (localStorage.getItem('zentria_language') as TLang) || themeConfig.language,
        darkMode: (localStorage.getItem('theme') as TDarkMode) || themeConfig.theme,
        asideStatus: localStorage.getItem('zentria_asideStatus') ? localStorage.getItem('zentria_asideStatus') === 'true' : true,

        // Estado de la API
        personalizacionUsuario: undefined,
        loading: false,
        error: undefined,

        // Flags de control
        isInitialized: false,
        hasUnsavedChanges: false,
    };
};

// Async Thunks para la API
export const obtenerPersonalizacionThunk = createAsyncThunk<
    IPersonalizacionUsuario,
    void,
    { rejectValue: string }
>(
    'personalizacion/obtenerPersonalizacion',
    async (_, { getState, rejectWithValue }) => {
        const token = (getState() as any).auth.access;
        try {
            const resp = await ApiService.fetchData<IPersonalizacionUsuario>({
                url: '/user/personalization',
                method: 'get',
                headers: { Authorization: `Bearer ${token}` },
            });
            return resp.data;
        } catch (error) {
            return rejectWithValue('No se pudo obtener la personalización');
        }
    }
);

export const actualizarPersonalizacionThunk = createAsyncThunk<
    IPersonalizacionUsuario,
    Partial<Pick<IPersonalizacionUsuario, 'tema' | 'font_size' | 'tcolor' | 'tcolor_int'>>,
    { rejectValue: string }
>(
    'personalizacion/actualizarPersonalizacion',
    async (data, { getState, rejectWithValue }) => {
        const token = (getState() as any).auth.access;
        try {
            const resp = await ApiService.fetchData<IPersonalizacionUsuario>({
                url: '/user/personalization',
                method: 'put',
                data,
                headers: { Authorization: `Bearer ${token}` },
            });
            return resp.data;
        } catch (error) {
            return rejectWithValue('No se pudo actualizar la personalización');
        }
    }
);

// Helper para persistir en localStorage
const persistToLocalStorage = (key: string, value: any) => {
    try {
        localStorage.setItem(key, typeof value === 'string' ? value : String(value));
    } catch (error) {
        // Error silencioso - no mostrar warnings
    }
};

// Slice de personalización
const personalizacionSlice = createSlice({
    name: 'personalizacion',
    initialState: getInitialState(),
    reducers: {
        // Setters locales que persisten en localStorage
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
            const newDarkMode = action.payload;
            state.darkMode = newDarkMode;
            state.hasUnsavedChanges = true;
            persistToLocalStorage('theme', newDarkMode);
        },

        setAsideStatus: (state, action: PayloadAction<boolean>) => {
            state.asideStatus = action.payload;
            persistToLocalStorage('zentria_asideStatus', action.payload);
        },

        // Sincronizar con datos de la API
        syncWithApiData: (state, action: PayloadAction<IPersonalizacionUsuario>) => {
            const apiData = action.payload;

            // Solo actualizar en la primera inicialización
            if (!state.isInitialized) {
                if (apiData.tcolor && apiData.tcolor !== state.themeColor) {
                    state.themeColor = apiData.tcolor as TColors;
                    persistToLocalStorage('zentria_themeColor', apiData.tcolor);
                }

                if (apiData.tcolor_int && apiData.tcolor_int !== state.themeColorShade) {
                    state.themeColorShade = apiData.tcolor_int as TColorIntensity;
                    persistToLocalStorage('zentria_themeColorShade', apiData.tcolor_int);
                }

                // Forzar fontSize en primera carga o si es diferente
                if (apiData.font_size && (!state.isInitialized || apiData.font_size !== state.fontSize)) {
                    state.fontSize = apiData.font_size;
                    persistToLocalStorage('zentria_fontSize', apiData.font_size);
                }

                // Mapear tema de la API al formato local
                if (apiData.tema !== undefined && apiData.tema !== null) {
                    const darkModeValue = apiData.tema === 1 ? DARK_MODE.LIGHT
                        : apiData.tema === 2 ? DARK_MODE.DARK
                            : DARK_MODE.SYSTEM;

                    // Solo aplicar en primera carga (inicialización)
                    if (!state.isInitialized) {
                        state.darkMode = darkModeValue;
                        persistToLocalStorage('theme', darkModeValue);
                    }
                }
            }

            state.personalizacionUsuario = apiData;
            state.isInitialized = true;
        },

        // Marcar como inicializado
        markAsInitialized: (state) => {
            state.isInitialized = true;
        },

        // Limpiar cambios no guardados
        clearUnsavedChanges: (state) => {
            state.hasUnsavedChanges = false;
        },

        // Reset de configuración
        resetToDefaults: (state) => {
            state.fontSize = themeConfig.fontSize;
            state.themeColor = themeConfig.themeColor;
            state.themeColorShade = themeConfig.themeColorShade;
            state.language = themeConfig.language;
            state.darkMode = themeConfig.theme;
            state.hasUnsavedChanges = true;

            // Limpiar localStorage
            localStorage.removeItem('zentria_fontSize');
            localStorage.removeItem('zentria_themeColor');
            localStorage.removeItem('zentria_themeColorShade');
            localStorage.removeItem('zentria_language');
            localStorage.removeItem('theme');
        },

        // Limpiar estado al hacer logout
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
            // Obtener personalización
            .addCase(obtenerPersonalizacionThunk.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(obtenerPersonalizacionThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.error = undefined;

                // Usar syncWithApiData para sincronizar los datos obtenidos
                const apiData = action.payload;
                state.personalizacionUsuario = apiData;

                // Solo sincronizar si es la primera vez que se inicializa
                if (!state.isInitialized) {
                    // Sincronizar colores
                    if (apiData.tcolor && apiData.tcolor !== state.themeColor) {
                        state.themeColor = apiData.tcolor as TColors;
                        persistToLocalStorage('zentria_themeColor', apiData.tcolor);
                    }

                    if (apiData.tcolor_int && apiData.tcolor_int !== state.themeColorShade) {
                        state.themeColorShade = apiData.tcolor_int as TColorIntensity;
                        persistToLocalStorage('zentria_themeColorShade', apiData.tcolor_int);
                    }

                    // Sincronizar fontSize SIEMPRE en primera carga
                    if (apiData.font_size) {
                        state.fontSize = apiData.font_size;
                        persistToLocalStorage('zentria_fontSize', apiData.font_size);
                    }

                    // Mapear tema de la API al formato local
                    if (apiData.tema !== undefined && apiData.tema !== null) {
                        const darkModeValue = apiData.tema === 1 ? DARK_MODE.LIGHT
                            : apiData.tema === 2 ? DARK_MODE.DARK
                                : DARK_MODE.SYSTEM;

                        state.darkMode = darkModeValue;
                        persistToLocalStorage('theme', darkModeValue);
                    }
                }

                state.isInitialized = true;
            })
            .addCase(obtenerPersonalizacionThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isInitialized = true; // Marcar como inicializado aunque falle
            })

            // Actualizar personalización
            .addCase(actualizarPersonalizacionThunk.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(actualizarPersonalizacionThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.error = undefined;
                // Solo actualizar la data de la API, NO hacer sincronización
                state.personalizacionUsuario = action.payload;
                // state.hasUnsavedChanges = false; // ← COMENTADO para evitar bucles
            })
            .addCase(actualizarPersonalizacionThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Error al actualizar personalización');
            });
    },
});

// Actions
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

// Interfaz mínima para evitar dependencia circular
interface LocalRootState {
    personalizacion?: PersonalizacionState;
}

// Selectors - usando LocalRootState para evitar dependencia circular
export const selectPersonalizacion = (state: LocalRootState) => state.personalizacion;
export const selectFontSize = (state: LocalRootState) => state.personalizacion?.fontSize || 16;
export const selectThemeColor = (state: LocalRootState) => state.personalizacion?.themeColor || 'emerald';
export const selectThemeColorShade = (state: LocalRootState) => state.personalizacion?.themeColorShade || '500';
export const selectLanguage = (state: LocalRootState) => state.personalizacion?.language || 'es';
export const selectDarkMode = (state: LocalRootState) => state.personalizacion?.darkMode || 'light';
export const selectAsideStatus = (state: LocalRootState) => state.personalizacion?.asideStatus || true;
export const selectPersonalizacionUsuario = (state: LocalRootState) => state.personalizacion?.personalizacionUsuario || null;
export const selectIsLoading = (state: LocalRootState) => state.personalizacion?.loading || false;
export const selectHasUnsavedChanges = (state: LocalRootState) => state.personalizacion?.hasUnsavedChanges || false;
export const selectIsInitialized = (state: LocalRootState) => state.personalizacion?.isInitialized || false;

// Selector computado para isDarkTheme
export const selectIsDarkTheme = (state: LocalRootState) => {
    const darkMode = state.personalizacion?.darkMode || 'light';
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = darkMode === DARK_MODE.DARK ||
        (darkMode === DARK_MODE.SYSTEM && isSystemDark);

    return isDark;
};

export default personalizacionSlice.reducer;
