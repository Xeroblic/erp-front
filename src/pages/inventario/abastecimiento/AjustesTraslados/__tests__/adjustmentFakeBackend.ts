import type {
	IInventoryAdjustableProductsPage,
	IInventoryAdjustment,
	IInventoryAdjustmentPayload,
	IInventoryProductRef,
	IInventoryStockAvailability,
	IInventoryStockListParams,
	IInventoryStockResponse,
	IInventoryStockRow,
	IProcurementProduct,
	IWarehouseCompact,
	TStockCondition,
} from '@/interface/procurement.interface';

/**
 * Backend falso del ajuste para las pruebas: reemplaza las funciones que la
 * fachada expone para el ajuste con datos definidos acá, sin depender del mock
 * de desarrollo (`@/mocks`). Cada prueba parte de `resetAdjustmentFake()`.
 */

const product = (id: number, sku: string, name: string): IProcurementProduct => ({
	id,
	sku,
	commercial_sku: null,
	name,
	short_description: null,
	serial_tracking: false,
	grade: null,
	currency_code: 'CLP',
	price: null,
	offer_price: null,
	cost: null,
	cost_basis: 'unknown',
	brand: null,
	categories: [],
	image: null,
	is_active: true,
});

export const FAKE_ALFA = product(101, 'ALFA-01', 'Producto alfa');
export const FAKE_BETA = product(102, 'BETA-01', 'Producto beta');
export const FAKE_PRODUCTS = [FAKE_ALFA, FAKE_BETA];

export const FAKE_MAIN_WAREHOUSE: IWarehouseCompact = { id: 8, name: 'Bodega principal' };
export const FAKE_SHELF: IWarehouseCompact = { id: 12, name: 'Estante A3' };
const WAREHOUSES = [FAKE_MAIN_WAREHOUSE, FAKE_SHELF];

/** Reservas de la sucursal por producto: 16 de los 17 aptos de beta. */
const RESERVED: Record<number, number> = { [FAKE_BETA.id]: 16 };

interface IBalance {
	fit: number;
	unfit: number;
}

type TLocationKey = number | 'unlocated';

/**
 * - Bodega principal: 100 aptos de alfa.
 * - Estante A3: 4 aptos de alfa.
 * - Sin ubicación: 17 aptos y 2 no aptos de beta; alfa en cero.
 */
const initialBalances = (): Map<string, IBalance> =>
	new Map([
		[`${FAKE_MAIN_WAREHOUSE.id}:${FAKE_ALFA.id}`, { fit: 100, unfit: 0 }],
		[`${FAKE_SHELF.id}:${FAKE_ALFA.id}`, { fit: 4, unfit: 0 }],
		[`unlocated:${FAKE_BETA.id}`, { fit: 17, unfit: 2 }],
	]);

let balances = initialBalances();

export const resetAdjustmentFake = (): void => {
	balances = initialBalances();
};

const locationOf = (params: IInventoryStockListParams): TLocationKey =>
	params.unlocated === 1 ? 'unlocated' : (params.warehouse_id ?? 'unlocated');

const balanceAt = (location: TLocationKey, productId: number): IBalance =>
	balances.get(`${location}:${productId}`) ?? { fit: 0, unfit: 0 };

const rowFor = (location: TLocationKey, item: IProcurementProduct): IInventoryStockRow => {
	const { fit, unfit } = balanceAt(location, item.id);
	return {
		product: item,
		physical_quantity: fit + unfit,
		fit_quantity: fit,
		unfit_quantity: unfit,
		documented_quantity: 0,
		undocumented_quantity: fit + unfit,
	};
};

const listAdjustmentStock = (
	branchId: number,
	params: IInventoryStockListParams = {},
): Promise<IInventoryStockResponse> => {
	const location = locationOf(params);
	const data = FAKE_PRODUCTS.map((item) => rowFor(location, item)).filter(
		(row) => row.physical_quantity > 0,
	);
	return Promise.resolve({
		data,
		links: { first: null, last: null, prev: null, next: null },
		meta: {
			current_page: 1,
			from: data.length ? 1 : null,
			last_page: 1,
			links: [],
			path: '',
			per_page: params.per_page ?? 15,
			to: data.length || null,
			total: data.length,
		},
		context: {
			scope: location === 'unlocated' ? 'unlocated' : 'warehouse',
			branch_id: branchId,
			warehouse: WAREHOUSES.find((warehouse) => warehouse.id === location) ?? null,
		},
	});
};

