import React, { useState } from 'react';
import { useAppDispatch } from '@/store';
import { transferInventory } from '@/store/slices/inventory/inventorySlice';
import { useNavigate } from 'react-router-dom';

// Components
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import { toast } from 'react-toastify';

// Mock data para bodegas
const MOCK_WAREHOUSES = [
	{ id: 1, name: 'Bodega Central', code: 'BC01' },
	{ id: 2, name: 'Bodega Norte', code: 'BN02' },
	{ id: 3, name: 'Bodega Sur', code: 'BS03' },
	{ id: 4, name: 'Bodega Distribución', code: 'BD04' },
];

// Mock data para productos
const MOCK_PRODUCTS = [
	{ id: 1, name: 'Laptop Dell Inspiron 15', sku: 'LAP-DELL-15', stock: 25 },
	{ id: 2, name: 'Monitor Samsung 24"', sku: 'MON-SAM-24', stock: 40 },
	{ id: 3, name: 'Teclado Mecánico Logitech', sku: 'TEC-LOG-MEC', stock: 15 },
	{ id: 4, name: 'Mouse Óptico HP', sku: 'MOU-HP-OPT', stock: 60 },
	{ id: 5, name: 'Impresora HP LaserJet', sku: 'IMP-HP-LASER', stock: 8 },
];

// Mock data para usuarios/responsables
const MOCK_USERS = [
	{ id: 1, name: 'Ana García', email: 'ana.garcia@empresa.com' },
	{ id: 2, name: 'Carlos Rodríguez', email: 'carlos.rodriguez@empresa.com' },
	{ id: 3, name: 'María López', email: 'maria.lopez@empresa.com' },
	{ id: 4, name: 'José Martínez', email: 'jose.martinez@empresa.com' },
];

interface TransferItem {
	product_id: number;
	product_name: string;
	product_sku: string;
	quantity: number;
	available_stock: number;
}

