import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
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

	const warehouses = useAppSelector((s) => s.warehouse.warehouses);
	const stats = useAppSelector((s) => s.warehouse.stats);
	const loading = useAppSelector((s) => s.warehouse.loading);
	const error = useAppSelector((s) => s.warehouse.error);
	const deleting = useAppSelector((s) => s.warehouse.deleting);

	// UI state
	const [globalFilter, setGlobalFilter] = useState('');
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [selectedWarehouse, setSelectedWarehouse] = useState<IWarehouse | null>(null);

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
			try {
				await dispatch(createWarehouse({ branchId, data })).unwrap();
				toast.success('Bodega creada exitosamente');
				return true;
			} catch (e: unknown) {
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
				setCreateModalOpen(false);
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
				setSelectedWarehouse(null);
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
		setSelectedWarehouse(warehouse);
		setEditModalOpen(true);
	}, [editForm]);

	const handleDelete = useCallback((warehouse: IWarehouse) => {
		setSelectedWarehouse(warehouse);
		setDeleteModalOpen(true);
	}, []);

	const confirmDelete = useCallback(async () => {
		if (!selectedWarehouse) return false;
		const success = await handleDeleteWarehouse(selectedWarehouse.id);
		if (success) {
			setSelectedWarehouse(null);
			loadWarehouses({ page: 1, per_page: 15 });
		}
		return success;
	}, [selectedWarehouse, handleDeleteWarehouse, loadWarehouses]);

	const openCreateModal = useCallback(() => {
		createForm.resetForm();
		setCreateModalOpen(true);
	}, [createForm]);

	const state = useMemo(() => ({
		warehouses: filteredWarehouses,
		stats,
		loading,
		deleting,
		error,
		globalFilter,
		createModalOpen,
		editModalOpen,
		deleteModalOpen,
		selectedWarehouse,
		branchId,
	}), [filteredWarehouses, stats, loading, deleting, error, globalFilter, createModalOpen, editModalOpen, deleteModalOpen, selectedWarehouse, branchId]);

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
		setSelectedWarehouse,
		handleEdit,
		handleDelete,
		confirmDelete,
		loadWarehouses,
	}), [setGlobalFilter, openCreateModal, setCreateModalOpen, setEditModalOpen, setDeleteModalOpen, setSelectedWarehouse, handleEdit, handleDelete, confirmDelete, loadWarehouses]);

	return { state, forms, actions };
};
