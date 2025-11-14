# Technical Reviews - Pages Structure

---

## 📚 DOCUMENTACIÓN PRINCIPAL

### ⭐ Lee estos documentos PRIMERO:

- **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** → 📊 Estado actual (69%), métricas, próximos pasos
- **[STRUCTURE_ANALYSIS.md](./STRUCTURE_ANALYSIS.md)** → 🔍 Análisis detallado: qué existe vs qué falta
- **[TODO_CRITICAL.md](./TODO_CRITICAL.md)** → ✅ Plan de 3 días para completar el módulo

---

## 📁 Estructura de Páginas

```
src/pages/technical-reviews/
├── index.tsx                           # 🏠 Hub principal (selector de modos)
├── batches/                            # 📦 Modo A: Gestión por Lotes
│   ├── index.tsx                       # Listado de lotes
│   ├── create.tsx                      # Crear nuevo lote
│   └── [batchId]/                      # Detalle de lote específico
│       ├── index.tsx                   # Vista de lote con tabs por tipo
│       └── [itemId].tsx                # Revisión 3 pasos (dentro de lote)
├── items/                              # 🌍 Modo B: Vista Global
│   ├── index.tsx                       # Listado global de items
│   └── [itemId].tsx                    # Revisión 3 pasos (sin lote)
├── validation/                         # ⚙️ Configuración (TODO)
│   └── rules.tsx                       # Gestión de reglas de validación
└── components/                         # 🧩 Componentes compartidos (TODO)
    ├── batches/                        # Componentes de lotes
    ├── items/                          # Componentes de items
    ├── forms/                          # Formularios por tipo de equipo
    ├── modals/                         # Modales (aprobar, cambiar estado, etc.)
    └── shared/                         # Componentes compartidos
```

---

## 🎯 Páginas Implementadas

### 1. **Hub Principal** (`index.tsx`)

**Ruta:** `/technical-reviews`

**Descripción:** Página de entrada que permite seleccionar entre dos modos:

- **Modo A:** Gestión por lotes (notebooks, desktops, etc. agrupados)
- **Modo B:** Vista global de items (sin agrupar por lote)

**Características:**

- 2 cards grandes con iconos descriptivos
- Navegación a `/batches` o `/items`
- Información clara de cada modo

---

### 2. **Listado de Lotes** (`batches/index.tsx`)

**Ruta:** `/technical-reviews/batches`

**Descripción:** Tabla paginada de todos los lotes con filtros avanzados.

**Características:**

- ✅ Búsqueda por número de serie (como CTRL+F en Excel)
- ✅ Filtros: bodega, estado, año, fechas
- ✅ Paginación con metadata (current_page, last_page, total)
- ✅ Botón "Crear Lote" → `/batches/create`
- ✅ Clic en lote → `/batches/[batchId]`

**Redux:**

- `fetchBatches()` con params
- `selectBatches`, `selectBatchesMeta`, `selectBatchesLoading`

---

### 3. **Crear Lote** (`batches/create.tsx`)

**Ruta:** `/technical-reviews/batches/create`

**Descripción:** Formulario para crear un nuevo lote.

**Campos:**

- Bodega (select) \*
- Proveedor (select) \*
- Fecha de Entrada (date) \*
- Cantidad Esperada (number) \*
- Año (number)
- Comentarios (textarea)

**Redux:**

- `createBatch()` → navega a `/batches/[newBatchId]`

---

### 4. **Detalle de Lote** (`batches/[batchId]/index.tsx`)

**Ruta:** `/technical-reviews/batches/:batchId`

**Descripción:** Vista de un lote con tabs por tipo de equipo.

**Características:**

- ✅ Información general del lote (bodega, proveedor, fecha, etc.)
- ✅ **5 Tabs:** Notebooks | Desktops | All-in-One | Docking | Monitores
- ✅ Cada tab muestra items filtrados por `equipment_type`
- ✅ Botón "Agregar Equipo" → `/batches/[batchId]/create`
- ✅ Clic en item → `/batches/[batchId]/[itemId]`

**Redux:**

- `fetchBatchById()` → `selectCurrentBatch`
- `fetchBatchItems({ batchId, type })` → `selectBatchItems`

---

### 5. **Revisión en Lote** (`batches/[batchId]/[itemId].tsx`)

**Ruta:** `/technical-reviews/batches/:batchId/:itemId`

**Descripción:** Flujo de revisión técnica de 3 pasos dentro de un lote.

**Flujo:**

1. **Step 1: Información Básica**
    - Serial number, producto, tipo de equipo
    - `startReview({ batch_id, serial_number, product_id, equipment_type })`
2. **Step 2: Revisión Completa**
    - Formulario específico por tipo (notebook, desktop, etc.)
    - `updateItemDetails({ itemId, data })` (repeatable)
    - `completeReview({ itemId })` → obtiene grade automático
