import React from 'react';
import { toast } from 'react-toastify';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import { deactivateProcurementSupplierThunk } from '@/store/slices/procurement/procurementSuppliersSlice';

/** Tarjeta de primer nivel dentro del cuerpo del modal (mismo estándar que el resto de abastecimiento). */
const DEACTIVATE_SUPPLIER_CARD_CLASSNAME =
	'border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900';

/**
 * Confirmación de `deactivate` (soft delete, sección 5 del contrato): acción
 * destructiva/irreversible desde la UI, así que pide confirmación en vez de
 * dispararse con un solo clic. Es una escritura como cualquier otra, así que
 * lleva su propia `Idempotency-Key` — omitirla es lo que dejaba un reintento
 * por timeout capaz de duplicar la operación.
 *
 * `supplier` toma la forma mínima que hace falta (id + display_name): así
 * sirve tanto a la fila resumida del listado como a la ficha completa, sin
 * que ninguna de las dos tenga que fingir tener los campos de la otra.
 */

interface IDeactivateSupplierTarget {
	id: number;
	display_name: string;
}

interface IDeactivateSupplierModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	supplier: IDeactivateSupplierTarget | null;
	subsidiaryId: number | null;
	onDeactivated: () => void;
}

const DeactivateSupplierModal: React.FC<IDeactivateSupplierModalProps> = ({
	isOpen,
	setIsOpen,
	supplier,
	subsidiaryId,
	onDeactivated,
}) => {
	const dispatch = useAppDispatch();
	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo desactivar el proveedor.',
	});

	const handleConfirm = async () => {
		if (!supplier) return;
		const result = await idempotentWrite.submit((headers) =>
			dispatch(
				deactivateProcurementSupplierThunk({
					subsidiaryId,
					id: supplier.id,
					headers: { idempotencyKey: headers['Idempotency-Key'] },
				}),
			).unwrap(),
		);

		if (result) {
			toast.success(`${supplier.display_name} fue desactivado.`);
			setIsOpen(false);
			onDeactivated();
		} else {
			toast.error('No se pudo desactivar el proveedor.');
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={() => {
				if (!idempotentWrite.isSubmitting) setIsOpen(false);
			}}
			size='sm'
			isCentered
			isStaticBackdrop={idempotentWrite.isSubmitting}>
			<ModalHeader className='border-b border-zinc-200 pb-4 dark:border-zinc-700'>
				<h2 className='text-xl font-bold text-zinc-900 dark:text-white'>
					Desactivar proveedor
				</h2>
			</ModalHeader>
			<ModalBody>
				<Card className={DEACTIVATE_SUPPLIER_CARD_CLASSNAME}>
					<CardBody>
						<p className='text-lg'>
							¿Desactivar a <strong>{supplier?.display_name}</strong>?
						</p>
						<p className='mt-2 text-sm text-zinc-500 dark:text-zinc-400'>
							Sale de las selecciones nuevas, pero sigue visible en el historial y
							puede completar un documento ya confirmado. Se puede restaurar después.
						</p>
					</CardBody>
				</Card>
			</ModalBody>
			<ModalFooter className='border-t border-zinc-200 pt-4 dark:border-zinc-700'>
				<ModalFooterChild>
					<Button
						variant='outline'
						onClick={() => setIsOpen(false)}
						isDisable={idempotentWrite.isSubmitting}>
						Cancelar
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						variant='outline'
						color='amber'
						onClick={handleConfirm}
						isDisable={idempotentWrite.isSubmitting}
						isLoading={idempotentWrite.isSubmitting}>
						Desactivar
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default DeactivateSupplierModal;
