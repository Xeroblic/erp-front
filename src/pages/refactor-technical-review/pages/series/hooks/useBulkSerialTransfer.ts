import { useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';
import type { TSelectOption } from '@/components/form/SelectReact';
import { useAppSelector } from '@/store';
import { selectUserBranches } from '@/store/selectors/userBranchesSelectors';
import { stockForbiddenMessage, toStockRequestError } from '@/utils/stockMovementErrors.util';

interface IUseBulkSerialTransferParams {
	/** Sucursal activa del usuario: de ella salen las series. */
	fromBranchId: number | null;
	/** Filial a usar si la sucursal activa no figura entre las del perfil. */
	fallbackSubsidiaryId: number | null;
	/** Se llama tras un traslado exitoso (recargar el listado). */
	onTransferred: () => void;
}

/**
 * Traslado en bloque, `POST /subsidiaries/{s}/bulk-transfer-stock`. Desde la QA de la
 * etapa 2 del backend (#127, F2) exige acceso a la sucursal de origen y a la de destino.
 *
 * Los destinos son las sucursales del usuario en la misma filial, sin la de origen, y no
 * se filtran por `access`: el perfil no expone todos los accesos que reconoce el backend
 * (roles de filial o empresa), así que decide él. Su 403 es genérico, así que se nombran
 * las dos sucursales.
 */
const useBulkSerialTransfer = ({
	fromBranchId,
	fallbackSubsidiaryId,
	onTransferred,
}: IUseBulkSerialTransferParams) => {
	const userBranches = useAppSelector(selectUserBranches);

	const fromBranch = userBranches.find((branch) => branch.id === fromBranchId);
	const fromBranchName = fromBranch?.name;
	const subsidiaryId = fromBranch?.subsidiaryId ?? fallbackSubsidiaryId;

	const destinationBranchOptions = useMemo<TSelectOption[]>(
		() =>
			userBranches
				.filter((branch) => branch.id !== fromBranchId)
				.filter((branch) => !subsidiaryId || branch.subsidiaryId === subsidiaryId)
				.map((branch) => ({ value: String(branch.id), label: branch.name }))
				.sort((a, b) => a.label.localeCompare(b.label, 'es')),
		[userBranches, fromBranchId, subsidiaryId],
	);

	const bulkTransferStock = useCallback(
		async (serialNumbers: string[], targetBranchId: number) => {
			try {
				if (!fromBranchId || !subsidiaryId) {
					toast.error('Información de sucursal/subsidiaria no disponible');
					return;
				}

				if (serialNumbers.length === 0) {
					toast.error('No hay números de serie para transferir');
					return;
				}

				await ApiService.fetchData({
					url: `/subsidiaries/${subsidiaryId}/bulk-transfer-stock`,
					method: 'post',
					data: {
						from_branch_id: fromBranchId,
						to_branch_id: targetBranchId,
						serial_numbers: serialNumbers,
					},
				});

				toast.success('Stock transferido exitosamente');
				onTransferred();
			} catch (error) {
				// Sin reintento: reenviar no cambia el acceso del usuario.
				const { status } = toStockRequestError(error, 'Error al transferir stock');
				toast.error(
					status === 403
						? stockForbiddenMessage({
								operation: 'transfer',
								sourceBranchName: fromBranchName,
								destinationBranchName: destinationBranchOptions.find(
									(option) => Number(option.value) === targetBranchId,
								)?.label,
							})
						: 'Error al transferir stock',
				);
				console.error(error);
			}
		},
		[fromBranchId, fromBranchName, subsidiaryId, destinationBranchOptions, onTransferred],
	);

	return { bulkTransferStock, destinationBranchOptions };
};

export default useBulkSerialTransfer;
