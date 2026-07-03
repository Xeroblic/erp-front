import type { ChannelVisibility } from '@/interface/product.interface';

/**
 * Payloads para los endpoints de overrides por canal:
 *   PATCH /subsidiaries/{sid}/products/{pid}/channel-price
 *   PATCH /subsidiaries/{sid}/products/{pid}/channel-name
 *   PATCH /subsidiaries/{sid}/products/{pid}/channel-visibility
 *
 * En precio y nombre, `null` limpia el override y restaura el valor base del producto.
 */
export interface ChannelPricePayload {
	integration_id: string;
	price_override?: number | null;
	offer_price_override?: number | null;
}

export interface ChannelNamePayload {
	integration_id: string;
	name_override?: string | null;
}

export interface ChannelVisibilityPayload {
	integration_id: string;
	visibility: ChannelVisibility;
}
