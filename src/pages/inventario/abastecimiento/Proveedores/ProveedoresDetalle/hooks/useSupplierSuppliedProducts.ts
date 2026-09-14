import { useCallback, useEffect, useState } from 'react';
import useAuthorization from '@/hooks/useAuthorization';
import { getStockReceipt, listStockReceipts } from '@/services/procurement/stockReceipts.service';
import { PROCUREMENT_PER_PAGE_MAX } from '@/interface/procurement.interface';
import type {
	IStockReceipt,
	IStockReceiptItem,
	IStockReceiptListParams,
	IStockReceiptListRow,
} from '@/interface/procurement.interface';
import type { ISupplierSuppliedProductRow } from '../types';

/**
 * Productos suministrados por el proveedor, derivados de sus recepciones
 * `posted` (ver `ISupplierSuppliedProductRow`: el contrato no trae esta
 * lista). Son dos pasos porque la fila del listado de recepciones no incluye
 * `items`:
 *
 * 1. `GET P/stock-receipts?supplier_id=&status=posted`, todas las páginas.
 * 2. `GET P/stock-receipts/{receipt}` por recepción, con concurrencia acotada.
 *
 * Leer recepciones exige `view-product` a nivel filial (sección 15). Sin ese
 * permiso no se pide nada: la ruta de la ficha sólo exige
 * `view-procurement-supplier`, que no habilita leer recepciones.
 *
 * El estado se guarda junto con la filial y el proveedor que lo pidieron
 * (patrón ZF-12): al navegar a otro proveedor, el render intermedio ya no
 * muestra las filas ni el error del anterior, sin esperar al efecto de
 * limpieza.
 */

const DETAIL_CONCURRENCY = 4;
const LOAD_ERROR_MESSAGE = 'No pudimos cargar los productos suministrados.';
const EMPTY_ROWS: ISupplierSuppliedProductRow[] = [];

const byMostRecentReceipt = (left: IStockReceipt, right: IStockReceipt): number =>
	right.received_on.localeCompare(left.received_on) || right.id - left.id;

/**
 * Agrupa por producto las líneas de las recepciones `posted`. Una recepción
 * que dejó de estar `posted` entre el listado y el detalle (p. ej. revertida)
 * no participa. Exportada para probar la agregación sin red.
 */
export const aggregateSuppliedProducts = (
	receipts: readonly IStockReceipt[],
): ISupplierSuppliedProductRow[] => {
	const rowsByProductId = new Map<number, ISupplierSuppliedProductRow>();

	[...receipts]
		.filter((receipt) => receipt.status === 'posted')
		.sort(byMostRecentReceipt)
		.forEach((receipt) => {
			const linesByProductId = new Map<number, IStockReceiptItem[]>();
			receipt.items.forEach((item) => {
				linesByProductId.set(item.product.id, [
					...(linesByProductId.get(item.product.id) ?? []),
					item,
				]);
			});

			linesByProductId.forEach((lines, productId) => {
				const quantity = lines.reduce((total, line) => total + line.quantity, 0);
				const existing = rowsByProductId.get(productId);
				if (existing) {
					existing.receipt_count += 1;
					existing.total_units_received += quantity;
					return;
				}
				// Se recorre de la más reciente a la más antigua: la primera
				// recepción que trae el producto es su última compra.
				rowsByProductId.set(productId, {
					product: lines[0].product,
					receipt_count: 1,
					total_units_received: quantity,
					last_purchase: {
						stock_receipt_id: receipt.id,
						branch_id: receipt.branch_id,
						received_on: receipt.received_on,
						quantity,
						cost: lines.length === 1 ? lines[0].cost : null,
						purchase_document: receipt.purchase_document,
					},
				});
			});
		});

	return [...rowsByProductId.values()];
};

