import React from 'react';
import type { FormikProps } from 'formik';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import DateInput from '@/components/form/DateInput';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import { formatPesoInput } from '@/utils/procurementDecimal.util';
import {
	DOCUMENTO_CARD_CLASSNAME,
	DOCUMENTO_SUBTITLE_CLASSNAME,
} from './purchaseDocumentFormStyles';
import type { IPurchaseDocumentFormValues } from '../../types';

const MAX_DOCUMENT_DATE = new Date(2100, 11, 31);
const MAX_DOCUMENT_YEAR = 2100;

interface IPurchaseDocumentHeaderCardProps {
	formik: FormikProps<IPurchaseDocumentFormValues>;
	isEdit: boolean;
	/** Sin permiso para listar proveedores no se puede elegir el que exige la factura. */
	isInvoiceUnavailable: boolean;
	/** Campo de proveedor, que va entre el tipo y el folio. */
	supplierField: React.ReactNode;
	/** Guarda en Formik el monto sin el formato peso con que se muestra. */
	onPesoChange: (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/** «Datos del documento»: tipo, proveedor, folio, emisión, total informativo y notas. */
const PurchaseDocumentHeaderCard: React.FC<IPurchaseDocumentHeaderCardProps> = ({
	formik,
	isEdit,
	isInvoiceUnavailable,
	supplierField,
	onPesoChange,
}) => (
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
					{/* Misma altura que la fila de Proveedor, que lleva el botón «Nuevo proveedor». */}
					<div className='flex min-h-6 items-center'>
						<Label htmlFor='documento-type'>
							Tipo de documento <span className='text-red-500'>*</span>
						</Label>
					</div>
					<Select
						id='documento-type'
						// `Select` pinta el borde con el color del tema aunque no tenga
						// foco y parece seleccionado: acá el borde en reposo es gris,
						// como el de `Input`, y el fondo blanco. Hover y foco no cambian.
						className='bg-white! dark:bg-zinc-900!'
						style={
							{
								'--select-border': '#d4d4d8',
							} as React.CSSProperties
						}
						name='document_type'
						value={formik.values.document_type}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
						disabled={isEdit}>
						<option value='invoice' disabled={isInvoiceUnavailable}>
							Factura
						</option>
						<option value='receipt'>Boleta</option>
					</Select>
					{isInvoiceUnavailable && (
						<p className='text-xs text-amber-700 dark:text-amber-400'>
							Para registrar una factura necesitas también permiso para ver
							proveedores (view-procurement-supplier).
						</p>
					)}
					{isEdit && (
						<p className='text-xs text-zinc-500'>
							El tipo de documento no se cambia al editar.
						</p>
					)}
				</div>

				{supplierField}

				<div className='space-y-1'>
					<Label htmlFor='documento-number'>
						Folio <span className='text-red-500'>*</span>
					</Label>
					<Input
						id='documento-number'
						className='bg-white! dark:bg-zinc-900!'
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
						className='bg-white! dark:bg-zinc-900!'
						value={formik.values.issue_date}
						maxDate={MAX_DOCUMENT_DATE}
						maxYear={MAX_DOCUMENT_YEAR}
						onChange={formik.handleChange}
						onBlur={() =>
							formik.setFieldTouched('issue_date', true).catch(() => undefined)
						}
						isValid={!formik.errors.issue_date}
						isTouched={Boolean(formik.touched.issue_date)}
						invalidFeedback={formik.errors.issue_date}
					/>
				</div>

				<div className='space-y-1 sm:col-span-2'>
					<Label htmlFor='documento-total-amount'>
						Total informativo (con IVA, opcional)
					</Label>
					<Input
						id='documento-total-amount'
						className='bg-white! dark:bg-zinc-900!'
						name='total_amount'
						type='text'
						inputMode='decimal'
						placeholder='$0'
						value={formatPesoInput(formik.values.total_amount)}
						onChange={onPesoChange('total_amount')}
						onBlur={formik.handleBlur}
						isValid={!formik.errors.total_amount}
						isTouched={Boolean(formik.touched.total_amount)}
						invalidFeedback={formik.errors.total_amount}
					/>
					<p className='text-xs text-zinc-500'>
						El total impreso en el documento, IVA incluido. Sólo informativo: no
						reemplaza la suma de las líneas.
					</p>
				</div>
			</div>

			<div className='space-y-1'>
				<Label htmlFor='documento-notes'>Notas</Label>
				<Textarea
					id='documento-notes'
					className='bg-white! dark:bg-zinc-900!'
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
);

export default PurchaseDocumentHeaderCard;
