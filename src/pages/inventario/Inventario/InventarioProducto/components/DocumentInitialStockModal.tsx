import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
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
import SelectReact from '@/components/form/SelectReact';
import type { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import { createInventoryDocumentAllocationThunk } from '@/store/slices/procurement/inventoryStockSlice';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import usePurchaseDocumentPicker from '@/pages/inventario/abastecimiento/Recepciones/hooks/usePurchaseDocumentPicker';
import type { IInventoryStockOriginRow } from '@/interface/procurement.interface';
import {
	createDocumentInitialStockSchema,
	DOCUMENT_INITIAL_STOCK_INITIAL_VALUES,
	type IDocumentInitialStockValues,
} from './documentInitialStock.schema';

/**
 * `POST B/inventory-stock/{product}/document-allocations` (§8): respalda
 * documentalmente una porción del stock inicial de un `origin` todavía sin
 * documento. **Nunca ingresa mercadería**: `physical_stock_delta` es siempre
 * `0`, igual que en `LinkPurchaseDocumentModal`, y la pantalla lo dice.
 *
 * `warehouse_id` no viaja en `IInventoryStockOriginRow` (§3: la fila de
 * procedencia no lo declara) — lo resuelve el llamador
 * desde el `context` de la consulta vigente (`InventoryOrigins`), que sólo es
 * inequívoco cuando el filtro de ubicación ya apunta a una bodega concreta o
 * a Sin ubicación, nunca a «sucursal completa» (ambigua entre bodegas).
 */

interface IDocumentInitialStockModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	subsidiaryId: number | null;
	branchId: number;
	productId: number;
	warehouseId: number | null;
	origin: Pick<IInventoryStockOriginRow, 'origin_id' | 'physical_quantity'> | null;
	onDocumented: (quantity: number) => void;
}

