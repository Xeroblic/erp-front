# 09-07-2026 — Fix real de sucursal_principal vs subsidiary_id (#5, issue #80)

**Rama:** `refactor/consolidate-admin-users` (misma rama, PR #83).

## Corrección de diagnóstico
El issue #80 (creado antes en esta sesión) decía "requiere backend". Era un error: el
usuario probó `PUT /user/personalization` y el backend YA expone/persiste
`subsidiary_id` como campo separado (`{ sucursal_principal:1, subsidiary_id:1,
company_id:1 }`). El bug era 100% frontend: `useCompanyManager.switchCompany` llamaba a
`switchContext({ subsidiaryId, sucursalPrincipal: subsidiaryId })`, escribiendo el
subsidiaryId en el campo de SUCURSAL en vez de en el dedicado.

## Qué
- `[feat]` Nuevo thunk `actualizarSubsidiariaPrincipalThunk` en `personalizacionSlice.ts`:
  `PUT /user/personalization { subsidiary_id }` (análogo a
  `actualizarSucursalPrincipalThunk`, que hace `{ sucursal_principal }`).
- `[fix]` `useOrgContextSwitcher.switchContext`: `sucursalPrincipal` pasa a opcional.
  Discrimina de verdad: si viene `subsidiaryId` → actualiza `subsidiary_id` (vía el thunk
  nuevo); si viene `sucursalPrincipal` (sin subsidiaryId) → actualiza `sucursal_principal`.
  Ya NO se mezclan.
- `[fix]` `useCompanyManager.switchCompany`: quita el `sucursalPrincipal: subsidiaryId`
  (la mezcla original). Sólo pasa `subsidiaryId`.

## Verificación
- `tsc --noEmit` OK. Únicos 2 callers de `switchContext` verificados: `useCompanyManager`
  (pasa sólo `subsidiaryId`) y `SelectSucursalEmpresa` (pasa sólo `sucursalPrincipal`).

## A verificar en la app
- Cambiar de **empresa/subsidiaria** (CompanySelectorButton) → confirmar en Network que el
  PUT manda `{ subsidiary_id }` y NO toca `sucursal_principal`.
- Cambiar de **sucursal** (header) → confirmar que el PUT manda `{ sucursal_principal }` y
  NO toca `subsidiary_id`.
- Ambos flujos deben seguir aplicando el contexto correctamente (como ya confirmaste).

Cierra #5 / issue #80.
