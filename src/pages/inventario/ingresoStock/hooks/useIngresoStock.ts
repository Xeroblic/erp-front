import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import { useStockCatalog } from './useStockCatalog';
import type { IProduct } from '@/interface/product.interface';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useUserBranches } from '@/hooks/permiso/userBranch';
import ApiService from '@/services/ApiService';
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
		// @Full_React: Forzamos undefined (Zentria Standard para catálogos globales)
		// Evita que el backend sobreescriba `product.stock` con el asignado a la sucursal
		branchId: undefined,
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
	const {
		isSubmitting: isAdjusting,
		submitBatchAdjustment,
		getSignedQuantity,
		lastBatchId,
		clearLastBatchId,
	} = useStockAdjustment();
	const { isCreating: isCreatingProduct, createQuickProduct } = useQuickProductCreate();
	const {
		findPotentialDuplicates,
		getAffectedProductsByBrand,
		reassignProductsToBrand,
		validateNoProductsInBrands,
		purgeDuplicates,
	} = useBrandDeduplication();

	// ─── Progressive Disclosure (Fases) ─────────────────────────────────
	const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null); // Fase 0→1
	const [targetBranchId, setTargetBranchId] = useState<string>(''); // Fase 1→2
	const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false); // Fase 2→3

	const brandOptions = useMemo(
		() =>
			brands.map((brand) => ({
				value: String(brand.id),
				label: brand.name,
			})),
		[brands],
	);

	// Sucursales filtradas por la subsidiaria activa para el Detalle
	const subsidiaryBranchOptions = useMemo(() => {
		if (!currentSubsidiaryId) return [];
		return branches
			.filter((b) => Number(b.subsidiaryId) === Number(currentSubsidiaryId))
			.map((b) => ({
				value: String(b.id),
				label: b.name ?? `Sucursal ${b.id}`,
			}));
	}, [branches, currentSubsidiaryId]);

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

	// Handlers simplificados de Fase
	const getBranchScopedProduct = useCallback(
		async (product: IProduct, destinationBranchId: string): Promise<IProduct> => {
			const parsedBranchId = Number(destinationBranchId);
			if (!parsedBranchId || parsedBranchId <= 0) return product;

			try {
				const response = await ApiService.fetchData({
					url: `/branches/${parsedBranchId}/products/${product.id}`,
					method: 'get',
				});

				const payload =
					(response.data as { data?: Record<string, unknown> } | undefined)?.data ??
					(response.data as Record<string, unknown> | undefined) ??
					{};

				const scopedPrice = Number(payload.price ?? product.price ?? 0);
				const scopedStock = Number(payload.stock ?? product.stock ?? 0);

				return {
					...product,
					branch_id: parsedBranchId,
					price: Number.isFinite(scopedPrice) ? scopedPrice : Number(product.price ?? 0),
					stock: Number.isFinite(scopedStock) ? scopedStock : Number(product.stock ?? 0),
				};
			} catch (error) {
				const status = Number((error as { response?: { status?: number } })?.response?.status ?? 0);
				if (status === 404) {
					toast.error('El producto no esta asignado a esta sucursal');
				}
				return {
					...product,
					branch_id: parsedBranchId,
				};
			}
		},
		[],
	);

	const handleAddProduct = useCallback(async (product: IProduct) => {
		if (isWorkspaceOpen) {
			const destinationBranch = targetBranchId || (selectedBranchId ? String(selectedBranchId) : '');
			const scopedProduct = await getBranchScopedProduct(product, destinationBranch);
			addToWorkspace(scopedProduct);
			toast.info(`"${product.name}" agregado a la zona de trabajo.`);
			return;
		}
		setSelectedProduct(product);
		setTargetBranchId('');
	}, [isWorkspaceOpen, targetBranchId, selectedBranchId, getBranchScopedProduct, addToWorkspace]);

	const handleStartAdjustment = useCallback(async () => {
		if (!selectedProduct || !targetBranchId) return;
		const scopedProduct = await getBranchScopedProduct(selectedProduct, targetBranchId);
		addToWorkspace(scopedProduct);
		setIsWorkspaceOpen(true);
	}, [selectedProduct, targetBranchId, getBranchScopedProduct, addToWorkspace]);

	const handleCloseDetail = useCallback(() => {
		setSelectedProduct(null);
		setTargetBranchId('');
	}, []);

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
			// Priorizar siempre la sucursal elegida en el modal.
			const destinationBranch = values.branchId || targetBranchId;

			await submitBatchAdjustment(
				workItems,
				destinationBranch,
				values.reason,
				values.notes,
				currentSubsidiaryId ?? 0,
				values.movementType,
				() => {
					clearWorkspace();
					resetForm();
					setSelectedProduct(null);
					setTargetBranchId('');
					setIsWorkspaceOpen(false);
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

	// Sincronizar la sucursal elegida en el detalle con el modal final
	useEffect(() => {
		if (!targetBranchId) return;
		adjustmentForm.setFieldValue('branchId', targetBranchId);
	}, [targetBranchId]);

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
				addToWorkspace(safeProduct);
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
		setSelectedProduct(null);
		setTargetBranchId('');
		setIsWorkspaceOpen(false);
		adjustmentForm.resetForm();
	}, [clearWorkspace, adjustmentForm]);

	return {
		state: {
			isLoadingProducts,
			productsError,
			productRows,
			workItems,
			isWorkspaceVisible,
			setIsWorkspaceVisible,
			selectedSubsidiaryId,
			currentSubsidiaryId,
			selectedProduct,
			targetBranchId,
			isWorkspaceOpen,
			lastBatchId,
			subsidiaryBranchOptions,
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
			handleStartAdjustment,
			handleCloseDetail,
			setTargetBranchId,
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
			clearLastBatchId,
			getSignedQuantity,
		}
	};
};