const Transferencias: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	// Form state
	const [transferForm, setTransferForm] = useState({
		from_warehouse_id: '',
		to_warehouse_id: '',
		responsible_id: '',
		notes: '',
	});

	const [items, setItems] = useState<TransferItem[]>([]);
	const [selectedProduct, setSelectedProduct] = useState('');
	const [quantity, setQuantity] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);

	// Modal states
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
	const [showClearListModal, setShowClearListModal] = useState(false);
	const [productToRemove, setProductToRemove] = useState<number | null>(null);
	const [transferResult, setTransferResult] = useState<{
		id: string;
		total_items: number;
		created_at: string;
	} | null>(null);

	const handleAddProduct = () => {
		if (!selectedProduct || !quantity || parseFloat(quantity) <= 0) {
			toast.error('Seleccione un producto y especifique cantidad válida');
			return;
		}

		const product = MOCK_PRODUCTS.find((p) => p.id === parseInt(selectedProduct));
		if (!product) return;

		const qty = parseFloat(quantity);
		if (qty > product.stock) {
			toast.error(`Stock insuficiente. Disponible: ${product.stock}`);
			return;
		}

		// Verificar si el producto ya está en la lista
		const existingItem = items.find((item) => item.product_id === product.id);
		if (existingItem) {
			setItems(
				items.map((item) =>
					item.product_id === product.id
						? { ...item, quantity: item.quantity + qty }
						: item,
				),
			);
		} else {
			setItems([
				...items,
				{
					product_id: product.id,
					product_name: product.name,
					product_sku: product.sku,
					quantity: qty,
					available_stock: product.stock,
				},
			]);
		}

		setSelectedProduct('');
		setQuantity('');
		toast.success('Producto agregado a la transferencia');
	};

	const handleRemoveProduct = (productId: number) => {
		setProductToRemove(productId);
		setShowRemoveConfirmModal(true);
	};

	const confirmRemoveProduct = () => {
		if (productToRemove) {
			setItems(items.filter((item) => item.product_id !== productToRemove));
			toast.info('Producto removido de la transferencia');
		}
		setShowRemoveConfirmModal(false);
		setProductToRemove(null);
	};

	const handleClearList = () => {
		setShowClearListModal(true);
	};

	const confirmClearList = () => {
		setItems([]);
		setShowClearListModal(false);
		toast.info('Lista de productos limpiada');
	};

	const handleConfirmTransfer = async () => {
		// Validaciones básicas
		if (
			!transferForm.from_warehouse_id ||
			!transferForm.to_warehouse_id ||
			!transferForm.responsible_id
		) {
			toast.error('Complete todos los campos obligatorios');
			return;
		}

		if (items.length === 0) {
			toast.error('Agregue al menos un producto');
			return;
		}

		if (transferForm.from_warehouse_id === transferForm.to_warehouse_id) {
			toast.error('La bodega de origen debe ser diferente a la de destino');
			return;
		}

		// Mostrar modal de confirmación
		setShowConfirmModal(true);
	};

	const handleProceedWithTransfer = async () => {
		setShowConfirmModal(false);
		setIsProcessing(true);

		try {
			const totalItems = getTotalItems();

			// Simular procesamiento
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Procesar cada producto de la transferencia
			for (const item of items) {
				await dispatch(
					transferInventory({
						product_id: item.product_id,
						from_warehouse_id: parseInt(transferForm.from_warehouse_id),
						to_warehouse_id: parseInt(transferForm.to_warehouse_id),
						quantity: item.quantity,
						notes: `Transferencia - Responsable: ${MOCK_USERS.find((u) => u.id === parseInt(transferForm.responsible_id))?.name}. ${transferForm.notes || ''}`,
					}),
				).unwrap();
			}

			// Preparar datos del resultado
			const result = {
				id: `TRF-${Date.now()}`,
				total_items: totalItems,
				created_at: new Date().toISOString(),
			};

			setTransferResult(result);

			// Limpiar formulario
			setTransferForm({
				from_warehouse_id: '',
				to_warehouse_id: '',
				responsible_id: '',
				notes: '',
			});
			setItems([]);

			setShowSuccessModal(true);
		} catch (error) {
			toast.error('Error al procesar la transferencia');
		} finally {
			setIsProcessing(false);
		}
	};

	const handleViewHistory = () => {
		setShowSuccessModal(false);
		navigate('/inventario/historial?tipo=TRANSFER');
	};

	const handleCreateAnother = () => {
		setShowSuccessModal(false);
		setTransferResult(null);
		// El formulario ya está limpio
	};

	const getTotalItems = () => {
		return items.reduce((sum, item) => sum + item.quantity, 0);
	};

	const getWarehouseName = (id: string) => {
		const warehouse = MOCK_WAREHOUSES.find((w) => w.id.toString() === id);
		return warehouse ? `${warehouse.name} (${warehouse.code})` : '';
	};

	const getResponsibleName = (id: string) => {
		const user = MOCK_USERS.find((u) => u.id.toString() === id);
		return user ? user.name : '';
	};

	return (
		<Container>
			{/* Header */}
            <Card className='mb-8'>
                <CardHeader>
                    <CardTitle className='text-center'>Nueva Transferencia</CardTitle>
                </CardHeader>
                <CardBody>
                    <div className='text-center'>
                        <p className='text-zinc-500 mb-4'>
                            Transferir productos entre bodegas de forma rápida y segura
                        </p>
                        <div className='flex justify-center gap-3'>
                            <Button
                                variant='outline'
                                color='gray'
                                icon='HeroClockIcon'
                                onClick={() => navigate('/inventario/historial?tipo=TRANSFER')}>
                                Ver Historial
                            </Button>
                            <Button
                                variant='outline'
                                color='gray'
                                icon='HeroDocumentTextIcon'
                                onClick={() => navigate('/inventario')}>
                                Ver Inventario
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

			{/* Progress indicator */}
			{items.length > 0 && (
				<Card className='mb-6'>
					<CardBody>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white'>
									<span className='text-sm font-semibold'>{items.length}</span>
								</div>
								<div>
									<p className='font-medium text-gray-900 dark:text-gray-100'>
										{items.length} producto{items.length !== 1 ? 's' : ''}{' '}
										agregado
										{items.length !== 1 ? 's' : ''}
									</p>
									<p className='text-sm text-gray-500 dark:text-gray-400'>
										Total: {getTotalItems()} unidades
									</p>
								</div>
							</div>
							<Badge color='emerald' variant='solid'>
								Listo para transferir
							</Badge>
						</div>
					</CardBody>
				</Card>
			)}

			<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
				{/* Formulario de transferencia */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-3'>
							<span>
								<svg
									className='h-6 w-6'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
									/>
								</svg>
							</span>
							Información de Transferencia
						</CardTitle>
					</CardHeader>
					<CardBody>
						<div className='space-y-4'>
							{/* Bodega origen */}
							<div>
								<label className='mb-2 block text-sm font-medium'>
									Bodega de Origen *
								</label>
								<Select
									name='from_warehouse_id'
									value={transferForm.from_warehouse_id}
									onChange={(e) =>
										setTransferForm({
											...transferForm,
											from_warehouse_id: e.target.value,
										})
									}
									required>
									<option value=''>Seleccionar bodega origen</option>
									{MOCK_WAREHOUSES.map((warehouse) => (
										<option key={warehouse.id} value={warehouse.id.toString()}>
											{warehouse.name} ({warehouse.code})
										</option>
									))}
								</Select>
							</div>

							{/* Bodega destino */}
							<div>
								<label className='mb-2 block text-sm font-medium'>
									Bodega de Destino *
								</label>
								<Select
									name='to_warehouse_id'
									value={transferForm.to_warehouse_id}
									onChange={(e) =>
										setTransferForm({
											...transferForm,
											to_warehouse_id: e.target.value,
										})
									}
									required>
									<option value=''>Seleccionar bodega destino</option>
									{MOCK_WAREHOUSES.filter(
										(w) => w.id.toString() !== transferForm.from_warehouse_id,
									).map((warehouse) => (
										<option key={warehouse.id} value={warehouse.id.toString()}>
											{warehouse.name} ({warehouse.code})
										</option>
									))}
								</Select>
							</div>

							{/* Responsable */}
							<div>
								<label className='mb-2 block text-sm font-medium'>
									Responsable *
								</label>
								<Select
									name='responsible_id'
									value={transferForm.responsible_id}
									onChange={(e) =>
										setTransferForm({
											...transferForm,
											responsible_id: e.target.value,
										})
									}
									required>
									<option value=''>Seleccionar responsable</option>
									{MOCK_USERS.map((user) => (
										<option key={user.id} value={user.id.toString()}>
											{user.name} - {user.email}
										</option>
									))}
								</Select>
							</div>

							{/* Notas */}
							<div>
								<label className='mb-2 block text-sm font-medium'>
									Notas (opcional)
								</label>
								<Textarea
									rows={3}
									placeholder='Notas adicionales sobre la transferencia'
									value={transferForm.notes}
									onChange={(e) =>
										setTransferForm({
											...transferForm,
											notes: e.target.value,
										})
									}
								/>
							</div>
						</div>
					</CardBody>
				</Card>

				{/* Agregar productos */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-3'>
							<span>
								<svg
									className='h-6 w-6'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M12 6v6m0 0v6m0-6h6m-6 0H6'
									/>
								</svg>
							</span>
							Agregar Productos
						</CardTitle>
					</CardHeader>
					<CardBody>
						<div className='space-y-4'>
							<div>
								<label className='mb-2 block text-sm font-medium'>Producto</label>
								<Select
									name='product_id'
									value={selectedProduct}
									onChange={(e) => setSelectedProduct(e.target.value)}>
									<option value=''>Seleccionar producto</option>
									{MOCK_PRODUCTS.map((product) => (
										<option key={product.id} value={product.id.toString()}>
											{product.name} ({product.sku}) - Stock: {product.stock}
										</option>
									))}
								</Select>
							</div>

							<div>
								<label className='mb-2 block text-sm font-medium'>Cantidad</label>
								<Input
									name='quantity'
									type='number'
									min='1'
									step='1'
									placeholder='Cantidad a transferir'
									value={quantity}
									onChange={(e) => setQuantity(e.target.value)}
								/>
							</div>

							<Button
								onClick={handleAddProduct}
								icon='HeroPlus'
								color='emerald'
								variant='solid'
								isDisable={!selectedProduct || !quantity}>
								Agregar Producto
							</Button>
						</div>
					</CardBody>
				</Card>
			</div>

			{/* Tabla de productos */}
			{items.length > 0 && (
				<Card className='mt-6'>
					<CardHeader>
						<CardTitle className='flex items-center justify-between'>
							<div className='flex items-center gap-3'>
								<span>
									<svg
										className='h-6 w-6'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth='2'
											d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
										/>
									</svg>
								</span>
								Productos a Transferir
							</div>
							<div className='flex items-center gap-3'>
								<Badge color='sky' variant='outline'>
									{items.length} producto{items.length !== 1 ? 's' : ''}
								</Badge>
								<Badge color='emerald' variant='outline'>
									{getTotalItems()} unidades
								</Badge>
							</div>
						</CardTitle>
					</CardHeader>
					<CardBody>
						<div className='overflow-x-auto'>
							<Table>
								<THead>
									<Tr>
										<Th>Producto</Th>
										<Th>SKU</Th>
										<Th>Cantidad</Th>
										<Th>Stock Disponible</Th>
										<Th>Acciones</Th>
									</Tr>
								</THead>
								<TBody>
									{items.map((item, index) => (
										<Tr key={`${item.product_id}-${index}`}>
											<Td>
												<div className='font-medium text-gray-900 dark:text-gray-100'>
													{item.product_name}
												</div>
											</Td>
											<Td>
												<Badge color='sky' variant='outline'>
													{item.product_sku}
												</Badge>
											</Td>
											<Td>
												<span className='text-lg font-semibold text-emerald-600'>
													{item.quantity}
												</span>
											</Td>
											<Td>
												<span className='text-gray-500 dark:text-gray-400'>
													{item.available_stock}
												</span>
											</Td>
											<Td>
												<Button
													size='xs'
													color='red'
													variant='outline'
													icon='HeroTrash'
													onClick={() =>
														handleRemoveProduct(item.product_id)
													}>
													Remover
												</Button>
											</Td>
										</Tr>
									))}
								</TBody>
							</Table>
						</div>

						{/* Acciones finales */}
						<div className='mt-6 flex items-center justify-end gap-3'>
							<Button
								variant='outline'
								color='gray'
								icon='HeroTrash'
								onClick={handleClearList}
								isDisable={items.length === 0}>
								Limpiar Lista
							</Button>

							<PermissionGuard permissions={[ERP_PERMISSIONS.INVENTORY.TRANSFER]}>
								<Button
									variant='solid'
									color='emerald'
									icon='HeroArrowRight'
									isLoading={isProcessing}
									onClick={handleConfirmTransfer}>
									Confirmar Transferencia
								</Button>
							</PermissionGuard>
						</div>
					</CardBody>
				</Card>
			)}

			{/* Modal de confirmación */}
			<Modal isOpen={showConfirmModal} setIsOpen={setShowConfirmModal} size='2xl'>
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
										<svg
											className='h-6 w-6'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'>
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
											{getWarehouseName(transferForm.from_warehouse_id)}
										</p>
									</div>
									<div>
										<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
											Hacia
										</label>
										<p className='font-medium text-gray-900 dark:text-gray-100'>
											{getWarehouseName(transferForm.to_warehouse_id)}
										</p>
									</div>
									<div>
										<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
											Responsable
										</label>
										<p className='font-medium text-gray-900 dark:text-gray-100'>
											{getResponsibleName(transferForm.responsible_id)}
										</p>
									</div>
									<div>
										<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
											Total productos
										</label>
										<p className='font-medium text-gray-900 dark:text-gray-100'>
											{items.length} productos ({getTotalItems()} unidades)
										</p>
									</div>
									{transferForm.notes && (
										<div className='col-span-2'>
											<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Notas
											</label>
											<p className='font-medium text-gray-900 dark:text-gray-100'>
												{transferForm.notes}
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
										<svg
											className='h-6 w-6'
											fill='currentColor'
											viewBox='0 0 24 24'>
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
											Esta acción creará movimientos de inventario y no podrá
											ser revertida automáticamente. Asegúrese de que toda la
											información esté correcta antes de continuar.
										</p>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button
						variant='outline'
						color='gray'
						icon='HeroXMark'
						onClick={() => setShowConfirmModal(false)}>
						Cancelar
					</Button>
					<Button color='emerald' icon='HeroCheck' onClick={handleProceedWithTransfer}>
						Confirmar y Procesar
					</Button>
				</ModalFooter>
			</Modal>

			{/* Modal de éxito */}
			<Modal isOpen={showSuccessModal} setIsOpen={() => {}} size='2xl'>
				<ModalHeader>
					<div className='flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
							<svg
								className='h-6 w-6 text-green-600'
								fill='currentColor'
								viewBox='0 0 24 24'>
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
					{transferResult && (
						<div className='space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle className='flex items-center gap-3'>
										<span className='text-green-600'>
											<svg
												className='h-6 w-6'
												fill='currentColor'
												viewBox='0 0 24 24'>
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
												{transferResult.id}
											</p>
										</div>
										<div>
											<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Total Productos
											</label>
											<p className='font-medium text-gray-900 dark:text-gray-100'>
												{transferResult.total_items} unidades
											</p>
										</div>
										<div className='col-span-2'>
											<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Fecha y Hora
											</label>
											<p className='font-medium text-gray-900 dark:text-gray-100'>
												{new Date(transferResult.created_at).toLocaleString(
													'es-ES',
													{
														year: 'numeric',
														month: 'long',
														day: 'numeric',
														hour: '2-digit',
														minute: '2-digit',
													},
												)}
											</p>
										</div>
									</div>
								</CardBody>
							</Card>

							<Card>
								<CardBody>
									<div className='flex items-start gap-3'>
										<span className='text-sky-600'>
											<svg
												className='h-6 w-6'
												fill='currentColor'
												viewBox='0 0 24 24'>
												<path
													fillRule='evenodd'
													d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
													clipRule='evenodd'
												/>
											</svg>
										</span>
										<div>
											<h4 className='font-medium text-sky-600'>
												¿Qué sigue?
											</h4>
											<ul className='mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400'>
												<li>
													• Los movimientos de inventario han sido
													registrados
												</li>
												<li>
													• Puede revisar el historial de transferencias
													para seguimiento
												</li>
												<li>
													• Los reportes de inventario reflejarán estos
													cambios
												</li>
											</ul>
										</div>
									</div>
								</CardBody>
							</Card>
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button
						variant='outline'
						color='gray'
						icon='HeroPlus'
						onClick={handleCreateAnother}>
						Crear Otra Transferencia
					</Button>
					<Button color='sky' icon='HeroEye' onClick={handleViewHistory}>
						Ver en Historial
					</Button>
				</ModalFooter>
			</Modal>

			{/* Modal de confirmación para remover producto */}
			<Modal isOpen={showRemoveConfirmModal} setIsOpen={setShowRemoveConfirmModal} size='md'>
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
							¿Está seguro que desea remover este producto de la transferencia?
						</p>
						<Card>
							<CardBody>
								<div className='flex items-start gap-3'>
									<span className='text-amber-600'>
										<svg
											className='h-5 w-5'
											fill='currentColor'
											viewBox='0 0 24 24'>
											<path
												fillRule='evenodd'
												d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
												clipRule='evenodd'
											/>
										</svg>
									</span>
									<div>
										<p className='text-sm text-gray-500 dark:text-gray-400'>
											Esta acción no se puede deshacer. El producto será
											removido de la lista actual.
										</p>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button
						variant='outline'
						color='gray'
						onClick={() => setShowRemoveConfirmModal(false)}>
						Cancelar
					</Button>
					<Button color='red' icon='HeroTrash' onClick={confirmRemoveProduct}>
						Sí, Remover
					</Button>
				</ModalFooter>
			</Modal>

			{/* Modal de confirmación para limpiar lista */}
			<Modal isOpen={showClearListModal} setIsOpen={setShowClearListModal} size='md'>
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
							¿Está seguro que desea limpiar toda la lista de productos? Esta acción
							eliminará todos los productos agregados.
						</p>
						<Card>
							<CardBody>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										<span>
											<svg
												className='h-5 w-5'
												fill='none'
												stroke='currentColor'
												viewBox='0 0 24 24'>
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
												{items.length} productos, {getTotalItems()} unidades
											</p>
										</div>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button
						variant='outline'
						color='gray'
						onClick={() => setShowClearListModal(false)}>
						Cancelar
					</Button>
					<Button color='red' icon='HeroTrash' onClick={confirmClearList}>
						Sí, Limpiar Lista
					</Button>
				</ModalFooter>
			</Modal>
		</Container>
	);
};

export default Transferencias;
