import { createSlice } from '@reduxjs/toolkit';
import { exportReport, fetchReportResults, fetchPaginatedReportResults, fetchReportTypes } from './reportsThunks';
import { IReportType, IReportResult } from '@/interface/reports.interface';

export interface ReportsState {
	types: IReportType[];
	paginatedResults: IReportResult<unknown> | null;
	aggregatedResults: unknown[] | null;
	loading: boolean;
	exporting: boolean;
	error: string | null;
}

const initialState: ReportsState = {
	types: [],
	paginatedResults: null,
	aggregatedResults: null,
	loading: false,
	exporting: false,
	error: null,
};

export const reportsSlice = createSlice({
	name: 'reports',
	initialState,
	reducers: {
		clearResults: (state) => {
			state.paginatedResults = null;
			state.aggregatedResults = null;
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		// ------- LISTA -------
		builder.addCase(fetchReportTypes.pending, (state) => {
			state.loading = true;
			state.error = null;
		});

		builder.addCase(fetchReportTypes.fulfilled, (state, action) => {
			state.types = action.payload as unknown as IReportType[];
			state.loading = false;
			state.error = null;
		});

		builder.addCase(fetchReportTypes.rejected, (state, action) => {
			state.loading = false;
			state.error = action.payload as string;
		});

		// ------- RESULTADOS AGREGADOS -------
		builder.addCase(fetchReportResults.pending, (state) => {
			state.loading = true;
			state.error = null;
		});

		builder.addCase(fetchReportResults.fulfilled, (state, action) => {
			state.aggregatedResults = action.payload.data as unknown[];
			state.loading = false;
			state.error = null;
		});

		builder.addCase(fetchReportResults.rejected, (state, action) => {
			state.loading = false;
			state.error = action.payload as string;
		});

		// ------- RESULTADOS PAGINADOS -------
		builder.addCase(fetchPaginatedReportResults.pending, (state) => {
			state.loading = true;
			state.error = null;
		});

		builder.addCase(fetchPaginatedReportResults.fulfilled, (state, action) => {
			state.paginatedResults = action.payload as IReportResult<unknown>;
			state.loading = false;
			state.error = null;
		});

		builder.addCase(fetchPaginatedReportResults.rejected, (state, action) => {
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

export const { clearResults } = reportsSlice.actions;
export default reportsSlice.reducer;
