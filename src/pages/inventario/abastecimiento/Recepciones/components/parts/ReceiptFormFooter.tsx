import React from 'react';
import { ModalFooter, ModalFooterChild } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { IPendingIngress } from '../../hooks/useStockReceiptForm';
import type { TStockReceiptSubmitIntent } from '../../types';

interface IReceiptFormFooterProps {
	isEdit: boolean;
	isSubmitting: boolean;
	hasVersionConflict: boolean;
	canRetry: boolean;
	submitIntent: TStockReceiptSubmitIntent;
	retryLabel: string;
	pendingIngress: IPendingIngress | null;
	isPendingIngressForeign: boolean;
	onSubmit: (intent: TStockReceiptSubmitIntent) => void;
	/** Cancelar, o descartar el ingreso pendiente de otra filial. */
	onClose: () => void;
	onRetryIngress: () => void;
	onLeavePendingIngress: () => void;
}

/**
 * Paso 4 del alta: guardar como borrador o guardar e ingresar al stock. Con un
 * resultado incierto sólo ofrece reintentar lo mismo; con un ingreso pendiente,
 * reintentarlo, ir a la recepción o —desde otra filial— descartarlo.
 */
const ReceiptFormFooter: React.FC<IReceiptFormFooterProps> = ({
	isEdit,
	isSubmitting,
	hasVersionConflict,
	canRetry,
	submitIntent,
	retryLabel,
	pendingIngress,
	isPendingIngressForeign,
	onSubmit,
	onClose,
	onRetryIngress,
	onLeavePendingIngress,
}) => {
	const saveLabel = isEdit ? 'Guardar corrección' : 'Guardar borrador';

	return (
		<ModalFooter className='shrink-0 border-t border-zinc-200 bg-white pt-4 dark:border-zinc-700 dark:bg-zinc-950'>
			<ModalFooterChild>
				<p className='hidden max-w-xs text-xs text-zinc-500 dark:text-zinc-400 md:block'>
					El borrador no mueve stock. «Guardar e ingresar» lo suma al stock en cuanto
					termina de procesarse.
				</p>
			</ModalFooterChild>
			<ModalFooterChild className='flex-wrap justify-end'>
				{pendingIngress ? (
					<>
						{isPendingIngressForeign && (
							<Button
								variant='outline'
								color='red'
								icon='HeroXMark'
								isDisable={isSubmitting}
								onClick={onClose}>
								Descartar
							</Button>
						)}
						<Button
							variant='outline'
							icon='HeroArrowTopRightOnSquare'
							isDisable={isSubmitting || isPendingIngressForeign}
							onClick={onLeavePendingIngress}>
							Ver la recepción #{pendingIngress.receipt.id}
						</Button>
						<Button
							variant='solid'
							color='emerald'
							icon='HeroArrowPath'
							isDisable={isSubmitting || isPendingIngressForeign}
							isLoading={isSubmitting}
							onClick={onRetryIngress}>
							Reintentar ingreso al stock
						</Button>
					</>
				) : (
					<Button variant='outline' onClick={onClose} isDisable={isSubmitting}>
						Cancelar
					</Button>
				)}
				{!pendingIngress && canRetry && (
					<Button
						variant='solid'
						color='blue'
						icon='HeroArrowPath'
						isDisable={isSubmitting || hasVersionConflict}
						isLoading={isSubmitting}
						onClick={() => onSubmit(submitIntent)}>
						{retryLabel}
					</Button>
				)}
				{!pendingIngress && !canRetry && (
					<>
						<Button
							variant='outline'
							color='blue'
							icon='HeroDocumentCheck'
							isDisable={isSubmitting || hasVersionConflict}
							isLoading={isSubmitting && submitIntent === 'save'}
							onClick={() => onSubmit('save')}>
							{saveLabel}
						</Button>
						<Button
							variant='solid'
							color='emerald'
							icon='HeroArrowDownTray'
							isDisable={isSubmitting || hasVersionConflict}
							isLoading={isSubmitting && submitIntent === 'save_and_post'}
							onClick={() => onSubmit('save_and_post')}>
							Guardar e ingresar al stock
						</Button>
					</>
				)}
			</ModalFooterChild>
		</ModalFooter>
	);
};

export default ReceiptFormFooter;