3. **Step 3: Calificación Automática**
    - Muestra grade calculado
    - `approveItem({ itemId })` → finaliza y vuelve al listado

**Características:**

- ✅ Progress bar visual (3 pasos con iconos)
- ✅ Navegación back/forward entre pasos
- ✅ Resumen de revisión en Step 3
- ✅ TODO: Implementar formularios por tipo de equipo

**Redux:**

- `startReview()`, `updateItemDetails()`, `completeReview()`, `approveItem()`
- `selectItemsLoading`

---

### 6. **Listado Global de Items** (`items/index.tsx`)

**Ruta:** `/technical-reviews/items`

**Descripción:** Vista global de todos los items sin agrupar por lote (Modo B).

**Características:**

- ✅ Búsqueda por número de serie
- ✅ Filtros: tipo de equipo, estado de revisión, estado comercial
- ✅ Tabla con columnas: ID, Serie, Tipo, Producto, Lote, Estados
- ✅ Muestra "Sin lote" para items sin batch_id
- ✅ Paginación
- ✅ Botón "Nueva Revisión" → `/items/create`
- ✅ Clic en item → `/items/[itemId]`

**Redux:**

- `fetchItems()` con params
- Selector pendiente: `selectItems`, `selectItemsMeta`

---

### 7. **Revisión Individual** (`items/[itemId].tsx`)

**Ruta:** `/technical-reviews/items/:itemId`

**Descripción:** Mismo flujo de 3 pasos pero para items sin lote.

**Diferencia con Modo A:**

- NO incluye `batch_id` en `startReview()`
- Muestra "Revisión individual (sin lote)" en header
- Vuelve a `/items` al finalizar

**Flujo:**

1. Step 1: Basic Info
2. Step 2: Full Review
3. Step 3: Grading + Approve

**Redux:** Mismos thunks que Modo A

---

## 🔄 Flujo de Revisión de 3 Pasos

```
┌─────────────────────────────────────────────────────────────┐
│                    STEP 1: BASIC INFO                        │
├─────────────────────────────────────────────────────────────┤
│  • Serial Number (input)                                     │
│  • Product (select)                                          │
│  • Equipment Type (5 buttons: notebook, desktop, aio, etc.) │
│                                                              │
│  ➡️ startReview() → crea item + pasa a Step 2              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  STEP 2: FULL REVIEW                         │
├─────────────────────────────────────────────────────────────┤
│  • Formulario específico según equipment_type:              │
│    - NotebookForm (pantalla, teclado, batería, etc.)        │
│    - DesktopForm (gabinete, fuente, RAM, etc.)              │
│    - AioForm (pantalla táctil, cámara, etc.)                │
│    - DockingForm (puertos, alimentación, etc.)              │
│    - MonitorForm (panel, conectores, etc.)                  │
│                                                              │
│  ➡️ updateItemDetails() → guarda datos (repeatable)         │
│  ➡️ completeReview() → calcula grade → pasa a Step 3       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 STEP 3: AUTOMATIC GRADING                    │
├─────────────────────────────────────────────────────────────┤
│  • Muestra grade calculado automáticamente (A, B, C, etc.)  │
│  • Resumen de la revisión                                    │
│  • Opción de volver a Step 2 para modificar                 │
│                                                              │
│  ➡️ approveItem() → finaliza y vuelve al listado           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Componentes a Implementar (TODO)

### `components/batches/`

- `BatchList.tsx` - Tabla reutilizable de lotes
- `BatchDetail.tsx` - Card con info del lote
- `BatchTabs.tsx` - Tabs de tipos de equipos

### `components/items/`

- `ItemList.tsx` - Tabla reutilizable de items
- `ItemDetail.tsx` - Card con info del item
- `ReviewSteps/` - Componentes del flujo de 3 pasos

### `components/forms/`

- `NotebookForm.tsx` - Formulario específico para notebooks
- `DesktopForm.tsx` - Formulario específico para desktops
- `AioForm.tsx` - Formulario específico para all-in-one
- `DockingForm.tsx` - Formulario específico para dockings
- `MonitorForm.tsx` - Formulario específico para monitores
- `FormField.tsx` - Campo genérico con validación

### `components/modals/`

- `ApproveModal.tsx` - Modal de confirmación de aprobación
- `RejectModal.tsx` - Modal de rechazo con motivo
- `ChangeStatusModal.tsx` - Cambiar estado comercial
- `ReserveModal.tsx` - Reservar item con cliente

### `components/shared/`

- `SearchSerialInput.tsx` - Input de búsqueda por serie (CTRL+F style)
- `StatusBadge.tsx` - Badge de estado (review_status, commercial_status)
- `ReviewProgress.tsx` - Barra de progreso del flujo de 3 pasos
- `ValidationSummary.tsx` - Resumen de validaciones aplicadas
- `GradeDisplay.tsx` - Visualización de calificación automática

---

## 🎨 Convenciones de UI

### Colores por Estado (review_status)

- `pending`: 🟡 Yellow
- `in_progress`: 🔵 Blue
- `completed`: 🟢 Green
- `approved`: ✅ Green (dark)
- `rejected`: 🔴 Red

### Colores por Estado Comercial (commercial_status)

- `received`: ⚪ Gray
- `under_review`: 🔵 Blue
- `available_for_sale`: 🟢 Green
- `reserved`: 🟠 Orange
- `sold`: 🟣 Purple
- `returned`: 🔴 Red

### Iconos por Tipo de Equipo

- `notebook`: `HeroComputerDesktop`
- `desktop`: `HeroServerStack`
- `aio`: `HeroDeviceTablet`
- `docking`: `HeroCube`
- `monitor`: `HeroTv`

---

## 🔌 Integración con Redux

### Thunks Utilizados

```typescript
// Batches
fetchBatches({ branch, ...params });
fetchBatchById({ branch, batchId });
createBatch({ branch, data });
updateBatch({ branch, batchId, data });
deleteBatch({ branch, batchId });

