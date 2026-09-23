import type {
	IInventoryOperationDetailResponse,
	IInventoryOperationEffect,
	IInventoryOperationItem,
	IInventoryOperationItemOrigin,
	IInventoryOperationMatchParams,
	IInventoryOperationRow,
	IInventoryOperationSource,
	IInventoryOperationsParams,
	IInventoryOperationsResponse,
	TInventoryOperationType,
} from '@/interface/inventoryOperations.interface';
import type {
	IProcurementActorCompact,
	IStockReceipt,
	TStockCondition,
} from '@/interface/procurement.interface';
import type { IInventorySeedOrigin } from '@/mocks/db/inventoryStock.db';
import {
	inventoryMockDelay,
	inventoryMockError,
	paginateInventoryMock,
	readInventoryBranchLedger,
	readInventoryBranchOrigins,
	resolveInventoryStockProduct,
	type IInventoryBranchLedger,
} from '@/services/procurement/inventoryStock.service';
import { readStockReceiptsForTraceability } from '@/services/procurement/stockReceipts.service';

/**
 * Servicio mock de la trazabilidad agrupada — §14 del contrato de
 * abastecimiento (`GET S/inventory-operations` y su detalle). **El endpoint no
 * existe todavía.**
 *
 * No guarda historia propia: la arma con lo que ya tiene el store de
 * `inventoryStock.service` —las procedencias sembradas como punto de partida,
 * y cada recepción, traslado, ajuste y documentación confirmados después— y
 * recalcula los saldos antes/después reproduciéndolos en orden. Así el último
 * «después» de cada ubicación coincide con el stock que muestra Inventario.
 *
 * Las ventas y devoluciones no se simulan en este módulo, así que no aparecen.
 * Tampoco los productos con serie: se siguen por su número de serie.
 */

/**
 * Las procedencias sembradas traen fecha de negocio: se ubican a media mañana
 * en hora local, sin fijar un desfase que el cambio de horario correría.
 */
const seededAt = (businessDate: string, time = '10:00'): string =>
	new Date(`${businessDate}T${time}:00`).toISOString();
/** Momento de las procedencias sembradas sin fecha: el saldo con que parte el historial. */
const OPENING_BALANCE_AT = seededAt('2026-09-01', '08:00');

/**
 * Tipo legado para el saldo inicial. El §14 conserva los tipos legados con su
 * nombre; el mock usa el de los movimientos actuales.
 */
export const OPENING_BALANCE_OPERATION_TYPE = 'initial_balance';

const OPERATION_TYPES: readonly string[] = [
	'stock_receipt',
	'stock_receipt_reversal',
	'sale_fulfillment',
	'sale_return',
	'warehouse_stock_placement',
	'inventory_adjustment',
	'purchase_document_link',
	'initial_stock_document_allocation',
	OPENING_BALANCE_OPERATION_TYPE,
] satisfies readonly (TInventoryOperationType | typeof OPENING_BALANCE_OPERATION_TYPE)[];

/** Operaciones sin efecto físico: cuentan 0 unidades y sus ítems no tienen condición. */
const DOCUMENTARY_TYPES: readonly string[] = [
	'purchase_document_link',
	'initial_stock_document_allocation',
];

/* =================================================
   Borradores: cada fuente del store como operación
   ================================================= */

/** Entrada (positiva) o salida (negativa) de una ubicación, por condición. */
interface IDraftMove {
	warehouse_id: number | null;
	fit: number;
	unfit: number;
}

interface IDraftItem {
	product_id: number;
	condition: TStockCondition | null;
	quantity: number;
	moves: IDraftMove[];
	/** Ubicaciones que la operación toca sin mover unidades (documentales). */
	touched: (number | null)[];
	origins: IInventoryOperationItemOrigin[];
}

interface IDraftOperation {
	id: string;
	operation_type: string;
	title: string;
	occurred_at: string;
	actor: IProcurementActorCompact | null;
	reason: string | null;
	source: IInventoryOperationSource | null;
	reverses_operation_id: string | null;
	items: IDraftItem[];
}

