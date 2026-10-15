import { useEffect, useMemo } from 'react';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchSubsidiaryRolloutStage } from '@/store/slices/subempresa/subEmpresaSlice';

export interface ISubsidiaryRolloutStage {
	/**
	 * `multi_location_enabled` de la filial tal como lo publica el backend.
	 * `null` mientras no se conoce: sin filial, cargando o la lectura falló.
	 */
	multiLocationEnabled: boolean | null;
	/**
	 * Lo que la pantalla debe mostrar: `true` sólo si la filial está confirmada
	 * en la etapa 2. Mientras no se conoce se comporta como la etapa 1, y el
	 * `409 MULTI_LOCATION_NOT_ENABLED` queda como respaldo.
	 */
	isMultiLocation: boolean;
	/** La lectura de la filial está en curso. */
	isLoading: boolean;
}

/**
 * Etapa del despliegue de inventario de una filial. Con la etapa 1 se oculta lo
 * exclusivo de la etapa 2: ubicar o mover stock entre bodegas, ajustar con
 * bodega, elegir ubicación al cerrar una venta y las devoluciones físicas. El
 * umbral crítico y la reposición no dependen de ella.
 *
 * La fuente es `GET /subsidiaries/{id}` (`/perfil` no trae la etapa). Se lee una
 * vez por filial y sesión y queda en el store, así que varias pantallas o
 * componentes que la usan no repiten la petición. Al cambiar de filial se lee la
 * nueva.
 *
 * @param subsidiaryId Filial a consultar. Sin argumento, la filial efectiva del
 *   usuario (`useCurrentBranch`). `null` equivale a «sin filial»: etapa 1.
 */
export const useSubsidiaryRolloutStage = (
	subsidiaryId?: number | null,
): ISubsidiaryRolloutStage => {
	const dispatch = useAppDispatch();
	const { subsidiaryId: currentSubsidiaryId } = useCurrentBranch();
	const targetId = subsidiaryId === undefined ? currentSubsidiaryId : subsidiaryId;
	const entry = useAppSelector((state) =>
		targetId === null ? undefined : state.subEmpresa?.rolloutStageById?.[targetId],
	);

	useEffect(() => {
		// El thunk descarta la lectura si ya está en curso o resuelta.
		if (targetId !== null) void dispatch(fetchSubsidiaryRolloutStage(targetId));
	}, [dispatch, targetId]);

	const multiLocationEnabled = entry?.multiLocationEnabled ?? null;
	// Antes del primer efecto todavía no hay entrada: también es «cargando».
	const isLoading = targetId !== null && (entry === undefined || entry.status === 'loading');

	return useMemo(
		() => ({
			multiLocationEnabled,
			isMultiLocation: multiLocationEnabled === true,
			isLoading,
		}),
		[multiLocationEnabled, isLoading],
	);
};
