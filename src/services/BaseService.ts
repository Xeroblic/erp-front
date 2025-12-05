import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import store, { logout, setToken } from '@/store';
import tokenManager from '@/services/auth/tokenManager';

// --- Tipos ---
interface CustomAxiosRequestConfig<D = any> extends InternalAxiosRequestConfig<D> {
	isLoginRequest?: boolean;
	_retry?: boolean;
}

// --- Variables de Control (Semáforo y Cancelación) ---
let refreshPromise: Promise<string> | null = null;

let abortController = new AbortController();

/**
 * Cancela todas las peticiones activas en el momento de la llamada.
 * Utilizado típicamente en el cierre .
 */
export const cancelAllRequests = () => {
	abortController.abort();
	abortController = new AbortController();
};

// --- Configuración ---
const API_URL = import.meta.env.VITE_API_URL || '';

const BaseService = axios.create({
	timeout: 60000,
	baseURL: API_URL,
});

// --- Helpers ---

const performTokenRefresh = (forcedToken?: string | null): Promise<string> => {
	if (refreshPromise) {
		return refreshPromise;
	}

	refreshPromise = (async () => {
		try {
			const currentToken =
				forcedToken ?? tokenManager.getAccessToken() ?? store.getState().auth.access;
			if (!currentToken || typeof currentToken !== 'string') {
				throw new Error('No hay token disponible para refrescar');
			}
			const sanitizedToken = currentToken.replace(/^Bearer\s+/i, '');

			const { data } = await axios.post(
				`${API_URL}/refresh`,
				{},
				{
					headers: { Authorization: `Bearer ${sanitizedToken}` },
				},
			);

			const newToken = data.access_token || data.token || data.access;

			if (!newToken) {
				throw new Error('No se recibió token en el refresh');
			}

			tokenManager.setAccessToken(newToken);
			store.dispatch(setToken({ access: newToken }));

			BaseService.defaults.headers.common.Authorization = `Bearer ${newToken}`;

			return newToken;
		} catch (refreshError) {
			store.dispatch(logout());
			tokenManager.clearTokens();
			cancelAllRequests();
			throw refreshError;
		} finally {
			refreshPromise = null;
		}
	})();

	return refreshPromise;
};

export const triggerTokenRefresh = (forcedToken?: string | null) =>
	performTokenRefresh(forcedToken);

// --- Interceptor de Request ---
BaseService.interceptors.request.use(
	(config: CustomAxiosRequestConfig) => {
		// No interceptar login o refresh requests para evitar bucles
		if (config.url?.includes('/login') || config.url?.includes('/refresh')) {
			return config;
		}

		// 💡 Reincorporación: Asignar la señal de cancelación
		config.signal = abortController.signal;

		const applyTokenToConfig = (token?: string | null) => {
			if (token && config.headers) {
				config.headers.Authorization = `Bearer ${token}`;
			}
			return config;
		};

		if (refreshPromise) {
			return refreshPromise
				.then((token) => applyTokenToConfig(token))
				.catch((error) => Promise.reject(error));
		}

		const state = store.getState();
		const token = tokenManager.getAccessToken() ?? state.auth.access;

		return applyTokenToConfig(token);
	},
	(error) => Promise.reject(error),
);

