# Technical Reviews - Árbol de Archivos

```
src/store/slices/technicalReviews/
│
├── 📁 slice/                                    # Slice Unificado + Selectores
│   ├── 📄 technicalReviewsSlice.ts              680 líneas | Slice Redux con extraReducers
│   └── 📄 selectors.ts                          140 líneas | 26 selectores organizados
│
├── 📁 thunks/                                   # Thunks por Dominio
│   ├── 📄 batchesThunks.ts                      200 líneas | 6 thunks de lotes
│   │   ├── fetchBatches()                       GET /batches
│   │   ├── fetchBatchById()                     GET /batches/{id}
│   │   ├── fetchBatchItems()                    GET /batches/{id}/items
│   │   ├── createBatch()                        POST /batches
│   │   ├── updateBatch()                        PUT /batches/{id}
│   │   └── deleteBatch()                        DELETE /batches/{id}
│   │
│   ├── 📄 itemsThunks.ts                        180 líneas | 5 thunks de series
│   │   ├── fetchItems()                         GET /items
│   │   ├── fetchItemDetail()                    GET /items/{id}
│   │   ├── createItem()                         POST /items
│   │   ├── updateItem()                         PUT /items/{id}
│   │   └── deleteItem()                         DELETE /items/{id}
│   │
│   ├── 📄 reviewThunks.ts                       220 líneas | 5 thunks de revisión
│   │   ├── startReview()                        POST /items/{id}/start-review
│   │   ├── updateItemDetails()                  PUT /items/{id}/update-details
│   │   ├── completeReview()                     POST /items/{id}/complete-review
│   │   ├── approveItem()                        POST /items/{id}/approve
│   │   └── getSuggestedGrade()                  GET /items/{id}/suggest-grade
│   │
│   ├── 📄 traceabilityThunks.ts                 280 líneas | 7 thunks de trazabilidad
│   │   ├── changeCommercialStatus()             POST /items/{id}/change-status
│   │   ├── reserveItem()                        POST /items/{id}/reserve
│   │   ├── releaseReservation()                 POST /items/{id}/release-reservation
│   │   ├── markAsSold()                         POST /items/{id}/mark-as-sold
│   │   ├── transferItem()                       POST /items/{id}/transfer
│   │   ├── getTraceabilityHistory()             GET /items/{id}/traceability
│   │   └── getAvailableForSale()                GET /available-for-sale
│   │
│   └── 📄 validationThunks.ts                   250 líneas | 6 thunks de validación
│       ├── fetchValidationRules()               GET /validation-rules
│       ├── fetchValidationRulesByType()         GET /validation-rules/{type}
│       ├── validateField()                      POST /validate-field
│       ├── suggestGrade()                       POST /suggest-grade
│       ├── getMyCommonErrors()                  GET /my-common-errors
│       └── getErrorStatistics()                 GET /error-statistics
│
├── 📄 types.ts                                  283 líneas | Tipos TypeScript
│   ├── ReviewStatus                             Union type (4 valores)
│   ├── CommercialStatus                         Union type (7 valores)
│   ├── EquipmentType                            Union type (5 valores)
│   ├── IBatch                                   Interface (10 propiedades)
│   ├── IItem                                    Interface (15+ propiedades)
│   ├── IValidationRules                         Interface anidada
│   ├── ListMeta                                 Interface de paginación
│   ├── TechnicalReviewsState                    Interface del estado global
│   └── 12+ interfaces de payloads               Payloads para thunks
│
├── 📄 index.ts                                  130 líneas | Barrel Exports
│   ├── Export: technicalReviewsReducer          Default reducer
│   ├── Export: Actions                          4 actions síncronas
│   ├── Export: Types                            20+ tipos e interfaces
│   ├── Export: Thunks                           29 thunks organizados
│   └── Export: Selectors                        26 selectores
│
├── 📚 Documentación/
│   ├── 📄 README_MODULAR.md                     ~600 líneas | Guía completa
│   ├── 📄 MIGRATION_SUMMARY.md                  ~400 líneas | Resumen de migración
│   ├── 📄 QUICK_REFERENCE.md                    ~300 líneas | Cheat sheet
│   └── 📄 FILE_TREE.md                          Este archivo
│
└──  [DEPRECATED]/                             # NO USAR - Solo referencia
    ├── 📄 technicalReviewsThunks.ts             638 líneas | Archivo monolítico antiguo
    ├── 📄 technicalReviewsSlice.ts              554 líneas | Slice antiguo
    ├── 📄 README.md                             Documentación v1.0
    ├── 📄 IMPLEMENTATION_SUMMARY.md             Resumen v1.0
    ├── 📄 RESUMEN_FINAL.md                      Resumen en español v1.0
    └── 📄 QUICK_START.md                        Guía rápida v1.0
```

## 📊 Métricas del Árbol

### Archivos Activos

```
Slice:          2 archivos     820 líneas
Thunks:         5 archivos   1,130 líneas
Types:          1 archivo      283 líneas
Barrel:         1 archivo      130 líneas
Documentación:  4 archivos   1,300 líneas
─────────────────────────────────────────
TOTAL:         13 archivos   3,663 líneas
```

### Archivos Deprecados

```
Código:         2 archivos   1,192 líneas
Docs:           4 archivos     800 líneas
─────────────────────────────────────────
TOTAL:          6 archivos   1,992 líneas
```

## 🎯 Mapa de Navegación

### Buscar Operaciones de Lotes

```
└─ thunks/batchesThunks.ts
```

### Buscar Operaciones de Series

```
└─ thunks/itemsThunks.ts
```

