import React, { useEffect, useRef, useState } from 'react';
import { FormikProvider } from 'formik';
import { useHref } from 'react-router-dom';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import SupplierFormModal from '@/pages/inventario/abastecimiento/Proveedores/components/modals/SupplierFormModal';
import type {
	IProcurementSupplier,
	IProcurementSupplierRutConflict,
	IPurchaseDocument,
} from '@/interface/procurement.interface';
import { parsePesoInput } from '@/utils/procurementDecimal.util';
import type { ICreatedPurchasableProduct } from '@/services/procurement/purchasableProducts.service';
import type { IPurchaseDocumentWriteAttempt } from '@/store/slices/procurement/purchaseDocumentsSlice';
import usePurchaseDocumentForm from '../../hooks/usePurchaseDocumentForm';
import useActiveSupplierOptions from '../../hooks/useActiveSupplierOptions';
import useSupplierInlineEdit from '../../hooks/useSupplierInlineEdit';
import usePurchasableProductOptions from '../../hooks/usePurchasableProductOptions';
import ProcurementProductFormModal from './ProcurementProductFormModal';
import PurchaseDocumentFormAlerts from '../parts/PurchaseDocumentFormAlerts';
import PurchaseDocumentHeaderCard from '../parts/PurchaseDocumentHeaderCard';
import PurchaseDocumentSupplierPicker from '../parts/PurchaseDocumentSupplierPicker';
import PurchaseDocumentLinesCard from '../parts/PurchaseDocumentLinesCard';
import PurchaseDocumentFormFooter from '../parts/PurchaseDocumentFormFooter';
import { focusFirstInvalidPurchaseDocumentField } from '../../utils/purchaseDocumentFieldFocus';

type TRecoverableAttemptStatus = Exclude<IPurchaseDocumentWriteAttempt['status'], 'in_flight'>;

const ATTEMPT_ALERT_TITLE: Record<TRecoverableAttemptStatus, string> = {
	uncertain: 'El intento de guardado está pendiente',
	completed: 'El documento se guardó',
	rejected: 'El guardado fue rechazado',
};

const ATTEMPT_PRIMARY_LABEL: Record<TRecoverableAttemptStatus, string> = {
	uncertain: 'Reintentar guardado',
	completed: 'Usar documento guardado',
	rejected: 'Corregir datos',
};

interface IPurchaseDocumentFormModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	subsidiaryId: number | null;
	/** `null`/`undefined`: alta. Con documento: edición de ese `draft`. */
	document?: IPurchaseDocument | null;
	/** `ETag` vigente de `document`. Sólo hace falta en edición. */
	etag?: string | null;
	onSuccess?: (document: IPurchaseDocument) => void;
	/** El `PATCH` respondió 412: el caller debe recargar el documento para obtener un ETag vigente. */
	onStaleVersion?: () => void;
}

