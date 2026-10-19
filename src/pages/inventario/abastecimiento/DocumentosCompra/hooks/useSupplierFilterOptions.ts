import { useEffect, useMemo, useState } from 'react';
import type { TSelectOption } from '@/components/form/SelectReact';
import useAuthorization from '@/hooks/useAuthorization';
import { listProcurementSuppliers } from '@/services/procurement/procurementSuppliers.service';
import type { IProcurementSupplierListRow } from '@/interface/procurement.interface';

interface ISupplierFilterResult {
	subsidiaryId: number;
	rows: IProcurementSupplierListRow[];
}

/**
 * Opciones del filtro «Proveedor» del listado de documentos. A diferencia de
 * `useActiveSupplierOptions` (formularios), incluye los inactivos: el backend
 * los acepta como filtro porque sus documentos pasados siguen siendo historia.
 *
 * Exige `view-procurement-supplier`, igual que el listado de proveedores: sin
 * ese permiso no se pide nada y `canList` queda en `false`. Un fallo de carga
 * deja la lista vacía sin bloquear el resto de los filtros.
 *
 * `per_page: 100` es el tope del contrato; un proveedor que quede fuera (o
 * llegue por enlace sin estar en la lista) se muestra igual como
 * «Proveedor #id» para que el filtro activo nunca sea invisible.
 */
const useSupplierFilterOptions = (subsidiaryId: number | null, selectedId: number | null) => {
	const { authorize } = useAuthorization();
	const canList = authorize({
		permission: 'view-procurement-supplier',
		subsidiaryId,
		scope: 'access',
	});
	const [result, setResult] = useState<ISupplierFilterResult | null>(null);

	useEffect(() => {
		if (!canList || subsidiaryId === null) return undefined;

		let cancelled = false;
		listProcurementSuppliers(subsidiaryId, { per_page: 100, include_inactive: 1 })
			.then((response) => {
				if (!cancelled) setResult({ subsidiaryId, rows: response.data });
			})
			.catch(() => {
				if (!cancelled) setResult({ subsidiaryId, rows: [] });
			});

		return () => {
			cancelled = true;
		};
	}, [canList, subsidiaryId]);

	const currentRows =
		result !== null && result.subsidiaryId === subsidiaryId ? result.rows : null;
	const loading = canList && subsidiaryId !== null && currentRows === null;

	const options = useMemo<TSelectOption[]>(() => {
		const loaded = (currentRows ?? [])
			.map((supplier) => ({
				value: String(supplier.id),
				label: supplier.is_active
					? supplier.display_name
					: `${supplier.display_name} (inactivo)`,
			}))
			.sort((left, right) =>
				left.label.localeCompare(right.label, 'es', { sensitivity: 'base' }),
			);
		const isSelectedListed =
			selectedId === null || loaded.some((option) => option.value === String(selectedId));
		return isSelectedListed
			? loaded
			: [{ value: String(selectedId), label: `Proveedor #${selectedId}` }, ...loaded];
	}, [currentRows, selectedId]);

	return { options, loading, canList };
};

export default useSupplierFilterOptions;
