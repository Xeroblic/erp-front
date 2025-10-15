import store, { setToken, logout } from "@/store";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "react-toastify";

// Extender la interfaz de configuración para incluir isLoginRequest y _retry
interface CustomAxiosRequestConfig<D = any> extends InternalAxiosRequestConfig<D> {
    isLoginRequest?: boolean;
    _retry?: boolean;
}

// Controller para cancelar peticiones
let abortController = new AbortController();

export const cancelAllRequests = () => {
    abortController.abort();
    abortController = new AbortController();
};

const API_URL = import.meta.env.VITE_API_URL || "";

const BaseService = axios.create({
    timeout: 60000,
    baseURL: API_URL
});

const extractAuthHeader = (headers?: CustomAxiosRequestConfig["headers"]): string | undefined => {
    if (!headers) return undefined;

    const maybeAxiosHeaders = headers as unknown as { get?: (key: string) => string | undefined };
    if (typeof maybeAxiosHeaders.get === "function") {
        return maybeAxiosHeaders.get("Authorization") || maybeAxiosHeaders.get("authorization");
    }

    const normalizedHeaders = headers as Record<string, string | undefined>;
    return normalizedHeaders?.Authorization || normalizedHeaders?.authorization;
};

// Interceptor de Solicitud
BaseService.interceptors.request.use(
    (config: CustomAxiosRequestConfig) => {
        // Agregar signal para cancelación
        if (!config.isLoginRequest) {
            config.signal = abortController.signal;
        }

        if (!config.isLoginRequest) {
            const token = store.getState().auth.access
            if (token) {
                if (!config.headers) {
                    config.headers = {} as any;
                }
                config.headers.set('Authorization', `Bearer ${token}`);
            }
        }
        return config;
    },
    error => Promise.reject(error)
);

// Interceptor de Respuesta
BaseService.interceptors.response.use(
    response => response,
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
            const expiredToken = headerAuth?.startsWith("Bearer ")
                ? headerAuth.substring(7)
                : (headerAuth || store.getState().auth.access);
            if (expiredToken) {
                try {
                    if (!API_URL) {
                        throw new Error("VITE_API_URL no está configurado");
                    }

                    const refreshResponse = await axios.post(
                        `${API_URL}/refresh`,
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${expiredToken}`
                            }
                        }
                    );

                    const newToken = refreshResponse?.data?.token;
                    if (!newToken) {
                        throw new Error("El endpoint /refresh no devolvió un token");
                    }

                    store.dispatch(setToken(newToken));

                    if (originalRequest.headers) {
                        originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
                    }

                    return BaseService(originalRequest);
                } catch (refreshError) {
                    toast.error("Sesión Expirada");
                    store.dispatch(logout());
                    cancelAllRequests();
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 1000);
                    return Promise.reject(refreshError);
                }
            } else {
                toast.error("Sesión Expirada");
                store.dispatch(logout());
                cancelAllRequests();
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default BaseService;
