import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Feature } from "@/interface/feature.interface";
import type { RootState } from "@/store/rootReducer";

export enum FeatureStatus {
  Idle = "idle",
  Loading = "loading",
  Succeeded = "succeeded",
  Failed = "failed",
}

export interface FeaturesState {
  status: FeatureStatus;
  features: Feature[];
}

const initialState: FeaturesState = {
  status: FeatureStatus.Idle,
  features: [],
};

const featuresSlice = createSlice({
  name: "features",
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<FeatureStatus>) {
      state.status = action.payload;
    },
    setFeatures(state, action: PayloadAction<Feature[]>) {
      state.features = action.payload;
    },
  },
});

export const { setStatus, setFeatures } = featuresSlice.actions;
export default featuresSlice.reducer;
