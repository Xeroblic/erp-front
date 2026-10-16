import ApiService from '@/services/ApiService';
import type {
	IReplenishmentCandidatesPage,
	IReplenishmentCandidatesParams,
} from '@/interface/inventoryReports.interface';
import { parseReplenishmentCandidates } from '@/services/reports/inventoryReports.service';

/**
 * Reposición — §13 del contrato de abastecimiento (tarea 20),
 * `GET /api/subsidiaries/{subsidiary}/procurement/replenishment-candidates`.
 *
 * Contrato verificado contra el backend (`ReplenishmentController`):
 * - Leer exige `view-product` en la filial; sin él, 403. Funciona en las dos
 *   etapas (no depende de `multi_location_enabled`).
 * - La lista y la recomendación se calculan con las sucursales que el usuario
 *   alcanza: dos usuarios pueden ver recomendaciones distintas.
 * - Orden fijo (disponible ascendente, después producto) y paginación
 *   estándar con `per_page` hasta 100. Un filtro inválido es 422.
 *
 * Sólo API real: no hay doble. Sin caché de `ApiService`: una recepción o un
 * ajuste cambian la lista.
 */
const listReplenishmentCandidates = async (
	subsidiaryId: number,
	params: IReplenishmentCandidatesParams,
	signal?: AbortSignal,
): Promise<IReplenishmentCandidatesPage> => {
	const response = await ApiService.fetchData<unknown>({
		url: `/subsidiaries/${subsidiaryId}/procurement/replenishment-candidates`,
		method: 'get',
		params: Object.fromEntries(
			Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
		),
		signal,
	});
	return parseReplenishmentCandidates(response.data);
};

export default listReplenishmentCandidates;
