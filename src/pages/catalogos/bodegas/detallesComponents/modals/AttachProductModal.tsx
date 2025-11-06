import React, { useState, useEffect } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/form/Checkbox';
import Input from '@/components/form/Input';
import { toast } from 'react-toastify';
import { IWarehouseProduct } from '@/interface/warehouse.interface';
import { IProduct } from '@/interface/product.interface';

interface AttachProductModalProps {
	isOpen: boolean;
	product: IProduct | null;
	allProducts?: IProduct[];
	associatedProducts?: IWarehouseProduct[];
	onClose: () => void;
	onConfirm: (productId: number, sync: boolean, quantity: number) => Promise<void>;
	isLoading?: boolean;
}

const AttachProductModal: React.FC<AttachProductModalProps> = ({
	isOpen,
	product,
	allProducts = [],
	associatedProducts = [],
	onClose,
	onConfirm,
	isLoading = false,
}) => {
	const [sync, setSync] = useState(true);
	const [quantity, setQuantity] = useState(1);

	// Reset state when modal opens
	useEffect(() => {
		if (isOpen) {
			setSync(true);
			setQuantity(1);
		}
	}, [isOpen]);

	if (!product) return null;

	/**
	 * Validaciones mejoradas antes de confirmar asociación
	 */
	const handleConfirm = async () => {
		// Validación 1: Verificar que el producto no esté ya asociado
		const isAlreadyAssociated = associatedProducts.some((p) => p.id === product.id);
		if (isAlreadyAssociated) {
			toast.warning('El producto ya está asociado a esta bodega');
			return;
		}

		// Validación 2: Si es modo manual, validar cantidad > 0
		if (!sync && quantity <= 0) {
			toast.error('La cantidad debe ser mayor a 0 para el modo manual');
			return;
		}

		// Validación 3: Si es modo auto-sync, verificar que el producto tenga stock disponible
		if (sync) {
			const productWithStock = allProducts.find((p) => p.id === product.id);
			const availableStock = productWithStock?.stock ?? 0;

			if (availableStock === 0) {
				toast.error(
					'No se puede sincronizar: el producto no tiene stock disponible en la sucursal',
				);
				return;
			}
		}

		// Si pasa todas las validaciones, proceder con la asociación
		await onConfirm(product.id, sync, quantity);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='sm'>
			<ModalHeader>
				<h3 className='text-lg font-semibold'>Asociar producto</h3>
			</ModalHeader>
			<ModalBody>
				<p className='text-sm'>
					Producto: <strong>{product.name}</strong>
				</p>
				<div className='mt-3 flex items-center gap-3'>
					<Checkbox
						id='attach-sync'
						variant='switch'
						checked={sync}
						onChange={(e) => setSync(e.target.checked)}
					/>
					<label htmlFor='attach-sync' className='text-sm'>
						Sincronizar
					</label>
				</div>
				{!sync && (
					<div className='mt-3'>
						<label className='mb-1 block text-sm'>Cantidad</label>
						<Input
							name='cantidad'
							type='number'
							min='1'
							value={quantity}
							onChange={(e) => setQuantity(parseInt(e.target.value || '0'))}
						/>
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<div className='flex justify-end gap-2'>
					<Button variant='outline' onClick={onClose}>
						Cancelar
					</Button>
					<Button color='blue' onClick={handleConfirm} isLoading={isLoading}>
						Confirmar
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default AttachProductModal;
