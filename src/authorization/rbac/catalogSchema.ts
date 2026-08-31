type UnknownRecord = Record<string, unknown>;

export interface RbacCatalogPermission {
	name: string;
	group: string | null;
	label: string;
	orphan: boolean;
}

export interface RbacCatalogRole {
	name: string;
	label: string;
	level: number;
	resolves_from_database: boolean;
	permissions: string[];
}

export interface RbacCatalogV1 {
	schema_version: 1;
	source: string;
	generated_from: string;
	is_generated_artifact: boolean;
	notes: string[];
	hierarchy: {
		levels: Record<string, number>;
		default_level: number;
	};
	excluded_from_all: string[];
	groups: Record<string, string[]>;
	permissions: RbacCatalogPermission[];
	roles: RbacCatalogRole[];
	contextual_roles: string[];
	warnings: string[];
}

const isRecord = (value: unknown): value is UnknownRecord => {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const requireRecord = (value: unknown, path: string): UnknownRecord => {
	if (!isRecord(value)) throw new Error(`${path} debe ser un objeto.`);
	return value;
};

const requireString = (value: unknown, path: string): string => {
	if (typeof value !== 'string' || value.length === 0) {
		throw new Error(`${path} debe ser una cadena no vacía.`);
	}
	return value;
};

const requireBoolean = (value: unknown, path: string): boolean => {
	if (typeof value !== 'boolean') throw new Error(`${path} debe ser booleano.`);
	return value;
};

const requireInteger = (value: unknown, path: string): number => {
	if (typeof value !== 'number' || !Number.isInteger(value)) {
		throw new Error(`${path} debe ser un entero.`);
	}
	return value;
};

const requireStringArray = (value: unknown, path: string): string[] => {
	if (!Array.isArray(value)) throw new Error(`${path} debe ser un arreglo.`);
	return value.map((item, index) => requireString(item, `${path}[${index}]`));
};

const requireStringMap = (value: unknown, path: string): Record<string, string[]> => {
	const record = requireRecord(value, path);
	return Object.fromEntries(
		Object.entries(record).map(([key, permissions]) => [
			requireString(key, `${path} clave`),
			requireStringArray(permissions, `${path}.${key}`),
		]),
	);
};

const requireLevelMap = (value: unknown, path: string): Record<string, number> => {
	const record = requireRecord(value, path);
	return Object.fromEntries(
		Object.entries(record).map(([key, level]) => [
			requireString(key, `${path} clave`),
			requireInteger(level, `${path}.${key}`),
		]),
	);
};

const ensureUnique = (values: string[], path: string): void => {
	if (new Set(values).size !== values.length)
		throw new Error(`${path} contiene valores duplicados.`);
};

export const validateRbacCatalogV1 = (value: unknown): RbacCatalogV1 => {
	const record = requireRecord(value, 'catalog');
	if (record.schema_version !== 1) {
		throw new Error('catalog.schema_version debe ser 1.');
	}

	const groups = requireStringMap(record.groups, 'catalog.groups');
	if (!Array.isArray(record.permissions)) {
		throw new Error('catalog.permissions debe ser un arreglo.');
	}

	const parsedPermissions = record.permissions.map((permission, index): RbacCatalogPermission => {
		const item = requireRecord(permission, `catalog.permissions[${index}]`);
		const { group } = item;
		if (group !== null && typeof group !== 'string') {
			throw new Error(`catalog.permissions[${index}].group debe ser string o null.`);
		}
		return {
			name: requireString(item.name, `catalog.permissions[${index}].name`),
			group,
			label: requireString(item.label, `catalog.permissions[${index}].label`),
			orphan: requireBoolean(item.orphan, `catalog.permissions[${index}].orphan`),
		};
	});
	const permissionNames = parsedPermissions.map((permission) => permission.name);
	ensureUnique(permissionNames, 'catalog.permissions');
	const permissionNameSet = new Set(permissionNames);
	const permissionsByName = new Map(
		parsedPermissions.map((permission) => [permission.name, permission]),
	);

	Object.entries(groups).forEach(([group, groupPermissions]) => {
		ensureUnique(groupPermissions, `catalog.groups.${group}`);
		groupPermissions.forEach((permission) => {
			if (!permissionNameSet.has(permission)) {
				throw new Error(
					`catalog.groups.${group} contiene un permiso inexistente: ${permission}.`,
				);
			}
		});
	});

	parsedPermissions.forEach(({ name, group }) => {
		if (group === null) return;
		if (!groups[group]?.includes(name)) {
			throw new Error(`catalog.permissions ${name} no coincide con catalog.groups.${group}.`);
		}
	});

	Object.entries(groups).forEach(([group, groupPermissions]) => {
		groupPermissions.forEach((name) => {
			const permission = permissionsByName.get(name);
			if (permission?.group !== group) {
				throw new Error(
					`catalog.groups.${group} no coincide con catalog.permissions ${name}.`,
				);
			}
		});
	});

	if (!Array.isArray(record.roles)) throw new Error('catalog.roles debe ser un arreglo.');
	const roles = record.roles.map((role, index): RbacCatalogRole => {
		const item = requireRecord(role, `catalog.roles[${index}]`);
		const rolePermissions = requireStringArray(
			item.permissions,
			`catalog.roles[${index}].permissions`,
		);
		ensureUnique(rolePermissions, `catalog.roles[${index}].permissions`);
		rolePermissions.forEach((permission) => {
			if (!permissionNameSet.has(permission)) {
				throw new Error(
					`catalog.roles[${index}] contiene un permiso inexistente: ${permission}.`,
				);
			}
		});
		return {
			name: requireString(item.name, `catalog.roles[${index}].name`),
			label: requireString(item.label, `catalog.roles[${index}].label`),
			level: requireInteger(item.level, `catalog.roles[${index}].level`),
			resolves_from_database: requireBoolean(
				item.resolves_from_database,
				`catalog.roles[${index}].resolves_from_database`,
			),
			permissions: rolePermissions,
		};
	});
	ensureUnique(
		roles.map((role) => role.name),
		'catalog.roles',
	);

	const hierarchy = requireRecord(record.hierarchy, 'catalog.hierarchy');
	return {
		schema_version: 1,
		source: requireString(record.source, 'catalog.source'),
		generated_from: requireString(record.generated_from, 'catalog.generated_from'),
		is_generated_artifact: requireBoolean(
			record.is_generated_artifact,
			'catalog.is_generated_artifact',
		),
		notes: requireStringArray(record.notes, 'catalog.notes'),
		hierarchy: {
			levels: requireLevelMap(hierarchy.levels, 'catalog.hierarchy.levels'),
			default_level: requireInteger(
				hierarchy.default_level,
				'catalog.hierarchy.default_level',
			),
		},
		excluded_from_all: requireStringArray(
			record.excluded_from_all,
			'catalog.excluded_from_all',
		),
		groups,
		permissions: parsedPermissions,
		roles,
		contextual_roles: requireStringArray(record.contextual_roles, 'catalog.contextual_roles'),
		warnings: requireStringArray(record.warnings, 'catalog.warnings'),
	};
};
