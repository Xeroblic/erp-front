import BaseService from './BaseService';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

type ExtraFlags = {
  isLoginRequest?: boolean;
  dedupe?: boolean;        // activa dedupe (evitar peticiones simultáneas idénticas)
  dedupeKey?: string;      // clave custom para dedupe
  cacheTTLms?: number;     // cachea respuestas por X ms (sólo GET)
  forceRefetch?: boolean;  // NUEVO: ignora el caché existente y fuerza la petición
};

type ReqCfg<T = any> = AxiosRequestConfig<T> & ExtraFlags;

interface CacheEntry {
  at: number; // timestamp
  resp: AxiosResponse<any>;
  ttl: number;
}

// --- ESTADO INTERNO ---
const inFlight = new Map<string, Promise<AxiosResponse<any>>>();
const responseCache = new Map<string, CacheEntry>();

// --- UTILIDADES ---

/**
 * Convierte un objeto a string de forma determinista ordenando las llaves.
 * {a:1, b:2} produce el mismo string que {b:2, a:1}
 */
function stableStringify(obj: any): string {
  if (typeof obj !== 'object' || obj === null) return String(obj);
  if (Array.isArray(obj)) return JSON.stringify(obj.map(stableStringify));
  
  return JSON.stringify(
    Object.keys(obj)
      .sort()
      .reduce((result: Record<string, any>, key) => {
        result[key] = obj[key];
        return result;
      }, {})
  );
}

function makeKey(cfg: AxiosRequestConfig, kind: 'dedupe' | 'cache') {
  const { method = 'get', url = '', params, data } = cfg;
  const p = params ? stableStringify(params) : '';
  const d = data ? (typeof data === 'string' ? data : stableStringify(data)) : '';
  // Separadores claros para evitar colisiones
  return `${kind}::${method.toUpperCase()}::${url}::p=${p}::d=${d}`;
}

const ApiService = {
  async fetchData<Response = unknown, Request = Record<string, unknown>>(
    param: ReqCfg<Request>
  ): Promise<AxiosResponse<Response>> {
    const { dedupe, dedupeKey, cacheTTLms, forceRefetch } = param;

    const isGet = (param.method ?? 'get').toLowerCase() === 'get';
    
    // 1. LÓGICA DE CACHÉ (Solo para GET)
    const cacheKey = (isGet && cacheTTLms) ? makeKey(param, 'cache') : undefined;

    if (cacheKey && !forceRefetch) {
      const hit = responseCache.get(cacheKey);
      if (hit) {
        const now = Date.now();
        if (now - hit.at < hit.ttl) {
           // Debug opcional para dev:
           // console.debug(`⚡ Cache Hit [${param.url}]`);
           return Promise.resolve(hit.resp as AxiosResponse<Response>);
        } else {
           responseCache.delete(cacheKey); // Expiró
        }
      }
    }

    // 2. LÓGICA DE DEDUPLICACIÓN (In-Flight)
    // Evita lanzar 2 peticiones idénticas si la primera aun no termina
    const dk = dedupeKey ?? makeKey(param, 'dedupe');
    if (dedupe) {
      const existing = inFlight.get(dk);
      if (existing) return existing as Promise<AxiosResponse<Response>>;
    }

    // 3. EJECUCIÓN DE LA PETICIÓN
    const reqPromise = (BaseService as any)(param)
      .then((resp: AxiosResponse<Response>) => {
        // Guardar en caché solo si fue exitoso, es GET y tiene TTL
        if (isGet && cacheTTLms && cacheTTLms > 0 && cacheKey) {
          responseCache.set(cacheKey, { 
            at: Date.now(), 
            resp, 
            ttl: cacheTTLms 
          });
        }
        return resp;
      })
      .finally(() => {
        // Al terminar (éxito o error), liberamos el dedupe
        if (dedupe) inFlight.delete(dk);
      });

    if (dedupe) inFlight.set(dk, reqPromise as Promise<AxiosResponse<any>>);

    return reqPromise;
  },

  /**
   * Helper para obtener directamente la data.
   * Asume que el backend responde { data: T } o directamente T
   */
  async fetchNormalized<T = any>(
    param: ReqCfg
  ): Promise<T> {
    const response = await ApiService.fetchData<{ data: T }>(param);
    // Manejo flexible por si el backend a veces no envuelve en "data"
    return response.data?.data ?? (response.data as any);
  },

  // --- MÉTODOS DE GESTIÓN DE CACHÉ (NUEVO) ---

  /**
   * Borra TODO el caché. USAR AL HACER LOGOUT.
   */
  clearCache() {
    responseCache.clear();
    inFlight.clear();
  },

  /**
   * Invalida caché por URL parcial.
   * Ej: invalidateCache('/users') borrará '/users?page=1', '/users/123', etc.
   * Útil después de crear/editar registros.
   */
  invalidateCache(urlPattern: string) {
    for (const key of responseCache.keys()) {
      if (key.includes(urlPattern)) {
        responseCache.delete(key);
      }
    }
  },
  
  /**
   * Elimina una entrada específica si conoces los params exactos
   */
  invalidateExact(config: AxiosRequestConfig) {
      const key = makeKey(config, 'cache');
      responseCache.delete(key);
  }
};

export default ApiService;