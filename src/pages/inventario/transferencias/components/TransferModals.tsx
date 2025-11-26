import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { TransferResult } from '../types';

interface ConfirmTransferModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	summary: {
		fromWarehouse: string;
		toWarehouse: string;
		responsible: string;
		productCount: number;
		totalUnits: number;
		notes?: string;
	};
}

export const ConfirmTransferModal: React.FC<ConfirmTransferModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	summary,
}) => (
	<Modal isOpen={isOpen} setIsOpen={onClose} size='2xl'>
		<ModalHeader>
			<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
				Confirmar Transferencia
			</h3>
		</ModalHeader>
		<ModalBody>
			<div className='space-y-6'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-3'>
							<span>
								<svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
									/>
								</svg>
							</span>
							Resumen de Transferencia
						</CardTitle>
					</CardHeader>
					<CardBody>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Desde
								</label>
								<p className='font-medium text-gray-900 dark:text-gray-100'>
									{summary.fromWarehouse || '—'}
								</p>
							</div>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Hacia
								</label>
								<p className='font-medium text-gray-900 dark:text-gray-100'>
									{summary.toWarehouse || '—'}
								</p>
							</div>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Responsable
								</label>
								<p className='font-medium text-gray-900 dark:text-gray-100'>
									{summary.responsible || '—'}
								</p>
							</div>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Total productos
								</label>
								<p className='font-medium text-gray-900 dark:text-gray-100'>
									{summary.productCount} productos ({summary.totalUnits} unidades)
								</p>
							</div>
							{summary.notes && (
								<div className='col-span-2'>
									<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Notas
									</label>
									<p className='font-medium text-gray-900 dark:text-gray-100'>
										{summary.notes}
									</p>
								</div>
							)}
						</div>
					</CardBody>
				</Card>
				<Card>
					<CardBody>
						<div className='flex items-start gap-3'>
							<span className='text-amber-600'>
								<svg className='h-6 w-6' fill='currentColor' viewBox='0 0 24 24'>
									<path
										fillRule='evenodd'
										d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
										clipRule='evenodd'
									/>
								</svg>
							</span>
							<div>
								<h4 className='font-medium text-amber-600'>Importante</h4>
								<p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
									Esta acción creará movimientos de inventario y no podrá ser revertida
									automáticamente. Asegúrese de que toda la información esté correcta antes de
									continuar.
								</p>
							</div>
						</div>
					</CardBody>
				</Card>
			</div>
		</ModalBody>
		<ModalFooter>
			<Button variant='outline' color='gray' icon='HeroXMark' onClick={onClose}>
				Cancelar
			</Button>
			<Button color='emerald' icon='HeroCheck' onClick={onConfirm}>
				Confirmar y Procesar
			</Button>
		</ModalFooter>
	</Modal>
);

interface SuccessTransferModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	result: TransferResult | null;
	onCreateAnother: () => void;
	onViewHistory: () => void;
}

export const SuccessTransferModal: React.FC<SuccessTransferModalProps> = ({
	isOpen,
	setIsOpen,
	result,
	onCreateAnother,
	onViewHistory,
}) => (
	<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='2xl'>
		<ModalHeader>
			<div className='flex items-center gap-3'>
				<div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
					<svg className='h-6 w-6 text-green-600' fill='currentColor' viewBox='0 0 24 24'>
						<path
							fillRule='evenodd'
							d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
							clipRule='evenodd'
						/>
					</svg>
				</div>
				<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
					Transferencia Exitosa
				</h3>
			</div>
		</ModalHeader>
		<ModalBody>
			{result && (
				<div className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-3'>
								<span className='text-green-600'>
									<svg className='h-6 w-6' fill='currentColor' viewBox='0 0 24 24'>
										<path
											fillRule='evenodd'
											d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
											clipRule='evenodd'
										/>
									</svg>
								</span>
								Transferencia Completada
							</CardTitle>
						</CardHeader>
						<CardBody>
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										ID Transferencia
									</label>
									<p className='font-mono font-medium text-gray-900 dark:text-gray-100'>
										{result.id}
									</p>
								</div>
								<div>
									<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Total Productos
									</label>
									<p className='font-medium text-gray-900 dark:text-gray-100'>
										{result.total_items} unidades
									</p>
								</div>
								<div className='col-span-2'>
									<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Fecha y Hora
									</label>
									<p className='font-medium text-gray-900 dark:text-gray-100'>
										{new Date(result.created_at).toLocaleString('es-ES', {
											year: 'numeric',
											month: 'long',
											day: 'numeric',
											hour: '2-digit',
											minute: '2-digit',
										})}
									</p>
								</div>
							</div>
						</CardBody>
					</Card>
					<Card>
						<CardBody>
							<div className='flex items-start gap-3'>
								<span className='text-sky-600'>
									<svg className='h-6 w-6' fill='currentColor' viewBox='0 0 24 24'>
										<path
											fillRule='evenodd'
											d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
											clipRule='evenodd'
										/>
									</svg>
								</span>
								<div>
									<h4 className='font-medium text-sky-600'>¿Qué sigue?</h4>
									<ul className='mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400'>
										<li>• Los movimientos de inventario han sido registrados</li>
										<li>• Puede revisar el historial de transferencias para seguimiento</li>
										<li>• Los reportes de inventario reflejarán estos cambios</li>
									</ul>
								</div>
							</div>
						</CardBody>
					</Card>
				</div>
			)}
		</ModalBody>
		<ModalFooter>
			<Button variant='outline' color='gray' icon='HeroPlus' onClick={onCreateAnother}>
				Crear Otra Transferencia
			</Button>
			<Button color='sky' icon='HeroEye' onClick={onViewHistory}>
				Ver en Historial
			</Button>
		</ModalFooter>
	</Modal>
);

