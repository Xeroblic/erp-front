// src/store/slices/personalizacion/personalizacionSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';
import tokenManager from '@/services/auth/tokenManager';
import DARK_MODE from '@/constants/darkMode.constant';
import themeConfig from '@/config/theme.config';

import type { RootState } from '@/store';
import type { TDarkMode } from '@/types/darkMode.type';
import type { TColors } from '@/types/colors.type';
import type { TColorIntensity } from '@/types/colorIntensities.type';
import type { TLang } from '@/types/lang.type';
import type { IPersonalizacionUsuario } from '@/interface/user.interface';

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

const persistToLocalStorage = (key: string, value: any) => {
	try {
		localStorage.setItem(key, typeof value === 'string' ? value : String(value));
	} catch {
		/* ignore */
	}
};

const extractPersonalization = (payload: any): IPersonalizacionUsuario => {
	if (payload?.personalization) {
		return payload.personalization as IPersonalizacionUsuario;
	}
	return payload as IPersonalizacionUsuario;
};

/* ---------------------------------------------------
   OBTENER PERSONALIZACIÓN DESDE API
--------------------------------------------------- */
export const obtenerPersonalizacionThunk = createAsyncThunk<
	IPersonalizacionUsuario,
	void,
	{ state: RootState; rejectValue: RejectStr }
>(
	'personalizacion/obtenerPersonalizacion',
	async (_, { getState, rejectWithValue, signal }) => {
		try {
			const state = getState();
			const token = tokenManager.getAccessToken() ?? state.auth.access ?? null;

			// Si ya está inicializado y tenemos datos, devolvemos eso
			const current = state.personalizacion;
			if (current?.isInitialized && current.personalizacionUsuario) {
				return current.personalizacionUsuario;
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
			if (error?.name === 'CanceledError' || error?.name === 'AbortError') {
				throw error;
			}

			return rejectWithValue(
				`No se pudo obtener la personalización: ${error?.message || String(error)}`,
			);
		}
	},
	{
		condition: (_, { getState }) => {
			const state = getState();

			const pers = state.personalizacion;
			if (pers?.loading) return false;
			// Solo bloquear si está inicializado Y no tiene error (éxito previo)
			if (pers?.isInitialized && !pers?.error) return false;

			const hasToken = !!tokenManager.getAccessToken() || !!state.auth.access;

			return hasToken;
		},
	},
);

/* ---------------------------------------------------
   ACTUALIZAR PERSONALIZACIÓN COMPLETA
--------------------------------------------------- */
export const actualizarPersonalizacionThunk = createAsyncThunk<
	IPersonalizacionUsuario,
	Partial<
		Pick<
			IPersonalizacionUsuario,
			'tema' | 'font_size' | 'tcolor' | 'tcolor_int' | 'dark_mode' | 'sucursal_principal'
		>
	>,
	{ state: RootState; rejectValue: string }
>('personalizacion/actualizarPersonalizacion', async (data, { getState, rejectWithValue }) => {
	const token = tokenManager.getAccessToken() ?? getState().auth.access;

	try {
		const resp = await ApiService.fetchData<any>({
			url: '/user/personalization',
			method: 'put',
			data,
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		});

		return extractPersonalization(resp.data);
	} catch (error) {
		return rejectWithValue('No se pudo actualizar la personalización');
	}
});

/* ---------------------------------------------------
   ACTUALIZAR SÓLO SUCURSAL PRINCIPAL
--------------------------------------------------- */
export const actualizarSucursalPrincipalThunk = createAsyncThunk<
	IPersonalizacionUsuario,
	number | null,
	{ state: RootState; rejectValue: string }
>(
	'personalizacion/actualizarSucursalPrincipal',
	async (branchId, { getState, rejectWithValue }) => {
		const token = tokenManager.getAccessToken() ?? getState().auth.access;

		try {
			const resp = await ApiService.fetchData<any>({
				url: '/user/personalization',
				method: 'put',
				data: { sucursal_principal: branchId },
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			});

			return extractPersonalization(resp.data);
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message ||
					error?.message ||
					'No se pudo actualizar la sucursal principal',
			);
		}
	},
);

