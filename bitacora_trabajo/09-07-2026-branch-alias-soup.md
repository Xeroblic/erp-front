# 09-07-2026 — Mata el alias soup de ISucursal/IBranch (#13, cierra el issue)

**Rama:** `refactor/branch-contract` (apilada sobre `refactor/subsidiary-contract` / PR #84).

## Qué
- `[refactor]` **`ISucursal` ya no extiende `INormalizedEntityAliases`**. Evidencia: los
  dos payloads reales de `/branches` vistos en la sesión (top-level y anidado dentro de
  `/subsidiaries`) nunca traen alias camel, sólo `branch_*`.
- `[refactor]` **Migrados los 6 consumidores** (tsc como checklist: 19 errores → 0):
  `Categorias.tsx`, `Productos.tsx` (de paso simplificó una cascada de casts `as any`
  para resolver el nombre de sucursal), `CreateEditTransferModal.tsx`, `useUserAccess.ts`,
  `Sucursales.tsx` (accessors de tabla), `SucursalModal.tsx`.
- `[fix]` `Sucursales.tsx`: la columna "Comuna" usaba `columnHelper.accessor('commune_name'
  as any, ...)` con un cast que ocultaba el problema — se cambió a
  `accessorFn: (row) => row.commune?.name` (dato real, relación anidada).
- `[refactor]` Limpiado `normalizeBranchData` (`sucursalesSlice.ts`): ya no fabrica los
  alias `name/rut/phone/address/email/status`. `commune_name` corregido para derivar de
  la relación anidada (`backendData.commune?.name`) en vez de una clave plana que el
  backend nunca manda.
- `[docs]` **`IEmpresa` revisada: ya estaba limpia** (nunca extendió
  `INormalizedEntityAliases`). No requirió cambios — cierra el slice 3 de #13 sin trabajo.

## Verificación
- `tsc --noEmit` OK (19 → 0). Sin `no-unused-vars` introducidos.
- Mismo patrón que `ISubempresa`: los alias eran siempre el primer fallback (antes del
  campo real) → **cambio de comportamiento: cero**, salvo la columna "Comuna" de
  `Sucursales.tsx` que **pasa de mostrar `undefined` a mostrar el nombre real** (mejora).

## Cierra #13 / issue #77
Con este slice, los 3 módulos (`ISubempresa`, `ISucursal`/`IBranch`, `IEmpresa`) del plan
original quedan resueltos. Issue #77 se puede cerrar tras mergear #84 y esta rama.

## A verificar en la app
- Listado de sucursales (`/gestion/sucursales`): nombre, RUT, dirección, teléfono,
  **comuna** (antes seguramente mostraba "Sin comuna" siempre — ahora debería mostrar el
  nombre real si la sucursal tiene comuna asignada).
- Selector de sucursal en categorías, productos, transferencias.
- Nombre de sucursal actual en la página de Productos (header/contexto).
