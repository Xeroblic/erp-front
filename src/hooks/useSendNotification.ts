import { useCallback } from 'react';
import ApiService from '@/services/ApiService';

/**
 * Hook para disparar notificaciones automáticas según el scope y tipo.
 * - Si solo se pasa company_id, la notificación es global (admins y usuarios globales).
 * - Si se pasa branch_id/subsidiary_id, la notificación es local (solo usuarios con acceso).
 * - El backend distribuye según roles y acceso.
 */
interface SendNotificationParams {
	type_key: string;
	payload: Record<string, unknown>;
	company_id?: number;
	subsidiary_id?: number;
	branch_id?: number;
}

export function useSendNotification() {
	/**
	 * Dispara una notificación
	 */
	const sendNotification = useCallback(
		async ({
			type_key,
			payload,
			company_id = 1,
			subsidiary_id,
			branch_id,
		}: SendNotificationParams) => {
			await ApiService.fetchData({
				url: '/events/test',
				method: 'post',
				data: {
					type_key,
					company_id,
					subsidiary_id: subsidiary_id ?? undefined,
					branch_id: branch_id ?? undefined,
					payload: payload ?? {},
				},
			});
		},
		[],
	);

	return sendNotification;
}
