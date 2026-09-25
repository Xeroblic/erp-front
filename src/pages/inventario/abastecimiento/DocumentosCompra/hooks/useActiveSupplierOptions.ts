import { useCallback, useEffect, useMemo, useState } from 'react';
import { listProcurementSuppliers } from '@/services/procurement/procurementSuppliers.service';
import { resolveProcurementError } from '@/utils/procurementErrors.util';
import type { IProcurementSupplierListRow } from '@/interface/procurement.interface';

/**
 * Proveedores activos para el `Select` de los formularios de documento de
 * compra y de recepción manual. Llama al servicio directamente (no pasa por
 * el slice de proveedores): es sólo una lista de apoyo para el formulario, no
 * el listado de la pantalla de Proveedores, y compartir el mismo estado de
 * Redux para dos propósitos distintos acoplaría ambas pantallas sin razón.
 *
 * `per_page: 100` es el máximo del contrato (sección 1): una filial con más
 * proveedores activos que eso no los verá todos aquí. Cuando pase, el
 * selector necesita búsqueda server-side (`search`), no una carga completa.
 *
 * Todo resultado queda asociado a la filial que lo pidió y sólo se expone
 * mientras esa siga siendo la filial vigente: al cambiarla, las opciones de
 * la anterior desaparecen desde el primer render, sin esperar a que el efecto
 * pida la nueva lista. Lo mismo vale al reabrir el modal en otra filial.
 *
 * El listado exige `view-procurement-supplier`, un permiso distinto del de
 * crear documentos o recepciones. Un 403 no se disfraza de lista vacía:
 * `unavailableReason` lo distingue de un fallo común para que el formulario
 * explique por qué no hay proveedores que elegir.
 *
 * `addSupplier` suma un proveedor creado o restaurado desde el propio
 * formulario (alta en línea). Se guarda aparte, con la filial en que se
 * creó, y se mezcla al render en vez de escribir sobre la lista cargada: así
 * una carga que resuelva después no lo borra, y otra filial no lo ve.
 */

export type TSupplierOptionsUnavailableReason = 'forbidden' | 'failed';

interface ISupplierOptionsResult {
	subsidiaryId: number;
	rows: IProcurementSupplierListRow[];
	unavailableReason: TSupplierOptionsUnavailableReason | null;
}

interface IAddedSupplier {
	subsidiaryId: number;
	supplier: IProcurementSupplierListRow;
}

const FORBIDDEN_STATUS = 403;

const bySupplierName = (
	left: IProcurementSupplierListRow,
	right: IProcurementSupplierListRow,
): number =>
	left.display_name.localeCompare(right.display_name, 'es', { sensitivity: 'base' }) ||
	left.id - right.id;

const useActiveSupplierOptions = (subsidiaryId: number | null, isEnabled: boolean) => {
	const [result, setResult] = useState<ISupplierOptionsResult | null>(null);
	const [pendingSubsidiaryId, setPendingSubsidiaryId] = useState<number | null>(null);
	const [added, setAdded] = useState<IAddedSupplier[]>([]);
	const [reloadToken, setReloadToken] = useState(0);

	useEffect(() => {
		if (!isEnabled || subsidiaryId === null) return undefined;

		let cancelled = false;
		setPendingSubsidiaryId(subsidiaryId);
		listProcurementSuppliers(subsidiaryId, { per_page: 100 })
			.then((response) => {
				if (cancelled) return;
				setResult({ subsidiaryId, rows: response.data, unavailableReason: null });
			})
			.catch((error: unknown) => {
				if (cancelled) return;
				const isForbidden = resolveProcurementError(error).status === FORBIDDEN_STATUS;
				setResult({
					subsidiaryId,
					rows: [],
					unavailableReason: isForbidden ? 'forbidden' : 'failed',
				});
			})
			.finally(() => {
				if (!cancelled) setPendingSubsidiaryId(null);
			});

		return () => {
			cancelled = true;
		};
	}, [subsidiaryId, isEnabled, reloadToken]);

	const currentResult =
		subsidiaryId !== null && result?.subsidiaryId === subsidiaryId ? result : null;
	const loading =
		isEnabled &&
		subsidiaryId !== null &&
		(pendingSubsidiaryId === subsidiaryId || currentResult === null);
	// Mientras se reintenta, el motivo anterior ya no describe lo que se ve.
	const unavailableReason = loading ? null : (currentResult?.unavailableReason ?? null);

	const suppliers = useMemo(() => {
		if (subsidiaryId === null) return [];
		const byId = new Map(
			(currentResult?.rows ?? []).map((supplier) => [supplier.id, supplier]),
		);
		// Lo agregado en línea es más fresco que la carga: pisa la fila del mismo ID.
		added
			.filter((entry) => entry.subsidiaryId === subsidiaryId)
			.forEach(({ supplier }) => byId.set(supplier.id, supplier));
		return [...byId.values()].filter((supplier) => supplier.is_active).sort(bySupplierName);
	}, [currentResult, added, subsidiaryId]);

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

	return { suppliers, loading, unavailableReason, addSupplier, reload };
};

export default useActiveSupplierOptions;
