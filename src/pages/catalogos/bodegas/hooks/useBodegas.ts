import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import useAuthorization from '@/hooks/useAuthorization';
import useContextScopedSelection from '@/hooks/useContextScopedSelection';
import { ajustesTrasladosLink } from '@/pages/inventario/abastecimiento/AjustesTraslados/types';
import {
	fetchWarehouses,
	createWarehouse,
	updateWarehouse,
	deleteWarehouse,
	clearWarehouseError,
	type IWarehouseApiError,
} from '@/store/slices/warehouses/warehouseSlice';
import type {
	IWarehouse,
	ICreateWarehouseRequest,
	IUpdateWarehouseRequest,
	IFetchWarehousesParams,
} from '@/interface/warehouse.interface';
import {
	WarehouseSchema,
	CREATE_WAREHOUSE_INITIAL_VALUES,
	type ICreateWarehouseForm,
	type IBodegasResumen,
	type TBodegaEstadoFiltro,
} from '../types';

const LIST_PARAMS: IFetchWarehousesParams = { page: 1, per_page: 100 };

const positiveOrNull = (value: unknown): number | null =>
	typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;

/**
 * Los vacíos del formulario viajan como `null` (o texto vacío, que el slice traduce): en la
 * edición es lo que borra el valor guardado. Una capacidad `0` equivale a «sin límite».
 */
const toWarehousePayload = (values: ICreateWarehouseForm): ICreateWarehouseRequest => ({
	...values,
	maximum_capacity: positiveOrNull(values.maximum_capacity),
	manager_id: positiveOrNull(values.manager_id),
	commune_id: positiveOrNull(values.commune_id),
});

