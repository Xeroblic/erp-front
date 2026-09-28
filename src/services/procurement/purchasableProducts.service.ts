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

/**
 * Alta de producto en el catálogo real desde una línea de compra:
 * `POST /subsidiaries/{subsidiary}/products` (`SubsidiaryProductsController@store`),
 * la misma ruta del alta de Catálogos › Productos.
 *
 * Contrato verificado contra el backend:
 * - Exige `create-product` y que el usuario pueda gestionar la filial.
 * - `name` y `brand_id` son obligatorios; `sku` es único por filial y un
 *   choque vuelve como 422 en `sku`. No usa `Idempotency-Key`.
 * - Responde 201 con `ProductResource` envuelto en `data`.
 */
export interface IPurchasableProductCreatePayload {
	name: string;
	sku: string;
	brand_id: number;
	product_type: string;
	serial_tracking: boolean;
	is_active: boolean;
	category_ids: number[];
}

/** Producto recién creado: además de la opción, si una línea de compra lo admite. */
export interface ICreatedPurchasableProduct extends IPurchasableProduct {
	serial_tracking: boolean;
	is_active: boolean;
}

export const createPurchasableProduct = async (
	subsidiaryId: number,
	payload: IPurchasableProductCreatePayload,
): Promise<ICreatedPurchasableProduct> => {
	const response = await ApiService.fetchData<unknown, IPurchasableProductCreatePayload>({
		url: `/subsidiaries/${subsidiaryId}/products`,
		method: 'post',
		data: payload,
	});

	const body = asRecord(response.data);
	const row = asRecord(body?.data) ?? body;
	const product = toPurchasableProduct(row);
	if (!product) throw new Error('El backend no devolvió el producto creado.');

	return {
		...product,
		serial_tracking: row?.serial_tracking === true,
		is_active: row?.is_active !== false,
	};
};
