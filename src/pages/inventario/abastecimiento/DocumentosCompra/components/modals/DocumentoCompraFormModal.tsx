import React from 'react';
import { FieldArray, FormikProvider } from 'formik';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Checkbox from '@/components/form/Checkbox';
import DateInput from '@/components/form/DateInput';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import SelectReact from '@/components/form/SelectReact';
import type { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import { normalizeCostInput } from '@/components/procurement';
import type { IPurchaseDocument } from '@/interface/procurement.interface';
import { previewCostBreakdown } from '@/utils/procurementCost.util';
import {
	formatDecimalAmount,
	formatDecimalCents,
	parseDecimalString,
} from '@/utils/procurementDecimal.util';
import useDocumentoCompraForm from '../../hooks/useDocumentoCompraForm';
import useActiveSupplierOptions from '../../hooks/useActiveSupplierOptions';
import { EMPTY_DOCUMENTO_LINE } from '../../types';

/** Superficies equivalentes a Proveedor y al listado de ítems de Cotizaciones. */
const DOCUMENTO_CARD_CLASSNAME =
	'border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900';
const DOCUMENTO_ITEM_CLASSNAME =
	'rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50';
const DOCUMENTO_SUBTITLE_CLASSNAME = 'text-sm font-normal text-zinc-600 dark:text-zinc-400';
const MAX_DOCUMENT_DATE = new Date(2100, 11, 31);
const MAX_DOCUMENT_YEAR = 2100;
const DOCUMENTO_ITEM_GRID_CLASSNAME =
	'grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 lg:grid-cols-[110px_minmax(0,1fr)_190px_150px]';

const getLineGrossTotalCents = (
	quantity: string,
	unitCost: string,
	basis: 'net' | 'gross' | '',
): bigint | null => {
	const parsedQuantity = Number(quantity);
	if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0 || basis === '') return null;
	const preview = previewCostBreakdown(normalizeCostInput(unitCost), basis);
	const unitCents = preview ? parseDecimalString(preview.gross_unit_amount) : null;
	return unitCents === null ? null : unitCents * BigInt(parsedQuantity);
};

const formatGrossTotal = (cents: bigint | null) =>
	cents === null ? null : formatDecimalAmount(formatDecimalCents(cents), 'CLP');

/**
 * Alta y edición de documento de compra (card 03, sección 6). La edición
 * sólo se ofrece en `draft` — la ficha filtra `allowed_actions` antes de
 * abrir este modal, así que acá no hay que resolver ese caso.
 */

