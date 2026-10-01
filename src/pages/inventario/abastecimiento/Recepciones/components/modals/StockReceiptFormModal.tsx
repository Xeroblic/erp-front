import React from 'react';
import { FormikProvider } from 'formik';
import {
	formatProcurementProductLabel,
	listPurchasableProcurementProducts,
} from '@/services/procurement/procurementProducts.service';
import { listWarehousesForStockReceipts } from '@/services/procurement/stockReceipts.service';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import DateInput from '@/components/form/DateInput';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import SelectReact from '@/components/form/SelectReact';
import type { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import Validation from '@/components/form/Validation';
import type { IStockReceipt } from '@/interface/procurement.interface';
import useActiveSupplierOptions from '@/pages/inventario/abastecimiento/DocumentosCompra/hooks/useActiveSupplierOptions';
import SupplierOptionsNotice from '@/pages/inventario/abastecimiento/DocumentosCompra/components/parts/SupplierOptionsNotice';
import useStockReceiptForm from '../../hooks/useStockReceiptForm';
import usePurchaseDocumentPicker from '../../hooks/usePurchaseDocumentPicker';
import useDocumentLinesSync from '../../hooks/useDocumentLinesSync';
import ReceiptOriginSelector from '../parts/ReceiptOriginSelector';
import DocumentLinesEditor from '../parts/DocumentLinesEditor';
import ManualLinesEditor from '../parts/ManualLinesEditor';
import { EMPTY_RECEPCION_LINE } from '../../types';
import type { TStockReceiptFormMode } from '../../types';

/**
 * Alta (con documento o sin él) y corrección de recepción `draft`/`failed`
 * (card 05, sección 7). La corrección sólo se ofrece desde `allowed_actions`
 * de la ficha, así que acá no hay que resolver ese caso; el `mode` queda
 * fijo al abrir en edición.
 *
 * Orden pensado para quien recibe en bodega: 1) de dónde viene la mercadería,
 * 2) documento/bodega/fecha, 3) qué llegó, 4) guardar como borrador o guardar
 * e ingresar al stock en el mismo paso.
 */

/** `received_on` sólo se cambia en `draft` (sección 7); en `failed` la corrección la vuelve `draft` recién al guardar. */
const existingReceiptIsDraftOnly = (isEdit: boolean, receipt: IStockReceipt | null): boolean =>
	isEdit && receipt !== null && receipt.status === 'failed';

/** Mismas superficies que `PurchaseDocumentFormModal` para que ambos modales luzcan iguales. */
const RECEPCION_CARD_CLASSNAME =
	'border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900';
const RECEPCION_ITEM_CLASSNAME =
	'rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50';
const RECEPCION_SUBTITLE_CLASSNAME = 'text-sm font-normal text-zinc-600 dark:text-zinc-400';
/** Fondo blanco en todos los campos, igual que en `PurchaseDocumentFormModal`. */
const RECEPCION_FIELD_CLASSNAME = '!bg-white dark:!bg-zinc-900';
/**
 * `SelectReact` ya es blanco en reposo, pero con foco se vuelve transparente y
 * deja ver el gris de la card. Sólo aplica con foco: no pisa el deshabilitado.
 */
const RECEPCION_SELECT_CLASSNAME = 'focus-within:!bg-white dark:focus-within:!bg-zinc-900';

const RequiredMark: React.FC = () => <span className='text-red-500'> *</span>;

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
	/** Sucursales autorizadas del actor (hallazgo 5); `null`/vacío no filtra. */
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
		onSuccess: (result) => {
			setIsOpen(false);
			onSuccess?.(result);
		},
	});

	const warehouseOptions = listWarehousesForStockReceipts(authorizedBranchIds);
	const isManual = formik.values.mode === 'manual';
	/** Con proveedor conocido el costo unitario pasa a ser obligatorio. */
	const hasKnownSupplier = formik.values.supplier_id !== '';
	const {
		suppliers,
		loading: loadingSuppliers,
		unavailableReason: suppliersUnavailableReason,
		reload: reloadSuppliers,
	} = useActiveSupplierOptions(subsidiaryId, isOpen && isManual);
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

	const productOptions = listPurchasableProcurementProducts(subsidiaryId).map((product) => ({
		value: String(product.id),
		label: formatProcurementProductLabel(product),
	}));

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
		// Hallazgo 8: con un resultado incierto pendiente (`canRetry`), cerrar
		// no debe perder el comando — `reset()` limpia el formulario y la
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
		// Un solo `setValues`: varios `setFieldValue` seguidos validaban con el
		// modo anterior y podían dejar su error de líneas en el modo nuevo.
		// Con documento las líneas se precargan al elegirlo; sin documento se
		// parte con una línea vacía para completar.
		formik
			.setValues(
				mode === 'manual'
					? {
							...formik.values,
							mode,
							purchase_document_id: '',
							items: [{ ...EMPTY_RECEPCION_LINE }],
						}
					: { ...formik.values, mode, reason: '', supplier_id: '', items: [] },
				false,
			)
			.catch(() => undefined);
		formik.setErrors({});
	};

	let linesSubtitle = 'Viene cargado todo lo pendiente. Ajusta sólo lo que llegó incompleto.';
	if (isManual) linesSubtitle = 'Cada producto que entra, su cantidad y su costo.';
	else if (isEdit) linesSubtitle = 'Ajusta la cantidad que llegó de cada línea.';

	const saveLabel = isEdit ? 'Guardar corrección' : 'Guardar borrador';
	const retryLabel =
		submitIntent === 'save_and_post' ? 'Reintentar guardar e ingresar' : 'Reintentar guardar';

	return (
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
						{hasVersionConflict && (
							<Alert
								color='amber'
								variant='outline'
								icon='HeroExclamationTriangle'
								title='Alguien más editó esta recepción'>
								<div className='flex flex-wrap items-center justify-between gap-3'>
									<span>
										Recarga para ver la versión vigente antes de continuar.
									</span>
									<Button size='sm' variant='outline' onClick={handleReload}>
										Recargar
									</Button>
								</div>
							</Alert>
						)}

						{pendingIngress && !isPendingIngressForeign && (
							<Alert
								color='amber'
								variant='outline'
								icon='HeroExclamationTriangle'
								title={`La recepción #${pendingIngress.receipt.id} se guardó`}>
								Pero no pudimos confirmar si ingresó al stock: la respuesta no
								llegó. Pulsa «Reintentar ingreso al stock» para repetir la misma
								operación — no se duplica — o ve a la recepción para ver su estado
								real.
							</Alert>
						)}

						{pendingIngress && isPendingIngressForeign && (
							<Alert
								color='red'
								variant='outline'
								icon='HeroExclamationTriangle'
								title={`La recepción #${pendingIngress.receipt.id} es de otra filial`}>
								Su ingreso al stock quedó sin confirmar y se envió desde la filial
								anterior. Vuelve a esa filial para reintentarlo o ver la recepción,
								o descártalo: la recepción sigue guardada allí.
							</Alert>
						)}

						{canRetry && (
							<Alert
								color='amber'
								variant='outline'
								icon='HeroExclamationTriangle'
								title='No pudimos confirmar el envío anterior'>
								No sabemos si llegó al servidor. Los datos quedaron bloqueados para
								evitar duplicar la operación: pulsa «{retryLabel}» sin cambiar nada,
								o cierra este formulario — al reabrirlo seguirá listo para
								reintentar.
							</Alert>
						)}

						{/* Hallazgo 8: bloquea todo el comando mientras el resultado
						    anterior sigue incierto — un `<fieldset disabled>` nativo
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

							{/* `usePurchaseDocumentPicker` lee el mock, no la API real que
							    ya usa Documentos de compra: los documentos no coinciden. Se
							    muestra sin depender de la bandera porque el selector lee el
							    mock siempre, y con el estilo de los demás avisos del modal. */}
							{!isManual && (
								<Alert
									color='amber'
									variant='outline'
									icon='HeroExclamationTriangle'
									title='Documentos de prueba'>
									Los documentos de esta lista son de prueba, no los registrados
									en Documentos de compra.
								</Alert>
							)}

							<Card className={RECEPCION_CARD_CLASSNAME}>
								<CardHeader className='pb-2'>
									<div>
										<CardTitle className='text-lg'>
											Datos de la recepción
										</CardTitle>
										<p className={RECEPCION_SUBTITLE_CLASSNAME}>
											{isManual
												? 'Dónde y cuándo llegó, y por qué entra sin documento.'
												: 'Qué documento respalda la entrega, dónde y cuándo llegó.'}
										</p>
									</div>
								</CardHeader>
								<CardBody className='space-y-4'>
									<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
										{!isManual && (
											<div className='space-y-1 sm:col-span-2'>
												<Label htmlFor='recepcion-document'>
													Documento de compra
													<RequiredMark />
												</Label>
												<Validation
													isValid={!formik.errors.purchase_document_id}
													isTouched={Boolean(
														formik.touched.purchase_document_id,
													)}
													invalidFeedback={
														formik.errors.purchase_document_id
													}>
													<SelectReact
														className={RECEPCION_SELECT_CLASSNAME}
														name='purchase_document_id'
														inputId='recepcion-document'
														isDisabled={isEdit || isLocked}
														isLoading={loadingDocuments}
														options={documentOptions}
														placeholder='Busca por número o proveedor…'
														noOptionsMessage={() =>
															'No hay documentos confirmados con saldo por recibir.'
														}
														value={
															documentOptions.find(
																(option) =>
																	option.value ===
																	String(
																		formik.values
																			.purchase_document_id,
																	),
															) ?? null
														}
														onChange={(option) => {
															const selected =
																option as TSelectOption | null;
															if (Array.isArray(selected)) return;
															formik
																.setFieldValue(
																	'purchase_document_id',
																	selected
																		? Number(selected.value)
																		: '',
																)
																.catch(() => undefined);
															// Otro documento, otras líneas: se precargan
															// de nuevo al llegar su ficha.
															formik
																.setFieldValue('items', [])
																.catch(() => undefined);
														}}
														isValid={
															!formik.errors.purchase_document_id
														}
														isTouched={Boolean(
															formik.touched.purchase_document_id,
														)}
														invalidFeedback={
															formik.errors.purchase_document_id
														}
													/>
												</Validation>
												<p className='text-xs text-zinc-500'>
													Sólo aparecen documentos confirmados. Proveedor
													y costos se toman del documento.
												</p>
											</div>
										)}

										<div className='space-y-1'>
											<Label htmlFor='recepcion-warehouse'>
												Bodega de destino
												<RequiredMark />
											</Label>
											<Validation
												isValid={!formik.errors.warehouse_id}
												isTouched={Boolean(formik.touched.warehouse_id)}
												invalidFeedback={formik.errors.warehouse_id}>
												<Select
													id='recepcion-warehouse'
													// Borde gris en reposo, como `Input`: sin esto `Select`
													// usa el color del tema y parece seleccionado.
													className={RECEPCION_FIELD_CLASSNAME}
													style={
														{
															'--select-border': '#d4d4d8',
														} as React.CSSProperties
													}
													name='warehouse_id'
													value={formik.values.warehouse_id}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													isValid={!formik.errors.warehouse_id}
													isTouched={Boolean(formik.touched.warehouse_id)}
													invalidFeedback={formik.errors.warehouse_id}>
													<option value=''>Selecciona…</option>
													{warehouseOptions.map((warehouse) => (
														<option
															key={warehouse.id}
															value={warehouse.id}>
															{warehouse.name}
														</option>
													))}
												</Select>
											</Validation>
											{warehouseOptions.length === 0 && (
												<p className='text-xs text-zinc-500'>
													Tus sucursales autorizadas no tienen bodegas de
													recepción.
												</p>
											)}
										</div>

										<div className='space-y-1'>
											<Label htmlFor='recepcion-received-on'>
												Fecha de llegada
												<RequiredMark />
											</Label>
											<Validation
												isValid={!formik.errors.received_on}
												isTouched={Boolean(formik.touched.received_on)}
												invalidFeedback={formik.errors.received_on}>
												<DateInput
													id='recepcion-received-on'
													className={RECEPCION_FIELD_CLASSNAME}
													name='received_on'
													// Hallazgo 6: `received_on` es inmutable en `failed`
													// (sección 7) — se corrige el resto del formulario, y
													// recién al guardar (que vuelve la recepción a
													// `draft`) la fecha vuelve a ser editable.
													disabled={existingReceiptIsDraftOnly(
														isEdit,
														receipt,
													)}
													value={formik.values.received_on}
													onChange={formik.handleChange}
													onBlur={() =>
														formik
															.setFieldTouched('received_on', true)
															.catch(() => undefined)
													}
													isValid={!formik.errors.received_on}
													isTouched={Boolean(formik.touched.received_on)}
													invalidFeedback={formik.errors.received_on}
												/>
											</Validation>
											{existingReceiptIsDraftOnly(isEdit, receipt) && (
												<p className='text-xs text-zinc-500'>
													No se puede cambiar mientras la recepción tiene
													un error. Guarda el resto de la corrección para
													volver a borrador y poder cambiarla.
												</p>
											)}
										</div>

										{isManual && (
											<div className='space-y-1'>
												<Label htmlFor='recepcion-supplier'>
													Proveedor (opcional)
												</Label>
												<Validation
													isValid={!formik.errors.supplier_id}
													isTouched={Boolean(formik.touched.supplier_id)}
													invalidFeedback={formik.errors.supplier_id}>
													<SelectReact
														className={RECEPCION_SELECT_CLASSNAME}
														name='supplier_id'
														inputId='recepcion-supplier'
														isClearable
														isDisabled={isLocked}
														isLoading={loadingSuppliers}
														options={supplierOptions}
														placeholder='Sin proveedor conocido…'
														value={
															supplierOptions.find(
																(option) =>
																	option.value ===
																	String(
																		formik.values.supplier_id,
																	),
															) ?? null
														}
														onChange={(option) => {
															const selected =
																option as TSelectOption | null;
															if (Array.isArray(selected)) return;
															formik
																.setFieldValue(
																	'supplier_id',
																	selected
																		? Number(selected.value)
																		: '',
																)
																.catch(() => undefined);
														}}
														isValid={!formik.errors.supplier_id}
														isTouched={Boolean(
															formik.touched.supplier_id,
														)}
														invalidFeedback={formik.errors.supplier_id}
													/>
												</Validation>
												<SupplierOptionsNotice
													reason={suppliersUnavailableReason}
													onRetry={reloadSuppliers}
												/>
												<p className='text-xs text-zinc-500'>
													Si lo indicas, el costo de cada producto pasa a
													ser obligatorio.
												</p>
											</div>
										)}

										{isManual && (
											<div className='space-y-1'>
												<Label htmlFor='recepcion-reason'>
													Motivo del ingreso
													<RequiredMark />
												</Label>
												<Validation
													isValid={!formik.errors.reason}
													isTouched={Boolean(formik.touched.reason)}
													invalidFeedback={formik.errors.reason}>
													<Input
														id='recepcion-reason'
														className={RECEPCION_FIELD_CLASSNAME}
														name='reason'
														placeholder='Ej.: factura pendiente, devolución de cliente…'
														value={formik.values.reason}
														onChange={formik.handleChange}
														onBlur={formik.handleBlur}
														isValid={!formik.errors.reason}
														isTouched={Boolean(formik.touched.reason)}
														invalidFeedback={formik.errors.reason}
													/>
												</Validation>
											</div>
										)}
									</div>

									<div className='space-y-1'>
										<Label htmlFor='recepcion-notes'>Notas (opcional)</Label>
										<Validation
											isValid={!formik.errors.notes}
											isTouched={Boolean(formik.touched.notes)}
											invalidFeedback={formik.errors.notes}>
											<Textarea
												id='recepcion-notes'
												className={RECEPCION_FIELD_CLASSNAME}
												name='notes'
												rows={2}
												value={formik.values.notes}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												isValid={!formik.errors.notes}
												isTouched={Boolean(formik.touched.notes)}
												invalidFeedback={formik.errors.notes}
											/>
										</Validation>
									</div>
									<p className='text-xs text-zinc-500 dark:text-zinc-400'>
										<span className='text-red-500'>*</span> Campos obligatorios.
									</p>
								</CardBody>
							</Card>

							<Card className={RECEPCION_CARD_CLASSNAME}>
								<CardHeader className='pb-2'>
									<div>
										<CardTitle className='text-lg'>
											{isManual ? 'Productos recibidos' : '¿Qué llegó?'}
										</CardTitle>
										<p className={RECEPCION_SUBTITLE_CLASSNAME}>
											{linesSubtitle}
										</p>
									</div>
								</CardHeader>
								<CardBody>
									{isManual ? (
										<ManualLinesEditor
											formik={formik}
											productOptions={productOptions}
											isCostRequired={hasKnownSupplier}
											disabled={isLocked}
											fieldClassName={RECEPCION_FIELD_CLASSNAME}
											selectClassName={RECEPCION_SELECT_CLASSNAME}
											itemClassName={RECEPCION_ITEM_CLASSNAME}
										/>
									) : (
										<DocumentLinesEditor
											formik={formik}
											selectedDocument={selectedDocument}
											loading={loadingSelectedDocument}
											disabled={isLocked}
											fieldClassName={RECEPCION_FIELD_CLASSNAME}
										/>
									)}
								</CardBody>
							</Card>
						</fieldset>
					</ModalBody>
					<ModalFooter className='shrink-0 border-t border-zinc-200 bg-white pt-4 dark:border-zinc-700 dark:bg-zinc-950'>
						<ModalFooterChild>
							<p className='hidden max-w-xs text-xs text-zinc-500 dark:text-zinc-400 md:block'>
								El borrador no mueve stock. «Guardar e ingresar» lo suma a la bodega
								en cuanto termina de procesarse.
							</p>
						</ModalFooterChild>
						<ModalFooterChild className='flex-wrap justify-end'>
							{pendingIngress ? (
								<>
									{isPendingIngressForeign && (
										<Button
											variant='outline'
											color='red'
											icon='HeroXMark'
											isDisable={isSubmitting}
											onClick={handleClose}>
											Descartar
										</Button>
									)}
									<Button
										variant='outline'
										icon='HeroArrowTopRightOnSquare'
										isDisable={isSubmitting || isPendingIngressForeign}
										onClick={leavePendingIngress}>
										Ver la recepción #{pendingIngress.receipt.id}
									</Button>
									<Button
										variant='solid'
										color='emerald'
										icon='HeroArrowPath'
										isDisable={isSubmitting || isPendingIngressForeign}
										isLoading={isSubmitting}
										onClick={() => {
											retryIngress().catch(() => undefined);
										}}>
										Reintentar ingreso al stock
									</Button>
								</>
							) : (
								<Button
									variant='outline'
									onClick={handleClose}
									isDisable={isSubmitting}>
									Cancelar
								</Button>
							)}
							{!pendingIngress && canRetry && (
								<Button
									variant='solid'
									color='blue'
									icon='HeroArrowPath'
									isDisable={isSubmitting || hasVersionConflict}
									isLoading={isSubmitting}
									onClick={() => submitWith(submitIntent)}>
									{retryLabel}
								</Button>
							)}
							{!pendingIngress && !canRetry && (
								<>
									<Button
										variant='outline'
										color='blue'
										icon='HeroDocumentCheck'
										isDisable={isSubmitting || hasVersionConflict}
										isLoading={isSubmitting && submitIntent === 'save'}
										onClick={() => submitWith('save')}>
										{saveLabel}
									</Button>
									<Button
										variant='solid'
										color='emerald'
										icon='HeroArrowDownTray'
										isDisable={isSubmitting || hasVersionConflict}
										isLoading={isSubmitting && submitIntent === 'save_and_post'}
										onClick={() => submitWith('save_and_post')}>
										Guardar e ingresar al stock
									</Button>
								</>
							)}
						</ModalFooterChild>
					</ModalFooter>
				</form>
			</FormikProvider>
		</Modal>
	);
};

export default StockReceiptFormModal;
