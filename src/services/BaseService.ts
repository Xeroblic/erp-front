import store, { logout, setToken } from '@/store';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';
import tokenManager, {
	ACCESS_TOKEN_REFRESH_LEEWAY_MS,
	DEFAULT_INACTIVITY_TIMEOUT_MS,
} from '@/services/auth/tokenManager';

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

const BaseService = axios.create({ timeout: 60000, baseURL: API_URL });

const extractAuthHeader = (headers?: CustomAxiosRequestConfig['headers']): string | undefined => {
	if (!headers) return undefined;

	const maybeAxiosHeaders = headers as unknown as { get?: (key: string) => string | undefined };
	if (typeof maybeAxiosHeaders.get === 'function') {
		return maybeAxiosHeaders.get('Authorization') || maybeAxiosHeaders.get('authorization');
	}

	const normalizedHeaders = headers as Record<string, string | undefined>;
	return normalizedHeaders?.Authorization || normalizedHeaders?.authorization;
};

const setAuthHeader = (headers: CustomAxiosRequestConfig['headers'] | undefined, token: string) => {
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

const refreshAccessToken = async (expiredToken?: string) => {
	if (activeRefreshPromise) return activeRefreshPromise;

	activeRefreshPromise = (async () => {
		if (!API_URL) throw new Error('VITE_API_URL no esta configurado');

		const tokenToRefresh = expiredToken ?? tokenManager.getAccessToken();
		if (!tokenToRefresh) throw new Error('No hay token para refrescar');

		let lastError: any = null;

		for (const endpoint of REFRESH_ENDPOINTS) {
			try {
				const refreshResponse = await axios.post(
					endpoint,
					{},
					{ headers: { Authorization: `Bearer ${tokenToRefresh}` } },
				);

				const data: any = refreshResponse?.data ?? {};
				const access = data.token ?? data.access ?? data.access_token ?? data?.data?.token;
				if (!access) throw new Error('El endpoint de refresh no devolvio un token valido');

				const expiresInSeconds =
					typeof data.expires_in === 'number'
						? data.expires_in
						: typeof data?.data?.expires_in === 'number'
							? data.data.expires_in
							: undefined;

				const accessExpiresAt = expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : undefined;

				tokenManager.persistTokens({
					accessToken: access,
					accessExpiresAt,
					refreshToken: undefined,
					refreshExpiresAt: undefined,
				});

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

			if (tokenManager.isInactive(inactivityTimeout)) {
				toast.error('Sesion finalizada por inactividad');
				store.dispatch(logout());
				cancelAllRequests();
				throw new axios.Cancel('Sesion finalizada por inactividad');
			}

			const currentToken = state?.auth?.access ?? tokenManager.getAccessToken();

			if (currentToken && tokenManager.isAccessTokenExpiring(ACCESS_TOKEN_REFRESH_LEEWAY_MS)) {
				try {
					await refreshAccessToken(currentToken);
				} catch (err) {
					console.warn('Proactive token refresh failed, will retry on 401:', err);
				}
			}

			const token = store.getState().auth.access ?? tokenManager.getAccessToken();
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

			const headerAuth = extractAuthHeader(originalRequest.headers);
			const expiredToken = headerAuth?.startsWith('Bearer ')
				? headerAuth.substring(7)
				: headerAuth || store.getState().auth.access;

			try {
				const newToken = await refreshAccessToken(expiredToken);
				if (originalRequest.headers && newToken) {
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

				toast.error(errorMessage);

				store.dispatch(logout());
				cancelAllRequests();

				setTimeout(() => {
					window.location.href = '/login';
				}, 1500);

				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

export default BaseService;
