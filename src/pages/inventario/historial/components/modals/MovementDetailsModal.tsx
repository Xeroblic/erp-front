/**
 * Modal para mostrar detalles completos de un movimiento de inventario
 * Incluye toda la información relevante del movimiento
 */
import React from 'react';
import { IInventoryMovement, MovementType } from '../../mocks/movements.mock';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../../../../components/ui/Modal';
import Button from '../../../../../components/ui/Button';
import Badge from '../../../../../components/ui/Badge';
import Icon from '../../../../../components/icon/Icon';
import { formatDate } from '../../../../../utils/format.utils';

interface MovementDetailsModalProps {
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	movement: IInventoryMovement | null;
}

export const MovementDetailsModal: React.FC<MovementDetailsModalProps> = ({
	isOpen,
	setIsOpen,
	movement,
}) => {
	if (!movement) return null;

	// Función para obtener badge del tipo de movimiento
	const getMovementTypeBadge = (type: MovementType) => {
		const config = {
			ENTRY: { color: 'emerald' as const, text: 'Entrada', icon: 'HeroArrowUp' },
			EXIT: { color: 'red' as const, text: 'Salida', icon: 'HeroArrowDown' },
			TRANSFER: { color: 'sky' as const, text: 'Transferencia', icon: 'HeroArrowsRightLeft' },
			ADJUSTMENT: { color: 'amber' as const, text: 'Ajuste', icon: 'HeroCog6Tooth' },
			SALE: { color: 'violet' as const, text: 'Venta', icon: 'HeroShoppingCart' },
			PURCHASE: { color: 'emerald' as const, text: 'Compra', icon: 'HeroShoppingBag' },
		};

		const { color, text, icon } = config[type] || config.ADJUSTMENT;
		return (
			<Badge color={color} variant='outline' className='gap-1'>
				<Icon icon={icon} className='h-3 w-3' />
				{text}
			</Badge>
		);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<Icon icon='HeroDocumentText' className='h-6 w-6 text-sky-600' />
					<div>
						<h3 className='text-lg font-semibold'>
							Detalles del Movimiento #{movement.id}
						</h3>
						<p className='text-sm text-gray-600'>
							Información completa del movimiento de inventario
						</p>
					</div>
				</div>
			</ModalHeader>

			<ModalBody>
				<div className='space-y-6'>
					{/* Información Principal */}
					<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
						{/* Tipo de Movimiento */}
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700'>
								Tipo de Movimiento
							</label>
							<div>{getMovementTypeBadge(movement.type)}</div>
						</div>

						{/* Fecha */}
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700'>
								Fecha y Hora
							</label>
							<div className='flex items-center gap-2'>
								<Icon icon='HeroCalendarDays' className='h-4 w-4 text-gray-400' />
								<span className='text-sm'>{formatDate(movement.created_at)}</span>
							</div>
						</div>

						{/* Producto */}
						<div className='md:col-span-2'>
							<label className='mb-2 block text-sm font-medium text-gray-700'>
								Producto
							</label>
							<div className='flex items-start gap-3 rounded-lg border p-3'>
								<div className='rounded-lg bg-gray-100 p-2'>
									<Icon icon='HeroCube' className='h-5 w-5 text-gray-600' />
								</div>
								<div className='flex-1'>
									<div className='font-medium'>
										{movement.product?.name || 'N/A'}
									</div>
									<div className='text-sm text-gray-600'>
										SKU:{' '}
										<code className='rounded bg-gray-100 px-1 py-0.5 text-xs'>
											{movement.product?.sku || 'N/A'}
										</code>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Información de Stock */}
					<div className='rounded-lg border p-4'>
						<h4 className='mb-4 font-medium'>Cambios en el Stock</h4>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
							{/* Stock Anterior */}
							<div className='text-center'>
								<div className='text-2xl font-bold text-gray-600'>
									{movement.previous_stock}
								</div>
								<div className='text-xs text-gray-500'>Stock Anterior</div>
							</div>

							{/* Flecha y Cantidad */}
							<div className='flex items-center justify-center'>
								<div className='flex items-center gap-2'>
									<div
										className={`rounded-full px-3 py-1 text-sm font-medium ${
											movement.quantity < 0
												? 'bg-red-100 text-red-700'
												: 'bg-emerald-100 text-emerald-700'
										}`}>
										{movement.quantity < 0 ? '' : '+'}
										{movement.quantity}
									</div>
									<Icon icon='HeroArrowRight' className='h-4 w-4 text-gray-400' />
								</div>
							</div>

							{/* Stock Actual */}
							<div className='text-center'>
								<div className='text-2xl font-bold text-sky-600'>
									{movement.current_stock}
								</div>
								<div className='text-xs text-gray-500'>Stock Actual</div>
							</div>
						</div>
					</div>

					{/* Información Adicional */}
					<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
						{/* Almacén */}
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700'>
								Almacén
							</label>
							<div className='flex items-center gap-2'>
								<Icon
									icon='HeroBuilding-StorefrontIcon'
									className='h-4 w-4 text-gray-400'
								/>
								<span className='text-sm'>{movement.warehouse?.name || 'N/A'}</span>
							</div>
						</div>

						{/* Responsable */}
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700'>
								Responsable
							</label>
							<div className='flex items-center gap-2'>
								<Icon icon='HeroUser' className='h-4 w-4 text-gray-400' />
								<span className='text-sm'>{movement.performer?.name || 'N/A'}</span>
							</div>
						</div>
					</div>

					{/* Referencia */}
					{movement.reference_type && movement.reference_id && (
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700'>
								Referencia
							</label>
							<div className='flex items-center gap-2 rounded-lg bg-sky-50 p-3'>
								<Icon icon='HeroLink' className='h-4 w-4 text-sky-600' />
								<span className='font-medium text-sky-700'>
									{movement.reference_type}#{movement.reference_id}
								</span>
							</div>
						</div>
					)}

					{/* Notas */}
					{movement.notes && (
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700'>
								Notas Adicionales
							</label>
							<div className='rounded-lg border p-3'>
								<div className='flex items-start gap-2'>
									<Icon
										icon='HeroChatBubbleBottomCenterText'
										className='mt-0.5 h-4 w-4 text-gray-400'
									/>
									<p className='text-sm text-gray-700'>{movement.notes}</p>
								</div>
							</div>
						</div>
					)}
				</div>
			</ModalBody>

			<ModalFooter>
				<div className='flex gap-2'>
					<Button variant='outline' color='gray' onClick={() => setIsOpen(false)}>
						<Icon icon='HeroXMark' className='h-4 w-4' />
						Cerrar
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default MovementDetailsModal;
