# Plan de Implementación — WooCommerce (Productos)

> **Proyecto:** `zentria-vite` (ERP Front) · **Actualizado:** 2026-06-16
> **Alcance:** Cablear los 10 endpoints de productos WooCommerce sobre la arquitectura existente (`types → service → slice → UI`).

**Base URL común:** `/api/subsidiaries/{subsidiary}/integrations/woocommerce/...`
`{subsidiary}` = ID de la sucursal (siempre requerido en la ruta).

---

## Cómo se conecta cada endpoint (arquitectura)

Flujo unidireccional ya establecido en el módulo de integraciones:

```
UI → dispatch(thunk) → integrationsService.fn() → ApiService.fetchData() → API Laravel
```

Por cada endpoint se toca, según corresponda:
- **Service** → `src/services/integrationsService.ts` (sección nueva `WOOCOMMERCE — PRODUCTOS`).
- **Types** → `src/types/integrations.types.ts`.
- **Slice** → `src/store/slices/integrations/woocommerceProductsSlice.ts` (nuevo, copia el patrón de `unmappedProductsSlice.ts`).
- **UI** → página/componente según la columna "UI".

> ⚠️ El tab [WooCommerceProductTab.tsx](src/pages/catalogos/productos/components/modals/components/WooCommerceProductTab.tsx) hoy es un **mock**: "Publicar en WooCommerce" solo lanza un `toast`. El endpoint #4 lo vuelve funcional.

---

## Endpoints (en orden)

### 1 · Importar términos (categorías/marcas)
- **`POST` `/import-terms`**
- **Body:** `taxonomies` (array, ej. `["product_cat"]`) · `branch_id` (opcional).
  > ⚠️ La colección Postman manda solo `{ "branch_id": 1 }`. **Confirmar con backend** si `taxonomies` es realmente requerido.
- **Función:** programa (job en cola) la importación masiva de categorías y marcas de la tienda al ERP.
- **Service:** `importTerms(subsidiaryId, payload)`
- **Slice thunk:** `runImportTerms` → dispara batch.
- **UI:** `ImportTermsWizard.tsx` — selector de taxonomías dentro de la configuración inicial de la integración.

