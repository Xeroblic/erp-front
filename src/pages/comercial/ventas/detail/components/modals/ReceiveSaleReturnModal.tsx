import React, { useMemo } from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useReceiveSaleReturn } from '../../hooks/useReceiveSaleReturn';
import type { ISaleReturnOwner, TReceiveReturnSlot } from '../../hooks/useSaleReturnWrites';
import SaleReturnItemReceipt from '../parts/SaleReturnItemReceipt';
import ReturnAttemptNotice from '../parts/ReturnAttemptNotice';

export interface IReceiveSaleReturnModalProps {
	isOpen: boolean;
	onClose: () => void;
	subsidiaryId: number;
	saleId: number;
	returnId: number;
	/** Escritura de página: el intento incierto sobrevive al cierre del modal. */
	slot: TReceiveReturnSlot;
	/**
	 * La recepción quedó confirmada, o ya la había confirmado otro: hay que releer esa
	 * venta y cerrar. Recibe la venta del intento, que puede no ser la que se muestra.
	 */
	onSettled: (owner: ISaleReturnOwner) => void;
	onAlreadyReceived: (owner: ISaleReturnOwner) => void;
}

/**
 * Recepción física de una devolución de la etapa 2: todo o nada, cada unidad con su
 * ubicación y su condición. Sólo con la venta en `pending_return`.
 */
const ReceiveSaleReturnModal: React.FC<IReceiveSaleReturnModalProps> = ({
	isOpen,
	onClose,
	subsidiaryId,
	saleId,
	returnId,
	slot,
	onSettled,
	onAlreadyReceived,
}) => {
	const finish = () => onAlreadyReceived({ subsidiaryId, saleId });
	const receipt = useReceiveSaleReturn({ slot, subsidiaryId, saleId, returnId, onSettled });
	const { load, formik, warehousesByBranch, isSubmitting, canRetry, foreignAttempt } = receipt;
	const { visibleBranches } = useCurrentBranch();
	const branchNames = useMemo(
		() => new Map(visibleBranches.map((branch) => [branch.id, branch.name])),
		[visibleBranches],
	);
	const subsidiaryWarehouses = useMemo(
		() =>
			Array.from(warehousesByBranch.entries()).flatMap(([branchId, warehouses]) =>
				warehouses.map((warehouse) => ({
					...warehouse,
					name: `${branchNames.get(branchId) ?? `Sucursal #${branchId}`} — ${warehouse.name}`,
				})),
			),
		[warehousesByBranch, branchNames],
	);

	const saleReturn = load.status === 'ready' ? load.saleReturn : null;
	const alreadyReceived = saleReturn?.status === 'received';
	const hasSerials = saleReturn?.items.some((item) => item.serial_tracking) ?? false;
	const hasNonSerial = saleReturn?.items.some((item) => !item.serial_tracking) ?? false;
	const locked = isSubmitting || canRetry || foreignAttempt !== null;

	// Cerrar con un intento incierto lo conserva: vive en la página, no en el modal.
	const handleClose = () => {
		if (!isSubmitting) onClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={handleClose}
			size='xl'
			isCentered
			isScrollable
			isStaticBackdrop>
			<ModalHeader>Recibir devolución</ModalHeader>
			<form
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					if (foreignAttempt) return;
					if (canRetry) void receipt.retry();
					else formik.handleSubmit();
				}}>
				<ModalBody className='space-y-3'>
					{load.status === 'loading' && <Spinner nombre='Cargando la devolución...' />}

					{load.status === 'error' && (
						<Alert
							color='red'
							colorIntensity='500'
							variant='outline'
							icon='HeroExclamationTriangle'
							className='text-sm'>
							{load.message}
						</Alert>
					)}

					{saleReturn && alreadyReceived && (
						<Alert
							color='emerald'
							colorIntensity='500'
							variant='outline'
							icon='HeroCheckCircle'
							className='text-sm'>
							Esta devolución ya fue recibida. Actualiza la venta para ver su estado.
						</Alert>
					)}

					{saleReturn && !alreadyReceived && (
						<>
							<p className='text-sm text-zinc-600 dark:text-zinc-300'>
								Indica dónde queda cada unidad y si está apta para volver a
								venderse. Se recibe todo de una vez: cada ítem con exactamente lo
								que vuelve.
							</p>
							{saleReturn.reason && (
								<p className='text-xs text-zinc-500 dark:text-zinc-400'>
									Motivo: {saleReturn.reason}
								</p>
							)}
							<ul className='list-disc space-y-0.5 pl-5 text-xs text-zinc-600 dark:text-zinc-400'>
								{hasNonSerial && (
									<li>
										Lo no apto sin serie suma al físico de la bodega, pero no se
										vende ni se publica en Woo.
									</li>
								)}
								{hasSerials && (
									<li>
										Una serie no apta pasa a revisión técnica y sólo vuelve a la
										venta si técnica la aprueba. «Conservar su bodega» la deja
										donde estaba.
									</li>
								)}
								<li>Lo no apto siempre lleva motivo.</li>
							</ul>

							{receipt.warehousesError && (
								<Alert
									color='amber'
									colorIntensity='500'
									variant='outline'
									icon='HeroExclamationTriangle'
									className='text-sm'>
									{receipt.warehousesError}
									<Button
										type='button'
										variant='outline'
										color='blue'
										onClick={receipt.reload}
										isDisable={locked}>
										Volver a cargar bodegas
									</Button>
								</Alert>
							)}

							<fieldset disabled={locked} className='space-y-3'>
								<legend className='sr-only'>Ítems de la devolución</legend>
								{saleReturn.items.map((item) => (
									<SaleReturnItemReceipt
										key={item.sale_item_id}
										item={item}
										formik={formik}
										warehouses={(item.branch_id !== null
											? (warehousesByBranch.get(item.branch_id) ?? [])
											: subsidiaryWarehouses
										).filter((warehouse) => warehouse.is_active)}
										branchName={
											item.branch_id !== null
												? (branchNames.get(item.branch_id) ?? null)
												: null
										}
										disabled={locked}
										errors={receipt.itemErrors[item.sale_item_id]}
									/>
								))}
							</fieldset>
						</>
					)}

					{(canRetry || foreignAttempt) && (
						<ReturnAttemptNotice
							kind={canRetry ? 'own' : 'foreign'}
							action='la recepción de la devolución'
							attemptSaleId={foreignAttempt?.saleId ?? saleId}
							disabled={isSubmitting}
							onDiscard={receipt.discard}
						/>
					)}

					{receipt.errorMessage && (
						<Alert
							color='red'
							colorIntensity='500'
							variant='outline'
							icon='HeroExclamationTriangle'
							className='text-sm'>
							{receipt.errorMessage}
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
						{load.status === 'error' && (
							<Button
								type='button'
								variant='outline'
								color='blue'
								icon='HeroArrowPath'
								onClick={receipt.reload}>
								Volver a cargar
							</Button>
						)}
						{alreadyReceived && (
							<Button type='button' variant='solid' color='emerald' onClick={finish}>
								Actualizar venta
							</Button>
						)}
						{saleReturn && !alreadyReceived && !foreignAttempt && (
							<Button
								type='submit'
								variant='solid'
								color='amber'
								icon={canRetry ? 'HeroArrowPath' : 'HeroInboxArrowDown'}
								isLoading={isSubmitting}>
								{canRetry ? 'Reintentar' : 'Confirmar recepción'}
							</Button>
						)}
					</ModalFooterChild>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default ReceiveSaleReturnModal;
