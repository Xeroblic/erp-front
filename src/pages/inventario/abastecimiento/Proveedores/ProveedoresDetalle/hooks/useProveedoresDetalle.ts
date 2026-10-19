import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	clearProcurementSupplierCurrent,
	fetchProcurementSupplierDetail,
	selectProcurementSupplierCurrent,
	selectProcurementSupplierCurrentError,
	selectProcurementSupplierCurrentLoading,
	selectProcurementSupplierCurrentSubsidiaryId,
	selectProcurementSupplierCurrentSupplierId,
} from '@/store/slices/procurement/procurementSuppliersSlice';
import type { TProcurementAllowedAction } from '@/interface/procurement.interface';
import useSupplierRestore from '../../hooks/useSupplierRestore';
import { formatCommuneWithRegion } from '../../types';

type TSupplierModal = 'update' | 'deactivate';

interface IOpenModal {
	modal: TSupplierModal;
	subsidiaryId: number | null;
	id: number | null;
}

const useProveedoresDetalle = () => {
	const { proveedorId } = useParams();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId } = useCurrentBranch();

	const storedSupplier = useAppSelector(selectProcurementSupplierCurrent);
	const storedLoading = useAppSelector(selectProcurementSupplierCurrentLoading);
	const storedError = useAppSelector(selectProcurementSupplierCurrentError);
	const ownerSubsidiaryId = useAppSelector(selectProcurementSupplierCurrentSubsidiaryId);
	const ownerSupplierId = useAppSelector(selectProcurementSupplierCurrentSupplierId);

	const parsedId = Number(proveedorId);
	const id = proveedorId !== undefined && Number.isFinite(parsedId) ? parsedId : null;

	/**
	 * La carga nueva y la limpieza de la anterior ocurren en el efecto, después
	 * del render: hasta entonces la ficha de otra filial u otro proveedor no se
	 * muestra, para que sus acciones no apunten al contexto nuevo.
	 */
	const isCurrentForContext = ownerSubsidiaryId === subsidiaryId && ownerSupplierId === id;
	const supplier = isCurrentForContext ? storedSupplier : null;
	const error = isCurrentForContext ? storedError : null;
	const loading = storedLoading || (id !== null && !isCurrentForContext);

	// La ficha trae la comuna anidada: no hace falta cargar el catálogo completo.
	const billingCommuneName = formatCommuneWithRegion(supplier?.billing_commune);
	const shippingCommuneName = formatCommuneWithRegion(supplier?.shipping_commune);

	useEffect(() => {
		if (id === null) return undefined;
		void dispatch(fetchProcurementSupplierDetail({ subsidiaryId, id }));
		return () => {
			dispatch(clearProcurementSupplierCurrent());
		};
	}, [dispatch, subsidiaryId, id]);

	// Cada modal queda atado a la filial y al proveedor en que se abrió: fuera
	// de ese contexto se cierra, y volver a él no lo reabre.
	const [openModal, setOpenModal] = useState<IOpenModal | null>(null);
	const activeModal =
		openModal !== null && openModal.subsidiaryId === subsidiaryId && openModal.id === id
			? openModal.modal
			: null;
	if (openModal !== null && activeModal === null) setOpenModal(null);
	const setModalOpen = useCallback(
		(modal: TSupplierModal, open: boolean) =>
			setOpenModal(open ? { modal, subsidiaryId, id } : null),
		[subsidiaryId, id],
	);
	const setIsFormModalOpen = useCallback(
		(open: boolean) => setModalOpen('update', open),
		[setModalOpen],
	);
	const setIsDeactivateModalOpen = useCallback(
		(open: boolean) => setModalOpen('deactivate', open),
		[setModalOpen],
	);

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

	// `restore` devuelve la ficha completa y el thunk ya la refleja en `current`.
	const { restore, isRestoring } = useSupplierRestore({ subsidiaryId });
	const handleRestore = useCallback(async () => {
		if (!supplier) return;
		await restore(supplier.id);
	}, [restore, supplier]);

	// `deactivate` es 204 sin cuerpo: `allowed_actions` sólo llega volviendo a pedir la ficha.
	const handleDeactivated = useCallback(() => {
		retry();
	}, [retry]);

	const handleAction = useCallback(
		(action: TProcurementAllowedAction) => {
			if (action === 'update') setIsFormModalOpen(true);
			else if (action === 'deactivate') setIsDeactivateModalOpen(true);
			else if (action === 'restore') void handleRestore();
		},
		[handleRestore, setIsFormModalOpen, setIsDeactivateModalOpen],
	);

	return {
		id,
		branchId,
		subsidiaryId,
		supplier,
		loading,
		error,
		isFormModalOpen: activeModal === 'update',
		setIsFormModalOpen,
		isDeactivateModalOpen: activeModal === 'deactivate',
		setIsDeactivateModalOpen,
		isRestoring,
		handleAction,
		handleDeactivated,
		goToSupplier,
		goToList,
		retry,
		billingCommuneName,
		shippingCommuneName,
	};
};

export default useProveedoresDetalle;
