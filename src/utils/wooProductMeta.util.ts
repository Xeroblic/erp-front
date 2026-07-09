/**
 * Lee de forma segura los vínculos WooCommerce de `marketplace_external_ids`
 * de un producto. Es el flag autoritativo de "está sincronizado con WooCommerce"
 * (lo escribe el backend al publicar y lo borra al despublicar).
 *
 * Soporta multi-tienda: un producto puede estar publicado/vinculado en varias
 * integraciones WooCommerce a la vez. El lector es defensivo ante los distintos
 * formatos que puede entregar el backend:
 *
 *   1. Legacy (1 sola tienda):
 *      { "woocommerce": { external_product_id, integration_id, ... } }
 *
 *   2. Multi keyed por integration_id bajo `woocommerce`:
 *      { "woocommerce": { "<int_id>": { external_product_id, ... }, ... } }
 *
 *   3. Multi keyed por integration_id en la raíz:
 *      { "<int_id>": { external_product_id, integration_id, ... }, ... }
 *
 *   4. Array de vínculos:
 *      { "woocommerce": [ { external_product_id, integration_id, ... }, ... ] }
 */

export interface WooProductLink {
	/** Integración (tienda) a la que pertenece el vínculo. */
	integrationId: string | null;
	externalProductId: number | null;
	externalVariationId: number | null;
	publishedAt: string | null;
	lastSyncedAt: string | null;
	lastErrorAt: string | null;
	lastErrorMsg: string | null;
}

/** @deprecated Usa `WooProductLink` (multi-tienda). Mantiene la forma legacy. */
export interface WooProductMeta {
	externalProductId: number | null;
	publishedAt: string | null;
	lastErrorMsg: string | null;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;

const toNumber = (value: unknown): number | null => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	if (typeof value === 'string' && value.trim() !== '') {
		const n = Number(value);
		return Number.isFinite(n) ? n : null;
	}
	return null;
};

const toStr = (value: unknown): string | null =>
	typeof value === 'string' && value.trim() !== '' ? value : null;

/** ¿El objeto parece un vínculo (tiene external_product_id)? */
const looksLikeLink = (record: Record<string, unknown>): boolean =>
	'external_product_id' in record ||
	'integration_id' in record ||
	'integration_hint' in record ||
	'published_at' in record;

// El backend identifica la integración del vínculo con `integration_hint`
// (UUID de la integración). Se acepta `integration_id` por compatibilidad futura.
const parseLink = (record: Record<string, unknown>, fallbackIntegrationId?: string): WooProductLink => ({
	integrationId:
		toStr(record.integration_id) ??
		toStr(record.integration_hint) ??
		fallbackIntegrationId ??
		null,
	externalProductId: toNumber(record.external_product_id),
	externalVariationId: toNumber(record.external_variation_id),
	publishedAt: toStr(record.published_at),
	lastSyncedAt: toStr(record.last_synced_at) ?? toStr(record.last_seen_at),
	lastErrorAt: toStr(record.last_error_at),
	lastErrorMsg: toStr(record.last_error_msg),
});

/**
 * Extrae todos los vínculos WooCommerce del producto, uno por tienda.
 * Devuelve `[]` si no hay ninguno.
 */
export const getWooProductLinks = (marketplaceExternalIds: unknown): WooProductLink[] => {
	const root = asRecord(marketplaceExternalIds);
	if (!root) return [];

	const links: WooProductLink[] = [];

	const collectFrom = (value: unknown, keyAsIntegrationId?: string) => {
		// Array de vínculos
		if (Array.isArray(value)) {
			for (const item of value) {
				const rec = asRecord(item);
				if (rec) links.push(parseLink(rec));
			}
			return;
		}

		const rec = asRecord(value);
		if (!rec) return;

		// Vínculo directo
		if (looksLikeLink(rec)) {
			links.push(parseLink(rec, keyAsIntegrationId));
			return;
		}

		// Objeto keyed por integration_id → cada valor es un vínculo
		for (const [key, nested] of Object.entries(rec)) {
			const nestedRec = asRecord(nested);
			if (nestedRec && looksLikeLink(nestedRec)) {
				links.push(parseLink(nestedRec, key));
			}
		}
	};

	// Formato 1, 2 y 4: bajo la clave `woocommerce`
	if ('woocommerce' in root) {
		collectFrom(root.woocommerce);
	} else {
		// Formato 3: keyed por integration_id en la raíz
		collectFrom(root);
	}

	// Solo vínculos reales (con id externo)
	return links.filter((l) => l.externalProductId != null);
};

/**
 * Lee el primer/único vínculo WooCommerce (forma legacy).
 * @deprecated Para multi-tienda usa `getWooProductLinks`.
 */
export const getWooProductMeta = (marketplaceExternalIds: unknown): WooProductMeta | null => {
	const links = getWooProductLinks(marketplaceExternalIds);
	if (links.length === 0) return null;
	const first = links[0];
	return {
		externalProductId: first.externalProductId,
		publishedAt: first.publishedAt,
		lastErrorMsg: first.lastErrorMsg,
	};
};

/** ¿El producto está vinculado/publicado en al menos una tienda WooCommerce? */
export const isWooSynced = (marketplaceExternalIds: unknown): boolean =>
	getWooProductLinks(marketplaceExternalIds).length > 0;

/** Vínculo de una integración concreta (o `null` si el producto no está en ella). */
export const getWooLinkForIntegration = (
	marketplaceExternalIds: unknown,
	integrationId: string | null | undefined,
): WooProductLink | null => {
	if (!integrationId) return null;
	return (
		getWooProductLinks(marketplaceExternalIds).find((l) => l.integrationId === integrationId) ??
		null
	);
};
