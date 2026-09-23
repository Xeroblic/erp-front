import type { TCriticalStockStatus } from '@/interface/inventoryOverview.interface';
import type { IPurchaseDocumentCompact, ISupplierCompact } from '@/interface/procurement.interface';
import type {
	IDeadStockReportRow,
	IInventoryReportBranch,
	IInventoryReportParams,
	IInventoryReportProduct,
	IReplenishmentLastPurchase,
	IReplenishmentReportRow,
	IStockHealthReportRow,
	IStockReportRow,
	TInventoryReportResult,
	TInventoryReportSource,
	TInventoryReportType,
	TReplenishmentStatus,
} from '@/interface/inventoryReports.interface';
import type { IReportFilters } from '@/interface/reports.interface';
import { ReportsService } from '@/services/reports/reports.service';
import { getInventoryReportMock } from '@/services/reports/inventoryReportsMock.service';

/* =================================================
   Lectura defensiva del cuerpo (forma desconocida)
   ================================================= */

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/** Filas del cuerpo: paginador de Laravel o sobre `{ data }`; ambos traen `data[]`. */
export const reportRowsOf = (body: unknown): unknown[] => {
	if (Array.isArray(body)) return body;
	if (isRecord(body) && Array.isArray(body.data)) return body.data;
	return [];
};

