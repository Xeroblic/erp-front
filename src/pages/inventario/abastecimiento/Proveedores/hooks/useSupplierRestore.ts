import { useCallback } from 'react';
import { toast } from 'react-toastify';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import { restoreProcurementSupplierThunk } from '@/store/slices/procurement/procurementSuppliersSlice';
import type { IProcurementSupplier } from '@/interface/procurement.interface';

/**
 * `restore` (sección 5 del contrato) es una escritura como cualquier otra:
 * necesita su propia `Idempotency-Key`, igual que alta y edición. Se
 * dispara desde tres lugares — la fila del listado, la ficha
 * (`AllowedActionsToolbar`) y el banner de conflicto de RUT — así que vive
 * acá una sola vez en vez de tres copias sin clave.
 */

interface IUseSupplierRestoreArgs {
	subsidiaryId: number | null;
	onSuccess?: (supplier: IProcurementSupplier) => void;
}

const useSupplierRestore = ({ subsidiaryId, onSuccess }: IUseSupplierRestoreArgs) => {
	const dispatch = useAppDispatch();
	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo restaurar el proveedor.',
	});

	const restore = useCallback(
		async (id: number): Promise<IProcurementSupplier | undefined> => {
			const result = await idempotentWrite.submit((headers) =>
				dispatch(
					restoreProcurementSupplierThunk({
						subsidiaryId,
						id,
						headers: { idempotencyKey: headers['Idempotency-Key'] },
					}),
				).unwrap(),
			);

			if (result) {
				toast.success(`${result.display_name} fue restaurado.`);
				onSuccess?.(result);
			} else {
				// El mensaje puntual del error vive en `idempotentWrite.error` para
				// quien quiera mostrarlo inline; acá basta un aviso genérico.
				toast.error('No se pudo restaurar el proveedor.');
			}

			return result;
		},
		[dispatch, idempotentWrite, onSuccess, subsidiaryId],
	);

	return { restore, isRestoring: idempotentWrite.isSubmitting };
};

export default useSupplierRestore;
