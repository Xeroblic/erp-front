import { useCallback, useEffect, useMemo, useState } from 'react';
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
 *
 * `addSupplier` suma un proveedor creado o restaurado desde el propio
 * formulario (alta en línea). Se guarda aparte, con la filial en que se
 * creó, y se mezcla al render en vez de escribir sobre la lista cargada: así
 * una carga que resuelva después no lo borra, y otra filial no lo ve.
 */

interface IAddedSupplier {
	subsidiaryId: number;
	supplier: IProcurementSupplierListRow;
}

const bySupplierName = (
	left: IProcurementSupplierListRow,
	right: IProcurementSupplierListRow,
): number =>
	left.display_name.localeCompare(right.display_name, 'es', { sensitivity: 'base' }) ||
	left.id - right.id;

const useActiveSupplierOptions = (subsidiaryId: number | null, isEnabled: boolean) => {
	const [loaded, setLoaded] = useState<IProcurementSupplierListRow[]>([]);
	const [added, setAdded] = useState<IAddedSupplier[]>([]);
	const [loading, setLoading] = useState(false);
	const [reloadToken, setReloadToken] = useState(0);

	useEffect(() => {
		if (!isEnabled || subsidiaryId === null) return undefined;

		let cancelled = false;
		setLoading(true);
		listProcurementSuppliers(subsidiaryId, { per_page: 100 })
			.then((response) => {
				if (!cancelled) setLoaded(response.data);
			})
			.catch(() => {
				if (!cancelled) setLoaded([]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [subsidiaryId, isEnabled, reloadToken]);

	const suppliers = useMemo(() => {
		const byId = new Map(loaded.map((supplier) => [supplier.id, supplier]));
		// Lo agregado en línea es más fresco que la carga: pisa la fila del mismo ID.
		added
			.filter((entry) => entry.subsidiaryId === subsidiaryId)
			.forEach(({ supplier }) => byId.set(supplier.id, supplier));
		return [...byId.values()].filter((supplier) => supplier.is_active).sort(bySupplierName);
	}, [loaded, added, subsidiaryId]);

	const addSupplier = useCallback(
		(supplier: IProcurementSupplierListRow) => {
			if (subsidiaryId === null) return;
			setAdded((previous) => [
				...previous.filter(
					(entry) =>
						entry.subsidiaryId !== subsidiaryId || entry.supplier.id !== supplier.id,
				),
				{ subsidiaryId, supplier },
			]);
		},
		[subsidiaryId],
	);

	const reload = useCallback(() => setReloadToken((token) => token + 1), []);

	return { suppliers, loading, addSupplier, reload };
};

export default useActiveSupplierOptions;
