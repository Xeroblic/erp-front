import React, { useState } from 'react';
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
import usePurchaseDocumentPicker from '@/pages/inventario/abastecimiento/Recepciones/hooks/usePurchaseDocumentPicker';
import type { IInventoryStockOriginRow } from '@/interface/procurement.interface';

/**
 * `POST B/inventory-stock/{product}/document-allocations` (card 07, sección
 * 8): respalda documentalmente una porción del stock inicial de un `origin`
 * todavía sin documento. **Nunca ingresa mercadería**: `physical_stock_delta`
 * es siempre `0`, el mismo criterio de aceptación explícito que
 * `LinkPurchaseDocumentModal` — el texto va en la pantalla, no sólo en un
 * comentario de código.
 *
 * `warehouse_id` no viaja en `IInventoryStockOriginRow` (sección 3 del
 * contrato: la fila de procedencia no lo declara) — lo resuelve el llamador
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
	onDocumented: () => void;
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
	const [documentId, setDocumentId] = useState<number | ''>('');
	const [lineId, setLineId] = useState<number | ''>('');
	const [quantity, setQuantity] = useState('');
	const [reason, setReason] = useState('');
	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo respaldar el stock inicial.',
	});

	const { documents, loadingDocuments, selectedDocument, loadingSelectedDocument } =
		usePurchaseDocumentPicker(subsidiaryId, isOpen, documentId);

	const documentOptions = documents.map((document) => ({
		value: String(document.id),
		label: `${document.document_number} · ${document.supplier?.display_name ?? 'Sin proveedor'}`,
	}));

	// El producto ya está fijo (viene del origin): sólo se ofrecen líneas del
	// mismo producto — una línea de otro producto siempre terminaría en
	// `DOCUMENT_LINE_MISMATCH` al confirmar.
	const compatibleLines = (selectedDocument?.items ?? []).filter(
		(line) => line.product.id === productId,
	);
	const lineOptions = compatibleLines.map((line) => ({
		value: String(line.id),
		label: `${line.sku_snapshot} · ${line.name_snapshot} (quedan ${line.remaining_quantity})`,
	}));
	const selectedLine = compatibleLines.find((line) => line.id === lineId);

	const parsedQuantity = Number(quantity);
	const isQuantityValid =
		quantity.trim() !== '' && Number.isInteger(parsedQuantity) && parsedQuantity > 0;
	const exceedsUndocumentedBalance = Boolean(
		origin && isQuantityValid && parsedQuantity > origin.physical_quantity,
	);
	const exceedsDocumentCapacity = Boolean(
		selectedLine && isQuantityValid && parsedQuantity > selectedLine.remaining_quantity,
	);

	let quantityFeedback = 'La cantidad debe ser un entero positivo.';
	if (exceedsUndocumentedBalance) {
		quantityFeedback = `No hay suficiente stock sin documentar (saldo: ${origin?.physical_quantity}).`;
	} else if (exceedsDocumentCapacity) {
		quantityFeedback = `La línea del documento sólo tiene ${selectedLine?.remaining_quantity} de capacidad.`;
	}

	const handleClose = () => {
		if (idempotentWrite.isSubmitting) return;
		setIsOpen(false);
		// Hallazgo 8: con un resultado incierto (`canRetry`), conserva la
		// selección y la clave para poder reabrir y reintentar exactamente el
		// mismo comando en vez de perderlo.
		if (!idempotentWrite.canRetry) {
			setDocumentId('');
			setLineId('');
			setQuantity('');
			setReason('');
			idempotentWrite.clearError();
		}
	};

	const canSubmit = Boolean(
		origin &&
			documentId !== '' &&
			lineId !== '' &&
			isQuantityValid &&
			!exceedsUndocumentedBalance &&
			!exceedsDocumentCapacity &&
			reason.trim(),
	);

	const handleConfirm = async () => {
		if (!origin || lineId === '' || !canSubmit) return;
		const result = await idempotentWrite.submit((headers) =>
			dispatch(
				createInventoryDocumentAllocationThunk({
					subsidiaryId,
					branchId,
					productId,
					payload: {
						origin_id: origin.origin_id,
						warehouse_id: warehouseId,
						purchase_document_line_id: Number(lineId),
						quantity: parsedQuantity,
						reason: reason.trim(),
					},
					headers: { idempotencyKey: headers['Idempotency-Key'] },
				}),
			).unwrap(),
		);

		if (result) {
			toast.success(
				`Respaldadas ${result.quantity} unidades del origin #${origin.origin_id}.`,
			);
			handleClose();
			onDocumented();
		}
	};

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
					Respaldar unidades del origin <strong>#{origin?.origin_id}</strong>
				</p>
				{/* Requisito de aceptación explícito del issue: delta físico cero
				    visible antes de confirmar, no sólo un comentario de código. */}
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
						name='purchase_document_id'
						inputId='allocation-document'
						isDisabled={idempotentWrite.canRetry}
						isLoading={loadingDocuments}
						options={documentOptions}
						placeholder='Selecciona un documento…'
						value={
							documentOptions.find((option) => option.value === String(documentId)) ??
							null
						}
						onChange={(option) => {
							const selected = option as TSelectOption | null;
							if (Array.isArray(selected)) return;
							setDocumentId(selected ? Number(selected.value) : '');
							setLineId('');
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
							name='purchase_document_line_id'
							inputId='allocation-line'
							isDisabled={idempotentWrite.canRetry}
							options={lineOptions}
							placeholder='Selecciona una línea…'
							value={
								lineOptions.find((option) => option.value === String(lineId)) ??
								null
							}
							onChange={(option) => {
								const selected = option as TSelectOption | null;
								if (Array.isArray(selected)) return;
								setLineId(selected ? Number(selected.value) : '');
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
						value={quantity}
						onChange={(event) => setQuantity(event.target.value)}
						isValid={
							quantity === '' ||
							(isQuantityValid &&
								!exceedsUndocumentedBalance &&
								!exceedsDocumentCapacity)
						}
						isTouched={quantity !== ''}
						invalidFeedback={quantityFeedback}
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
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						isValid={reason.trim().length > 0}
						isTouched={reason.length > 0}
						invalidFeedback='Indica el motivo del respaldo documental.'
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
						onClick={handleConfirm}
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
