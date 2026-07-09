# 09-07-2026 — IAdminUser: separar el usuario admin de IUserMe (#9 slice 1)

**Rama:** `refactor/admin-user-type` (base `origin/develop`).

## Contexto
El módulo `gestionAdmin/usuarios` tipaba sus **listas de otros usuarios** como `IUserMe[]`
(el tipo de la SESIÓN). Con el contrato real de `GET /users` a la vista, se define un tipo
propio y honesto.

## Qué
- `[refactor]` Nuevo **`IAdminUser`** (+ `IAdminUserCompany`, `IAdminUserContextualRole`,
  `IAdminUserBranch`) en `users.interface.ts`, con el contrato exacto de `/users`
  (`can_edit`, `is_super_admin`, `global_roles`, `contextual_roles`, `*_permissions`,
  `companies` con `position`, `branch` "gorda", `access`/`visible`). Reutiliza
  `AuthorizationAccessScope/VisibleScope`.
- `[refactor]` Retipado el módulo `gestionAdmin/usuarios` (`Usuarios`, `useUsersManagement`,
  `UsersTable`, `DeleteConfirmationModal`) de `IUserMe` → `IAdminUser`.
- Los campos que las vistas leen pero **NO** vienen en `/users` (`phone_number`, `address`,
  `direccion`, `gender`, `position`, `company`, `branch_id`, `subsidiary`) quedan como
  opcionales `@deprecated` en `IAdminUser` → **cero cambio de runtime** (ya eran undefined).

## Verificación
- `tsc --noEmit` OK. Sin unused-vars nuevos (6 preexistentes confirmados por stash).
- **Es un rename de tipos: no cambia el comportamiento.** Los datos que se muestran son los
  mismos.

## A verificar en la app (sanity check, bajo riesgo)
- Página de **gestión de usuarios** (listado): nombres, sucursal, estado activo, empresa.
- Modales de **detalle** y **eliminar** usuario.

## Follow-ups (#9/#11)
- **Slice 2:** mapear los campos `@deprecated` a los reales (`celular`, `cargo`,
  `companies[].position`, `branch.*`) en las vistas → cambia displays, requiere verificación.
- **Slice 3:** adelgazar `IUserMe` a sesión (hoy `UserWithDetails extends IUserMe` y otros
  aún la usan; decoupling pendiente).
