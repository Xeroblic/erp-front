import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import store, { logout, setToken } from '@/store';
import tokenManager from '@/services/auth/tokenManager';

// --- Tipos ---
interface CustomAxiosRequestConfig<D = unknown> extends InternalAxiosRequestConfig<D> {
	isLoginRequest?: boolean;
	_retry?: boolean;
}

interface RefreshTokenResponse {
	access_token?: string;
	token?: string;
	access?: string;
}

// --- Variables de Control (Semáforo y Cancelación) ---
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

let abortController = new AbortController();

const composeAbortSignals = (callerSignal?: AbortSignal): AbortSignal =>
	callerSignal ? AbortSignal.any([callerSignal, abortController.signal]) : abortController.signal;

/**
 * Cancela todas las peticiones activas en el momento de la llamada.
 * Utilizado típicamente en el cierre de sesión voluntario.
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

/**
 * Pide un token nuevo al backend usando el token actual y propaga el resultado
 * al tokenManager, al store y a la instancia de Axios.
 */
const requestNewToken = async (): Promise<string> => {
	const currentToken = tokenManager.getAccessToken() ?? store.getState().auth.access;
	if (!currentToken) throw new Error('No token to refresh');

	// Limpiamos "Bearer " si existe
	const cleanToken = currentToken.replace(/^Bearer\s+/i, '');

	const response = await axios.post<RefreshTokenResponse>(
		`${API_URL}/refresh`,
		{},
		{ headers: { Authorization: `Bearer ${cleanToken}` } },
	);

	const newToken = response.data.access_token ?? response.data.token ?? response.data.access;
	if (!newToken) throw new Error('Refresh response did not contain a token');

	tokenManager.setAccessToken(newToken);
	store.dispatch(setToken({ access: newToken }));
	BaseService.defaults.headers.common.Authorization = `Bearer ${newToken}`;

	return newToken;
};

/**
 * Ejecuta el refresh del token con patrón semáforo (una sola ejecución concurrente):
 * si ya hay un refresh en curso, devuelve la misma promesa.
 * IMPORTANTE: No hace logout automático al fallar. Deja que el caller decida.
 */
const performTokenRefresh = (): Promise<string> => {
	if (isRefreshing && refreshPromise) {
		return refreshPromise;
	}

	isRefreshing = true;
	refreshPromise = requestNewToken().finally(() => {
		isRefreshing = false;
		refreshPromise = null;
	});

	return refreshPromise;
};

export const triggerTokenRefresh = () => performTokenRefresh();

// --- Interceptor de Request ---
BaseService.interceptors.request.use(
	(config: CustomAxiosRequestConfig) => {
		// No interceptar login o refresh requests para evitar bucles
		if (config.url?.includes('/login') || config.url?.includes('/refresh')) {
			return config;
		}

		// Asignar la señal de cancelación
		config.signal = composeAbortSignals(config.signal as AbortSignal | undefined);

		const applyTokenToConfig = (token?: string | null) => {
			if (token && config.headers) {
				config.headers.Authorization = `Bearer ${token}`;
			}
			return config;
		};

		// Si hay un refresh en curso, esperamos su token antes de salir
		if (refreshPromise) {
			return refreshPromise.then((token) => applyTokenToConfig(token));
		}

		const state = store.getState();
		const token = tokenManager.getAccessToken() ?? state.auth.access;

		return applyTokenToConfig(token);
	},
	(error) => Promise.reject(error),
);

// --- Interceptor de Response (maneja el 401 y la concurrencia del refresh) ---
BaseService.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as CustomAxiosRequestConfig;

		if (!error.response || !originalRequest) {
			return Promise.reject(error);
		}

		// Si no es 401 o ya se reintentó, rechazar (evita bucles infinitos)
		if (error.response.status !== 401 || originalRequest._retry) {
			return Promise.reject(error);
		}

		// Marcar que ya intentamos recuperar esta petición
		originalRequest._retry = true;

		try {
			// Intentamos refrescar (o esperar al que se está ejecutando)
			const newToken = await performTokenRefresh();

			// Éxito: reintentamos la petición original con el token nuevo
			if (originalRequest.headers) {
				originalRequest.headers.Authorization = `Bearer ${newToken}`;
			}
			return await BaseService(originalRequest);
		} catch (refreshError) {
			// El refresh falló. Antes de cerrar sesión intentamos recuperar y
			// distinguimos un fallo de autenticación real de un error transitorio.

			// 1. Si otra request/proceso paralelo ya dejó un token nuevo y válido
			// en memoria, lo usamos en lugar del que falló.
			const currentTokenInRam = tokenManager.getAccessToken();
			const tokenUsedInRequest = originalRequest.headers?.Authorization?.toString().replace(
				'Bearer ',
				'',
			);

			if (
				currentTokenInRam &&
				currentTokenInRam !== tokenUsedInRequest &&
				tokenManager.isTokenValid(currentTokenInRam)
			) {
				if (originalRequest.headers) {
					originalRequest.headers.Authorization = `Bearer ${currentTokenInRam}`;
				}
				return BaseService(originalRequest);
			}

			// 2. Decidir si la sesión está REALMENTE perdida.
			// Solo cerramos sesión ante un fallo de autenticación genuino (401/403)
			// o cuando el token ya salió de la ventana de refresh (refresh_ttl).
			// Un 500/502/503 o un error de red son transitorios: NO cerramos sesión,
			// el worker proactivo reintentará y la próxima petición volverá a probar.
			const isRefreshEndpoint = originalRequest.url?.includes('/refresh');
			const isLoginEndpoint = originalRequest.url?.includes('/login');

			const refreshStatus = (refreshError as AxiosError).response?.status;
			const isAuthFailure = refreshStatus === 401 || refreshStatus === 403;
			const outsideRefreshWindow = !tokenManager.canRefresh();
			const sessionIsDead = isAuthFailure || outsideRefreshWindow;

			if (!isRefreshEndpoint && !isLoginEndpoint && sessionIsDead) {
				store.dispatch(logout());
				tokenManager.clearTokens();
				cancelAllRequests();
			}

			return Promise.reject(refreshError);
		}
	},
);

export default BaseService;
