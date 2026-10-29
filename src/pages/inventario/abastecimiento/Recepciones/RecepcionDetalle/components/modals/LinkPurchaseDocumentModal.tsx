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
import Select from '@/components/form/Select';
import SelectReact from '@/components/form/SelectReact';
import type { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import { linkStockReceiptPurchaseDocumentThunk } from '@/store/slices/procurement/stockReceiptsSlice';
import usePurchaseDocumentPicker from '@/pages/inventario/abastecimiento/Recepciones/hooks/usePurchaseDocumentPicker';
import type { IStockReceipt } from '@/interface/procurement.interface';
import {
	buildLinkMapping,
	NO_LINK_FIELD_ERRORS,
	toLinkFieldErrors,
	type ILinkFieldErrors,
	type TUnmatchedReason,
} from './linkPurchaseDocumentMapping';

/**
 * `PUT .../purchase-document` (sección 8 del contrato): vinculación posterior de
 * un documento confirmado a una recepción `posted` que se creó sin uno.
 * Vínculo único, no sustituible — este modal sólo se abre desde
 * `allowed_actions`, que ya deja de ofrecer la acción en cuanto la recepción
 * tiene un documento (`stockReceipts.mock`,
 * `computeAllowedActionsForStatus`).
 *
 * Mirror estructural de `ReverseStockReceiptModal`: mismo patrón de
 * `Modal`/`ModalHeader`/`ModalBody`/`ModalFooter`, `useIdempotentWrite`,
 * toast de éxito y manejo de error inline — con el selector de documento y el
 * mapeo de líneas propios de esta acción.
 *
 * El 200 trae la recepción con el costo del documento y `allowed_actions` sin
 * esta acción: el slice la aplica tal cual, sin volver a pedirla.
 */

/** Estados de la recepción que la ficha ya no refleja: hay que releerla. */
const STALE_RECEIPT_CODES = new Set(['RECEIPT_NOT_POSTED', 'RECEIPT_DOCUMENT_ALREADY_LINKED']);

const UNMATCHED_LABELS: Record<TUnmatchedReason, string> = {
	no_line: 'Sin línea compatible en el documento',
	no_capacity: 'El documento no tiene pendiente suficiente',
	choose: 'Elige la línea del documento',
};

const NO_OVERRIDES: ReadonlyMap<number, number> = new Map();

/** Tarjeta de primer nivel dentro del cuerpo del modal (mismo estándar que el resto de abastecimiento). */
const LINK_DOCUMENT_CARD_CLASSNAME =
	'border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900';

interface ILinkPurchaseDocumentModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	receipt: IStockReceipt | null;
	subsidiaryId: number | null;
	onLinked: () => void;
	/** Relee la recepción cuando su estado ya no admite el vínculo. */
	onReceiptStale?: () => void;
}

