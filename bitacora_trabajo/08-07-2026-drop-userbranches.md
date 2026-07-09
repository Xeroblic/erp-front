# 08-07-2026 — Eliminar useUserBranches deprecated (#8)

**Rama:** `refactor/drop-useuserbranches` (base `origin/develop`, independiente de #73/#74/#75).

## Qué

- `[refactor]` Nuevo selector memoizado `selectUserBranches`
  (`store/selectors/userBranchesSelectors.ts`) + tipo `UserBranchInfo`: devuelve las
  sucursales del usuario (con `subsidiaryId/subsidiaryName/companyId/companyName`) desde el
  store (`user.access/visible.branches`), **sin llamadas API** (el dato ya llega en `/perfil`).
- `[chore]` Eliminado el hook `@deprecated useUserBranches`
  (`hooks/permiso/userBranch.tsx`), su alias `useUserBranchAccess`, el re-export
  `hooks/userBrandBranch.tsx` y el barrel huérfano
  `pages/catalogos/productos/components/modals/hooks/index.ts`.
- `[refactor]` Migrados los consumidores a `selectUserBranches`:
  `SelectSucursalEmpresa`, `DetalleProveedor`, `FinalizeAdjustmentModal`,
  `useIngresoStock`, `useTrazabilidadMovimientos`, `TrazabilidadList`,
  `SucursalConfigForm`, `UserBranchSelector` (+ `IngresoStock` tenía import muerto).

## Seguridad de la migración
- Verificado: **todos** los consumidores usaban el `userId` del **usuario en sesión**
  (`user?.id ?? pk`), incl. los callers de `UserBranchSelector`. El selector (usuario
  actual, mismo dato de `/perfil`) es un **drop-in** de misma semántica.
- `loading`/`error` pasan a constantes (`false`/`null`): el dato es síncrono desde el store.
- `UserBranchSelector.userId` queda como prop `@deprecated` opcional (ignorada) para no
  romper a sus callers.

**Estado:** `tsc --noEmit` OK. Sin `no-unused-vars` introducidos. Cero referencias al hook
borrado (salvo el comentario en el selector nuevo).

**Nota:** el único cambio de comportamiento visible es que `UserBranchSelector` ya no
muestra spinner/estado de carga (los datos están en el store). Conviene un vistazo rápido
en la app a los selects de sucursal, pero la fuente de datos es la misma.
