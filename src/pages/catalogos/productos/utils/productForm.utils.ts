import type { IBrand } from '@/interface/brand.interface';
import type { ICategory } from '@/interface/category.interface';
import ApiService from '@/services/ApiService';
import type {
	CreateProductPayload,
	IProduct,
	IProductBrandSummary,
	ProductStatus,
	ProductType,
	UpdateProductPayload,
} from '@/interface/product.interface';
import type {
	ProductFormValues,
	ProductFormSubmitPayload,
	ProductOption,
	ProductDetailForm,
	ProductAttributesForm,
	BuildUpdatePayloadOptions,
} from '../types/products.types';
import type { AttributesJson } from '../types/attributes.types';
import { PRODUCT_DRAFT_CATEGORY_SLUG, PRODUCT_TYPE_LABELS } from '../constants/products.constant';
import { areAttributeRecordsEqual, prepareAttributesForSubmit } from './dynamicAttributes.utils';

const toOption = (value: number | string, label: string): ProductOption => ({
	value: String(value),
	label,
});

type BrandOptionSource = Pick<IBrand, 'id' | 'name'> | IProductBrandSummary;

export const createBrandOptions = (brands: BrandOptionSource[]): ProductOption[] =>
	brands.map((brand) => toOption(brand.id, brand.name));

export const createCategoryOptions = (categories: ICategory[]): ProductOption[] =>
	categories.map((category) => toOption(category.id, category.name));

export const buildInitialValues = (product?: IProduct | null): ProductFormValues => ({
	sku: product?.sku ?? '',
	name: product?.name ?? '',
	brand_id: product?.brand_id ? String(product.brand_id) : '',
	branch_id: null, // Siempre null en valores iniciales, solo se usa en crear
	price: product?.price ? String(product.price) : '',
	cost: product?.cost ? String(product.cost) : '',
	offer_price: product?.offer_price ? String(product.offer_price) : '',
	product_type: product?.product_type ?? '',
	condition_policy: product?.condition_policy ?? '',
	uom: product?.uom ?? '',
	warranty_months: product?.warranty_months ? String(product.warranty_months) : '',
	serial_tracking: product?.serial_tracking ?? false,
	is_active: product?.is_active ?? true,
	categories: product?.categories?.map((category) => toOption(category.id, category.name)) ?? [],
	attributes_json: (product?.attributes_json as AttributesJson) ?? null,
	commercial_sku: product?.commercial_sku ?? '',
	barcode: product?.barcode ?? '',
});

export const buildSubmitPayload = (values: ProductFormValues): ProductFormSubmitPayload => {
	const categoryIds = values.categories.map((category) => Number(category.value));

	// Solo incluir campos que tienen valor (no enviar undefined/null para no sobrescribir)
	const data: Partial<IProduct> = {};

	// Campos siempre presentes
	if (values.sku?.trim()) data.sku = values.sku.trim();
	if (values.name?.trim()) data.name = values.name.trim();

	// Brand ID
	if (values.brand_id) data.brand_id = Number(values.brand_id);

	// Números: solo enviar si tienen valor
	if (values.price !== '' && values.price !== undefined && values.price !== null) {
		data.price = Number(values.price);
	}
	if (values.cost !== '' && values.cost !== undefined && values.cost !== null) {
		data.cost = Number(values.cost);
	}
	if (
		values.offer_price !== '' &&
		values.offer_price !== undefined &&
		values.offer_price !== null
	) {
		data.offer_price = Number(values.offer_price);
	}
	if (
		values.warranty_months !== '' &&
		values.warranty_months !== undefined &&
		values.warranty_months !== null
	) {
		data.warranty_months = Number(values.warranty_months);
	}

	// Strings opcionales
	if (values.product_type) data.product_type = values.product_type;
	if (values.condition_policy) data.condition_policy = values.condition_policy;
	if (values.uom) data.uom = values.uom;
	if (values.commercial_sku?.trim()) data.commercial_sku = values.commercial_sku.trim();
	if (values.barcode?.trim()) data.barcode = values.barcode.trim();

	// Booleanos: siempre enviar
	data.serial_tracking = Boolean(values.serial_tracking);
	data.is_active = Boolean(values.is_active);

	return { data, categoryIds };
};