interface RemoveProductModalProps {
	isOpen: boolean;
	productName?: string;
	onCancel: () => void;
	onConfirm: () => void;
}

export const RemoveProductModal: React.FC<RemoveProductModalProps> = ({
	isOpen,
	productName,
	onCancel,
	onConfirm,
}) => (
	<Modal isOpen={isOpen} setIsOpen={onCancel} size='md'>
		<ModalHeader>
			<div className='flex items-center gap-3'>
				<span className='text-red-600'>
					<svg className='h-6 w-6' fill='currentColor' viewBox='0 0 24 24'>
						<path
							fillRule='evenodd'
							d='M9 2a1 1 0 000 2h6a1 1 0 100-2H9z'
							clipRule='evenodd'
						/>
						<path
							fillRule='evenodd'
							d='M10 5a2 2 0 00-2 2v1a1 1 0 001 1h6a1 1 0 001-1V7a2 2 0 00-2-2H10zM8.5 10a.5.5 0 000 1v6a1.5 1.5 0 001.5 1.5h4a1.5 1.5 0 001.5-1.5v-6a.5.5 0 000-1h-7z'
							clipRule='evenodd'
						/>
					</svg>
				</span>
				<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
					Confirmar Eliminación
				</h3>
			</div>
		</ModalHeader>
		<ModalBody>
			<div className='space-y-4'>
				<p className='text-gray-500 dark:text-gray-400'>
					¿Está seguro que desea remover {productName ?? 'este producto'} de la transferencia?
				</p>
				<Card>
					<CardBody>
						<div className='flex items-start gap-3'>
							<span className='text-amber-600'>
								<svg className='h-5 w-5' fill='currentColor' viewBox='0 0 24 24'>
									<path
										fillRule='evenodd'
										d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
										clipRule='evenodd'
									/>
								</svg>
							</span>
							<div>
								<p className='text-sm text-gray-500 dark:text-gray-400'>
									Esta acción no se puede deshacer. El producto será removido de la lista actual.
								</p>
							</div>
						</div>
					</CardBody>
				</Card>
			</div>
		</ModalBody>
		<ModalFooter>
			<Button variant='outline' color='gray' onClick={onCancel}>
				Cancelar
			</Button>
			<Button color='red' icon='HeroTrash' onClick={onConfirm}>
				Sí, Remover
			</Button>
		</ModalFooter>
	</Modal>
);

interface ClearListModalProps {
	isOpen: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	itemCount: number;
	totalUnits: number;
}

export const ClearListModal: React.FC<ClearListModalProps> = ({
	isOpen,
	onCancel,
	onConfirm,
	itemCount,
	totalUnits,
}) => (
	<Modal isOpen={isOpen} setIsOpen={onCancel} size='md'>
		<ModalHeader>
			<div className='flex items-center gap-3'>
				<span className='text-amber-600'>
					<svg className='h-6 w-6' fill='currentColor' viewBox='0 0 24 24'>
						<path
							fillRule='evenodd'
							d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
							clipRule='evenodd'
						/>
					</svg>
				</span>
				<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
					Limpiar Lista de Productos
				</h3>
			</div>
		</ModalHeader>
		<ModalBody>
			<div className='space-y-4'>
				<p className='text-gray-500 dark:text-gray-400'>
					¿Está seguro que desea limpiar toda la lista de productos? Esta acción eliminará todos los
					productos agregados.
				</p>
				<Card>
					<CardBody>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-3'>
								<span>
									<svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth='2'
											d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
										/>
									</svg>
								</span>
								<div className='text-sm'>
									<p className='font-medium text-gray-900 dark:text-gray-100'>
										Productos actuales
									</p>
									<p className='text-gray-500 dark:text-gray-400'>
										{itemCount} productos, {totalUnits} unidades
									</p>
								</div>
							</div>
						</div>
					</CardBody>
				</Card>
			</div>
		</ModalBody>
		<ModalFooter>
			<Button variant='outline' color='gray' onClick={onCancel}>
				Cancelar
			</Button>
			<Button color='red' icon='HeroTrash' onClick={onConfirm}>
				Sí, Limpiar Lista
			</Button>
		</ModalFooter>
	</Modal>
);
