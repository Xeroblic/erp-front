// src/utils/auth/normalizeUserProfile.ts
import { IUserMe } from '@/interface/user.interface';
import type {
	AuthorizationAccessScope,
	AuthorizationBranchRef,
	AuthorizationCompanyRef,
	AuthorizationSubsidiaryRef,
	AuthorizationVisibleScope,
} from '@/types/authorization';

type PerfilRecord = Record<string, unknown>;
type PerfilPayload = PerfilRecord | null | undefined;

const toRecord = (value: unknown): PerfilRecord => {
	if (typeof value === 'object' && value !== null) {
		return value as PerfilRecord;
	}
	return {};
};

const toNumber = (value: unknown): number | null => {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
};

const toStringValue = (value: unknown): string | undefined => {
	if (typeof value !== 'string') return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
};

const toStringArray = (value: unknown): string[] => {
	if (!Array.isArray(value)) return [];
	return value.map((item) => toStringValue(item)).filter((item): item is string => Boolean(item));
};

const normalizeCompanyRef = (value: unknown): AuthorizationCompanyRef | null => {
	const record = toRecord(value);
	const id = toNumber(record.id);
	const name = toStringValue(record.name ?? record.company_name);
	if (id === null || !name) return null;
	return { id, name };
};

const normalizeSubsidiaryRef = (value: unknown): AuthorizationSubsidiaryRef | null => {
	if (typeof value === 'number') {
		return { id: value, name: String(value) };
	}

	const record = toRecord(value);
	const id = toNumber(record.id ?? record.subsidiary_id);
	if (id === null) return null;

	const name = toStringValue(record.name ?? record.subsidiary_name) ?? String(id);
	const company = normalizeCompanyRef(record.company);
	const source = toStringValue(record.source);

	return {
		id,
		name,
		company,
		...(source ? { source } : {}),
	};
};

const normalizeBranchRef = (value: unknown): AuthorizationBranchRef | null => {
	if (typeof value === 'number') {
		return { id: value, name: String(value) };
	}

	const record = toRecord(value);
	const id = toNumber(record.id ?? record.branch_id ?? record.branchId ?? record.sucursal_id);
	if (id === null) return null;

	const name = toStringValue(record.name ?? record.branch_name) ?? String(id);
	const subsidiary = normalizeSubsidiaryRef(record.subsidiary ?? record.subsidiary_info);
	const source = toStringValue(record.source);
	const isPrimary = typeof record.is_primary === 'boolean' ? record.is_primary : undefined;
	const position =
		typeof record.position === 'string' || record.position === null
			? (record.position as string | null)
			: undefined;

	return {
		id,
		name,
		subsidiary,
		...(source ? { source } : {}),
		...(typeof isPrimary === 'boolean' ? { is_primary: isPrimary } : {}),
		...(typeof position !== 'undefined' ? { position } : {}),
	};
};

const uniqueById = <T extends { id: number }>(items: T[]): T[] => {
	const map = new Map<number, T>();
	items.forEach((item) => {
		if (!map.has(item.id)) map.set(item.id, item);
	});
	return Array.from(map.values());
};

const normalizeScope = <TScope extends AuthorizationAccessScope | AuthorizationVisibleScope>(
	value: unknown,
): TScope => {
	const record = toRecord(value);
	const subsidiaries = uniqueById(
		(Array.isArray(record.subsidiaries) ? record.subsidiaries : [])
			.map(normalizeSubsidiaryRef)
			.filter((item): item is AuthorizationSubsidiaryRef => item !== null),
	);
	const branches = uniqueById(
		(Array.isArray(record.branches) ? record.branches : [])
			.map(normalizeBranchRef)
			.filter((item): item is AuthorizationBranchRef => item !== null),
	);

	return {
		subsidiaries,
		branches,
	} as TScope;
};

export function normalizeUserProfile(raw: PerfilPayload): {
	user: IUserMe;
	permisos: string[];
	roles: string[];
} {
	const rawRecord = toRecord(raw);
	const data = toRecord(rawRecord.data ?? rawRecord.user);

	const permisosSet = new Set<string>();
	const rolesSet = new Set<string>();

	const pushAll = (arr?: string[]) => arr?.forEach((p) => p && permisosSet.add(p));
	const pushRoles = (arr?: string[]) => arr?.forEach((r) => r && rolesSet.add(r));

	pushAll(toStringArray(data.all_permissions));
	pushAll(toStringArray(data.direct_permissions));
	pushAll(toStringArray(data.role_permissions));
	pushAll(toStringArray(rawRecord.permisos));
	pushRoles(toStringArray(rawRecord.roles));
	pushRoles(toStringArray(data.global_roles));

	const access = normalizeScope<AuthorizationAccessScope>(data.access ?? rawRecord.access);
	const visible = normalizeScope<AuthorizationVisibleScope>(data.visible ?? rawRecord.visible);
	const baseUser = data as Partial<IUserMe>;

	const user: IUserMe = {
		...(baseUser as IUserMe),
		// `/perfil` entrega `pk` (no `id`); garantizamos `id` para que el tipo no mienta.
		id: toNumber(data.id) ?? toNumber(data.pk) ?? 0,
		branch: (data.branch ?? rawRecord.branch) as IUserMe['branch'],
		access,
		visible,
	};

	return {
		user,
		permisos: Array.from(permisosSet),
		roles: Array.from(rolesSet),
	};
}
