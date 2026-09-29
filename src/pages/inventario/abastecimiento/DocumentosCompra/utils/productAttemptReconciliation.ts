import {
	createPurchasableProduct,
	findPurchasableProductBySku,
} from '@/services/procurement/purchasableProducts.service';
import { resolveProcurementError } from '@/utils/procurementErrors.util';
import type { IProcurementResolvedError } from '@/utils/procurementErrors.util';
import type {
	ICreatedPurchasableProduct,
	IPendingProductAttempt,
	IPurchasableProductCreatePayload,
} from '@/services/procurement/purchasableProducts.service';

/**
 * Conciliación de un alta de producto cuyo resultado no se supo (red, timeout
 * o 5xx). El alta (`POST /subsidiaries/{s}/products`) no admite
 * `Idempotency-Key`, así que el frontend tiene que averiguar si el primer
 * `POST` llegó a crear el producto antes de arriesgar otro.
 *
 * Se trabaja siempre sobre el intento original —su filial y su payload,
 * SKU incluido—, nunca sobre lo que el formulario tenga ahora.
 *
 * Encontrar el SKU no basta: el generador usa un sufijo aleatorio corto y el
 * SKU pudo pertenecer ya a otro producto (la respuesta perdida pudo ser un
 * 422 por SKU ocupado). Un producto con ese SKU sólo se entrega si coincide
 * con el payload del intento (nombre, marca, tipo, serie, estado y
 * categorías). Si no coincide, el SKU es de otro producto y, como es único en
 * la filial, el intento no creó nada. Si no se puede leer, sigue incierto.
 *
 * 1. Se busca el SKU (exige `view-product`; sin ese permiso se salta).
 * 2. Si no aparece, se reenvía el mismo payload con el mismo SKU:
 *    - 201: se creó ahora.
 *    - 422 en `sku`: el SKU está ocupado, por este intento o por otro
 *      producto. Nunca se regenera acá: se vuelve a buscar y se compara.
 *    - 422 sin error de `sku`: el SKU estaba libre, así que nada se creó.
 *    - otro fallo incierto: sigue pendiente.
 */

export type TProductAttemptOutcome =
	| { kind: 'found'; product: ICreatedPurchasableProduct }
	| { kind: 'created'; product: ICreatedPurchasableProduct }
	/** El SKU es de otro producto: el intento no creó nada y necesita otro SKU. */
	| { kind: 'sku_collision' }
	/** Rechazo definitivo sin error de `sku`: nada se creó. */
	| { kind: 'not_created'; error: IProcurementResolvedError }
	| { kind: 'still_uncertain'; message: string };

const FORBIDDEN_STATUS = 403;
const VALIDATION_STATUS = 422;
const SERVER_ERROR_STATUS = 500;

const LOOKUP_FAILED_MESSAGE =
	'No se pudo comprobar si el producto ya se había creado. Vuelve a intentarlo.';
const UNREADABLE_MESSAGE =
	'El SKU ya está ocupado y, sin permiso para ver productos, no se puede comprobar si es el que se intentó crear. Pide a alguien con ese permiso que lo revise en el catálogo.';
const STILL_UNCERTAIN_MESSAGE =
	'Sigue sin poder confirmarse si el producto se creó. Vuelve a intentarlo.';

/** Un fallo sin respuesta o 5xx no dice si el `POST` llegó a crear el producto. */
export const isUncertainCreateOutcome = (status: number | null): boolean =>
	status === null || status >= SERVER_ERROR_STATUS;

export const isSkuTakenError = (error: IProcurementResolvedError): boolean =>
	error.status === VALIDATION_STATUS && Boolean(error.fieldErrors?.sku);

const sameIds = (left: number[], right: number[]): boolean => {
	if (left.length !== right.length) return false;
	const sortedRight = [...right].sort((a, b) => a - b);
	return [...left].sort((a, b) => a - b).every((id, index) => id === sortedRight[index]);
};

/** El producto encontrado es el que habría creado este intento. */
export const matchesProductAttempt = (
	product: ICreatedPurchasableProduct,
	payload: IPurchasableProductCreatePayload,
): boolean =>
	product.sku === payload.sku &&
	product.name === payload.name &&
	product.brand_id === payload.brand_id &&
	product.product_type === payload.product_type &&
	product.serial_tracking === payload.serial_tracking &&
	product.is_active === payload.is_active &&
	sameIds(product.category_ids, payload.category_ids);

type TLookup =
	| { kind: 'found'; product: ICreatedPurchasableProduct }
	| { kind: 'other_product' }
	| { kind: 'absent' }
	| { kind: 'forbidden' }
	| { kind: 'failed' };

const lookUp = async (attempt: IPendingProductAttempt): Promise<TLookup> => {
	try {
		const product = await findPurchasableProductBySku(
			attempt.subsidiaryId,
			attempt.payload.sku,
		);
		if (!product) return { kind: 'absent' };
		return matchesProductAttempt(product, attempt.payload)
			? { kind: 'found', product }
			: { kind: 'other_product' };
	} catch (error: unknown) {
		return resolveProcurementError(error).status === FORBIDDEN_STATUS
			? { kind: 'forbidden' }
			: { kind: 'failed' };
	}
};

/** Tras un 422 en `sku` el SKU está ocupado: hay que leer de quién es. */
const afterSkuTaken = async (
	attempt: IPendingProductAttempt,
	canLookUp: boolean,
): Promise<TProductAttemptOutcome> => {
	if (!canLookUp) return { kind: 'still_uncertain', message: UNREADABLE_MESSAGE };
	const lookup = await lookUp(attempt);
	if (lookup.kind === 'found') return lookup;
	if (lookup.kind === 'other_product') return { kind: 'sku_collision' };
	if (lookup.kind === 'forbidden') {
		return { kind: 'still_uncertain', message: UNREADABLE_MESSAGE };
	}
	return { kind: 'still_uncertain', message: LOOKUP_FAILED_MESSAGE };
};

export const reconcileProductAttempt = async (
	attempt: IPendingProductAttempt,
): Promise<TProductAttemptOutcome> => {
	const lookup = await lookUp(attempt);
	if (lookup.kind === 'found') return lookup;
	if (lookup.kind === 'other_product') return { kind: 'sku_collision' };
	if (lookup.kind === 'failed') {
		return { kind: 'still_uncertain', message: LOOKUP_FAILED_MESSAGE };
	}
	const canLookUp = lookup.kind !== 'forbidden';

	try {
		const product = await createPurchasableProduct(attempt.subsidiaryId, attempt.payload);
		return { kind: 'created', product };
	} catch (error: unknown) {
		const resolved = resolveProcurementError(error, 'No se pudo crear el producto.');
		if (isUncertainCreateOutcome(resolved.status)) {
			return { kind: 'still_uncertain', message: STILL_UNCERTAIN_MESSAGE };
		}
		if (isSkuTakenError(resolved)) return afterSkuTaken(attempt, canLookUp);
		return { kind: 'not_created', error: resolved };
	}
};