const draft = (
	operation: Omit<IDraftOperation, 'items' | 'actor' | 'reverses_operation_id'> &
		Partial<Pick<IDraftOperation, 'actor' | 'reverses_operation_id'>>,
): IDraftOperation => ({ actor: null, reverses_operation_id: null, ...operation, items: [] });

const itemOf = (
	operation: IDraftOperation,
	productId: number,
	condition: TStockCondition | null,
): IDraftItem => {
	const existing = operation.items.find(
		(item) => item.product_id === productId && item.condition === condition,
	);
	if (existing) return existing;
	const item: IDraftItem = {
		product_id: productId,
		condition,
		quantity: 0,
		moves: [],
		touched: [],
		origins: [],
	};
	operation.items.push(item);
	return item;
};

const addMove = (item: IDraftItem, warehouseId: number | null, fit: number, unfit: number) => {
	const move = item.moves.find((candidate) => candidate.warehouse_id === warehouseId);
	if (move) {
		move.fit += fit;
		move.unfit += unfit;
	} else item.moves.push({ warehouse_id: warehouseId, fit, unfit });
};

/** Entrada de una cantidad en una condición: suma al ítem de esa condición. */
const addEntry = (
	operation: IDraftOperation,
	productId: number,
	warehouseId: number | null,
	condition: TStockCondition,
	quantity: number,
	origin?: Omit<IInventoryOperationItemOrigin, 'quantity'>,
) => {
	if (quantity === 0) return;
	const item = itemOf(operation, productId, condition);
	item.quantity += Math.abs(quantity);
	addMove(
		item,
		warehouseId,
		condition === 'fit' ? quantity : 0,
		condition === 'unfit' ? quantity : 0,
	);
	if (origin) item.origins.push({ ...origin, quantity: Math.abs(quantity) });
};

/**
 * Procedencias sembradas: las que no tienen fecha forman un solo «Saldo
 * inicial»; las demás, una operación por recepción o por día de ajuste.
 */
const seedOperations = (branchId: number, origins: IInventorySeedOrigin[]): IDraftOperation[] => {
	const operations = new Map<string, IDraftOperation>();
	const operationFor = (origin: IInventorySeedOrigin): IDraftOperation => {
		let key: string;
		let create: () => IDraftOperation;
		if (origin.received_on === null) {
			key = 'opening';
			create = () =>
				draft({
					id: `seed-${branchId}-opening`,
					operation_type: OPENING_BALANCE_OPERATION_TYPE,
					title: 'Saldo inicial',
					occurred_at: OPENING_BALANCE_AT,
					reason: 'Stock existente al comenzar el historial',
					source: null,
				});
		} else if (origin.origin_type === 'stock_receipt' && origin.stock_receipt_id !== null) {
			const receiptId = origin.stock_receipt_id;
			const receivedOn = origin.received_on;
			key = `receipt:${receiptId}`;
			create = () =>
				draft({
					id: `seed-${branchId}-receipt-${receiptId}`,
					operation_type: 'stock_receipt',
					title: `Recepción #${receiptId}`,
					occurred_at: seededAt(receivedOn),
					reason: null,
					source: { type: 'stock_receipt', id: receiptId },
				});
		} else {
			const receivedOn = origin.received_on;
			const isAdjustment = origin.origin_type === 'inventory_adjustment';
			key = `${origin.origin_type}:${receivedOn}`;
			create = () =>
				draft({
					id: `seed-${branchId}-${origin.origin_type}-${receivedOn}`,
					operation_type: isAdjustment
						? 'inventory_adjustment'
						: OPENING_BALANCE_OPERATION_TYPE,
					title: isAdjustment ? 'Ajuste de inventario' : 'Saldo inicial',
					occurred_at: seededAt(receivedOn),
					reason: isAdjustment ? 'Ingreso por conteo' : null,
					source: null,
				});
		}
		const existing = operations.get(key);
		if (existing) return existing;
		const created = create();
		operations.set(key, created);
		return created;
	};

	[...origins]
		.sort((a, b) => a.fifo_at - b.fifo_at || a.origin_id - b.origin_id)
		.forEach((origin) => {
			const operation = operationFor(origin);
			const provenance = {
				origin_id: origin.origin_id,
				supplier: origin.supplier,
				purchase_document: origin.purchase_document,
			};
			addEntry(
				operation,
				origin.product_id,
				origin.warehouse_id,
				'fit',
				origin.fit_quantity,
				provenance,
			);
			addEntry(
				operation,
				origin.product_id,
				origin.warehouse_id,
				'unfit',
				origin.unfit_quantity,
				provenance,
			);
		});
	return [...operations.values()];
};

