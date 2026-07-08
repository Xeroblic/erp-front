# Análisis: Subsidiaria y "el cambio de contexto" en los hooks

> Auditoría de **todo lo relacionado con subsidiaria** (subsidiary/subsidiaria) y el
> **cambio de contexto** (company/subsidiary/branch) revisando **únicamente los hooks** y
> las piezas mínimas que los alimentan (selectores, slice de personalización y los dos
> selectores del header que disparan el cambio).
> Fecha: 08-07-2026 · Rama: `develop`

---

## 0. TL;DR — qué se ocupa de verdad y qué sobra

| Pieza | Rol | Uso real | Veredicto |
|-------|-----|----------|-----------|
| `useCurrentBranch` | Deriva `branchId` + `subsidiaryId` del store | **40 archivos** | ✅ Canónico. Es el que hay que usar. |
| `selectEffectiveSubsidiaryId` | Selector central de subsidiaria efectiva | **23 archivos** | ✅ Correcto, pero **duplica** lógica de `useCurrentBranch`. |
| `useAuthorization` | `canAccess/View {Branch,Subsidiary,Company}` | Guards en toda la app | ✅ La fuente de verdad para permisos por scope. |
| `useCompanyManager` | Ejecuta **el cambio** (`switchCompany`) | 4 consumidores | ⚠️ Funciona pero con **bugs y `any`**. |
| `useContextChangeNotifier` | Toasts al cambiar contexto | **0 consumidores** | 🐛 Código muerto + bug de render loop. |
| `useUserSubsidiaries` | Lista subsidiarias del usuario | **0 consumidores** | ⚠️ Código muerto (200 líneas). |
| `useUserBranches` (`permiso/userBranch`) | Lista branches vía API | ~11 archivos | ❌ **`@deprecated`** pero aún vivo. |
| `PREFERRED_SUBSIDIARY_USAGE.md` | Doc del "selector global de subsidiaria" | — | ⚠️ Describe un feature **que nunca se construyó**. |

**Lo más ocupado y sano:** `useCurrentBranch` + `selectEffectiveSubsidiaryId` + `useAuthorization`.
**Lo que está mal / sobra:** `useCompanyManager` (bugs), `useContextChangeNotifier` (muerto+bug),
`useUserSubsidiaries` (muerto), `useUserBranches` (deprecated pero usado), y el doc engañoso.

---

## 1. El flujo de "el cambio" (context switch) — hay DOS caminos paralelos

Ambos selectores del header terminan disparando el **mismo** evento `user-branch-changed`,
pero por rutas distintas:

### Camino A — `SelectSucursalEmpresa.tsx` (selector de sucursal)
```
actualizarSucursalPrincipalThunk(nextBranchId)
  → PUT /user/personalization { sucursal_principal }
  → POST /user/switch-company   { company_id }        (fallback si hay companyId)
  → window.dispatchEvent('user-branch-changed', { branchId, subsidiaryId })
```

### Camino B — `useCompanyManager.switchCompany()` (usado por `CompanySelectorButton`)
```
POST /user/switch-company   { company_id: 1 (!!), subsidiary_id }
  → PUT /user/personalization { sucursal_principal: subsidiaryId }
  → dispatch(userMeThunk())
  → window.dispatchEvent('user-branch-changed', { branchId: subsidiary_id, subsidiaryId })
```

### Quién escucha el evento
- **Global:** `src/App/App.tsx` → `dispatch(obtenerPersonalizacionThunk())`.
- **Local:** `src/pages/inventario/ingresoStock/hooks/useIngresoStock.ts`.

> ⚠️ **Problema de diseño (semántica del evento):** el evento se llama `user-branch-changed`
> pero transporta `subsidiaryId` y, en el camino B, **mete el `subsidiary_id` dentro del
> campo `branchId`**. Un cambio de *subsidiaria* viaja como un evento de *sucursal*. Cualquier
> listener que confíe en `detail.branchId` recibe un id de subsidiaria. Es la mayor fuente
> de confusión de todo el subsistema.

---

## 2. Hooks — revisión uno por uno

### 2.1 `useCurrentBranch.ts` ✅ (el bueno, 40 usos)
- Deriva **sin llamadas API** desde `personalizacion` + `auth.user`.
- `branchId`: `personalizacion.sucursal_principal` → `user.branch.id` → `user.branch_id` → `null`.
- `subsidiaryId`: `selectEffectiveSubsidiaryId` → si no, `resolveSubsidiaryFromBranch(...)`.
- Expone también `visibleBranches` normalizado y `hasValidBranch`.
- **Bien:** memoización correcta, `normalizeNullableNumber`, cero `any`, es el patrón que pide el CLAUDE.md.
- ⚠️ **Nomenclatura tramposa:** el campo `sucursal_principal` a veces contiene una **sucursal**
  y a veces (camino B del switch) una **subsidiaria**. El hook lo trata como branch. Si el
  usuario cambió de "empresa/subsidiaria" por `CompanySelectorButton`, `branchId` puede
  quedar apuntando a un id de subsidiaria.

