import React, { useState } from 'react';
import { FormikProvider } from 'formik';
import {
	listStockReceiptSuppliers,
	searchStockReceiptProducts,
	STOCK_RECEIPTS_USE_TEST_SUPPLIERS,
} from '@/services/procurement/stockReceipts.service';
import type { ICreatedPurchasableProduct } from '@/services/procurement/purchasableProducts.service';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';
import type { IStockReceipt } from '@/interface/procurement.interface';
import ProcurementProductFormModal from '@/pages/inventario/abastecimiento/DocumentosCompra/components/modals/ProcurementProductFormModal';
import useActiveSupplierOptions from '@/pages/inventario/abastecimiento/DocumentosCompra/hooks/useActiveSupplierOptions';
import usePurchasableProductOptions from '@/pages/inventario/abastecimiento/DocumentosCompra/hooks/usePurchasableProductOptions';
import useStockReceiptForm from '../../hooks/useStockReceiptForm';
import useStockReceiptWarehouses from '../../hooks/useStockReceiptWarehouses';
import usePurchaseDocumentPicker from '../../hooks/usePurchaseDocumentPicker';
import useDocumentLinesSync from '../../hooks/useDocumentLinesSync';
import ReceiptFormAlerts from '../parts/ReceiptFormAlerts';
import ReceiptOriginSelector from '../parts/ReceiptOriginSelector';
import ReceiptDetailsStep from '../parts/ReceiptDetailsStep';
import ReceivedLinesStep from '../parts/ReceivedLinesStep';
import ReceiptFormFooter from '../parts/ReceiptFormFooter';
import { switchReceiptMode } from '../../utils/stockReceiptFormValues';
import type { TStockReceiptFormMode } from '../../types';

/**
 * Alta (con documento o sin él) y corrección de recepción `draft`/`failed`
 * (sección 7 del contrato). La corrección sólo se ofrece desde `allowed_actions`
 * de la ficha, así que acá no hay que resolver ese caso; el `mode` queda
 * fijo al abrir en edición.
 *
 * Orden pensado para quien recibe en bodega: 1) de dónde viene la mercadería,
 * 2) documento/bodega/fecha, 3) qué llegó, 4) guardar como borrador o guardar
 * e ingresar al stock en el mismo paso. Cada paso es un componente de
 * `components/parts/`; este modal reúne sus datos y los compone.
 */

interface IStockReceiptFormModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	subsidiaryId: number | null;
	branchId: number | null;
	defaultWarehouseId?: number | '';
	/** `null`/`undefined`: alta. Con recepción: corrección de ese `draft`/`failed`. */
	receipt?: IStockReceipt | null;
	/** `ETag` vigente de `receipt`. Sólo hace falta al corregir. */
	etag?: string | null;
	/** Sólo en alta: preselecciona modo «con documento» y ese documento. */
	initialDocumentId?: number;
	/** Sucursales autorizadas del actor; `null`/vacío no filtra. */
	authorizedBranchIds?: number[] | null;
	onSuccess?: (receipt: IStockReceipt) => void;
	/**
	 * Se llama cuando el `PATCH` responde `412 RESOURCE_VERSION_CONFLICT`: el
	 * ETag con el que se abrió el formulario quedó obsoleto. Mismo contrato
	 * que `PurchaseDocumentFormModal`.
	 */
	onStaleVersion?: () => void;
}

