import store, { GUARDAR_TOKEN, LOGOUT } from "@/store";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "react-toastify";

interface CustomAxiosRequestConfig<D = any> extends InternalAxiosRequestConfig<D> {
    isLoginRequest?: boolean;
    _retry?: boolean;
}

const BaseService = axios.create({
    timeout: 60000,
    baseURL: import.meta.env.VITE_API_URL, // Laravel: http://127.0.0.1:8000/api
});

// Interceptor de Solicitud
BaseService.interceptors.request.use(
    (config: CustomAxiosRequestConfig) => {
        const token = store.getState().auth.access;
        if (token && !config.isLoginRequest) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${token}`;
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

        // Si es 401 y no se ha reintentado aún
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.isLoginRequest
        ) {
            originalRequest._retry = true;

            try {
                const refreshResponse = await axios.post(`${import.meta.env.VITE_API_URL}/refresh`, {}, {
                    headers: {
                        'Authorization': `Bearer ${store.getState().auth.access}`,
                    }
                });

                const newToken = refreshResponse.data.token; // Laravel responde con { token: "..." }
                store.dispatch(GUARDAR_TOKEN(newToken));

                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

                return BaseService(originalRequest);
            } catch (refreshError) {
                toast.error("Sesión expirada. Inicia sesión nuevamente.");
                store.dispatch(LOGOUT());
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default BaseService;
