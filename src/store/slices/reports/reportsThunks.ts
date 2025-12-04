import { createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsService } from '@/services/reports/reports.service';
import { IReportExportParams, IReportFilters } from '@/interface/reports.interface';

export const fetchReportTypes = createAsyncThunk(
	'reports/fetchReportTypes',
	async (subsidiaryId: number, thunkAPI) => {
		try {
			const res = await ReportsService.getTypes(subsidiaryId);
			return res as any;
		} catch (err: any) {
			return thunkAPI.rejectWithValue(err.response?.data || err.message);
		}
	},
);

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

			let allData: any[] = [];
			let currentPage = 1;
			let keepFetching = true;

			while (keepFetching) {
				const pageFilters = {
					...filtersWithoutPagination,
					per_page: CHUNK_SIZE,
					page: currentPage,
				};

				// 1. Petición
				const rawRes: any = await ReportsService.getResults(
					params.subsidiaryId,
					params.type,
					pageFilters,
				);

				// 2. EXTRACCIÓN DE DATA (A prueba de interceptores ladrones)
				// Intentamos sacar .data si es Axios, o usamos rawRes si ya viene limpio.
				const possibleData =
					rawRes && rawRes.data && !Array.isArray(rawRes) ? rawRes.data : rawRes;

				// Si el servicio ya devolvió el array dentro de 'data' (paginación de Laravel), lo sacamos.
				// Si el servicio devolvió el array directo (interceptor), lo usamos.
				const pageData = Array.isArray(possibleData)
					? possibleData
					: Array.isArray(possibleData?.data)
						? possibleData.data
						: [];

				// 3. VALIDACIÓN DE SEGURIDAD
				if (!Array.isArray(pageData)) {
					// console.error("❌ [Thunk] Formato desconocido:", rawRes);
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
		} catch (err: any) {
			// console.error("❌ [Thunk] Error crítico:", err);
			return thunkAPI.rejectWithValue(err.response?.data || err.message);
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
		} catch (err: any) {
			return thunkAPI.rejectWithValue(err.response?.data || err.message);
		}
	},
);
