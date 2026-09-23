import { createSlice } from '@reduxjs/toolkit';
import { IReportType } from '@/interface/reports.interface';
import type {
	TInventoryReportResult,
	TInventoryReportType,
} from '@/interface/inventoryReports.interface';
import {
	exportReport,
	fetchInventoryReport,
	fetchReportResults,
	fetchReportTypes,
	inventoryReportQueryKey,
} from './reportsThunks';

/**
 * Una consulta de Reportes › Inventario. Va aparte de `loading`/`error`, que
 * comparten Ventas y el dashboard: guarda la clave de quien la pidió
 * (`ownerContext`) y sólo la última petición (`requestId`) puede resolverla,
 * así un cambio de filial, sucursal o pestaña nunca pinta filas del contexto
 * anterior (ZF-12).
 */
export interface IInventoryReportSlot {
	ownerContext: string | null;
	requestId: string | null;
	result: TInventoryReportResult | null;
	loading: boolean;
	error: string | null;
}

export interface ReportsState {
	types: IReportType[];
	aggregatedResults: unknown[] | null;
	/** Una consulta por tipo: Estadísticas lee dos reportes a la vez. */
	inventory: Partial<Record<TInventoryReportType, IInventoryReportSlot>>;
	loading: boolean;
	exporting: boolean;
	error: string | null;
}

const initialState: ReportsState = {
	types: [],
	aggregatedResults: null,
	inventory: {},
	loading: false,
	exporting: false,
	error: null,
};

export const reportsSlice = createSlice({
	name: 'reports',
	initialState,
	reducers: {
		clearResults: (state) => {
			state.aggregatedResults = null;
			state.error = null;
		},
		clearInventoryReports: (state) => {
			state.inventory = {};
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

		// ------- REPORTES › INVENTARIO -------
		builder.addCase(fetchInventoryReport.pending, (state, action) => {
			state.inventory[action.meta.arg.type] = {
				ownerContext: inventoryReportQueryKey(action.meta.arg),
				requestId: action.meta.requestId,
				result: null,
				loading: true,
				error: null,
			};
		});

		builder.addCase(fetchInventoryReport.fulfilled, (state, action) => {
			const slot = state.inventory[action.meta.arg.type];
			if (!slot || slot.requestId !== action.meta.requestId) return;
			slot.result = action.payload;
			slot.loading = false;
		});

		builder.addCase(fetchInventoryReport.rejected, (state, action) => {
			const slot = state.inventory[action.meta.arg.type];
			if (!slot || slot.requestId !== action.meta.requestId) return;
			slot.loading = false;
			// Un abort no es un error que mostrar.
			slot.error = action.meta.aborted
				? null
				: (action.payload ?? 'No pudimos cargar el reporte.');
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

export const { clearResults, clearInventoryReports } = reportsSlice.actions;
export default reportsSlice.reducer;