const DocumentInitialStockModal: React.FC<IDocumentInitialStockModalProps> = ({
	isOpen,
	setIsOpen,
	subsidiaryId,
	branchId,
	productId,
	warehouseId,
	origin,
	onDocumented,
}) => {
	const dispatch = useAppDispatch();
	const isMountedRef = useRef(true);
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);
	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo respaldar el stock inicial.',
		renewKeyOnDefinitiveError: true,
	});

	// Las líneas dependen del documento elegido, y los límites de la cantidad de
	// esas líneas: el picker lee el documento antes de que exista el formulario.
	const [pickerDocumentId, setPickerDocumentId] = useState<number | ''>('');
	const { documents, loadingDocuments, selectedDocument, loadingSelectedDocument } =
		// Los documentos de la misma fuente que el stock que se respalda.
		usePurchaseDocumentPicker(
			subsidiaryId,
			isOpen,
			pickerDocumentId,
			INVENTORY_STOCK_USE_MOCKS,
		);

	const documentOptions = documents.map((document) => ({
		value: String(document.id),
		label: `${document.document_number} · ${document.supplier?.display_name ?? 'Sin proveedor'}`,
	}));

	// El producto ya está fijo (viene del origin): sólo se ofrecen líneas del
	// mismo producto — una línea de otro producto siempre terminaría en
	// `DOCUMENT_LINE_MISMATCH` al confirmar.
	const compatibleLines = useMemo(
		() => (selectedDocument?.items ?? []).filter((line) => line.product.id === productId),
		[selectedDocument, productId],
	);
	const lineOptions = compatibleLines.map((line) => ({
		value: String(line.id),
		label: `${line.sku_snapshot} · ${line.name_snapshot} (quedan ${line.remaining_quantity})`,
	}));

	const schema = useMemo(
		() =>
			createDocumentInitialStockSchema(
				origin?.physical_quantity ?? 0,
				(lineId) => compatibleLines.find((line) => line.id === lineId)?.remaining_quantity,
			),
		[origin?.physical_quantity, compatibleLines],
	);

	const formik = useFormik<IDocumentInitialStockValues>({
		initialValues: DOCUMENT_INITIAL_STOCK_INITIAL_VALUES,
		validationSchema: schema,
		onSubmit: async (values) => {
			if (!origin) return;
			const result = await idempotentWrite.submit((headers) =>
				dispatch(
					createInventoryDocumentAllocationThunk({
						subsidiaryId,
						branchId,
						productId,
						payload: {
							origin_id: origin.origin_id,
							warehouse_id: warehouseId,
							purchase_document_line_id: Number(values.lineId),
							quantity: Number(values.quantity),
							reason: values.reason.trim(),
						},
						headers: { idempotencyKey: headers['Idempotency-Key'] },
					}),
				).unwrap(),
			);

			if (result && isMountedRef.current) {
				toast.success(
					`Respaldadas ${result.quantity} unidades de la procedencia #${origin.origin_id}.`,
				);
				setIsOpen(false);
				formik.resetForm();
				setPickerDocumentId('');
				idempotentWrite.clearError();
				onDocumented(result.quantity);
			}
		},
	});

	const handleClose = () => {
		if (idempotentWrite.isSubmitting) return;
		setIsOpen(false);
		// Con un resultado incierto (`canRetry`) conserva la selección y la clave:
		// al reabrir se reintenta exactamente el mismo comando, sin duplicarlo.
		if (!idempotentWrite.canRetry) {
			formik.resetForm();
			setPickerDocumentId('');
			idempotentWrite.clearError();
		}
	};

	const canSubmit = Boolean(origin) && schema.isValidSync(formik.values);

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={(open) => {
				if (!open) handleClose();
			}}
			size='md'
			isCentered
			isStaticBackdrop={idempotentWrite.isSubmitting}>
			<ModalHeader className='border-b border-zinc-200 pb-4 dark:border-zinc-700'>
				<h2 className='text-xl font-bold text-zinc-900 dark:text-white'>
					Documentar stock inicial
				</h2>
			</ModalHeader>
			<ModalBody className='space-y-4'>
				<p className='text-lg'>
					Respaldar unidades de la procedencia <strong>#{origin?.origin_id}</strong>
				</p>
				<Alert
					color='blue'
					variant='outline'
					icon='HeroInformationCircle'
					title='Esto no mueve stock'>
					No ingresa mercadería ni cambia el físico: sólo respalda documentalmente
					unidades que ya están en bodega. El físico sigue siendo{' '}
					{origin?.physical_quantity} unidades, ahora repartidas entre documentadas y sin
					documento.
				</Alert>

				<div className='space-y-1'>
					<Label htmlFor='allocation-document'>Documento confirmado</Label>
					<SelectReact
						name='documentId'
						inputId='allocation-document'
						isDisabled={idempotentWrite.canRetry}
						isLoading={loadingDocuments}
						options={documentOptions}
						placeholder='Selecciona un documento…'
						value={
							documentOptions.find(
								(option) => option.value === formik.values.documentId,
							) ?? null
						}
						onChange={(option) => {
							const selected = option as TSelectOption | null;
							if (Array.isArray(selected)) return;
							const nextDocumentId = selected ? selected.value : '';
							void formik.setValues({
								...formik.values,
								documentId: nextDocumentId,
								lineId: '',
							});
							setPickerDocumentId(
								nextDocumentId === '' ? '' : Number(nextDocumentId),
							);
						}}
					/>
				</div>

				{loadingSelectedDocument && (
					<p className='text-sm text-zinc-500'>Cargando líneas del documento…</p>
				)}
				{selectedDocument && lineOptions.length === 0 && (
					<p className='text-sm text-amber-600 dark:text-amber-400'>
						Este documento no tiene una línea del mismo producto.
					</p>
				)}

				{lineOptions.length > 0 && (
					<div className='space-y-1'>
						<Label htmlFor='allocation-line'>Línea del documento</Label>
						<SelectReact
							name='lineId'
							inputId='allocation-line'
							isDisabled={idempotentWrite.canRetry}
							options={lineOptions}
							placeholder='Selecciona una línea…'
							value={
								lineOptions.find(
									(option) => option.value === formik.values.lineId,
								) ?? null
							}
							onChange={(option) => {
								const selected = option as TSelectOption | null;
								if (Array.isArray(selected)) return;
								void formik.setFieldValue('lineId', selected ? selected.value : '');
							}}
						/>
					</div>
				)}

				<div className='space-y-1'>
					<Label htmlFor='allocation-quantity'>Cantidad a documentar</Label>
					<Input
						id='allocation-quantity'
						name='quantity'
						type='number'
						min={1}
						max={origin?.physical_quantity}
						disabled={idempotentWrite.canRetry}
						value={formik.values.quantity}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
						isValid={!formik.errors.quantity}
						isTouched={
							formik.values.quantity !== '' || Boolean(formik.touched.quantity)
						}
						invalidFeedback={formik.errors.quantity}
					/>
					<p className='text-xs text-zinc-500'>
						Saldo sin documento: {origin?.physical_quantity ?? 0} unidades.
					</p>
				</div>

				<div className='space-y-1'>
					<Label htmlFor='allocation-reason'>Motivo</Label>
					<Textarea
						id='allocation-reason'
						name='reason'
						rows={3}
						disabled={idempotentWrite.canRetry}
						value={formik.values.reason}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
						isValid={!formik.errors.reason}
						isTouched={formik.values.reason !== '' || Boolean(formik.touched.reason)}
						invalidFeedback={formik.errors.reason}
					/>
				</div>

				{idempotentWrite.error && (
					<p role='alert' className='text-sm text-red-600 dark:text-red-400'>
						{idempotentWrite.error.message}
					</p>
				)}
			</ModalBody>
			<ModalFooter className='border-t border-zinc-200 pt-4 dark:border-zinc-700'>
				<ModalFooterChild>
					<Button
						variant='outline'
						onClick={handleClose}
						isDisable={idempotentWrite.isSubmitting}>
						Volver
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						variant='solid'
						color='blue'
						onClick={() => formik.handleSubmit()}
						isDisable={idempotentWrite.isSubmitting || !canSubmit}
						isLoading={idempotentWrite.isSubmitting}>
						{idempotentWrite.canRetry ? 'Reintentar' : 'Documentar'}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default DocumentInitialStockModal;