// Items
fetchItems({ branch, params });
fetchBatchItems({ branch, batchId, params });
fetchItemById({ branch, itemId });

// Review Workflow
startReview({ branch, data });
updateItemDetails({ branch, itemId, data });
completeReview({ branch, itemId });
approveItem({ branch, itemId });
rejectItem({ branch, itemId, data });

// Traceability
changeCommercialStatus({ branch, itemId, data });
reserveItem({ branch, itemId, data });
sellItem({ branch, itemId, data });
returnItem({ branch, itemId, data });

// Validation
fetchValidationRules({ branch });
applyValidationRules({ branch, itemId, data });
updateValidationRule({ branch, ruleId, data });
```

### Selectores Utilizados

```typescript
// Batches
selectBatches
selectBatchesMeta
selectBatchesLoading
selectBatchesError
selectCurrentBatch

// Items
selectItems (TODO: crear)
selectItemsMeta (TODO: crear)
selectItemsLoading
selectItemsError
selectBatchItems (TODO: crear - items de un batch específico)

// Validation
selectValidationRules
selectValidationLoading
```

---

## 📋 Pendientes

### Páginas Faltantes

- [ ] `validation/rules.tsx` - Gestión de reglas de validación
- [ ] `batches/[batchId]/create.tsx` - Crear item dentro de lote (opcional)

### Componentes Faltantes

- [ ] Todos los componentes en `components/` (ver sección anterior)

### Funcionalidades Pendientes

- [ ] Formularios específicos por tipo de equipo
- [ ] Carga dinámica de bodegas y proveedores
- [ ] Selectores `selectItems` y `selectItemsMeta`
- [ ] Integración con contexto de usuario para `branchId`
- [ ] Sistema de notificaciones (success/error)
- [ ] Validación de formularios en todos los pasos
- [ ] Exportación de datos (Excel, PDF)
- [ ] Filtros avanzados en listados (fechas, rangos, etc.)

### Mejoras UX

- [ ] Loading states en todos los thunks
- [ ] Error handling + toasts
- [ ] Confirmación antes de eliminar
- [ ] Búsqueda con debounce
- [ ] Skeleton loaders
- [ ] Infinite scroll (opcional)

---

## 🚀 Rutas Configuradas

```typescript
// En src/routes/ agregar:
<Route path="technical-reviews">
  <Route index element={<TechnicalReviewsHub />} />

  {/* Modo A: Batches */}
  <Route path="batches">
    <Route index element={<BatchesList />} />
    <Route path="create" element={<CreateBatch />} />
    <Route path=":batchId">
      <Route index element={<BatchDetail />} />
      <Route path=":itemId" element={<ItemReview />} />
    </Route>
  </Route>

  {/* Modo B: Items */}
  <Route path="items">
    <Route index element={<ItemsList />} />
    <Route path=":itemId" element={<ItemReviewStandalone />} />
  </Route>

  {/* Validation */}
  <Route path="validation">
    <Route path="rules" element={<ValidationRules />} />
  </Route>
</Route>
```

---

## 📖 Documentación Relacionada

- **Redux Slices:** `src/store/slices/technicalReviews/docs/INDEX.md`
- **API Endpoints:** Ver comentarios en thunks
- **Interfaces:** `src/interface/technicalReviews.interface.ts`
- **Guía de Usuario:** (TODO)

---

**Creado:** $(date)  
**Estado:** ✅ Estructura base completa - Faltan componentes y formularios específicos  
**Última actualización:** $(date)
