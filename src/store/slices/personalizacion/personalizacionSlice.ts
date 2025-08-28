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
        fontSize: Number(localStorage.getItem('fyr_fontSize')) || themeConfig.fontSize,
        themeColor: (localStorage.getItem('fyr_themeColor') as TColors) || themeConfig.themeColor,
        themeColorShade: (localStorage.getItem('fyr_themeColorShade') as TColorIntensity) || themeConfig.themeColorShade,
        language: (localStorage.getItem('fyr_language') as TLang) || themeConfig.language,
        darkMode: (localStorage.getItem('theme') as TDarkMode) || themeConfig.theme,
        asideStatus: localStorage.getItem('fyr_asideStatus') ? localStorage.getItem('fyr_asideStatus') === 'true' : true,

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
        console.warn(`No se pudo guardar ${key} en localStorage:`, error);
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
            persistToLocalStorage('fyr_fontSize', action.payload);
            console.log('FontSize actualizado:', action.payload);
        },

        setThemeColor: (state, action: PayloadAction<TColors>) => {
            state.themeColor = action.payload;
            state.hasUnsavedChanges = true;
            persistToLocalStorage('fyr_themeColor', action.payload);
            console.log('ThemeColor actualizado:', action.payload);
        },

        setThemeColorShade: (state, action: PayloadAction<TColorIntensity>) => {
            state.themeColorShade = action.payload;
            state.hasUnsavedChanges = true;
            persistToLocalStorage('fyr_themeColorShade', action.payload);
            console.log('ThemeColorShade actualizado:', action.payload);
        },

        setLanguage: (state, action: PayloadAction<TLang>) => {
            state.language = action.payload;
            state.hasUnsavedChanges = true;
            persistToLocalStorage('fyr_language', action.payload);
            console.log('Language actualizado:', action.payload);
        },

        setDarkMode: (state, action: PayloadAction<TDarkMode>) => {
            state.darkMode = action.payload;
            state.hasUnsavedChanges = true;
            persistToLocalStorage('theme', action.payload);
            console.log('DarkMode actualizado:', action.payload);
        },

        setAsideStatus: (state, action: PayloadAction<boolean>) => {
            state.asideStatus = action.payload;
            persistToLocalStorage('fyr_asideStatus', action.payload);
            console.log('AsideStatus actualizado:', action.payload);
        },

        // Sincronizar con datos de la API
        syncWithApiData: (state, action: PayloadAction<IPersonalizacionUsuario>) => {
            const apiData = action.payload;

            // Solo actualizar si hay diferencias y es la primera sincronización
            if (!state.isInitialized || !state.hasUnsavedChanges) {
                if (apiData.tcolor && apiData.tcolor !== state.themeColor) {
                    state.themeColor = apiData.tcolor as TColors;
                    persistToLocalStorage('fyr_themeColor', apiData.tcolor);
                    console.log('🔄 Sincronizando themeColor desde API:', apiData.tcolor);
                }

                if (apiData.tcolor_int && apiData.tcolor_int !== state.themeColorShade) {
                    state.themeColorShade = apiData.tcolor_int as TColorIntensity;
                    persistToLocalStorage('fyr_themeColorShade', apiData.tcolor_int);
                    console.log('🔄 Sincronizando themeColorShade desde API:', apiData.tcolor_int);
                }

                if (apiData.font_size && apiData.font_size !== state.fontSize) {
                    state.fontSize = apiData.font_size;
                    persistToLocalStorage('fyr_fontSize', apiData.font_size);
                    console.log('🔄 Sincronizando fontSize desde API:', apiData.font_size);
                }

                // Mapear tema de la API al formato local
                if (apiData.tema) {
                    const darkModeValue = apiData.tema === '1' ? DARK_MODE.LIGHT
                        : apiData.tema === '2' ? DARK_MODE.DARK
                            : DARK_MODE.SYSTEM;

                    // Solo actualizar si no hay valor local configurado por el usuario
                    const currentDarkMode = localStorage.getItem('theme') as TDarkMode;
                    if (!currentDarkMode) {
                        // No hay preferencia local, usar valor de la API
                        state.darkMode = darkModeValue;
                        persistToLocalStorage('theme', darkModeValue);
                        console.log('🔄 Sincronizando darkMode desde API (no había valor local):', darkModeValue);
                    } else if (currentDarkMode !== state.darkMode) {
                        // Hay una preferencia local diferente, mantenerla
                        console.log('🔒 Manteniendo darkMode local:', currentDarkMode, 'vs API:', darkModeValue);
                        state.darkMode = currentDarkMode;
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
            localStorage.removeItem('fyr_fontSize');
            localStorage.removeItem('fyr_themeColor');
            localStorage.removeItem('fyr_themeColorShade');
            localStorage.removeItem('fyr_language');
            localStorage.removeItem('theme');

            console.log('🔄 Configuración restablecida a valores por defecto');
        },

        // Limpiar estado al hacer logout
        clearPersonalizacionState: (state) => {
            state.personalizacionUsuario = undefined;
            state.loading = false;
            state.error = undefined;
            state.isInitialized = false;
            state.hasUnsavedChanges = false;
            console.log('🧹 Estado de personalización limpiado por logout');
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

                // Usar la acción syncWithApiData para manejar la sincronización
                personalizacionSlice.caseReducers.syncWithApiData(state, {
                    type: 'syncWithApiData',
                    payload: action.payload,
                } as any);
            })
            .addCase(obtenerPersonalizacionThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isInitialized = true; // Marcar como inicializado aunque falle
                console.warn('❌ Error obteniendo personalización:', action.payload);
            })

            // Actualizar personalización
            .addCase(actualizarPersonalizacionThunk.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(actualizarPersonalizacionThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.error = undefined;
                state.personalizacionUsuario = action.payload;
                state.hasUnsavedChanges = false;
                console.log('✅ Personalización actualizada exitosamente');
            })
            .addCase(actualizarPersonalizacionThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Error al actualizar personalización');
                console.error('❌ Error actualizando personalización:', action.payload);
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

    // Deshabilitado temporalmente para evitar spam en logs
    // console.log('🌙 DarkMode Debug:', {
    //     darkMode,
    //     isSystemDark,
    //     isDark,
    //     localStorage: localStorage.getItem('theme')
    // });

    return isDark;
};

export default personalizacionSlice.reducer;
