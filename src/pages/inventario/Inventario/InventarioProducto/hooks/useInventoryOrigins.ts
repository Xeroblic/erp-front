import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchInventoryOrigins,
	inventoryOriginsQueryKey,
} from '@/store/slices/procurement/inventoryStockSlice';
import { getInventoryOriginFilterOptions } from '@/services/procurement/inventoryStock.service';
import { STOCK_RECEIPTS_USE_TEST_SUPPLIERS } from '@/services/procurement/stockReceipts.service';
import {
	purchaseDocumentDetailLink,
	stockReceiptDetailLink,
	supplierDetailLink,
	type IPageLink,
} from '@/config/procurementLinks';
import type {
	IInventoryStockListParams,
	IInventoryStockOriginRow,
} from '@/interface/procurement.interface';

export interface IInventoryOriginLinks {
	receipt: IPageLink | null;
	supplier: IPageLink | null;
	document: IPageLink | null;
}

/**
 * Destinos de una procedencia. La recepción vive en el mismo mundo que el
 * inventario (las dos fachadas cambian juntas con
 * `VITE_INVENTORY_STOCK_USE_MOCKS`), así que su ficha siempre existe. El
 * proveedor y el documento, en cambio, salen de la semilla de prueba mientras
 * Recepciones sea simulada (`STOCK_RECEIPTS_USE_TEST_SUPPLIERS`), y sus fichas
 * leen la API real: hasta entonces quedan como texto.
 */
export const inventoryOriginLinks = (origin: IInventoryStockOriginRow): IInventoryOriginLinks => {
	const linksToMasterData = !STOCK_RECEIPTS_USE_TEST_SUPPLIERS;
	return {
		receipt:
			origin.origin_type === 'stock_receipt' && origin.stock_receipt_id !== null
				? stockReceiptDetailLink(origin.stock_receipt_id)
				: null,
		supplier:
			linksToMasterData && origin.supplier ? supplierDetailLink(origin.supplier.id) : null,
		document:
			linksToMasterData && origin.purchase_document
				? purchaseDocumentDetailLink(origin.purchase_document.id)
				: null,
	};
};

export default function useInventoryOrigins(
	branchId: number,
	productId: number,
	owner: string,
	location: IInventoryStockListParams,
) {
	const session = useId();
	const dispatch = useAppDispatch();
	const raw = useAppSelector((state) => state.inventoryStock.origins);
	const [pagination, setPagination] = useState({ page: 1, per_page: 15 });
	const [retry, setRetry] = useState(0);
	// Son filtros de un listado, no un formulario: sin `validationSchema`, para
	// que `Select` nunca los marque en rojo por «faltar» un valor que en
	// realidad es una elección válida (Todos los proveedores/documentos).
	const formik = useFormik({
		initialValues: { supplier: '', document: '' },
		onSubmit: () => undefined,
	});
	const { supplier, document } = formik.values;
	const { setFieldValue } = formik;
	const request = useMemo(
		() => ({
			branchId,
			productId,
			ownerContext: `${owner}:${session}`,
			params: {
				...location,
				supplier_id: supplier ? Number(supplier) : undefined,
				purchase_document_id: document ? Number(document) : undefined,
				...pagination,
			},
		}),
		[branchId, productId, owner, session, location, supplier, document, pagination],
	);
	const isCurrent = raw.ownerContext === inventoryOriginsQueryKey(request);
	useEffect(() => {
		const pending = dispatch(fetchInventoryOrigins(request));
		return () => {
			pending.abort();
		};
	}, [dispatch, request, retry]);
	const setFilter = useCallback(
		(field: 'supplier' | 'document', value: string) => {
			setPagination((current) => ({ ...current, page: 1 }));
			void setFieldValue(field, value);
		},
		[setFieldValue],
	);
	const options = useMemo(
		() => getInventoryOriginFilterOptions(branchId, productId, location),
		[branchId, productId, location],
	);
	const paginate = useCallback(
		(page: number, per_page: number) => setPagination({ page, per_page }),
		[],
	);
	const refresh = useCallback(() => setRetry((value) => value + 1), []);
	return {
		formik,
		setFilter,
		options,
		paginate,
		refresh,
		response: isCurrent ? raw.response : null,
		error: isCurrent ? raw.error : null,
		loading: !isCurrent || raw.loading,
	};
}
