import { describe, expect, it } from 'vitest';
import rawCatalog from '../../../resources/rbac/catalog.json';
import { rbacCatalog, type KnownPermission } from './catalog';
import { knownPermissions } from './catalogPermissions.generated';
import { validateRbacCatalogV1 } from './catalogSchema';

const knownPermission: KnownPermission = 'falabella.view';
// @ts-expect-error Los permisos ajenos al snapshot no son KnownPermission.
const unknownPermission: KnownPermission = 'permission-inexistente';
void knownPermission;
void unknownPermission;

describe('catalog RBAC schema v1', () => {
	it('valida el snapshot contractual y conserva sus conteos', () => {
		const catalog = validateRbacCatalogV1(rawCatalog);

		expect(catalog.schema_version).toBe(1);
		expect(catalog.permissions).toHaveLength(122);
		expect(Object.keys(catalog.groups)).toHaveLength(30);
		expect(catalog.roles).toHaveLength(15);
		expect(catalog.contextual_roles).toHaveLength(5);
		expect(knownPermissions).toEqual(catalog.permissions.map((permission) => permission.name));
	});
	it('preserva permisos con punto y los huérfanos falabella sin normalizarlos', () => {
		const names = rbacCatalog.permissions.map((permission) => permission.name);
		const falabella = rbacCatalog.permissions.filter((permission) =>
			permission.name.startsWith('falabella.'),
		);

		expect(names).toContain('unmapped-woocommerce-products.index');
		expect(names).toContain('products.remove-marketplace-sync');
		expect(names.some((name) => name.startsWith('withdrawal'))).toBe(false);
		expect(falabella).toEqual([
			{
				name: 'falabella.export',
				group: null,
				label: 'Exportar datos de Falabella',
				orphan: true,
			},
			{
				name: 'falabella.update',
				group: null,
				label: 'Actualizar datos en Falabella',
				orphan: true,
			},
			{ name: 'falabella.view', group: null, label: 'Ver datos de Falabella', orphan: true },
		]);
	});

	it('rechaza snapshots que no cumplen el schema v1', () => {
		expect(() => validateRbacCatalogV1({ schema_version: 2 })).toThrow(
			'catalog.schema_version debe ser 1.',
		);
	});

	it('rechaza referencias de grupo que no existen entre los permisos', () => {
		const invalidCatalog = structuredClone(rawCatalog);
		invalidCatalog.groups.admin.push('permission-inexistente');

		expect(() => validateRbacCatalogV1(invalidCatalog)).toThrow(
			'catalog.groups.admin contiene un permiso inexistente: permission-inexistente.',
		);
	});

	it('rechaza permisos duplicados', () => {
		const invalidCatalog = structuredClone(rawCatalog);
		invalidCatalog.permissions.push(structuredClone(invalidCatalog.permissions[0]));

		expect(() => validateRbacCatalogV1(invalidCatalog)).toThrow(
			'catalog.permissions contiene valores duplicados.',
		);
	});

	it('rechaza desajustes en ambas direcciones entre groups y permissions', () => {
		const invalidCatalog = structuredClone(rawCatalog);
		const permission = invalidCatalog.permissions.find((item) => item.group === 'admin');

		if (!permission) throw new Error('El fixture debe contener un permiso del grupo admin.');
		permission.group = null;

		expect(() => validateRbacCatalogV1(invalidCatalog)).toThrow(
			`catalog.groups.admin no coincide con catalog.permissions ${permission.name}.`,
		);

		const invalidReverseCatalog = structuredClone(rawCatalog);
		const reversePermission = invalidReverseCatalog.permissions.find(
			(item) => item.group === 'admin',
		);

		if (!reversePermission) {
			throw new Error('El fixture debe contener un permiso del grupo admin.');
		}
		reversePermission.group = 'brand';

		expect(() => validateRbacCatalogV1(invalidReverseCatalog)).toThrow(
			`catalog.permissions ${reversePermission.name} no coincide con catalog.groups.brand.`,
		);
	});
});
