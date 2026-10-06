import React from 'react';
import type { FormikProps } from 'formik';
import ProtectedButton from '@/components/ui/ProtectedButton';
import Label from '@/components/form/Label';
import SelectReact from '@/components/form/SelectReact';
import type { TSelectOption } from '@/components/form/SelectReact';
import SupplierOptionsNotice from './SupplierOptionsNotice';
import type { TSupplierOptionsUnavailableReason } from '../../hooks/useActiveSupplierOptions';
import type { IPurchaseDocumentFormValues } from '../../types';

interface IPurchaseDocumentSupplierPickerProps {
	formik: FormikProps<IPurchaseDocumentFormValues>;
	subsidiaryId: number | null;
	supplierOptions: TSelectOption[];
	loadingSuppliers: boolean;
	canListSuppliers: boolean;
	suppliersUnavailableReason: TSupplierOptionsUnavailableReason | null;
	onRetrySuppliers: () => void;
	isSubmitting: boolean;
	/** Proveedor elegido, o `null` sin proveedor. */
	selectedSupplierId: number | null;
	isLoadingSupplier: boolean;
	/** Abre la edición en línea del proveedor elegido. */
	onEditSupplier: (supplierId: number) => void;
	/** Abre el alta en línea de un proveedor nuevo. */
	onCreateSupplier: () => void;
}

/**
 * Proveedor del documento, con sus atajos en línea: «Editar proveedor» (para
 * completar giro o direcciones sin ir a la ficha) y «Nuevo proveedor». La
 * factura lo exige; la boleta permite dejarlo sin especificar.
 */
const PurchaseDocumentSupplierPicker: React.FC<IPurchaseDocumentSupplierPickerProps> = ({
	formik,
	subsidiaryId,
	supplierOptions,
	loadingSuppliers,
	canListSuppliers,
	suppliersUnavailableReason,
	onRetrySuppliers,
	isSubmitting,
	selectedSupplierId,
	isLoadingSupplier,
	onEditSupplier,
	onCreateSupplier,
}) => (
	<div className='space-y-1'>
		<div className='flex min-h-6 items-center justify-between gap-2'>
			<Label htmlFor='documento-supplier'>
				Proveedor
				{formik.values.document_type === 'invoice' && (
					<span className='text-red-500'> *</span>
				)}
			</Label>
			<div className='flex shrink-0 items-center gap-2'>
				{/* Evita ir a la ficha sólo para completar giro o direcciones. */}
				{selectedSupplierId !== null && (
					<ProtectedButton
						type='button'
						permission='edit-procurement-supplier'
						subsidiaryId={subsidiaryId}
						scope='access'
						fallbackMode='hidden'
						size='xs'
						variant='outline'
						color='zinc'
						icon='HeroPencilSquare'
						className='whitespace-nowrap'
						isDisable={isSubmitting || isLoadingSupplier}
						isLoading={isLoadingSupplier}
						onClick={() => onEditSupplier(selectedSupplierId)}>
						Editar proveedor
					</ProtectedButton>
				)}
				<ProtectedButton
					type='button'
					permission='create-procurement-supplier'
					subsidiaryId={subsidiaryId}
					scope='access'
					fallbackMode='hidden'
					size='xs'
					variant='outline'
					color='blue'
					icon='HeroPlus'
					className='whitespace-nowrap'
					isDisable={isSubmitting}
					onClick={onCreateSupplier}>
					Nuevo proveedor
				</ProtectedButton>
			</div>
		</div>
		<SelectReact
			name='supplier_id'
			inputId='documento-supplier'
			isClearable={formik.values.document_type === 'receipt'}
			isLoading={loadingSuppliers}
			isDisabled={!canListSuppliers}
			options={supplierOptions}
			placeholder='Selecciona un proveedor…'
			value={
				supplierOptions.find(
					(option) => option.value === String(formik.values.supplier_id),
				) ?? null
			}
			onChange={(option) => {
				const selected = option as TSelectOption | null;
				if (Array.isArray(selected)) return;
				formik
					.setFieldValue('supplier_id', selected ? Number(selected.value) : '')
					.catch(() => undefined);
			}}
			isValid={!formik.errors.supplier_id}
			isTouched={Boolean(formik.touched.supplier_id)}
			invalidFeedback={formik.errors.supplier_id}
		/>
		<SupplierOptionsNotice reason={suppliersUnavailableReason} onRetry={onRetrySuppliers} />
		{formik.values.document_type === 'receipt' && (
			<p className='text-xs text-zinc-500'>
				La boleta permite dejar el proveedor sin especificar.
			</p>
		)}
	</div>
);

export default PurchaseDocumentSupplierPicker;
