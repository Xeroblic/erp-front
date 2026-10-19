import React from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import Validation from '@/components/form/Validation';
import type { ISaleReturn } from '@/interface/sales.interface';
import { useStartSaleReturn } from '../../hooks/useStartSaleReturn';
import type { ISaleReturnOwner, TStartReturnSlot } from '../../hooks/useSaleReturnWrites';
import { RETURN_REASON_MAX } from '../../types';
import ReturnAttemptNotice from '../parts/ReturnAttemptNotice';

export interface IStartSaleReturnModalProps {
	isOpen: boolean;
	onClose: () => void;
	subsidiaryId: number;
	saleId: number;
	/** Escritura de página: el intento incierto sobrevive al cierre del modal. */
	slot: TStartReturnSlot;
	onStarted: (saleReturn: ISaleReturn, owner: ISaleReturnOwner) => void;
}

const REASON_ID = 'sale-return-reason';

/**
 * Inicia la devolución física de una venta cerrada (etapa 2). Sólo registra que viene
 * de vuelta: no repone stock ni reembolsa. La venta queda abierta hasta recibirla.
 */
const StartSaleReturnModal: React.FC<IStartSaleReturnModalProps> = ({
	isOpen,
	onClose,
	subsidiaryId,
	saleId,
	slot,
	onStarted,
}) => {
	const { formik, isSubmitting, errorMessage, canRetry, foreignAttempt, retry, discard } =
		useStartSaleReturn({ slot, owner: { subsidiaryId, saleId }, onStarted });
	const reasonError = formik.touched.reason ? formik.errors.reason : undefined;
	const locked = isSubmitting || canRetry || foreignAttempt !== null;

	// Cerrar con un intento incierto lo conserva: vive en la página, no en el modal.
	const handleClose = () => {
		if (!isSubmitting) onClose();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='md' isCentered isStaticBackdrop>
			<ModalHeader>Iniciar devolución</ModalHeader>
			<form
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					if (foreignAttempt) return;
					if (canRetry) void retry();
					else formik.handleSubmit();
				}}>
				<ModalBody className='space-y-3'>
					<p className='text-sm text-zinc-600 dark:text-zinc-300'>
						La venta se reabre y queda esperando que la devolución llegue. Todavía no
						vuelve nada al stock: eso pasa al recibirla, cuando indiques dónde queda
						cada unidad y si está apta. No reembolsa dinero ni cambia el pedido en Woo.
					</p>
					<div className='space-y-1'>
						<Label htmlFor={REASON_ID}>Motivo de la devolución</Label>
						<Validation
							isValid={!reasonError}
							isTouched={Boolean(reasonError)}
							invalidFeedback={reasonError}>
							<Textarea
								id={REASON_ID}
								name='reason'
								rows={3}
								maxLength={RETURN_REASON_MAX}
								disabled={locked}
								value={formik.values.reason}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								isValid={!reasonError}
								isTouched={Boolean(reasonError)}
								invalidFeedback={reasonError}
							/>
						</Validation>
					</div>
					{(canRetry || foreignAttempt) && (
						<ReturnAttemptNotice
							kind={canRetry ? 'own' : 'foreign'}
							action='el inicio de la devolución'
							attemptSaleId={foreignAttempt?.saleId ?? saleId}
							disabled={isSubmitting}
							onDiscard={discard}
						/>
					)}
					{errorMessage && (
						<Alert
							color='red'
							colorIntensity='500'
							variant='outline'
							icon='HeroExclamationTriangle'
							className='text-sm'>
							{errorMessage}
						</Alert>
					)}
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild className='justify-end'>
						<Button
							type='button'
							variant='outline'
							color='red'
							onClick={handleClose}
							isDisable={isSubmitting}>
							Cancelar
						</Button>
						{!foreignAttempt && (
							<Button
								type='submit'
								variant='solid'
								color='amber'
								icon={canRetry ? 'HeroArrowPath' : 'HeroArrowUturnLeft'}
								isLoading={isSubmitting}>
								{canRetry ? 'Reintentar' : 'Iniciar devolución'}
							</Button>
						)}
					</ModalFooterChild>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default StartSaleReturnModal;
