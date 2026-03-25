# Analisis de productsSlice (estado actual)

Fecha de analisis: 2026-03-16
Archivo base: `src/store/slices/products/productsSlice.ts`

## 1) Donde vive el slice y como se expone

- Registro en store: `src/store/rootReducer.ts` como clave `products`.
- Re-export global: `src/store/index.ts` exporta todo desde `./slices/products/productsSlice`.
- Selector comun en app: `state.products`.

## 2) Thunks y peticiones HTTP definidas en productsSlice

### 2.1 Lectura/listado

1. `fetchProducts`

- Endpoint: `GET /branches/{branchId}/products`
- Query: `page`, `per_page`, filtros serializados (`serializeFilters`)
- Respuesta: lista + meta (normaliza con `normalizeProduct`)
- Estado que toca: `loading`, `items`, `meta`, `stats`, `error`

2. `fetchSubsidiaryProducts`

- Endpoint: `GET /subsidiaries/{subsidiaryId}/products`
- Query: `page`, `per_page`, filtros serializados
- Estado que toca: `loading`, `items`, `meta`, `stats`, `error`

3. `fetchProductsFromMultipleBranches`

- Endpoint: multiples `GET /branches/{branchId}/products` en paralelo
- Query: `page`, `per_page`, filtros serializados
- Logica: combina productos de varias sucursales, recalcula meta unificada
- Estado que toca: `loading`, `items`, `meta`, `stats`, `error`

4. `fetchProductById`

- Endpoint: `GET /branches/{branchId}/products/{productId}`
- Estado que toca: `currentLoading`, `current`, `items[index]`, `currentError`

5. `fetchProductAttributes`

- Endpoint: `GET /branches/{branchId}/products/{productId}/attributes`
- Estado que toca: `attributesLoading`, `attributesError`, `current.attributes_json`, `items[index].attributes_json`

6. `fetchBranchInventorySummary`

- Endpoint: `GET /branches/{branchId}/products/summary`
- Query opcional: `critical_threshold`
- Estado que toca: `inventoryLoading`, `inventoryError`, `stats`, `inventory`, `criticalProducts`

7. `fetchBranchLibraryMedia`

- Endpoint: `GET /branches/{branchId}/library/media`
- Estado que toca: `libraryLoading` (no persiste lista en slice, solo loading/error)

### 2.2 Escritura/actualizacion

8. `createProduct`

- Endpoint: `POST /branches/{branchId}/products`
- Payload: cuerpo permisivo (solo campos definidos)
- Estado que toca: `creating`, `items.unshift`, `stats`, `meta.total`, `error`

9. `updateProduct`

- Endpoint: `PATCH /branches/{branchId}/products/{productId}`
- Payload: `buildUpdatePayload`
- Estado que toca: `updating`, reemplaza en `items`, actualiza `current`, recalcula `stats`, `error`

10. `patchProductAttributes`

- Endpoint: `PATCH /branches/{branchId}/products/{productId}/attributes`
- Payload: `{ set?, unset? }`
- Estado que toca: `attributesUpdating`, `attributesError`, `current.attributes_json`, `items[index].attributes_json`

11. `deleteProduct`

- Endpoint: `DELETE /branches/{branchId}/products/{productId}`
- Estado que toca: `deleting`, elimina de `items`, ajusta `meta.total`, recalcula `stats`, limpia `current` si aplica, `error`

12. `deleteProductAttributes`

- Endpoint: `DELETE /branches/{branchId}/products/{productId}/attributes`
- Query: `path` o `paths[]`
- Estado que toca: `attributesUpdating`, `attributesError`

13. `uploadProductMedia`

- Endpoint: `POST /branches/{branchId}/products/{productId}/media/upload-multiple`
- Payload: `FormData(files[], meta)`
- Extra: valida archivo y convierte a webp antes de subir
- Estado que toca: `mediaUploading`, `mediaError`

14. `attachProductMediaFromLibrary`

- Endpoint: `POST /branches/{branchId}/products/{productId}/media/attach-from-library`
- Payload: `{ library_media_id, collection?, sort_order?, alt_text? }`
- Estado que toca: `mediaUploading`, `mediaError`

