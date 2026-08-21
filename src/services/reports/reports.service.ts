import ApiService from '@/services/ApiService';
import type {
	IReportsListResponse,
	IReportResult,
	IReportFilters,
	IReportExportParams,
} from '@/interface/reports.interface';

export const ReportsService = {
	getTypes(subsidiaryId: number) {
		return ApiService.fetchNormalized<IReportsListResponse>({
			url: `/subsidiaries/${subsidiaryId}/reports`,
			method: 'get',
		});
	},

	getResults(subsidiaryId: number, type: string, filters: IReportFilters = {}) {
		return ApiService.fetchData<IReportResult | any>({
			url: `/subsidiaries/${subsidiaryId}/reports/${type}`,
			method: 'get',
			params: filters,
		}).then((res) => res.data); // Return the raw response data without stripping
	},

	export(subsidiaryId: number, type: string, params: IReportExportParams) {
		return ApiService.fetchData({
			url: `/subsidiaries/${subsidiaryId}/reports/${type}/export`,
			method: 'get',
			params,
			responseType: 'blob',
		});
	},
};
