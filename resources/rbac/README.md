# Snapshot RBAC

`catalog.json` es el snapshot contractual frontend del catálogo RBAC schema v1. Se copia sin transformaciones desde el backend en `resources/rbac/catalog.json` del commit confirmado para la card.

Para sustituirlo por un snapshot futuro válido:

1. Copia el archivo completo a esta misma ruta, sin renombrar ni normalizar permisos.
2. Ejecuta `pnpm rbac:generate-types` para regenerar el tipo derivado.
3. Ejecuta `pnpm vitest run src/authorization/rbac/catalogSchema.test.ts`.
4. Revisa cualquier cambio de conteo como drift contractual antes de integrarlo.

El snapshot se absorbe desde `rbacCatalog` y `KnownPermission` se genera desde `catalog.permissions[].name`; no se mantiene una unión manual de permisos. Los permisos con punto y los permisos huérfanos, incluido `falabella.*`, se conservan literalmente. Este artefacto no declara paridad con endpoints ni habilita navegación por sí mismo.
