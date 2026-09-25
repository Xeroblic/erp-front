import ApiService from '@/services/ApiService';

/**
 * Productos que una línea de documento de compra acepta: de la filial, no
 * serializados y activos. Lee `GET /subsidiaries/{subsidiary}/products`
 * (`SubsidiaryProductsController@index`), el catálogo real.
 *
 * Contrato verificado contra el backend:
 * - Exige `view-product`, un permiso distinto de los de documentos de compra.
 * - `q` busca por nombre, SKU o código de barras (`ILIKE`); `serial_tracking`
 *   e `is_active` se leen como booleanos; sólo devuelve productos padre.
 * - La fila es `ProductResource`, mucho más ancha que lo que el selector
 *   necesita: acá se reduce a identidad, SKU, nombre y marca.
 *
 * La regla la vuelve a validar el backend al guardar (`items.*.product_id`
 * exige filial y `serial_tracking = false`); el filtro sólo evita ofrecer lo
 * que va a ser rechazado.
 */

export interface IPurchasableProduct {
	id: number;
	sku: string | null;
	name: string;
	brand_name: string | null;
}

export interface IPurchasableProductsPage {
	data: IPurchasableProduct[];
	/** Hay más coincidencias que las devueltas: conviene afinar la búsqueda. */
	has_more: boolean;
}

export const PURCHASABLE_PRODUCTS_PER_PAGE = 20;

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;

const asText = (value: unknown): string | null =>
	typeof value === 'string' && value.trim() ? value.trim() : null;

/** Descarta filas sin id o nombre en vez de pintar una opción rota. */
const toPurchasableProduct = (row: unknown): IPurchasableProduct | null => {
	const record = asRecord(row);
	const id = record?.id;
	const name = asText(record?.name);
	if (typeof id !== 'number' || name === null) return null;

	return {
		id,
		sku: asText(record?.sku),
		name,
		brand_name: asText(asRecord(record?.brand)?.name),
	};
};

/** Etiqueta del selector: el SKU es opcional, así que sin él va sólo el nombre. */
export const formatPurchasableProductLabel = (
	product: Pick<IPurchasableProduct, 'sku' | 'name'>,
): string => (product.sku ? `${product.sku} · ${product.name}` : product.name);

export const searchPurchasableProducts = async (
	subsidiaryId: number,
	search: string,
): Promise<IPurchasableProductsPage> => {
	const term = search.trim();
	const response = await ApiService.fetchData<unknown>({
		url: `/subsidiaries/${subsidiaryId}/products`,
		method: 'get',
		params: {
			...(term ? { q: term } : {}),
			serial_tracking: false,
			is_active: true,
			order_by: 'name',
			order_dir: 'asc',
			per_page: PURCHASABLE_PRODUCTS_PER_PAGE,
		},
	});

	const body = asRecord(response.data);
	const rows = Array.isArray(body?.data) ? body.data : [];
	const meta = asRecord(body?.meta);
	const total = typeof meta?.total === 'number' ? meta.total : rows.length;

	return {
		data: rows
			.map(toPurchasableProduct)
			.filter((product): product is IPurchasableProduct => product !== null),
		has_more: total > rows.length,
	};
};
