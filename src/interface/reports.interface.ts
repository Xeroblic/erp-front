// Para /reports
export interface IReportType {
	key: string; // 'sales', 'stock', 'users', 'movements'
	name: string; // 'Ventas', 'Stock', etc.
	formats: string[]; // ['pdf', 'xlsx']
}

export interface IReportsListResponse {
	data: IReportType[];
}

// ----------------------------
// Filtros dinámicos por tipo
// ----------------------------
export interface IReportFilters {
	date_from?: string;
	date_to?: string;
	customer_id?: number;
	status?: string;
	price_min?: number;
	price_max?: number;
	q?: string;
	branch_id?: number;
	per_page?: number;
	page?: number;
	all?: number;
	raw?: number;
}

// ----------------------------
// Resultados URL /reports/{type}
// ----------------------------
export interface IReportResult<T = unknown> {
	data: T[];
	links: Record<string, string | null>;
	meta: {
		total: number;
		per_page: number;
		current_page: number;
		last_page: number;
	};
}

// ----------------------------
// Exportación
// ----------------------------
export type ReportFormat = 'pdf' | 'xlsx';

export interface IReportExportParams extends IReportFilters {
	format?: ReportFormat;
}