/** Recepciones publicadas en la sucursal y, si se revirtieron, su reversión. */
const receiptOperations = (
	subsidiaryId: number,
	branchId: number,
	ledger: IInventoryBranchLedger,
): IDraftOperation[] => {
	const receipts = new Map<number, IStockReceipt>(
		readStockReceiptsForTraceability(subsidiaryId).map((receipt) => [receipt.id, receipt]),
	);
	const currentOrigins = readInventoryBranchOrigins(branchId);

	return ledger.stockReceiptEffects
		.filter((effect) => effect.subsidiary_id === subsidiaryId)
		.flatMap((effect) => {
			const receiptId = effect.stock_receipt_id;
			const receipt = receipts.get(receiptId);
			const warehouseId = effect.warehouse_id ?? receipt?.warehouse.id ?? null;
			const occurredAt =
				effect.applied_at ??
				receipt?.posted_at ??
				(receipt ? seededAt(receipt.received_on) : OPENING_BALANCE_AT);
			const receiptOperation = draft({
				id:
					receipt?.inventory_operation_id ??
					`receipt-${effect.subsidiary_id}-${receiptId}`,
				operation_type: 'stock_receipt',
				title: `Recepción #${receiptId}`,
				occurred_at: occurredAt,
				actor: receipt?.posted_by ?? null,
				reason: receipt?.reason ?? null,
				source: { type: 'stock_receipt', id: receiptId },
			});
			effect.items.forEach((line) => {
				// La procedencia que creó la recepción, si sigue en la sucursal.
				const origin = currentOrigins
					.filter(
						(candidate) =>
							candidate.origin_type === 'stock_receipt' &&
							candidate.stock_receipt_id === receiptId &&
							candidate.stock_receipt_subsidiary_id === effect.subsidiary_id &&
							candidate.product_id === line.product_id,
					)
					.sort((a, b) => a.origin_id - b.origin_id)[0];
				addEntry(
					receiptOperation,
					line.product_id,
					warehouseId,
					'fit',
					line.quantity,
					origin && {
						origin_id: origin.origin_id,
						supplier: receipt?.supplier ?? origin.supplier,
						purchase_document: receipt?.purchase_document ?? origin.purchase_document,
					},
				);
			});
			if (effect.reversed_at === null) return [receiptOperation];

			const reversal = draft({
				id: receipt?.reversal_operation_id ?? `${receiptOperation.id}-reversal`,
				operation_type: 'stock_receipt_reversal',
				title: `Reversión de la recepción #${receiptId}`,
				occurred_at: effect.reversed_at,
				reason: receipt?.reversal_reason ?? null,
				source: { type: 'stock_receipt', id: receiptId },
				reverses_operation_id: receiptOperation.id,
			});
			// Estado persistido antes de registrar dónde se retiró: se asume la bodega de ingreso.
			const locations =
				effect.reversed_locations ??
				effect.items.map((line) => ({
					product_id: line.product_id,
					warehouse_id: warehouseId,
					fit_quantity: line.quantity,
					unfit_quantity: 0,
				}));
			locations.forEach((location) => {
				addEntry(
					reversal,
					location.product_id,
					location.warehouse_id,
					'fit',
					-location.fit_quantity,
				);
				addEntry(
					reversal,
					location.product_id,
					location.warehouse_id,
					'unfit',
					-location.unfit_quantity,
				);
			});
			return [receiptOperation, reversal];
		});
};

