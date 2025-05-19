// src/services/RtkQueryService.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const featuresApi = createApi({
  reducerPath: "featuresApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.access;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (build) => ({
    getFeatures: build.query<string[], void>({
      // en vez de "/features" usamos "/perfil"
      query: () => "/perfil",
      // extraemos solo el campo `features`
      transformResponse: (response: { features: string[] }) => {
        return response.features ?? [];
      },
    }),
  }),
});

export const { useGetFeaturesQuery } = featuresApi;
