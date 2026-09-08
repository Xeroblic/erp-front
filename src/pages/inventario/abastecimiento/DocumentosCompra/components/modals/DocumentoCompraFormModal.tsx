import React from 'react';
import { FieldArray, FormikProvider } from 'formik';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import SelectReact from '@/components/form/SelectReact';
import type { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import { CostInput } from '@/components/procurement';
import type { IPurchaseDocument } from '@/interface/procurement.interface';
import useDocumentoCompraForm from '../../hooks/useDocumentoCompraForm';
import useActiveSupplierOptions from '../../hooks/useActiveSupplierOptions';
import { EMPTY_DOCUMENTO_LINE } from '../../types';

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
			isStaticBackdrop={isSubmitting}>
			<ModalHeader>
				{isEdit ? 'Editar documento de compra' : 'Nuevo documento de compra'}
			</ModalHeader>
			{/* `FieldArray` sólo lee su bag de Formik vía contexto (`useFormikContext`):
			    sin este `FormikProvider`, `push`/`remove` no encuentran `items` porque
			    este modal usa el hook `useFormik` directo, no el componente `<Formik>`
			    que lo provee automáticamente. */}
			<FormikProvider value={formik}>
				<form
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
					<ModalBody className='space-y-4'>
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
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
							<div className='space-y-1'>
								<Label htmlFor='documento-type'>Tipo de documento</Label>
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
												option.value === String(formik.values.supplier_id),
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
										La boleta permite dejar el proveedor sin especificar.
									</p>
								)}
							</div>

							<div className='space-y-1'>
								<Label htmlFor='documento-number'>Folio</Label>
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
								<Label htmlFor='documento-issue-date'>Fecha de emisión</Label>
								<Input
									id='documento-issue-date'
									name='issue_date'
									type='date'
									value={formik.values.issue_date}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									isValid={!formik.errors.issue_date}
									isTouched={Boolean(formik.touched.issue_date)}
									invalidFeedback={formik.errors.issue_date}
								/>
							</div>

							<div className='space-y-1'>
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
											onClick={() =>
												arrayHelpers.push({ ...EMPTY_DOCUMENTO_LINE })
											}>
											Agregar línea
										</Button>
									</div>

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
											const value = (lineErrors as Record<string, unknown>)[
												field
											];
											return typeof value === 'string' ? value : undefined;
										};
										const touchedFor = (field: keyof typeof line): boolean =>
											Boolean(
												lineTouched &&
													typeof lineTouched === 'object' &&
													(lineTouched as Record<string, unknown>)[field],
											);

										return (
											<div
												// eslint-disable-next-line react/no-array-index-key -- las líneas nuevas todavía no tienen id propio.
												key={index}
												className='grid grid-cols-1 gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60 lg:grid-cols-[minmax(0,2fr)_100px_minmax(0,1.5fr)_auto]'>
												<div className='space-y-1'>
													<Label htmlFor={`items.${index}.product_id`}>
														Producto
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
																	String(line.product_id),
															) ?? null
														}
														onChange={(option) => {
															const selected =
																option as TSelectOption | null;
															if (Array.isArray(selected)) return;
															formik
																.setFieldValue(
																	`items.${index}.product_id`,
																	selected
																		? Number(selected.value)
																		: '',
																)
																.catch(() => undefined);
														}}
														isValid={!errorFor('product_id')}
														isTouched={touchedFor('product_id')}
														invalidFeedback={errorFor('product_id')}
													/>
												</div>

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

												<div className='flex items-end'>
													<Button
														type='button'
														variant='outline'
														color='red'
														size='sm'
														icon='HeroTrash'
														onClick={() => arrayHelpers.remove(index)}
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
					</ModalBody>
					<ModalFooter>
						<Button variant='outline' onClick={handleClose} isDisable={isSubmitting}>
							Cancelar
						</Button>
						<Button
							type='submit'
							variant='solid'
							color='blue'
							isDisable={isSubmitting || hasVersionConflict}
							isLoading={isSubmitting}>
							{isEdit ? 'Guardar cambios' : 'Crear documento'}
						</Button>
					</ModalFooter>
				</form>
			</FormikProvider>
		</Modal>
	);
};

export default DocumentoCompraFormModal;
