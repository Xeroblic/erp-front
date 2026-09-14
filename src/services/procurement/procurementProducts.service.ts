import {
	procurementProducts as productSeed,
	purchasableProcurementProducts as purchasableSeed,
} from '@/mocks/db/procurement.db';
import {
	clearAllPersistedMockState,
	loadAllPersistedMockStates,
	loadPersistedMockState,
	savePersistedMockState,
} from '@/services/procurement/procurementMockPersistence.util';
import { PROCUREMENT_ERROR_DEFINITIONS } from '@/utils/procurementErrors.util';
import type {
	IApiResourceEnvelope,
	IProcurementBrand,
	IProcurementCategory,
	IProcurementProduct,
} from '@/interface/procurement.interface';

/**
 * Alta local de productos para las líneas de abastecimiento (documentos de
 * compra y recepciones sin documento).
 *
 * **No es un endpoint del contrato ni crea nada en el catálogo real.** El
 * módulo de abastecimiento trabaja contra fixtures (`procurement.db`), y sus
 * servicios mock rechazan cualquier `product_id` que no esté ahí. Este store
 * suma, por filial, los productos creados desde el formulario para que se
 * puedan usar en todo el módulo mientras no exista backend.
 *
 * Replica las reglas del alta por filial (`POST /subsidiaries/{subsidiary}/products`,
 * `StoreSubsidiaryProductRequest`): nombre y marca obligatorios; SKU opcional
 * y, si se indica, único en la filial. Así, cambiar este mock por la llamada
 * real no obliga a cambiar el formulario.
 *
 * Los creados se persisten en `localStorage` (mismo helper que recepciones y
 * documentos): un documento guardado con un producto creado sigue siendo
 * válido tras recargar la pestaña.
 */

const MOCK_LATENCY_MS = 220;
const PRODUCTS_STORAGE_NAMESPACE = 'products';
const PRODUCTS_STORAGE_VERSION = 1;
/** Muy por encima de los IDs de fixtures: un producto creado nunca choca con uno sembrado. */
const FIRST_CREATED_PRODUCT_ID = 900_001;
const SKU_MAX_LENGTH = 100;

export interface IProcurementProductCreatePayload {
	name: string;
	brand: IProcurementBrand | null;
	/** `null` o vacío: producto sin SKU, permitido por filial. */
	sku: string | null;
	categories: IProcurementCategory[];
	serial_tracking: boolean;
	is_active: boolean;
}

interface IProductsState {
	products: IProcurementProduct[];
	nextId: number;
}

interface IMockWriteHeaders {
	idempotencyKey?: string;
}

const statesBySubsidiary = new Map<number, IProductsState>();
const idempotencyLog = new Map<string, { payloadHash: string; result: unknown }>();

const isProductsState = (value: unknown): value is IProductsState => {
	if (typeof value !== 'object' || value === null) return false;
	const candidate = value as Partial<IProductsState>;
	return Array.isArray(candidate.products) && Number.isInteger(candidate.nextId);
};

/** Primer acceso de una filial: hidrata lo persistido o parte vacía. */
const getState = (subsidiaryId: number): IProductsState => {
	let state = statesBySubsidiary.get(subsidiaryId);
	if (state === undefined) {
		const persisted = loadPersistedMockState<unknown>(
			PRODUCTS_STORAGE_NAMESPACE,
			PRODUCTS_STORAGE_VERSION,
			subsidiaryId,
		);
		state = isProductsState(persisted)
			? persisted
			: { products: [], nextId: FIRST_CREATED_PRODUCT_ID };
		statesBySubsidiary.set(subsidiaryId, state);
	}
	return state;
};

const delay = <T>(value: T): Promise<T> =>
	new Promise((resolve) => {
		setTimeout(() => resolve(value), MOCK_LATENCY_MS);
	});

const apiError = (status: number, data: Record<string, unknown>) => ({
	isAxiosError: true as const,
	response: { status, data },
});

const fail = (status: number, data: Record<string, unknown>): Promise<never> =>
	Promise.reject(apiError(status, data));

const fieldError = (code: string, message: string, field: string) =>
	fail(422, { message, code, errors: { [field]: [message] } });

/** Misma garantía de `Idempotency-Key` que el resto de los servicios mock del módulo. */
async function withIdempotency<T>(
	subsidiaryId: number,
	idempotencyKey: string | undefined,
	payloadForHash: unknown,
	run: () => Promise<T>,
): Promise<T> {
	if (!idempotencyKey) return run();

	const logKey = `${subsidiaryId}:${idempotencyKey}`;
	const payloadHash = JSON.stringify(payloadForHash);
	const logged = idempotencyLog.get(logKey);
	if (logged) {
		if (logged.payloadHash !== payloadHash) {
			return fail(409, {
				message: PROCUREMENT_ERROR_DEFINITIONS.IDEMPOTENCY_KEY_REUSED.fallbackMessage,
				code: 'IDEMPOTENCY_KEY_REUSED',
			});
		}
		return logged.result as T;
	}

	const result = await run();
	idempotencyLog.set(logKey, { payloadHash, result });
	return result;
}

/**
 * Productos elegibles para una línea: los no serializados de los fixtures más
 * los no serializados creados en esta filial. Sin filial sólo hay fixtures.
 */
export const listPurchasableProcurementProducts = (
	subsidiaryId: number | null,
): IProcurementProduct[] =>
	subsidiaryId === null
		? [...purchasableSeed]
		: [
				...purchasableSeed,
				...getState(subsidiaryId).products.filter((product) => !product.serial_tracking),
			];

