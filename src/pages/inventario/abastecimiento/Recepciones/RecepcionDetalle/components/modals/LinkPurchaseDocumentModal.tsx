import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Card, { CardBody } from '@/components/ui/Card';
import Label from '@/components/form/Label';
import SelectReact from '@/components/form/SelectReact';
import type { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import { linkStockReceiptPurchaseDocumentThunk } from '@/store/slices/procurement/stockReceiptsSlice';
import usePurchaseDocumentPicker from '@/pages/inventario/abastecimiento/Recepciones/hooks/usePurchaseDocumentPicker';
import type {
	IStockReceipt,
	IStockReceiptLinkPurchaseDocumentItemInput,
} from '@/interface/procurement.interface';

/**
 * `PUT .../purchase-document` (card 07, sección 8): vinculación posterior de
 * un documento confirmado a una recepción `posted` que se creó sin uno.
 * Vínculo único, no sustituible — este modal sólo se abre desde
 * `allowed_actions`, que ya deja de ofrecer la acción en cuanto la recepción
 * tiene un documento (`stockReceipts.service`,
 * `computeAllowedActionsForStatus`).
 *
 * Mirror estructural de `ReverseStockReceiptModal`: mismo patrón de
 * `Modal`/`ModalHeader`/`ModalBody`/`ModalFooter`, `useIdempotentWrite`,
 * toast de éxito y manejo de error inline — con el selector de documento y el
 * mapeo de líneas propios de esta acción.
 */

/** Tarjeta de primer nivel dentro del cuerpo del modal (mismo estándar que el resto de abastecimiento). */
const LINK_DOCUMENT_CARD_CLASSNAME =
	'border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900';

interface ILinkPurchaseDocumentModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	receipt: IStockReceipt | null;
	subsidiaryId: number | null;
	onLinked: () => void;
}

