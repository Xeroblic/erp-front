# Sesión — Hub unificado de Integraciones (WooCommerce)

> **Fecha:** 2026-06-24 · **Rama:** `feature/woo-synced-products-menu` (creada desde `develop`)
> **Estado:** implementado · `tsc` + `vite build` verdes · **sin commit** (working tree)

---

## 1. Punto de partida — auditoría del plan

Se revisó el checklist de `PLAN_IMPLEMENTACION_WOOCOMMERCE_PRODUCTOS.md`, que marcaba 4
endpoints como ❌ PENDIENTE. La revisión **en código** demostró que el checklist estaba
**desactualizado**: los 4 ya estaban implementados en todas sus capas.

| # | Endpoint | Service | Thunk | extraReducers | UI | Realidad |
|---|----------|:---:|:---:|:---:|:---:|----------|
| 3 | `GET /products` | ✅ `getWooProducts` | ✅ `fetchWooProducts` | ✅ | ✅ `WooProductsPage.tsx` (505 líneas) | **LISTO** |
| 8 | `POST /products/{id}/sync-price` | ✅ `syncProductPrice` | ✅ `syncProductPriceThunk` | ✅ (actualiza fila por `id`) | ✅ botón por fila | **LISTO** |
| 9 | `POST /products/{id}/sync-stock` | ✅ `syncProductStock` | ✅ `syncProductStockThunk` | ✅ | ✅ botón por fila | **LISTO** |
| 10 | `POST /products/{id}/publish-children` | ✅ `publishProductChildren` | ✅ `publishChildrenThunk` | ✅ | ✅ botón "Sincronizar variaciones" | **LISTO** |

**Verificación de funcionalidad real (no solo "existe el endpoint"):**
- Service: URLs correctas, `only_errors` normalizado a `1/0`, `integration_id` multi-tienda.
- Thunks: `rejectWithValue` + `getErrorMessage`.
- `extraReducers`: `fulfilled` actualiza la fila por `id`, maneja `syncingId` por fila, `rejected` setea error.
- UI handlers: `.unwrap()` + toast éxito/error + refresco (`loadProducts()`).

**Único hueco real detectado:** `WooProductsPage` (`/integraciones/productos-sincronizados`)
existía con ruta y config, pero **no estaba enlazada en el sidebar**
(`DefaultAside.template.tsx` listaba a mano `list · unmappedProducts · syncStock ·
importOrders · importTerms`, faltaba `syncedProducts`). Solo era alcanzable por URL directa.

---

## 2. Decisión — agrupar en un hub con pestañas

En vez de añadir un 6.º item de menú suelto, se decidió crear **una sola página "Integraciones"**
con pestañas que agrupan las 6 secciones. Alcance elegido: **todas las secciones de integraciones**.

### Restricciones de arquitectura descubiertas
- `PageWrapper` renderiza un `<main>` + guard de auth + título → **anidarlo daría `<main>` dentro de
  `<main>`** (HTML inválido) y doble fetch de perfil. ⇒ el hub debe tener **un solo** `PageWrapper`.
- `Subheader` es **sticky** (`top-[var(--header-height)]`) y escribe la CSS var `--subheader-height`
  → tener **dos** sticky se solaparían. ⇒ el hub usa **una barra de tabs no-sticky** y deja que el
  `Subheader` propio de cada sección (con sus acciones) sea el único sticky.
- El componente `@/components/ui/Tabs.tsx` existe y es válido, pero **monta todos los paneles a la
  vez** (oculta los inactivos) → habría disparado 6 cargas simultáneas. ⇒ el hub monta **solo la
  pestaña activa** (lazy) con una nav propia.

---

## 3. Implementación

### 3.1 Refactor de las 6 páginas (`src/pages/integraciones/`)
Cada página se dividió en:
- **`export const XContent`** — su JSX **sin** `PageWrapper` (named export, lo consume el hub).
- **`export default XPage`** — wrapper fino `<PageWrapper name='...'><XContent/></PageWrapper>`
  para que las **rutas standalone existentes sigan funcionando idénticas** (cero regresión).

