import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import { useStockCatalog } from './useStockCatalog';
import type { IProduct } from '@/interface/product.interface';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useUserBranches } from '@/hooks/userBrandBranch';
import { createBrand, fetchBrands } from '@/store/slices/brands/brandsSlice';
import { useWorkspaceItems } from './useWorkspaceItems';
import { useStockAdjustment } from './useStockAdjustment';
import { useQuickProductCreate } from './useQuickProductCreate';
import { useBrandDeduplication } from './useBrandDeduplication';
import { AdjustmentSchema, QuickProductSchema } from '../types';
import type { IAdjustmentForm, IQuickProductForm } from '../types';

export const useIngresoStock = () => {
	// Modals state
	const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
	const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
	const [isBrandDedupModalOpen, setIsBrandDedupModalOpen] = useState(false);
	const [brandDedupCandidates, setBrandDedupCandidates] = useState<Array<{ id: number; name: string }>>([]);
	const [brandDedupProductsByBrand, setBrandDedupProductsByBrand] = useState<Record<number, Array<{ id: number; name: string; sku: string; brandId: number; brandName: string }>>>({});
	const [brandDedupBranchId, setBrandDedupBranchId] = useState<number | null>(null);
	const [brandDedupDefaultKeepId, setBrandDedupDefaultKeepId] = useState<number | null>(null);
	const [isLoadingBrandDedupProducts, setIsLoadingBrandDedupProducts] = useState(false);
	const [isResolvingBrandDedup, setIsResolvingBrandDedup] = useState(false);
	const dispatch = useAppDispatch();
	const user = useAppSelector((s) => s.auth.user as any);
	const brands = useAppSelector((s) => s.brands.items ?? []);
	const userId = user?.id ?? user?.pk ?? undefined;

	// Sucursal seleccionada en el header superior global de la app
	const { branchId: currentBranchId } = useCurrentBranch();
	const { branches } = useUserBranches(userId, { enabled: Boolean(userId) });
	const [selectedBranchId, setSelectedBranchId] = useState<number | null>(currentBranchId);
	const [externalBranchContext, setExternalBranchContext] = useState<{
		branchId: number;
		subsidiaryId: number;
	} | null>(null);

	useEffect(() => {
		setSelectedBranchId(currentBranchId);
	}, [currentBranchId]);

	useEffect(() => {
		if (selectedBranchId) return;
		if (!branches.length) return;
		setSelectedBranchId(Number(branches[0].id));
	}, [selectedBranchId, branches]);

	useEffect(() => {
		const handleExternalBranchChange = (event: Event) => {
			const detail = (event as CustomEvent<{ branchId?: number; subsidiaryId?: number }>).detail;
			if (detail?.branchId) {
				setSelectedBranchId(Number(detail.branchId));
				if (typeof detail.subsidiaryId === 'number' && detail.subsidiaryId > 0) {
					setExternalBranchContext({
						branchId: Number(detail.branchId),
						subsidiaryId: Number(detail.subsidiaryId),
					});
				}
			}
		};

		window.addEventListener('user-branch-changed', handleExternalBranchChange);
		return () => window.removeEventListener('user-branch-changed', handleExternalBranchChange);
	}, []);

	useEffect(() => {
		if (!selectedBranchId) return;
		void dispatch(fetchBrands({ branchId: selectedBranchId, search: '' }));
	}, [dispatch, selectedBranchId]);

	const currentSubsidiaryId = useMemo(() => {
		if (
			externalBranchContext?.branchId &&
			selectedBranchId &&
			externalBranchContext.branchId === selectedBranchId
		) {
			return externalBranchContext.subsidiaryId;
		}

		if (selectedBranchId) {
			const branch = branches.find((b) => Number(b.id) === Number(selectedBranchId));
			if (branch?.subsidiaryId) return Number(branch.subsidiaryId);
		}

		const accessSubs = Array.isArray(user?.access?.subsidiaries)
			? user.access.subsidiaries
			: [];
		if (accessSubs.length === 1) {
			const only = accessSubs[0];
			if (typeof only === 'number') return only;
			if (only?.id) return Number(only.id);
		}

		return null;
	}, [selectedBranchId, branches, user, externalBranchContext]);

	// Contexto local (Catálogo de Stock)
	// Contexto local (Catálogo de Stock)
	const [filters] = useState({});
	const { products, loading: isLoadingProducts, error: productsError, refresh } = useStockCatalog({
		branchId: selectedBranchId ?? undefined,
		subsidiaryId: currentSubsidiaryId ?? undefined,
		filters,
		page: 1,
		perPage: 50,
	});

	const productRows = useMemo<IProduct[]>(() => {
		return products.filter((p: IProduct) => !p.serial_tracking);
	}, [products]);

	// Workspace state — fuente de verdad: currentSubsidiaryId
	const {
		workItems,
		isWorkspaceVisible,
		setIsWorkspaceVisible,
		selectedSubsidiaryId,
		addToWorkspace,
		removeFromWorkspace,
		updateItemQuantity,
		clearWorkspace,
	} = useWorkspaceItems({ contextSubsidiaryId: currentSubsidiaryId });

	// API Hooks
	const { isSubmitting: isAdjusting, submitBatchAdjustment, getSignedQuantity } = useStockAdjustment();
	const { isCreating: isCreatingProduct, createQuickProduct } = useQuickProductCreate();
	const {
		findPotentialDuplicates,
		getAffectedProductsByBrand,
		reassignProductsToBrand,
		validateNoProductsInBrands,
		purgeDuplicates,
	} = useBrandDeduplication();

	const brandOptions = useMemo(
		() =>
			brands.map((brand) => ({
				value: String(brand.id),
				label: brand.name,
			})),
		[brands],
	);

	const handleBrandChange = useCallback(
		(brandId: string) => {
			quickProductForm.setFieldValue('brandId', brandId);
		},
		[],
	);

	const handleCreateBrand = useCallback(
		async (brandName: string) => {
			const branchId = Number(adjustmentForm.values.branchId);
			if (!branchId) {
				toast.error('Debes seleccionar una sucursal antes de crear una marca.');
				return;
			}

			try {
				const created = await dispatch(
					createBrand({
						branchId,
						data: {
							name: brandName.trim(),
							is_active: true,
						},
					}),
				).unwrap();

				const refreshed = await dispatch(fetchBrands({ branchId, search: '' })).unwrap();
				const refreshedBrands = refreshed.items.map((b) => ({ id: b.id, name: b.name }));
				const duplicates = findPotentialDuplicates(refreshedBrands, created.id);

				if (duplicates.length > 1) {
					setBrandDedupCandidates(duplicates);
					setBrandDedupBranchId(branchId);
					setBrandDedupDefaultKeepId(created.id);
					setIsBrandDedupModalOpen(true);
					setIsLoadingBrandDedupProducts(true);
					quickProductForm.setFieldValue('brandId', String(created.id));
					toast.info('Detectamos marcas similares. Elige cuál conservar.');

					try {
						const productsByBrand = await getAffectedProductsByBrand(branchId, duplicates);
						setBrandDedupProductsByBrand(productsByBrand);
					} catch {
						setBrandDedupProductsByBrand({});
						toast.error('No se pudieron cargar los productos afectados para validar la deduplicación.');
					} finally {
						setIsLoadingBrandDedupProducts(false);
					}

					return;
				}

				quickProductForm.setFieldValue('brandId', String(created.id));
				toast.success(`Marca "${brandName}" creada y seleccionada.`);
			} catch (error) {
				const message = error instanceof Error ? error.message : 'No se pudo crear la marca.';
				toast.error(message);
			}
		},
		[dispatch, findPotentialDuplicates, getAffectedProductsByBrand],
	);

	const handleCloseBrandDedupModal = useCallback(() => {
		setIsBrandDedupModalOpen(false);
		setBrandDedupCandidates([]);
		setBrandDedupProductsByBrand({});
		setBrandDedupBranchId(null);
		setBrandDedupDefaultKeepId(null);
		setIsLoadingBrandDedupProducts(false);
	}, []);

	const handleConfirmBrandDedup = useCallback(
		async (payload: { keepId: number; selectedProductIds: number[] }) => {
			const keepId = Number(payload.keepId);
			if (!brandDedupBranchId || !brandDedupCandidates.length || !keepId) {
				handleCloseBrandDedupModal();
				return;
			}

			const brandsToDelete = brandDedupCandidates.filter((b) => b.id !== keepId);
			const requiredProductIds = Array.from(
				new Set(
					brandsToDelete.flatMap((brand) =>
						(brandDedupProductsByBrand[brand.id] ?? []).map((product) => product.id),
					),
				),
			);
			const selectedSet = new Set((payload.selectedProductIds ?? []).map(Number));
			const unresolved = requiredProductIds.filter((id) => !selectedSet.has(id));

			if (unresolved.length > 0) {
				toast.error('Debes seleccionar todos los productos afectados antes de continuar.');
				return;
			}

			setIsResolvingBrandDedup(true);
			try {
				if (requiredProductIds.length > 0) {
					await reassignProductsToBrand(brandDedupBranchId, requiredProductIds, keepId);
				}

				const validation = await validateNoProductsInBrands(brandDedupBranchId, brandsToDelete);
				if (!validation.valid) {
					const reloadedMap = await getAffectedProductsByBrand(brandDedupBranchId, brandDedupCandidates);
					setBrandDedupProductsByBrand(reloadedMap);
					toast.error('Aún existen productos vinculados a marcas a eliminar. Revisa la lista antes de continuar.');
					return;
				}

				await purgeDuplicates(brandDedupBranchId, brandDedupCandidates, keepId);
				await dispatch(fetchBrands({ branchId: brandDedupBranchId, search: '' }));
				quickProductForm.setFieldValue('brandId', String(keepId));
				toast.success('Marcas duplicadas resueltas correctamente.');
				handleCloseBrandDedupModal();
			} catch (error) {
				const message = error instanceof Error ? error.message : 'No se pudo resolver la deduplicación de marcas.';
				toast.error(message);
			} finally {
				setIsResolvingBrandDedup(false);
			}
		},
		[
			brandDedupBranchId,
			brandDedupCandidates,
			brandDedupProductsByBrand,
			handleCloseBrandDedupModal,
			getAffectedProductsByBrand,
			reassignProductsToBrand,
			validateNoProductsInBrands,
			purgeDuplicates,
			dispatch,
		],
	);

	// Handlers simples
	const handleAddProduct = useCallback((product: IProduct) => {
		addToWorkspace(product);
	}, [addToWorkspace]);

	// Formulario de Ajuste (Modal Final)
	const adjustmentForm = useFormik<IAdjustmentForm>({
		initialValues: {
			movementType: 'ingreso',
			branchId: selectedBranchId ? String(selectedBranchId) : '',
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
				currentSubsidiaryId ?? 0,
				values.movementType,
				() => {
					clearWorkspace();
					resetForm();
					setIsAdjustmentModalOpen(false);
					// Retardo porque el backend procesa el ajuste en un Job asíncrono en background
					setTimeout(() => {
						refresh();
					}, 2500);
				}
			);
		},
	});

	// Sincronizar la sucursal del formulario si cambia globalmente en el header superior
	useEffect(() => {
		if (selectedBranchId) {
			adjustmentForm.setFieldValue('branchId', String(selectedBranchId));
		}
	}, [selectedBranchId]);

	// Formulario de Producto Exprés
	const quickProductForm = useFormik<IQuickProductForm>({
		initialValues: {
			name: '',
			sku: '',
			price: '',
			brandId: '',
		},
		validationSchema: QuickProductSchema,
		onSubmit: async (values, { resetForm }) => {
			const branchId = Number(adjustmentForm.values.branchId);
			if (!branchId) {
				toast.error('Debes seleccionar una sucursal en el panel principal antes de crear un producto rápido.');
				return;
			}

			const subId = Number(currentSubsidiaryId ?? 0);
			const brandId = Number(values.brandId || 0);
			if (!brandId) {
				toast.error('Debes seleccionar una marca para crear el producto exprés.');
				return;
			}

			if (!subId) {
				toast.error('Selecciona una sucursal antes de crear un producto.');
				return;
			}

			const newProduct = await createQuickProduct(
				values,
				subId,
				branchId,
				brandId,
			);
			if (newProduct) {
				const safeProduct = {
					...newProduct,
					branch_id: Number(newProduct.branch_id ?? branchId) || branchId,
					subsidiary_id: subId,
				};
				addToWorkspace(safeProduct, values.price);
				refresh();
				resetForm();
				quickProductForm.setFieldValue('brandId', '');
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
			currentSubsidiaryId,
			modals: {
				isQuickProductModalOpen,
				isAdjustmentModalOpen,
				isBrandDedupModalOpen,
			},
			loaders: {
				isAdjusting,
				isCreatingProduct,
				isLoadingBrandDedupProducts,
				isResolvingBrandDedup,
			}
			,
			brandDedup: {
				candidates: brandDedupCandidates,
				productsByBrand: brandDedupProductsByBrand,
				defaultKeepId: brandDedupDefaultKeepId,
			},
		},
		forms: {
			adjustment: adjustmentForm,
			quickProduct: quickProductForm,
		},
		brands: {
			options: brandOptions,
		},
		actions: {
			setIsWorkspaceVisible,
			handleAddProduct,
			handleBrandChange,
			handleCreateBrand,
			handleCloseBrandDedupModal,
			handleConfirmBrandDedup,
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
