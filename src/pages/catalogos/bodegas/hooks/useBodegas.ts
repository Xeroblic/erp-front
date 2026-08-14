import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import useContextScopedSelection from '@/hooks/useContextScopedSelection';
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
} from '../types';

export const useBodegas = () => {
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();
	const latestBranchIdRef = useRef(branchId);
	latestBranchIdRef.current = branchId;

	const warehouseState = useAppSelector((s) => s.warehouse);
	const warehouses =
		warehouseState.listBranchId === branchId ? warehouseState.warehouses : [];
	const { stats, loading, error, deleting } = warehouseState;

	// UI state
	const [globalFilter, setGlobalFilter] = useState('');
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const branchContext = useMemo(
		() => (branchId === null ? null : { type: 'branch' as const, id: branchId }),
		[branchId],
	);
	const createSelection = useContextScopedSelection<'create'>(branchContext);
	const selection = useContextScopedSelection<number>(
		branchContext,
		{
			onInvalidate: () => {
				setEditModalOpen(false);
				setDeleteModalOpen(false);
			},
		},
	);
	const selectedWarehouse = useMemo(
		() => warehouses.find((warehouse) => warehouse.id === selection.selectedId) ?? null,
		[selection.selectedId, warehouses],
	);

	// CRUD handlers
	const loadWarehouses = useCallback(
		async (params?: IFetchWarehousesParams) => {
			if (!branchId) return;
			try {
				await dispatch(fetchWarehouses({ branchId, params })).unwrap();
			} catch (e: unknown) {
				toast.error((e as IWarehouseApiError).message || 'Error al cargar bodegas');
			}
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
			try {
				await dispatch(updateWarehouse({ branchId, warehouseId, data })).unwrap();
				toast.success('Bodega actualizada');
				return true;
			} catch (e: unknown) {
				toast.error((e as IWarehouseApiError).message || 'Error al actualizar la bodega');
				return false;
			}
		},
		[dispatch, branchId],
	);

	const handleDeleteWarehouse = useCallback(
		async (warehouseId: number) => {
			if (!branchId) return false;
			try {
				await dispatch(deleteWarehouse({ branchId, warehouseId })).unwrap();
				toast.success('Bodega eliminada');
				return true;
			} catch (e: unknown) {
				const apiError = e as IWarehouseApiError;
				if (apiError.code === 'WAREHOUSE_HAS_PRODUCTS') {
					toast.error('No se puede eliminar, tiene productos asociados');
				} else {
					toast.error(apiError.message || 'Error al eliminar la bodega');
				}
				return false;
			}
		},
		[dispatch, branchId],
	);

	// Create Formik
	const createForm = useFormik<ICreateWarehouseForm>({
		initialValues: CREATE_WAREHOUSE_INITIAL_VALUES,
		validationSchema: WarehouseSchema,
		onSubmit: async (values, { setSubmitting, resetForm }) => {
			const cleaned: ICreateWarehouseRequest = { ...values };
			if (!cleaned.manager_id) delete cleaned.manager_id;
			if (!cleaned.commune_id) delete cleaned.commune_id;
			if (!cleaned.maximum_capacity) delete cleaned.maximum_capacity;
			if (!cleaned.address || cleaned.address.trim() === '') delete cleaned.address;
			if (!cleaned.schedule || cleaned.schedule.trim() === '') delete cleaned.schedule;
			if (!cleaned.description || cleaned.description.trim() === '') delete cleaned.description;

			const success = await handleCreateWarehouse(cleaned);
			setSubmitting(false);
			if (success) {
				resetForm();
				createSelection.clear();
				loadWarehouses({ page: 1, per_page: 15 });
			}
		},
	});

	// Edit Formik
	const editForm = useFormik<ICreateWarehouseForm>({
		initialValues: CREATE_WAREHOUSE_INITIAL_VALUES,
		validationSchema: WarehouseSchema,
		enableReinitialize: true,
		onSubmit: async (values, { setSubmitting }) => {
			if (!selectedWarehouse) return;
			const cleaned: IUpdateWarehouseRequest = { ...values };
			if (!cleaned.manager_id) delete cleaned.manager_id;
			if (!cleaned.commune_id) delete cleaned.commune_id;
			if (!cleaned.maximum_capacity) delete cleaned.maximum_capacity;
			if (!cleaned.address || cleaned.address.trim() === '') delete cleaned.address;
			if (!cleaned.schedule || cleaned.schedule.trim() === '') delete cleaned.schedule;
			if (!cleaned.description || cleaned.description.trim() === '') delete cleaned.description;

			const success = await handleUpdateWarehouse(selectedWarehouse.id, cleaned);
			setSubmitting(false);
			if (success) {
				setEditModalOpen(false);
				selection.clear();
				loadWarehouses({ page: 1, per_page: 15 });
			}
		},
	});

	// Load data
	useEffect(() => {
		if (branchId) {
			loadWarehouses({ page: 1, per_page: 15 });
		}
	}, [branchId, loadWarehouses]);

	// Cleanup
	useEffect(() => {
		return () => {
			dispatch(clearWarehouseError());
		};
	}, [dispatch]);

	// Filtered warehouses
	const filteredWarehouses = useMemo(() => {
		if (!globalFilter) return warehouses;
		const searchLower = globalFilter.toLowerCase();
		return warehouses.filter(
			(w) =>
				w.name.toLowerCase().includes(searchLower) ||
				w.code.toLowerCase().includes(searchLower),
		);
	}, [warehouses, globalFilter]);

	// Actions
	const handleEdit = useCallback((warehouse: IWarehouse) => {
		editForm.setValues({
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
	}, [editForm, selection]);

	const handleDelete = useCallback((warehouse: IWarehouse) => {
		selection.select(warehouse.id);
		setDeleteModalOpen(true);
	}, [selection]);

	const confirmDelete = useCallback(async () => {
		if (!selectedWarehouse) return false;
		const success = await handleDeleteWarehouse(selectedWarehouse.id);
		if (success) {
			selection.clear();
			loadWarehouses({ page: 1, per_page: 15 });
		}
		return success;
	}, [selectedWarehouse, handleDeleteWarehouse, loadWarehouses, selection]);

	const openCreateModal = useCallback(() => {
		createForm.resetForm();
		createSelection.select('create');
	}, [createForm, createSelection]);
	const setCreateModalOpen = useCallback(
		(nextIsOpen: boolean) => {
			if (nextIsOpen) {
				createForm.resetForm();
				createSelection.select('create');
				return;
			}
			createSelection.clear();
		},
		[createForm, createSelection],
	);

	const state = useMemo(() => ({
		warehouses: filteredWarehouses,
		stats,
		loading,
		deleting,
		error,
		globalFilter,
		createModalOpen: createSelection.isOpen,
		editModalOpen: editModalOpen && selection.isOpen,
		deleteModalOpen: deleteModalOpen && selection.isOpen,
		selectedWarehouse,
		branchId,
	}), [filteredWarehouses, stats, loading, deleting, error, globalFilter, createSelection.isOpen, editModalOpen, deleteModalOpen, selectedWarehouse, branchId, selection.isOpen]);

	const forms = useMemo(() => ({
		create: createForm,
		edit: editForm,
	}), [createForm, editForm]);

	const actions = useMemo(() => ({
		setGlobalFilter,
		openCreateModal,
		setCreateModalOpen,
		setEditModalOpen,
		setDeleteModalOpen,
		handleEdit,
		handleDelete,
		confirmDelete,
		loadWarehouses,
	}), [setGlobalFilter, openCreateModal, setCreateModalOpen, setEditModalOpen, setDeleteModalOpen, handleEdit, handleDelete, confirmDelete, loadWarehouses]);

	return { state, forms, actions };
};
