import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';
import tokenManager from '@/services/auth/tokenManager';
import { RootState, AppDispatch } from '@/store';
import { IGruposUsuarios, IUserMe } from '@/interface/user.interface';
import { clearAppStorage } from '@/utils/appStorage';
import { normalizeUserProfile } from '@/utils/normalizeUserProfile';
import { clearPersonalizacionState } from '@/store/slices/personalizacion/personalizacionSlice';

interface LoginResponse {
	access: string;
}

const extractAccessToken = (payload: any): string | undefined => {
	if (!payload) return undefined;

	const candidates = [
		payload.token,
		payload.access,
		payload.access_token,
		payload?.data?.token,
		payload?.data?.access,
		payload?.data?.access_token,
	];

	return candidates.find(
		(value): value is string => typeof value === 'string' && value.trim().length > 0,
	);
};

type PerfilResponse = {
	data?: {
		all_permissions?: string[];
		direct_permissions?: string[];
		role_permissions?: string[];
		global_roles?: string[];
	} & IUserMe;
	user?: IUserMe;
};

export interface AuthState {
	access?: string;
	loading: boolean;
	error?: string;
	isAuthenticated: boolean;
	permisos: string[];
	user?: IUserMe;
	listaGrupos?: IGruposUsuarios;
	userLastFetched?: number;
	inactivityTimeoutMs?: number;
}

const initialState: AuthState = {
	access: undefined,
	loading: false,
	error: undefined,
	isAuthenticated: false,
	permisos: [],
	user: undefined,
	listaGrupos: undefined,
	userLastFetched: undefined,
	inactivityTimeoutMs: undefined,
};

/* ---------------------------------------------------
   LOGIN THUNK
--------------------------------------------------- */
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

		const token = extractAccessToken(resp.data);
		if (!token) {
			throw new Error('El inicio de sesión no devolvió un token válido');
		}

		// Guardar SOLO en memoria
		tokenManager.setAccessToken(token);

		// Guardar en Redux
		dispatch(setToken({ access: token, markActivity: true }));

		return { access: token };
	} catch (error: any) {
		const apiMessage =
			error?.response?.data?.error ||
			error?.response?.data?.message ||
			error?.message ||
			'Error de autenticación';
		return rejectWithValue(apiMessage);
	}
});

/* ---------------------------------------------------
   LOGOUT THUNK
--------------------------------------------------- */
export const logoutThunk = createAsyncThunk<
	void,
	void,
	{ state: RootState; dispatch: AppDispatch }
>('auth/logoutThunk', async (_, { dispatch, getState }) => {
	const token = getState().auth.access ?? tokenManager.getAccessToken();

	try {
		await ApiService.fetchData({
			url: '/logout',
			method: 'post',
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			dedupe: true,
		});
	} catch {
		// da lo mismo si falla
	} finally {
		dispatch(logout());
		dispatch(clearPersonalizacionState());
		clearAppStorage({ keepTheme: false });
	}
});

/* ---------------------------------------------------
   PERFIL DEL USUARIO (userMe)
--------------------------------------------------- */
export interface AuthErrorPayload {
	message: string;
	isUnauthorized?: boolean;
}

export const userMeThunk = createAsyncThunk<
	{ user: IUserMe; permisos: string[]; roles?: string[] },
	void,
	{ state: RootState; rejectValue: AuthErrorPayload }
>('auth/userMe', async (_, { getState, rejectWithValue }) => {
	const token = tokenManager.getAccessToken() ?? getState().auth.access;
	if (!token)
		return rejectWithValue({
			message: 'Token inválido',
			isUnauthorized: true,
		});

	try {
		const resp = await ApiService.fetchData<PerfilResponse>({
			url: '/perfil',
			method: 'get',
			dedupe: true,
			headers: { Authorization: `Bearer ${token}` },
		});

		return normalizeUserProfile(resp.data as string | PerfilResponse);
	} catch (error: any) {
		const status = error?.response?.status;
		const apiMessage = (error?.response?.data?.message ?? error?.message) as string | undefined;
		const isUnauthorized =
			status === 401 ||
			(typeof apiMessage === 'string' && apiMessage.toLowerCase().includes('no autentic'));
		const message =
			apiMessage && typeof apiMessage === 'string'
				? apiMessage
				: 'No se pudo obtener el perfil';
		return rejectWithValue({
			message,
			isUnauthorized,
		});
	}
});

/* ---------------------------------------------------
   SLICE
--------------------------------------------------- */
const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		logout: (state) => {
			state.access = undefined;
			state.user = undefined;
			state.permisos = [];
			state.isAuthenticated = false;
			state.loading = false;
			state.error = undefined;
			state.listaGrupos = undefined;
			state.userLastFetched = undefined;

			tokenManager.clearTokens();

			ApiService.clearCache();

			clearAppStorage({ keepTheme: false });
		},

		setToken: (state, action: PayloadAction<{ access: string; markActivity?: boolean }>) => {
			const { access, markActivity } = action.payload;
			state.access = access;
			if (markActivity) tokenManager.markActivity();
		},

		clearAuthState: () => ({ ...initialState }),
	},

	extraReducers: (builder) => {
		builder
			/* LOGIN */
			.addCase(loginThunk.pending, (s) => {
				s.loading = true;
				s.error = undefined;
			})
			.addCase(loginThunk.fulfilled, (s, { payload }) => {
				s.loading = false;
				s.access = payload.access;
				s.isAuthenticated = true; // pre-authenticated; se consolida con userMe
			})
			.addCase(loginThunk.rejected, (s, action) => {
				s.loading = false;
				s.error = action.payload;
				s.isAuthenticated = false;
			})

			/* USER ME */
			.addCase(userMeThunk.pending, (s) => {
				s.loading = true;
			})
			.addCase(userMeThunk.fulfilled, (s, { payload }) => {
				s.loading = false;

				const { user } = payload;
				const authority = [
					...payload.permisos,
					...(payload.roles || []),
					...(user.cargo ? [user.cargo] : []),
				];

				s.user = { ...user, authority, roles: payload.roles || [] };
				s.permisos = authority;
				s.isAuthenticated = true;
				s.userLastFetched = Date.now();
			})
			.addCase(userMeThunk.rejected, (s, action) => {
				s.loading = false;
				s.isAuthenticated = false;

				const { payload } = action;
				const message = payload?.message ?? 'No se pudo obtener el perfil';
				s.error = message;

				const isCanceled = action.error?.name === 'CanceledError';
				const isTokenInvalid = message === 'Token inválido';
				const isUnauthorized = payload?.isUnauthorized ?? false;
				if (!isCanceled && !isTokenInvalid && !isUnauthorized) {
					toast.error(message);
				}
			});
	},
});

export const { logout, clearAuthState, setToken } = authSlice.actions;

export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectUserAuthority = (state: RootState) => state.auth.permisos;

export default authSlice.reducer;
