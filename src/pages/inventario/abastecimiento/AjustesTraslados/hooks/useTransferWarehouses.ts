import { useCallback, useEffect, useMemo, useState } from 'react';
import { listTransferWarehouses } from '@/services/procurement/inventoryStock.service';
import { getProcurementErrorMessage } from '@/utils/procurementErrors.util';
import type { ITransferWarehouse } from '@/interface/procurement.interface';

type TTransferWarehousesState =
	| { status: 'loading' }
	| { status: 'ready'; warehouses: ITransferWarehouse[] }
	| { status: 'error'; message: string };

/**
 * Bodegas de la sucursal que el traslado ofrece como origen y destino. El
 * listado exige `view-warehouse`, aparte del `edit-product` del traslado: sin
 * él, el 403 se muestra con el mensaje del servidor.
 */
export default function useTransferWarehouses(branchId: number) {
	const [state, setState] = useState<TTransferWarehousesState>({ status: 'loading' });
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		const controller = new AbortController();
		setState({ status: 'loading' });
		listTransferWarehouses(branchId, controller.signal).then(
			(warehouses) => {
				if (!controller.signal.aborted) setState({ status: 'ready', warehouses });
			},
			(error: unknown) => {
				if (controller.signal.aborted) return;
				setState({
					status: 'error',
					message: getProcurementErrorMessage(
						error,
						'No pudimos cargar las bodegas de la sucursal.',
					),
				});
			},
		);
		return () => controller.abort();
	}, [branchId, attempt]);

	const retry = useCallback(() => setAttempt((value) => value + 1), []);

	return useMemo(() => ({ state, retry }), [state, retry]);
}
