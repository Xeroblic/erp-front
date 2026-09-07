import rawCatalog from '../../../resources/rbac/catalog.json';
import type { KnownPermission } from './catalogPermissions.generated';
import { validateRbacCatalogV1 } from './catalogSchema';

export const rbacCatalog = validateRbacCatalogV1(rawCatalog);

export type { KnownPermission };
