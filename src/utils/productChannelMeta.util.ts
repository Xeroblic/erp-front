/**
 * Lee de forma segura los overrides por canal de un producto (`channel_prices`),
 * uno por integración/marketplace. Es tolerante ante campos ausentes: el backend
 * puede no entregar todavía `name_override`/`visibility` en cada fila.
 */

import type { ChannelVisibility, ProductChannelPrice } from '@/interface/product.interface';

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;

const toStr = (value: unknown): string | null =>
	typeof value === 'string' && value.trim() !== '' ? value : null;

const toDecimal = (value: unknown): string | null => {
	if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null;
	return toStr(value);
};

const toVisibility = (value: unknown): ChannelVisibility | null =>
	value === 'publish' || value === 'private' ? value : null;

const parseChannelPrice = (record: Record<string, unknown>): ProductChannelPrice | null => {
	const integrationId = toStr(record.integration_id);
	if (!integrationId) return null;
	return {
		integration_id: integrationId,
		channel: toStr(record.channel),
		channel_name: toStr(record.channel_name),
		name_override: toStr(record.name_override),
		visibility: toVisibility(record.visibility ?? record.visibility_override),
		visibility_override: toVisibility(record.visibility_override),
		effective_visibility: toVisibility(record.effective_visibility),
		price_override: toDecimal(record.price_override),
		offer_price_override: toDecimal(record.offer_price_override),
		effective_price: toDecimal(record.effective_price),
		effective_offer_price: toDecimal(record.effective_offer_price),
	};
};

/** Extrae los overrides por canal del producto. Devuelve `[]` si no hay ninguno. */
export const parseChannelPrices = (raw: unknown): ProductChannelPrice[] => {
	if (!Array.isArray(raw)) return [];
	const result: ProductChannelPrice[] = [];
	for (const item of raw) {
		const record = asRecord(item);
		if (!record) continue;
		const parsed = parseChannelPrice(record);
		if (parsed) result.push(parsed);
	}
	return result;
};

/** Override de una integración concreta (o `null` si el canal no tiene overrides). */
export const getChannelPriceForIntegration = (
	raw: unknown,
	integrationId: string | null | undefined,
): ProductChannelPrice | null => {
	if (!integrationId) return null;
	return parseChannelPrices(raw).find((c) => c.integration_id === integrationId) ?? null;
};
