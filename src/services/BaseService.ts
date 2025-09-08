import store, { setToken, logout } from "@/store";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { set } from "lodash";
import { toast } from "react-toastify";

interface CustomAxiosRequestConfig<D = any> extends InternalAxiosRequestConfig<D> {
    isLoginRequest?: boolean;
    _retry?: boolean;
}

let abortController = new AbortController();

export const cancelAllRequests = () => {
    abortController.abort();
    abortController = new AbortController();
};

const BaseService = axios.create({
    timeout: 60000,
    baseURL: `${process.env.VITE_API_URL}`
});

BaseService.interceptors.request.use(
    (config: CustomAxiosRequestConfig) => {
        if (!config.isLoginRequest) {
            config.signal = abortController.signal;
        }

        if (!config.isLoginRequest) {
            const token = store.getState().auth.access
            if (token) {
                config.headers = config.headers || {};
                config.headers['Authorization'] = 'Bearer ' + token;
            }
        }
        return config;
    },
    error => Promise.reject(error)
);

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

            const refreshToken = store.getState().auth.refresh;
            if (refreshToken) {
                try {
                    const refreshResponse = await axios.post(`${process.env.VITE_API_URL}/auth/jwt/refresh`, {
                        refresh: refreshToken
                    });

                    const newToken = refreshResponse.data.access;
                    store.dispatch(setToken(newToken))

                    originalRequest.headers['Authorization'] = 'Bearer ' + newToken;

                    return BaseService(originalRequest);
                } catch (refreshError) {
                    console.error("Error refreshing token:", refreshError);
                    return Promise.reject(refreshError);
                }
            }
        }

        console.error("API Error:", error);
        return Promise.reject(error);
    }
);

export default BaseService;
