import type {
	IApiPaginationLinks,
	IApiPaginationMeta,
	IInventoryLocationContext,
	IInventoryOriginsParams,
	IInventoryOriginsResponse,
	IInventoryStockListParams,
	IInventoryStockResponse,
	IInventoryStockRow,
	IPurchaseDocumentCompact,
	ISupplierCompact,
	IWarehouseCompact,
} from '@/interface/procurement.interface';
import {
	inventoryOriginFilterOptions,
	inventoryOrigins,
	inventoryStockRows,
	inventoryWarehousesByBranch,
	type IInventorySeedOrigin,
} from '@/mocks/db/inventoryStock.db';
import { normalizePageParams } from '@/utils/procurementPagination.util';

const MOCK_LATENCY_MS = 120;
const apiError = (status: number, code: string, message: string): Error =>
	Object.assign(new Error(message), {
		isAxiosError: true as const,
		response: { status, data: { code, message } },
	});

const delay = <T>(value: T, signal?: AbortSignal): Promise<T> =>
	new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException('La solicitud fue cancelada.', 'AbortError'));
			return;
		}
		let timer: ReturnType<typeof setTimeout>;
		const onAbort = () => {
			clearTimeout(timer);
			reject(new DOMException('La solicitud fue cancelada.', 'AbortError'));
		};
		timer = setTimeout(() => {
			signal?.removeEventListener('abort', onAbort);
			resolve(structuredClone(value));
		}, MOCK_LATENCY_MS);
		signal?.addEventListener('abort', onAbort, { once: true });
	});

const locationContext = (
	branchId: number,
	params: IInventoryStockListParams,
): IInventoryLocationContext => {
	if (!Number.isInteger(branchId) || branchId <= 0)
		throw apiError(422, 'INVALID_FILTER', 'Selecciona una sucursal válida.');
	// Runtime validation also covers callers outside TypeScript (or persisted filters).
	if (params.warehouse_id !== undefined && params.unlocated !== undefined)
		throw apiError(422, 'INVALID_FILTER', 'Bodega y Sin ubicación son filtros excluyentes.');
	if (params.unlocated !== undefined && params.unlocated !== 1)
		throw apiError(422, 'INVALID_FILTER', 'El filtro Sin ubicación no es válido.');
	if ('warehouse_id' in params && params.warehouse_id !== undefined) {
		const warehouse = inventoryWarehousesByBranch[branchId]?.find(
			(item) => item.id === params.warehouse_id,
		);
		if (!warehouse)
			throw apiError(422, 'WAREHOUSE_INVALID', 'La bodega no pertenece a la sucursal.');
		return { scope: 'warehouse', branch_id: branchId, warehouse };
	}
	if ('unlocated' in params && params.unlocated === 1)
		return { scope: 'unlocated', branch_id: branchId, warehouse: null };
	return { scope: 'branch', branch_id: branchId, warehouse: null };
};

const matchesLocation = (
	row: { warehouse_id: number | null },
	context: IInventoryLocationContext,
): boolean =>
	context.scope === 'branch' ||
	(context.scope === 'unlocated'
		? row.warehouse_id === null
		: row.warehouse_id === context.warehouse?.id);

const page = <T>(items: T[], path: string, params: { page?: number; per_page?: number }) => {
	const { page: requestedPage, per_page: perPage } = normalizePageParams(params);
	const total = items.length;
	const lastPage = Math.max(1, Math.ceil(total / perPage));
	const currentPage = Math.min(requestedPage, lastPage);
	const start = (currentPage - 1) * perPage;
	const data = items.slice(start, start + perPage);
	const links: IApiPaginationLinks = {
		first: '?page=1',
		last: `?page=${lastPage}`,
		prev: currentPage > 1 ? `?page=${currentPage - 1}` : null,
		next: currentPage < lastPage ? `?page=${currentPage + 1}` : null,
	};
	const meta: IApiPaginationMeta = {
		current_page: currentPage,
		from: data.length ? start + 1 : null,
		last_page: lastPage,
		links: [],
		path,
		per_page: perPage,
		to: data.length ? start + data.length : null,
		total,
	};
	return { data, links, meta };
};

