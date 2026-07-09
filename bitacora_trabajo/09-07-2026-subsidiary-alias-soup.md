# 09-07-2026 — Mata el alias soup de ISubempresa (#13, módulo subsidiaria)

**Rama:** `refactor/subsidiary-contract` (base `origin/develop`).

## Contexto
El usuario trajo el contrato real confirmado contra el backend
(`SubsidiaryResource.php`, `Subsidiary.php` model, payload real de
`GET /subsidiaries?with=commune,manager,branches,branches.manager,branches.commune`).
Confirma la hipótesis de #13: **el backend SÓLO manda campos `subsidiary_*`** — nunca
alias camel (`name`, `rut`, `phone`, `address`, `email`, `status`, `website`,
`commune_name`). Los alias eran 100% fabricación de los normalizadores del frontend.

## Qué
- `[refactor]` **`ISubempresa` ya NO extiende `INormalizedEntityAliases`** (ni tiene su
  propio `website` alias). Sólo campos reales `subsidiary_*` + relaciones
  (`manager`/`commune`/`branches`/`sucursales`).
- `[fix]` `subsidiary_status` corregido a `boolean` (antes `boolean | string | number`) —
  evidencia real: dos payloads confirmados con `subsidiary_status: true`.
- `[refactor]` **Migrados los 14 consumidores** (usé `tsc` como checklist exhaustivo tras
  quitar los alias del tipo — 48 errores → 0, sin ruido de grep):
  `quote-data-mapper.ts`, `CreateSubsidiaryModal.tsx`, `useSubsidiaryColumns.tsx`,
  `useUserAccess.ts`, `SubEmpresa.tsx`, `SubEmpresaDetalle.tsx`,
  `SubEmpresaPersonalizacion.tsx`, `CreateSubempresaModal.tsx`, `SubempresasTable.tsx`,
  `SucursalModal.tsx`. Todos leían `.name`/`.rut`/`.phone`/`.address`/`.email`/`.website`
  como PRIMER fallback (antes del campo real) → siempre eran `undefined` → **cambio de
  comportamiento: cero** (eran fallbacks muertos).
- `[refactor]` Limpiados los normalizadores (`empresaSlice.ts`, `subEmpresaSlice.ts`): ya
  no fabrican los alias ni leen claves sin prefijo (`documents_email`, `sales_email`,
  etc.) que el backend confirmado nunca manda. Se conserva la derivación real de
  `manager` (objeto) y `sucursales`/`branches_count`/`commune`.

## Fuera de alcance (a propósito)
- `ISucursal`/`IBranch` (aún extienden `INormalizedEntityAliases`) — mismo problema, pero
  distinto módulo/contrato (`Branch`), pendiente como slice 2 de #13.
- `IEmpresa` — slice 3 de #13.
- Los mappers de **escritura** (`subsidiaryDataMapper.ts`, `subempresaDataMapper.ts`) ya
  usaban los nombres reales del backend en el payload — no requerían cambios.
- Nota menor (no urgente): los payloads de creación mandan `subsidiary_manager_name/
  email/phone`, que el modelo `Subsidiary::$fillable` NO incluye (sólo
  `subsidiary_manager_id`) — Laravel los ignora silenciosamente por mass-assignment. No es
  parte de este fix pero vale la pena limpiarlo en el futuro.

## Verificación
- `tsc --noEmit` OK (0 errores). Sin `no-unused-vars` introducidos (los reportados son
  deuda preexistente, confirmado — no toqué imports).

## A verificar en la app (el usuario va probando en paralelo)
- Listado de subempresas (`/gestion/subempresa`): nombre, RUT, teléfono, email, dirección.
- Detalle de subempresa: datos básicos + comerciales, upload de logo.
- Personalización de subempresa: nombre en tabla y modales.
- Crear/editar subempresa: formulario pre-llenado correctamente al editar.
- Cotización (PDF/vista imprimible): datos de la sucursal emisora.
- Selector de subsidiaria en modal de sucursal (`SucursalModal`).
