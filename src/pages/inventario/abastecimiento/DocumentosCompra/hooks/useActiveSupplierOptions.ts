import { useEffect, useState } from 'react';
import { listProcurementSuppliers } from '@/services/procurement/procurementSuppliers.service';
import type { IProcurementSupplierListRow } from '@/interface/procurement.interface';

/**
 * Proveedores activos para el `Select` del formulario de documento de
 * compra. Llama al servicio directamente (no pasa por el slice de
 * proveedores): es sólo una lista de apoyo para el formulario, no el
 * listado de la pantalla de Proveedores, y compartir el mismo estado de
 * Redux para dos propósitos distintos acoplaría ambas pantallas sin razón.
 *
 * `per_page: 100` (el máximo del contrato, sección 1) es suficiente para el
 * mock; el día que exista el backend, un selector con más proveedores que
 * eso necesita búsqueda server-side, no una carga completa.
 */
const useActiveSupplierOptions = (subsidiaryId: number | null, isEnabled: boolean) => {
	const [suppliers, setSuppliers] = useState<IProcurementSupplierListRow[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!isEnabled || subsidiaryId === null) return undefined;

		let cancelled = false;
		setLoading(true);
		listProcurementSuppliers(subsidiaryId, { per_page: 100 })
			.then((response) => {
				if (!cancelled) setSuppliers(response.data);
			})
			.catch(() => {
				if (!cancelled) setSuppliers([]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [subsidiaryId, isEnabled]);

	return { suppliers, loading };
};

export default useActiveSupplierOptions;