const StockReceiptFormModal: React.FC<IStockReceiptFormModalProps> = ({
	isOpen,
	setIsOpen,
	subsidiaryId,
	branchId,
	defaultWarehouseId = '',
	receipt = null,
	etag = null,
	initialDocumentId,
	authorizedBranchIds,
	onSuccess,
	onStaleVersion,
}) => {
	const {
		warehouses,
		loading: loadingWarehouses,
		error: warehousesError,
		retry: retryWarehouses,
	} = useStockReceiptWarehouses(subsidiaryId, isOpen);
	const {
		formik,
		isEdit,
		isSubmitting,
		submitIntent,
		submitWith,
		hasVersionConflict,
		canRetry,
		pendingIngress,
		isPendingIngressForeign,
		retryIngress,
		leavePendingIngress,
		discardPendingIngress,
		reset,
	} = useStockReceiptForm({
		subsidiaryId,
		branchId,
		defaultWarehouseId,
		receipt,
		etag,
		initialDocumentId,
		authorizedBranchIds,
		warehouses,
		onSuccess: (result) => {
			setIsOpen(false);
			onSuccess?.(result);
		},
	});

	// Al corregir, la bodega que la recepción ya tenía se ofrece aunque se haya
	// desactivado: el backend la acepta, y sin ella el selector quedaría vacío.
	const warehouseOptions =
		receipt && !warehouses.some((warehouse) => warehouse.id === receipt.warehouse.id)
			? [receipt.warehouse, ...warehouses]
			: warehouses;
	const isManual = formik.values.mode === 'manual';
	// Con datos simulados, el servicio de recepciones sólo reconoce su maestro
	// de prueba: `listStockReceiptSuppliers` lo elige según la bandera.
	const {
		suppliers,
		loading: loadingSuppliers,
		unavailableReason: suppliersUnavailableReason,
		reload: reloadSuppliers,
	} = useActiveSupplierOptions(subsidiaryId, isOpen && isManual, listStockReceiptSuppliers);
	const supplierOptions = suppliers.map((supplier) => ({
		value: String(supplier.id),
		label: `${supplier.display_name} · ${supplier.rut}`,
	}));

	const { documents, loadingDocuments, selectedDocument, loadingSelectedDocument } =
		usePurchaseDocumentPicker(
			subsidiaryId,
			isOpen && !isManual,
			formik.values.purchase_document_id,
		);
	// Al corregir se conservan las filas y cantidades de la recepción.
	useDocumentLinesSync(formik, selectedDocument, isEdit);
	const documentOptions = documents.map((document) => ({
		value: String(document.id),
		label: `${document.document_number} · ${document.supplier?.display_name ?? 'Sin proveedor'}`,
	}));

	const productOptions = usePurchasableProductOptions({
		subsidiaryId,
		isEnabled: isOpen && isManual,
		initialProducts: receipt?.items.map((item) => item.product),
		searchProducts: searchStockReceiptProducts,
	});

	/** Línea que abrió el alta de producto, para dejar ahí el producto creado. */
	const [productLineIndex, setProductLineIndex] = useState<number | null>(null);

	const handleProductCreated = (product: ICreatedPurchasableProduct) => {
		productOptions.addProduct(product);
		// Queda creado en el catálogo, pero la recepción sólo admite productos sin serie.
		if (productLineIndex === null || product.serial_tracking || !product.is_active) return;
		const field = `items.${productLineIndex}.product_id`;
		formik.setFieldValue(field, product.id).catch(() => undefined);
		formik.setFieldTouched(field, true, false).catch(() => undefined);
	};

	/**
	 * Bloquea el formulario mientras hay un resultado incierto: del guardado
	 * (`canRetry`) o del ingreso al stock de una recepción ya guardada
	 * (`pendingIngress`). En ambos casos sólo vale reintentar lo mismo.
	 */
	const isLocked = canRetry || pendingIngress !== null;

	const handleClose = () => {
		if (isSubmitting) return;
		// Con el ingreso incierto, cerrar lleva a la ficha: la recepción ya
		// existe y su `GET` es la única fuente que resuelve si el ingreso se
		// aplicó. Desde otra filial no se navega (abriría la recepción bajo un
		// contexto ajeno): cerrar descarta y avisa dónde quedó la recepción.
		if (pendingIngress) {
			if (isPendingIngressForeign) {
				discardPendingIngress();
				setIsOpen(false);
			} else leavePendingIngress();
			return;
		}
		setIsOpen(false);
		// Con un resultado incierto pendiente (`canRetry`), cerrar no debe
		// perder el comando: `reset()` limpia el formulario y la
		// clave de idempotencia, y reabrir con datos en blanco pero la misma
		// operación en curso llevaría a `IDEMPOTENCY_KEY_REUSED` en cuanto se
		// vuelva a escribir algo, o a perder la única recuperación segura
		// (reenviar exactamente lo mismo). Conserva formulario, clave y error
		// tal cual para poder reabrir y reintentar.
		if (!canRetry) reset();
	};

	const handleReload = () => {
		setIsOpen(false);
		reset();
		onStaleVersion?.();
	};

	const handleModeChange = (mode: TStockReceiptFormMode) => {
		if (mode === formik.values.mode) return;
		formik.setValues(switchReceiptMode(formik.values, mode), false).catch(() => undefined);
		formik.setErrors({});
	};

	const retryLabel =
		submitIntent === 'save_and_post' ? 'Reintentar guardar e ingresar' : 'Reintentar guardar';

	return (
		<>
			<Modal
				isOpen={isOpen}
				setIsOpen={(open) => {
					if (!open) handleClose();
				}}
				size='xl'
				isScrollable
				isStaticBackdrop={isSubmitting}>
				<ModalHeader className='border-b border-zinc-200 pb-4 dark:border-zinc-700'>
					<div>
						<h2 className='text-xl font-bold text-zinc-900 dark:text-white'>
							{isEdit && receipt
								? `Corregir recepción #${receipt.id}`
								: 'Nueva recepción'}
						</h2>
						<p className='text-sm font-normal text-zinc-600 dark:text-zinc-400'>
							Registra la mercadería que llegó a bodega.
						</p>
					</div>
				</ModalHeader>
				{/* `FieldArray` lee su bag de Formik vía contexto: sin `FormikProvider`,
			    `push`/`remove` no encuentran `items` porque este modal usa `useFormik`
			    directo. Mismo motivo que en `PurchaseDocumentFormModal`. */}
				<FormikProvider value={formik}>
					<form
						className='flex min-h-0 flex-1 flex-col overflow-hidden'
						onSubmit={(event) => {
							// Enter en un campo: guarda como borrador, la opción que no
							// mueve stock. Ingresar al stock exige su botón explícito.
							event.preventDefault();
							if (hasVersionConflict || isLocked) return;
							submitWith('save');
						}}>
						<ModalBody className='min-h-0 flex-1 space-y-4 overflow-y-auto bg-zinc-50 dark:bg-zinc-950'>
							<ReceiptFormAlerts
								hasVersionConflict={hasVersionConflict}
								onReload={handleReload}
								pendingIngress={pendingIngress}
								isPendingIngressForeign={isPendingIngressForeign}
								canRetry={canRetry}
								retryLabel={retryLabel}
							/>

							{/* Bloquea todo el comando mientras el resultado anterior
						    sigue incierto: un `<fieldset disabled>` nativo
						    deshabilita inputs, selects nativos y botones descendientes de
						    una sola vez, así que un reintento reenvía exactamente lo que
						    ya se había enviado. */}
							<fieldset
								disabled={isLocked}
								className='m-0 min-w-0 space-y-4 border-0 p-0'>
								{!isEdit && (
									<ReceiptOriginSelector
										value={formik.values.mode}
										onChange={handleModeChange}
										disabled={isLocked}
									/>
								)}

								<ReceiptDetailsStep
									formik={formik}
									isEdit={isEdit}
									receipt={receipt}
									isLocked={isLocked}
									documentOptions={documentOptions}
									loadingDocuments={loadingDocuments}
									warehouseOptions={warehouseOptions}
									loadingWarehouses={loadingWarehouses}
									warehousesError={warehousesError}
									onRetryWarehouses={retryWarehouses}
									supplierOptions={supplierOptions}
									loadingSuppliers={loadingSuppliers}
									suppliersUnavailableReason={suppliersUnavailableReason}
									onRetrySuppliers={reloadSuppliers}
								/>

								<ReceivedLinesStep
									formik={formik}
									isEdit={isEdit}
									isLocked={isLocked}
									subsidiaryId={subsidiaryId}
									productOptions={productOptions}
									canCreateProduct={!STOCK_RECEIPTS_USE_TEST_SUPPLIERS}
									onCreateProduct={setProductLineIndex}
									selectedDocument={selectedDocument}
									loadingSelectedDocument={loadingSelectedDocument}
								/>
							</fieldset>
						</ModalBody>
						<ReceiptFormFooter
							isEdit={isEdit}
							isSubmitting={isSubmitting}
							hasVersionConflict={hasVersionConflict}
							canRetry={canRetry}
							submitIntent={submitIntent}
							retryLabel={retryLabel}
							pendingIngress={pendingIngress}
							isPendingIngressForeign={isPendingIngressForeign}
							onSubmit={submitWith}
							onClose={handleClose}
							onRetryIngress={() => {
								retryIngress().catch(() => undefined);
							}}
							onLeavePendingIngress={leavePendingIngress}
						/>
					</form>
				</FormikProvider>
			</Modal>
			<ProcurementProductFormModal
				isOpen={isOpen && productLineIndex !== null}
				setIsOpen={(open) => {
					if (!open) setProductLineIndex(null);
				}}
				subsidiaryId={subsidiaryId}
				onSuccess={handleProductCreated}
			/>
		</>
	);
};

export default StockReceiptFormModal;
