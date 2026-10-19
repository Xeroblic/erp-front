import { createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsService } from '@/services/reports/reports.service';
import type { IReportFilters } from '@/interface/reports.interface';
import type { TInventoryReportResult } from '@/interface/inventoryReports.interface';
import {
	getInventoryReport,
	type IInventoryReportQuery,
} from '@/services/reports/inventoryReports.service';
import { isRecord } from '@/utils/isRecord.util';

/** Consulta de Reportes › Inventario con la clave de quién la pidió. */
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

const SALES_PAGE_SIZE = 200;

/** Quién pidió los resultados: Inicio y Reportes › Ventas guardan los suyos por separado. */
export type TSalesResultsConsumer = 'dashboard' | 'sales';

export interface IReportResultsRequest {
	consumer: TSalesResultsConsumer;
	subsidiaryId: number;
	type: string;
	filters: IReportFilters;
}

/** Filas de una página: la lista, un sobre `{ data: [...] }` o un paginador envuelto. */
const pageRowsOf = (body: unknown): Record<string, unknown>[] => {
	const possibleData = isRecord(body) && body.data !== undefined ? body.data : body;
	if (Array.isArray(possibleData)) return possibleData.filter(isRecord);
	if (isRecord(possibleData) && Array.isArray(possibleData.data))
		return possibleData.data.filter(isRecord);
	return [];
};

/** `last_page` del paginador de Laravel, en la raíz o envuelto en `data`; `null` si no viene. */
const lastPageOf = (body: unknown): number | null => {
	const candidates = [
		body,
		isRecord(body) ? body.data : undefined,
		isRecord(body) ? body.meta : undefined,
	];
	const found = candidates.find(
		(candidate) => isRecord(candidate) && typeof candidate.last_page === 'number',
	);
	return isRecord(found) && typeof found.last_page === 'number' ? found.last_page : null;
};

/**
 * Trae todas las páginas del reporte de a `SALES_PAGE_SIZE` (el máximo que
 * acepta el backend) y las devuelve juntas. Se detiene en `last_page` cuando la
 * respuesta lo trae; si no, una página incompleta o vacía marca el final.
 */
export const fetchReportResults = createAsyncThunk<
	Record<string, unknown>[],
	IReportResultsRequest,
	{ rejectValue: string }
>('reports/fetchReportResults', async (params, { signal, rejectWithValue }) => {
	try {
		const allData: Record<string, unknown>[] = [];
		let currentPage = 1;

		for (;;) {
			const rawRes: unknown = await ReportsService.getResults(
				params.subsidiaryId,
				params.type,
				{ ...params.filters, per_page: SALES_PAGE_SIZE, page: currentPage },
				signal,
			);

			const pageData = pageRowsOf(rawRes);
			allData.push(...pageData);

			const lastPage = lastPageOf(rawRes);
			const isLastPage =
				lastPage !== null ? currentPage >= lastPage : pageData.length < SALES_PAGE_SIZE;
			if (isLastPage) break;
			currentPage += 1;
		}

		return allData;
	} catch (error: unknown) {
		return rejectWithValue(reportErrorMessage(error, 'No pudimos cargar el reporte.'));
	}
});
