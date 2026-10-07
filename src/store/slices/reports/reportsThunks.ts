import { createAsyncThunk } from '@reduxjs/toolkit';
import { ReportsService } from '@/services/reports/reports.service';
import type { IReportFilters } from '@/interface/reports.interface';
import type { TInventoryReportResult } from '@/interface/inventoryReports.interface';
import {
	getInventoryReport,
	isRecord,
	type IInventoryReportQuery,
} from '@/services/reports/inventoryReports.service';

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

interface IReportResultsRequest {
	subsidiaryId: number;
	type: string;
	filters: IReportFilters;
}

/**
 * Trae todas las páginas del reporte de a `SALES_PAGE_SIZE` (el máximo que
 * acepta el backend) y las devuelve juntas. No se lee `last_page`:
 * una página incompleta o vacía marca el final.
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

			// La lista, un sobre `{ data: [...] }` o un paginador envuelto `{ data: { data: [...] } }`.
			const possibleData =
				isRecord(rawRes) && rawRes.data !== undefined ? rawRes.data : rawRes;
			let pageData: Record<string, unknown>[] = [];
			if (Array.isArray(possibleData)) pageData = possibleData;
			else if (isRecord(possibleData) && Array.isArray(possibleData.data))
				pageData = possibleData.data;

			allData.push(...pageData);
			if (pageData.length < SALES_PAGE_SIZE) break;
			currentPage += 1;
		}

		return allData;
	} catch (error: unknown) {
		return rejectWithValue(reportErrorMessage(error, 'No pudimos cargar el reporte.'));
	}
});
