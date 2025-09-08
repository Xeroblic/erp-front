import BaseService from './BaseService';
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const ApiService = {
    fetchData<Response = unknown, Request = Record<string, unknown>>(
        param: AxiosRequestConfig<Request> & { isLoginRequest?: boolean; skipAuthRedirect?: boolean }
    ) {
        return new Promise<AxiosResponse<Response>>((resolve, reject) => {
            BaseService(param).then((response: AxiosResponse<Response>) => {
                resolve(response);
            }).catch((error: AxiosError) => {
                reject(error);
            });
        });
    },

    async fetchNormalized<T = any>(
        param: AxiosRequestConfig & { isLoginRequest?: boolean; skipAuthRedirect?: boolean }
    ): Promise<T> {
        const response = await ApiService.fetchData<{ data: T }>(param);
        return response.data.data;
    },
};

export default ApiService;
