import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import BaseService from './BaseService';

type ExtraFlags = {
	isLoginRequest?: boolean;
	dedupe?: boolean;
	dedupeKey?: string;
	cacheTTLms?: number;
	forceRefetch?: boolean;
};

type ReqCfg<T = any> = AxiosRequestConfig<T> & ExtraFlags;

interface CacheEntry {
	at: number;
	resp: AxiosResponse<any>;
	ttl: number;
}

// --- ESTADO INTERNO ---
const inFlight = new Map<string, Promise<AxiosResponse<any>>>();
const responseCache = new Map<string, CacheEntry>();

// Cuando el token cambie desde BaseService → borrar cache.
// (Este hook se implementa inyectando desde BaseService luego)
export const __apiServiceInternal = {
	clearAll() {
		responseCache.clear();
		inFlight.clear();
	},
};

// --- UTILIDADES ---

function stableStringify(obj: any): string {
	if (typeof obj !== 'object' || obj === null) return String(obj);
	if (Array.isArray(obj)) return JSON.stringify(obj.map(stableStringify));

	return JSON.stringify(
		Object.keys(obj)
			.sort()
			.reduce((result: Record<string, any>, key) => {
				result[key] = obj[key];
				return result;
			}, {}),
	);
}

function makeKey(cfg: AxiosRequestConfig, kind: 'dedupe' | 'cache') {
	const { method = 'get', url = '', params, data } = cfg;
	const p = params ? stableStringify(params) : '';
	const d = data ? (typeof data === 'string' ? data : stableStringify(data)) : '';
	return `${kind}::${method.toUpperCase()}::${url}::p=${p}::d=${d}`;
}

const ApiService = {
	async fetchData<Response = unknown, Request = Record<string, unknown>>(
		param: ReqCfg<Request>,
	): Promise<AxiosResponse<Response>> {
		const { dedupe, dedupeKey, cacheTTLms, forceRefetch } = param;

		const isGet = (param.method ?? 'get').toLowerCase() === 'get';

		// 1) INTENTAR CACHÉ
		const cacheKey = isGet && cacheTTLms ? makeKey(param, 'cache') : undefined;

		if (cacheKey && !forceRefetch) {
			const hit = responseCache.get(cacheKey);
			if (hit) {
				const now = Date.now();
				if (now - hit.at < hit.ttl) {
					return Promise.resolve(hit.resp as AxiosResponse<Response>);
				}
				responseCache.delete(cacheKey);
			}
		}

		// 2) DEDUPE
		const dk = dedupeKey ?? makeKey(param, 'dedupe');
		if (dedupe) {
			const existing = inFlight.get(dk);
			if (existing) return existing;
		}

		// 3) EJECUTAR REQUEST
		const reqPromise = (BaseService as any)(param)
			.then((resp: AxiosResponse<Response>) => {
				if (isGet && cacheTTLms && cacheTTLms > 0 && cacheKey) {
					responseCache.set(cacheKey, {
						at: Date.now(),
						resp,
						ttl: cacheTTLms,
					});
				}
				return resp;
			})
			.finally(() => {
				if (dedupe) inFlight.delete(dk);
			});

		if (dedupe) inFlight.set(dk, reqPromise);

		return reqPromise;
	},

	async fetchNormalized<T = any>(param: ReqCfg): Promise<T> {
		const response = await ApiService.fetchData<{ data: T }>(param);
		return response.data?.data ?? (response.data as any);
	},

	clearCache() {
		responseCache.clear();
		inFlight.clear();
	},

	invalidateCache(urlPattern: string) {
		for (const key of responseCache.keys()) {
			if (key.includes(urlPattern)) {
				responseCache.delete(key);
			}
		}
	},

	invalidateExact(config: AxiosRequestConfig) {
		const key = makeKey(config, 'cache');
		responseCache.delete(key);
	},
};

export default ApiService;