/* ---------------------------------------------------
   SLICE
--------------------------------------------------- */
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
					const darkModeValue =
						apiData.tema === 1
							? DARK_MODE.LIGHT
							: apiData.tema === 2
								? DARK_MODE.DARK
								: DARK_MODE.SYSTEM;

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
			const base = getInitialState();
			state.fontSize = base.fontSize;
			state.themeColor = base.themeColor;
			state.themeColorShade = base.themeColorShade;
			state.language = base.language;
			state.darkMode = base.darkMode;
			state.hasUnsavedChanges = true;

			localStorage.removeItem('zentria_fontSize');
			localStorage.removeItem('zentria_themeColor');
			localStorage.removeItem('zentria_themeColorShade');
			localStorage.removeItem('zentria_language');
			localStorage.removeItem('theme');
		},

		// Se usa desde logoutThunk
		clearPersonalizacionState: () => getInitialState(),
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
					const darkModeValue =
						apiData.tema === 1
							? DARK_MODE.LIGHT
							: apiData.tema === 2
								? DARK_MODE.DARK
								: DARK_MODE.SYSTEM;

					state.darkMode = darkModeValue;
					persistToLocalStorage('theme', darkModeValue);
				}

				state.isInitialized = true;
			})
			.addCase(obtenerPersonalizacionThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string | undefined;
				// NO marcar como initialized cuando falla, para permitir reintentos
				// state.isInitialized se mantiene en false
			})
			.addCase(actualizarPersonalizacionThunk.pending, (state) => {
				state.loading = true;
				state.error = undefined;
			})
			.addCase(actualizarPersonalizacionThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.error = undefined;
				state.personalizacionUsuario = extractPersonalization(action.payload);
			})
			.addCase(actualizarPersonalizacionThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
				toast.error((action.payload as string) || 'Error al actualizar personalización');
			})
			.addCase(actualizarSucursalPrincipalThunk.pending, (state) => {
				state.loading = true;
				state.error = undefined;
			})
			.addCase(actualizarSucursalPrincipalThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.error = undefined;
				state.personalizacionUsuario = extractPersonalization(action.payload);
			})
			.addCase(actualizarSucursalPrincipalThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
				toast.error(
					(action.payload as string) || 'No se pudo actualizar la sucursal principal',
				);
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

/* --------- Selectores --------- */
const getSlice = (s: RootState): PersonalizacionState => s.personalizacion ?? getInitialState();

export const selectPersonalizacion = (s: RootState) => getSlice(s);

export const selectFontSize = (s: RootState) => getSlice(s).fontSize;

export const selectThemeColor = (s: RootState) => getSlice(s).themeColor;

export const selectThemeColorShade = (s: RootState) => getSlice(s).themeColorShade;

export const selectLanguage = (s: RootState) => getSlice(s).language;

export const selectDarkMode = (s: RootState) => getSlice(s).darkMode;

export const selectAsideStatus = (s: RootState) => getSlice(s).asideStatus;

export const selectPersonalizacionUsuario = (s: RootState) =>
	getSlice(s).personalizacionUsuario ?? null;

export const selectIsLoading = (s: RootState) => getSlice(s).loading;

export const selectHasUnsavedChanges = (s: RootState) => getSlice(s).hasUnsavedChanges;

export const selectIsInitialized = (s: RootState) => getSlice(s).isInitialized;

export const selectIsDarkTheme = (s: RootState) => {
	const { darkMode } = getSlice(s);
	const isSystemDark =
		typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

	return darkMode === DARK_MODE.DARK || (darkMode === DARK_MODE.SYSTEM && isSystemDark);
};

export default personalizacionSlice.reducer;
