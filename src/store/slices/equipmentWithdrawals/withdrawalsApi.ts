import type { RootState } from '@/store/rootReducer';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';

import type {
	IFetchWithdrawalsParams,
	WithdrawalStatus,
	WithdrawalType,
} from '@/interface/equipmentWithdrawals.interface';
import { WITHDRAWAL_STATUSES, WITHDRAWAL_TYPES } from '@/interface/equipmentWithdrawals.interface';

/**
 * Card 1 (ZB-83): el listado corre contra mocks con la forma exacta del
 * contrato §9. Al integrar los endpoints reales basta apagar esta bandera:
 * el thunk ya resuelve el prefijo y los parámetros definitivos.
 */
export const WITHDRAWALS_USE_MOCKS = true;

// ───────────────── Resolución de prefijo branches/subsidiaries ─────────────────

/**
 * Único punto donde el módulo decide el prefijo de la URL:
 * `/api/branches/{branch}/withdrawals...` o `/api/subsidiaries/{subsidiary}/withdrawals...`.
 * Ambos devuelven el mismo JSON; la única diferencia funcional es que en scope
 * subsidiaries el `branch_id` es obligatorio al crear y en el query de
 * eligible-serials (ver `requiresWithdrawalsBranchId`).
 */
export type WithdrawalsEndpointMode = 'subsidiaries' | 'branches';

export interface IWithdrawalsRequestContextInput {
	branchId?: number | null;
	subsidiaryId?: number | null;
	endpointMode?: WithdrawalsEndpointMode;
}

export interface IWithdrawalsResolvedContext {
	endpointMode: WithdrawalsEndpointMode;
	entityId: number;
	branchId: number | null;
	subsidiaryId: number | null;
}

const toValidNumber = (value: unknown): number | null => {
	if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		if (Number.isFinite(parsed) && parsed > 0) return parsed;
	}
	return null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

const readNestedId = (source: unknown, ...keys: string[]): number | null => {
	if (!isRecord(source)) return null;
	for (const key of keys) {
		const candidate = toValidNumber(source[key]);
		if (candidate) return candidate;
	}
	return null;
};

/** Deriva la subsidiaria desde las sucursales visibles del usuario. */
const resolveSubsidiaryFromBranch = (state: RootState, branchId: number | null): number | null => {
	if (!branchId) return null;

	const user: unknown = state.auth.user;
	const directSources: unknown[] = isRecord(user)
		? [
				user.branch,
				user.branches,
				readRecordPath(user, 'access', 'branches'),
				readRecordPath(user, 'visible', 'branches'),
			]
		: [];

	for (const source of directSources) {
		const branches = Array.isArray(source) ? source : [source];
		for (const branch of branches) {
			const candidateId = readNestedId(branch, 'id', 'branch_id', 'branchId', 'sucursal_id');
			if (candidateId !== branchId) continue;

			const subsidiarySource = isRecord(branch)
				? (branch.subsidiary ??
					branch.subsidiary_info ??
					branch.subsidiary_id ??
					branch.subsidiaryId)
				: undefined;
			if (isRecord(subsidiarySource)) {
				const nestedId =
					toValidNumber(subsidiarySource.id) ??
					toValidNumber(subsidiarySource.subsidiary_id);
				if (nestedId) return nestedId;
			}
			const directId = toValidNumber(subsidiarySource);
			if (directId) return directId;
		}
	}

	return null;
};

const readRecordPath = (root: unknown, ...path: string[]): unknown => {
	let current: unknown = root;
	for (const key of path) {
		if (!isRecord(current)) return undefined;
		current = current[key];
	}
	return current;
};

export const resolveWithdrawalsContext = (
	state: RootState,
	input: IWithdrawalsRequestContextInput = {},
): IWithdrawalsResolvedContext => {
	// Prioridad: input → personalizacion.sucursal_principal → user.branch.id →
	// user.branch_id → null (misma cadena de useCurrentBranch).
	const branchId =
		toValidNumber(input.branchId) ??
		toValidNumber(
			readRecordPath(state.personalizacion, 'personalizacionUsuario', 'sucursal_principal'),
		) ??
		resolveUserBranchId(state.auth.user);

	const effectiveSubsidiaryId = selectEffectiveSubsidiaryId(state);
	const subsidiaryId =
		toValidNumber(input.subsidiaryId) ??
		toValidNumber(effectiveSubsidiaryId) ??
		resolveSubsidiaryFromBranch(state, branchId);

	// Priorizamos el modo 'branches': evita 403 en usuarios que pertenecen a una
	// subsidiaria pero no tienen acceso global a ella.
	const endpointMode: WithdrawalsEndpointMode =
		input.endpointMode ?? (input.subsidiaryId && !input.branchId ? 'subsidiaries' : 'branches');

	const entityId = endpointMode === 'subsidiaries' ? subsidiaryId : branchId;
	if (!entityId) {
		throw new Error('No se pudo resolver el contexto de retiros de equipos');
	}

	return {
		endpointMode,
		entityId,
		branchId,
		subsidiaryId,
	};
};

const resolveUserBranchId = (user: unknown): number | null => {
	if (!isRecord(user)) return null;
	return readNestedId(user.branch, 'id') ?? toValidNumber(user.branch_id);
};

export const buildWithdrawalsEndpoint = (
	context: IWithdrawalsResolvedContext,
	path: string,
): string => `/${context.endpointMode}/${context.entityId}/withdrawals${path}`;

// ───────────────── Filtros de listado ↔ query string (§9) ─────────────────

const isWithdrawalStatus = (value: unknown): value is WithdrawalStatus =>
	typeof value === 'string' && (WITHDRAWAL_STATUSES as readonly string[]).includes(value);

const isWithdrawalType = (value: unknown): value is WithdrawalType =>
	typeof value === 'string' && (WITHDRAWAL_TYPES as readonly string[]).includes(value);

/**
 * Mapea los filtros rápidos del listado desde la URL hacia los query params
 * del contrato §9:
 * - "Qué hay afuera"      → ?status=confirmed&type=loan
 * - "Borradores estancados" → ?stale=true
 */
export const withdrawalsFiltersFromSearchParams = (
	searchParams: URLSearchParams,
): IFetchWithdrawalsParams => {
	const status = searchParams.get('status');
	const type = searchParams.get('type');
	const stale = searchParams.get('stale');
	const q = searchParams.get('q');
	const customerSupplierId = toValidNumber(searchParams.get('customer_supplier_id'));
	const customerSupplierContactId = toValidNumber(
		searchParams.get('customer_supplier_contact_id'),
	);
	const page = toValidNumber(searchParams.get('page'));
	const perPage = toValidNumber(searchParams.get('per_page'));

	return {
		...(isWithdrawalStatus(status) ? { status } : {}),
		...(isWithdrawalType(type) ? { type } : {}),
		...(stale === 'true' || stale === 'false' ? { stale: stale === 'true' } : {}),
		...(q ? { q } : {}),
		...(customerSupplierId ? { customer_supplier_id: customerSupplierId } : {}),
		...(customerSupplierContactId
			? { customer_supplier_contact_id: customerSupplierContactId }
			: {}),
		...(page ? { page } : {}),
		...(perPage ? { per_page: perPage } : {}),
	};
};
