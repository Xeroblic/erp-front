import { useEffect, useState } from 'react';
import { listProcurementSuppliers } from '@/services/procurement/procurementSuppliers.service';
import type { IProcurementSupplierListRow } from '@/interface/procurement.interface';

/**
 * Proveedores activos para el `Select` del alta manual de recepción. Llama
 * al servicio directamente, sin pasar por el slice de proveedores — es sólo
 * una lista de apoyo para este formulario, mismo criterio que la copia
 * homónima de `DocumentosCompra/hooks`.
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
