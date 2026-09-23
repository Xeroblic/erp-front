import ApiService from '@/services/ApiService';
import type {
	IReportsListResponse,
	IReportFilters,
	IReportExportParams,
	IReportDownload,
} from '@/interface/reports.interface';

/** Nombre del archivo en `Content-Disposition` (`filename*=UTF-8''…` o `filename="…"`). */
export const reportFileNameFrom = (disposition: unknown): string | null => {
	if (typeof disposition !== 'string') return null;
	const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
	const quotedName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
	try {
		return encodedName ? decodeURIComponent(encodedName) : (quotedName ?? null);
	} catch {
		return encodedName ?? quotedName ?? null;
	}
};

export const ReportsService = {
	getTypes(subsidiaryId: number) {
		return ApiService.fetchNormalized<IReportsListResponse>({
			url: `/subsidiaries/${subsidiaryId}/reports`,
			method: 'get',
		});
	},

	/**
	 * Cuerpo crudo de la respuesta: según el tipo llega el paginador de Laravel
	 * (`current_page` en la raíz) o el sobre `{ data, meta }`. Quien lo consume
	 * decide cómo leerlo.
	 */
	getResults(
		subsidiaryId: number,
		type: string,
		filters: IReportFilters = {},
		signal?: AbortSignal,
	): Promise<unknown> {
		return ApiService.fetchData<unknown>({
			url: `/subsidiaries/${subsidiaryId}/reports/${type}`,
			method: 'get',
			params: filters,
			signal,
		}).then((res) => res.data);
	},

	async export(
		subsidiaryId: number,
		type: string,
		params: IReportExportParams,
		signal?: AbortSignal,
	): Promise<IReportDownload> {
		const response = await ApiService.fetchData<Blob>({
			url: `/subsidiaries/${subsidiaryId}/reports/${type}/export`,
			method: 'get',
			params,
			responseType: 'blob',
			signal,
		});
		return {
			blob: response.data,
			fileName: reportFileNameFrom(response.headers?.['content-disposition']),
		};
	},
};
