import { createSlice } from "@reduxjs/toolkit";
import { exportReport, fetchReportResults, fetchReportTypes } from "./reportsThunks";
import { IReportType, IReportResult } from "@/interface/reports.interface";

export interface ReportsState {
    types: IReportType[];
    results: IReportResult<any> | null;
    loading: boolean;
    exporting: boolean;
    error: string | null;
}

const initialState: ReportsState = {
    types: [],
    results: null,
    loading: false,
    exporting: false,
    error: null,
};

export const reportsSlice = createSlice({
    name: "reports",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // ------- LISTA -------
        builder.addCase(fetchReportTypes.pending, (state) => {
            state.loading = true;
            state.error = null;
        });

        builder.addCase(fetchReportTypes.fulfilled, (state, action) => {
            state.types = action.payload as IReportType[];
            state.loading = false;
            state.error = null;
        });

        builder.addCase(fetchReportTypes.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // ------- RESULTADOS -------
        builder.addCase(fetchReportResults.pending, (state) => {
            state.loading = true;
            state.error = null;
        });

        builder.addCase(fetchReportResults.fulfilled, (state, action) => {
            // action.payload is expected to be IReportResult
            console.log('[reportSlice] fetchReportResults.fulfilled - action.payload:', action.payload);
            console.log('[reportSlice] fetchReportResults.fulfilled - action.payload type:', typeof action.payload);
            console.log('[reportSlice] fetchReportResults.fulfilled - action.payload es array:', Array.isArray(action.payload));
            if (action.payload && typeof action.payload === 'object' && !Array.isArray(action.payload)) {
                console.log('[reportSlice] fetchReportResults.fulfilled - action.payload keys:', Object.keys(action.payload));
                console.log('[reportSlice] fetchReportResults.fulfilled - action.payload.data:', (action.payload as any)?.data);
                console.log('[reportSlice] fetchReportResults.fulfilled - action.payload.data length:', Array.isArray((action.payload as any)?.data) ? (action.payload as any).data.length : 'N/A');
            }
            state.results = action.payload as IReportResult<any>;
            console.log('[reportSlice] fetchReportResults.fulfilled - state.results después de asignar:', state.results);
            state.loading = false;
            state.error = null;
        });

        builder.addCase(fetchReportResults.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // ------- EXPORTACION -------
        builder.addCase(exportReport.pending, (state) => {
            state.exporting = true;
        });
        builder.addCase(exportReport.fulfilled, (state) => {
            state.exporting = false;
        });
        builder.addCase(exportReport.rejected, (state, action) => {
            state.exporting = false;
            state.error = action.payload as string;
        });
    },
});

export default reportsSlice.reducer;