const numberOf = (value: unknown): number | null => {
	let parsed = Number.NaN;
	if (typeof value === 'number') parsed = value;
	else if (typeof value === 'string' && value.trim() !== '') parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

const stringOf = (value: unknown): string | null => (typeof value === 'string' ? value : null);

const isOneOf = <T extends string>(value: unknown, options: readonly T[]): value is T =>
	options.some((option) => option === value);

const oneOf = <T extends string>(value: unknown, options: readonly T[]): T | null =>
	isOneOf(value, options) ? value : null;

const compact = <T>(items: (T | null)[]): T[] => items.filter((item): item is T => item !== null);

const CRITICAL_STATUSES: readonly TCriticalStockStatus[] = ['critical', 'healthy', 'unconfigured'];
const REPLENISHMENT_STATUSES: readonly TReplenishmentStatus[] = [
	'suggested',
	'without_supplier_history',
	'no_active_suppliers',
	'no_comparable_cost',
];

const productOf = (value: unknown): IInventoryReportProduct | null => {
	if (!isRecord(value)) return null;
	const id = numberOf(value.id);
	const sku = stringOf(value.sku);
	const name = stringOf(value.name);
	return id !== null && sku !== null && name !== null ? { id, sku, name } : null;
};

const branchOf = (value: unknown): IInventoryReportBranch | null => {
	if (!isRecord(value)) return null;
	const id = numberOf(value.id);
	const name = stringOf(value.name);
	return id !== null && name !== null ? { id, name } : null;
};

const supplierOf = (value: unknown): ISupplierCompact | null => {
	if (!isRecord(value)) return null;
	const id = numberOf(value.id);
	const displayName = stringOf(value.display_name);
	if (id === null || displayName === null) return null;
	return {
		id,
		display_name: displayName,
		rut: stringOf(value.rut) ?? '',
		is_active: value.is_active !== false,
	};
};

const purchaseDocumentOf = (value: unknown): IPurchaseDocumentCompact | null => {
	if (!isRecord(value)) return null;
	const id = numberOf(value.id);
	const documentType = oneOf(value.document_type, ['invoice', 'receipt'] as const);
	const documentNumber = stringOf(value.document_number);
	const issueDate = stringOf(value.issue_date);
	return id !== null && documentType !== null && documentNumber !== null && issueDate !== null
		? {
				id,
				document_type: documentType,
				document_number: documentNumber,
				issue_date: issueDate,
			}
		: null;
};

const lastPurchaseOf = (value: unknown): IReplenishmentLastPurchase | null => {
	if (!isRecord(value)) return null;
	const receivedOn = stringOf(value.received_on);
	if (receivedOn === null) return null;
	return {
		received_on: receivedOn,
		days_since_purchase: numberOf(value.days_since_purchase) ?? 0,
		quantity: numberOf(value.quantity) ?? 0,
		purchase_document: purchaseDocumentOf(value.purchase_document),
	};
};

/* =================================================
   Filas por tipo
   ================================================= */

const stockRowOf = (value: unknown): IStockReportRow | null => {
	if (!isRecord(value)) return null;
	const sku = stringOf(value.sku);
	const productName = stringOf(value.product_name);
	const quantity = numberOf(value.quantity);
	if (sku === null || productName === null || quantity === null) return null;
	return {
		sku,
		product_name: productName,
		branch_name: stringOf(value.branch_name),
		quantity,
		updated_at: stringOf(value.updated_at),
	};
};

const stockHealthRowOf = (value: unknown): IStockHealthReportRow | null => {
	if (!isRecord(value)) return null;
	const product = productOf(value.product);
	const branch = branchOf(value.branch);
	const physical = numberOf(value.physical_quantity);
	const available = numberOf(value.available_quantity);
	const status = oneOf(value.status, CRITICAL_STATUSES);
	if (!product || !branch || physical === null || available === null || status === null)
		return null;
	return {
		product,
		branch,
		physical_quantity: physical,
		available_quantity: available,
		threshold: numberOf(value.threshold),
		status,
	};
};

const replenishmentRowOf = (value: unknown): IReplenishmentReportRow | null => {
	if (!isRecord(value) || !isRecord(value.stock) || !isRecord(value.recommendation)) return null;
	const product = productOf(value.product);
	const { stock, recommendation } = value;
	const available = numberOf(stock.available_quantity);
	const status = oneOf(recommendation.status, REPLENISHMENT_STATUSES);
	if (!product || available === null || status === null) return null;
	return {
		product,
		stock: {
			physical_quantity: numberOf(stock.physical_quantity) ?? 0,
			available_quantity: available,
			threshold: numberOf(stock.threshold),
			status: oneOf(stock.status, CRITICAL_STATUSES) ?? 'critical',
		},
		recommendation: {
			status,
			historical_supplier_count: numberOf(recommendation.historical_supplier_count) ?? 0,
			eligible_supplier_count: numberOf(recommendation.eligible_supplier_count) ?? 0,
			supplier: supplierOf(recommendation.supplier),
			last_purchase: lastPurchaseOf(recommendation.last_purchase),
		},
	};
};

const deadStockRowOf = (value: unknown): IDeadStockReportRow | null => {
	if (!isRecord(value)) return null;
	const product = productOf(value.product);
	const branch = branchOf(value.branch);
	const physical = numberOf(value.physical_quantity);
	if (!product || !branch || physical === null) return null;
	return {
		product,
		branch,
		physical_quantity: physical,
		last_operation_at: stringOf(value.last_operation_at),
		days_without_movement: numberOf(value.days_without_movement),
	};
};

/** Filas del backend → filas tipadas. Una fila que no se puede leer se descarta. */
export const parseInventoryReport = (
	type: TInventoryReportType,
	rows: unknown[],
): TInventoryReportResult => {
	if (type === 'stock') return { type, rows: compact(rows.map(stockRowOf)) };
	if (type === 'stock_health') return { type, rows: compact(rows.map(stockHealthRowOf)) };
	if (type === 'replenishment') return { type, rows: compact(rows.map(replenishmentRowOf)) };
	return { type, rows: compact(rows.map(deadStockRowOf)) };
};

/* =================================================
   Consulta
   ================================================= */

export interface IInventoryReportQuery {
	subsidiaryId: number;
	type: TInventoryReportType;
	source: TInventoryReportSource;
	params: IInventoryReportParams;
	/** Sucursales de la filial. Sólo las usa el mock; el backend las resuelve por la filial. */
	branches: IInventoryReportBranch[];
}

/**
 * Reporte completo (`per_page=all`): el backend arma todas las filas antes de
 * paginar, así que pedirlas de una vez no le cuesta más y permite totales,
 * orden y búsqueda correctos sobre todo el reporte.
 */
export const getInventoryReport = async (
	{ subsidiaryId, type, source, params, branches }: IInventoryReportQuery,
	signal?: AbortSignal,
): Promise<TInventoryReportResult> => {
	if (source === 'mock') {
		if (type === 'stock') throw new Error('Existencias no tiene datos simulados.');
		return getInventoryReportMock(type, params, branches, signal);
	}
	const filters: IReportFilters = { per_page: 'all' };
	if (params.branchId !== null) filters.branch_id = params.branchId;
	if (params.days !== undefined) filters.days = params.days;
	const body = await ReportsService.getResults(subsidiaryId, type, filters, signal);
	return parseInventoryReport(type, reportRowsOf(body));
};
