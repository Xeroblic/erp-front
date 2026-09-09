import { procurementSuppliers as supplierSeed } from '@/mocks/db/procurement.db';
import { PROCUREMENT_ERROR_DEFINITIONS } from '@/utils/procurementErrors.util';
import { normalizePageParams } from '@/utils/procurementPagination.util';
import { formatRut, validateRut } from '@/utils/validateRut';
import type {
	IApiCollectionEnvelope,
	IApiResourceEnvelope,
	IProcurementSupplier,
	IProcurementSupplierListParams,
	IProcurementSupplierListRow,
	IProcurementSupplierPayload,
} from '@/interface/procurement.interface';

/**
 * Servicio mock del maestro de proveedores — sección 5 del contrato de
 * abastecimiento (`frontend-guide.md`, PR #67 del backend, rama
 * `docs/procurement-stock-receipts`).
 *
 * **Ningún endpoint de `/api/subsidiaries/{subsidiary}/procurement/suppliers`
 * existe todavía.** Este módulo simula esas seis rutas contra un store en
 * memoria, con la misma forma de éxito y de error que tendrá la llamada
 * real — mismo envoltorio `{data}`/`{data,links,meta}`, mismos códigos de la
 * sección 16, misma garantía de `Idempotency-Key` — para que reemplazarlo por
 * `ApiService` el día que el backend exista no obligue a tocar un componente.
 *
 * El store es estado de módulo, **particionado por filial**: el RUT es único
 * por filial (sección 5), así que dos filiales no pueden ver ni pisar los
 * proveedores de la otra sólo porque comparten un array en memoria. Vive
 * mientras dure la pestaña y se reinicia al recargar — no es persistencia,
 * es la superficie mínima para ejercer alta, edición, desactivación y
 * restauración sin backend.
 */

const MOCK_LATENCY_MS = 220;

const seedStore = (): IProcurementSupplier[] => supplierSeed.map((supplier) => ({ ...supplier }));
const seedNextId = (): number => Math.max(...supplierSeed.map((supplier) => supplier.id)) + 1;

const storesBySubsidiary = new Map<number, IProcurementSupplier[]>();
const nextIdBySubsidiary = new Map<number, number>();

/** Primer acceso de una filial: se siembra con su propia copia del fixture. */
const getStore = (subsidiaryId: number): IProcurementSupplier[] => {
	let store = storesBySubsidiary.get(subsidiaryId);
	if (store === undefined) {
		store = seedStore();
		storesBySubsidiary.set(subsidiaryId, store);
	}
	return store;
};

const setStore = (subsidiaryId: number, next: IProcurementSupplier[]): void => {
	storesBySubsidiary.set(subsidiaryId, next);
};

const nextIdFor = (subsidiaryId: number): number => {
	const current = nextIdBySubsidiary.get(subsidiaryId) ?? seedNextId();
	nextIdBySubsidiary.set(subsidiaryId, current + 1);
	return current;
};

/**
 * Resultado cacheado por `Idempotency-Key`. La clave se delimita "por actor,
 * contexto y acción/recurso" (sección 1): acá el contexto es la filial, así
 * que la misma clave usada por error en dos filiales no puede pisarse.
 */
const idempotencyLog = new Map<string, { payloadHash: string; result: unknown }>();
const idempotencyLogKey = (subsidiaryId: number, key: string): string => `${subsidiaryId}:${key}`;

const delay = <T>(value: T): Promise<T> =>
	new Promise((resolve) => {
		setTimeout(() => resolve(value), MOCK_LATENCY_MS);
	});

interface IMockWriteHeaders {
	idempotencyKey?: string;
}

const apiError = (status: number, data: Record<string, unknown>) => ({
	isAxiosError: true as const,
	response: { status, data },
});

const fail = (status: number, data: Record<string, unknown>): Promise<never> =>
	Promise.reject(apiError(status, data));

/**
 * Garantía de `Idempotency-Key` (sección 1 del contrato): mismo key + mismo
 * payload devuelve el resultado ya obtenido; mismo key + otro payload es
 * `409 IDEMPOTENCY_KEY_REUSED`. Sólo se registra tras una escritura
 * **exitosa** — igual que el backend, un intento fallido no consume la clave,
 * así que el mismo key puede reintentarse tras corregir el payload.
 */