### 2 · Estado de importación de términos
- **`GET` `/import-terms/status`**
- **Query:** `batch_id` (opcional).
- **Función:** progreso del lote (#1).
- **Service:** `getImportTermsStatus(subsidiaryId, params?)`
- **Slice thunk:** `pollImportTermsStatus` → setea `importStatus`.
- **UI:** spinner *"Descargando categorías de WooCommerce…"* + barra de progreso. **Polling** cada ~2 s tras lanzar #1.

### 3 · Listar productos sincronizados / con error
- **`GET` `/products`**
- **Query:** `search` · `only_errors` (bool) · `per_page`.
  > Normalizar `only_errors` a `1/0` en el service (como `filter_by_integration`).
- **Función:** lista productos vinculados y expone errores de publicación.
- **Service:** `getWooProducts(subsidiaryId, params?)`
- **Slice thunk:** `fetchWooProducts` → reemplaza `products`.
- **UI:** `WooProductsPage.tsx` (reutiliza layout de [UnmappedProductsPage.tsx](src/pages/integraciones/UnmappedProductsPage.tsx)). Tabla con **alerta roja** si `status === 'error'` + tooltip con `last_error_msg`. Toggle "Solo con errores" + búsqueda.
  > No confundir con `unmapped-products` (resolución de ventas entrantes) — son dominios distintos.

### 4 · Creación rápida de producto
- **`POST` `/quick-products`**
- **Body:** datos básicos — `name`, `sku`, `initial_stock`, `price`, `image`, (`branch_id`, `sync_stock_with_woo` opc.).
  > Confirmar contrato de `image`: ¿URL, base64 o `multipart/form-data`? El mock actual usa URL.
- **Función:** registra el producto en el ERP y lo manda a publicar en Woo.
- **Service:** `createQuickProduct(subsidiaryId, payload)`
- **Slice thunk:** `createQuickProductThunk` → `unshift` en `products`.
- **UI:** conectar [WooCommerceProductTab.tsx](src/pages/catalogos/productos/components/modals/components/WooCommerceProductTab.tsx) (líneas 372-389): cambiar el `toast` simulado por el dispatch real. Mapear `wooName`/`skuProduct`/`wooPrice`/`wooImageUrl`/stock → payload.

### 5 · Publicar producto
- **`POST` `/products/{product}`**  (`{product}` = ID en el ERP)
- **Body:** `sync_stock_with_woo` (bool, opcional).
- **Función:** publica o actualiza por completo el producto en Woo.
- **Service:** `publishProduct(subsidiaryId, productId, payload?)`
- **Slice thunk:** `publishProductThunk` → actualiza fila por `id`.
- **UI:** switch/botón **"Publicar en WooCommerce"** en la ficha del producto ([CreateEditProductModal.tsx](src/pages/catalogos/productos/components/modals/CreateEditProductModal.tsx), tab en línea 720).

### 6 · Despublicar producto
- **`DELETE` `/products/{product}`**
- **Body:** `sync_stock_with_woo` (bool, opcional — visto en Postman).
- **Función:** desvincula el producto y lo quita / pasa a borrador en Woo.
- **Service:** `unpublishProduct(subsidiaryId, productId)`
- **Slice thunk:** `unpublishProductThunk` → actualiza/quita fila.
- **UI:** botón **"Despublicar"** en la ficha y en la fila de `WooProductsPage`.

### 7 · Estado remoto (diagnóstico)
- **`GET` `/products/{product}/remote`**
- **Función:** consulta en vivo Woo (estado/precio/stock) y lo contrasta con el ERP.
- **Service:** `getProductRemoteState(subsidiaryId, productId)`
- **Slice thunk:** `fetchRemoteState` → setea `remoteState`.
- **UI:** pestaña **"Diagnóstico"** en la ficha: tabla comparativa `local` vs `remote` con badges de `differences`.

### 8 · Sincronizar precio
- **`POST` `/products/{product}/sync-price`**
- **Body:** `sync_stock_with_woo` (bool, opcional — visto en Postman).
- **Función:** sincroniza en segundo plano **solo el precio**.
- **Service:** `syncProductPrice(subsidiaryId, productId)`
- **Slice thunk:** `syncProductPriceThunk` → usa `syncingId` (feedback por fila).
- **UI:** activación automática al guardar un cambio de precio en el catálogo **o** botón rápido en la grilla.

### 9 · Sincronizar stock
- **`POST` `/products/{product}/sync-stock`**
- **Body:** `sync_stock_with_woo` (bool, opcional).
- **Función:** sincroniza en segundo plano **solo el stock** (si el producto tiene activada la sync de stock).
- **Service:** `syncProductStock(subsidiaryId, productId)`
- **Slice thunk:** `syncProductStockThunk` → usa `syncingId`.
- **UI:** botón pequeño de actualización rápida de stock en la grilla de inventario.
  > **No es** el `sync-stock` masivo existente (`/integrations/woocommerce/sync-stock`). Conviven.

### 10 · Publicar variaciones (hijos)
- **`POST` `/products/{product}/publish-children`**  (`{product}` = ID del padre)
- **Body:** `sync_stock_with_woo` (bool, opcional).
- **Función:** publica en lote todas las variaciones de un producto padre serializado.
- **Service:** `publishProductChildren(subsidiaryId, productId, payload?)`
- **Slice thunk:** `publishChildrenThunk` → actualiza fila.
- **UI:** botón **"Sincronizar variaciones de grado"** en productos padre multivariación.

---

## Resumen de capas a tocar

**Service — `integrationsService.ts`** (sección nueva, `subsidiaryId` como 1.º argumento):
| # | Función | Verbo + ruta |
|---|---------|--------------|
| 1 | `importTerms` | `POST /import-terms` |
| 2 | `getImportTermsStatus` | `GET /import-terms/status` |
| 3 | `getWooProducts` | `GET /products` |
| 4 | `createQuickProduct` | `POST /quick-products` |
| 5 | `publishProduct` | `POST /products/{product}` |
| 6 | `unpublishProduct` | `DELETE /products/{product}` |
| 7 | `getProductRemoteState` | `GET /products/{product}/remote` |
| 8 | `syncProductPrice` | `POST /products/{product}/sync-price` |
| 9 | `syncProductStock` | `POST /products/{product}/sync-stock` |
| 10 | `publishProductChildren` | `POST /products/{product}/publish-children` |

Replicar el envoltorio `ApiService.fetchData<...>({ url, method, params, data })` y devolver `response.data` (ver líneas 31-38 del service).

**Slice — `woocommerceProductsSlice.ts`** (nuevo):
```ts
interface WooProductsState {
  products: WooProduct[];                 // #3
  remoteState: WooRemoteState | null;     // #7
  importStatus: ImportTermsStatus | null; // #2
  loading: boolean;
  syncingId: number | null;               // feedback por fila (#5,#6,#8,#9,#10)
  error: string | null;
}
```
Reducers síncronos: `setSyncingId`, `clearRemoteState`, `clearError`, `clearWooProducts`.
`extraReducers` con `pending/fulfilled/rejected` y mensajes en español (igual que `unmappedProductsSlice.ts`).

**Wiring:**
- Export en [slices/integrations/index.ts](src/store/slices/integrations/index.ts).
- Registrar reducer en [rootReducer.ts](src/store/rootReducer.ts) con clave `woocommerceProducts` (import ~L36, tipo ~L71-72, reducer ~L110-111).
- Ruta `lazy()` de `WooProductsPage` en [contentRoutes.tsx](src/routes/contentRoutes.tsx) + subpágina en [pages.config.ts](src/config/pages.config.ts) (bloque `integrations.subPages`, L656-689). Authority sugerida `view-integration` / `super-admin` — **confirmar con backend**.

---

## Orden de ejecución sugerido

1. **F1 — Datos:** types + 10 funciones de service + slice + wiring. *(base de todo)*
2. **F2 — Catálogo Woo:** `WooProductsPage` (#3,#6,#7,#8,#9,#10) + ruta/config.
3. **F3 — Quick create real:** conectar `WooCommerceProductTab` (#4).
4. **F4 — Ficha producto:** publicar/despublicar/diagnóstico en el modal (#5,#6,#7).
5. **F5 — Import terms:** `ImportTermsWizard` con polling (#1,#2).
6. **F6 — Pulido:** sync precio automático, estados de carga/error, toasts.

F2–F5 son paralelizables una vez cerrada F1.

---

## Riesgos / a confirmar con backend
- **Operaciones async (#1,#4,#5,#8,#9,#10):** son jobs en cola → la UI muestra *"en cola/publicando"*, no asume éxito inmediato. Refrescar `getWooProducts`/`remote` tras unos segundos.
- **`import-terms`:** ¿`taxonomies` requerido o solo `branch_id`? (discrepancia guía vs Postman).
- **`quick-products`:** formato del campo `image` (URL / base64 / FormData).
- **Booleanos en query (`only_errors`):** normalizar a `1/0`.
- **`subsidiary` vs `branch_id`:** la ruta usa `{subsidiary}`; `branch_id` va en el *body* cuando aplica (#1, #4).
- **Permisos:** validar authorities reales para evitar 403 silenciosos.

---

## Checklist (actualizado 2026-06-18)

### Infraestructura base
- [x] Tipos en `integrations.types.ts` — `WooProduct`, `QuickProductPayload`, `ImportTermsPayload`, `WooRemoteState`, etc.
- [x] `woocommerceProductsSlice.ts` + export en `slices/integrations/index.ts` + registro en `rootReducer.ts`
- [x] Service dedicado: `woocommerceProductsService.ts` (no en `integrationsService.ts` como se planeó originalmente)

### Endpoints por estado

| # | Endpoint | Service | Thunk | UI | Estado |
|---|----------|---------|-------|----|--------|
| 1 | `POST /import-terms` | ✅ `importTerms` | ✅ `runImportTerms` | ✅ `ImportTermsPage.tsx` + wizard | **LISTO** |
| 2 | `GET /import-terms/status` | ✅ `getImportTermsStatus` | ✅ `pollImportTermsStatus` | ✅ Polling 2s en `useImportTerms` | **LISTO** |
| 3 | `GET /products` | ❌ | ❌ | ❌ `WooProductsPage.tsx` no existe, sin ruta ni config | **PENDIENTE** |
| 4 | `POST /quick-products` | ✅ `createQuickProduct` | ✅ `createQuickProductThunk` | ✅ `WooCommerceProductTab.tsx` con dispatch real | **LISTO** |
| 5 | `POST /products/{product}` | ✅ `publishProduct` | ✅ `publishProductThunk` | ✅ `WooCommercePublishPanel.tsx` (switch toggle) | **LISTO** |
| 6 | `DELETE /products/{product}` | ✅ `unpublishProduct` | ✅ `unpublishProductThunk` | ✅ `WooCommercePublishPanel.tsx` (switch toggle) | **LISTO** |
| 7 | `GET /products/{product}/remote` | ✅ `getProductRemoteState` | ✅ `fetchRemoteState` | ✅ Tabla diagnóstico local vs remote | **LISTO** |
| 8 | `POST /products/{product}/sync-price` | ❌ | ❌ | ❌ | **PENDIENTE** |
| 9 | `POST /products/{product}/sync-stock` | ❌ (solo existe sync masivo en `integrationsService`) | ❌ | ❌ | **PENDIENTE** |
| 10 | `POST /products/{product}/publish-children` | ❌ | ❌ | ❌ | **PENDIENTE** |

### Resumen: **7/10 endpoints implementados**

### Pendientes (F2 y F6 del plan)
- [ ] **#3 — `getWooProducts`**: service + thunk + `WooProductsPage.tsx` + ruta en `contentRoutes.tsx` + entrada en `pages.config.ts`
- [ ] **#8 — `syncProductPrice`**: service + thunk + UI (botón rápido en grilla o auto al guardar precio)
- [ ] **#9 — `syncProductStock`**: service + thunk por producto individual (no confundir con el sync masivo existente)
- [ ] **#10 — `publishProductChildren`**: service + thunk + UI (botón "Sincronizar variaciones" en productos padre)

### QA general
- [ ] `pnpm lint` + `pnpm build` (tsc) verdes
- [ ] Verificación manual de los 10 endpoints contra backend