export const getInventoryWarehouses = (branchId: number): IWarehouseCompact[] =>
	(inventoryWarehousesByBranch[branchId] ?? []).map((warehouse) => ({ ...warehouse }));

export const listInventoryStock = async (
	branchId: number,
	params: IInventoryStockListParams = {},
	signal?: AbortSignal,
): Promise<IInventoryStockResponse> => {
	let context: IInventoryLocationContext;
	try {
		context = locationContext(branchId, params);
	} catch (error) {
		return Promise.reject(error);
	}
	const search = params.search?.trim().toLocaleLowerCase() ?? '';
	const locations = inventoryStockRows
		.filter(
			(row) =>
				row.branch_id === branchId &&
				matchesLocation(row, context) &&
				!row.product.serial_tracking,
		)
		.filter(
			(row) =>
				!search ||
				row.product.name.toLocaleLowerCase().includes(search) ||
				row.product.sku.toLocaleLowerCase().includes(search),
		);
	const products = new Map<number, IInventoryStockRow>();
	locations.forEach(({ branch_id: _branch, warehouse_id: _warehouse, ...row }) => {
		const previous = products.get(row.product.id);
		if (!previous) {
			products.set(row.product.id, { ...row });
			return;
		}
		previous.physical_quantity += row.physical_quantity;
		previous.fit_quantity += row.fit_quantity;
		previous.unfit_quantity += row.unfit_quantity;
		previous.documented_quantity += row.documented_quantity;
		previous.undocumented_quantity += row.undocumented_quantity;
	});
	const rows = [...products.values()].sort(
		(a, b) => a.product.name.localeCompare(b.product.name) || a.product.id - b.product.id,
	);
	return delay(
		{ ...page(rows, `/api/branches/${branchId}/inventory-stock`, params), context },
		signal,
	);
};

const originsFor = (
	branchId: number,
	productId: number,
	context: IInventoryLocationContext,
): IInventorySeedOrigin[] =>
	inventoryOrigins.filter(
		(origin) =>
			origin.branch_id === branchId &&
			origin.product_id === productId &&
			matchesLocation(origin, context),
	);

export const getInventoryOriginFilterOptions = (
	branchId: number,
	productId: number,
	location: IInventoryStockListParams,
): { suppliers: ISupplierCompact[]; documents: IPurchaseDocumentCompact[] } => {
	const context = locationContext(branchId, location);
	const product = inventoryStockRows.find(
		(row) => row.branch_id === branchId && row.product.id === productId,
	)?.product;
	if (!product || product.serial_tracking) return { suppliers: [], documents: [] };
	return structuredClone(inventoryOriginFilterOptions(originsFor(branchId, productId, context)));
};

export const listInventoryOrigins = async (
	branchId: number,
	productId: number,
	params: IInventoryOriginsParams = {},
	signal?: AbortSignal,
): Promise<IInventoryOriginsResponse> => {
	const product = inventoryStockRows.find(
		(row) => row.branch_id === branchId && row.product.id === productId,
	)?.product;
	if (!product || product.serial_tracking)
		return Promise.reject(
			apiError(
				404,
				'INVENTORY_PRODUCT_NOT_FOUND',
				'El producto no tiene stock no serializado en esta sucursal.',
			),
		);
	let context: IInventoryLocationContext;
	try {
		context = locationContext(branchId, params);
	} catch (error) {
		return Promise.reject(error);
	}
	const origins = originsFor(branchId, productId, context)
		.filter(
			(origin) =>
				params.purchase_document_id === undefined ||
				origin.purchase_document?.id === params.purchase_document_id,
		)
		.filter(
			(origin) =>
				params.supplier_id === undefined || origin.supplier?.id === params.supplier_id,
		)
		.sort((a, b) => a.fifo_at - b.fifo_at || a.origin_id - b.origin_id)
		.map(
			({
				branch_id: _branch,
				warehouse_id: _warehouse,
				fifo_at: _fifo,
				product_id: _product,
				...origin
			}) => origin,
		);
	return delay(
		{
			...page(
				origins,
				`/api/branches/${branchId}/inventory-stock/${productId}/origins`,
				params,
			),
			context: { ...context, product },
		},
		signal,
	);
};