export const findPurchasableProcurementProduct = (
	subsidiaryId: number | null,
	productId: number,
): IProcurementProduct | undefined =>
	listPurchasableProcurementProducts(subsidiaryId).find((product) => product.id === productId);

let hydratedAllSubsidiaries = false;

/** Hidrata una sola vez las filiales persistidas que todavía no pasaron por `getState`. */
const hydrateAllPersistedStates = (): void => {
	if (hydratedAllSubsidiaries) return;
	hydratedAllSubsidiaries = true;
	loadAllPersistedMockStates<unknown>(
		PRODUCTS_STORAGE_NAMESPACE,
		PRODUCTS_STORAGE_VERSION,
	).forEach(([subsidiaryId, persisted]) => {
		if (!statesBySubsidiary.has(subsidiaryId) && isProductsState(persisted))
			statesBySubsidiary.set(subsidiaryId, persisted);
	});
};

const allCreatedProducts = (): IProcurementProduct[] => {
	hydrateAllPersistedStates();
	return Array.from(statesBySubsidiary.values()).flatMap((state) => state.products);
};

/**
 * Resuelve un producto por ID —fixture o creado en cualquier filial— sin
 * conocer la filial. Lo usa el stock por ubicación, particionado por
 * sucursal: una unidad recibida de un producto creado tiene que poder
 * pintarse como fila, no descartarse por no estar en el catálogo estático.
 * Incluye serializados: decidir si se muestran es del llamador.
 */
export const findProcurementProductById = (productId: number): IProcurementProduct | undefined =>
	productSeed.find((product) => product.id === productId) ??
	allCreatedProducts().find((product) => product.id === productId);

/**
 * `true` si el SKU ya lo usa un producto de los fixtures o uno creado en esta
 * filial, sin distinguir mayúsculas. Lo usa el alta y también el generador de
 * SKU del formulario para reintentar antes de enviar.
 */
export const isProcurementProductSkuTaken = (subsidiaryId: number, sku: string): boolean => {
	const normalizedSku = sku.trim().toLocaleUpperCase('es-CL');
	if (!normalizedSku) return false;
	return [...productSeed, ...getState(subsidiaryId).products].some(
		(product) => product.sku.toLocaleUpperCase('es-CL') === normalizedSku,
	);
};

/** Etiqueta de selector: el SKU es opcional, así que sin él se muestra sólo el nombre. */
export const formatProcurementProductLabel = (product: IProcurementProduct): string =>
	product.sku ? `${product.sku} · ${product.name}` : product.name;

/** Alta local: 201 con la ficha; 422 si falta nombre o marca, o si el SKU ya existe en la filial. */
export const createProcurementProduct = (
	subsidiaryId: number,
	payload: IProcurementProductCreatePayload,
	headers: IMockWriteHeaders = {},
): Promise<IApiResourceEnvelope<IProcurementProduct>> =>
	withIdempotency(subsidiaryId, headers.idempotencyKey, { action: 'create', payload }, () => {
		const name = payload.name.trim();
		const sku = payload.sku?.trim() ?? '';
		if (!name) {
			return fieldError('PRODUCT_NAME_REQUIRED', 'Indica el nombre del producto.', 'name');
		}
		if (!payload.brand) {
			return fieldError(
				'PRODUCT_BRAND_REQUIRED',
				'Selecciona la marca del producto.',
				'brand_id',
			);
		}
		if (sku.length > SKU_MAX_LENGTH) {
			return fieldError(
				'PRODUCT_SKU_TOO_LONG',
				`El SKU admite hasta ${SKU_MAX_LENGTH} caracteres.`,
				'sku',
			);
		}

		const state = getState(subsidiaryId);
		if (sku) {
			if (isProcurementProductSkuTaken(subsidiaryId, sku)) {
				return fieldError(
					'PRODUCT_SKU_ALREADY_EXISTS',
					'Ya existe un producto con este SKU en la filial.',
					'sku',
				);
			}
		}

		// El ID es único entre filiales, no sólo dentro de ésta: el stock por
		// ubicación resuelve productos sin conocer la filial
		// (`findProcurementProductById`).
		const id = allCreatedProducts().reduce(
			(highest, created) => Math.max(highest, created.id + 1),
			state.nextId,
		);
		const product: IProcurementProduct = {
			id,
			sku,
			commercial_sku: null,
			name,
			short_description: null,
			serial_tracking: payload.serial_tracking,
			grade: null,
			currency_code: 'CLP',
			price: null,
			offer_price: null,
			// Sin base histórica demostrable: se muestra como desconocido, nunca $0.
			cost: null,
			cost_basis: 'unknown',
			brand: { ...payload.brand },
			categories: payload.categories.map((category) => ({ ...category })),
			image: null,
			is_active: payload.is_active,
		};
		const nextState: IProductsState = {
			products: [...state.products, product],
			nextId: state.nextId + 1,
		};
		statesBySubsidiary.set(subsidiaryId, nextState);
		savePersistedMockState(
			PRODUCTS_STORAGE_NAMESPACE,
			PRODUCTS_STORAGE_VERSION,
			subsidiaryId,
			nextState,
		);

		return delay({ data: { ...product } });
	});

/** Sólo para pruebas: vacía memoria, idempotencia y lo persistido. */
export const resetProcurementProductsStoreForTests = (): void => {
	statesBySubsidiary.clear();
	hydratedAllSubsidiaries = false;
	idempotencyLog.clear();
	clearAllPersistedMockState(PRODUCTS_STORAGE_NAMESPACE);
};
