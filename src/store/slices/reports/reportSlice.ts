import { createSlice } from "@reduxjs/toolkit";
import { exportReport, fetchReportResults, fetchReportTypes } from "./reportsThunks";
import { IReportType } from "@/interface/reports.interface";

export interface ReportsState {
    types: IReportType[];
    results: unknown[] | null;
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
        });

        builder.addCase(fetchReportTypes.fulfilled, (state, action) => {
            state.types = action.payload as IReportType[];
            state.loading = false;
        });

        builder.addCase(fetchReportTypes.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // ------- RESULTADOS -------
        builder.addCase(fetchReportResults.pending, (state) => {
            state.loading = true;
        });

        builder.addCase(fetchReportResults.fulfilled, (state, action) => {
            state.results = action.payload as unknown[];
            state.loading = false;
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
