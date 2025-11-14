import { useCallback } from 'react';
import ApiService from '@/services/ApiService';

/**
 * Hook para disparar notificaciones automáticas según el scope y tipo.
 * - Si solo se pasa company_id, la notificación es global (admins y usuarios globales).
 * - Si se pasa branch_id/subsidiary_id, la notificación es local (solo usuarios con acceso).
 * - El backend distribuye según roles y acceso.
 */
export function useSendNotification() {
    /**
     * Dispara una notificación
     * @param {Object} params
     * @param {string} params.type_key - Tipo de evento (ej: 'product.updated')
     * @param {Object} params.payload - Datos contextuales del evento
     * @param {number} params.company_id - ID de la empresa (requerido)
     * @param {number} [params.subsidiary_id] - ID de la subsidiaria (opcional)
     * @param {number} [params.branch_id] - ID de la sucursal (opcional)
     */
  const sendNotification = useCallback(async ({ type_key, payload, company_id = 1, subsidiary_id, branch_id }) => {
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
  }, []);

    return sendNotification;
}
