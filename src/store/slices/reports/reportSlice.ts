import { createSlice } from '@reduxjs/toolkit';
import type {
	TInventoryReportResult,
	TInventoryReportType,
} from '@/interface/inventoryReports.interface';
import type { RootState } from '@/store/rootReducer';
import {
	fetchInventoryReport,
	fetchReportResults,
	inventoryReportQueryKey,
	type TSalesResultsConsumer,
} from './reportsThunks';

/**
 * Una consulta de Reportes › Inventario: guarda la clave de quien la pidió
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

/**
 * Resultados de ventas de un consumidor (Inicio o Reportes › Ventas). Cada uno
 * tiene los suyos: antes compartían filas, carga y error, y una pantalla podía
 * mostrar los datos que había pedido la otra. Sólo la última petición
 * (`requestId`) escribe, y las filas valen para la filial que las pidió.
 */
interface ISalesResultsSlot {
	subsidiaryId: number | null;
	requestId: string | null;
	data: Record<string, unknown>[] | null;
	loading: boolean;
	error: string | null;
}

const emptySalesSlot = (): ISalesResultsSlot => ({
	subsidiaryId: null,
	requestId: null,
	data: null,
	loading: false,
	error: null,
});

export interface ReportsState {
	sales: Record<TSalesResultsConsumer, ISalesResultsSlot>;
	/** Una consulta por tipo: Estadísticas lee dos reportes a la vez. */
	inventory: Partial<Record<TInventoryReportType, IInventoryReportSlot>>;
}

const initialState: ReportsState = {
	sales: { dashboard: emptySalesSlot(), sales: emptySalesSlot() },
	inventory: {},
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
			const { consumer, subsidiaryId } = action.meta.arg;
			const slot = state.sales[consumer];
			// Las filas de otra filial no se conservan mientras carga la nueva.
			if (slot.subsidiaryId !== subsidiaryId) slot.data = null;
			slot.subsidiaryId = subsidiaryId;
			slot.requestId = action.meta.requestId;
			slot.loading = true;
			slot.error = null;
		});

		builder.addCase(fetchReportResults.fulfilled, (state, action) => {
			const slot = state.sales[action.meta.arg.consumer];
			if (slot.requestId !== action.meta.requestId) return;
			slot.data = action.payload;
			slot.loading = false;
			slot.error = null;
		});

		// Al cambiar de filtros se aborta la consulta anterior, pero su rechazo
		// llega después del `pending` de la nueva: no debe apagar su `loading`.
		builder.addCase(fetchReportResults.rejected, (state, action) => {
			const slot = state.sales[action.meta.arg.consumer];
			if (slot.requestId !== action.meta.requestId) return;
			slot.loading = false;
			slot.error = action.meta.aborted
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

const EMPTY_SALES_SLOT = emptySalesSlot();

/**
 * Resultados de ventas de un consumidor para la filial vigente. Si el espacio
 * guarda los de otra filial, se devuelve vacío: nunca se muestran ajenos.
 */
export const selectSalesResults = (
	state: RootState,
	consumer: TSalesResultsConsumer,
	subsidiaryId: number | null,
): ISalesResultsSlot => {
	const slot = state.reports.sales[consumer];
	return subsidiaryId !== null && slot.subsidiaryId === subsidiaryId ? slot : EMPTY_SALES_SLOT;
};

export const { clearInventoryReports } = reportsSlice.actions;
export default reportsSlice.reducer;
