import { createAsyncThunk } from "@reduxjs/toolkit";
import { ReportsService } from "@/services/reports/reports.service";
import { IReportExportParams, IReportFilters } from "@/interface/reports.interface";


export const fetchReportTypes = createAsyncThunk(
    "reports/fetchReportTypes",
    async (subsidiaryId: number, thunkAPI) => {
        try {
            const res = await ReportsService.getTypes(subsidiaryId);
            // DEBUG: log response to help trace why types may be empty in UI
            // Remove or guard this in production
            // eslint-disable-next-line no-console
            console.debug('[reports/fetchReportTypes] subsidiaryId=', subsidiaryId, 'response=', res);
            // ReportsService.getTypes uses fetchNormalized which already unwraps `data`.
            // So `res` is expected to be the array of IReportType or the shape returned by the backend.
            // Return `res` directly so reducers receive the unwrapped payload.
            return res as any;
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.warn('[reports/fetchReportTypes] error=', err);
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const fetchReportResults = createAsyncThunk(
    "reports/fetchReportResults",
    async (
        params: {
            subsidiaryId: number;
            type: string;
            filters: IReportFilters;
        },
        thunkAPI
    ) => {
        try {
            // Eliminar per_page de los filtros para obtener todos los datos
            const { per_page, ...filtersWithoutPagination } = params.filters;
            
            // Obtener todas las páginas automáticamente
            const allData: any[] = [];
            let currentPage = 1;
            let lastPage = 1;
            let hasMore = true;
            let consecutiveEmptyPages = 0;

            while (hasMore) {
                const pageFilters = {
                    ...filtersWithoutPagination,
                    per_page: 200, // Máximo permitido por el backend
                    page: currentPage,
                };

                const res = await ReportsService.getResults(
                    params.subsidiaryId,
                    params.type,
                    pageFilters
                );

                // Debug: ver qué devuelve el servicio
                console.log(`[fetchReportResults] Página ${currentPage} - Respuesta completa:`, res);
                console.log(`[fetchReportResults] Página ${currentPage} - Tipo:`, typeof res, 'Es array:', Array.isArray(res));
                
                // fetchNormalized devuelve response.data.data
                // Si el backend responde con { data: { data: [...], meta: {...} } }
                // entonces fetchNormalized devuelve { data: [...], meta: {...} }
                // Pero también podría devolver directamente un array si el backend no envuelve
                let pageData: any[] = [];
                let meta: any = null;

                if (Array.isArray(res)) {
                    // Si es un array directo, usarlo como datos
                    pageData = res;
                    console.log(`[fetchReportResults] Página ${currentPage} - Respuesta es array directo, longitud:`, pageData.length);
                } else if (res && typeof res === 'object') {
                    // Si es un objeto, intentar extraer data y meta
                    pageData = (res as any)?.data || [];
                    meta = (res as any)?.meta || null;
                    console.log(`[fetchReportResults] Página ${currentPage} - Keys:`, Object.keys(res));
                    console.log(`[fetchReportResults] Página ${currentPage} - res.data:`, pageData);
                    console.log(`[fetchReportResults] Página ${currentPage} - res.data es array:`, Array.isArray(pageData));
                    console.log(`[fetchReportResults] Página ${currentPage} - res.data.length:`, Array.isArray(pageData) ? pageData.length : 'N/A');
                    console.log(`[fetchReportResults] Página ${currentPage} - res.meta:`, meta);
                }

                console.log(`[fetchReportResults] Página ${currentPage} - Datos extraídos:`, pageData.length, 'registros');
                if (pageData.length > 0) {
                    console.log(`[fetchReportResults] Página ${currentPage} - Primer registro:`, pageData[0]);
                    console.log(`[fetchReportResults] Página ${currentPage} - Campos del primer registro:`, Object.keys(pageData[0]));
                    consecutiveEmptyPages = 0; // Resetear contador si hay datos
                } else {
                    consecutiveEmptyPages++;
                    console.log(`[fetchReportResults] Página ${currentPage} - Página vacía (${consecutiveEmptyPages} consecutivas)`);
                }
                
                allData.push(...pageData);

                if (meta) {
                    lastPage = meta.last_page || 1;
                    hasMore = currentPage < lastPage;
                    console.log(`[fetchReportResults] Página ${currentPage} - Meta:`, meta, 'hasMore:', hasMore, 'lastPage:', lastPage);
                    if (hasMore) {
                        currentPage++;
                    }
                } else {
                    // Si no hay meta, verificar si hay datos
                    if (pageData.length === 0) {
                        // Si hay 2 páginas vacías consecutivas, asumir que no hay más datos
                        if (consecutiveEmptyPages >= 2) {
                            console.log(`[fetchReportResults] Página ${currentPage} - ${consecutiveEmptyPages} páginas vacías consecutivas, asumiendo fin de datos`);
                            hasMore = false;
                        } else {
                            // Intentar una página más
                            console.log(`[fetchReportResults] Página ${currentPage} - No hay datos ni meta, intentando siguiente página...`);
                            currentPage++;
                        }
                    } else {
                        // Hay datos pero no meta, continuar
                        console.log(`[fetchReportResults] Página ${currentPage} - Hay datos pero no meta, continuando...`);
                        currentPage++;
                    }
                }
            }

            // Debug: verificar datos finales
            console.log(`[fetchReportResults] FINAL - Total de registros acumulados:`, allData.length);
            if (allData.length > 0) {
                console.log(`[fetchReportResults] FINAL - Primer registro:`, allData[0]);
                console.log(`[fetchReportResults] FINAL - Último registro:`, allData[allData.length - 1]);
            }

            // Retornar todos los datos combinados en el formato esperado
            const finalResult = {
                data: allData,
                links: {},
                meta: {
                    total: allData.length,
                    per_page: allData.length,
                    current_page: 1,
                    last_page: 1,
                },
            };
            console.log(`[fetchReportResults] FINAL - Resultado a retornar:`, JSON.stringify(finalResult, null, 2));
            return finalResult;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);


export const exportReport = createAsyncThunk(
    "reports/exportReport",
    async (
        params: {
            subsidiaryId: number;
            type: string;
            exportParams: IReportExportParams;
        },
        thunkAPI
    ) => {
        try {
            const res = await ReportsService.export(
                params.subsidiaryId,
                params.type,
                params.exportParams
            );
            return res; // BLOB
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);