export const useBodegas = () => {
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();
	const { authorize } = useAuthorization();
	const latestBranchIdRef = useRef(branchId);
	latestBranchIdRef.current = branchId;

	const warehouseState = useAppSelector((s) => s.warehouse);
	const warehouses = useMemo(
		() => (warehouseState.listBranchId === branchId ? warehouseState.warehouses : []),
		[warehouseState.listBranchId, warehouseState.warehouses, branchId],
	);
	const { stats, loading, error, deleting } = warehouseState;

	const [globalFilter, setGlobalFilter] = useState('');
	const [typeFilter, setTypeFilter] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<TBodegaEstadoFiltro | null>(null);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	// Bodega cuya baja rechazó el backend porque el inventario todavía cuenta unidades en ella.
	const [stockBlockedWarehouseId, setStockBlockedWarehouseId] = useState<number | null>(null);
	const branchContext = useMemo(
		() => (branchId === null ? null : { type: 'branch' as const, id: branchId }),
		[branchId],
	);
	const createSelection = useContextScopedSelection<'create'>(branchContext);
	const selection = useContextScopedSelection<number>(branchContext, {
		onInvalidate: () => {
			setEditModalOpen(false);
			setDeleteModalOpen(false);
		},
	});
	const selectedWarehouse = useMemo(
		() => warehouses.find((warehouse) => warehouse.id === selection.selectedId) ?? null,
		[selection.selectedId, warehouses],
	);

	const loadWarehouses = useCallback(
		async (params?: IFetchWarehousesParams) => {
			if (!branchId) return;
			// El error queda en `state.error` y la vista lo muestra con «Reintentar».
			await dispatch(fetchWarehouses({ branchId, params, allPages: true }));
		},
		[dispatch, branchId],
	);

	const handleCreateWarehouse = useCallback(
		async (data: ICreateWarehouseRequest) => {
			if (!branchId) return false;
			const requestBranchId = branchId;
			try {
				await dispatch(createWarehouse({ branchId: requestBranchId, data })).unwrap();
				if (latestBranchIdRef.current !== requestBranchId) return false;
				toast.success('Bodega creada exitosamente');
				return true;
			} catch (e: unknown) {
				if (latestBranchIdRef.current !== requestBranchId) return false;
				toast.error((e as IWarehouseApiError).message || 'Error al crear la bodega');
				return false;
			}
		},
		[dispatch, branchId],
	);

	const handleUpdateWarehouse = useCallback(
		async (warehouseId: number, data: IUpdateWarehouseRequest) => {
			if (!branchId) return false;
			const requestBranchId = branchId;
			try {
				await dispatch(
					updateWarehouse({ branchId: requestBranchId, warehouseId, data }),
				).unwrap();
				if (latestBranchIdRef.current !== requestBranchId) return false;
				toast.success('Bodega actualizada');
				return true;
			} catch (e: unknown) {
				if (latestBranchIdRef.current !== requestBranchId) return false;
				toast.error((e as IWarehouseApiError).message || 'Error al actualizar la bodega');
				return false;
			}
		},
		[dispatch, branchId],
	);

	const handleDeleteWarehouse = useCallback(
		async (warehouseId: number) => {
			if (!branchId) return false;
			const requestBranchId = branchId;
			try {
				await dispatch(
					deleteWarehouse({ branchId: requestBranchId, warehouseId }),
				).unwrap();
				if (latestBranchIdRef.current !== requestBranchId) return false;
				toast.success('Bodega eliminada');
				return true;
			} catch (e: unknown) {
				if (latestBranchIdRef.current !== requestBranchId) return false;
				const apiError = e as IWarehouseApiError;
				if (apiError.code === 'WAREHOUSE_HAS_STOCK') {
					// El modal sigue abierto y explica cómo vaciarla; un toast lo repetiría.
					setStockBlockedWarehouseId(warehouseId);
				} else if (apiError.code === 'WAREHOUSE_HAS_PRODUCTS') {
					toast.error('No se puede eliminar, tiene productos asociados');
				} else {
					toast.error(apiError.message || 'Error al eliminar la bodega');
				}
				return false;
			}
		},
		[dispatch, branchId],
	);

	const createForm = useFormik<ICreateWarehouseForm>({
		initialValues: CREATE_WAREHOUSE_INITIAL_VALUES,
		validationSchema: WarehouseSchema,
		onSubmit: async (values, { setSubmitting, resetForm }) => {
			const success = await handleCreateWarehouse(toWarehousePayload(values));
			setSubmitting(false);
			if (success) {
				resetForm();
				createSelection.clear();
				void loadWarehouses(LIST_PARAMS);
			}
		},
	});

	const editForm = useFormik<ICreateWarehouseForm>({
		initialValues: CREATE_WAREHOUSE_INITIAL_VALUES,
		validationSchema: WarehouseSchema,
		enableReinitialize: true,
		onSubmit: async (values, { setSubmitting }) => {
			if (!selectedWarehouse) return;
			const success = await handleUpdateWarehouse(
				selectedWarehouse.id,
				toWarehousePayload(values),
			);
			setSubmitting(false);
			if (success) {
				setEditModalOpen(false);
				selection.clear();
				void loadWarehouses(LIST_PARAMS);
			}
		},
	});

	useEffect(() => {
		if (branchId) {
			void loadWarehouses(LIST_PARAMS);
		}
	}, [branchId, loadWarehouses]);

	useEffect(() => {
		return () => {
			dispatch(clearWarehouseError());
		};
	}, [dispatch]);

	const filteredWarehouses = useMemo(() => {
		const searchLower = globalFilter.trim().toLowerCase();
		return warehouses.filter((w) => {
			if (
				searchLower &&
				!w.name.toLowerCase().includes(searchLower) &&
				!w.code.toLowerCase().includes(searchLower)
			)
				return false;
			if (typeFilter !== null && w.warehouse_type !== typeFilter) return false;
			if (statusFilter === 'active' && !w.is_active) return false;
			if (statusFilter === 'inactive' && w.is_active) return false;
			return true;
		});
	}, [warehouses, globalFilter, typeFilter, statusFilter]);

	const typeOptions = useMemo(
		() =>
			Array.from(new Set(warehouses.map((w) => w.warehouse_type).filter(Boolean))).sort(
				(a, b) => a.localeCompare(b, 'es'),
			),
		[warehouses],
	);

	// El listado no trae `products`: las unidades salen de `current_capacity`.
	const summary = useMemo<IBodegasResumen>(
		() => ({
			total: warehouses.length,
			actives: warehouses.filter((w) => w.is_active).length,
			units: warehouses.reduce((sum, w) => sum + (w.current_capacity ?? 0), 0),
			nearCapacity: stats.near_capacity,
		}),
		[warehouses, stats.near_capacity],
	);

	const deleteBlockedByStock =
		selectedWarehouse !== null && selectedWarehouse.id === stockBlockedWarehouseId;
	// Sólo enlaza a la pestaña de ajuste: la de traslados no existe en la etapa 1. Pide el
	// `authority` completo de la ruta (regla de `AuthorityCheck`) más `edit-product` con
	// acceso a la sucursal, el mismo permiso que la página exige para ajustar.
	const adjustLink =
		deleteBlockedByStock && selectedWarehouse
			? ajustesTrasladosLink({ tab: 'ajuste', warehouseId: selectedWarehouse.id })
			: null;
	const adjustStockLink =
		adjustLink &&
		authorize({
			permission: ['edit-product', ...adjustLink.authority],
			requireAll: true,
			branchId,
			scope: 'access',
		})
			? adjustLink.to
			: null;

	const hasFilters = globalFilter.trim() !== '' || typeFilter !== null || statusFilter !== null;
	const clearFilters = useCallback(() => {
		setGlobalFilter('');
		setTypeFilter(null);
		setStatusFilter(null);
	}, []);
	const refresh = useCallback(() => {
		void loadWarehouses(LIST_PARAMS);
	}, [loadWarehouses]);

	const { setValues: setEditValues } = editForm;
	const { resetForm: resetCreateForm } = createForm;

	const handleEdit = useCallback(
		(warehouse: IWarehouse) => {
			setEditValues({
				name: warehouse.name || '',
				code: warehouse.code || '',
				warehouse_type: warehouse.warehouse_type || 'Secundaria',
				description: warehouse.description || '',
				maximum_capacity: warehouse.maximum_capacity,
				manager_id: warehouse.manager_id ?? null,
				address: warehouse.address || '',
				commune_id: warehouse.commune_id ?? null,
				schedule: warehouse.schedule || '',
				is_active: warehouse.is_active !== undefined ? warehouse.is_active : true,
				requires_serial_tracking: warehouse.requires_serial_tracking || false,
			});
			selection.select(warehouse.id);
			setEditModalOpen(true);
		},
		[setEditValues, selection],
	);

	const handleDelete = useCallback(
		(warehouse: IWarehouse) => {
			setStockBlockedWarehouseId(null);
			selection.select(warehouse.id);
			setDeleteModalOpen(true);
		},
		[selection],
	);

	const confirmDelete = useCallback(async () => {
		if (!selectedWarehouse) return false;
		const success = await handleDeleteWarehouse(selectedWarehouse.id);
		if (success) {
			selection.clear();
			void loadWarehouses(LIST_PARAMS);
		}
		return success;
	}, [selectedWarehouse, handleDeleteWarehouse, loadWarehouses, selection]);

	const openCreateModal = useCallback(() => {
		resetCreateForm();
		createSelection.select('create');
	}, [resetCreateForm, createSelection]);
	const setCreateModalOpen = useCallback(
		(nextIsOpen: boolean) => {
			if (nextIsOpen) {
				resetCreateForm();
				createSelection.select('create');
				return;
			}
			createSelection.clear();
		},
		[resetCreateForm, createSelection],
	);

	const state = useMemo(
		() => ({
			warehouses: filteredWarehouses,
			summary,
			typeOptions,
			loading,
			deleting,
			error,
			globalFilter,
			typeFilter,
			statusFilter,
			hasFilters,
			createModalOpen: createSelection.isOpen,
			editModalOpen: editModalOpen && selection.isOpen,
			deleteModalOpen: deleteModalOpen && selection.isOpen,
			selectedWarehouse,
			deleteBlockedByStock,
			adjustStockLink,
			branchId,
		}),
		[
			filteredWarehouses,
			summary,
			typeOptions,
			loading,
			deleting,
			error,
			globalFilter,
			typeFilter,
			statusFilter,
			hasFilters,
			createSelection.isOpen,
			editModalOpen,
			deleteModalOpen,
			selectedWarehouse,
			deleteBlockedByStock,
			adjustStockLink,
			branchId,
			selection.isOpen,
		],
	);

	const forms = { create: createForm, edit: editForm };

	const actions = useMemo(
		() => ({
			setGlobalFilter,
			setTypeFilter,
			setStatusFilter,
			clearFilters,
			refresh,
			openCreateModal,
			setCreateModalOpen,
			setEditModalOpen,
			setDeleteModalOpen,
			handleEdit,
			handleDelete,
			confirmDelete,
			loadWarehouses,
		}),
		[
			setGlobalFilter,
			clearFilters,
			refresh,
			openCreateModal,
			setCreateModalOpen,
			setEditModalOpen,
			setDeleteModalOpen,
			handleEdit,
			handleDelete,
			confirmDelete,
			loadWarehouses,
		],
	);

	return { state, forms, actions };
};