async function withIdempotency<T>(
	subsidiaryId: number,
	idempotencyKey: string | undefined,
	payloadForHash: unknown,
	run: () => Promise<T>,
): Promise<T> {
	if (!idempotencyKey) return run();

	const logKey = idempotencyLogKey(subsidiaryId, idempotencyKey);
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

const toListRow = (supplier: IProcurementSupplier): IProcurementSupplierListRow => ({
	id: supplier.id,
	rut: supplier.rut,
	display_name: supplier.display_name,
	company_name: supplier.company_name,
	contact_name: supplier.contact_name,
	business_activity: supplier.business_activity,
	email: supplier.email,
	phone: supplier.phone,
	is_active: supplier.is_active,
});

/** `display_name` calculado por el servidor: razón social, si no contacto, si no el RUT. */
const computeDisplayName = (payload: IProcurementSupplierPayload): string =>
	payload.company_name?.trim() || payload.contact_name?.trim() || payload.rut;

const searchMatches = (supplier: IProcurementSupplier, search: string): boolean => {
	const needle = search.trim().toLocaleLowerCase('es-CL');
	if (!needle) return true;

	return [
		supplier.display_name,
		supplier.company_name,
		supplier.contact_name,
		supplier.rut,
		supplier.business_activity,
	].some((value) => Boolean(value) && value!.toLocaleLowerCase('es-CL').includes(needle));
};

const findRutConflict = (
	store: IProcurementSupplier[],
	rut: string,
	excludeId?: number,
): IProcurementSupplier | undefined =>
	store.find((supplier) => supplier.rut === rut && supplier.id !== excludeId);

const buildFieldError = (
	code: string,
	message: string,
	field: string,
): Record<string, unknown> => ({
	message,
	code,
	errors: { [field]: [message] },
});

/**
 * RUT válido y al menos `company_name` o `contact_name` no vacío — los dos
 * únicos obligatorios del formulario (sección 5). El resto es opcional.
 */
const validateSupplierPayload = (
	normalizedRut: string,
	payload: IProcurementSupplierPayload,
): Record<string, unknown> | null => {
	if (!validateRut(normalizedRut)) {
		return buildFieldError(
			'INVALID_CHILEAN_RUT',
			PROCUREMENT_ERROR_DEFINITIONS.INVALID_CHILEAN_RUT.fallbackMessage,
			'rut',
		);
	}

	const hasCompanyName = Boolean(payload.company_name?.trim());
	const hasContactName = Boolean(payload.contact_name?.trim());
	if (!hasCompanyName && !hasContactName) {
		return buildFieldError(
			'SUPPLIER_NAME_REQUIRED',
			PROCUREMENT_ERROR_DEFINITIONS.SUPPLIER_NAME_REQUIRED.fallbackMessage,
			'company_name',
		);
	}

	return null;
};

const rutConflictError = (conflict: IProcurementSupplier) =>
	fail(409, {
		message: PROCUREMENT_ERROR_DEFINITIONS.SUPPLIER_RUT_ALREADY_EXISTS.fallbackMessage,
		code: 'SUPPLIER_RUT_ALREADY_EXISTS',
		// Excepción de compatibilidad del contrato: este 409 no usa el envoltorio
		// común, `existing_supplier` va al mismo nivel que `message` y `code`.
		existing_supplier: {
			id: conflict.id,
			display_name: conflict.display_name,
			is_active: conflict.is_active,
		},
	});

const buildSupplierFields = (
	normalizedRut: string,
	payload: IProcurementSupplierPayload,
): Pick<
	IProcurementSupplier,
	| 'rut'
	| 'company_name'
	| 'contact_name'
	| 'business_activity'
	| 'billing_address'
	| 'billing_commune_id'
	| 'shipping_address'
	| 'shipping_commune_id'
	| 'phone'
	| 'email'
	| 'display_name'
> => ({
	rut: normalizedRut,
	company_name: payload.company_name?.trim() || null,
	contact_name: payload.contact_name?.trim() || null,
	business_activity: payload.business_activity?.trim() || null,
	billing_address: payload.billing_address?.trim() || null,
	billing_commune_id: payload.billing_commune_id ?? null,
	shipping_address: payload.shipping_address?.trim() || null,
	shipping_commune_id: payload.shipping_commune_id ?? null,
	phone: payload.phone?.trim() || null,
	email: payload.email?.trim() || null,
	display_name: computeDisplayName({ ...payload, rut: normalizedRut }),
});

/**
 * `GET /suppliers`. Activos por defecto; `is_active` e `include_inactive` son
 * excluyentes — combinarlos es un filtro inválido (422), no una intersección.
 * Orden `display_name` ASC, ID ASC. La fila resumida no trae
 * `purchase_summary`: ese resumen es caro y no va por fila.
 */
export const listProcurementSuppliers = (
	subsidiaryId: number,
	params: IProcurementSupplierListParams = {},
): Promise<IApiCollectionEnvelope<IProcurementSupplierListRow>> => {
	if (params.is_active !== undefined && params.include_inactive !== undefined) {
		return fail(422, {
			message: 'Los filtros is_active e include_inactive no pueden combinarse.',
			code: 'INVALID_FILTER_COMBINATION',
			errors: {
				include_inactive: ['No puede combinarse con is_active.'],
			},
		});
	}

	const store = getStore(subsidiaryId);
	let filtered = store;
	if (params.include_inactive !== 1) {
		const activeOnly = params.is_active !== 0;
		filtered = store.filter((supplier) => supplier.is_active === activeOnly);
	}
	if (params.search)
		filtered = filtered.filter((supplier) => searchMatches(supplier, params.search!));

	const sorted = [...filtered].sort(
		(left, right) =>
			left.display_name.localeCompare(right.display_name, 'es', { sensitivity: 'base' }) ||
			left.id - right.id,
	);

	const { page, per_page: perPage } = normalizePageParams(params);
	const total = sorted.length;
	const lastPage = Math.max(1, Math.ceil(total / perPage));
	const currentPage = Math.min(page, lastPage);
	const start = (currentPage - 1) * perPage;
	const pageItems = sorted.slice(start, start + perPage);

	return delay({
		data: pageItems.map(toListRow),
		links: {
			first: '?page=1',
			last: `?page=${lastPage}`,
			prev: currentPage > 1 ? `?page=${currentPage - 1}` : null,
			next: currentPage < lastPage ? `?page=${currentPage + 1}` : null,
		},
		meta: {
			current_page: currentPage,
			from: total === 0 ? null : start + 1,
			last_page: lastPage,
			links: [],
			path: `/api/subsidiaries/${subsidiaryId}/procurement/suppliers`,
			per_page: perPage,
			to: total === 0 ? null : Math.min(start + perPage, total),
			total,
		},
	});
};

/** `GET /suppliers/{supplier}`: ficha completa con `purchase_summary`. */
export const getProcurementSupplier = (
	subsidiaryId: number,
	id: number,
): Promise<IApiResourceEnvelope<IProcurementSupplier>> => {
	const supplier = getStore(subsidiaryId).find((item) => item.id === id);
	if (!supplier) {
		return fail(404, {
			message: 'El proveedor no existe.',
			code: 'PROCUREMENT_SUPPLIER_NOT_FOUND',
		});
	}

	return delay({ data: { ...supplier } });
};

/** `POST /suppliers`: 201 ficha completa, o 409/422 según la sección 5. */
export const createProcurementSupplier = (
	subsidiaryId: number,
	payload: IProcurementSupplierPayload,
	headers: IMockWriteHeaders = {},
): Promise<IApiResourceEnvelope<IProcurementSupplier>> =>
	withIdempotency(
		subsidiaryId,
		headers.idempotencyKey,
		{ action: 'create', payload },
		async () => {
			const normalizedRut = formatRut(payload.rut ?? '');
			const validationError = validateSupplierPayload(normalizedRut, payload);
			if (validationError) return fail(422, validationError);

			const store = getStore(subsidiaryId);
			const conflict = findRutConflict(store, normalizedRut);
			if (conflict) return rutConflictError(conflict);

			const now = new Date().toISOString();
			const supplier: IProcurementSupplier = {
				id: nextIdFor(subsidiaryId),
				...buildSupplierFields(normalizedRut, payload),
				is_active: true,
				created_at: now,
				updated_at: now,
				allowed_actions: ['update', 'deactivate'],
				purchase_summary: {
					last_purchase_on: null,
					received_units: 0,
					products_supplied_count: 0,
					receipt_count: 0,
				},
			};
			setStore(subsidiaryId, [...store, supplier]);

			return delay({ data: { ...supplier } });
		},
	);

/** `PATCH /suppliers/{supplier}`: 200 ficha completa, o 404/409/422. */
export const updateProcurementSupplier = (
	subsidiaryId: number,
	id: number,
	payload: IProcurementSupplierPayload,
	headers: IMockWriteHeaders = {},
): Promise<IApiResourceEnvelope<IProcurementSupplier>> =>
	withIdempotency(
		subsidiaryId,
		headers.idempotencyKey,
		{ action: 'update', id, payload },
		async () => {
			const store = getStore(subsidiaryId);
			const existing = store.find((supplier) => supplier.id === id);
			if (!existing) {
				return fail(404, {
					message: 'El proveedor no existe.',
					code: 'PROCUREMENT_SUPPLIER_NOT_FOUND',
				});
			}

			const normalizedRut = formatRut(payload.rut ?? '');
			const validationError = validateSupplierPayload(normalizedRut, payload);
			if (validationError) return fail(422, validationError);

			const conflict = findRutConflict(store, normalizedRut, id);
			if (conflict) return rutConflictError(conflict);

			const updated: IProcurementSupplier = {
				...existing,
				...buildSupplierFields(normalizedRut, payload),
				updated_at: new Date().toISOString(),
			};
			setStore(
				subsidiaryId,
				store.map((supplier) => (supplier.id === id ? updated : supplier)),
			);

			return delay({ data: { ...updated } });
		},
	);

/**
 * `DELETE /suppliers/{supplier}`: soft delete. El contrato responde **204,
 * sin cuerpo** — a diferencia de `restore`, que sí devuelve la ficha. El
 * mock respeta esa asimetría a propósito: un consumidor que dependiera del
 * cuerpo de esta respuesta dejaría de funcionar el día que exista el
 * backend real.
 */
export const deactivateProcurementSupplier = (
	subsidiaryId: number,
	id: number,
	headers: IMockWriteHeaders = {},
): Promise<void> =>
	withIdempotency(
		subsidiaryId,
		headers.idempotencyKey,
		{ action: 'deactivate', id },
		async () => {
			const store = getStore(subsidiaryId);
			const existing = store.find((supplier) => supplier.id === id);
			if (!existing) {
				return fail(404, {
					message: 'El proveedor no existe.',
					code: 'PROCUREMENT_SUPPLIER_NOT_FOUND',
				});
			}
			if (!existing.is_active) {
				return fail(409, {
					message: 'El proveedor ya está desactivado.',
					code: 'PROCUREMENT_SUPPLIER_ALREADY_INACTIVE',
				});
			}

			const updated: IProcurementSupplier = {
				...existing,
				is_active: false,
				allowed_actions: ['restore'],
				updated_at: new Date().toISOString(),
			};
			setStore(
				subsidiaryId,
				store.map((supplier) => (supplier.id === id ? updated : supplier)),
			);

			return delay(undefined);
		},
	);

/**
 * `POST /suppliers/{supplier}/restore`: 200, restaura la identidad original
 * — sí devuelve la ficha completa, a diferencia de `deactivate`. Nunca se
 * llama automáticamente — la card la ofrece como decisión explícita del
 * usuario, incluso cuando surge de un conflicto de RUT al guardar.
 */
export const restoreProcurementSupplier = (
	subsidiaryId: number,
	id: number,
	headers: IMockWriteHeaders = {},
): Promise<IApiResourceEnvelope<IProcurementSupplier>> =>
	withIdempotency(subsidiaryId, headers.idempotencyKey, { action: 'restore', id }, async () => {
		const store = getStore(subsidiaryId);
		const existing = store.find((supplier) => supplier.id === id);
		if (!existing) {
			return fail(404, {
				message: 'El proveedor no existe.',
				code: 'PROCUREMENT_SUPPLIER_NOT_FOUND',
			});
		}
		if (existing.is_active) {
			return fail(409, {
				message: 'El proveedor ya está activo.',
				code: 'PROCUREMENT_SUPPLIER_ALREADY_ACTIVE',
			});
		}

		const updated: IProcurementSupplier = {
			...existing,
			is_active: true,
			allowed_actions: ['update', 'deactivate'],
			updated_at: new Date().toISOString(),
		};
		setStore(
			subsidiaryId,
			store.map((supplier) => (supplier.id === id ? updated : supplier)),
		);

		return delay({ data: { ...updated } });
	});

/**
 * Reinicia el store en memoria a la semilla de fixtures, para todas las
 * filiales conocidas. Sólo para pruebas: el store es módulo-global y, sin
 * esto, una prueba de escritura ensucia a la siguiente dentro del mismo
 * archivo.
 */
export const resetProcurementSuppliersStoreForTests = (): void => {
	storesBySubsidiary.clear();
	nextIdBySubsidiary.clear();
	idempotencyLog.clear();
};
