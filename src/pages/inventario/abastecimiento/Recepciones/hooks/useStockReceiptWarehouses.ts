import { useCallback, useEffect, useMemo, useState } from 'react';
import useAuthorization from '@/hooks/useAuthorization';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppSelector } from '@/store';
import { listWarehousesForStockReceipts } from '@/services/procurement/stockReceipts.service';
import { getProcurementErrorMessage } from '@/utils/procurementErrors.util';
import { resolveSubsidiaryFromBranch, type ContextUser } from '@/utils/orgContext.util';
import type { IStockReceiptWarehouse } from '@/interface/procurement.interface';

interface IWarehousesResult {
	key: string;
	warehouses: IStockReceiptWarehouse[];
	error: string | null;
}

const NO_WAREHOUSES: IStockReceiptWarehouse[] = [];

/**
 * Bodegas activas en las que la recepción puede recibir: las de las
 * sucursales del usuario **en la filial activa** a las que tiene acceso. Se
 * descartan antes de pedir sus bodegas una sucursal de otra filial (el backend
 * rechaza una bodega ajena a la filial de la ruta) y una sólo visible (el
 * listado exige acceso efectivo a la sucursal y respondería 403). Sin
 * sucursales visibles se usa la activa.
 *
 * El listado exige `view-warehouse`, aparte del `edit-product` de la
 * recepción: sin él, el 403 se muestra con el mensaje del servidor.
 *
 * Cada resultado queda asociado a las sucursales que lo pidieron y sólo se
 * expone mientras sean las vigentes: al cambiar de filial no se ofrecen las
 * bodegas de la anterior ni un instante.
 */
const useStockReceiptWarehouses = (subsidiaryId: number | null, isEnabled = true) => {
	const { branchId, visibleBranches } = useCurrentBranch();
	const { canAccessBranch } = useAuthorization();
	const user = useAppSelector((state) => state.auth.user) as ContextUser | null | undefined;

	const branchIds = useMemo(() => {
		const candidates =
			visibleBranches.length > 0
				? visibleBranches.map((branch) => branch.id)
				: [branchId].filter((id): id is number => id !== null);
		// Una sucursal cuya filial no se conoce se conserva: el backend la valida.
		return candidates.filter((id) => {
			const owner = resolveSubsidiaryFromBranch(id, user);
			return canAccessBranch(id) && (owner === null || owner === subsidiaryId);
		});
		// `canAccessBranch` se recrea en cada render; depende de lo mismo que `user`.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [visibleBranches, branchId, user, subsidiaryId]);

	const key = `${subsidiaryId ?? 'null'}:${branchIds.join(',')}`;
	const [result, setResult] = useState<IWarehousesResult | null>(null);
	const [attempt, setAttempt] = useState(0);
	const canLoad = isEnabled && subsidiaryId !== null && branchIds.length > 0;

	useEffect(() => {
		if (!canLoad) return undefined;
		const controller = new AbortController();
		listWarehousesForStockReceipts(branchIds, controller.signal).then(
			(warehouses) => {
				if (!controller.signal.aborted) setResult({ key, warehouses, error: null });
			},
			(error: unknown) => {
				if (controller.signal.aborted) return;
				setResult({
					key,
					warehouses: NO_WAREHOUSES,
					error: getProcurementErrorMessage(
						error,
						'No pudimos cargar las bodegas de tus sucursales.',
					),
				});
			},
		);
		return () => controller.abort();
		// `branchIds` se representa en `key`: un arreglo nuevo con las mismas
		// sucursales no repite la lectura.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [canLoad, key, attempt]);

	const current = result?.key === key ? result : null;
	// Sin el resultado anterior, el reintento vuelve a mostrar la carga.
	const retry = useCallback(() => {
		setResult(null);
		setAttempt((value) => value + 1);
	}, []);

	return useMemo(
		() => ({
			warehouses: current?.warehouses ?? NO_WAREHOUSES,
			loading: canLoad && current === null,
			error: current?.error ?? null,
			retry,
		}),
		[current, canLoad, retry],
	);
};

export default useStockReceiptWarehouses;
