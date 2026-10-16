import { productInventoryLink, type IPageLink } from '@/config/procurementLinks';
import type { UserNotificationDTO } from '@/interface/notifications.interface';

/**
 * Avisos del umbral crítico de stock (tarea 19 del backend). El texto llega
 * formateado en `message`; del aviso sólo se lee el producto para enlazar.
 */
const CRITICAL_STOCK_TYPE_KEYS: ReadonlySet<string> = new Set([
	'inventory.critical-stock-entered',
	'inventory.critical-stock-reminder',
	'inventory.critical-stock-recovered',
]);

/**
 * Ficha de inventario del producto de un aviso de stock crítico, o `null` si
 * el aviso es de otro tipo o no trae un `payload.product_id` válido. El backend
 * no serializa `entity_id`: el producto llega sólo en el `payload`. Quien
 * enlaza comprueba el `authority` de la ruta (`view-product`).
 */
const criticalStockProductLink = (
	notification: Pick<UserNotificationDTO, 'event'>,
): IPageLink | null => {
	const typeKey = notification.event?.type_key ?? '';
	if (!CRITICAL_STOCK_TYPE_KEYS.has(typeKey)) return null;

	const productId = notification.event?.payload?.product_id;
	if (typeof productId !== 'number' || !Number.isInteger(productId) || productId <= 0) {
		return null;
	}

	return productInventoryLink(productId);
};

export default criticalStockProductLink;
