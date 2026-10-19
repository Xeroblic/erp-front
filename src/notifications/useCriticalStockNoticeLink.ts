import { useMemo } from 'react';
import type { IPageLink } from '@/config/procurementLinks';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import type { UserNotificationDTO } from '@/interface/notifications.interface';
import { useAppSelector } from '@/store';
import criticalStockProductLink from './criticalStockLink';

export interface ICriticalStockNoticeLink {
	/** Ficha de inventario del producto, sólo si el aviso es de la filial activa. */
	link: IPageLink | null;
	/** Aviso de otra filial: explica cómo llegar a la ficha en vez de enlazarla. */
	foreignSubsidiaryNote: string | null;
}

/**
 * Enlace de un aviso de stock crítico a la ficha de inventario. La ficha se
 * abre con la sucursal activa, así que un aviso de otra filial
 * (`event.scope.subsidiary_id`) no enlaza: el cambio de contexto es del
 * selector del encabezado. Sin `scope` o sin filial activa, se enlaza.
 */
const useCriticalStockNoticeLink = (
	notification: Pick<UserNotificationDTO, 'event'> | undefined,
): ICriticalStockNoticeLink => {
	const { subsidiaryId: activeSubsidiaryId } = useCurrentBranch();
	const visibleSubsidiaries = useAppSelector((s) => s.auth.user?.visible?.subsidiaries);

	return useMemo(() => {
		const link = notification ? criticalStockProductLink(notification) : null;
		if (!link) return { link: null, foreignSubsidiaryNote: null };

		const noticeSubsidiaryId = notification?.event?.scope?.subsidiary_id ?? null;
		if (
			noticeSubsidiaryId === null ||
			activeSubsidiaryId === null ||
			noticeSubsidiaryId === activeSubsidiaryId
		) {
			return { link, foreignSubsidiaryNote: null };
		}

		const subsidiaryName = visibleSubsidiaries
			?.find((subsidiary) => subsidiary.id === noticeSubsidiaryId)
			?.name?.trim();
		const subsidiaryLabel = subsidiaryName
			? `de la filial ${subsidiaryName}`
			: 'de otra filial';

		return {
			link: null,
			foreignSubsidiaryNote: `Este aviso es ${subsidiaryLabel}; cámbiala en el encabezado para ver la ficha.`,
		};
	}, [notification, activeSubsidiaryId, visibleSubsidiaries]);
};

export default useCriticalStockNoticeLink;