const movementOperations = (ledger: IInventoryBranchLedger): IDraftOperation[] =>
	ledger.movements.map((movement) => {
		const operation = draft({
			id: movement.id,
			operation_type: 'warehouse_stock_placement',
			title: 'Traslado entre ubicaciones',
			occurred_at: movement.created_at,
			reason: movement.reason,
			source: null,
		});
		movement.items.forEach((line) => {
			const item = itemOf(operation, line.product_id, line.condition);
			// Las unidades trasladadas cuentan una vez, aunque salgan de un lado y entren al otro.
			item.quantity += line.quantity;
			const fit = line.condition === 'fit' ? line.quantity : 0;
			const unfit = line.condition === 'unfit' ? line.quantity : 0;
			addMove(item, movement.from_warehouse_id, -fit, -unfit);
			addMove(item, movement.to_warehouse_id, fit, unfit);
		});
		return operation;
	});

const adjustmentOperations = (ledger: IInventoryBranchLedger): IDraftOperation[] =>
	ledger.adjustments.map((adjustment) => {
		const operation = draft({
			id: adjustment.id,
			operation_type: 'inventory_adjustment',
			title: 'Ajuste de inventario',
			occurred_at: adjustment.created_at,
			reason: adjustment.reason,
			source:
				adjustment.related_stock_receipt_id === null
					? null
					: { type: 'stock_receipt', id: adjustment.related_stock_receipt_id },
		});
		adjustment.items.forEach((line) =>
			addEntry(
				operation,
				line.product_id,
				adjustment.warehouse_id,
				line.condition,
				line.quantity_delta,
			),
		);
		return operation;
	});

const allocationOperations = (
	branchId: number,
	ledger: IInventoryBranchLedger,
): IDraftOperation[] =>
	ledger.allocations.map((allocation) => {
		const operation = draft({
			id: `allocation-${branchId}-${allocation.id}`,
			operation_type: 'initial_stock_document_allocation',
			title: 'Documentación de stock inicial',
			occurred_at: allocation.created_at,
			reason: allocation.reason,
			source: { type: 'document_allocation', id: allocation.id },
		});
		const item = itemOf(operation, allocation.product_id, null);
		item.quantity += allocation.quantity;
		if (!item.touched.includes(allocation.warehouse_id))
			item.touched.push(allocation.warehouse_id);
		item.origins.push({
			origin_id: allocation.documented_origin_id,
			quantity: allocation.quantity,
			supplier: allocation.supplier,
			purchase_document: allocation.purchase_document,
		});
		return operation;
	});

/* =================================================
   Reproducción: saldos antes y después
   ================================================= */

interface ILedgerOperation {
	row: IInventoryOperationRow;
	items: Omit<IInventoryOperationItem, 'matches_filter'>[];
}

interface IBalance {
	fit: number;
	unfit: number;
}

const effectOf = (
	branchId: number,
	warehouseId: number | null,
	before: IBalance,
	after: IBalance,
): IInventoryOperationEffect => ({
	branch_id: branchId,
	warehouse_id: warehouseId,
	physical_quantity_delta: after.fit + after.unfit - (before.fit + before.unfit),
	fit_quantity_delta: after.fit - before.fit,
	unfit_quantity_delta: after.unfit - before.unfit,
	physical_quantity_before: before.fit + before.unfit,
	physical_quantity_after: after.fit + after.unfit,
	fit_quantity_before: before.fit,
	fit_quantity_after: after.fit,
	unfit_quantity_before: before.unfit,
	unfit_quantity_after: after.unfit,
});

/**
 * Aplica las operaciones de la más antigua a la más nueva sobre saldos por
 * producto y ubicación. Devuelve el historial de la más nueva a la más
 * antigua (orden del §14: `occurred_at` DESC, ID DESC).
 */
