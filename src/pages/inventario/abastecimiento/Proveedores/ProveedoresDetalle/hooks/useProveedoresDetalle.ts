import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import { listaComunasThunk } from '@/store/slices/core/coreSlice';
import {
	clearProcurementSupplierCurrent,
	fetchProcurementSupplierDetail,
	restoreProcurementSupplierThunk,
	selectProcurementSupplierCurrent,
	selectProcurementSupplierCurrentError,
	selectProcurementSupplierCurrentLoading,
} from '@/store/slices/procurement/procurementSuppliersSlice';
import type { TProcurementAllowedAction } from '@/interface/procurement.interface';

/**
 * Ficha de proveedor (sección 5 del contrato). A diferencia del listado, acá
 * sí viaja `purchase_summary` y `allowed_actions`: es la única pantalla del
 * módulo que los pide, porque el resumen de compras es caro y no va por fila.
 */
const useProveedoresDetalle = () => {
	const { proveedorId } = useParams();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId } = useCurrentBranch();

	const supplier = useAppSelector(selectProcurementSupplierCurrent);
	const loading = useAppSelector(selectProcurementSupplierCurrentLoading);
	const error = useAppSelector(selectProcurementSupplierCurrentError);
	const listaComunas = useAppSelector((state) => state.core.listaComunas);

	// El contrato sólo entrega el id de comuna: se resuelve a nombre contra el
	// mismo catálogo que usa `SelectComune` en el formulario.
	useEffect(() => {
		dispatch(listaComunasThunk());
	}, [dispatch]);

	const resolveCommuneName = useCallback(
		(communeId: number | null): string | null => {
			if (communeId === null) return null;
			return (
				listaComunas.find((comuna) => String(comuna.codigo) === String(communeId))
					?.nombre ?? null
			);
		},
		[listaComunas],
	);

	const parsedId = Number(proveedorId);
	const id = proveedorId !== undefined && Number.isFinite(parsedId) ? parsedId : null;

	useEffect(() => {
		if (id === null) return undefined;
		dispatch(fetchProcurementSupplierDetail({ subsidiaryId, id }));
		return () => {
			dispatch(clearProcurementSupplierCurrent());
		};
	}, [dispatch, subsidiaryId, id]);

	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
	const [isRestoring, setIsRestoring] = useState(false);

	const goToSupplier = useCallback(
		(supplierId: number) => navigate(`/inventario/abastecimiento/proveedores/${supplierId}`),
		[navigate],
	);
	const goToList = useCallback(
		() => navigate('/inventario/abastecimiento/proveedores'),
		[navigate],
	);

	const handleRestore = useCallback(async () => {
		if (!supplier) return;
		setIsRestoring(true);
		try {
			await dispatch(
				restoreProcurementSupplierThunk({ subsidiaryId, id: supplier.id }),
			).unwrap();
			toast.success(`${supplier.display_name} fue restaurado.`);
		} catch {
			toast.error('No se pudo restaurar el proveedor.');
		} finally {
			setIsRestoring(false);
		}
	}, [dispatch, subsidiaryId, supplier]);

	/** Traduce el click de `AllowedActionsToolbar` a la interacción de esta pantalla. */
	const handleAction = useCallback(
		(action: TProcurementAllowedAction) => {
			if (action === 'update') setIsFormModalOpen(true);
			else if (action === 'deactivate') setIsDeactivateModalOpen(true);
			else if (action === 'restore') void handleRestore();
		},
		[handleRestore],
	);

	const retry = useCallback(() => {
		if (id === null) return;
		dispatch(fetchProcurementSupplierDetail({ subsidiaryId, id }));
	}, [dispatch, subsidiaryId, id]);

	return {
		id,
		branchId,
		subsidiaryId,
		supplier,
		loading,
		error,
		isFormModalOpen,
		setIsFormModalOpen,
		isDeactivateModalOpen,
		setIsDeactivateModalOpen,
		isRestoring,
		handleAction,
		goToSupplier,
		goToList,
		retry,
		resolveCommuneName,
	};
};

export default useProveedoresDetalle;
