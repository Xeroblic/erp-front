# 08-07-2026 — Fix del `id` de IUserMe (#10)

**Rama:** `refactor/fix-userme-id` (base `origin/develop`).

## Qué
- `[fix]` `normalizeUserProfile` ahora mapea `pk → id` al construir el usuario de sesión.
  `IUserMe.id` estaba tipado `number` requerido pero `/perfil` entrega `pk` (no `id`), así
  que en sesión `user.id` venía `undefined` (los consumidores usaban `user?.id ?? user?.pk`
  como parche). Ahora `id` está garantizado y el tipo deja de mentir.
- `[docs]` Actualizado el caveat de `id` en el JSDoc de `IUserMe`.

## Seguridad
- Solo puede **mejorar** el comportamiento: antes `user.id` era `undefined`, ahora es el
  `pk`. Los patrones `user?.id ?? user?.pk` dan el mismo resultado (pk).
- `tsc --noEmit` OK. Lint del archivo sin errores nuevos (los 2 existentes en
  normalizeUserProfile son preexistentes: `no-unnecessary-type-assertion` y
  `prefer-default-export`).

## Pendiente relacionado (#9/#11)
Partir `IUserMe` en sesión vs admin (`UserWithDetails extends IUserMe`) y quitar los alias
muertos (`position/phone_number/address/middle_name`) sigue pendiente: refactor mayor
(~15 archivos) que conviene con la app.