### Buscar Flujo de Revisión

```
└─ thunks/reviewThunks.ts
```

### Buscar Estados Comerciales

```
└─ thunks/traceabilityThunks.ts
```

### Buscar Validaciones

```
└─ thunks/validationThunks.ts
```

### Buscar Selectores

```
└─ slice/selectors.ts
```

### Buscar Tipos

```
└─ types.ts
```

### Ver Cómo Importar

```
└─ index.ts
```

## 🔍 Búsqueda Rápida

### Por Endpoint HTTP

- `GET /batches` → `thunks/batchesThunks.ts` → `fetchBatches()`
- `POST /items` → `thunks/itemsThunks.ts` → `createItem()`
- `POST /items/{id}/start-review` → `thunks/reviewThunks.ts` → `startReview()`
- `POST /items/{id}/reserve` → `thunks/traceabilityThunks.ts` → `reserveItem()`
- `GET /validation-rules` → `thunks/validationThunks.ts` → `fetchValidationRules()`

### Por Operación

- Crear lote → `batchesThunks.ts:createBatch()`
- Listar series → `itemsThunks.ts:fetchItems()`
- Iniciar revisión → `reviewThunks.ts:startReview()`
- Reservar equipo → `traceabilityThunks.ts:reserveItem()`
- Validar campo → `validationThunks.ts:validateField()`

### Por Selector

- Ver lotes → `selectors.ts:selectBatches`
- Ver series → `selectors.ts:selectItems`
- Ver loading global → `selectors.ts:selectIsLoading`
- Ver errores → `selectors.ts:selectHasErrors`

### Por Tipo

- Estado de revisión → `types.ts:ReviewStatus`
- Estado comercial → `types.ts:CommercialStatus`
- Tipo de equipo → `types.ts:EquipmentType`
- Entidad lote → `types.ts:IBatch`
- Entidad serie → `types.ts:IItem`

## 📐 Arquitectura Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENTES REACT                         │
│  (Formularios, Listas, Detalles, etc.)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │ useDispatch / useSelector
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                   index.ts (BARREL)                          │
│  Re-exporta: Reducer, Actions, Thunks, Selectors, Types     │
└───────┬──────────────────────────────────────┬──────────────┘
        │                                      │
        ↓                                      ↓
┌──────────────────────┐            ┌─────────────────────────┐
│   slice/             │            │   thunks/               │
│   ┌──────────────┐   │            │   ┌─────────────────┐   │
│   │ slice.ts     │◄──┼────────────┼───┤ batchesThunks   │   │
│   │ (Reducer)    │   │            │   ├─────────────────┤   │
│   ├──────────────┤   │            │   │ itemsThunks     │   │
│   │ selectors.ts │   │            │   ├─────────────────┤   │
│   │ (Accessors)  │   │            │   │ reviewThunks    │   │
│   └──────────────┘   │            │   ├─────────────────┤   │
└──────────────────────┘            │   │ traceability    │   │
                                    │   ├─────────────────┤   │
                                    │   │ validation      │   │
                                    │   └─────────────────┘   │
                                    └──────────┬──────────────┘
                                               │ ApiService
                                               ↓
                                    ┌─────────────────────────┐
                                    │    BACKEND API          │
                                    │  /api/branches/{branch} │
                                    │  /technical-reviews/*   │
                                    └─────────────────────────┘
```

## 🧭 Flujo de Datos

### READ (Lectura)

```
Component
   │ useSelector(selectBatches)
   ↓
selectors.ts
   │ state.technicalReviews.batches
   ↓
technicalReviewsSlice
   │ batches: IBatch[]
   └─ Populated by fetchBatches.fulfilled
```

### WRITE (Escritura)

```
Component
   │ dispatch(createBatch(...))
   ↓
batchesThunks.ts
   │ createBatch thunk
   ↓
ApiService
   │ POST /api/branches/1/technical-reviews/batches
   ↓
Backend API
   │ Response: { data: IBatch }
   ↓
technicalReviewsSlice
   │ createBatch.fulfilled
   │ state.batches.unshift(action.payload)
   ↓
Component (re-render)
```

## 🎓 Patrones de Uso

### Pattern 1: Lista Simple

```typescript
Component → dispatch(fetchX) → useSelector(selectX) → Render
```

### Pattern 2: Detalle con Loading

```typescript
Component → dispatch(fetchById) → useSelector(selectLoading) → Conditional Render
```

### Pattern 3: Formulario CRUD

```typescript
Form → dispatch(createX) → useSelector(selectCreating) → Disable/Enable Button
```

### Pattern 4: Workflow Multi-Paso

```typescript
Component → dispatch(step1) → await → dispatch(step2) → await → dispatch(step3)
```

### Pattern 5: Validación Before Submit

```typescript
Form → dispatch(validateField) → Check result → dispatch(createX)
```

## 📦 Dependencias Externas

```
technicalReviews/
   ↓ imports
@/services/ApiService         → HTTP client wrapper
@/store/rootReducer           → RootState type
@/utils/helpers               → ep() para endpoints
```

## 🔗 Enlaces Rápidos

- **Guía Completa**: `README_MODULAR.md`
- **Migración**: `MIGRATION_SUMMARY.md`
- **Cheat Sheet**: `QUICK_REFERENCE.md`
- **Este Árbol**: `FILE_TREE.md`

---

**Última Actualización**: 2024-01-19  
**Versión**: 2.0.0 (Estructura Modular)  
**Total de Thunks**: 29  
**Total de Selectores**: 26  
**Total de Tipos**: 20+
