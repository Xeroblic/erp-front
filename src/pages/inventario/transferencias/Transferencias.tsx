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
		setItems(items.filter((item) => item.product_id !== productId));
		toast.info('Producto removido de la transferencia');
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

			// Mostrar modal de éxito
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
		<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
			{/* Header mejorado */}
			<div className='flex items-center justify-between py-6'>
				<div>
					<h1 className='text-3xl font-semibold text-gray-900'>Nueva Transferencia</h1>
					<p className='mt-1 text-zinc-600'>
						Transferir productos entre bodegas de forma rápida y segura
					</p>
				</div>
				<div className='flex gap-3'>
					<Button
						variant='outline'
						icon='HeroClockIcon'
						onClick={() => navigate('/inventario/historial?tipo=TRANSFER')}>
						Ver Historial
					</Button>
					<Button
						variant='outline'
						icon='HeroDocumentTextIcon'
						onClick={() => navigate('/inventario')}>
						Ver Inventario
					</Button>
				</div>
			</div>

			{/* Progress indicator */}
			{items.length > 0 && (
				<div className='mb-6 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white'>
								<span className='text-sm font-semibold'>{items.length}</span>
							</div>
							<div>
								<p className='font-medium text-blue-900'>
									{items.length} producto{items.length !== 1 ? 's' : ''} agregado
									{items.length !== 1 ? 's' : ''}
								</p>
								<p className='text-sm text-blue-700'>
									Total: {getTotalItems()} unidades
								</p>
							</div>
						</div>
						<Badge color='blue' variant='solid'>
							Listo para transferir
						</Badge>
					</div>
				</div>
			)}

			<div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
				{/* Formulario de transferencia */}
				<Card className='border-0 bg-gradient-to-b from-gray-50 to-white shadow-lg'>
					<CardHeader className='bg-gradient-to-r from-gray-900 to-gray-800 text-white'>
						<CardTitle className='flex items-center gap-2 text-xl'>
							<span>📦</span>
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
				<Card className='border-0 bg-gradient-to-b from-emerald-50 to-white shadow-lg'>
					<CardHeader className='bg-gradient-to-r from-emerald-600 to-emerald-700 text-white'>
						<CardTitle className='flex items-center gap-2 text-xl'>
							<span>🏷️</span>
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
								variant='solid'
								isDisable={!selectedProduct || !quantity}>
								Agregar Producto
							</Button>
						</div>
					</CardBody>
				</Card>
			</div>

			{/* Tabla de productos mejorada */}
			{items.length > 0 && (
				<Card className='mt-8 border-0 bg-gradient-to-b from-gray-50 to-white shadow-xl'>
					<CardHeader className='bg-gradient-to-r from-indigo-600 to-purple-600 text-white'>
						<CardTitle className='flex items-center justify-between text-xl'>
							<div className='flex items-center gap-2'>
								<span>📋</span>
								Productos a Transferir
							</div>
							<div className='flex items-center gap-4'>
								<Badge
									color='gray'
									variant='outline'
									className='border-indigo-200 text-indigo-100'>
									{items.length} producto{items.length !== 1 ? 's' : ''}
								</Badge>
								<Badge
									color='gray'
									variant='outline'
									className='border-indigo-200 text-indigo-100'>
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
												<Badge color='blue' variant='outline'>
													{item.product_name}
												</Badge>
											</Td>
											<Td>
												<code className='rounded bg-gray-100 px-2 py-1 text-sm'>
													{item.product_sku}
												</code>
											</Td>
											<Td>
												<span className='text-lg font-semibold text-sky-600'>
													{item.quantity}
												</span>
											</Td>
											<Td>
												<span className='text-gray-600'>
													{item.available_stock}
												</span>
											</Td>
											<Td>
												<Button
													size='sm'
													color='red'
													variant='outline'
													icon='HeroTrash'
													onClick={() =>
														handleRemoveProduct(item.product_id)
													}>
													Quitar
												</Button>
											</Td>
										</Tr>
									))}
								</TBody>
							</Table>
						</div>

						{/* Acciones finales */}
						<div className='mt-6 flex items-center justify-between'>
							<Button
								variant='outline'
								color='gray'
								onClick={() => setItems([])}
								isDisable={items.length === 0}>
								Cancelar
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
					<h3 className='text-lg font-semibold text-gray-900'>Confirmar Transferencia</h3>
				</ModalHeader>
				<ModalBody>
					<div className='space-y-4'>
						<div className='rounded-lg border border-sky-200 bg-sky-50 p-4'>
							<h4 className='mb-3 font-medium text-sky-900'>
								Resumen de Transferencia
							</h4>
							<div className='grid grid-cols-2 gap-4 text-sm'>
								<div>
									<span className='text-gray-600'>Desde:</span>
									<p className='font-medium'>
										{getWarehouseName(transferForm.from_warehouse_id)}
									</p>
								</div>
								<div>
									<span className='text-gray-600'>Hacia:</span>
									<p className='font-medium'>
										{getWarehouseName(transferForm.to_warehouse_id)}
									</p>
								</div>
								<div>
									<span className='text-gray-600'>Responsable:</span>
									<p className='font-medium'>
										{getResponsibleName(transferForm.responsible_id)}
									</p>
								</div>
								<div>
									<span className='text-gray-600'>Total productos:</span>
									<p className='font-medium'>
										{items.length} productos ({getTotalItems()} unidades)
									</p>
								</div>
							</div>
							{transferForm.notes && (
								<div className='mt-3'>
									<span className='text-gray-600'>Notas:</span>
									<p className='font-medium'>{transferForm.notes}</p>
								</div>
							)}
						</div>

						<div className='rounded-lg border border-amber-200 bg-amber-50 p-4'>
							<div className='flex items-start gap-3'>
								<span className='text-2xl'>⚠️</span>
								<div>
									<h4 className='font-medium text-amber-900'>Importante</h4>
									<p className='mt-1 text-sm text-amber-800'>
										Esta acción creará movimientos de inventario y no podrá ser
										revertida automáticamente. Asegúrese de que toda la
										información esté correcta antes de continuar.
									</p>
								</div>
							</div>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button variant='outline' onClick={() => setShowConfirmModal(false)}>
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
							<span className='text-2xl'>✅</span>
						</div>
						<h3 className='text-lg font-semibold text-gray-900'>
							¡Transferencia Exitosa!
						</h3>
					</div>
				</ModalHeader>
				<ModalBody>
					{transferResult && (
						<div className='space-y-4'>
							<div className='rounded-lg border border-emerald-200 bg-emerald-50 p-4'>
								<h4 className='mb-3 font-medium text-emerald-900'>
									Transferencia Completada
								</h4>
								<div className='grid grid-cols-2 gap-4 text-sm'>
									<div>
										<span className='text-gray-600'>ID Transferencia:</span>
										<p className='font-mono font-medium'>{transferResult.id}</p>
									</div>
									<div>
										<span className='text-gray-600'>Total Productos:</span>
										<p className='font-medium'>
											{transferResult.total_items} unidades
										</p>
									</div>
									<div className='col-span-2'>
										<span className='text-gray-600'>Fecha y Hora:</span>
										<p className='font-medium'>
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
							</div>

							<div className='rounded-lg border border-sky-200 bg-sky-50 p-4'>
								<div className='flex items-start gap-3'>
									<span className='text-2xl'>💡</span>
									<div>
										<h4 className='font-medium text-sky-900'>¿Qué sigue?</h4>
										<ul className='mt-2 space-y-1 text-sm text-sky-800'>
											<li>
												• Los movimientos de inventario han sido registrados
											</li>
											<li>
												• Puede revisar el historial de transferencias para
												seguimiento
											</li>
											<li>
												• Los reportes de inventario reflejarán estos
												cambios
											</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button variant='outline' onClick={handleCreateAnother}>
						Crear Otra Transferencia
					</Button>
					<Button color='blue' icon='HeroEye' onClick={handleViewHistory}>
						Ver en Historial
					</Button>
				</ModalFooter>
			</Modal>
		</Container>
	);
};

export default Transferencias;
