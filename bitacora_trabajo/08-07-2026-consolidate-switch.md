# 08-07-2026 — Consolidar switch + unificar evento (#3, #4)

**Rama:** `refactor/consolidate-switch-events` (base `origin/develop`, ya con #73-76 mergeados).

## Qué

- `[refactor]` **#3 — `SelectSucursalEmpresa` delega en `useOrgContextSwitcher`**: ya no
  hace su propio `actualizarSucursalPrincipalThunk` + POST `switch-company` + evento; llama
  a `switchContext({ sucursalPrincipal, eventBranchId, eventSubsidiaryId })`. Se eliminan
  imports muertos (`toast`, `ApiService`, `actualizarSucursalPrincipalThunk`).
- `[refactor]` **switcher mejorado**: `useOrgContextSwitcher` ahora actualiza la
  personalización vía `actualizarSucursalPrincipalThunk` (mantiene el slice sincronizado,
  antes hacía PUT directo que no tocaba el slice) y añade `eventSubsidiaryId` para el
  evento (permite un cambio de sucursal que reporte su subsidiaria sin enviar
  `subsidiary_id` al POST).
- `[refactor]` **#4 — evento unificado**: se retira por completo el legacy
  `user-branch-changed`. El switcher emite sólo `org-context-changed`; los listeners
  (`App.tsx`, `useIngresoStock`) escuchan el evento nuevo (mismo shape de `detail`).

## Verificación
- `tsc --noEmit` OK. Cero referencias a `user-branch-changed` (salvo un comentario).
  Sin unused-vars nuevos (los `any` restantes en SelectSucursalEmpresa son preexistentes).

## ⚠️ A verificar en la app (cambia runtime del switch)
- Cambio de **sucursal** desde el header: se aplica, el slice de personalización se
  actualiza y las páginas que escuchan `org-context-changed` (ingresoStock) reaccionan.
- Cambio de **empresa/subsidiaria** (`CompanySelectorButton`): sigue OK (usa el mismo
  switcher).
- Nota: `SelectSucursalEmpresa` ahora también dispara `userMeThunk` (refresco de perfil)
  que antes no hacía; y el POST `switch-company` se envía aunque no se resuelva companyId
  (antes se omitía). En un usuario logueado el companyId casi siempre resuelve.