// --- Interceptor de Response (Maneja el 401 y la Concurrencia) ---
BaseService.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as CustomAxiosRequestConfig;

		if (!error.response || !originalRequest) {
			return Promise.reject(error);
		}

		// Detectar 401 Unauthorized
		if (error.response.status === 401 && !originalRequest._retry) {
			// Caso especial: Si el fallo vino del endpoint de refresh o login, no reintentamos
			if (
				originalRequest.url?.includes('/refresh') ||
				originalRequest.url?.includes('/login')
			) {
				store.dispatch(logout());
				tokenManager.clearTokens();
				cancelAllRequests();
				return Promise.reject(error);
			}

			originalRequest._retry = true;

			try {
				// Intentar refrescar el token
				const newToken = await performTokenRefresh();

				// Actualizar el header de autorización en la petición original
				if (originalRequest.headers) {
					originalRequest.headers.Authorization = `Bearer ${newToken}`;
				}

				// Reintentar la petición original
				return BaseService(originalRequest);
			} catch (refreshError) {
				// Si el refresh falla, ya se manejó el logout en performTokenRefresh
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

export default BaseService;

// V1 ANTIGUO VOLVER EN CASO DE SER NECESARIO

// import store, { logout, setToken } from '@/store';
// import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
// import { toast } from 'react-toastify';
// import tokenManager from '@/services/auth/tokenManager';

// interface CustomAxiosRequestConfig<D = any> extends InternalAxiosRequestConfig<D> {
// 	isLoginRequest?: boolean;
// 	_retry?: boolean;
// }

// let abortController = new AbortController();

// export const cancelAllRequests = () => {
// 	abortController.abort();
// 	abortController = new AbortController();
// };

// const API_URL = import.meta.env.VITE_API_URL || '';
// const REFRESH_ENDPOINTS = [`${API_URL}/refresh`, `${API_URL}/refresh`];

// type RefreshQueueItem = {
// 	resolve: (token: string) => void;
// 	reject: (error: unknown) => void;
// };

// const refreshQueue: RefreshQueueItem[] = [];
// let isRefreshingToken = false;

// const enqueueRefresh = () =>
// 	new Promise<string>((resolve, reject) => {
// 		refreshQueue.push({ resolve, reject });
// 	});

// const flushRefreshQueue = (error: unknown, token?: string) => {
// 	while (refreshQueue.length) {
// 		const waiter = refreshQueue.shift();
// 		if (!waiter) continue;
// 		if (error) {
// 			waiter.reject(error);
// 		} else {
// 			waiter.resolve(token as string);
// 		}
// 	}
// };

// const DEFAULT_INACTIVITY_TIMEOUT_MS = Infinity;
// const TOKEN_REFRESH_THRESHOLD_MS = 30_000;

// const BaseService = axios.create({
// 	timeout: 60000,
// 	baseURL: API_URL,
// });

// const extractAuthHeader = (
// 	headers?: CustomAxiosRequestConfig['headers'],
// ): string | undefined => {
// 	if (!headers) return undefined;

// 	const maybeAxiosHeaders = headers as unknown as { get?: (key: string) => string | undefined };
// 	if (typeof maybeAxiosHeaders.get === 'function') {
// 		return maybeAxiosHeaders.get('Authorization') || maybeAxiosHeaders.get('authorization');
// 	}

// 	const normalizedHeaders = headers as Record<string, string | undefined>;
// 	return normalizedHeaders?.Authorization || normalizedHeaders?.authorization;
// };

// const setAuthHeader = (
// 	headers: CustomAxiosRequestConfig['headers'] | undefined,
// 	token: string,
// ) => {
// 	if (!headers) return;
// 	const maybeAxiosHeaders = headers as unknown as { set?: (key: string, value: string) => void };
// 	if (typeof maybeAxiosHeaders.set === 'function') {
// 		maybeAxiosHeaders.set('Authorization', `Bearer ${token}`);
// 		return;
// 	}
// 	(headers as Record<string, string>).Authorization = `Bearer ${token}`;
// };

// const REFRESH_TOKEN_ERROR_TOAST_ID = 'refresh-token-error';

// const performTokenRefresh = async (): Promise<string> => {
// 	if (!API_URL) throw new Error('VITE_API_URL no esta configurado');

// 	const currentToken = tokenManager.getAccessToken() ?? store.getState().auth.access;
// 	if (!currentToken) throw new Error('No hay token para refrescar');

// 	let lastError: any = null;

// 	for (const endpoint of REFRESH_ENDPOINTS) {
// 		try {
// 			const refreshResponse = await axios.post(
// 				endpoint,
// 				{},
// 				{
// 					headers: { Authorization: `Bearer ${currentToken}` },
// 				},
// 			);

// 			const data: any = refreshResponse?.data ?? {};
// 			const access = data.token ?? data.access ?? data.access_token ?? data?.data?.token;
// 			if (!access) {
// 				throw new Error('El endpoint de refresh no devolvió un token válido');
// 			}

// 			tokenManager.setAccessToken(access);
// 			store.dispatch(
// 				setToken({
// 					access,
// 					markActivity: true,
// 				}),
// 			);

// 			return access;
// 		} catch (err: any) {
// 			lastError = err;
// 		}
// 	}

// 	if (lastError?.response?.status === 401) {
// 		throw new Error('Refresh no autorizado');
// 	}

// 	toast.error('Error al intentar refrescar el token', {
// 		toastId: REFRESH_TOKEN_ERROR_TOAST_ID,
// 	});

// 	throw lastError ?? new Error('No se pudo refrescar el token de acceso');
// };

// const refreshAccessToken = async (): Promise<string> => {
// 	if (isRefreshingToken) {
// 		return enqueueRefresh();
// 	}

// 	isRefreshingToken = true;

// 	try {
// 		const access = await performTokenRefresh();
// 		flushRefreshQueue(null, access);
// 		return access;
// 	} catch (error) {
// 		flushRefreshQueue(error);
// 		throw error;
// 	} finally {
// 		isRefreshingToken = false;
// 	}
// };

// BaseService.interceptors.request.use(
// 	async (config: CustomAxiosRequestConfig) => {
// 		if (!config.isLoginRequest) {
// 			config.signal = abortController.signal;

// 			const state = store.getState();
// 			const inactivityTimeout =
// 				state?.auth?.inactivityTimeoutMs ?? DEFAULT_INACTIVITY_TIMEOUT_MS;
// 			const isAuthenticated = !!state?.auth?.isAuthenticated;

// 			if (!isAuthenticated) {
// 				tokenManager.clearTokens();
// 				return config;
// 			}

// 			if (tokenManager.isInactive(inactivityTimeout)) {
// 				tokenManager.markActivity(Date.now());
// 			}

// 			let token = tokenManager.getAccessToken() ?? state?.auth?.access ?? null;

// 			if (token) {
// 				const timeRemaining = tokenManager.getTokenTimeRemaining(token);
// 				const isValid = tokenManager.isTokenValid(token);
// 				const shouldRefresh =
// 					(!isValid || timeRemaining <= TOKEN_REFRESH_THRESHOLD_MS) &&
// 					tokenManager.canRefresh(token);

// 				if ((!isValid || timeRemaining <= TOKEN_REFRESH_THRESHOLD_MS) && !tokenManager.canRefresh(token)) {
// 					tokenManager.clearTokens();
// 					store.dispatch(logout());
// 					cancelAllRequests();
// 					throw new axios.Cancel('Token expirado y no se puede refrescar');
// 				}

// 				if (shouldRefresh) {
// 					try {
// 						token = await refreshAccessToken();
// 					} catch (refreshErr) {
// 						tokenManager.clearTokens();
// 						store.dispatch(logout());
// 						cancelAllRequests();
// 						throw refreshErr;
// 					}
// 				}

// 				if (token) {
// 					if (!config.headers) {
// 						config.headers = {} as any;
// 					}
// 					setAuthHeader(config.headers, token);
// 					tokenManager.markActivity(Date.now());
// 				}
// 			}
// 		}

// 		return config;
// 	},
// 	(error) => Promise.reject(error),
// );

// BaseService.interceptors.response.use(
// 	(response) => response,
// 	async (error: AxiosError) => {
// 		const originalRequest = error.config as CustomAxiosRequestConfig;

// 		if (
// 			error.response &&
// 			error.response.status === 401 &&
// 			!originalRequest._retry &&
// 			!originalRequest.isLoginRequest
// 		) {
// 			originalRequest._retry = true;

// 			const authState = store.getState().auth;
// 			const isAuthenticated = !!authState?.isAuthenticated;
// 			const hasAccess =
// 				!!tokenManager.getAccessToken() || !!authState?.access;

// 			if (!isAuthenticated || !hasAccess) {
// 				tokenManager.clearTokens();
// 				store.dispatch(logout());
// 				cancelAllRequests();
// 				if (window.location.pathname !== '/login') {
// 					setTimeout(() => {
// 						window.location.href = '/login';
// 					}, 300);
// 				}
// 				return Promise.reject(error);
// 			}

// 			try {
// 				const newToken = await refreshAccessToken();

// 				if (newToken && originalRequest.headers) {
// 					setAuthHeader(originalRequest.headers, newToken);
// 				}

// 				return BaseService(originalRequest);
// 			} catch (refreshError: any) {
// 				console.error('Error refreshing token:', refreshError);

// 				tokenManager.clearTokens();

// 				const status = (refreshError as AxiosError)?.response?.status;
// 				const errorMessage =
// 					status === 401 || refreshError?.message?.includes('no autorizado')
// 						? 'Sesión expirada. Por favor, inicia sesión nuevamente.'
// 						: 'Error de autenticación. Por favor, inicia sesión nuevamente.';

// 				store.dispatch(logout());
// 				cancelAllRequests();

// 				if (isAuthenticated && window.location.pathname !== '/login') {
// 					setTimeout(() => {
// 						window.location.href = '/login';
// 					}, 500);
// 				}

// 				return Promise.reject(refreshError);
// 			}
// 		}

// 		return Promise.reject(error);
// 	},
// );

// export default BaseService;