### 2.2 `selectEffectiveSubsidiaryId` (`store/selectors/subsidiarySelectors.ts`) ✅ (23 usos)
- Recorre candidatos directos (`user.subsidiary.id`, `personalizacion.subsidiary_id`,
  `user.branch.subsidiary.id`, …) y si no, deriva desde la branch.
- **Bien:** robusto ante las múltiples formas del backend, tipado sin `any`.
- ⚠️ **DRY:** `resolveSubsidiaryFromBranch` está **duplicado casi idéntico** aquí y en
  `useCurrentBranch.ts`. Dos implementaciones que hay que mantener sincronizadas a mano.

### 2.3 `useAuthorization.ts` ✅ (la referencia de permisos por scope)
- `canView/Access {Branch,Subsidiary,Company}` a partir de `user.access.*` y `user.visible.*`.
- Regla clave: si el set correspondiente está **vacío**, devuelve `true` (no bloquea) — coherente con el CLAUDE.md.
- **Bien:** diseño limpio, superadmin siempre pasa, memoización de sets.
- 👉 Debería ser la **única** fuente de `canAccessSubsidiary/Branch` (ver 2.4).

### 2.4 `useCompanyManager.ts` ⚠️🐛 (ejecuta el cambio, pero con deuda)
Problemas concretos:
1. 🐛 **`company_id: 1` hardcodeado** con `// TODO` (línea ~96) en el `POST /user/switch-company`.
   En multi-empresa esto cambia a la empresa equivocada.
2. 🔀 **Confunde company ↔ subsidiary:** trata `subsidiaries` como `companies` y usa
   `id === subsidiary_id` indistintamente. El modelo mental queda ambiguo.
3. 📢 **Emite `user-branch-changed` con `branchId: subsidiary_id`** (ver §1).
4. 🧹 **`console.log` de debug** dejados en producción (líneas ~318–333: "🔐 Subsidiarias accesibles", "🔒 Filtrando…").
5. 🚫 **`any` por todas partes** (`error: any`, `(user as any)?.companies`, `c: any`) — viola el
   principio *Zero `any`* del CLAUDE.md.
6. ♻️ **Duplica autorización:** `canAccessSubsidiary` solo compara `user.subsidiary?.id === id`
   (ignora `access.subsidiaries`), mucho más pobre y **divergente** de `useAuthorization`.
   Debería delegar en `useAuthorization`.

Lo que sí está bien: dedupe con `AbortController`, cache en memoria por TTL, cleanup en unmount.

### 2.5 `useContextChangeNotifier.ts` 🐛 (código muerto + bug)
- **0 consumidores** en toda la app.
- 🐛 **Bug de render loop potencial:** el `useEffect` depende de `[user, previousContext]` y
  dentro hace `setPreviousContext(currentContext)` creando **un objeto nuevo en cada corrida**.
  Como React compara dependencias por identidad, el objeto nuevo re-dispara el efecto →
  re-set → re-dispara… Solo no explota porque nadie lo monta.
- **Acción:** eliminarlo, o si se quiere la feature, reescribir con `useRef` para el previo
  y montarlo una sola vez a nivel de layout.

### 2.6 `useUserSubsidiaries.ts` ⚠️ (código muerto)
- **0 consumidores** (solo aparece en su propio doc `PREFERRED_SUBSIDIARY_USAGE.md`).
- 200 líneas que hacen `GET /perfil` y `GET /users/:id?include=access` para algo que
  `useCurrentBranch`/`useAuthorization` ya resuelven desde el store **sin fetch**.
- **Acción:** borrar, o si se necesita listar subsidiarias, derivarlas de
  `user.access.subsidiaries` (ya está en el store) en un selector.

### 2.7 `useUserBranches` / `permiso/userBranch.tsx` ❌ (deprecated pero vivo)
- Marcado `@deprecated` (apunta a `useCurrentBranch`), pero **aún se importa en ~11 archivos**
  (proveedores, ingresoStock, trazabilidad, selectores de producto, config RRHH, el propio
  header `SelectSucursalEmpresa`).
- Hace llamadas API que `useCurrentBranch` evita.
- El CLAUDE.md dice explícitamente **no propagarlo**.
- **Acción:** plan de migración a `useCurrentBranch` + `useAuthorization`, empezando por los
  selectores del header.