const LinkPurchaseDocumentModal: React.FC<ILinkPurchaseDocumentModalProps> = ({
	isOpen,
	setIsOpen,
	receipt,
	subsidiaryId,
	onLinked,
	onReceiptStale,
}) => {
	const dispatch = useAppDispatch();
	const [documentId, setDocumentId] = useState<number | ''>('');
	const [reason, setReason] = useState('');
	const [fieldErrors, setFieldErrors] = useState<ILinkFieldErrors>(NO_LINK_FIELD_ERRORS);
	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo vincular el documento.',
		renewKeyOnDefinitiveError: true,
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

	// Líneas del documento que el usuario eligió a mano, por línea de la recepción.
	const [overrides, setOverrides] = useState<ReadonlyMap<number, number>>(NO_OVERRIDES);

	const mapping = useMemo(
		() =>
			receipt && selectedDocument
				? buildLinkMapping(receipt, selectedDocument, overrides)
				: null,
		[receipt, selectedDocument, overrides],
	);

	const chooseDocumentLine = (receiptLineId: number, documentLineId: number) => {
		setOverrides((previous) => new Map(previous).set(receiptLineId, documentLineId));
		setFieldErrors(NO_LINK_FIELD_ERRORS);
	};

	const handleClose = () => {
		if (idempotentWrite.isSubmitting) return;
		setIsOpen(false);
		// Con un resultado incierto (`canRetry`), conserva la
		// selección y la clave para poder reabrir y reintentar exactamente el
		// mismo comando en vez de perderlo.
		if (!idempotentWrite.canRetry) {
			setDocumentId('');
			setReason('');
			setOverrides(NO_OVERRIDES);
			setFieldErrors(NO_LINK_FIELD_ERRORS);
			idempotentWrite.clearError();
		}
	};

	// Ya vinculada o no ingresada: otro intento respondería lo mismo.
	const isReceiptBlocked = STALE_RECEIPT_CODES.has(idempotentWrite.error?.code ?? '');

	const canSubmit = Boolean(
		receipt &&
			!isReceiptBlocked &&
			documentId !== '' &&
			mapping &&
			mapping.items.length > 0 &&
			mapping.unmatched.size === 0 &&
			reason.trim(),
	);

	const handleConfirm = async () => {
		if (!receipt || !mapping || documentId === '' || !canSubmit) return;
		const sentItems = mapping.items;
		setFieldErrors(NO_LINK_FIELD_ERRORS);
		const result = await idempotentWrite.submit(
			(headers) =>
				dispatch(
					linkStockReceiptPurchaseDocumentThunk({
						subsidiaryId,
						id: receipt.id,
						payload: {
							purchase_document_id: Number(documentId),
							reason: reason.trim(),
							items: sentItems,
						},
						headers: { idempotencyKey: headers['Idempotency-Key'] },
					}),
				).unwrap(),
			{
				onError: (error) => {
					setFieldErrors(toLinkFieldErrors(error, sentItems));
					if (STALE_RECEIPT_CODES.has(error.code)) onReceiptStale?.();
				},
			},
		);

		if (result) {
			toast.success(
				`Documento vinculado a la recepción #${receipt.id}. Su costo ahora es el del documento.`,
			);
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
							No cambia la fecha de llegada, no genera movimiento físico y no crea una
							compra más reciente: sólo respalda documentalmente unidades que ya están
							en bodega.
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
									// Otro documento es otro comando: el error del anterior
									// ya no aplica (la clave se renovó al fallar).
									setOverrides(NO_OVERRIDES);
									setFieldErrors(NO_LINK_FIELD_ERRORS);
									if (!isReceiptBlocked) idempotentWrite.clearError();
								}}
							/>
							{fieldErrors.document && (
								<p className='text-sm text-red-600 dark:text-red-400'>
									{fieldErrors.document}
								</p>
							)}
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
									const assignedId = mapping.assignment.get(line.id);
									const documentLine = selectedDocument.items.find(
										(docLine) => docLine.id === assignedId,
									);
									// Con más de una línea del producto, el usuario puede
									// cambiar la que propuso el mapeo.
									const compatibleLines = selectedDocument.items
										.map((docLine, index) => ({ docLine, position: index + 1 }))
										.filter(
											({ docLine }) => docLine.product.id === line.product.id,
										);
									const unmatchedReason = mapping.unmatched.get(line.id);
									const lineError = fieldErrors.lines[line.id];
									const selectId = `link-line-${line.id}`;
									return (
										<div key={line.id} className='space-y-0.5'>
											<div className='flex items-center justify-between gap-2'>
												{compatibleLines.length > 1 ? (
													<Label htmlFor={selectId}>
														{line.name_snapshot} ({line.quantity} u.)
													</Label>
												) : (
													<span>
														{line.name_snapshot} ({line.quantity} u.)
													</span>
												)}
												{documentLine && compatibleLines.length <= 1 && (
													<span className='text-emerald-600 dark:text-emerald-400'>
														→ {documentLine.name_snapshot}
													</span>
												)}
												{unmatchedReason && (
													<span className='text-red-600 dark:text-red-400'>
														{UNMATCHED_LABELS[unmatchedReason]}
													</span>
												)}
											</div>
											{compatibleLines.length > 1 && (
												<Select
													id={selectId}
													name={selectId}
													disabled={idempotentWrite.canRetry}
													value={assignedId ?? ''}
													onChange={(event) =>
														chooseDocumentLine(
															line.id,
															Number(event.target.value),
														)
													}>
													<option value='' disabled>
														Elige la línea del documento
													</option>
													{compatibleLines.map(
														({ docLine, position }) => (
															<option
																key={docLine.id}
																value={docLine.id}>
																Línea {position} ·{' '}
																{docLine.name_snapshot} · quedan{' '}
																{docLine.remaining_quantity}
															</option>
														),
													)}
												</Select>
											)}
											{lineError && (
												<p className='text-red-600 dark:text-red-400'>
													{lineError}
												</p>
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
