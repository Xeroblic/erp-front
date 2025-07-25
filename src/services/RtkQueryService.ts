// src/services/RtkQueryService.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/store';

export const featuresApi = createApi({
  reducerPath: 'featuresApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.access;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // 🔑  devolvemos SIEMPRE string[]
    getFeatures: builder.query<string[], void>({
      query: () => '/features',

      // ① Si el backend devuelve array → lo usamos tal cual
      // ② Si devuelve {features:[…]} → extraemos la llave
      transformResponse: (raw: unknown): string[] => {
        if (Array.isArray(raw)) return raw;
        // @ts-ignore — intentamos leer .features
        if (Array.isArray(raw?.features)) return raw.features;
        return []; // fallback seguro
      },

      keepUnusedDataFor: 900, // cache 15 min
    }),
  }),
});

export const { useGetFeaturesQuery } = featuresApi;
