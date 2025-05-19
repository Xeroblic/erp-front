import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { featuresApi } from "@/services/RtkQueryService";

export enum FeatureStatus {
  Idle = "idle",
  Loading = "loading",
  Succeeded = "succeeded",
  Failed = "failed",
}

export interface Feature {
  id: number;
  clave: string;
  nombre?: string;
  // …otros campos que te devuelva cada feature
}

export interface FeaturesState {
  status: FeatureStatus;
  list: string[];  // claves o nombres de features
  error?: string;
}

const initialState: FeaturesState = {
  status: FeatureStatus.Idle,
  list: [],
};

const featuresSlice = createSlice({
  name: "features",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // pending
      .addMatcher(
        featuresApi.endpoints.getFeatures.matchPending,
        (state) => {
          state.status = FeatureStatus.Loading;
          state.error = undefined;
        }
      )
      // fulfilled
      .addMatcher(
        featuresApi.endpoints.getFeatures.matchFulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.status = FeatureStatus.Succeeded;
          // payload ya es string[] gracias a transformResponse
          state.list = action.payload;
        }
      )
      // rejected
      .addMatcher(
        featuresApi.endpoints.getFeatures.matchRejected,
        (state, { error }) => {
          state.status = FeatureStatus.Failed;
          state.error = error?.message ?? "Error al cargar features";
        }
      );
  },
});

export const selectFeaturesStatus = (state: any) =>
  state.features.status as FeatureStatus;
export const selectFeaturesList = (state: any) =>
  state.features.list as string[];

export default featuresSlice.reducer;
