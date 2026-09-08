import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import { listaComunasThunk } from '@/store/slices/core/coreSlice';
import {
	clearProcurementSupplierCurrent,
	fetchProcurementSupplierDetail,
	selectProcurementSupplierCurrent,
	selectProcurementSupplierCurrentError,
	selectProcurementSupplierCurrentLoading,
} from '@/store/slices/procurement/procurementSuppliersSlice';
import type { TProcurementAllowedAction } from '@/interface/procurement.interface';
import useSupplierRestore from '../../hooks/useSupplierRestore';

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
		void dispatch(listaComunasThunk());
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
		void dispatch(fetchProcurementSupplierDetail({ subsidiaryId, id }));
		return () => {
			dispatch(clearProcurementSupplierCurrent());
		};
	}, [dispatch, subsidiaryId, id]);

	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

	const goToSupplier = useCallback(
		(supplierId: number) => navigate(`/inventario/abastecimiento/proveedores/${supplierId}`),
		[navigate],
	);
	const goToList = useCallback(
		() => navigate('/inventario/abastecimiento/proveedores'),
		[navigate],
	);

	const retry = useCallback(() => {
		if (id === null) return;
		void dispatch(fetchProcurementSupplierDetail({ subsidiaryId, id }));
	}, [dispatch, subsidiaryId, id]);

	/**
	 * `restore` (sección 5) devuelve la ficha completa y ya la refleja en
	 * `current` vía el propio thunk — a diferencia de `deactivate`, acá no
	 * hace falta un `retry()` explícito tras el éxito.
	 */
	const { restore, isRestoring } = useSupplierRestore({ subsidiaryId });
	const handleRestore = useCallback(async () => {
		if (!supplier) return;
		await restore(supplier.id);
	}, [restore, supplier]);

	/**
	 * `deactivate` es 204 sin cuerpo (sección 5): el store sólo puede marcar
	 * `is_active` con certeza, no `allowed_actions`. La ficha necesita el
	 * dato fresco del backend para saber qué ofrece después, así que se
	 * vuelve a pedir explícitamente.
	 */
	const handleDeactivated = useCallback(() => {
		retry();
	}, [retry]);

	/** Traduce el click de `AllowedActionsToolbar` a la interacción de esta pantalla. */
	const handleAction = useCallback(
		(action: TProcurementAllowedAction) => {
			if (action === 'update') setIsFormModalOpen(true);
			else if (action === 'deactivate') setIsDeactivateModalOpen(true);
			else if (action === 'restore') void handleRestore();
		},
		[handleRestore],
	);

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
		handleDeactivated,
		goToSupplier,
		goToList,
		retry,
		resolveCommuneName,
	};
};

export default useProveedoresDetalle;
