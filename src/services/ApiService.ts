import BaseService from './BaseService';
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const ApiService = {
    fetchData<Response = unknown, Request = Record<string, unknown>>(
        param: AxiosRequestConfig<Request> & { isLoginRequest?: boolean }
    ) {
        return new Promise<AxiosResponse<Response>>((resolve, reject) => {
            BaseService(param)
                .then((response: AxiosResponse<Response>) => {
                    resolve(response);
                })
                .catch((error: AxiosError) => {
                    if (
                        error.response &&
                        (error.response.status === 401 || error.response.status === 403 || error.response.status === 500)
                    ) {
                        window.location.href = '/login';
                        return;
                    }
                    if (!error.response) {
                        // Sin respuesta del servidor (caído)
                        window.location.href = '/login';
                        return;
                    }
                    reject(error);
                });
        });
    },

    async fetchNormalized<T = any>(
        param: AxiosRequestConfig & { isLoginRequest?: boolean }
    ): Promise<T> {
        const response = await ApiService.fetchData<{ data: T }>(param);
        return response.data.data;
    },
};

export default ApiService;
