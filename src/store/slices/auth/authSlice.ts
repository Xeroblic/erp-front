import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';
import { RootState, AppDispatch } from '@/store';
import { IGruposUsuarios, IUserMe } from '@/interface/user.interface';
import { obtenerPersonalizacionThunk as obtenerPersonalizacionFromSlice } from '@/store/slices/personalizacion/personalizacionSlice';

interface LoginResponse {
	access: string;
}

export interface AuthState {
	access?: string;
	loading: boolean;
	error?: string;
	isAuthenticated: boolean;
	permisos: string[];
	user?: IUserMe;
	listaGrupos: IGruposUsuarios | undefined;
	userLastFetched?: number; // Timestamp del último fetch exitoso
	inactivityTimeoutMs?: number; // Timeout de inactividad en milisegundos
}

const initialState: AuthState = {
	access: localStorage.getItem('access_token') || undefined,
	loading: false,
	error: undefined,
	isAuthenticated: false, // Se establecerá a true solo después de validar con el servidor
	permisos: [],
	user: undefined,
	listaGrupos: undefined,
	userLastFetched: undefined,
	inactivityTimeoutMs: undefined,
};

export const loginThunk = createAsyncThunk<
	LoginResponse,
	{ email: string; password: string },
	{ rejectValue: string; dispatch: AppDispatch }
>('auth/login', async ({ email, password }, { dispatch, rejectWithValue }) => {
	try {
		const resp = await ApiService.fetchData<{ token: string }>({
			url: '/login',
			method: 'post',
			data: { email, password },
			isLoginRequest: true,
		});

		const token = resp.data.token;
		dispatch(setToken(token));
		return { access: token };
	} catch (error: any) {
		return rejectWithValue(error.response?.data?.error || 'Error de autenticación');
	}
});

export const userMeThunk = createAsyncThunk<
	{ user: IUserMe; permisos: string[]; roles?: string[] },
	void,
	{ state: RootState; rejectValue: string }
>(
	'auth/userMe',
	async (_, { getState, rejectWithValue, signal }) => {
		const token = getState().auth.access;
		if (!token) return rejectWithValue('Token inválido');

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
				url: '/perfil',
				method: 'get',
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
					...data,
				} as IUserMe;

				permisos = [
					...(data.all_permissions || []),
					...(data.direct_permissions || []),
					...(data.role_permissions || []),
					...(data.global_roles || []),
				];

				roles = data.global_roles || [];
			} else {
				// Estructura antigua (compatibilidad)
				userData = resp.data.user || ({} as IUserMe);

				// ✅ Incluir access y visible si vienen en la respuesta
				const respData = resp.data as any;
				if (respData.access) {
					(userData as any).access = respData.access;
				}
				if (respData.visible) {
					(userData as any).visible = respData.visible;
				}
				if (respData.branch) {
					(userData as any).branch = respData.branch;
				}

				permisos = resp.data.permisos || [];
				roles = resp.data.roles || [];
			}

			return {
				user: userData,
				permisos: Array.from(new Set(permisos)), // Eliminar Duplicados
				roles: Array.from(new Set(roles)),
			};
		} catch (error: any) {
			console.error('Error en userMeThunk:', error);
			return rejectWithValue('No se pudo obtener el perfil');
		}
	},
	{
		// Throttle: evita relanzar si se pidió hace < 15s
		condition: (_, { getState }) => {
			const s = getState() as RootState;
			const last = s.auth.userLastFetched;
			if (!last) return true;
			const elapsed = Date.now() - last;
			return elapsed > 15000; // 15s
		},
	},
);

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		logout: (state) => {
			// Resetear completamente el estado
			state.access = undefined;
			state.user = undefined;
			state.permisos = [];
			state.isAuthenticated = false;
			state.loading = false;
			state.error = undefined;
			state.listaGrupos = undefined;
			state.userLastFetched = undefined;

			// Limpiar tokenManager si está disponible
			try {
				const { tokenManager } = require('@/services/auth/tokenManager');
				tokenManager.clearTokens();
			} catch (err) {
				// tokenManager no disponible, limpiar manualmente
				localStorage.removeItem('access_token');
				localStorage.removeItem('refresh_token');
				localStorage.removeItem('access_token_expires_at');
				localStorage.removeItem('refresh_token_expires_at');
				localStorage.removeItem('auth_last_activity');
			}

			// Limpiar solo datos de autenticación, mantener personalización
			// localStorage.removeItem('persist:fyr'); // NO limpiar persist para mantener tema
			// localStorage.removeItem('zentria_themeColor'); // NO limpiar tema
			// localStorage.removeItem('zentria_themeColorShade'); // NO limpiar tema
			// localStorage.removeItem('zentria_fontSize'); // NO limpiar fuente
			// localStorage.removeItem('theme'); // NO limpiar tema
			// localStorage.removeItem('zentria_language'); // NO limpiar idioma
			// localStorage.removeItem('zentria_asideStatus'); // NO limpiar estado aside
		},
		setToken: (
			state,
			action: PayloadAction<
				{ access: string; refresh?: string; markActivity?: boolean } | string
			>,
		) => {
			if (typeof action.payload === 'string') {
				// Compatibilidad con código existente
				state.access = action.payload;
				localStorage.setItem('access_token', action.payload);
			} else {
				// Nuevo formato con objeto
				state.access = action.payload.access;
				localStorage.setItem('access_token', action.payload.access);

				if (action.payload.refresh) {
					localStorage.setItem('refresh_token', action.payload.refresh);
				}

				if (action.payload.markActivity) {
					// Marcar actividad en tokenManager si está disponible
					try {
						const { tokenManager } = require('@/services/auth/tokenManager');
						tokenManager.markActivity();
					} catch (err) {
						// tokenManager no disponible, continuar
					}
				}
			}
		},
		// Nuevo reducer para validar token al inicio
		validateSession: (state) => {
			try {
				const { tokenManager } = require('@/services/auth/tokenManager');
				const token = tokenManager.getAccessToken();

				if (!token) {
					state.isAuthenticated = false;
					state.access = undefined;
					state.user = undefined;
					state.permisos = [];
					return;
				}

				// Verificar si el token está expirado
				if (tokenManager.isAccessTokenExpiring(0)) {
					// Token expirado, limpiar estado
					state.isAuthenticated = false;
					state.access = undefined;
					state.user = undefined;
					state.permisos = [];
					tokenManager.clearTokens();
					return;
				}

				// Token válido, restaurar en estado si no está presente
				if (!state.access) {
					state.access = token;
					// No marcar como autenticado hasta que se valide con el servidor
				}
			} catch (err) {
				// Fallback a localStorage si tokenManager no está disponible
				const token = localStorage.getItem('access_token');
				if (!token && !state.access) {
					state.isAuthenticated = false;
					state.access = undefined;
					state.user = undefined;
					state.permisos = [];
				} else if (token && !state.access) {
					state.access = token;
				}
			}
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(loginThunk.pending, (state) => {
				state.loading = true;
			})
			.addCase(loginThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.access = action.payload.access;
				state.isAuthenticated = true;
			})
			.addCase(loginThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(userMeThunk.pending, (s) => {
				s.loading = true;
			})
			.addCase(userMeThunk.fulfilled, (s, { payload }) => {
				s.loading = false;

				const authority = [
					...payload.permisos,
					...(payload.user.cargo ? [payload.user.cargo] : []),
				];

				s.user = { ...payload.user, authority, roles: payload.roles || [] };
				s.permisos = authority;
				s.isAuthenticated = true;
				s.userLastFetched = Date.now();
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