const LinkPurchaseDocumentModal: React.FC<ILinkPurchaseDocumentModalProps> = ({
	isOpen,
	setIsOpen,
	receipt,
	subsidiaryId,
	onLinked,
}) => {
	const dispatch = useAppDispatch();
	const [documentId, setDocumentId] = useState<number | ''>('');
	const [reason, setReason] = useState('');
	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo vincular el documento.',
	});

	const { documents, loadingDocuments, selectedDocument, loadingSelectedDocument } =
		usePurchaseDocumentPicker(subsidiaryId, isOpen, documentId);

	// Sección 8: «proveedor ya conocido debe coincidir». Ofrecer un documento
	// de otro proveedor siempre terminaría en `RECEIPT_DOCUMENT_SUPPLIER_MISMATCH`
	// al confirmar — mejor no ofrecerlo. Sin proveedor conocido, cualquier
	// documento es candidato: se completa desde él.
	const documentOptions = documents
		.filter((document) => !receipt?.supplier || document.supplier?.id === receipt.supplier.id)
		.map((document) => ({
			value: String(document.id),
			label: `${document.document_number} · ${document.supplier?.display_name ?? 'Sin proveedor'}`,
		}));

	/**
	 * Mapeo automático 1:1 por producto: cada línea de la recepción busca, en
	 * el documento elegido, una línea del mismo producto que ninguna otra
	 * línea de la recepción ya haya tomado. Una recepción sin correspondencia
	 * completa no se puede confirmar — se lista qué línea quedó sin par en vez
	 * de dejar que el 422 del servicio sea la primera noticia.
	 */
	const mapping = useMemo(() => {
		if (!receipt || !selectedDocument) return null;
		const usedDocumentLineIds = new Set<number>();
		const items: IStockReceiptLinkPurchaseDocumentItemInput[] = [];
		const unmatchedReceiptLineIds = new Set<number>();
		receipt.items.forEach((receiptLine) => {
			const documentLine = selectedDocument.items.find(
				(line) =>
					line.product.id === receiptLine.product.id && !usedDocumentLineIds.has(line.id),
			);
			if (!documentLine) {
				unmatchedReceiptLineIds.add(receiptLine.id);
				return;
			}
			usedDocumentLineIds.add(documentLine.id);
			items.push({
				stock_receipt_line_id: receiptLine.id,
				purchase_document_line_id: documentLine.id,
			});
		});
		return { items, unmatchedReceiptLineIds };
	}, [receipt, selectedDocument]);

	const handleClose = () => {
		if (idempotentWrite.isSubmitting) return;
		setIsOpen(false);
		// Hallazgo 8: con un resultado incierto (`canRetry`), conserva la
		// selección y la clave para poder reabrir y reintentar exactamente el
		// mismo comando en vez de perderlo.
		if (!idempotentWrite.canRetry) {
			setDocumentId('');
			setReason('');
			idempotentWrite.clearError();
		}
	};

	const canSubmit = Boolean(
		receipt &&
			documentId !== '' &&
			mapping &&
			mapping.items.length > 0 &&
			mapping.unmatchedReceiptLineIds.size === 0 &&
			reason.trim(),
	);

	const handleConfirm = async () => {
		if (!receipt || !mapping || documentId === '' || !canSubmit) return;
		const result = await idempotentWrite.submit((headers) =>
			dispatch(
				linkStockReceiptPurchaseDocumentThunk({
					subsidiaryId,
					id: receipt.id,
					payload: {
						purchase_document_id: Number(documentId),
						reason: reason.trim(),
						items: mapping.items,
					},
					headers: { idempotencyKey: headers['Idempotency-Key'] },
				}),
			).unwrap(),
		);

		if (result) {
			toast.success(`Documento vinculado a la recepción #${receipt.id}.`);
			handleClose();
			onLinked();
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
					Vincular documento de compra
				</h2>
			</ModalHeader>
			<ModalBody>
				<Card className={LINK_DOCUMENT_CARD_CLASSNAME}>
					<CardBody className='space-y-4'>
						<p className='text-lg'>
							Vincular un documento a la recepción <strong>#{receipt?.id}</strong>
						</p>
						{/* Requisito de aceptación explícito del issue: texto visible antes
						    de confirmar, no sólo un comentario de código. */}
						<Alert
							color='blue'
							variant='outline'
							icon='HeroInformationCircle'
							title='Esto no mueve stock'>
							No cambia la fecha de recepción, no genera movimiento físico y no crea
							una compra más reciente: sólo respalda documentalmente unidades que ya
							están en bodega.
						</Alert>

						<div className='space-y-1'>
							<Label htmlFor='link-document'>Documento confirmado</Label>
							<SelectReact
								name='purchase_document_id'
								inputId='link-document'
								isDisabled={idempotentWrite.canRetry}
								isLoading={loadingDocuments}
								options={documentOptions}
								placeholder='Selecciona un documento…'
								value={
									documentOptions.find(
										(option) => option.value === String(documentId),
									) ?? null
								}
								onChange={(option) => {
									const selected = option as TSelectOption | null;
									if (Array.isArray(selected)) return;
									setDocumentId(selected ? Number(selected.value) : '');
								}}
							/>
							{receipt?.supplier && (
								<p className='text-xs text-zinc-500'>
									Sólo documentos de {receipt.supplier.display_name}: el proveedor
									ya es conocido.
								</p>
							)}
						</div>

						{loadingSelectedDocument && (
							<p className='text-sm text-zinc-500'>Cargando líneas del documento…</p>
						)}

						{selectedDocument && mapping && receipt && (
							<div className='space-y-1 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-700'>
								<p className='font-semibold'>Mapeo de líneas</p>
								{receipt.items.map((line) => {
									const matched = mapping.items.find(
										(item) => item.stock_receipt_line_id === line.id,
									);
									const documentLine = matched
										? selectedDocument.items.find(
												(docLine) =>
													docLine.id ===
													matched.purchase_document_line_id,
											)
										: undefined;
									return (
										<div
											key={line.id}
											className='flex items-center justify-between gap-2'>
											<span>
												{line.name_snapshot} ({line.quantity} u.)
											</span>
											{documentLine ? (
												<span className='text-emerald-600 dark:text-emerald-400'>
													→ {documentLine.name_snapshot}
												</span>
											) : (
												<span className='text-red-600 dark:text-red-400'>
													Sin línea compatible en el documento
												</span>
											)}
										</div>
									);
								})}
							</div>
						)}

						<div className='space-y-1'>
							<Label htmlFor='link-reason'>Motivo</Label>
							<Textarea
								id='link-reason'
								name='reason'
								rows={3}
								disabled={idempotentWrite.canRetry}
								value={reason}
								onChange={(event) => setReason(event.target.value)}
								isValid={reason.trim().length > 0}
								isTouched={reason.length > 0}
								invalidFeedback='Indica el motivo del vínculo posterior.'
							/>
						</div>

						{idempotentWrite.error && (
							<p role='alert' className='text-sm text-red-600 dark:text-red-400'>
								{idempotentWrite.error.message}
							</p>
						)}
					</CardBody>
				</Card>
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
						{idempotentWrite.canRetry ? 'Reintentar' : 'Vincular'}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default LinkPurchaseDocumentModal;