15. `deleteProductMedia`

- Endpoint: `DELETE /branches/{branchId}/media/{mediaId}`
- Body: `{ product_id }`
- Estado que toca: `mediaUploading`, `mediaError`, remueve imagen de `current.gallery` si existe

16. `setProductMainImage`

- Flujo compuesto:
    - `GET /branches/{branchId}/products/{productId}`
    - descarga de imagen (fetch con cookies o ApiService blob)
    - `POST /branches/{branchId}/products/{productId}/media/upload-multiple` (collection `main`)
    - `DELETE /branches/{branchId}/media/{mediaId}` (best effort)
    - `GET /branches/{branchId}/products/{productId}` final
- Estado que toca: `updating`, `current`, `mediaError`

## 3) Dispatch reales detectados (uso actual)

## 3.1 En modulo Catalogos > Productos

1. `src/pages/catalogos/productos/hooks/useProductos.ts`

- Dispatch: `fetchProducts`, `fetchBranchInventorySummary`, `createProduct`, `updateProduct`, `deleteProduct`.
- Tambien dispara `fetchMisSucursales`, `fetchBrands`, `fetchCategories`.
- Consume estado de `products`: `items`, `meta`, `stats`, `inventory`, `criticalProducts`, `loading`, `inventoryLoading`, `creating`, `updating`, `deleting`, `error`, `inventoryError`.

2. `src/pages/catalogos/productos/hooks/useProductDetail.ts`

- Dispatch: `fetchProductById`, `fetchProductAttributes`, `updateProduct`, `patchProductAttributes`.
- Tambien dispara `fetchMisSucursales`, `fetchBrands`, `fetchCategories`.
- Consume estado de `products`: `current`, `currentLoading`, `currentError`, `error`, `updating`, `attributesLoading`, `attributesUpdating`, `attributesError`, `items` (para resolver fallback branch).

3. `src/pages/catalogos/productos/hooks/useProductMediaHandlers.ts`

- Dispatch: `uploadProductMedia`, `attachProductMediaFromLibrary`, `fetchProductById` (refresh post subida/attach).
- Nota: importa `fetchBranchLibraryMedia` pero no lo usa aqui.

4. `src/pages/catalogos/productos/ProductDetail.tsx`

- Dispatch directo: `deleteProductMedia`, `fetchProductById`.
- Importa `setProductMainImage`, pero no se invoca en el archivo.

5. `src/components/MediaLibrary/MediaLibraryModal.tsx`

- Dispatch: `fetchBranchLibraryMedia`.
- Manejo de datos: la lista queda en estado local del modal (`items`), no en redux.

## 3.2 En otros modulos (consumen el mismo slice products)

1. `src/pages/dashboards/components/redesign/LatestProductsTable.tsx`

- Dispatch: `fetchProducts`.
- Selector: `state.products` (`items`, `loading`).

2. `src/pages/catalogos/bodegas/WarehouseDetailPage.tsx`

- Dispatch: `fetchProducts`.
- Selector: `state.products` (`items`, `loading`).
- Nota: importa `fetchSubsidiaryProducts` pero no se usa.

3. `src/pages/inventario/transferencias/hooks/useTransferLookups.ts`

- Dispatch: `fetchProducts`.
- Selector: `state.products` completo y luego filtra `items` por branch.

4. `src/pages/comercial/transferencias/components/modals/CreateEditTransferModal.tsx`

- Dispatch: `fetchProducts` (per_page 500) para poblar productos transferibles.
- Usa `unwrap()` y guarda resultado en estado local del modal.

5. `src/pages/garantias/hooks/useWarrantyLookups.ts`

- Dispatch: `fetchProducts` (lazy via `loadProducts`).
- Selector: `state.products.items` para armar opciones.

6. `src/pages/technical-reviews/modo-a-batches/pages/BatchItemReviewPage.tsx`

- Dispatch: `fetchProducts`.
- Selectores: `s.products.items`, `s.products.loading`.

7. `src/pages/technical-reviews/modo-b-items/pages/ItemListPage.tsx`

