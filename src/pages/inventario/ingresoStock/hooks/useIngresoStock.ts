import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { useStockCatalog } from './useStockCatalog';
import type { IProduct } from '@/interface/product.interface';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useUserBranches } from '@/hooks/userBrandBranch';
import { useWorkspaceItems } from './useWorkspaceItems';
import { useStockAdjustment } from './useStockAdjustment';
import { useQuickProductCreate } from './useQuickProductCreate';
import { AdjustmentSchema, QuickProductSchema } from '../types';
import type { IAdjustmentForm, IQuickProductForm } from '../types';

export const useIngresoStock = () => {
	// Modals state
	const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
	const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

	// Sucursal seleccionada en el header superior global de la app
	const { branchId: currentBranchId } = useCurrentBranch();
	const { branches } = useUserBranches();

	const currentSubsidiaryId = useMemo(() => {
		if (!currentBranchId) return null;
		const branch = branches.find(b => Number(b.id) === Number(currentBranchId));
		return branch?.subsidiaryId ?? null;
	}, [currentBranchId, branches]);

	// Contexto local (Catálogo de Stock)
	const [filters] = useState({});
	const { products, loading: isLoadingProducts, error: productsError, refresh } = useStockCatalog({
		subsidiaryId: currentSubsidiaryId ?? undefined,
		filters,
		page: 1,
		perPage: 50,
	});

	const productRows = useMemo<IProduct[]>(() => {
		return products.filter((p: IProduct) => !p.serial_tracking);
	}, [products]);

	// Workspace state
	const {
		workItems,
		isWorkspaceVisible,
		setIsWorkspaceVisible,
		selectedSubsidiaryId,
		addToWorkspace,
		removeFromWorkspace,
		updateItemQuantity,
		clearWorkspace,
	} = useWorkspaceItems();

	// API Hooks
	const { isSubmitting: isAdjusting, submitBatchAdjustment, getSignedQuantity } = useStockAdjustment();
	const { isCreating: isCreatingProduct, createQuickProduct } = useQuickProductCreate();

	// Handlers simples
	const handleAddProduct = useCallback((product: IProduct) => {
		// Lo pasamos indicando que actualice el branch del form final si no estaba setteado
		addToWorkspace(product, adjustmentForm.values.branchId, (branchId) => {
			adjustmentForm.setFieldValue('branchId', branchId);
		});
	}, [addToWorkspace]);

	// Formulario de Ajuste (Modal Final)
	const adjustmentForm = useFormik<IAdjustmentForm>({
		initialValues: {
			movementType: 'ingreso',
			branchId: currentBranchId ? String(currentBranchId) : '',
			reason: '',
			notes: '',
		},
		validationSchema: AdjustmentSchema,
		onSubmit: async (values, { resetForm }) => {
			const success = await submitBatchAdjustment(
				workItems,
				values.branchId,
				values.reason,
				values.notes,
				selectedSubsidiaryId,
				values.movementType,
				() => {
					clearWorkspace();
					resetForm();
					refresh();
					setIsAdjustmentModalOpen(false);
				}
			);
		},
	});

	// Sincronizar la sucursal del formulario si cambia globalmente en el header superior
	useEffect(() => {
		if (currentBranchId) {
			adjustmentForm.setFieldValue('branchId', String(currentBranchId));
		}
	}, [currentBranchId]);

	// Formulario de Producto Exprés
	const quickProductForm = useFormik<IQuickProductForm>({
		initialValues: {
			name: '',
			sku: '',
			price: '',
		},
		validationSchema: QuickProductSchema,
		onSubmit: async (values, { resetForm }) => {
			const branchId = Number(adjustmentForm.values.branchId);
			if (!branchId) {
				toast.error('Debes seleccionar una sucursal en el panel principal antes de crear un producto rápido.');
				return;
			}

			const subId = Number(currentSubsidiaryId || selectedSubsidiaryId || 1);
			const newProduct = await createQuickProduct(values, subId);
			if (newProduct) {
				addToWorkspace(newProduct, undefined, undefined, values.price);
				refresh();
				resetForm();
				setIsQuickProductModalOpen(false);
			}
		},
	});

	// Handler para abrir el modal final validando si hay items
	const handleOpenAdjustmentModal = useCallback(() => {
		if (workItems.length === 0) {
			toast.error('Agrega al menos un producto a la zona de trabajo.');
			return;
		}
		setIsAdjustmentModalOpen(true);
	}, [workItems]);

	const handleClearWorkspace = useCallback(() => {
		clearWorkspace();
		adjustmentForm.resetForm();
	}, [clearWorkspace, adjustmentForm]);

	return {
		state: {
			isLoadingProducts,
			productsError,
			productRows,
			workItems,
			isWorkspaceVisible,
			selectedSubsidiaryId,
			modals: {
				isQuickProductModalOpen,
				isAdjustmentModalOpen,
			},
			loaders: {
				isAdjusting,
				isCreatingProduct,
			}
		},
		forms: {
			adjustment: adjustmentForm,
			quickProduct: quickProductForm,
		},
		actions: {
			setIsWorkspaceVisible,
			handleAddProduct,
			removeFromWorkspace,
			updateItemQuantity,
			handleClearWorkspace,
			openQuickProductModal: () => setIsQuickProductModalOpen(true),
			closeQuickProductModal: () => {
				setIsQuickProductModalOpen(false);
				quickProductForm.resetForm();
			},
			openAdjustmentModal: handleOpenAdjustmentModal,
			closeAdjustmentModal: () => setIsAdjustmentModalOpen(false),
			getSignedQuantity,
		}
	};
};
