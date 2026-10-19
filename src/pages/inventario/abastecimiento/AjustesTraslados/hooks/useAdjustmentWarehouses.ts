import { useEffect, useState } from 'react';
import INVENTORY_ADJUSTMENTS_USE_MOCKS from '@/config/inventoryAdjustments.config';
import {
	getAdjustmentWarehouses,
	listAdjustmentWarehouses,
} from '@/services/procurement/inventoryStock.service';
import { getProcurementErrorMessage } from '@/utils/procurementErrors.util';
import type { IWarehouseCompact } from '@/interface/procurement.interface';

type TCatalog =
	| { key: string; status: 'ready'; warehouses: IWarehouseCompact[] }
	| { key: string; status: 'error'; message: string };

/** El formulario se monta tras resolver el catálogo, para conservar la preselección. */
export default function useAdjustmentWarehouses(
	branchId: number,
	multiLocation: boolean,
	owner: string,
) {
	const key = `${owner}:${branchId}:${multiLocation}:${INVENTORY_ADJUSTMENTS_USE_MOCKS}`;
	const [result, setResult] = useState<TCatalog | null>(null);
	const [attempt, setAttempt] = useState(0);
	useEffect(() => {
		if (!multiLocation || INVENTORY_ADJUSTMENTS_USE_MOCKS) return undefined;
		const controller = new AbortController();
		listAdjustmentWarehouses(branchId, controller.signal).then(
			(warehouses) => {
				if (!controller.signal.aborted)
					setResult({
						key,
						status: 'ready',
						warehouses: warehouses.map(({ id, name, is_active: active }) => ({
							id,
							name: active ? name : `${name} (inactiva)`,
						})),
					});
			},
			(error: unknown) => {
				if (!controller.signal.aborted)
					setResult({
						key,
						status: 'error',
						message: getProcurementErrorMessage(
							error,
							'No pudimos cargar las bodegas de la sucursal.',
						),
					});
			},
		);
		return () => controller.abort();
	}, [key, branchId, multiLocation, attempt]);

	const retry = () => {
		setResult(null);
		setAttempt((value) => value + 1);
	};
	if (!multiLocation) return { key, status: 'ready' as const, warehouses: [], retry };
	if (INVENTORY_ADJUSTMENTS_USE_MOCKS)
		return {
			key,
			status: 'ready' as const,
			warehouses: getAdjustmentWarehouses(branchId),
			retry,
		};
	const current = result?.key === key ? result : null;
	return current ? { ...current, retry } : { key, status: 'loading' as const, retry };
}