- Dispatch: `fetchProducts`.
- Selectores: `state.products.items`, `state.products.loading`.

8. `src/pages/technical-reviews/modo-b-items/pages/ItemReviewPage.tsx`

- Dispatch: `fetchProducts`.
- Selectores: `s.products.items`, `s.products.loading`.

9. `src/pages/refactor-technical-review/pages/series/index.tsx`

- Dispatch: `fetchProducts`.
- Selectores: `state.products.items`, `state.products.loading`.

10. `src/pages/refactor-technical-review/pages/revisiones/components/hooks/useItemReview.ts`

- Dispatch: `fetchProducts`.
- Selectores: `s.products.items`, `s.products.loading`.

## 4) Thunks definidos pero sin uso real (dispatch no encontrado)

1. `fetchSubsidiaryProducts`

- Solo aparece definido en el slice y como import sin uso en `WarehouseDetailPage.tsx`.

2. `fetchProductsFromMultipleBranches`

- Definido en slice y con reducers, pero sin dispatch detectado en app.

3. `deleteProductAttributes`

- Definido y con reducers, sin dispatch detectado.

4. `setProductMainImage`

- Definido y con reducers.
- En UI esta importado en `ProductDetail.tsx`, pero no hay dispatch.

5. `clearProductsError` (action de reducer)

- Exportada por slice, sin uso detectado por dispatch.

## 5) Estado del slice `products` que realmente se consume

Campos con consumo claro en UI:

- `items`
- `loading`
- `meta`
- `stats`
- `inventory`
- `criticalProducts`
- `current`
- `currentLoading`
- `currentError`
- `error`
- `creating`
- `updating`
- `deleting`
- `attributesLoading`
- `attributesUpdating`
- `attributesError`

Campos con consumo indirecto / limitado:

- `libraryLoading` (flujo media library)
- `mediaUploading`, `mediaError` (flujo media detalle)
- `inventoryError` (catalogo productos)

## 6) Hallazgos tecnicos para refactor

1. Slice compartido por muchos modulos distintos

- `fetchProducts` se usa en dashboard, transferencias, garantias, technical reviews, bodegas y catalogos.
- Riesgo: un modulo pisa `items/meta/stats` de otro modulo porque todos escriben en el mismo estado global `products`.

2. Mezcla de responsabilidades en un solo slice

- Catalogo CRUD + resumen inventario + atributos dinamicos + media library + operaciones de imagen principal.
- Alta acoplacion y superficie de error.

3. Media library no persiste data en redux

- `fetchBranchLibraryMedia` solo actualiza `libraryLoading`; los datos quedan en estado local del modal.
- Puede simplificarse moviendo esa llamada fuera del slice o completarse guardando cache en store.

4. Codigo potencialmente muerto

- `fetchSubsidiaryProducts`, `fetchProductsFromMultipleBranches`, `deleteProductAttributes`, `setProductMainImage`, `clearProductsError` sin uso real detectado.

5. Importes sin uso observados

- `setProductMainImage` en `ProductDetail.tsx`.
- `fetchSubsidiaryProducts` en `WarehouseDetailPage.tsx`.
- `fetchBranchLibraryMedia` en `useProductMediaHandlers.ts`.

## 7) Sugerencia de refactor (orden recomendado)

1. Separar por dominio

- `productsCatalogSlice` (CRUD/listado detalle catalogo)
- `productsInventorySlice` (summary/stats/critical)
- `productMediaSlice` (upload/attach/delete/library)

2. Evitar colisiones de listado

- Mantener cache por contexto de consulta (ejemplo: clave por `branchId + filtros + modulo`) o usar RTK Query para caché por endpoint/args.

3. Depurar API no usada

- Marcar y eliminar gradualmente thunks sin dispatch real (primero con deprecation y logs).

4. Estandarizar patron de carga

- Definir hooks por feature que no compartan el mismo `items` global cuando el modulo necesita datasets distintos.

---

Si quieres, en una segunda iteracion te puedo generar una matriz de impacto (archivo por archivo) para migrar sin romper flujos y con orden de PRs sugerido.
