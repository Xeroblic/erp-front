import type { IProcurementProduct } from '@/interface/procurement.interface';
import type {
	IDeadStockReportRow,
	IInventoryReportBranch,
	IInventoryReportParams,
	IInventoryReportProduct,
	IStockHealthReportRow,
	TInventoryReportResult,
	TInventoryReportType,
} from '@/interface/inventoryReports.interface';
import { readInventoryBranchRows } from '@/mocks/services/inventoryOverview.mock';
import {
	inventoryMockDelay,
	inventoryMockError,
	readInventoryBranchOrigins,
} from '@/mocks/services/inventoryStock.mock';

/**
 * Mock de R1 y R3 de Reportes › Inventario (`GET S/reports/{type}`,
 * `docs/inventario-unificado-contrato.md`). **Ninguno existe todavía en el
 * backend.** R2 (reposición) ya no se simula: lee
 * `GET P/replenishment-candidates`.
 *
 * No tiene datos propios: lee el mismo almacén simulado de Inventario (saldos,
 * reservas, umbrales y procedencias), así un ajuste, traslado o recepción
 * simulados se reflejan también acá. Simplificaciones, porque el mock no
 * modela costos ni ventas:
 *
 * - R3 toma como último movimiento la última entrada con fecha; el backend usa
 *   las operaciones del §14, que incluyen las salidas.
 */

type TInventoryReportMockType = Exclude<TInventoryReportType, 'stock'>;

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

/** El contrato usa 90 días por defecto; `0` devuelve todo el stock con su antigüedad. */
const DEAD_STOCK_DEFAULT_DAYS = 90;

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