| Archivo | Named export nuevo |
|---------|--------------------|
| `IntegrationsListPage.tsx` | `IntegrationsListContent` |
| `WooProductsPage.tsx` | `WooProductsContent` |
| `UnmappedProductsPage.tsx` | `UnmappedProductsContent` |
| `SyncStockPage.tsx` | `SyncStockContent` |
| `ImportOrdersPage.tsx` | `ImportOrdersContent` |
| `ImportTermsPage.tsx` | `ImportTermsContent` |

> `IntegrationsListPage` tenía **dos** `PageWrapper` (early-return de error + return principal) con
> indentación distinta; se convirtieron ambos a fragmentos y se corrigió un cierre desbalanceado.

### 3.2 Página nueva — `IntegrationsHubPage.tsx`
- Ruta única `/integraciones` con **pestañas deep-linkables** vía `useSearchParams` (`?tab=...`).
- Reutiliza los `*Content` (no duplica lógica).
- **Filtra pestañas por permiso** con `useCan` (super-admin ve todo; "Sin Mapear" requiere
  `unmapped-woocommerce-products.index`, el resto `view-integration`).
- Monta **solo la pestaña activa** (lazy). Barra de tabs no-sticky, estilo *underline*.
- Tabs: `lista · sincronizados · sin-mapear · sincronizar-stock · importar-ordenes · importar-terminos`.

### 3.3 Wiring
- **Ruta** (`contentRoutes.tsx`): `lazy()` del hub + entrada `{ path: cfg.integrations.to,
  element: <IntegrationsHubPage/>, authority: cfg.integrations.authority }`. Se mantienen las 6
  rutas standalone.
- **Sidebar** (`DefaultAside.template.tsx`): el `NavCollapse` de 5 sub-items se reemplazó por un
  único `NavItem` "Integraciones" → `/integraciones`.

---

## 4. Verificación

- `npx tsc --noEmit` → ✅ limpio.
- `npx vite build` → ✅ `built in 1m 54s` (el warning de *chunk size* es preexistente y ajeno).
- Prettier aplicado a los archivos tocados.
- Se revirtió `stats.html` (artefacto del bundle analyzer generado por el build).

> ⚠️ **Lint del repo NO está limpio de base**: la carpeta `integraciones` ya tenía cientos de
> errores preexistentes (`import/extensions`, `no-explicit-any` en `ModalIntegration`, prettier).
> "Lint verde" no es un gate real del proyecto; no se tocó esa deuda ajena.

---

## 5. Archivos modificados

```
+ src/pages/integraciones/IntegrationsHubPage.tsx          (nuevo)
M src/pages/integraciones/IntegrationsListPage.tsx
M src/pages/integraciones/WooProductsPage.tsx
M src/pages/integraciones/UnmappedProductsPage.tsx
M src/pages/integraciones/SyncStockPage.tsx
M src/pages/integraciones/ImportOrdersPage.tsx
M src/pages/integraciones/ImportTermsPage.tsx
M src/routes/contentRoutes.tsx
M src/templates/layouts/Asides/DefaultAside.template.tsx
M PLAN_IMPLEMENTACION_WOOCOMMERCE_PRODUCTOS.md             (checklist actualizado a 10/10 + hub)
```

---

## 6. Pendiente / a validar manualmente

- **Verificación visual** (requiere levantar la app): apariencia del `?tab=`, y si se prefiere que
  la barra de tabs quede **fija al hacer scroll** (hoy es no-sticky para no chocar con el `Subheader`
  sticky de cada sección).
- **Verificación con backend**: confirmar que `WooProductActionResponse.data` (#5/#6/#8/#9/#10)
  devuelve la fila actualizada; si el backend responde solo con un job en cola, el `fulfilled` no
  refresca la fila y solo se ve el toast.
- **Multi-tienda real** (con backend, no urgente): los 3 puntos del refactor multi-integración ya
  documentados en el plan (N integraciones Woo activas, `marketplace_external_ids` keyed por
  integración, autoridad de `integration_hint`).
- **Commit**: los cambios están en working tree, sin commitear.
