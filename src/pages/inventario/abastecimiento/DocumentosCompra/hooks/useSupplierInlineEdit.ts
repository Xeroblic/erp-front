import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { getProcurementSupplier } from '@/services/procurement/procurementSuppliers.service';
import type { IProcurementSupplier } from '@/interface/procurement.interface';

/**
 * Edición en línea del proveedor ya elegido en el documento de compra: evita
 * salir a la ficha sólo para completar giro o direcciones antes de facturar.
 *
 * El `Select` trabaja con la fila resumida del listado, que no trae
 * direcciones ni `allowed_actions`; el formulario de edición necesita la ficha
 * completa, así que se pide al abrir. Mismo criterio que la ficha de
 * proveedor: sólo se edita si el servidor ofrece `update`.
 */
const useSupplierInlineEdit = (subsidiaryId: number | null) => {
	const [editingSupplier, setEditingSupplier] = useState<IProcurementSupplier | null>(null);
	const [isLoadingSupplier, setIsLoadingSupplier] = useState(false);

	const openSupplierEdit = useCallback(
		async (supplierId: number) => {
			if (subsidiaryId === null) return;
			setIsLoadingSupplier(true);
			try {
				const { data } = await getProcurementSupplier(subsidiaryId, supplierId);
				if (!data.allowed_actions.includes('update')) {
					toast.error('Este proveedor no se puede editar.');
					return;
				}
				setEditingSupplier(data);
			} catch {
				toast.error('No se pudo cargar el proveedor.');
			} finally {
				setIsLoadingSupplier(false);
			}
		},
		[subsidiaryId],
	);

	const closeSupplierEdit = useCallback(() => setEditingSupplier(null), []);

	return { editingSupplier, isLoadingSupplier, openSupplierEdit, closeSupplierEdit };
};

export default useSupplierInlineEdit;
