import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import { useState, ChangeEvent } from 'react';
import { MockInventoryItem, mockWarehouses } from '../../data/mockData';

interface AdjustStockModalProps {
	isOpen: boolean;
	onClose: () => void;
	item?: MockInventoryItem;
	onConfirm: (data: {
		productId: number;
		warehouseId: number;
		quantity: number;
		reason: string;
	}) => Promise<void>;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
	isOpen,
	onClose,
	item,
	onConfirm,
}) => {
	const [quantity, setQuantity] = useState<number>(0);
	const [reason, setReason] = useState<string>('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (!item || quantity === 0 || !reason.trim()) {
			return;
		}

		setLoading(true);
		try {
			await onConfirm({
				productId: item.product_id,
				warehouseId: item.warehouse_id,
				quantity,
				reason: reason.trim(),
			});
			handleClose();
		} catch (error) {
			console.error('Error al ajustar stock:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setQuantity(0);
		setReason('');
		setLoading(false);
		onClose();
	};

	if (!item) return null;

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} isCentered isScrollable>
			<ModalHeader>
				<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
					Ajustar Stock
				</h3>
				<p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
					{item.product.name} - {item.warehouse.name}
				</p>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4'>
					{/* Info actual */}
					<div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-800'>
						<h4 className='mb-2 font-medium text-gray-900 dark:text-gray-100'>
							Stock Actual
						</h4>
						<div className='grid grid-cols-3 gap-4 text-sm'>
							<div>
								<span className='text-gray-500 dark:text-gray-400'>Total:</span>
								<div className='font-semibold text-gray-900 dark:text-gray-100'>
									{item.current_stock}
								</div>
							</div>
							<div>
								<span className='text-gray-500 dark:text-gray-400'>
									Disponible:
								</span>
								<div className='font-semibold text-green-600 dark:text-green-400'>
									{item.available_stock}
								</div>
							</div>
							<div>
								<span className='text-gray-500 dark:text-gray-400'>Reservado:</span>
								<div className='font-semibold text-blue-600 dark:text-blue-400'>
									{item.reserved_stock}
								</div>
							</div>
						</div>
					</div>

					{/* Formulario de ajuste */}
					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Cantidad de Ajuste
						</label>
						<Input
							name='quantity'
							type='number'
							value={quantity}
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								setQuantity(Number(e.target.value))
							}
							placeholder='Ingrese cantidad (+ para sumar, - para restar)'
							className='w-full'
						/>
						<p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
							Nuevo stock: {item.current_stock + quantity}
						</p>
					</div>

					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Razón del Ajuste
						</label>
						<Select
							name='reason'
							value={reason}
							onChange={(e: ChangeEvent<HTMLSelectElement>) =>
								setReason(e.target.value)
							}>
							<option value=''>Seleccione una razón</option>
							<option value='Inventario físico'>Inventario físico</option>
							<option value='Producto dañado'>Producto dañado</option>
							<option value='Producto vencido'>Producto vencido</option>
							<option value='Error de sistema'>Error de sistema</option>
							<option value='Devolución'>Devolución</option>
							<option value='Otro'>Otro</option>
						</Select>
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<Button color='zinc' variant='outline' onClick={handleClose} isDisable={loading}>
					Cancelar
				</Button>
				<Button
					color='blue'
					onClick={handleSubmit}
					isLoading={loading}
					isDisable={quantity === 0 || !reason.trim()}>
					Confirmar Ajuste
				</Button>
			</ModalFooter>
		</Modal>
	);
};