interface IDocumentoCompraFormModalProps {
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

const DocumentoCompraFormModal: React.FC<IDocumentoCompraFormModalProps> = ({
	isOpen,
	setIsOpen,
	subsidiaryId,
	document = null,
	etag = null,
	onSuccess,
	onStaleVersion,
}) => {
	const { formik, isEdit, isSubmitting, hasVersionConflict, productOptions, reset } =
		useDocumentoCompraForm({
			subsidiaryId,
			document,
			etag,
			onSuccess: (result) => {
				setIsOpen(false);
				onSuccess?.(result);
			},
		});
	const { suppliers, loading: loadingSuppliers } = useActiveSupplierOptions(subsidiaryId, isOpen);
	const supplierOptions = suppliers.map((supplier) => ({
		value: String(supplier.id),
		label: `${supplier.display_name} · ${supplier.rut}`,
	}));
	const shippingCalculatesVat = formik.values.shipping_cost_basis === 'net';
	const shippingTotalCents = formik.values.include_shipping
		? getLineGrossTotalCents(
				'1',
				formik.values.shipping_cost,
				formik.values.shipping_cost_basis,
			)
		: null;
	const documentTotalCents = formik.values.items.reduce(
		(total, line) =>
			total +
			(getLineGrossTotalCents(line.quantity, line.unit_cost, line.unit_cost_basis) ?? 0n),
		shippingTotalCents ?? 0n,
	);

	const handleClose = () => {
		if (isSubmitting) return;
		setIsOpen(false);
		reset();
	};

	const handleReload = () => {
		setIsOpen(false);
		reset();
		onStaleVersion?.();
	};

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
								title='Alguien más editó este documento'>
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
						<Card className={DOCUMENTO_CARD_CLASSNAME}>
							<CardHeader className='pb-2'>
								<div>
									<CardTitle className='text-lg'>Datos del documento</CardTitle>
									<p className={DOCUMENTO_SUBTITLE_CLASSNAME}>
										Identificación, proveedor e información de emisión.
									</p>
								</div>
							</CardHeader>
							<CardBody className='space-y-4'>
								<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
									<div className='space-y-1'>
										<Label htmlFor='documento-type'>
											Tipo de documento{' '}
											<span className='text-red-500'>*</span>
										</Label>
										<Select
											id='documento-type'
											name='document_type'
											value={formik.values.document_type}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											disabled={isEdit}>
											<option value='invoice'>Factura</option>
											<option value='receipt'>Boleta</option>
										</Select>
										{isEdit && (
											<p className='text-xs text-zinc-500'>
												El tipo de documento no se cambia al editar.
											</p>
										)}
									</div>

									<div className='space-y-1'>
										<Label htmlFor='documento-supplier'>
											Proveedor
											{formik.values.document_type === 'invoice' && (
												<span className='text-red-500'> *</span>
											)}
										</Label>
										<SelectReact
											name='supplier_id'
											inputId='documento-supplier'
											isClearable={formik.values.document_type === 'receipt'}
											isLoading={loadingSuppliers}
											options={supplierOptions}
											placeholder='Selecciona un proveedor…'
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
										{formik.values.document_type === 'receipt' && (
											<p className='text-xs text-zinc-500'>
												La boleta permite dejar el proveedor sin
												especificar.
											</p>
										)}
									</div>

									<div className='space-y-1'>
										<Label htmlFor='documento-number'>
											Folio <span className='text-red-500'>*</span>
										</Label>
										<Input
											id='documento-number'
											name='document_number'
											value={formik.values.document_number}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											isValid={!formik.errors.document_number}
											isTouched={Boolean(formik.touched.document_number)}
											invalidFeedback={formik.errors.document_number}
										/>
									</div>

									<div className='space-y-1'>
										<Label htmlFor='documento-issue-date'>
											Fecha de emisión <span className='text-red-500'>*</span>
										</Label>
										<DateInput
											id='documento-issue-date'
											name='issue_date'
											value={formik.values.issue_date}
											maxDate={MAX_DOCUMENT_DATE}
											maxYear={MAX_DOCUMENT_YEAR}
											onChange={formik.handleChange}
											onBlur={() =>
												formik
													.setFieldTouched('issue_date', true)
													.catch(() => undefined)
											}
											isValid={!formik.errors.issue_date}
											isTouched={Boolean(formik.touched.issue_date)}
											invalidFeedback={formik.errors.issue_date}
										/>
									</div>

									<div className='space-y-1 sm:col-span-2'>
										<Label htmlFor='documento-total-amount'>
											Total informativo (opcional)
										</Label>
										<Input
											id='documento-total-amount'
											name='total_amount'
											type='text'
											inputMode='decimal'
											placeholder='0,00'
											value={formik.values.total_amount}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											isValid={!formik.errors.total_amount}
											isTouched={Boolean(formik.touched.total_amount)}
											invalidFeedback={formik.errors.total_amount}
										/>
										<p className='text-xs text-zinc-500'>
											Sólo informativo: no reemplaza la suma de las líneas.
										</p>
									</div>
								</div>

								<div className='space-y-1'>
									<Label htmlFor='documento-notes'>Notas</Label>
									<Textarea
										id='documento-notes'
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
								<p className='text-xs text-zinc-500 dark:text-zinc-400'>
									<span className='text-red-500'>*</span> Campos obligatorios.
								</p>
							</CardBody>
						</Card>

						<Card className={DOCUMENTO_CARD_CLASSNAME}>
							<FieldArray name='items'>
								{(arrayHelpers) => (
									<>
										<CardHeader className='pb-2'>
											<CardHeaderChild className='w-full items-start justify-between gap-3'>
												<div>
													<CardTitle className='text-lg'>
														Líneas del documento
													</CardTitle>
													<p className={DOCUMENTO_SUBTITLE_CLASSNAME}>
														Agrega los productos, cantidades y costos de
														la compra.
													</p>
												</div>
												<div className='flex flex-wrap items-center justify-end gap-3'>
													<Checkbox
														id='include-shipping'
														name='include_shipping'
														checked={formik.values.include_shipping}
														onChange={(event) =>
															formik
																.setFieldValue(
																	'include_shipping',
																	event.target.checked,
																)
																.catch(() => undefined)
														}
														label='Agregar costo de envío'
														dimension='sm'
													/>
													<Button
														type='button'
														variant='outline'
														size='sm'
														icon='HeroPlus'
														onClick={() =>
															arrayHelpers.push({
																...EMPTY_DOCUMENTO_LINE,
															})
														}>
														Agregar línea
													</Button>
												</div>
											</CardHeaderChild>
										</CardHeader>
										<CardBody className='space-y-3'>
											{typeof formik.errors.items === 'string' && (
												<Alert
													color='red'
													variant='outline'
													icon='HeroExclamationTriangle'>
													{formik.errors.items}
												</Alert>
											)}

											{formik.values.items.map((line, index) => {
												const lineErrors = Array.isArray(
													formik.errors.items,
												)
													? formik.errors.items[index]
													: undefined;
												const lineTouched = Array.isArray(
													formik.touched.items,
												)
													? formik.touched.items[index]
													: undefined;
												const errorFor = (
													field: keyof typeof line,
												): string | undefined => {
													if (
														!lineErrors ||
														typeof lineErrors === 'string'
													)
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
															(
																lineTouched as Record<
																	string,
																	unknown
																>
															)[field],
													);
												const calculatesVat =
													line.unit_cost_basis === 'net';
												const grossTotal = formatGrossTotal(
													getLineGrossTotalCents(
														line.quantity,
														line.unit_cost,
														line.unit_cost_basis,
													),
												);

												return (
													<div
														// eslint-disable-next-line react/no-array-index-key -- las líneas nuevas todavía no tienen id propio.
														key={index}
														className={DOCUMENTO_ITEM_CLASSNAME}>
														<div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
															<span className='rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-500/30'>
																Línea {index + 1}
															</span>
															<Button
																type='button'
																variant='outline'
																color='red'
																size='xs'
																icon='HeroTrash'
																onClick={() =>
																	arrayHelpers.remove(index)
																}
																isDisable={
																	formik.values.items.length === 1
																}>
																Eliminar
															</Button>
														</div>
														<div
															className={
																DOCUMENTO_ITEM_GRID_CLASSNAME
															}>
															<div className='space-y-1'>
																<Label
																	htmlFor={`items.${index}.quantity`}>
																	Cantidad{' '}
																	<span className='text-red-500'>
																		*
																	</span>
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
																	isTouched={touchedFor(
																		'quantity',
																	)}
																	invalidFeedback={errorFor(
																		'quantity',
																	)}
																/>
															</div>
															<div className='space-y-1'>
																<Label
																	htmlFor={`items.${index}.product_id`}>
																	Producto{' '}
																	<span className='text-red-500'>
																		*
																	</span>
																</Label>
																<SelectReact
																	name={`items.${index}.product_id`}
																	inputId={`items.${index}.product_id`}
																	options={productOptions}
																	placeholder='Selecciona un producto…'
																	value={
																		productOptions.find(
																			(option) =>
																				option.value ===
																				String(
																					line.product_id,
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
																				`items.${index}.product_id`,
																				selected
																					? Number(
																							selected.value,
																						)
																					: '',
																			)
																			.catch(() => undefined);
																	}}
																	isValid={
																		!errorFor('product_id')
																	}
																	isTouched={touchedFor(
																		'product_id',
																	)}
																	invalidFeedback={errorFor(
																		'product_id',
																	)}
																/>
															</div>
															<div className='space-y-2'>
																<Label
																	htmlFor={`items.${index}.unit_cost`}>
																	{calculatesVat
																		? 'Costo neto'
																		: 'Costo bruto c/ IVA'}{' '}
																	<span className='text-red-500'>
																		*
																	</span>
																</Label>
																<Input
																	id={`items.${index}.unit_cost`}
																	name={`items.${index}.unit_cost`}
																	type='text'
																	inputMode='decimal'
																	placeholder='0,00'
																	value={line.unit_cost}
																	onChange={formik.handleChange}
																	onBlur={formik.handleBlur}
																	isValid={!errorFor('unit_cost')}
																	isTouched={touchedFor(
																		'unit_cost',
																	)}
																	invalidFeedback={errorFor(
																		'unit_cost',
																	)}
																/>
																<Checkbox
																	id={`items.${index}.unit_cost_basis`}
																	name={`items.${index}.unit_cost_basis`}
																	checked={calculatesVat}
																	onChange={(event) =>
																		formik
																			.setFieldValue(
																				`items.${index}.unit_cost_basis`,
																				event.target.checked
																					? 'net'
																					: 'gross',
																			)
																			.catch(() => undefined)
																	}
																	label='Calcular IVA'
																	dimension='sm'
																/>
																{touchedFor('unit_cost_basis') &&
																	errorFor('unit_cost_basis') && (
																		<p
																			role='alert'
																			className='text-xs text-red-500/70'>
																			{errorFor(
																				'unit_cost_basis',
																			)}
																		</p>
																	)}
															</div>
															<div className='space-y-1'>
																<Label
																	htmlFor={`items.${index}.total`}>
																	Total
																</Label>
																<output
																	id={`items.${index}.total`}
																	className='block rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100'>
																	{grossTotal ?? '—'}
																</output>
															</div>
														</div>
													</div>
												);
											})}

											{formik.values.include_shipping && (
												<div className={DOCUMENTO_ITEM_CLASSNAME}>
													<div className='mb-2'>
														<span className='rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/30'>
															Envío
														</span>
													</div>
													<div className={DOCUMENTO_ITEM_GRID_CLASSNAME}>
														<div className='space-y-1'>
															<Label htmlFor='shipping-quantity'>
																Cantidad
															</Label>
															<Input
																id='shipping-quantity'
																name='shipping_quantity'
																value='1'
																disabled
															/>
														</div>
														<div className='space-y-1'>
															<Label htmlFor='shipping-description'>
																Descripción
															</Label>
															<Input
																id='shipping-description'
																name='shipping_description'
																value='Costo de envío'
																disabled
															/>
														</div>
														<div className='space-y-2'>
															<Label htmlFor='shipping-cost'>
																{shippingCalculatesVat
																	? 'Costo neto'
																	: 'Costo bruto c/ IVA'}{' '}
																<span className='text-red-500'>
																	*
																</span>
															</Label>
															<Input
																id='shipping-cost'
																name='shipping_cost'
																type='text'
																inputMode='decimal'
																placeholder='0,00'
																value={formik.values.shipping_cost}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
																isValid={
																	!formik.errors.shipping_cost
																}
																isTouched={Boolean(
																	formik.touched.shipping_cost,
																)}
																invalidFeedback={
																	formik.errors.shipping_cost
																}
															/>
															<Checkbox
																id='shipping-cost-basis'
																name='shipping_cost_basis'
																checked={shippingCalculatesVat}
																onChange={(event) =>
																	formik
																		.setFieldValue(
																			'shipping_cost_basis',
																			event.target.checked
																				? 'net'
																				: 'gross',
																		)
																		.catch(() => undefined)
																}
																label='Calcular IVA'
																dimension='sm'
															/>
														</div>
														<div className='space-y-1'>
															<Label htmlFor='shipping-total'>
																Total
															</Label>
															<output
																id='shipping-total'
																className='block rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100'>
																{formatGrossTotal(
																	shippingTotalCents,
																) ?? '—'}
															</output>
														</div>
													</div>
												</div>
											)}

											<div className='flex justify-end rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900'>
												<div className='text-right'>
													<p className='text-xs text-zinc-500 dark:text-zinc-400'>
														Total calculado
													</p>
													<p className='text-lg font-semibold tabular-nums'>
														{formatGrossTotal(documentTotalCents) ??
															'$0,00'}
													</p>
												</div>
											</div>
										</CardBody>
									</>
								)}
							</FieldArray>
						</Card>
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
								{isEdit ? 'Guardar cambios' : 'Crear documento'}
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</form>
			</FormikProvider>
		</Modal>
	);
};

export default DocumentoCompraFormModal;
