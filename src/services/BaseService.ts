// import store, { logout, setToken } from '@/store';
// import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
// import tokenManager from '@/services/auth/tokenManager';

// // --- Tipos ---
// interface CustomAxiosRequestConfig<D = any> extends InternalAxiosRequestConfig<D> {
//     isLoginRequest?: boolean;
//     _retry?: boolean;
// }

// // --- Variables de Control (Semáforo y Cancelación) ---
// let isRefreshing = false;
// let failedQueue: Array<{
//     resolve: (token: string) => void;
//     reject: (error: any) => void;
// }> = [];

// let abortController = new AbortController();

// /**
//  * Cancela todas las peticiones activas en el momento de la llamada.
//  * Utilizado típicamente en el cierre de sesión para evitar errores 401 en peticiones colgadas.
//  */
// export const cancelAllRequests = () => {
//     abortController.abort();
//     abortController = new AbortController();
// };


// // --- Configuración ---
// const API_URL = import.meta.env.VITE_API_URL || '';

// const BaseService = axios.create({
//     timeout: 60000,
//     baseURL: API_URL,
// });

// // --- Helpers ---

// const processQueue = (error: any, token: string | null = null) => {
//     while (failedQueue.length) {
//         const waiter = failedQueue.shift();
//         if (!waiter) continue;

//         if (error) {
//             waiter.reject(error);
//         } else {
//             waiter.resolve(token as string);
//         }
//     }
// };

// // --- Interceptor de Request ---
// BaseService.interceptors.request.use(
//     (config: CustomAxiosRequestConfig) => {
//         // No interceptar login o refresh requests para evitar bucles
//         if (config.url?.includes('/login') || config.url?.includes('/refresh')) {
//             return config;
//         }

//         // 💡 Reincorporación: Asignar la señal de cancelación
//         config.signal = abortController.signal; 

//         const state = store.getState();
//         // Prioridad: TokenManager (memoria) -> Redux (persistencia)
//         const token = tokenManager.getAccessToken() ?? state.auth.access;

//         if (token && config.headers) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }

//         return config;
//     },
//     (error) => Promise.reject(error)
// );

// // --- Interceptor de Response (Maneja el 401 y la Concurrencia) ---
// BaseService.interceptors.response.use(
//     (response) => response,
//     async (error: AxiosError) => {
//         const originalRequest = error.config as CustomAxiosRequestConfig;

//         if (!error.response || !originalRequest) {
//             return Promise.reject(error);
//         }

//         // Detectar 401 Unauthorized
//         if (error.response.status === 401 && !originalRequest._retry) {
            
//             // Caso especial: Si el fallo vino del endpoint de refresh o login, no reintentamos
//             if (originalRequest.url?.includes('/refresh') || originalRequest.url?.includes('/login')) {
//                 store.dispatch(logout());
//                 tokenManager.clearTokens();
//                 // 💡 Aseguramos que el componente que estaba pendiente se detenga
//                 cancelAllRequests(); 
//                 return Promise.reject(error);
//             }

//             // 🚦 SI YA SE ESTÁ REFRESCANDO: Ponemos la petición en cola
//             if (isRefreshing) {
//                 return new Promise<string>((resolve, reject) => {
//                     failedQueue.push({ resolve, reject });
//                 })
//                     .then((token) => {
//                         // Reintentar la petición original con el nuevo token
//                         if (originalRequest.headers) {
//                             originalRequest.headers.Authorization = `Bearer ${token}`;
//                         }
//                         return BaseService(originalRequest);
//                     })
//                     .catch((err) => Promise.reject(err));
//             }

//             // 🚩 COMIENZO DEL REFRESH (Bloqueamos el semáforo)
//             originalRequest._retry = true;
//             isRefreshing = true;

//             try {
//                 const currentToken = tokenManager.getAccessToken() ?? store.getState().auth.access;

//                 // Llamada de Refresh
//                 const { data } = await axios.post(`${API_URL}/refresh`, {}, {
//                     headers: { Authorization: `Bearer ${currentToken}` }
//                 });

//                 const newToken = data.access_token || data.token || data.access;

//                 if (!newToken) {
//                     throw new Error('No se recibió token en el refresh');
//                 }

//                 // Actualizar Estados
//                 tokenManager.setAccessToken(newToken);
//                 store.dispatch(setToken({ access: newToken }));