const replay = (
	branchId: number,
	branchName: string | null,
	drafts: IDraftOperation[],
): ILedgerOperation[] => {
	const balances = new Map<string, IBalance>();
	const balanceKey = (productId: number, warehouseId: number | null) =>
		`${productId}:${warehouseId ?? 'unlocated'}`;

	const chronological = drafts
		.map((operation, index) => ({ operation, index }))
		.sort(
			(a, b) =>
				Date.parse(a.operation.occurred_at) - Date.parse(b.operation.occurred_at) ||
				a.index - b.index,
		);

	const ledger = chronological.map(({ operation }): ILedgerOperation => {
		const items = operation.items.flatMap((item) => {
			const product = resolveInventoryStockProduct(item.product_id);
			if (!product || product.serial_tracking) return [];
			const moved = item.moves.map((move) => {
				const key = balanceKey(item.product_id, move.warehouse_id);
				const before = balances.get(key) ?? { fit: 0, unfit: 0 };
				const after = { fit: before.fit + move.fit, unfit: before.unfit + move.unfit };
				balances.set(key, after);
				return effectOf(branchId, move.warehouse_id, before, after);
			});
			const unchanged = item.touched.map((warehouseId) => {
				const balance = balances.get(balanceKey(item.product_id, warehouseId)) ?? {
					fit: 0,
					unfit: 0,
				};
				return effectOf(branchId, warehouseId, balance, balance);
			});
			return [
				{
					product,
					product_id: item.product_id,
					quantity: item.quantity,
					condition: item.condition,
					effects: [...moved, ...unchanged],
					origins: item.origins,
				},
			];
		});
		const documentary = DOCUMENTARY_TYPES.includes(operation.operation_type);
		return {
			row: {
				id: operation.id,
				operation_type: operation.operation_type,
				title: operation.title,
				occurred_at: operation.occurred_at,
				branch: branchName ? { id: branchId, name: branchName } : null,
				actor: operation.actor,
				reason: operation.reason,
				source: operation.source,
				reverses_operation_id: operation.reverses_operation_id,
				summary: {
					products_count: new Set(items.map((item) => item.product_id)).size,
					units_affected: documentary
						? 0
						: items.reduce((total, item) => total + item.quantity, 0),
				},
			},
			items,
		};
	});

	return ledger
		.filter((operation) => operation.items.length > 0)
		.sort(
			(a, b) =>
				Date.parse(b.row.occurred_at) - Date.parse(a.row.occurred_at) ||
				b.row.id.localeCompare(a.row.id),
		);
};

const buildLedger = (
	subsidiaryId: number,
	branchId: number,
	branchName: string | null,
): ILedgerOperation[] => {
	const ledger = readInventoryBranchLedger(branchId);
	return replay(branchId, branchName, [
		...seedOperations(branchId, ledger.seedOrigins),
		...receiptOperations(subsidiaryId, branchId, ledger),
		...movementOperations(ledger),
		...adjustmentOperations(ledger),
		...allocationOperations(branchId, ledger),
	]);
};

/* =================================================
   Filtros
   ================================================= */

const BUSINESS_DATE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (value: number): string => String(value).padStart(2, '0');