const PurchaseDocumentFormModal: React.FC<IPurchaseDocumentFormModalProps> = ({
	isOpen,
	setIsOpen,
	subsidiaryId,
	document = null,
	etag = null,
	onSuccess,
	onStaleVersion,
}) => {
	const {
		suppliers,
		loading: loadingSuppliers,
		unavailableReason: suppliersUnavailableReason,
		canList: canListSuppliers,
		addSupplier,
		reload: reloadSuppliers,
	} = useActiveSupplierOptions(subsidiaryId, isOpen);
	const {
		formik,
		isEdit,
		isSubmitting,
		pendingAttempt,
		retryPending,
		reviewRejection,
		discardAttempt,
		hasVersionConflict,
		isMissingEtag,
		reset,
		discardDraft,
	} = usePurchaseDocumentForm({
		subsidiaryId,
		document,
		etag,
		// Sin lista de proveedores no hay cómo elegir el que exige la factura.
		defaultDocumentType: canListSuppliers ? 'invoice' : 'receipt',
		onSuccess: (result) => {
			setIsOpen(false);
			onSuccess?.(result);
		},
	});
	// Un envío en curso no es una recuperación: la alerta sólo aparece cuando hay algo que decidir.
	const recoverableStatus: TRecoverableAttemptStatus | null =
		pendingAttempt !== null && pendingAttempt.status !== 'in_flight'
			? pendingAttempt.status
			: null;
	const productOptions = usePurchasableProductOptions({
		subsidiaryId,
		isEnabled: isOpen,
		initialProducts: document?.items.map((item) => item.product),
	});
	/**
	 * Una factura nueva exige elegir proveedor, y sin `view-procurement-supplier`
	 * no hay de dónde sacar el `supplier_id`. Al editar, el tipo ya está fijo.
	 */
	const isInvoiceUnavailable = !canListSuppliers && !isEdit;
	const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
	const { editingSupplier, isLoadingSupplier, openSupplierEdit, closeSupplierEdit } =
		useSupplierInlineEdit(subsidiaryId);
	const selectedSupplierId =
		formik.values.supplier_id === '' ? null : Number(formik.values.supplier_id);
	// `useHref` respeta el `basename` del router al abrir la ficha en otra pestaña.
	const suppliersHref = useHref('/inventario/abastecimiento/proveedores');
	// El proveedor actual del documento sigue visible aunque no esté en la lista:
	// sin permiso para listar, o desactivado después de elegirlo.
	const currentSupplier = document?.supplier ?? null;
	const supplierOptions = [
		...suppliers,
		...(currentSupplier && !suppliers.some((supplier) => supplier.id === currentSupplier.id)
			? [currentSupplier]
			: []),
	].map((supplier) => ({
		value: String(supplier.id),
		label: `${supplier.display_name} · ${supplier.rut}`,
	}));

	/** Línea que abrió el alta de producto, para dejar ahí el producto creado. */
	const [productLineIndex, setProductLineIndex] = useState<number | null>(null);

	const handleProductCreated = (product: ICreatedPurchasableProduct) => {
		productOptions.addProduct(product);
		// El producto queda creado en el catálogo, pero una línea de compra sólo admite activos sin serie.
		if (productLineIndex === null || product.serial_tracking || !product.is_active) return;
		const field = `items.${productLineIndex}.product_id`;
		formik.setFieldValue(field, product.id).catch(() => undefined);
		formik.setFieldTouched(field, true, false).catch(() => undefined);
	};

	/**
	 * El borrador es de la filial en que se escribió. El contenedor cierra el
	 * modal al cambiar de filial, pero este componente sigue montado: sin
	 * descartarlo, «Nuevo documento» reabriría el borrador de la anterior.
	 */
	const draftSubsidiaryRef = useRef(subsidiaryId);
	useEffect(() => {
		if (draftSubsidiaryRef.current === subsidiaryId) return;
		draftSubsidiaryRef.current = subsidiaryId;
		setIsSupplierModalOpen(false);
		setProductLineIndex(null);
		closeSupplierEdit();
		discardDraft();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [subsidiaryId]);

	// Los mensajes de error se pintan en el render que sigue al envío: el foco espera ese
	// commit para que el desplazamiento ya cuente con ellos. El objeto envolvente hace que
	// dos envíos seguidos con los mismos errores vuelvan a enfocar.
	const [pendingInvalidFocus, setPendingInvalidFocus] = useState<{ errors: unknown } | null>(
		null,
	);
	useEffect(() => {
		if (!pendingInvalidFocus) return;
		setPendingInvalidFocus(null);
		focusFirstInvalidPurchaseDocumentField(pendingInvalidFocus.errors);
	}, [pendingInvalidFocus]);

	const handleClose = () => {
		if (isSubmitting) return;
		setIsSupplierModalOpen(false);
		setProductLineIndex(null);
		closeSupplierEdit();
		setIsOpen(false);
		reset();
	};

	const selectSupplier = (supplierId: number) => {
		formik.setFieldValue('supplier_id', supplierId).catch(() => undefined);
		formik.setFieldTouched('supplier_id', true, false).catch(() => undefined);
	};

	const handleSupplierCreated = (supplier: IProcurementSupplier) => {
		addSupplier(supplier);
		selectSupplier(supplier.id);
	};

	/** RUT ya registrado a un proveedor activo: se usa ése; se recarga por si no estaba en la lista. */
	const handleUseExistingSupplier = (conflict: IProcurementSupplierRutConflict) => {
		reloadSuppliers();
		selectSupplier(conflict.id);
	};

	/** En otra pestaña: navegar desde acá descartaría el borrador del documento. */
	const openSupplierInNewTab = (supplierId: number) => {
		window.open(`${suppliersHref}/${supplierId}`, '_blank', 'noopener,noreferrer');
	};

	const handleReload = () => {
		setIsOpen(false);
		reset();
		onStaleVersion?.();
	};

	/** Los montos se ven con formato peso, pero Formik guarda el valor sin formato. */
	const handlePesoChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
		formik.setFieldValue(field, parsePesoInput(event.target.value)).catch(() => undefined);
	};

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
							{isEdit ? 'Editar documento de compra' : 'Nuevo documento de compra'}
						</h2>
						<p className='text-sm font-normal text-zinc-600 dark:text-zinc-400'>
							Completa los datos del documento y sus líneas de compra.
						</p>
					</div>
				</ModalHeader>
				{/* `FieldArray` lee Formik del contexto, que `useFormik` no provee. */}
				<FormikProvider value={formik}>
					<form
						className='flex min-h-0 flex-1 flex-col overflow-hidden'
						onSubmit={(event) => {
							// Enter en un campo envía el `<form>` aunque el botón esté
							// deshabilitado: el bloqueo tiene que vivir acá también.
							event.preventDefault();
							if (hasVersionConflict || isMissingEtag || pendingAttempt !== null)
								return;
							// Se envía igual para que Formik marque los campos tocados, y
							// después se lleva la vista al primer campo inválido.
							formik
								.validateForm()
								.then((errors) =>
									formik
										.submitForm()
										.finally(() => setPendingInvalidFocus({ errors })),
								)
								.catch(() => undefined);
						}}>
						<ModalBody className='min-h-0 flex-1 space-y-4 overflow-y-auto bg-zinc-50 dark:bg-zinc-950'>
							<PurchaseDocumentFormAlerts
								isMissingEtag={isMissingEtag}
								hasVersionConflict={hasVersionConflict}
								onReload={handleReload}
							/>
							{pendingAttempt && recoverableStatus && (
								<Alert
									color='amber'
									variant='outline'
									title={ATTEMPT_ALERT_TITLE[recoverableStatus]}>
									{recoverableStatus === 'rejected' ? (
										<p>
											{pendingAttempt.rejection?.message ??
												'El backend rechazó el documento.'}{' '}
											Conservamos los datos para que los corrijas.
										</p>
									) : (
										<p>
											Conservamos los datos del intento. Puedes cerrar y
											retomarlo; reintentar enviará exactamente los mismos
											datos.
										</p>
									)}
									<div className='mt-3 flex flex-wrap gap-2'>
										<Button
											variant='outline'
											onClick={
												recoverableStatus === 'rejected'
													? reviewRejection
													: retryPending
											}>
											{ATTEMPT_PRIMARY_LABEL[recoverableStatus]}
										</Button>
										<Button variant='outline' onClick={discardAttempt}>
											Descartar intento
										</Button>
									</div>
									{recoverableStatus === 'uncertain' && (
										<p className='mt-2 text-sm'>
											Antes de descartar y crear otro, revisa el listado: el
											intento anterior pudo haberse guardado.
										</p>
									)}
								</Alert>
							)}
							<fieldset
								disabled={isSubmitting || pendingAttempt !== null}
								className='space-y-4'>
								<PurchaseDocumentHeaderCard
									formik={formik}
									isEdit={isEdit}
									isInvoiceUnavailable={isInvoiceUnavailable}
									onPesoChange={handlePesoChange}
									supplierField={
										<PurchaseDocumentSupplierPicker
											formik={formik}
											subsidiaryId={subsidiaryId}
											supplierOptions={supplierOptions}
											loadingSuppliers={loadingSuppliers}
											canListSuppliers={canListSuppliers}
											suppliersUnavailableReason={suppliersUnavailableReason}
											onRetrySuppliers={reloadSuppliers}
											isSubmitting={isSubmitting || pendingAttempt !== null}
											selectedSupplierId={selectedSupplierId}
											isLoadingSupplier={isLoadingSupplier}
											onEditSupplier={(supplierId) => {
												openSupplierEdit(supplierId).catch(() => undefined);
											}}
											onCreateSupplier={() => setIsSupplierModalOpen(true)}
										/>
									}
								/>
								<PurchaseDocumentLinesCard
									formik={formik}
									subsidiaryId={subsidiaryId}
									productOptions={productOptions}
									isEditingDisabled={isSubmitting || pendingAttempt !== null}
									isCreateProductDisabled={
										isSubmitting ||
										pendingAttempt !== null ||
										hasVersionConflict ||
										isMissingEtag
									}
									onCreateProduct={setProductLineIndex}
									onPesoChange={handlePesoChange}
								/>
							</fieldset>
						</ModalBody>
						<PurchaseDocumentFormFooter
							isEdit={isEdit}
							isSubmitting={isSubmitting}
							isSaveBlocked={
								hasVersionConflict || isMissingEtag || pendingAttempt !== null
							}
							onCancel={handleClose}
						/>
					</form>
				</FormikProvider>
			</Modal>

			{/* Fuera del `<form>`: los eventos de React suben por el árbol de
			    componentes aunque el portal esté en otro lado del DOM, y un submit
			    del proveedor no debe llegar al del documento. */}
			<SupplierFormModal
				isOpen={isOpen && isSupplierModalOpen}
				setIsOpen={setIsSupplierModalOpen}
				subsidiaryId={subsidiaryId}
				onSuccess={handleSupplierCreated}
				onUseExistingSupplier={handleUseExistingSupplier}
				onViewSupplier={openSupplierInNewTab}
			/>
			<SupplierFormModal
				isOpen={isOpen && editingSupplier !== null}
				setIsOpen={(open) => {
					if (!open) closeSupplierEdit();
				}}
				subsidiaryId={subsidiaryId}
				supplier={editingSupplier}
				onSuccess={(supplier) => {
					closeSupplierEdit();
					addSupplier(supplier);
				}}
				onViewSupplier={openSupplierInNewTab}
			/>
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

export default PurchaseDocumentFormModal;
