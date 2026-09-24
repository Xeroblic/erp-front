import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import Checkbox from '@/components/form/Checkbox';
import Input from '@/components/form/Input';
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
		<Modal
			isOpen={isOpen}
			setIsOpen={() => {
				if (!isLoading) onClose();
			}}
			size='sm'
			isCentered
			isStaticBackdrop={isLoading}>
			<ModalHeader className='border-b border-zinc-200 pb-4 dark:border-zinc-700'>
				<h2 className='text-xl font-bold text-zinc-900 dark:text-white'>
					Asociar producto
				</h2>
			</ModalHeader>
			<ModalBody>
				<Card className='border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
					<CardBody className='space-y-4'>
						<div>
							<p className='text-lg font-semibold'>{product.name}</p>
							<p className='font-mono text-sm text-zinc-500'>SKU {product.sku}</p>
						</div>
						<div className='flex items-start gap-3'>
							<Checkbox
								id='attach-sync'
								variant='switch'
								checked={sync}
								onChange={(e) => setSync(e.target.checked)}
							/>
							<label htmlFor='attach-sync' className='text-sm'>
								<span className='font-medium'>Sincronizar con el stock</span>
								<span className='block text-zinc-500'>
									{sync
										? 'La bodega toma el stock de la sucursal.'
										: 'Indicas a mano cuántas unidades guarda la bodega.'}
								</span>
							</label>
						</div>
						{!sync && (
							<div className='space-y-1'>
								<label
									htmlFor='attach-quantity'
									className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
									Cantidad
								</label>
								<Input
									id='attach-quantity'
									name='cantidad'
									type='number'
									min='1'
									value={quantity}
									onChange={(e) => setQuantity(parseInt(e.target.value || '0'))}
								/>
							</div>
						)}
					</CardBody>
				</Card>
			</ModalBody>
			<ModalFooter className='border-t border-zinc-200 pt-4 dark:border-zinc-700'>
				<ModalFooterChild>
					<Button variant='outline' onClick={onClose} isDisable={isLoading}>
						Cancelar
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						variant='solid'
						color='blue'
						icon='HeroPlus'
						onClick={handleConfirm}
						isDisable={isLoading}
						isLoading={isLoading}>
						Asociar
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default AttachProductModal;
