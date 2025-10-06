// ApiService.ts
import BaseService from './BaseService';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

type ExtraFlags = {
  isLoginRequest?: boolean;
  dedupe?: boolean;        // activa dedupe
  dedupeKey?: string;      // clave custom para dedupe
  cacheTTLms?: number;     // cachea respuestas por X ms (sólo GET)
};

type ReqCfg<T = any> = AxiosRequestConfig<T> & ExtraFlags;

const inFlight = new Map<string, Promise<AxiosResponse<any>>>();
const responseCache = new Map<string, { at: number; resp: AxiosResponse<any> }>();

function makeKey(cfg: AxiosRequestConfig, kind: 'dedupe' | 'cache') {
  const { method = 'get', url = '', params, data } = cfg;
  const p = params ? JSON.stringify(params) : '';
  const d = data ? (typeof data === 'string' ? data : JSON.stringify(data)) : '';
  // separa espacios para evitar colisiones raras
  return `${kind}|${method.toUpperCase()}|${url}|p=${p}|d=${d}`;
}

const ApiService = {
  async fetchData<Response = unknown, Request = Record<string, unknown>>(
    param: ReqCfg<Request>
  ): Promise<AxiosResponse<Response>> {
    const { dedupe, dedupeKey, cacheTTLms } = param;

    const isGet = (param.method ?? 'get').toLowerCase() === 'get';
    const cacheKey = isGet ? makeKey(param, 'cache') : undefined;

    if (isGet && cacheTTLms && cacheTTLms > 0 && cacheKey) {
      const hit = responseCache.get(cacheKey);
      if (hit && Date.now() - hit.at < cacheTTLms) {
        return hit.resp as AxiosResponse<Response>;
      }
    }

    const dk = dedupeKey ?? makeKey(param, 'dedupe');
    if (dedupe) {
      const existing = inFlight.get(dk);
      if (existing) return existing as Promise<AxiosResponse<Response>>;
    }


    const cfg: AxiosRequestConfig<Request> = { ...param };

    // 4) dispara la request
    const reqPromise = (BaseService as any)(cfg)
      .then((resp: AxiosResponse<Response>) => {
        // cache TTL sólo para GET
        if (isGet && cacheTTLms && cacheTTLms > 0 && cacheKey) {
          responseCache.set(cacheKey, { at: Date.now(), resp });
        }
        return resp;
      })
      .finally(() => {
        if (dedupe) inFlight.delete(dk);
      });

    if (dedupe) inFlight.set(dk, reqPromise as Promise<AxiosResponse<any>>);

    return reqPromise;
  },

  // Normaliza asumiendo que el backend responde { data: T }
  async fetchNormalized<T = any>(
    param: ReqCfg
  ): Promise<T> {
    const response = await ApiService.fetchData<{ data: T }>(param);
    return response.data.data;
  },
};

export default ApiService;
