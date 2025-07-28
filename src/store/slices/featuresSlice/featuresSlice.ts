import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import { RootState } from '@/store/rootReducer';

/* -------------------------------- ENUM -------------------------------- */
export enum FeatureStatus {
  Idle = 'idle',
  Loading = 'loading',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

/* --------------------------- MODELO STATE ----------------------------- */
export interface FeaturesState {
  status: FeatureStatus;
  list: string[]; // ← solo claves de features
  error?: string;
  assignLoading: boolean;
  assignError?: string;
}

const initialState: FeaturesState = {
  status: FeatureStatus.Idle,
  list: [],
  error: undefined,
  assignLoading: false,
  assignError: undefined,
};

/* --------------------------- THUNKS ------------------------------ */

// GET: obtiene features asignadas al usuario actual
export const fetchFeatures = createAsyncThunk(
  'features/fetchFeatures',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await ApiService.fetchData<string[]>({
        url: `/features?userId=${userId}`,
        method: 'get',
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching features');
    }
  }
);

// POST: asignar features a un usuario
export const assignFeatures = createAsyncThunk<
  void,
  { userId: number; features: string[] },
  { rejectValue: string }
>(
  'features/assignFeatures',
  async ({ userId, features }, { rejectWithValue }) => {
    try {
      await ApiService.fetchData({
        url: `/users/${userId}/features`,
        method: 'post',
        data: { features },
      });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al asignar features');
    }
  }
);

/* ---------------------------- SLICE ----------------------------- */
const featuresSlice = createSlice({
  name: 'features',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH features
      .addCase(fetchFeatures.pending, (state) => {
        state.status = FeatureStatus.Loading;
        state.error = undefined;
      })
      .addCase(fetchFeatures.fulfilled, (state, { payload }) => {
        state.status = FeatureStatus.Succeeded;
        state.list = payload;
      })
      .addCase(fetchFeatures.rejected, (state, { payload }) => {
        state.status = FeatureStatus.Failed;
        state.error = typeof payload === 'string' ? payload : 'Error fetching features';
      })

      // ASSIGN features
      .addCase(assignFeatures.pending, (state) => {
        state.assignLoading = true;
        state.assignError = undefined;
      })
      .addCase(assignFeatures.fulfilled, (state) => {
        state.assignLoading = false;
      })
      .addCase(assignFeatures.rejected, (state, { payload }) => {
        state.assignLoading = false;
        state.assignError = payload;
      });
  },
});

/* ------------------------- SELECTORS -------------------------- */
export const selectFeaturesStatus = (state: RootState) => state.features.status;
export const selectFeaturesList = (state: RootState) => state.features.list;
export const selectAssignLoading = (state: RootState) => state.features.assignLoading;
export const selectAssignError = (state: RootState) => state.features.assignError;

/* -------------------------- EXPORT ---------------------------- */
export default featuresSlice.reducer;