/** Fecha de negocio local de un timestamp, para comparar con `occurred_from/to`. */
const localBusinessDate = (timestamp: string): string => {
	const date = new Date(timestamp);
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const normalized = (value: string): string =>
	value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('es');

const includesText = (value: string | null | undefined, search: string): boolean =>
	Boolean(value) && normalized(value ?? '').includes(search);

/** El ítem coincide con la búsqueda: producto, proveedor o folio del documento. */
const itemMatchesSearch = (item: ILedgerOperation['items'][number], search: string): boolean =>
	includesText(item.product.name, search) ||
	includesText(item.product.sku, search) ||
	item.origins.some(
		(origin) =>
			includesText(origin.supplier?.display_name, search) ||
			includesText(origin.supplier?.rut, search) ||
			includesText(origin.purchase_document?.document_number, search),
	);

const itemMatches = (
	operation: ILedgerOperation,
	item: ILedgerOperation['items'][number],
	params: IInventoryOperationMatchParams,
	search: string,
): boolean => {
	if (params.product_id !== undefined && item.product_id !== params.product_id) return false;
	if (
		params.supplier_id !== undefined &&
		!item.origins.some((origin) => origin.supplier?.id === params.supplier_id)
	)
		return false;
	if (
		params.purchase_document_id !== undefined &&
		!item.origins.some((origin) => origin.purchase_document?.id === params.purchase_document_id)
	)
		return false;
	if (
		params.warehouse_id !== undefined &&
		!item.effects.some((effect) => effect.warehouse_id === params.warehouse_id)
	)
		return false;
	if (params.unlocated === 1 && !item.effects.some((effect) => effect.warehouse_id === null))
		return false;
	if (!search) return true;
	// El folio de la operación («Recepción #80») o su motivo coinciden con todos sus ítems.
	return (
		includesText(operation.row.title, search) ||
		includesText(operation.row.reason, search) ||
		itemMatchesSearch(item, search)
	);
};

const validationError = (message: string): Error =>
	inventoryMockError(422, 'INVALID_FILTER', message);

/** Valida el contexto y los filtros como el backend: un valor inválido de un filtro conocido es 422. */
const validate = (subsidiaryId: number, params: IInventoryOperationMatchParams): number => {
	if (!Number.isInteger(subsidiaryId) || subsidiaryId <= 0)
		throw validationError('Selecciona una filial válida.');
	const branchId = params.branch_id;
	// El mock sólo conoce el stock por sucursal: sin sucursal no hay historial que armar.
	if (branchId === undefined || !Number.isInteger(branchId) || branchId <= 0)
		throw validationError('Selecciona una sucursal válida.');
	if (params.operation_type !== undefined && !OPERATION_TYPES.includes(params.operation_type))
		throw validationError('El tipo de operación no es válido.');
	[params.occurred_from, params.occurred_to].forEach((date) => {
		if (date !== undefined && !BUSINESS_DATE.test(date))
			throw validationError('La fecha debe tener formato AAAA-MM-DD.');
	});
	return branchId;
};

const matchesOperation = (
	operation: ILedgerOperation,
	params: IInventoryOperationMatchParams,
	search: string,
): boolean => {
	const { row } = operation;
	if (params.operation_type !== undefined && row.operation_type !== params.operation_type)
		return false;
	const date = localBusinessDate(row.occurred_at);
	if (params.occurred_from !== undefined && date < params.occurred_from) return false;
	if (params.occurred_to !== undefined && date > params.occurred_to) return false;
	return operation.items.some((item) => itemMatches(operation, item, params, search));
};

interface IInventoryOperationsMockOptions {
	signal?: AbortSignal;
	/**
	 * Nombre de la sucursal para `branch`. El backend lo trae; el mock no conoce
	 * nombres de sucursal, así que se lo pasa quien consulta.
	 */
	branchName?: string | null;
}

/* =================================================
   GET S/inventory-operations
   ================================================= */

export const listInventoryOperations = async (
	subsidiaryId: number,
	params: IInventoryOperationsParams,
	{ signal, branchName = null }: IInventoryOperationsMockOptions = {},
): Promise<IInventoryOperationsResponse> => {
	let branchId: number;
	try {
		branchId = validate(subsidiaryId, params);
	} catch (error) {
		return Promise.reject(error);
	}
	const search = normalized(params.search?.trim() ?? '');
	const rows = buildLedger(subsidiaryId, branchId, branchName)
		.filter((operation) => matchesOperation(operation, params, search))
		.map((operation) => operation.row);
	return inventoryMockDelay(
		paginateInventoryMock(
			rows,
			`/api/subsidiaries/${subsidiaryId}/inventory-operations`,
			params,
		),
		signal,
	);
};

/* =================================================
   GET S/inventory-operations/{operation}
   ================================================= */

/**
 * La operación completa, con cada ítem marcado según los mismos filtros de la
 * lista (`matches_filter`): el detalle nunca recorta ítems.
 */
export const getInventoryOperation = async (
	subsidiaryId: number,
	operationId: string,
	params: IInventoryOperationMatchParams,
	{ signal, branchName = null }: IInventoryOperationsMockOptions = {},
): Promise<IInventoryOperationDetailResponse> => {
	let branchId: number;
	try {
		branchId = validate(subsidiaryId, params);
	} catch (error) {
		return Promise.reject(error);
	}
	const operation = buildLedger(subsidiaryId, branchId, branchName).find(
		(candidate) => candidate.row.id === operationId,
	);
	if (!operation)
		return Promise.reject(
			inventoryMockError(
				404,
				'INVENTORY_OPERATION_NOT_FOUND',
				'La operación no existe o no está disponible.',
			),
		);
	const search = normalized(params.search?.trim() ?? '');
	return inventoryMockDelay(
		{
			data: {
				...operation.row,
				items: operation.items.map((item) => ({
					...item,
					matches_filter: itemMatches(operation, item, params, search),
				})),
			},
		},
		signal,
	);
};
