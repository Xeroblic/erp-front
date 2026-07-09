# 09-07-2026 — IAdminUser: mapear a campos reales y matar alias (#9 slice 2 / #11)

**Rama:** `refactor/admin-user-cleanup` (apilada sobre `refactor/admin-user-type` / PR #81).

## Qué
- `[refactor]` En las vistas tipadas con `IAdminUser`, se reemplazan las lecturas de campos
  `@deprecated` (que `/users` NO manda → siempre `undefined`) por los reales:
    - `UsersTable`: `position→cargo`, `company?.name→companies[]`, `phone_number→celular`,
      `subsidiary?.name→branch.subsidiary` (eran fallbacks muertos → **display idéntico**).
    - `Usuarios` (filtro): `position→cargo`.
    - `DeleteConfirmationModal`: `position→cargo`, `company→companies[primary]`.
- `[refactor]` **Eliminados los campos `@deprecated` de `IAdminUser`**
  (`phone_number/address/direccion/gender/position/company/branch_id/subsidiary`). `tsc`
  confirma que nada tipado los leía.

## Cambio visual
- Listado de usuarios: **idéntico** (los fallbacks removidos siempre eran undefined).
- Modal de **eliminar usuario**: ahora muestra **Cargo** y **Empresa** reales (antes leía
  `position`/`company` que no existen en `/users`, así que no mostraba nada). Mejora.

## Fuera de alcance (a propósito)
- `UserDetailsModal` y `CreateUserModal` usan `user: any` y son **formularios de edición**
  (envían `phone_number/address/gender/branch_id` al backend en el PATCH/POST). No se tocan.

## Verificación
- `tsc --noEmit` OK. Sin lint nuevos (los de UsersTable son preexistentes).

## A verificar en la app
- **Listado de usuarios**: columnas Cargo/Empresa, RUT/Contacto, Sucursal (deben verse igual).
- **Modal eliminar usuario**: que muestre Cargo y Empresa correctos.
