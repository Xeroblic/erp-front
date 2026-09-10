import React from 'react';
import { FieldArray, FormikProvider } from 'formik';
import { purchasableProcurementProducts } from '@/mocks/db/procurement.db';
import { listWarehousesForStockReceipts } from '@/services/procurement/stockReceipts.service';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import SelectReact from '@/components/form/SelectReact';
import type { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import { CostInput } from '@/components/procurement';
import type { IStockReceipt } from '@/interface/procurement.interface';
import useRecepcionForm from '../../hooks/useRecepcionForm';
import useActiveSupplierOptions from '../../hooks/useActiveSupplierOptions';
import usePurchaseDocumentPicker from '../../hooks/usePurchaseDocumentPicker';
import { EMPTY_RECEPCION_LINE } from '../../types';
import type { TRecepcionFormMode } from '../../types';

/**
 * Alta (con documento o sin él) y corrección de recepción `draft`/`failed`
 * (card 05, sección 7). La corrección sólo se ofrece desde `allowed_actions`
 * de la ficha, así que acá no hay que resolver ese caso; el `mode` queda
 * fijo al abrir en edición.
 */

/** `received_on` sólo se cambia en `draft` (sección 7); en `failed` la corrección la vuelve `draft` recién al guardar. */
const existingReceiptIsDraftOnly = (isEdit: boolean, receipt: IStockReceipt | null): boolean =>
	isEdit && receipt !== null && receipt.status === 'failed';

interface IRecepcionFormModalProps {
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
	 * que `DocumentoCompraFormModal`.
	 */
	onStaleVersion?: () => void;
}

const RecepcionFormModal: React.FC<IRecepcionFormModalProps> = ({
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
	const { formik, isEdit, isSubmitting, hasVersionConflict, canRetry, reset } = useRecepcionForm({
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
	const { suppliers, loading: loadingSuppliers } = useActiveSupplierOptions(
		subsidiaryId,
		isOpen && isManual,
	);
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
	const documentOptions = documents.map((document) => ({
		value: String(document.id),
		label: `${document.document_number} · ${document.supplier?.display_name ?? 'Sin proveedor'}`,
	}));
	const documentLineOptions = (selectedDocument?.items ?? []).map((line) => ({
		value: String(line.id),
		label: `${line.sku_snapshot} · ${line.name_snapshot} (quedan ${line.remaining_quantity})`,
	}));

	const productOptions = purchasableProcurementProducts.map((product) => ({
		value: String(product.id),
		label: `${product.sku} · ${product.name}`,
	}));

	const handleClose = () => {
		if (isSubmitting) return;
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

	const handleModeChange = (mode: TRecepcionFormMode) => {
		formik.setFieldValue('mode', mode).catch(() => undefined);
		formik.setFieldValue('items', [{ ...EMPTY_RECEPCION_LINE }]).catch(() => undefined);
		if (mode === 'with_document') formik.setFieldValue('reason', '').catch(() => undefined);
		else formik.setFieldValue('purchase_document_id', '').catch(() => undefined);
	};

	// Hallazgo 8: mismo botón para reintentar (con el comando bloqueado) que
	// para el envío normal — evita un "Reintentar" separado que invitaría a
	// tocar los datos por otra vía.
	let submitLabel = isEdit ? 'Guardar corrección' : 'Crear recepción';
	if (canRetry) submitLabel = 'Reintentar';

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
						{isEdit ? 'Corregir recepción' : 'Nueva recepción'}
					</h2>
					<p className='text-sm font-normal text-zinc-600 dark:text-zinc-400'>
						Completa la bodega, las líneas recibidas y el respaldo documental.
					</p>
				</div>
			</ModalHeader>
			{/* `FieldArray` lee su bag de Formik vía contexto: sin `FormikProvider`,
			    `push`/`remove` no encuentran `items` porque este modal usa `useFormik`
			    directo. Mismo motivo que en `DocumentoCompraFormModal`. */}
			<FormikProvider value={formik}>
				<form
					className='flex min-h-0 flex-1 flex-col overflow-hidden'
					onSubmit={(event) => {
						if (hasVersionConflict) {
							event.preventDefault();
							return;
						}
						formik.handleSubmit(event);
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

						{canRetry && (
							<Alert
								color='amber'
								variant='outline'
								icon='HeroExclamationTriangle'
								title='No pudimos confirmar el envío anterior'>
								No sabemos si llegó al servidor. Los datos quedaron bloqueados para
								evitar duplicar la operación: vuelve a pulsar «
								{isEdit ? 'Guardar corrección' : 'Reintentar'}» sin cambiar nada, o
								cierra este formulario — al reabrirlo seguirá listo para reintentar.
							</Alert>
						)}

						{/* Hallazgo 8: bloquea todo el comando mientras el resultado
						    anterior sigue incierto — un `<fieldset disabled>` nativo
						    deshabilita inputs, selects nativos y botones descendientes de
						    una sola vez, así que un reintento reenvía exactamente lo que
						    ya se había enviado. */}
						<fieldset disabled={canRetry} className='m-0 space-y-4 border-0 p-0'>
							{!isEdit && (
								<div className='flex gap-2 rounded-xl border border-zinc-200 p-1 dark:border-zinc-700'>
									<Button
										type='button'
										variant={isManual ? 'solid' : 'outline'}
										color='blue'
										size='sm'
										className='flex-1'
										onClick={() => handleModeChange('manual')}>
										Sin documento
									</Button>
									<Button
										type='button'
										variant={!isManual ? 'solid' : 'outline'}
										color='blue'
										size='sm'
										className='flex-1'
										onClick={() => handleModeChange('with_document')}>
										Con documento
									</Button>
								</div>
							)}

							<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
								<div className='space-y-1'>
									<Label htmlFor='recepcion-warehouse'>Bodega</Label>
									<Select
										id='recepcion-warehouse'
										name='warehouse_id'
										value={formik.values.warehouse_id}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										isValid={!formik.errors.warehouse_id}
										isTouched={Boolean(formik.touched.warehouse_id)}
										invalidFeedback={formik.errors.warehouse_id}>
										<option value=''>Selecciona…</option>
										{warehouseOptions.map((warehouse) => (
											<option key={warehouse.id} value={warehouse.id}>
												{warehouse.name}
											</option>
										))}
									</Select>
								</div>

								<div className='space-y-1'>
									<Label htmlFor='recepcion-received-on'>
										Fecha de recepción
									</Label>
									<Input
										id='recepcion-received-on'
										name='received_on'
										type='date'
										// Hallazgo 6: `received_on` es inmutable en `failed`
										// (sección 7) — se corrige el resto del formulario, y
										// recién al guardar (que vuelve la recepción a
										// `draft`) la fecha vuelve a ser editable.
										disabled={existingReceiptIsDraftOnly(isEdit, receipt)}
										value={formik.values.received_on}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										isValid={!formik.errors.received_on}
										isTouched={Boolean(formik.touched.received_on)}
										invalidFeedback={formik.errors.received_on}
									/>
									{existingReceiptIsDraftOnly(isEdit, receipt) && (
										<p className='text-xs text-zinc-500'>
											No se puede cambiar mientras la recepción tiene un
											error. Guarda el resto de la corrección para volver a
											borrador y poder cambiarla.
										</p>
									)}
								</div>

								{!isManual && (
									<div className='space-y-1 sm:col-span-2'>
										<Label htmlFor='recepcion-document'>
											Documento confirmado
										</Label>
										<SelectReact
											name='purchase_document_id'
											inputId='recepcion-document'
											isDisabled={isEdit || canRetry}
											isLoading={loadingDocuments}
											options={documentOptions}
											placeholder='Selecciona un documento…'
											value={
												documentOptions.find(
													(option) =>
														option.value ===
														String(formik.values.purchase_document_id),
												) ?? null
											}
											onChange={(option) => {
												const selected = option as TSelectOption | null;
												if (Array.isArray(selected)) return;
												formik
													.setFieldValue(
														'purchase_document_id',
														selected ? Number(selected.value) : '',
													)
													.catch(() => undefined);
												formik
													.setFieldValue('items', [
														{ ...EMPTY_RECEPCION_LINE },
													])
													.catch(() => undefined);
											}}
											isValid={!formik.errors.purchase_document_id}
											isTouched={Boolean(formik.touched.purchase_document_id)}
											invalidFeedback={formik.errors.purchase_document_id}
										/>
										<p className='text-xs text-zinc-500'>
											Producto, proveedor y costo se derivan del documento: no
											se pueden sobrescribir.
										</p>
									</div>
								)}

								{isManual && (
									<div className='space-y-1'>
										<Label htmlFor='recepcion-supplier'>
											Proveedor (opcional)
										</Label>
										<SelectReact
											name='supplier_id'
											inputId='recepcion-supplier'
											isClearable
											isDisabled={canRetry}
											isLoading={loadingSuppliers}
											options={supplierOptions}
											placeholder='Sin proveedor conocido…'
											value={
												supplierOptions.find(
													(option) =>
														option.value ===
														String(formik.values.supplier_id),
												) ?? null
											}
											onChange={(option) => {
												const selected = option as TSelectOption | null;
												if (Array.isArray(selected)) return;
												formik
													.setFieldValue(
														'supplier_id',
														selected ? Number(selected.value) : '',
													)
													.catch(() => undefined);
											}}
											isValid={!formik.errors.supplier_id}
											isTouched={Boolean(formik.touched.supplier_id)}
											invalidFeedback={formik.errors.supplier_id}
										/>
										<p className='text-xs text-zinc-500'>
											Con proveedor conocido, el costo unitario es
											obligatorio.
										</p>
									</div>
								)}

								{isManual && (
									<div className='space-y-1'>
										<Label htmlFor='recepcion-reason'>Motivo</Label>
										<Input
											id='recepcion-reason'
											name='reason'
											value={formik.values.reason}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											isValid={!formik.errors.reason}
											isTouched={Boolean(formik.touched.reason)}
											invalidFeedback={formik.errors.reason}
										/>
									</div>
								)}
							</div>

							<div className='space-y-1'>
								<Label htmlFor='recepcion-notes'>Notas</Label>
								<Textarea
									id='recepcion-notes'
									name='notes'
									rows={2}
									value={formik.values.notes}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									isValid={!formik.errors.notes}
									isTouched={Boolean(formik.touched.notes)}
									invalidFeedback={formik.errors.notes}
								/>
							</div>

							<FieldArray name='items'>
								{(arrayHelpers) => (
									<div className='space-y-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700'>
										<div className='flex items-center justify-between'>
											<h3 className='font-semibold'>Líneas</h3>
											<Button
												type='button'
												variant='outline'
												size='sm'
												icon='HeroPlus'
												isDisable={!isManual && !selectedDocument}
												onClick={() =>
													arrayHelpers.push({ ...EMPTY_RECEPCION_LINE })
												}>
												Agregar línea
											</Button>
										</div>

										{!isManual && loadingSelectedDocument && (
											<p className='text-sm text-zinc-500'>
												Cargando líneas del documento…
											</p>
										)}
										{typeof formik.errors.items === 'string' && (
											<Alert
												color='red'
												variant='outline'
												icon='HeroExclamationTriangle'>
												{formik.errors.items}
											</Alert>
										)}

										{formik.values.items.map((line, index) => {
											const lineErrors = Array.isArray(formik.errors.items)
												? formik.errors.items[index]
												: undefined;
											const lineTouched = Array.isArray(formik.touched.items)
												? formik.touched.items[index]
												: undefined;
											const errorFor = (
												field: keyof typeof line,
											): string | undefined => {
												if (!lineErrors || typeof lineErrors === 'string')
													return undefined;
												const value = (
													lineErrors as Record<string, unknown>
												)[field];
												return typeof value === 'string'
													? value
													: undefined;
											};
											const touchedFor = (
												field: keyof typeof line,
											): boolean =>
												Boolean(
													lineTouched &&
														typeof lineTouched === 'object' &&
														(lineTouched as Record<string, unknown>)[
															field
														],
												);

											return (
												<div
													// eslint-disable-next-line react/no-array-index-key -- las líneas nuevas todavía no tienen id propio.
													key={index}
													className='grid grid-cols-1 gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60 lg:grid-cols-[minmax(0,2fr)_100px_minmax(0,1.5fr)_auto]'>
													{isManual ? (
														<div className='space-y-1'>
															<Label
																htmlFor={`items.${index}.product_id`}>
																Producto
															</Label>
															<SelectReact
																name={`items.${index}.product_id`}
																inputId={`items.${index}.product_id`}
																isDisabled={canRetry}
																options={productOptions}
																placeholder='Selecciona un producto…'
																value={
																	productOptions.find(
																		(option) =>
																			option.value ===
																			String(line.product_id),
																	) ?? null
																}
																onChange={(option) => {
																	const selected =
																		option as TSelectOption | null;
																	if (Array.isArray(selected))
																		return;
																	formik
																		.setFieldValue(
																			`items.${index}.product_id`,
																			selected
																				? Number(
																						selected.value,
																					)
																				: '',
																		)
																		.catch(() => undefined);
																}}
																isValid={!errorFor('product_id')}
																isTouched={touchedFor('product_id')}
																invalidFeedback={errorFor(
																	'product_id',
																)}
															/>
														</div>
													) : (
														<div className='space-y-1'>
															<Label
																htmlFor={`items.${index}.purchase_document_line_id`}>
																Línea del documento
															</Label>
															<SelectReact
																name={`items.${index}.purchase_document_line_id`}
																inputId={`items.${index}.purchase_document_line_id`}
																isDisabled={
																	!selectedDocument || canRetry
																}
																options={documentLineOptions}
																placeholder='Selecciona una línea…'
																value={
																	documentLineOptions.find(
																		(option) =>
																			option.value ===
																			String(
																				line.purchase_document_line_id,
																			),
																	) ?? null
																}
																onChange={(option) => {
																	const selected =
																		option as TSelectOption | null;
																	if (Array.isArray(selected))
																		return;
																	formik
																		.setFieldValue(
																			`items.${index}.purchase_document_line_id`,
																			selected
																				? Number(
																						selected.value,
																					)
																				: '',
																		)
																		.catch(() => undefined);
																}}
																isValid={
																	!errorFor(
																		'purchase_document_line_id',
																	)
																}
																isTouched={touchedFor(
																	'purchase_document_line_id',
																)}
																invalidFeedback={errorFor(
																	'purchase_document_line_id',
																)}
															/>
														</div>
													)}

													<div className='space-y-1'>
														<Label htmlFor={`items.${index}.quantity`}>
															Cantidad
														</Label>
														<Input
															id={`items.${index}.quantity`}
															name={`items.${index}.quantity`}
															type='number'
															min={1}
															value={line.quantity}
															onChange={formik.handleChange}
															onBlur={formik.handleBlur}
															isValid={!errorFor('quantity')}
															isTouched={touchedFor('quantity')}
															invalidFeedback={errorFor('quantity')}
														/>
													</div>

													{isManual ? (
														<CostInput
															amountName={`items.${index}.unit_cost`}
															basisName={`items.${index}.unit_cost_basis`}
															amountValue={line.unit_cost}
															basisValue={line.unit_cost_basis}
															onChange={formik.handleChange}
															onBlur={formik.handleBlur}
															amountError={
																touchedFor('unit_cost')
																	? errorFor('unit_cost')
																	: undefined
															}
															basisError={
																touchedFor('unit_cost_basis')
																	? errorFor('unit_cost_basis')
																	: undefined
															}
															showPreview={false}
														/>
													) : (
														<p className='self-end pb-2 text-xs text-zinc-500'>
															El costo se deriva del documento.
														</p>
													)}

													<div className='flex items-end'>
														<Button
															type='button'
															variant='outline'
															color='red'
															size='sm'
															icon='HeroTrash'
															onClick={() =>
																arrayHelpers.remove(index)
															}
															isDisable={
																formik.values.items.length === 1
															}>
															Quitar
														</Button>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</FieldArray>
						</fieldset>
					</ModalBody>
					<ModalFooter className='shrink-0 border-t border-zinc-200 bg-white pt-4 dark:border-zinc-700 dark:bg-zinc-950'>
						<ModalFooterChild>
							<Button
								variant='outline'
								onClick={handleClose}
								isDisable={isSubmitting}>
								Cancelar
							</Button>
						</ModalFooterChild>
						<ModalFooterChild>
							<Button
								type='submit'
								variant='solid'
								color='blue'
								icon='HeroCheck'
								isDisable={isSubmitting || hasVersionConflict}
								isLoading={isSubmitting}>
								{submitLabel}
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</form>
			</FormikProvider>
		</Modal>
	);
};

export default RecepcionFormModal;
