import { createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsService } from '@/services/reports/reports.service';
import { IReportExportParams, IReportFilters } from '@/interface/reports.interface';
import type { TInventoryReportResult } from '@/interface/inventoryReports.interface';
import {
	getInventoryReport,
	type IInventoryReportQuery,
} from '@/services/reports/inventoryReports.service';

export const fetchReportTypes = createAsyncThunk(
	'reports/fetchReportTypes',
	async (subsidiaryId: number, thunkAPI) => {
		try {
			const res = await ReportsService.getTypes(subsidiaryId);
			return res;
		} catch (err: unknown) {
			const error = err as { response?: { data?: unknown }; message?: string };
			return thunkAPI.rejectWithValue(error.response?.data || error.message);
		}
	},
);

/** Consulta de Reportes › Inventario con la clave de quién la pidió (ZF-12). */
export interface IInventoryReportRequest extends IInventoryReportQuery {
	ownerContext: string;
}

export const inventoryReportQueryKey = (request: IInventoryReportRequest): string =>
	JSON.stringify([
		request.ownerContext,
		request.subsidiaryId,
		request.type,
		request.source,
		request.params.branchId,
		request.params.days ?? null,
		request.branches.map((branch) => branch.id),
	]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const reportErrorMessage = (error: unknown, fallback: string): string => {
	const data = isRecord(error) && isRecord(error.response) ? error.response.data : null;
	return isRecord(data) && typeof data.message === 'string' && data.message.trim() !== ''
		? data.message
		: fallback;
};

export const fetchInventoryReport = createAsyncThunk<
	TInventoryReportResult,
	IInventoryReportRequest,
	{ rejectValue: string }
>('reports/fetchInventoryReport', async (request, { signal, rejectWithValue }) => {
	try {
		return await getInventoryReport(request, signal);
	} catch (error: unknown) {
		return rejectWithValue(reportErrorMessage(error, 'No pudimos cargar el reporte.'));
	}
});

export const fetchReportResults = createAsyncThunk(
	'reports/fetchReportResults',
	async (
		params: {
			subsidiaryId: number;
			type: string;
			filters: IReportFilters;
		},
		thunkAPI,
	) => {
		try {
			const { per_page, ...filtersWithoutPagination } = params.filters;
			const CHUNK_SIZE = 200; // Máximo permitido por tu backend

			let allData: Record<string, unknown>[] = [];
			let currentPage = 1;
			let keepFetching = true;

			while (keepFetching) {
				const pageFilters = {
					...filtersWithoutPagination,
					per_page: CHUNK_SIZE,
					page: currentPage,
				};

				// 1. Petición
				const rawRes = (await ReportsService.getResults(
					params.subsidiaryId,
					params.type,
					pageFilters,
				)) as unknown as Record<string, unknown>;

				// 2. EXTRACCIÓN DE DATA (A prueba de interceptores ladrones)
				// Intentamos sacar .data si es Axios, o usamos rawRes si ya viene limpio.
				const possibleData =
					rawRes && rawRes.data && !Array.isArray(rawRes) ? rawRes.data : rawRes;

				const possibleObj = possibleData as Record<string, unknown>;
				const pageData: Record<string, unknown>[] = Array.isArray(possibleData)
					? (possibleData as Record<string, unknown>[])
					: Array.isArray(possibleObj?.data)
						? (possibleObj.data as Record<string, unknown>[])
						: [];

				if (!Array.isArray(pageData)) {
					break;
				}

				if (pageData.length === 0) {
					// console.log(`⚠️ [Thunk] Página ${currentPage} vacía. Terminamos.`);
					break;
				}

				// 4. ACUMULAR
				allData = [...allData, ...pageData];
				// console.log(`📦 [Thunk] Pag ${currentPage} | Recibidos: ${pageData.length} | Acumulado: ${allData.length}`);

				// 5. LÓGICA "A CIEGAS" (Aquí está la magia)
				// Si pedimos 200 y llegaron menos de 200 (ej: 136), significa que se acabaron los datos.
				// Si llegaron 200 exactos, asumimos que probablemente hay más y pedimos la siguiente.
				if (pageData.length < CHUNK_SIZE) {
					keepFetching = false;
					// console.log('✅ [Thunk] Última página detectada (llegó incompleta).');
				} else {
					// Si llegaron 200, seguimos.
					// RIESGO MINIMO: Si justo el total es múltiplo de 200 (ej: 400), pedirá la pag 3, vendrá vacía y el "if (length===0)" de arriba lo parará.
					currentPage++;
				}
			}

			// 6. RETORNO
			return {
				data: allData,
				meta: {
					total: allData.length, // Calculamos el total real nosotros
					per_page: allData.length,
					current_page: 1,
					last_page: 1,
				},
			};
		} catch (err: unknown) {
			const error = err as { response?: { data?: unknown }; message?: string };
			return thunkAPI.rejectWithValue(error.response?.data || error.message);
		}
	},
);

export const exportReport = createAsyncThunk(
	'reports/exportReport',
	async (
		params: {
			subsidiaryId: number;
			type: string;
			exportParams: IReportExportParams;
		},
		thunkAPI,
	) => {
		try {
			const res = await ReportsService.export(
				params.subsidiaryId,
				params.type,
				params.exportParams,
			);
			return res;
		} catch (err: unknown) {
			const error = err as { response?: { data?: unknown }; message?: string };
			return thunkAPI.rejectWithValue(error.response?.data || error.message);
		}
	},
);