//                 BaseService.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                
//                 processQueue(null, newToken);

//                 // Reintentar la petición original que falló
//                 if (originalRequest.headers) {
//                     originalRequest.headers.Authorization = `Bearer ${newToken}`;
//                 }
//                 return BaseService(originalRequest);

//             } catch (refreshError) {
//                 // Si falla el refresh, rechazamos toda la cola y cerramos sesión
//                 processQueue(refreshError, null);
//                 store.dispatch(logout());
//                 tokenManager.clearTokens();
//                 // 💡 Aseguramos que el componente que estaba pendiente se detenga
//                 cancelAllRequests();
//                 return Promise.reject(refreshError);
//             } finally {
//                 // Siempre liberamos el semáforo
//                 isRefreshing = false;
//             }
//         }

//         return Promise.reject(error);
//     }
// );

// export default BaseService;




// V1 ANTIGUO VOLVER EN CASO DE SER NECESARIO 

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

type RefreshQueueItem = {
	resolve: (token: string) => void;
	reject: (error: unknown) => void;
};

const refreshQueue: RefreshQueueItem[] = [];
let isRefreshingToken = false;

const enqueueRefresh = () =>
	new Promise<string>((resolve, reject) => {
		refreshQueue.push({ resolve, reject });
	});

const flushRefreshQueue = (error: unknown, token?: string) => {
	while (refreshQueue.length) {
		const waiter = refreshQueue.shift();
		if (!waiter) continue;
		if (error) {
			waiter.reject(error);
		} else {
			waiter.resolve(token as string);
		}
	}
};

const DEFAULT_INACTIVITY_TIMEOUT_MS = Infinity;
const TOKEN_REFRESH_THRESHOLD_MS = 30_000; 

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

const REFRESH_TOKEN_ERROR_TOAST_ID = 'refresh-token-error';

const performTokenRefresh = async (): Promise<string> => {
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
				},
			);

			const data: any = refreshResponse?.data ?? {};
			const access = data.token ?? data.access ?? data.access_token ?? data?.data?.token;
			if (!access) {
				throw new Error('El endpoint de refresh no devolvió un token válido');
			}

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
		}
	}

	if (lastError?.response?.status === 401) {
		throw new Error('Refresh no autorizado');
	}

	toast.error('Error al intentar refrescar el token', {
		toastId: REFRESH_TOKEN_ERROR_TOAST_ID,
	});

	throw lastError ?? new Error('No se pudo refrescar el token de acceso');
};

const refreshAccessToken = async (): Promise<string> => {
	if (isRefreshingToken) {
		return enqueueRefresh();
	}

	isRefreshingToken = true;

	try {
		const access = await performTokenRefresh();
		flushRefreshQueue(null, access);
		return access;
	} catch (error) {
		flushRefreshQueue(error);
		throw error;
	} finally {
		isRefreshingToken = false;
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

			if (!isAuthenticated) {
				tokenManager.clearTokens();
				return config;
			}

			if (tokenManager.isInactive(inactivityTimeout)) {
				tokenManager.markActivity(Date.now());
			}

			let token = tokenManager.getAccessToken() ?? state?.auth?.access ?? null;

			if (token) {
				const timeRemaining = tokenManager.getTokenTimeRemaining(token);
				const isValid = tokenManager.isTokenValid(token);
				const shouldRefresh =
					(!isValid || timeRemaining <= TOKEN_REFRESH_THRESHOLD_MS) &&
					tokenManager.canRefresh(token);

				if ((!isValid || timeRemaining <= TOKEN_REFRESH_THRESHOLD_MS) && !tokenManager.canRefresh(token)) {
					tokenManager.clearTokens();
					store.dispatch(logout());
					cancelAllRequests();
					throw new axios.Cancel('Token expirado y no se puede refrescar');
				}

				if (shouldRefresh) {
					try {
						token = await refreshAccessToken();
					} catch (refreshErr) {
						tokenManager.clearTokens();
						store.dispatch(logout());
						cancelAllRequests();
						throw refreshErr;
					}
				}

				if (token) {
					if (!config.headers) {
						config.headers = {} as any;
					}
					setAuthHeader(config.headers, token);
					tokenManager.markActivity(Date.now());
				}
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
