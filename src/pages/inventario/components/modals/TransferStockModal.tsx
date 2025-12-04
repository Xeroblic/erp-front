import { useState, ChangeEvent } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import { MockInventoryItem, mockWarehouses } from '../../data/mockData';

interface TransferStockModalProps {
	isOpen: boolean;
	onClose: () => void;
	item?: MockInventoryItem;
	onConfirm: (data: {
		fromWarehouseId: number;
		toWarehouseId: number;
		productId: number;
		quantity: number;
		reason: string;
	}) => Promise<void>;
}

export const TransferStockModal: React.FC<TransferStockModalProps> = ({
	isOpen,
	onClose,
	item,
	onConfirm,
}) => {
	const [toWarehouseId, setToWarehouseId] = useState<number>(0);
	const [quantity, setQuantity] = useState<number>(1);
	const [reason, setReason] = useState<string>('');
	const [loading, setLoading] = useState(false);

	const availableWarehouses = mockWarehouses.filter((w) => w.id !== item?.warehouse_id);

	const handleSubmit = async () => {
		if (!item || quantity <= 0 || !toWarehouseId || !reason.trim()) {
			return;
		}

		if (quantity > item.available_stock) {
			alert('La cantidad no puede ser mayor al stock disponible');
			return;
		}

		setLoading(true);
		try {
			await onConfirm({
				fromWarehouseId: item.warehouse_id,
				toWarehouseId,
				productId: item.product_id,
				quantity,
				reason: reason.trim(),
			});
			handleClose();
		} catch (error) {
			console.error('Error al transferir stock:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setToWarehouseId(0);
		setQuantity(1);
		setReason('');
		setLoading(false);
		onClose();
	};

	if (!item) return null;

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} isCentered isScrollable>
			<ModalHeader>
				<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
					Transferir Stock
				</h3>
				<p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>{item.product.name}</p>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4'>
					{/* Info de origen */}
					<div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-800'>
						<h4 className='mb-2 font-medium text-gray-900 dark:text-gray-100'>
							Almacén de Origen
						</h4>
						<div className='text-sm'>
							<div className='font-semibold text-gray-900 dark:text-gray-100'>
								{item.warehouse.name}
							</div>
							<div className='mt-1 text-gray-500 dark:text-gray-400'>
								Stock disponible: {item.available_stock}
							</div>
						</div>
					</div>

					{/* Seleccionar destino */}
					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Almacén de Destino
						</label>
						<Select
							name='toWarehouseId'
							value={toWarehouseId}
							onChange={(e: ChangeEvent<HTMLSelectElement>) =>
								setToWarehouseId(Number(e.target.value))
							}>
							<option value={0}>Seleccione almacén de destino</option>
							{availableWarehouses.map((warehouse) => (
								<option key={warehouse.id} value={warehouse.id}>
									{warehouse.name} - {warehouse.location}
								</option>
							))}
						</Select>
					</div>

					{/* Cantidad */}
					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Cantidad a Transferir
						</label>
						<Input
							name='quantity'
							type='number'
							min={1}
							max={item.available_stock}
							value={quantity}
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								setQuantity(Number(e.target.value))
							}
							placeholder='Ingrese cantidad'
							className='w-full'
						/>
						<p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
							Máximo disponible: {item.available_stock}
						</p>
					</div>

					{/* Razón */}
					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Razón de la Transferencia
						</label>
						<Select
							name='reason'
							value={reason}
							onChange={(e: ChangeEvent<HTMLSelectElement>) =>
								setReason(e.target.value)
							}>
							<option value=''>Seleccione una razón</option>
							<option value='Rebalanceo de stock'>Rebalanceo de stock</option>
							<option value='Solicitud de almacén'>Solicitud de almacén</option>
							<option value='Optimización logística'>Optimización logística</option>
							<option value='Stock de seguridad'>Stock de seguridad</option>
							<option value='Demanda regional'>Demanda regional</option>
							<option value='Otro'>Otro</option>
						</Select>
					</div>

					{/* Resumen */}
					{toWarehouseId > 0 && quantity > 0 && (
						<div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
							<h4 className='mb-2 font-medium text-blue-900 dark:text-blue-100'>
								Resumen de Transferencia
							</h4>
							<div className='text-sm text-blue-800 dark:text-blue-200'>
								<p>
									Se transferirán <strong>{quantity}</strong> unidades
								</p>
								<p>
									Desde: <strong>{item.warehouse.name}</strong>
								</p>
								<p>
									Hacia:{' '}
									<strong>
										{
											availableWarehouses.find((w) => w.id === toWarehouseId)
												?.name
										}
									</strong>
								</p>
								<p className='mt-2 text-blue-600 dark:text-blue-300'>
									Stock restante en origen: {item.available_stock - quantity}
								</p>
							</div>
						</div>
					)}
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
					isDisable={
						quantity <= 0 ||
						!toWarehouseId ||
						!reason.trim() ||
						quantity > item.available_stock
					}>
					Confirmar Transferencia
				</Button>
			</ModalFooter>
		</Modal>
	);
};
