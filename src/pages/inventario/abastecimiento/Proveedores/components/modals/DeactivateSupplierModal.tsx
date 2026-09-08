import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useAppDispatch } from '@/store';
import { deactivateProcurementSupplierThunk } from '@/store/slices/procurement/procurementSuppliersSlice';

/**
 * Confirmación de `deactivate` (soft delete, sección 5 del contrato): acción
 * destructiva/irreversible desde la UI, así que pide confirmación en vez de
 * dispararse con un solo clic.
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
	const [isDeactivating, setIsDeactivating] = useState(false);

	const handleConfirm = async () => {
		if (!supplier) return;
		setIsDeactivating(true);
		try {
			await dispatch(
				deactivateProcurementSupplierThunk({ subsidiaryId, id: supplier.id }),
			).unwrap();
			toast.success(`${supplier.display_name} fue desactivado.`);
			setIsOpen(false);
			onDeactivated();
		} catch {
			toast.error('No se pudo desactivar el proveedor.');
		} finally {
			setIsDeactivating(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={() => {
				if (!isDeactivating) setIsOpen(false);
			}}
			size='sm'
			isCentered
			isStaticBackdrop={isDeactivating}>
			<ModalHeader>Desactivar proveedor</ModalHeader>
			<ModalBody>
				<p className='text-lg'>
					¿Desactivar a <strong>{supplier?.display_name}</strong>?
				</p>
				<p className='mt-2 text-sm text-zinc-500 dark:text-zinc-400'>
					Sale de las selecciones nuevas, pero sigue visible en el historial y puede
					completar un documento ya confirmado. Se puede restaurar después.
				</p>
			</ModalBody>
			<ModalFooter>
				<Button
					variant='outline'
					onClick={() => setIsOpen(false)}
					isDisable={isDeactivating}>
					Cancelar
				</Button>
				<Button
					variant='outline'
					color='amber'
					onClick={handleConfirm}
					isDisable={isDeactivating}
					isLoading={isDeactivating}>
					Desactivar
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default DeactivateSupplierModal;