const fetchPostedReceiptRows = async (
	subsidiaryId: number,
	supplierId: number,
): Promise<IStockReceiptListRow[]> => {
	const params: IStockReceiptListParams = {
		supplier_id: supplierId,
		status: 'posted',
		per_page: PROCUREMENT_PER_PAGE_MAX,
	};
	const firstPage = await listStockReceipts(subsidiaryId, { ...params, page: 1 });
	const remainingPages = await Promise.all(
		Array.from({ length: Math.max(0, firstPage.meta.last_page - 1) }, (_, index) =>
			listStockReceipts(subsidiaryId, { ...params, page: index + 2 }),
		),
	);
	return [firstPage, ...remainingPages].flatMap((response) => response.data);
};

/** Resuelve `run` con a lo sumo `limit` promesas en vuelo, conservando el orden. */
const mapWithConcurrency = async <TItem, TResult>(
	items: readonly TItem[],
	limit: number,
	run: (item: TItem) => Promise<TResult>,
): Promise<TResult[]> => {
	const results: TResult[] = [];
	let cursor = 0;
	const worker = async (): Promise<void> => {
		if (cursor >= items.length) return;
		const index = cursor;
		cursor += 1;
		results[index] = await run(items[index]);
		await worker();
	};
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
	return results;
};

const loadSuppliedProducts = async (
	subsidiaryId: number,
	supplierId: number,
): Promise<ISupplierSuppliedProductRow[]> => {
	const receiptRows = await fetchPostedReceiptRows(subsidiaryId, supplierId);
	const receipts = await mapWithConcurrency(
		receiptRows,
		DETAIL_CONCURRENCY,
		async (row) => (await getStockReceipt(subsidiaryId, row.id)).data,
	);
	return aggregateSuppliedProducts(receipts);
};

interface IUseSupplierSuppliedProductsArgs {
	subsidiaryId: number | null;
	supplierId: number | null;
}

interface ISuppliedProductsState {
	ownerKey: string;
	rows: ISupplierSuppliedProductRow[];
	loading: boolean;
	error: string | null;
}

const useSupplierSuppliedProducts = ({
	subsidiaryId,
	supplierId,
}: IUseSupplierSuppliedProductsArgs) => {
	const { authorize, isLoading: checkingAccess } = useAuthorization();
	const canRead =
		!checkingAccess &&
		authorize({ permission: 'view-product', subsidiaryId, scope: 'visible' });
	const ownerKey =
		canRead && subsidiaryId !== null && supplierId !== null
			? `${subsidiaryId}:${supplierId}`
			: null;

	const [state, setState] = useState<ISuppliedProductsState | null>(null);
	const [reloadToken, setReloadToken] = useState(0);

	useEffect(() => {
		if (ownerKey === null || subsidiaryId === null || supplierId === null) return undefined;

		let cancelled = false;
		setState({ ownerKey, rows: EMPTY_ROWS, loading: true, error: null });
		loadSuppliedProducts(subsidiaryId, supplierId)
			.then((rows) => {
				if (!cancelled) setState({ ownerKey, rows, loading: false, error: null });
			})
			.catch(() => {
				if (!cancelled)
					setState({
						ownerKey,
						rows: EMPTY_ROWS,
						loading: false,
						error: LOAD_ERROR_MESSAGE,
					});
			});

		return () => {
			cancelled = true;
		};
	}, [ownerKey, subsidiaryId, supplierId, reloadToken]);

	const retry = useCallback(() => setReloadToken((token) => token + 1), []);

	// Sólo se expone el estado del propietario actual: uno de otro proveedor o
	// filial (o de antes de perder el permiso) no se pinta ni un render.
	const ownState = ownerKey !== null && state?.ownerKey === ownerKey ? state : null;

	return {
		canRead,
		checkingAccess,
		rows: ownState?.rows ?? EMPTY_ROWS,
		loading: ownerKey !== null && (ownState?.loading ?? true),
		error: ownState?.error ?? null,
		retry,
	};
};

export default useSupplierSuppliedProducts;
