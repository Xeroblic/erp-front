import type { IProcurementProduct, ISupplierCompact } from '@/interface/procurement.interface';
import type {
	IDeadStockReportRow,
	IInventoryReportBranch,
	IInventoryReportParams,
	IInventoryReportProduct,
	IReplenishmentLastPurchase,
	IReplenishmentReportRow,
	IStockHealthReportRow,
	TInventoryReportResult,
	TInventoryReportType,
} from '@/interface/inventoryReports.interface';
import type { IInventorySeedOrigin } from '@/mocks/db/inventoryStock.db';
import {
	getInventoryCriticalThreshold,
	readInventoryBranchRows,
} from '@/services/procurement/inventoryOverview.service';
import {
	inventoryMockDelay,
	inventoryMockError,
	readInventoryBranchOrigins,
} from '@/services/procurement/inventoryStock.service';

/**
 * Mock de R1–R3 de Reportes › Inventario (`GET S/reports/{type}`,
 * `docs/inventario-unificado-contrato.md`). **Ninguno existe todavía en el
 * backend.**
 *
 * No tiene datos propios: lee el mismo almacén simulado de Inventario (saldos,
 * reservas, umbrales y procedencias), así un ajuste, traslado o recepción
 * simulados se reflejan también acá. Simplificaciones, porque el mock no
 * modela costos ni ventas:
 *
 * - R2 sugiere el proveedor activo de la compra más reciente; el backend
 *   compara el costo efectivo (§12) y puede responder `no_comparable_cost`.
 * - R3 toma como último movimiento la última entrada con fecha; el backend usa
 *   las operaciones del §14, que incluyen las salidas.
 */

export type TInventoryReportMockType = Exclude<TInventoryReportType, 'stock'>;

const DAY_MS = 86_400_000;

/** Días enteros entre una fecha de negocio (`YYYY-MM-DD`) y hoy, en la zona local. */
export const daysSinceBusinessDate = (date: string, today: Date): number => {
	const [year, month, day] = date.split('-').map(Number);
	const start = Date.UTC(year, month - 1, day);
	const end = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
	return Math.max(0, Math.floor((end - start) / DAY_MS));
};

const productRef = ({ id, sku, name }: IProcurementProduct): IInventoryReportProduct => ({
	id,
	sku,
	name,
});

const branchesInScope = (
	branches: IInventoryReportBranch[],
	branchId: number | null,
): IInventoryReportBranch[] => {
	if (branchId === null) return branches;
	const branch = branches.find((item) => item.id === branchId);
	if (!branch)
		throw inventoryMockError(
			422,
			'INVALID_FILTER',
			'La sucursal no pertenece a la empresa seleccionada.',
		);
	return [branch];
};

/* =================================================
   R1 · stock_health
   ================================================= */

const stockHealthRows = (branches: IInventoryReportBranch[]): IStockHealthReportRow[] =>
	branches.flatMap((branch) =>
		readInventoryBranchRows(branch.id).flatMap((row): IStockHealthReportRow[] => {
			const critical = row.critical_stock;
			// Con serie no hay umbral (§13): no entran al reporte.
			if (!critical) return [];
			return [
				{
					product: productRef(row.product),
					branch,
					physical_quantity: critical.physical_quantity,
					available_quantity: critical.available_quantity,
					threshold: critical.threshold,
					status: critical.status,
				},
			];
		}),
	);

/* =================================================
   R2 · replenishment
   ================================================= */

type TPurchaseOrigin = IInventorySeedOrigin & { supplier: ISupplierCompact; received_on: string };

/** Compras: recepciones con proveedor y fecha. El conteo inicial no cuenta (§12). */
const isPurchase = (origin: IInventorySeedOrigin): origin is TPurchaseOrigin =>
	origin.origin_type === 'stock_receipt' &&
	origin.supplier !== null &&
	origin.received_on !== null;

const latestFirst = (a: TPurchaseOrigin, b: TPurchaseOrigin): number =>
	b.received_on.localeCompare(a.received_on) ||
	(b.stock_receipt_id ?? 0) - (a.stock_receipt_id ?? 0);

const lastPurchaseOf = (
	purchase: TPurchaseOrigin,
	purchases: TPurchaseOrigin[],
	today: Date,
): IReplenishmentLastPurchase => ({
	received_on: purchase.received_on,
	days_since_purchase: daysSinceBusinessDate(purchase.received_on, today),
	// Una recepción puede haber quedado repartida en varias ubicaciones.
	quantity: purchases
		.filter((item) => item.stock_receipt_id === purchase.stock_receipt_id)
		.reduce((total, item) => total + item.physical_quantity, 0),
	purchase_document: purchase.purchase_document,
});

