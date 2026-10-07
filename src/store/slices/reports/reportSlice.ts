import { createSlice } from '@reduxjs/toolkit';
import type {
	TInventoryReportResult,
	TInventoryReportType,
} from '@/interface/inventoryReports.interface';
import { fetchInventoryReport, fetchReportResults, inventoryReportQueryKey } from './reportsThunks';

/**
 * Una consulta de Reportes › Inventario. Va aparte de `loading`/`error`, que
 * comparten Ventas y el dashboard: guarda la clave de quien la pidió
 * (`ownerContext`) y sólo la última petición (`requestId`) puede resolverla,
 * así un cambio de filial, sucursal o pestaña nunca pinta filas del contexto
 * anterior.
 */
interface IInventoryReportSlot {
	ownerContext: string | null;
	requestId: string | null;
	result: TInventoryReportResult | null;
	loading: boolean;
	error: string | null;
}

export interface ReportsState {
	aggregatedResults: unknown[] | null;
	/** Sólo la última consulta de `fetchReportResults` escribe resultados y `loading`. */
	resultsRequestId: string | null;
	/** Una consulta por tipo: Estadísticas lee dos reportes a la vez. */
	inventory: Partial<Record<TInventoryReportType, IInventoryReportSlot>>;
	loading: boolean;
	error: string | null;
}

const initialState: ReportsState = {
	aggregatedResults: null,
	resultsRequestId: null,
	inventory: {},
	loading: false,
	error: null,
};

const reportsSlice = createSlice({
	name: 'reports',
	initialState,
	reducers: {
		clearInventoryReports: (state) => {
			state.inventory = {};
		},
	},
	extraReducers: (builder) => {
		builder.addCase(fetchReportResults.pending, (state, action) => {
			state.resultsRequestId = action.meta.requestId;
			state.loading = true;
			state.error = null;
		});

		builder.addCase(fetchReportResults.fulfilled, (state, action) => {
			if (state.resultsRequestId !== action.meta.requestId) return;
			state.aggregatedResults = action.payload;
			state.loading = false;
			state.error = null;
		});

		// Al cambiar de filtros se aborta la consulta anterior, pero su rechazo
		// llega después del `pending` de la nueva: no debe apagar su `loading`.
		builder.addCase(fetchReportResults.rejected, (state, action) => {
			if (state.resultsRequestId !== action.meta.requestId) return;
			state.loading = false;
			state.error = action.meta.aborted
				? null
				: (action.payload ?? 'No pudimos cargar el reporte.');
		});

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
	},
});

export const { clearInventoryReports } = reportsSlice.actions;
export default reportsSlice.reducer;
