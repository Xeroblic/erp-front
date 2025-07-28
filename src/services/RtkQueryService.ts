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
      transformResponse: (raw: unknown): string[] => {
        if (Array.isArray(raw)) return raw;
        // @ts-ignore — intentamos leer .features
        if (Array.isArray(raw?.features)) return raw.features;
        return []; // fallback seguro
      },
      keepUnusedDataFor: 900,
    }),

    // Mutation para asignar features a un usuario
    assignFeatures: builder.mutation<void, { userId: number; features: string[] }>({
      query: ({ userId, features }) => ({
        url: `/users/${userId}/features`,
        method: 'POST',
        body: { features },
      }),
    }),
  }),
});

export const { useGetFeaturesQuery, useAssignFeaturesMutation } = featuresApi;