const parseNumberOrNull = (value: number | string | '' | null | undefined): number | undefined => {
	if (value === '' || value === null || value === undefined) return undefined;
	const parsed = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

const normaliseString = (value: string | null | undefined): string => (value ?? '').trim();

const extractCategoryIds = (product: IProduct | null | undefined): number[] =>
	product?.categories?.map((category) => category.id) ?? [];

const isEqualArray = (current: number[], previous: number[]): boolean => {
	if (current.length !== previous.length) return false;
	return current.every((value) => previous.includes(value));
};

export const mapProductToDetailForm = (product: IProduct): ProductDetailForm => {
	const brandId = product.brand?.id ?? product.brand_id ?? '';

	return {
		sku: product.sku ?? '',
		name: product.name ?? '',
		brand_id: brandId,
		product_type: (product.product_type as ProductType) ?? 'desktop_pc',
		serial_tracking: Boolean(product.serial_tracking),
		is_active: Boolean(product.is_active),
		category_ids: extractCategoryIds(product),
		price: typeof product.price === 'number' ? product.price : '',
		offer_price: parseNumberOrNull(product.offer_price) ?? '',
		cost: parseNumberOrNull(product.cost) ?? '',
		warranty_months: parseNumberOrNull(product.warranty_months) ?? '',
		stock: typeof product.stock === 'number' ? product.stock : '',
		snippet_description: product.snippet_description ?? '',
		short_description: product.short_description ?? '',
		long_description: product.long_description ?? '',
		product_status: product.product_status ?? 'pending',
		attributes_json: (product.attributes_json as ProductAttributesForm) ?? null,
	};
};

export const buildDetailUpdatePayload = (
	product: IProduct,
	form: ProductDetailForm,
	options: BuildUpdatePayloadOptions = {},
): Partial<UpdateProductPayload> => {
	const payload: Partial<UpdateProductPayload> = {};
	const { includeDescriptions = true, includeAttributes = true } = options;

	if (normaliseString(form.sku) !== product.sku) payload.sku = normaliseString(form.sku);
	if (normaliseString(form.name) !== product.name) payload.name = normaliseString(form.name);

	const currentBrandId = product.brand?.id ?? product.brand_id ?? '';
	if (Number(form.brand_id || 0) !== Number(currentBrandId || 0)) {
		payload.brand_id = Number(form.brand_id);
	}

	if ((form.product_type ?? 'desktop_pc') !== (product.product_type ?? 'desktop_pc'))
		payload.product_type = form.product_type;
	if (form.serial_tracking !== product.serial_tracking)
		payload.serial_tracking = form.serial_tracking;
	if (form.is_active !== product.is_active) payload.is_active = form.is_active;

	const nextPrice = parseNumberOrNull(form.price);
	if (parseNumberOrNull(product.price) !== nextPrice && typeof nextPrice === 'number') {
		payload.price = nextPrice;
	}
	const currentPriceSnapshot = parseNumberOrNull(product.price);

	const nextOffer = parseNumberOrNull(form.offer_price);
	if (parseNumberOrNull(product.offer_price) !== nextOffer) {
		payload.offer_price = nextOffer ?? null;
		if (payload.price === undefined && typeof currentPriceSnapshot === 'number') {
			payload.price = currentPriceSnapshot;
		}
	}
	const nextCost = parseNumberOrNull(form.cost);
	if (parseNumberOrNull(product.cost) !== nextCost) {
		payload.cost = nextCost ?? null;
	}
	const nextWarranty = parseNumberOrNull(form.warranty_months);
	if (parseNumberOrNull(product.warranty_months) !== nextWarranty) {
		payload.warranty_months = nextWarranty ?? null;
	}

	// Stock: siempre debe ser un número válido
	const nextStock = parseNumberOrNull(form.stock);
	const currentStock = parseNumberOrNull(product.stock);

	// Solo agregar al payload si hay un cambio Y el nuevo valor es un número válido
	if (currentStock !== nextStock && typeof nextStock === 'number') {
		payload.stock = nextStock;
	}

	if (includeDescriptions) {
		if (
			normaliseString(form.snippet_description) !==
			normaliseString(product.snippet_description ?? '')
		) {
			payload.snippet_description = normaliseString(form.snippet_description);
		}
		if (
			normaliseString(form.short_description) !==
			normaliseString(product.short_description ?? '')
		) {
			payload.short_description = normaliseString(form.short_description);
		}
		if (
			normaliseString(form.long_description) !==
			normaliseString(product.long_description ?? '')
		) {
			payload.long_description = normaliseString(form.long_description);
		}
	}

	if (!isEqualArray(form.category_ids, extractCategoryIds(product))) {
		payload.category_ids = form.category_ids;
	}

	if (form.product_status !== product.product_status) {
		payload.product_status = form.product_status;
	}

	if (includeAttributes) {
		const nextAttributes = prepareAttributesForSubmit(form.attributes_json, true);
		const previousAttributes = prepareAttributesForSubmit(product.attributes_json, false);

		if (!areAttributeRecordsEqual(nextAttributes, previousAttributes)) {
			payload.attributes_json = nextAttributes;
		}
	}

	return payload;
};

export const deriveDefaultCategoryId = (
	categories: ICategory[],
	draftSlug = PRODUCT_DRAFT_CATEGORY_SLUG,
): number | null => {
	const draftCategory = categories.find(
		(category) => category.slug === draftSlug || category.name.toLowerCase() === draftSlug,
	);
	return draftCategory ? draftCategory.id : null;
};

export const collectValidationErrors = (error: unknown): string[] => {
	if (!error || typeof error !== 'object') return ['Ha ocurrido un error inesperado.'];
	const errorRecord = error as Record<string, unknown>;
	if (Array.isArray(errorRecord.inner)) {
		const inner = errorRecord.inner as Array<{ errors?: unknown }>;
		return inner.flatMap((item) => (item.errors as string[]) ?? []).filter(Boolean);
	}
	if (Array.isArray(errorRecord.errors)) {
		return (errorRecord.errors as unknown[]).filter(
			(msg): msg is string => typeof msg === 'string' && msg.length > 0,
		);
	}
	if (typeof errorRecord.message === 'string') {
		return [errorRecord.message];
	}
	return ['Ha ocurrido un error inesperado.'];
};

/**
 * Inicializa attributes_json basado en el product_type seleccionado
 * @param productType - El tipo de dispositivo seleccionado
 * @returns El objeto attributes_json inicial o null si es 'general'
 */
export const initializeAttributesJson = (productType: string): Record<string, unknown> | null => {
	if (!productType || productType === 'general') {
		return null;
	}

	const productKindMap: Record<string, string> = {
		notebook: 'notebook',
		desktop_pc: 'desktop_pc',
		aio: 'aio',
		monitor: 'monitor',
		docking: 'docking',
	};

	const productKind = productKindMap[productType];

	if (!productKind) {
		return null;
	}

	// Solo retornar el product_kind, el resto se inicializará al editar
	return {
		product_kind: productKind,
	};
};

/**
 * Parámetros para la generación inteligente de SKU.
 * Usa todos los campos relevantes del formulario para producir un código único y significativo.
 */
export interface SmartSKUParams {
	name: string;
	brandName: string;
	productType: string;
}

/** Mapa de abreviaciones para tipos de dispositivo */
const DEVICE_TYPE_CODES: Record<string, string> = {
	notebook: 'NB',
	desktop_pc: 'DK',
	aio: 'AI',
	monitor: 'MN',
	docking: 'DC',
	general: 'GN',
};

/** Abreviaciones conocidas de marcas comunes para SKUs más legibles */
const KNOWN_BRAND_CODES: Record<string, string> = {
	DELL: 'DL',
	HP: 'HP',
	LENOVO: 'LN',
	ASUS: 'AS',
	ACER: 'AC',
	APPLE: 'AP',
	SAMSUNG: 'SM',
	LG: 'LG',
	TOSHIBA: 'TB',
	MSI: 'MS',
	SONY: 'SN',
	FUJITSU: 'FJ',
	HUAWEI: 'HW',
	MICROSOFT: 'MF',
	SCORE: 'SC',
	NC: 'NC',
};

/**
 * Genera un sufijo aleatorio alfanumérico de la longitud especificada.
 * Usa caracteres que no se confunden entre sí (sin I/O/0/1).
 */
const randomAlphaNum = (length: number): string => {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};

/**
 * Extrae un código de modelo significativo del nombre del producto.
 *
 * Estrategia:
 * 1. Buscar tokens alfanuméricos que contengan números (ej: "5320", "T480", "I5")
 * 2. Concatenar los más relevantes (hasta 6 chars)
 * 3. Si no hay números, tomar la primera palabra significativa
 *
 * Ejemplos:
 *   "Latitude 5320 - I5 1145G7"  → "5320I5"
 *   "ThinkPad T480"              → "T480"
 *   "ProDesk 400 G6"             → "400G6"
 *   "OptiPlex 3080 SFF"          → "3080"
 *   "Monitor LG 24MK430"         → "24MK43"
 */
const extractModelCode = (productName: string): string => {
	const normalized = (productName || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toUpperCase();

	// Separar en tokens por espacios, guiones, barras
	const tokens = normalized.split(/[\s\-\/,]+/).filter(Boolean);

	// Filtrar tokens que contienen al menos un dígito (son identificadores de modelo)
	const modelTokens = tokens.filter((t) => /\d/.test(t));

	if (modelTokens.length > 0) {
		// Concatenar tokens de modelo, limitando a 6 caracteres
		const joined = modelTokens.map((t) => t.replace(/[^A-Z0-9]/g, '')).join('');
		return joined.substring(0, 6);
	}

	// Sin números: tomar la primera palabra significativa (> 2 chars, no genérica)
	const skipWords = new Set([
		'REACONDICIONADO',
		'REACOND',
		'USADO',
		'NUEVO',
		'EQUIPO',
		'COMPUTADOR',
		'COMPUTADORA',
		'PORTATIL',
		'LAPTOP',
		'DESKTOP',
		'NOTEBOOK',
		'MONITOR',
		'DOCKING',
		'ALL',
		'ONE',
	]);

	const meaningfulToken = tokens.find((t) => t.length > 2 && !skipWords.has(t));

	if (meaningfulToken) {
		return meaningfulToken.replace(/[^A-Z0-9]/g, '').substring(0, 6);
	}

	// Fallback: primeros 4 chars del nombre limpio
	return normalized.replace(/[^A-Z0-9]/g, '').substring(0, 4) || 'PROD';
};

/**
 * Genera un SKU inteligente basado en múltiples campos del producto.
 *
 * Formato: [MARCA+TIPO]-[MODELO]-[SUFIJO]
 * - MARCA+TIPO: 4 chars pegados (ej: DLNB = Dell Notebook)
 * - MODELO: hasta 4 chars (extraído inteligentemente del nombre)
 * - SUFIJO: 3 chars alfanuméricos aleatorios (para evitar colisiones)
 *
 * Ejemplos reales:
 *   Dell Notebook "Latitude 5320 - I5 1145G7"  → DLNB-5320-A7K
 *   HP Desktop "ProDesk 400 G6"                 → HPDK-400G-B3M
 *   Lenovo Notebook "ThinkPad T480"             → LNNB-T480-C5N
 *   LG Monitor "24MK430H"                      → LGMN-24MK-D2P
 */
export const generateSmartSKU = (
	nameOrParams: string | SmartSKUParams,
	brandNameLegacy?: string,
): string => {
	let name: string;
	let brandName: string;
	let productType: string;

	if (typeof nameOrParams === 'object') {
		name = nameOrParams.name;
		brandName = nameOrParams.brandName;
		productType = nameOrParams.productType;
	} else {
		name = nameOrParams;
		brandName = brandNameLegacy || '';
		productType = '';
	}

	const brandUpper = (brandName || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z0-9]/g, '')
		.toUpperCase();

	// 1. Código de marca (2 chars) — usar tabla conocida o primeras 2 letras
	const brandCode =
		KNOWN_BRAND_CODES[brandUpper] ??
		(brandUpper.length >= 2 ? brandUpper.substring(0, 2) : brandUpper.padEnd(2, 'X'));

	// 2. Código de tipo de dispositivo (2 chars)
	const typeCode = DEVICE_TYPE_CODES[productType] || 'GN';

	// 3. Código de modelo (hasta 4 chars, extraído del nombre)
	const modelCode = extractModelCode(name).substring(0, 4);

	// 4. Sufijo aleatorio (3 chars para diferenciar productos similares)
	const suffix = randomAlphaNum(3);

	return `${brandCode}${typeCode}-${modelCode}-${suffix}`;
};

/**
 * Verifica si un SKU ya existe en el sistema consultando el endpoint de productos.
 * Hace un GET liviano con búsqueda por SKU exacto.
 *
 * @param sku - El SKU a verificar
 * @param entityParam - 'branches' o 'subsidiaries'
 * @param entityId - ID de la entidad
 * @returns true si el SKU ya existe
 */
export const checkSkuExists = async (
	sku: string,
	entityParam: string,
	entityId: number,
): Promise<boolean> => {
	try {
		const response = await ApiService.fetchData<{
			data: Array<{ sku: string }>;
			meta?: { total: number };
		}>({
			url: `/${entityParam}/${entityId}/products`,
			method: 'get',
			params: {
				search: sku,
				per_page: 5,
				fields: 'sku',
			},
		});

		const items = Array.isArray(response.data?.data)
			? response.data.data
			: Array.isArray(response.data)
				? (response.data as unknown as Array<{ sku: string }>)
				: [];

		// Verificar coincidencia exacta (insensible a mayúsculas)
		return items.some((item) => item.sku?.toUpperCase().trim() === sku.toUpperCase().trim());
	} catch {
		// En caso de error de red, retornar false para no bloquear al usuario
		console.warn('[SKU Check] No se pudo verificar la existencia del SKU:', sku);
		return false;
	}
};

/**
 * Genera un SKU único verificado contra el sistema.
 * Reintenta hasta 5 veces si detecta colisión.
 *
 * @param params - Parámetros para generar el SKU
 * @param entityParam - 'branches' o 'subsidiaries'
 * @param entityId - ID de la entidad
 * @returns Un SKU único verificado
 */
export const generateUniqueSmartSKU = async (
	params: SmartSKUParams,
	entityParam: string,
	entityId: number,
): Promise<string> => {
	const MAX_RETRIES = 5;

	for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
		const sku = generateSmartSKU(params);
		const exists = await checkSkuExists(sku, entityParam, entityId);
		if (!exists) return sku;
	}

	// Fallback: agregar timestamp parcial para garantizar unicidad
	const fallbackSku = generateSmartSKU(params);
	const timestamp = Date.now().toString(36).slice(-3).toUpperCase();
	return `${fallbackSku}${timestamp}`;
};