const recommendationFor = (
	purchases: TPurchaseOrigin[],
	today: Date,
): IReplenishmentReportRow['recommendation'] => {
	const suppliers = new Map(purchases.map((item) => [item.supplier.id, item.supplier]));
	const eligible = [...suppliers.values()].filter((supplier) => supplier.is_active);
	const base = {
		historical_supplier_count: suppliers.size,
		eligible_supplier_count: eligible.length,
	};
	if (purchases.length === 0)
		return {
			...base,
			status: 'without_supplier_history',
			supplier: null,
			last_purchase: null,
		};
	const suggested = purchases.find((item) => item.supplier.is_active);
	if (!suggested)
		return {
			...base,
			status: 'no_active_suppliers',
			supplier: null,
			last_purchase: lastPurchaseOf(purchases[0], purchases, today),
		};
	return {
		...base,
		status: 'suggested',
		supplier: suggested.supplier,
		last_purchase: lastPurchaseOf(suggested, purchases, today),
	};
};

/**
 * Sólo productos bajo el umbral, con el disponible sumado en las sucursales
 * del alcance. Orden del contrato: disponible ascendente y luego producto.
 */
const replenishmentRows = (
	branches: IInventoryReportBranch[],
	today: Date,
): IReplenishmentReportRow[] => {
	const totals = new Map<
		number,
		{ product: IProcurementProduct; physical: number; available: number }
	>();
	branches.forEach((branch) =>
		readInventoryBranchRows(branch.id).forEach((row) => {
			if (!row.critical_stock) return;
			const current = totals.get(row.product.id) ?? {
				product: row.product,
				physical: 0,
				available: 0,
			};
			current.physical += row.critical_stock.physical_quantity;
			current.available += row.critical_stock.available_quantity;
			totals.set(row.product.id, current);
		}),
	);
	const origins = branches.flatMap((branch) => readInventoryBranchOrigins(branch.id));

	const rows: IReplenishmentReportRow[] = [];
	totals.forEach(({ product, physical, available }) => {
		const threshold = getInventoryCriticalThreshold(product.id);
		if (threshold === null || available > threshold) return;
		const purchases = origins
			.filter(isPurchase)
			.filter((origin) => origin.product_id === product.id)
			.sort(latestFirst);
		rows.push({
			product: productRef(product),
			stock: {
				physical_quantity: physical,
				available_quantity: available,
				threshold,
				status: 'critical',
			},
			recommendation: recommendationFor(purchases, today),
		});
	});
	return rows.sort(
		(a, b) =>
			a.stock.available_quantity - b.stock.available_quantity || a.product.id - b.product.id,
	);
};

/* =================================================
   R3 · dead_stock
   ================================================= */

/** El contrato usa 90 días por defecto; `0` devuelve todo el stock con su antigüedad. */
export const DEAD_STOCK_DEFAULT_DAYS = 90;

const deadStockRows = (
	branches: IInventoryReportBranch[],
	days: number,
	today: Date,
): IDeadStockReportRow[] =>
	branches.flatMap((branch) => {
		const origins = readInventoryBranchOrigins(branch.id);
		return readInventoryBranchRows(branch.id).flatMap((row): IDeadStockReportRow[] => {
			const last =
				origins
					.filter((origin) => origin.product_id === row.product.id)
					.map((origin) => origin.received_on)
					.filter((date): date is string => date !== null)
					.sort()
					.at(-1) ?? null;
			const elapsed = last === null ? null : daysSinceBusinessDate(last, today);
			// Sin fecha no se puede demostrar que se movió: entra siempre.
			if (elapsed !== null && elapsed < days) return [];
			return [
				{
					product: productRef(row.product),
					branch,
					physical_quantity: row.physical_quantity,
					last_operation_at: last,
					days_without_movement: elapsed,
				},
			];
		});
	});

/* =================================================
   GET S/reports/{type}
   ================================================= */

/**
 * `branches` son las sucursales de la filial: el mock no las conoce y las
 * recibe de quien llama; el backend real las resuelve por la filial.
 */
export const getInventoryReportMock = async (
	type: TInventoryReportMockType,
	params: IInventoryReportParams,
	branches: IInventoryReportBranch[],
	signal?: AbortSignal,
): Promise<TInventoryReportResult> => {
	let result: TInventoryReportResult;
	try {
		const scope = branchesInScope(branches, params.branchId);
		const today = new Date();
		if (type === 'stock_health') result = { type, rows: stockHealthRows(scope) };
		else if (type === 'replenishment') result = { type, rows: replenishmentRows(scope, today) };
		else
			result = {
				type,
				rows: deadStockRows(scope, params.days ?? DEAD_STOCK_DEFAULT_DAYS, today),
			};
	} catch (error) {
		return Promise.reject(error);
	}
	return inventoryMockDelay(result, signal);
};