const searchInventoryAdjustableProducts = (
	_branchId: number,
	_subsidiaryId: number | null,
	location: IInventoryStockListParams,
	search: string,
): Promise<IInventoryAdjustableProductsPage> => {
	const term = search.trim().toLocaleLowerCase();
	const data = FAKE_PRODUCTS.filter(
		(item) =>
			term !== '' &&
			(item.name.toLocaleLowerCase().includes(term) ||
				item.sku.toLocaleLowerCase().includes(term)),
	).map((item) => rowFor(locationOf(location), item));
	return Promise.resolve({ data, has_more: false });
};

const getInventoryAdjustableProduct = (
	_subsidiaryId: number,
	productId: number,
): Promise<IInventoryProductRef | null> => {
	const found = FAKE_PRODUCTS.find((item) => item.id === productId);
	return Promise.resolve(found ? { id: found.id, sku: found.sku, name: found.name } : null);
};

const getAdjustmentWarehouses = (): IWarehouseCompact[] => WAREHOUSES.map((item) => ({ ...item }));

const getAdjustmentStockAvailability = (
	_branchId: number,
	productId: number,
): IInventoryStockAvailability => {
	const totals = [...balances.entries()]
		.filter(([key]) => key.endsWith(`:${productId}`))
		.reduce(
			(sum, [, balance]) => ({
				fit: sum.fit + balance.fit,
				unfit: sum.unfit + balance.unfit,
			}),
			{ fit: 0, unfit: 0 },
		);
	const reserved = RESERVED[productId] ?? 0;
	return {
		product_id: productId,
		physical_quantity: totals.fit + totals.unfit,
		fit_quantity: totals.fit,
		reserved_quantity: reserved,
		available_quantity: totals.fit - reserved,
	};
};

/** Mismo envoltorio que un rechazo de Axios: lo lee `resolveProcurementError`. */
const insufficientStock = (
	itemIndex: number,
	productId: number,
	condition: TStockCondition,
	requested: number,
	available: number,
) =>
	Object.assign(new Error('La ubicación no tiene stock suficiente.'), {
		isAxiosError: true,
		response: {
			status: 409,
			data: {
				message: 'La ubicación no tiene stock suficiente.',
				code: 'INSUFFICIENT_LOCATION_STOCK',
				context: {
					item_index: itemIndex,
					product_id: productId,
					requested,
					available,
					condition,
				},
			},
		},
	});

const createInventoryAdjustment = (
	branchId: number,
	payload: IInventoryAdjustmentPayload,
): Promise<{ data: IInventoryAdjustment }> => {
	const location: TLocationKey = payload.warehouse_id ?? 'unlocated';
	// Todo o nada, como el backend: primero se valida el lote entero.
	const shortageIndex = payload.items.findIndex(
		(item) =>
			item.quantity_delta < 0 &&
			Math.abs(item.quantity_delta) > balanceAt(location, item.product_id)[item.condition],
	);
	const shortage = payload.items[shortageIndex];
	if (shortage)
		return Promise.reject(
			insufficientStock(
				shortageIndex,
				shortage.product_id,
				shortage.condition,
				Math.abs(shortage.quantity_delta),
				balanceAt(location, shortage.product_id)[shortage.condition],
			),
		);
	const items = payload.items.map((item) => {
		const before = balanceAt(location, item.product_id);
		const after = { ...before, [item.condition]: before[item.condition] + item.quantity_delta };
		balances.set(`${location}:${item.product_id}`, after);
		return {
			product_id: item.product_id,
			quantity_delta: item.quantity_delta,
			condition: item.condition,
			physical_quantity_before: before.fit + before.unfit,
			physical_quantity_after: after.fit + after.unfit,
			fit_quantity_before: before.fit,
			fit_quantity_after: after.fit,
			unfit_quantity_before: before.unfit,
			unfit_quantity_after: after.unfit,
		};
	});
	return Promise.resolve({
		data: {
			id: 'ajuste-de-prueba',
			operation_type: 'inventory_adjustment',
			branch_id: branchId,
			warehouse_id: payload.warehouse_id,
			reason: payload.reason,
			related_stock_receipt_id: null,
			items,
		},
	});
};

/** Funciones de la fachada que reemplaza: se esparcen sobre el módulo real. */
export const adjustmentFakeService = {
	listAdjustmentWarehouses: () =>
		Promise.resolve(WAREHOUSES.map((warehouse) => ({ ...warehouse, is_active: true }))),
	listAdjustmentStock,
	searchInventoryAdjustableProducts,
	getInventoryAdjustableProduct,
	getAdjustmentWarehouses,
	getAdjustmentStockAvailability,
	createInventoryAdjustment,
};
