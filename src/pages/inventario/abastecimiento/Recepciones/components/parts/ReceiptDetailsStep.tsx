import React from 'react';
import type { FormikProps } from 'formik';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import DateInput from '@/components/form/DateInput';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import SelectReact from '@/components/form/SelectReact';
import type { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import Validation from '@/components/form/Validation';
import { STOCK_RECEIPTS_USE_TEST_SUPPLIERS } from '@/services/procurement/stockReceipts.service';
import type { IStockReceipt, IWarehouseCompact } from '@/interface/procurement.interface';
import SupplierOptionsNotice from '@/pages/inventario/abastecimiento/DocumentosCompra/components/parts/SupplierOptionsNotice';
import type { TSupplierOptionsUnavailableReason } from '@/pages/inventario/abastecimiento/DocumentosCompra/hooks/useActiveSupplierOptions';
import {
	RECEPCION_CARD_CLASSNAME,
	RECEPCION_FIELD_CLASSNAME,
	RECEPCION_SELECT_CLASSNAME,
	RECEPCION_SUBTITLE_CLASSNAME,
} from './stockReceiptFormStyles';
import type { IStockReceiptFormValues } from '../../types';

/** `received_on` sólo se cambia en `draft` (sección 7); en `failed` la corrección la vuelve `draft` recién al guardar. */
const existingReceiptIsDraftOnly = (isEdit: boolean, receipt: IStockReceipt | null): boolean =>
	isEdit && receipt !== null && receipt.status === 'failed';

const RequiredMark: React.FC = () => <span className='text-red-500'> *</span>;

interface IReceiptDetailsStepProps {
	formik: FormikProps<IStockReceiptFormValues>;
	isEdit: boolean;
	/** Recepción en corrección; `null` en alta. */
	receipt: IStockReceipt | null;
	/** Resultado incierto pendiente: el formulario no se edita. */
	isLocked: boolean;
	documentOptions: TSelectOption[];
	loadingDocuments: boolean;
	warehouseOptions: readonly IWarehouseCompact[];
	loadingWarehouses: boolean;
	/** Mensaje del fallo al cargar las bodegas; `null` si cargaron. */
	warehousesError: string | null;
	onRetryWarehouses: () => void;
	supplierOptions: TSelectOption[];
	loadingSuppliers: boolean;
	suppliersUnavailableReason: TSupplierOptionsUnavailableReason | null;
	onRetrySuppliers: () => void;
}

/**
 * Paso 2 del alta: qué documento respalda la entrega (o por qué entra sin
 * documento), a qué bodega y cuándo llegó.
 */
const ReceiptDetailsStep: React.FC<IReceiptDetailsStepProps> = ({
	formik,
	isEdit,
	receipt,
	isLocked,
	documentOptions,
	loadingDocuments,
	warehouseOptions,
	loadingWarehouses,
	warehousesError,
	onRetryWarehouses,
	supplierOptions,
	loadingSuppliers,
	suppliersUnavailableReason,
	onRetrySuppliers,
}) => {
	const isManual = formik.values.mode === 'manual';

	return (
		<>
			{/* Con datos simulados, `usePurchaseDocumentPicker` lee los documentos
			    del doble, no los registrados en Documentos de compra. */}
			{!isManual && STOCK_RECEIPTS_USE_TEST_SUPPLIERS && (
				<Alert
					color='amber'
					variant='outline'
					icon='HeroExclamationTriangle'
					title='Documentos de prueba'>
					Los documentos de esta lista son de prueba, no los registrados en Documentos de
					compra.
				</Alert>
			)}

			<Card className={RECEPCION_CARD_CLASSNAME}>
				<CardHeader className='pb-2'>
					<div>
						<CardTitle className='text-lg'>Datos de la recepción</CardTitle>
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
									isTouched={Boolean(formik.touched.purchase_document_id)}
									invalidFeedback={formik.errors.purchase_document_id}>
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
											// Otro documento, otras líneas: se precargan
											// de nuevo al llegar su ficha.
											formik
												.setFieldValue('items', [])
												.catch(() => undefined);
										}}
										isValid={!formik.errors.purchase_document_id}
										isTouched={Boolean(formik.touched.purchase_document_id)}
										invalidFeedback={formik.errors.purchase_document_id}
									/>
								</Validation>
								<p className='text-xs text-zinc-500'>
									Sólo aparecen documentos confirmados. Proveedor y costos se
									toman del documento.
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
									<option value=''>
										{loadingWarehouses ? 'Cargando bodegas…' : 'Selecciona…'}
									</option>
									{warehouseOptions.map((warehouse) => (
										<option key={warehouse.id} value={warehouse.id}>
											{warehouse.name}
										</option>
									))}
								</Select>
							</Validation>
							{warehousesError !== null && (
								<div role='status' className='flex flex-wrap items-center gap-2'>
									<p className='text-xs text-red-600 dark:text-red-400'>
										{warehousesError}
									</p>
									<Button
										type='button'
										size='xs'
										variant='ghost'
										color='blue'
										onClick={onRetryWarehouses}>
										Reintentar
									</Button>
								</div>
							)}
							{!loadingWarehouses &&
								warehousesError === null &&
								warehouseOptions.length === 0 && (
									<p className='text-xs text-zinc-500'>
										Tus sucursales autorizadas no tienen bodegas activas.
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
									// `received_on` es inmutable en `failed`
									// (sección 7) — se corrige el resto del formulario, y
									// recién al guardar (que vuelve la recepción a
									// `draft`) la fecha vuelve a ser editable.
									disabled={existingReceiptIsDraftOnly(isEdit, receipt)}
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
									No se puede cambiar mientras la recepción tiene un error. Guarda
									el resto de la corrección para volver a borrador y poder
									cambiarla.
								</p>
							)}
						</div>

						{isManual && (
							<div className='space-y-1'>
								<Label htmlFor='recepcion-supplier'>Proveedor (opcional)</Label>
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
								</Validation>
								<SupplierOptionsNotice
									reason={suppliersUnavailableReason}
									onRetry={onRetrySuppliers}
								/>
								<p className='text-xs text-zinc-500'>
									Si lo indicas, el costo de cada producto pasa a ser obligatorio.
									{STOCK_RECEIPTS_USE_TEST_SUPPLIERS &&
										' Son proveedores de prueba, no los registrados en Proveedores.'}
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
		</>
	);
};

export default ReceiptDetailsStep;
