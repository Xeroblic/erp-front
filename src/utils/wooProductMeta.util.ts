/**
 * Lee de forma segura el bloque `woocommerce` de `marketplace_external_ids`
 * de un producto. Es el flag autoritativo de "está sincronizado con WooCommerce"
 * (lo escribe el backend al publicar y lo borra al despublicar).
 */

export interface WooProductMeta {
	externalProductId: number | null;
	publishedAt: string | null;
	lastErrorMsg: string | null;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;

export const getWooProductMeta = (marketplaceExternalIds: unknown): WooProductMeta | null => {
	const woo = asRecord(asRecord(marketplaceExternalIds)?.woocommerce);
	if (!woo) return null;

	const rawId = woo.external_product_id;
	const parsedId =
		typeof rawId === 'number'
			? rawId
			: typeof rawId === 'string' && rawId.trim() !== ''
				? Number(rawId)
				: null;

	return {
		externalProductId: parsedId !== null && Number.isFinite(parsedId) ? parsedId : null,
		publishedAt: typeof woo.published_at === 'string' ? woo.published_at : null,
		lastErrorMsg: typeof woo.last_error_msg === 'string' ? woo.last_error_msg : null,
	};
};

/** ¿El producto está vinculado/publicado en WooCommerce? */
export const isWooSynced = (marketplaceExternalIds: unknown): boolean =>
	getWooProductMeta(marketplaceExternalIds)?.externalProductId != null;