### 2.8 Hooks tangenciales (mencionan subsidiary pero no son del subsistema)
- `useSendNotification.ts`: acepta `subsidiary_id?` para marcar notificación local. OK.
- `useServerPagination.ts`: solo en ejemplos de JSDoc. OK.
- `useCan.ts`: chequea rol `subsidiary-admin`. OK.
- `useGeoSelector.ts`: **no** tiene que ver con subsidiaria (región/provincia/comuna). Apareció por keyword, se descarta.

---

## 3. `PREFERRED_SUBSIDIARY_USAGE.md` — documentación engañosa ⚠️

El doc describe con detalle un **selector global de subsidiaria** con:
- componente `SelectSubsidiariaEmpresa.tsx`,
- evento `user-subsidiary-changed`,
- campo `personalizacion.subsidaria_principal`,
- thunk `actualizarSubsidiariaPrincipalThunk`.

**Nada de eso existe en el código:**
- `grep user-subsidiary-changed` → solo aparece **dentro del propio doc**. El evento real es `user-branch-changed`.
- El campo real es `sucursal_principal`, no `subsidaria_principal` (además con **typo**: "subsidaria").
- No hay `SelectSubsidiariaEmpresa.tsx` ni `actualizarSubsidiariaPrincipalThunk`.

Es un doc de *propuesta* que quedó como si fuera documentación vigente (termina en
"¿Lo dejo así o implemento la versión completa?"). **Riesgo:** alguien lo lee y programa
contra un evento/campo inexistente.

---

## 4. Inconsistencias transversales de nomenclatura

1. **`sucursal_principal` sobrecargado**: contiene una *sucursal* (camino A) o una
   *subsidiaria* (camino B). Es la raíz de casi toda la confusión.
2. **company == subsidiary** en `useCompanyManager` (mismo id, mismos campos).
3. **`branchId` transporta subsidiaria** en el evento del camino B.
4. **`subsidaria_principal`** (typo) en el doc vs `subsidiary_id`/`sucursal_principal` reales.

---

## 5. Recomendaciones priorizadas

**P0 — bugs reales**
1. `useCompanyManager`: quitar `company_id: 1` hardcodeado; resolver el `company_id` real.
2. Unificar la semántica del evento: usar `user-context-changed` con
   `{ companyId, subsidiaryId, branchId }` explícitos, o crear `user-subsidiary-changed` de
   verdad; dejar de meter `subsidiary_id` en `branchId`.

**P1 — limpieza de código muerto / deuda**
3. Borrar `useContextChangeNotifier.ts` (o reescribir con `useRef` si se quiere la feature).
4. Borrar `useUserSubsidiaries.ts` (sin consumidores) o convertirlo en selector sin fetch.
5. Migrar los ~11 usos de `useUserBranches` (deprecated) a `useCurrentBranch`/`useAuthorization`.
6. Quitar los `console.log` de `useCompanyManager` y erradicar los `any`.
7. Hacer que `useCompanyManager.canAccess*` delegue en `useAuthorization`.

**P2 — consistencia / documentación**
8. Extraer `resolveSubsidiaryFromBranch` a **un** módulo compartido (hoy duplicado en
   `useCurrentBranch` y `subsidiarySelectors`).
9. Reescribir o marcar como *propuesta no implementada* `PREFERRED_SUBSIDIARY_USAGE.md`;
   corregir el typo `subsidaria_principal`.
10. Documentar en el CLAUDE.md que el "cambio de contexto" se hace vía
    `actualizarSucursalPrincipalThunk` + evento `user-branch-changed`, y que
    `useCurrentBranch`/`selectEffectiveSubsidiaryId` son la lectura canónica.

---

## 6. Mapa de archivos revisados

| Archivo | Estado |
|---------|--------|
| `src/hooks/useCurrentBranch.ts` | ✅ canónico |
| `src/store/selectors/subsidiarySelectors.ts` | ✅ (DRY con el anterior) |
| `src/hooks/useAuthorization.ts` | ✅ referencia de scope |
| `src/hooks/useCompanyManager.ts` | ⚠️🐛 bugs + `any` + logs |
| `src/hooks/useContextChangeNotifier.ts` | 🐛 muerto + render loop |
| `src/hooks/useUserSubsidiaries.ts` | ⚠️ muerto |
| `src/hooks/permiso/userBranch.tsx` (`useUserBranches`) | ❌ deprecated, ~11 usos |
| `src/hooks/PREFERRED_SUBSIDIARY_USAGE.md` | ⚠️ doc de feature no construido |
| `src/App/App.tsx` | listener global `user-branch-changed` |
| `src/templates/layouts/Headers/_partial/SelectSucursalEmpresa.tsx` | camino A del switch |
| `src/templates/layouts/Headers/_partial/CompanySelectorButton.tsx` | camino B (usa `useCompanyManager`) |
| `src/store/slices/personalizacion/personalizacionSlice.ts` | `actualizarSucursalPrincipalThunk` |
