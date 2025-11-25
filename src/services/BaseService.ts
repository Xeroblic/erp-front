import store, { logout, setToken } from '@/store';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';
import tokenManager from '@/services/auth/tokenManager';

interface CustomAxiosRequestConfig<D = any> extends InternalAxiosRequestConfig<D> {
	isLoginRequest?: boolean;
	_retry?: boolean;
}

let abortController = new AbortController();

export const cancelAllRequests = () => {
	abortController.abort();
	abortController = new AbortController();
};

const API_URL = import.meta.env.VITE_API_URL || '';
const REFRESH_ENDPOINTS = [`${API_URL}/refresh`, `${API_URL}/refresh`];

// Timeout de inactividad por defecto: 60 minutos
const DEFAULT_INACTIVITY_TIMEOUT_MS = 60 * 60_000;

const BaseService = axios.create({
	timeout: 60000,
	baseURL: API_URL,
});

const extractAuthHeader = (
	headers?: CustomAxiosRequestConfig['headers'],
): string | undefined => {
	if (!headers) return undefined;

	const maybeAxiosHeaders = headers as unknown as { get?: (key: string) => string | undefined };
	if (typeof maybeAxiosHeaders.get === 'function') {
		return maybeAxiosHeaders.get('Authorization') || maybeAxiosHeaders.get('authorization');
	}

	const normalizedHeaders = headers as Record<string, string | undefined>;
	return normalizedHeaders?.Authorization || normalizedHeaders?.authorization;
};

const setAuthHeader = (
	headers: CustomAxiosRequestConfig['headers'] | undefined,
	token: string,
) => {
	if (!headers) return;
	const maybeAxiosHeaders = headers as unknown as { set?: (key: string, value: string) => void };
	if (typeof maybeAxiosHeaders.set === 'function') {
		maybeAxiosHeaders.set('Authorization', `Bearer ${token}`);
		return;
	}
	(headers as Record<string, string>).Authorization = `Bearer ${token}`;
};

let activeRefreshPromise: Promise<string> | null = null;
const REFRESH_TOKEN_ERROR_TOAST_ID = 'refresh-token-error';

/**
 * Intenta refrescar el access token usando el endpoint /refresh.
 * Usa el token actual que tenga el tokenManager / authState.
 */
const refreshAccessToken = async () => {
	if (activeRefreshPromise) return activeRefreshPromise;

	activeRefreshPromise = (async () => {
		if (!API_URL) throw new Error('VITE_API_URL no esta configurado');

		const currentToken = tokenManager.getAccessToken() ?? store.getState().auth.access;
		if (!currentToken) throw new Error('No hay token para refrescar');

		let lastError: any = null;

		for (const endpoint of REFRESH_ENDPOINTS) {
			try {
				const refreshResponse = await axios.post(
					endpoint,
					{},
					{
						headers: { Authorization: `Bearer ${currentToken}` },
						// cuando migres a refresh por cookie HttpOnly, aquí se deja:
						// withCredentials: true,
					},
				);

				const data: any = refreshResponse?.data ?? {};
				const access = data.token ?? data.access ?? data.access_token ?? data?.data?.token;
				if (!access) {
					throw new Error('El endpoint de refresh no devolvió un token válido');
				}

				// Guardar en memoria + estado de Redux
				tokenManager.setAccessToken(access);
				store.dispatch(
					setToken({
						access,
						markActivity: true,
					}),
				);

				return access;
			} catch (err: any) {
				lastError = err;
				// intentar siguiente endpoint
			}
		}

		if (lastError?.response?.status === 401) {
			throw new Error('Refresh no autorizado');
		}

		toast.error('Error al intentar refrescar el token', {
			toastId: REFRESH_TOKEN_ERROR_TOAST_ID,
		});

		throw lastError ?? new Error('No se pudo refrescar el token de acceso');
	})();

	try {
		return await activeRefreshPromise;
	} finally {
		activeRefreshPromise = null;
	}
};

BaseService.interceptors.request.use(
	async (config: CustomAxiosRequestConfig) => {
		if (!config.isLoginRequest) {
			config.signal = abortController.signal;

			const state = store.getState();
			const inactivityTimeout =
				state?.auth?.inactivityTimeoutMs ?? DEFAULT_INACTIVITY_TIMEOUT_MS;
			const isAuthenticated = !!state?.auth?.isAuthenticated;

			// Si la app está marcada como no autenticada, no uses tokens antiguos
			if (!isAuthenticated) {
				tokenManager.clearTokens();
				return config;
			}

			// Control básico de inactividad (en memoria)
			if (tokenManager.isInactive(inactivityTimeout)) {
				// Silencio: solo cerrar sesión por inactividad sin toasts
				store.dispatch(logout());
				cancelAllRequests();
				throw new axios.Cancel('Sesión finalizada por inactividad');
			}

			// Token desde memoria (tokenManager), fallback a estado Redux por compatibilidad
			const token = tokenManager.getAccessToken() ?? state?.auth?.access;

			if (token) {
				if (!config.headers) {
					config.headers = {} as any;
				}
				setAuthHeader(config.headers, token);
				tokenManager.markActivity(Date.now());
			}
		}

		return config;
	},
	(error) => Promise.reject(error),
);

BaseService.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as CustomAxiosRequestConfig;

		if (
			error.response &&
			error.response.status === 401 &&
			!originalRequest._retry &&
			!originalRequest.isLoginRequest
		) {
			originalRequest._retry = true;

			const authState = store.getState().auth;
			const isAuthenticated = !!authState?.isAuthenticated;
			const hasAccess =
				!!tokenManager.getAccessToken() || !!authState?.access;

			// Si ya no estamos autenticados o no hay token, no intentes refrescar
			if (!isAuthenticated || !hasAccess) {
				tokenManager.clearTokens();
				store.dispatch(logout());
				cancelAllRequests();
				if (window.location.pathname !== '/login') {
					setTimeout(() => {
						window.location.href = '/login';
					}, 300);
				}
				return Promise.reject(error);
			}

			try {
				const newToken = await refreshAccessToken();

				if (newToken && originalRequest.headers) {
					setAuthHeader(originalRequest.headers, newToken);
				}

				return BaseService(originalRequest);
			} catch (refreshError: any) {
				console.error('Error refreshing token:', refreshError);

				tokenManager.clearTokens();

				const status = (refreshError as AxiosError)?.response?.status;
				const errorMessage =
					status === 401 || refreshError?.message?.includes('no autorizado')
						? 'Sesión expirada. Por favor, inicia sesión nuevamente.'
						: 'Error de autenticación. Por favor, inicia sesión nuevamente.';

				// Silencio: no mostrar toast al cerrar sesión por refresh fallido

				store.dispatch(logout());
				cancelAllRequests();

				if (isAuthenticated && window.location.pathname !== '/login') {
					setTimeout(() => {
						window.location.href = '/login';
					}, 500);
				}

				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

export default BaseService;
