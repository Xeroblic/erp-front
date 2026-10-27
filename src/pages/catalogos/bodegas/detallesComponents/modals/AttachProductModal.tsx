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
import Input from '@/components/form/Input';
import { IWarehouseProduct } from '@/interface/warehouse.interface';
import { IProduct } from '@/interface/product.interface';

interface AttachProductModalProps {
	isOpen: boolean;
	product: IProduct | null;
	associatedProducts?: IWarehouseProduct[];
	onClose: () => void;
	onConfirm: (productId: number, quantity: number) => Promise<void>;
	isLoading?: boolean;
}

const AttachProductModal: React.FC<AttachProductModalProps> = ({
	isOpen,
	product,
	associatedProducts = [],
	onClose,
	onConfirm,
	isLoading = false,
}) => {
	const [quantity, setQuantity] = useState(1);

	useEffect(() => {
		if (isOpen) {
			setQuantity(1);
		}
	}, [isOpen, product?.id]);

	if (!product) return null;

	const handleConfirm = async () => {
		const isAlreadyAssociated = associatedProducts.some((p) => p.id === product.id);
		if (isAlreadyAssociated) {
			toast.warning('El producto ya está asociado a esta bodega');
			return;
		}

		if (!Number.isInteger(quantity) || quantity <= 0) {
			toast.error('La cantidad debe ser un número entero mayor a 0');
			return;
		}

		await onConfirm(product.id, quantity);
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
				<Card className='border border-zinc-200 bg-white shadow-xs dark:border-zinc-700 dark:bg-zinc-900'>
					<CardBody className='space-y-4'>
						<div>
							<p className='text-lg font-semibold'>{product.name}</p>
							<p className='font-mono text-sm text-zinc-500'>SKU {product.sku}</p>
						</div>
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
								step='1'
								value={quantity}
								onChange={(e) => setQuantity(Number(e.target.value))}
							/>
						</div>
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
