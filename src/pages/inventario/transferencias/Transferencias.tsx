import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import { useAppDispatch, useAppSelector } from '@/store';
import { transferInventory } from '@/store/slices/inventory/inventorySlice';
import TransferHeaderCard from './components/TransferHeaderCard';
import ProgressCard from './components/ProgressCard';
import TransferFormCard from './components/TransferFormCard';
import ProductSelectorCard from './components/ProductSelectorCard';
import ItemsTableCard from './components/ItemsTableCard';
import {
	ClearListModal,
	ConfirmTransferModal,
	RemoveProductModal,
	SuccessTransferModal,
} from './components/TransferModals';
import { useTransferLookups } from './hooks/useTransferLookups';
import type { TransferFormState, TransferItem, TransferResult } from './types';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';

const INITIAL_FORM: TransferFormState = {
	from_warehouse_id: '',
	to_warehouse_id: '',
	responsible_id: '',
	notes: '',
};

const Transferencias: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const user = useAppSelector((state) => state.auth.user);
	const branchId = user?.branch?.id ?? null;
	const subsidiaryId = user?.subsidiary?.id ?? user?.personalizacion?.subsidiary_id ?? null;

	const { warehouses, products, responsibles } = useTransferLookups(branchId, subsidiaryId);

	const [transferForm, setTransferForm] = useState<TransferFormState>({ ...INITIAL_FORM });
	const [items, setItems] = useState<TransferItem[]>([]);
	const [selectedProduct, setSelectedProduct] = useState('');
	const [quantity, setQuantity] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);

	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
	const [showClearListModal, setShowClearListModal] = useState(false);
	const [productToRemove, setProductToRemove] = useState<TransferItem | null>(null);
	const [transferResult, setTransferResult] = useState<TransferResult | null>(null);

	const totalUnits = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

	const handleFormChange = (payload: Partial<TransferFormState>) => {
		setTransferForm((prev) => ({ ...prev, ...payload }));
	};

	const handleAddProduct = () => {
		if (!selectedProduct || !quantity || parseFloat(quantity) <= 0) {
			toast.error('Seleccione un producto y especifique cantidad válida');
			return;
		}

		const product = products.find((item) => item.id === Number(selectedProduct));
		if (!product) {
			toast.error('Producto no disponible');
			return;
		}

		const qty = parseFloat(quantity);
		const availableStock = Number(product.stock ?? 0);
		if (qty > availableStock) {
			toast.error(`Stock insuficiente. Disponible: ${availableStock}`);
			return;
		}

		setItems((prev) => {
			const existing = prev.find((item) => item.product_id === product.id);
			if (existing) {
				return prev.map((item) =>
					item.product_id === product.id
						? { ...item, quantity: item.quantity + qty }
						: item,
				);
			}
			return [
				...prev,
				{
					product_id: product.id,
					product_name: product.name,
					product_sku: product.sku,
					quantity: qty,
					available_stock: availableStock,
				},
			];
		});

		setSelectedProduct('');
		setQuantity('');
		toast.success('Producto agregado a la transferencia');
	};

	const handleRemoveProduct = (productId: number) => {
		const item = items.find((entry) => entry.product_id === productId) ?? null;
		setProductToRemove(item);
		setShowRemoveConfirmModal(true);
	};

	const confirmRemoveProduct = () => {
		if (productToRemove) {
			setItems((prev) =>
				prev.filter((item) => item.product_id !== productToRemove.product_id),
			);
			toast.info('Producto removido de la transferencia');
		}
		setProductToRemove(null);
		setShowRemoveConfirmModal(false);
	};

	const handleClearList = () => {
		setShowClearListModal(true);
	};

	const confirmClearList = () => {
		setItems([]);
		setShowClearListModal(false);
		toast.info('Lista de productos limpiada');
	};

	const validateTransfer = () => {
		if (
			!transferForm.from_warehouse_id ||
			!transferForm.to_warehouse_id ||
			!transferForm.responsible_id
		) {
			toast.error('Complete todos los campos obligatorios');
			return false;
		}
		if (items.length === 0) {
			toast.error('Agregue al menos un producto');
			return false;
		}
		if (transferForm.from_warehouse_id === transferForm.to_warehouse_id) {
			toast.error('La bodega de origen debe ser diferente a la de destino');
			return false;
		}
		return true;
	};

	const handleConfirmTransfer = () => {
		if (!validateTransfer()) return;
		setShowConfirmModal(true);
	};

	const handleProceedWithTransfer = async () => {
		setShowConfirmModal(false);
		setIsProcessing(true);
		const responsibleLabel =
			getResponsibleName(transferForm.responsible_id) || 'Sin responsable';
		try {
			for (const item of items) {
				await dispatch(
					transferInventory({
						product_id: item.product_id,
						from_warehouse_id: Number(transferForm.from_warehouse_id),
						to_warehouse_id: Number(transferForm.to_warehouse_id),
						quantity: item.quantity,
						notes: `Transferencia - Responsable: ${responsibleLabel}. ${transferForm.notes || ''}`,
					}),
				).unwrap();
			}

			const result: TransferResult = {
				id: `TRF-${Date.now()}`,
				total_items: totalUnits,
				created_at: new Date().toISOString(),
			};

			setTransferResult(result);
			setTransferForm({ ...INITIAL_FORM });
			setItems([]);
			setShowSuccessModal(true);
		} catch (error) {
			console.error(error);
			toast.error('Error al procesar la transferencia');
		} finally {
			setIsProcessing(false);
		}
	};

	const getWarehouseLabel = (id: string) => {
		if (!id) return '';
		const warehouse = warehouses.find((w) => w.id.toString() === id);
		return warehouse ? `${warehouse.name} (${warehouse.code})` : '';
	};

	const getResponsibleName = (id: string) => {
		if (!id) return '';
		const user = responsibles.find((responsible) => responsible.id.toString() === id);
		if (!user) return '';
		return `${user.first_name} ${user.last_name ?? ''}`.trim();
	};

	const inventoryUrl = subsidiaryId ? `/subsidiaries/${subsidiaryId}/reports/inventory` : null;

	const summary = useMemo(
		() => ({
			fromWarehouse: getWarehouseLabel(transferForm.from_warehouse_id),
			toWarehouse: getWarehouseLabel(transferForm.to_warehouse_id),
			responsible: getResponsibleName(transferForm.responsible_id),
			productCount: items.length,
			totalUnits,
			notes: transferForm.notes?.trim() || undefined,
		}),
		[transferForm, items.length, totalUnits, warehouses, responsibles],
	);

	const handleViewHistory = () => {
		navigate('/inventario/historial?tipo=TRANSFER');
	};

	const handleCreateAnother = () => {
		setShowSuccessModal(false);
		setTransferResult(null);
	};

	return (
		<PageWrapper isProtectedRoute title='Transferencias de Inventario' name='transferencias_inventario'>
			<TransferHeaderCard
				onNavigateHistory={handleViewHistory}
				onNavigateInventory={inventoryUrl ? () => navigate(inventoryUrl) : undefined}
				inventoryDisabled={!inventoryUrl}
			/>
			<Container>
				{items.length > 0 && (
					<ProgressCard itemCount={items.length} totalUnits={totalUnits} />
				)}

				<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
					<TransferFormCard
						form={transferForm}
						onChange={handleFormChange}
						warehouses={warehouses}
						responsibles={responsibles}
					/>
					<ProductSelectorCard
						products={products}
						selectedProductId={selectedProduct}
						quantity={quantity}
						onProductChange={setSelectedProduct}
						onQuantityChange={setQuantity}
						onAddProduct={handleAddProduct}
					/>
				</div>

				{items.length > 0 && (
					<ItemsTableCard
						items={items}
						totalUnits={totalUnits}
						onRemove={handleRemoveProduct}
						actionSlot={
							<>
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
							</>
						}
					/>
				)}

				<ConfirmTransferModal
					isOpen={showConfirmModal}
					onClose={() => setShowConfirmModal(false)}
					onConfirm={handleProceedWithTransfer}
					summary={summary}
				/>

				<SuccessTransferModal
					isOpen={showSuccessModal}
					setIsOpen={setShowSuccessModal}
					result={transferResult}
					onCreateAnother={handleCreateAnother}
					onViewHistory={handleViewHistory}
				/>

				<RemoveProductModal
					isOpen={showRemoveConfirmModal}
					productName={productToRemove?.product_name}
					onCancel={() => {
						setProductToRemove(null);
						setShowRemoveConfirmModal(false);
					}}
					onConfirm={confirmRemoveProduct}
				/>

				<ClearListModal
					isOpen={showClearListModal}
					onCancel={() => setShowClearListModal(false)}
					onConfirm={confirmClearList}
					itemCount={items.length}
					totalUnits={totalUnits}
				/>
			</Container>
		</PageWrapper>
	);
};

export default Transferencias;
