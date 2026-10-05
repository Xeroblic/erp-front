import React, { useEffect, useRef, useState } from 'react';
import { FormikProvider } from 'formik';
import { useHref } from 'react-router-dom';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';
import SupplierFormModal from '@/pages/inventario/abastecimiento/Proveedores/components/modals/SupplierFormModal';
import type {
	IProcurementSupplier,
	IProcurementSupplierRutConflict,
	IPurchaseDocument,
} from '@/interface/procurement.interface';
import { parsePesoInput } from '@/utils/procurementDecimal.util';
import type { ICreatedPurchasableProduct } from '@/services/procurement/purchasableProducts.service';
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

/**
 * Alta y edición de documento de compra (card 03, sección 6). La edición
 * sólo se ofrece en `draft` — la ficha filtra `allowed_actions` antes de
 * abrir este modal, así que acá no hay que resolver ese caso.
 *
 * El modal reúne los datos (formulario, proveedores, productos, altas en
 * línea) y compone las partes de `components/parts/`: avisos, encabezado con
 * proveedor, líneas con envío y total, y pie.
 */

interface IPurchaseDocumentFormModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	subsidiaryId: number | null;
	/** `null`/`undefined`: alta. Con documento: edición de ese `draft`. */
	document?: IPurchaseDocument | null;
	/** `ETag` vigente de `document`. Sólo hace falta en edición. */
	etag?: string | null;
	onSuccess?: (document: IPurchaseDocument) => void;
	/**
	 * Se llama cuando el `PATCH` responde `412 RESOURCE_VERSION_CONFLICT`: el
	 * ETag con el que se abrió el formulario quedó obsoleto. El contrato
	 * exige recargar antes de volver a editar, así que el caller debe volver
	 * a pedir el documento (`retry` de `useDocumentoCompraDetalle`) para que
	 * la próxima apertura reciba un ETag vigente.
	 */
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
	const { formik, isEdit, isSubmitting, hasVersionConflict, isMissingEtag, reset, discardDraft } =
		usePurchaseDocumentForm({
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
	const productOptions = usePurchasableProductOptions({
		subsidiaryId,
		isEnabled: isOpen,
		initialProducts: document?.items.map((item) => item.product),
	});
	/**
	 * Crear una factura exige `view-procurement-supplier` además de
	 * `create-purchase-document`: el backend no ofrece otra forma de conocer el
	 * `supplier_id`. Al editar, el tipo ya está fijo y el proveedor actual se
	 * conserva aunque no se pueda listar.
	 */
	const isInvoiceUnavailable = !canListSuppliers && !isEdit;
	/**
	 * Alta de proveedor en línea: `SupplierFormModal` se apila sobre este
	 * modal y, al crear o restaurar, el proveedor queda seleccionado sin perder
	 * el borrador del documento.
	 */
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

	/**
	 * Alta de producto en línea: guarda qué línea abrió `ProcurementProductFormModal`
	 * para dejar ahí el producto creado. `null` con el modal cerrado.
	 */
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
	 * El borrador pertenece a la filial en que se escribió: proveedor, líneas y
	 * productos son de su catálogo. El contenedor cierra el modal al cambiar de
	 * filial, pero este componente sigue montado con su estado; sin esto, al
	 * volver a abrir «Nuevo documento» reaparecería el borrador anterior, con
	 * el alta de producto abierta sobre la línea de entonces.
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
				{/* `FieldArray` sólo lee su bag de Formik vía contexto (`useFormikContext`):
			    sin este `FormikProvider`, `push`/`remove` no encuentran `items` porque
			    este modal usa el hook `useFormik` directo, no el componente `<Formik>`
			    que lo provee automáticamente. */}
				<FormikProvider value={formik}>
					<form
						className='flex min-h-0 flex-1 flex-col overflow-hidden'
						onSubmit={(event) => {
							// Defensa además del botón deshabilitado: Enter en un campo de
							// texto dispara el submit nativo del `<form>` sin pasar por el
							// botón, así que el bloqueo tiene que vivir acá también.
							event.preventDefault();
							if (hasVersionConflict || isMissingEtag) return;
							// Mismo criterio que pagos diferidos: se envía igual (Formik
							// marca los campos tocados y no llama a `onSubmit` si hay
							// errores) y después se lleva la vista al primer campo inválido.
							formik
								.validateForm()
								.then((errors) =>
									formik
										.submitForm()
										.finally(() =>
											focusFirstInvalidPurchaseDocumentField(errors),
										),
								)
								.catch(() => undefined);
						}}>
						<ModalBody className='min-h-0 flex-1 space-y-4 overflow-y-auto bg-zinc-50 dark:bg-zinc-950'>
							<PurchaseDocumentFormAlerts
								isMissingEtag={isMissingEtag}
								hasVersionConflict={hasVersionConflict}
								onReload={handleReload}
							/>
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
										isSubmitting={isSubmitting}
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
								isCreateProductDisabled={
									isSubmitting || hasVersionConflict || isMissingEtag
								}
								onCreateProduct={setProductLineIndex}
								onPesoChange={handlePesoChange}
							/>
						</ModalBody>
						<PurchaseDocumentFormFooter
							isEdit={isEdit}
							isSubmitting={isSubmitting}
							isSaveBlocked={hasVersionConflict || isMissingEtag}
							onCancel={handleClose}
						/>
					</form>
				</FormikProvider>
			</Modal>

			{/*
			 * Hermano del modal del documento, no hijo de su `<form>`: los eventos
			 * de React suben por el árbol de componentes aunque el DOM esté en otro
			 * lado, y un submit del proveedor no debe llegar al `onSubmit` del
			 * documento.
			 */}
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
