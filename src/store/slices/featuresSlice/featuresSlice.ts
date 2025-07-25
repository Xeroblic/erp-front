import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { featuresApi } from "@/services/RtkQueryService";
import { RootState } from "@/store/rootReducer";

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
  list: string[];      // array de claves
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
          state.list = action.payload;          // ← siempre array
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

export const selectFeaturesStatus = (state: any) => state.features.status as FeatureStatus;
export const selectFeaturesList = (state: RootState) => state.features.list;

export default featuresSlice.reducer;
