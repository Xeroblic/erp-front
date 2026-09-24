import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import type { IWarehouseProduct } from '@/interface/warehouse.interface';

interface RemoveProductModalProps {
	isOpen: boolean;
	product: IWarehouseProduct | null;
	onClose: () => void;
	onConfirm: (productId: number) => Promise<void>;
}

const RemoveProductModal: React.FC<RemoveProductModalProps> = ({
	isOpen,
	product,
	onClose,
	onConfirm,
}) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	if (!product) return null;

	const handleConfirm = async () => {
		setIsSubmitting(true);
		try {
			await onConfirm(product.id);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={() => {
				if (!isSubmitting) onClose();
			}}
			size='sm'
			isCentered
			isStaticBackdrop={isSubmitting}>
			<ModalHeader className='border-b border-zinc-200 pb-4 dark:border-zinc-700'>
				<h2 className='text-xl font-bold text-zinc-900 dark:text-white'>
					Quitar producto de la bodega
				</h2>
			</ModalHeader>
			<ModalBody>
				<Card className='border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
					<CardBody>
						<p className='text-lg'>
							¿Quitar <strong>{product.name}</strong> de esta bodega?
						</p>
						<p className='mt-1 font-mono text-sm text-zinc-500'>SKU {product.sku}</p>
						<p className='mt-2 text-sm text-zinc-500 dark:text-zinc-400'>
							La bodega deja de registrar sus{' '}
							{product.quantity.toLocaleString('es-CL')} unidades. Se puede volver a
							asociar después.
						</p>
					</CardBody>
				</Card>
			</ModalBody>
			<ModalFooter className='border-t border-zinc-200 pt-4 dark:border-zinc-700'>
				<ModalFooterChild>
					<Button variant='outline' onClick={onClose} isDisable={isSubmitting}>
						Cancelar
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						variant='outline'
						color='red'
						icon='HeroTrash'
						onClick={handleConfirm}
						isDisable={isSubmitting}
						isLoading={isSubmitting}>
						Quitar
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default RemoveProductModal;
