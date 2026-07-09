# 09-07-2026 — Consolidar usuarios admin: borrar huérfana + IUserMe solo sesión (#9)

**Rama:** `refactor/consolidate-admin-users` (base `origin/develop`, con #81 mergeado).

## Hallazgo
La página `/gestion/usuarios` (`gestionAdmin/usuarios`, tipada con `IAdminUser` en #81) era
un **duplicado HUÉRFANO**: ruteada pero **sin ningún enlace** (no está en el menú, nadie la
navega). La página viva de "Gestion de usuarios" es **`RolesPermisos`**
(`/gestion/roles-permisos`), que usa **`UserWithDetails`** y pega al **mismo `/users`**.

## Qué
- `[chore]` **Borrada la página huérfana** `gestionAdmin/usuarios` (11 archivos) + su ruta
  (`contentRoutes`), su ítem de menú (`pages.config.manageUsers`) y el re-export del barrel.
  También el `RolesPermisos.tsx.backup` muerto.
- `[refactor]` **`UserWithDetails` decoupleado de `IUserMe`**: antes
  `extends Omit<IUserMe, ...>` (acoplaba admin con sesión). Ahora
  `extends Omit<IAdminUser, ...>` (contrato real de `/users`) + sus shapes propios/legacy
  (companies/branch ricos, permisos/roles estructurados). **`IUserMe` ya no se extiende en
  ningún lado** → es puramente el usuario de SESIÓN.
- `[refactor]` Eliminados los campos `@deprecated` de `IAdminUser` (ya no hay página que los
  use). Corregidos los 8 consumidores que leían `position`/`company` (siempre undefined) a
  los reales: `cargo`, `companies[].position`, `companies[].id` (RolesPermisos, useUserData,
  transformers, UserTableColumns, PermissionsModal, usePermissionsManagement,
  useBranchManagers).

## Verificación
- `tsc --noEmit` OK. `grep 'extends.*IUserMe'` = 0.
- Los reemplazos de `position` eran fallbacks muertos → **display idéntico**.

## A verificar en la app
- **`/gestion/roles-permisos`** (la que usás): columna **Cargo y Empresa**, y el detalle de
  usuario / modal de permisos (que muestren el cargo bien).
- **Sucursales** → selector de managers (label con cargo).
- `/gestion/usuarios` ahora da 404 (era la huérfana): confirmar que no la necesitabas.

## Cierra
- #9 (sesión vs admin) sustancialmente resuelto: `IUserMe`=sesión, `IAdminUser`/`UserWithDetails`=admin.
- PRs #81 (mergeado, huérfana) / #82 (cerrado) quedan superseded por esto.
