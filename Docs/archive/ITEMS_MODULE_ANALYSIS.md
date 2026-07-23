# 📊 ANÁLISIS COMPLETO: MÓDULO ITEMS - REVISIONES TÉCNICAS

> **Fecha:** 8 de noviembre de 2025  
> **Propósito:** Documentar exhaustivamente todo lo relacionado con la gestión de ITEMS (series) en el módulo de revisiones técnicas, sin modificar nada relacionado con batches.

---

## 📁 ESTRUCTURA GENERAL DEL MÓDULO ITEMS

### 1. **Páginas Principales**

```
src/pages/technical-reviews/
├── items/
│   ├── index.tsx                    # ✅ ItemsListPage - Vista global con filtros
│   └── [itemId].tsx                 # ✅ ItemReviewStandalonePage - Flujo 3 pasos
```

---

## 🎯 PÁGINA: `items/index.tsx` (ItemsListPage)

### **Descripción**

Vista global de todos los equipos sin agrupar por lote (Modo B).

### **Características Implementadas**

- ✅ Búsqueda por número de serie o producto con debounce (400ms)
- ✅ Filtros avanzados:
    - Tipo de equipo (notebook, desktop, aio, docking, monitor)
    - Estado de revisión (pending, in_review, reviewed, approved)
    - Bodega
    - Cliente/Proveedor
    - Grado (A, B, C, D, M)
- ✅ Botón "Limpiar filtros"
- ✅ Botón "Nueva Revisión" → abre `CreateReviewModal`
- ✅ Paginación integrada con metadata del backend
- ✅ Tabla responsive con columnas:
    - Serie
    - Producto
    - Tipo
    - Estado Revisión
    - Grado
    - Bodega
    - Última actualización
    - Acciones

### **Redux Utilizado**

```typescript
// Selectores
const { items, itemsMeta } = useAppSelector((state) => state.technicalReviews);
const loading = useAppSelector(selectItemsLoading);
const error = useAppSelector(selectItemsError);

// Thunks
dispatch(fetchItems({ branchId, params: queryParams }));
```

### **Servicios Externos**

- `fetchProducts()` - Cargar productos con serial_tracking
- `fetchWarehouses()` - Cargar bodegas activas
- `fetchCustomerSuppliers()` - Cargar clientes/proveedores

### **Componentes Utilizados**

- `ItemList` - Tabla reutilizable de series
- `CreateReviewModal` - Modal para crear nueva revisión

### **Navegación**

- Click en item → `/technical-reviews/items/${itemId}`

---

## 🔄 PÁGINA: `items/[itemId].tsx` (ItemReviewStandalonePage)

### **Descripción**

Flujo completo de revisión técnica en 3 pasos para items sin lote.

### **Características Implementadas**

#### **Progress Steps (navegación visual)**

```typescript
const steps = [
	{ id: 'basic', label: 'Información Básica', icon: 'HeroDocumentText' },
	{ id: 'review', label: 'Revisión Completa', icon: 'HeroClipboardDocumentCheck' },
	{ id: 'grading', label: 'Calificación', icon: 'HeroCheckBadge' },
];
```

- ✅ Navegación click-to-step (si no está aprobado)
- ✅ Indicadores visuales (completado, activo, pendiente)
- ✅ Bloqueado si item está aprobado

#### **STEP 1: Basic Info**

**Campos:**

- Serial Number (text) ✅
- Product ID (select) - productos con serial_tracking ✅
- Equipment Type (5 botones: notebook, desktop, aio, docking, monitor) ✅
- Warehouse ID (select) ✅
- Customer Supplier ID (select, opcional) ✅
- Batch ID (select de lotes abiertos) ✅

**Lógica Especial:**

- Si viene con `batchId` en path/query → modo lote (preselecciona bodega y tipo)
- Si NO viene batch_id → busca lotes abiertos con `status=open`
- Detecta automáticamente lote "Manual" para revisiones sueltas
- Alerta si no existe lote Manual

**Acciones:**

```typescript
handleStep1Submit() {
  // 1. saveBasicInfo() → crea item
  // 2. startReview() → cambia review_status a in_review
  // 3. setCurrentStep('review')
}
```

#### **STEP 2: Full Review**

**Componente:** `Step2FullReview`

**Formularios según tipo:**

- `NotebookForm` - Pantalla, teclado, batería, touchpad, cámara, RAM, almacenamiento, etc.
- `DesktopForm` - Gabinete, fuente, RAM, almacenamiento, puertos
- `AioForm` - Pantalla táctil, cámara, RAM, almacenamiento
- `DockingForm` - Puertos, alimentación
- `MonitorForm` - Panel, conectores

**Características:**

- ✅ Auto-save con hook `useAutoSaveReview` (30s de inactividad)
- ✅ Guardado manual con botón "Guardar"
- ✅ Indicador de estado (Guardando, Cambios sin guardar, Guardado)
- ✅ Validación de campos obligatorios antes de finalizar
- ✅ Botón "Finalizar Revisión" → `completeReview()` → calcula grado

**Campos Requeridos por Tipo:**

- notebook/desktop/aio: Marca, Modelo, Procesador, RAM, Almacenamiento
- docking/monitor: Marca, Modelo

#### **STEP 3: Automatic Grading**

**Componente:** `Step3GradeReview`

**Características:**

- ✅ Visualización del grado sugerido (A, B, C, D)
- ✅ Confianza % con barra de progreso
- ✅ Desglose de puntuación (breakdown)
- ✅ Resumen de revisión
- ✅ Botón "Recalcular Grado" (llama `reopenReview()` + `completeReview()`)
- ✅ Botón "Modificar Revisión" (vuelve a Step 2 en modo in_review)
- ✅ Opción de modificar grado manualmente con justificación
- ✅ Botón "Aceptar y Aprobar" → `approveItem()`

**Acciones:**

```typescript
handleRecalculateGrade() {
  // 1. reopenReview() → review_status: in_review
  // 2. completeReview() → calcula nuevo grado
  // 3. Actualiza UI con nuevo grado
}

handleModifyReview() {
  // 1. reopenReview() → review_status: in_review
  // 2. onBack() → vuelve a Step 2
}

handleAcceptSuggestion() {
  // approveItem({ grade: suggestedGrade })
}

handleManualApprove() {
  // approveItem({ grade: manualGrade, override_suggestion: true, override_reason })
}
```

### **Redux Utilizado**

```typescript
// Selectores
const selectedItemStore = useAppSelector(selectSelectedItem);
const loading = useAppSelector(selectItemsLoading);
const selectedBatch = useAppSelector(selectSelectedBatch);

// Thunks
dispatch(fetchItemDetail({ branchId, itemId }));
dispatch(fetchBatchById({ branchId, batchId })); // Si viene con batch
dispatch(createItem({ branchId, data }));
dispatch(startReview({ branchId, itemId }));
dispatch(updateItemDetails({ branchId, itemId, data, equipmentType }));
dispatch(completeReview({ branchId, itemId }));
dispatch(reopenReview({ branchId, itemId }));
dispatch(approveItem({ branchId, itemId, data }));
```

### **Hooks Utilizados**

- `useAutoSaveReview()` - Auto-guardado en Step 2
    - `saveBasicInfo()` - Crear item
    - `markDetailsChanged()` - Marcar cambios
    - `saveDetailsNow()` - Guardar inmediatamente
    - `resetDirty()` - Resetear estado

---

## 🧩 COMPONENTES REUTILIZABLES

### 1. **ItemList** (`components/items/ItemList.tsx`)

**Descripción:** Tabla responsive de series con paginación.

**Props:**

```typescript
interface ItemListProps {
	items: IItem[];
	loading: boolean;
	meta: ListMeta;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onItemClick?: (itemId: number) => void;
	baseUrl?: string;
	emptyMessage?: string;
	variant?: 'batch' | 'global';
}
```

**Características:**

- ✅ 2 variantes (batch / global)
- ✅ Columnas dinámicas según variante
- ✅ Badges de estado (review_status, commercial_status)
- ✅ Badges de grado (grade, suggested_grade)
- ✅ Iconos por tipo de equipo
- ✅ Paginación avanzada con ellipsis
- ✅ Selector de items por página (10, 20, 50, 100)
- ✅ Loading state con skeleton
- ✅ Empty state

**Helpers:**

```typescript
extractValue(value: any): string | null
resolveEquipmentTypeMeta(equipmentType: any): { value, label, icon }
formatDateTime(value?: string | null): string
```

---

### 2. **ItemDetail** (`components/items/ItemDetail.tsx`)

**Descripción:** Cabecera con información clave de la serie.

**Props:**

```typescript
interface ItemDetailProps {
	item: IItem;
	loading?: boolean;
	onEditClick?: () => void;
	onApproveClick?: () => void;
	onChangeStatusClick?: () => void;
	showActions?: boolean;
}
```

**Características:**

- ✅ Serial number destacado
- ✅ Badges de estado
- ✅ Grid con: Tipo, Grado Actual, Grado Sugerido, Producto
- ✅ Desglose de calificación (breakdown)
- ✅ Botones de acción condicionales:
    - Editar Revisión (si no está approved)
    - Aprobar (si está reviewed)
    - Cambiar Estado (si está approved y no sold)

---

### 3. **CreateReviewModal** (`components/items/CreateReviewModal.tsx`)

**Descripción:** Modal para crear revisión individual.

**Props:**

```typescript
interface CreateReviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	branchId: number | null;
	productOptions: TSelectOption[];
	warehouseOptions: TSelectOption[];
	customerSupplierOptions: TSelectOption[];
	onSuccess: (itemId: number) => void;
}
```

**Características:**

- ✅ Campos: serial, tipo, producto, bodega, cliente/proveedor, lote
- ✅ Auto-carga de lotes abiertos (`status=open`)
- ✅ Detección automática de lote "Manual"
- ✅ Alerta si no existe lote Manual
- ✅ Validación en tiempo real
- ✅ Reset de form al cerrar
- ✅ Feedback de éxito/error con toasts

**Payload:**

```typescript
{
  batch_id: number,
  serial_number: string,
  product_id?: number,
  equipment_type: EquipmentType,
  warehouse_id: number,
  customer_supplier_id?: number
}
```

---

### 4. **ReviewSteps** (`components/items/ReviewSteps/`)

#### **Step1BasicInfo.tsx** ❌ NO USADO

_(Este componente existe pero NO se usa en el flujo actual)_

#### **Step2FullReview.tsx** ✅ USADO

**Características:**

- ✅ Renderiza formulario según `equipmentType`
- ✅ Gestión de estado local con `formValues`
- ✅ Callback `onFieldChange` para auto-save
- ✅ Callback `onItemUpdate` para actualizar padre
- ✅ Indicador de estado (isDirty, isSaving, lastSaved)
- ✅ Validación de campos obligatorios
- ✅ Botones: Volver, Guardar, Finalizar Revisión

#### **Step3GradeReview.tsx** ✅ USADO

**Características:**

- ✅ Visualización de grado sugerido con badge colorido
- ✅ Confianza % con barra
- ✅ Desglose de puntuación
- ✅ Resumen de revisión
- ✅ Botón "Recalcular Grado"
- ✅ Botón "Modificar Revisión"
- ✅ Opción de modificar grado manualmente
- ✅ Validación de justificación obligatoria si modifica

---

## 🗄️ REDUX STORE - ITEMS SLICE

### **Archivo:** `store/slices/technicalReviews/slice/technicalReviewsSlice.ts`

### **Estado Inicial**

```typescript
interface TechnicalReviewsState {
	// Items
	items: IItem[];
	itemsMeta: ListMeta;
	selectedItem: IItem | null;
	itemsLoading: boolean;
	itemDetailLoading: boolean;
	itemsError: string | null;

	// Operaciones
	creating: boolean;
	updating: boolean;
	deleting: boolean;
	startingReview: boolean;
	completingReview: boolean;
	approving: boolean;
	changingStatus: boolean;
}
```

### **Reducers**

```typescript
clearSelected(); // Limpia selectedBatch y selectedItem
clearErrors(); // Limpia todos los errores
setSelectedBatch(batch);
setSelectedItem(item);
```

---

## 🚀 THUNKS - ITEMS

### **Archivo:** `thunks/itemsThunks.ts`

#### **1. fetchItems**

```typescript
GET / api / branches / { branch } / technical - reviews / items;
```

**Params:**

- batch_id, warehouse_id, equipment_type, review_status
- current_status, grade, serial_number, search
- page, per_page

**Respuesta:** `{ items: IItem[], meta: ListMeta }`

---

#### **2. fetchItemDetail**

```typescript
GET / api / branches / { branch } / technical - reviews / items / { item };
```

**Respuesta:** `IItem`

---

#### **3. createItem**

```typescript
POST / api / branches / { branch } / technical - reviews / items;
```

**Payload:**

```typescript
{
  batch_id?: number | null,
  serial_number: string,
  product_id?: number,
  warehouse_id?: number,
  customer_supplier_id?: number | null,
  equipment_type?: EquipmentType,
  extra_attributes?: Record<string, any>
}
```

**Efecto:** `review_status=pending`, `current_status=received`

---

#### **4. updateItem**

```typescript
PATCH / api / branches / { branch } / technical - reviews / items / { item };
```

**Payload:** Actualiza datos básicos (serial, product_id, etc.)

---

#### **5. deleteItem**

```typescript
DELETE / api / branches / { branch } / technical - reviews / items / { item };
```

---

## 🔄 THUNKS - REVIEW

### **Archivo:** `thunks/reviewThunks.ts`

#### **1. startReview**

```typescript
POST / api / branches / { branch } / technical - reviews / items / { item } / start - review;
```

**Efecto:** `review_status=in_review`

---

#### **2. updateItemDetails**

```typescript
PATCH / api / branches / { branch } / technical - reviews / items / { item } / details;
```

**Payload:** `UpdateItemDetailsPayload` (campos técnicos)

**Importante:**

- ✅ Filtra campos de puertos para AIO y Desktop (no tienen esas columnas)
- ✅ Normaliza `charger_status` a `extra_attributes`
- ✅ Acepta `battery_status` como estado o porcentaje ("85%")

---

#### **3. completeReview**

```typescript
POST / api / branches / { branch } / technical - reviews / items / { item } / complete - review;
```

**Efecto:** `review_status=reviewed`  
**Respuesta:** `suggested_grade`, `confidence`, `breakdown`

---

#### **4. approveItem**

```typescript
POST / api / branches / { branch } / technical - reviews / items / { item } / approve;
```

**Payload:**

```typescript
{
  grade: string,
  override_suggestion?: boolean,
  override_reason?: string
}
```

**Efecto:** `review_status=approved`

---

#### **5. getSuggestedGrade**

```typescript
GET / api / branches / { branch } / technical - reviews / items / { item } / suggested - grade;
```

**Respuesta:** `{ suggested_grade, confidence, breakdown }`

---

#### **6. reopenReview** ⭐ IMPORTANTE

```typescript
POST / api / branches / { branch } / technical - reviews / items / { item } / reopen - review;
```

**Efecto:** `review_status: reviewed → in_review`  
**Uso:** Permite recalcular grado o modificar revisión

---

## 🔍 SELECTORES

### **Archivo:** `slice/selectors.ts`

```typescript
// Items
selectItems(state): IItem[]
selectItemsMeta(state): ListMeta
selectSelectedItem(state): IItem | null
selectItemsLoading(state): boolean
selectItemDetailLoading(state): boolean
selectItemsError(state): string | null

// Operaciones
selectCreating(state): boolean
selectUpdating(state): boolean
selectDeleting(state): boolean
selectStartingReview(state): boolean
selectCompletingReview(state): boolean
selectApproving(state): boolean
selectChangingStatus(state): boolean

// Compuestos
selectIsLoading(state): boolean
selectHasErrors(state): boolean
```

---

## 📝 FORMULARIOS POR TIPO DE EQUIPO

### **Ubicación:** `components/forms/`

#### **NotebookForm.tsx**

**Secciones:**

1. Información General (marca, modelo, S/N)
2. Hardware (CPU, RAM, almacenamiento)
3. Pantalla (tamaño, resolución, estado)
4. Teclado y Touchpad
5. Batería
6. Conectividad (WiFi, Bluetooth, cámara)
7. Puertos (USB, HDMI, etc.)
8. Observaciones

#### **DesktopForm.tsx**

**Secciones:**

1. Información General
2. Hardware (CPU, RAM, almacenamiento)
3. Gabinete y Fuente
4. Conectividad
5. Observaciones

#### **AioForm.tsx**

**Secciones:**

1. Información General
2. Hardware
3. Pantalla Táctil
4. Cámara y Audio
5. Conectividad
6. Observaciones

#### **DockingForm.tsx**

**Secciones:**

1. Información General
2. Puertos
3. Alimentación
4. Observaciones

#### **MonitorForm.tsx**

**Secciones:**

1. Información General
2. Panel y Visualización
3. Conectores
4. Observaciones

---

## 🎨 COMPONENTES SHARED

### **StatusBadge** (`components/shared/StatusBadge.tsx`)

**Props:** `type: 'review' | 'commercial'`, `status: string`

**Colores por review_status:**

- pending: 🟡 Yellow
- in_review: 🔵 Blue
- reviewed: 🟢 Green
- approved: ✅ Green (dark)

**Colores por commercial_status:**

- received: ⚪ Gray
- under_review: 🔵 Blue
- available_for_sale: 🟢 Green
- reserved: 🟠 Orange
- sold: 🟣 Purple
- returned: 🔴 Red

---

## 🔗 SERVICIOS EXTERNOS INTEGRADOS

### **1. Productos**

```typescript
dispatch(fetchProducts({ branchId, params: { page: 1, per_page: 200 } }));
```

**Filtrado:** Solo productos con `serial_tracking=true`

### **2. Bodegas**

```typescript
dispatch(fetchWarehouses({ branchId, params: { is_active: true } }));
```

### **3. Clientes/Proveedores**

```typescript
dispatch(fetchCustomerSuppliers({ subsidiaryId, with_suppliers: true }));
```

---

## ⚙️ HOOKS CUSTOM

### **useAutoSaveReview** (`hooks/useAutoSaveReview.tsx`)

**Características:**

- ✅ Auto-guardado después de 30s de inactividad
- ✅ Tracking de cambios (isDirty)
- ✅ Estado de guardado (isSaving)
- ✅ Timestamp del último guardado
- ✅ Callbacks de éxito/error

**Métodos:**

```typescript
saveBasicInfo(data): Promise<number>  // Crea item + start review
markDetailsChanged(): void            // Marca cambios pendientes
saveDetailsNow(): Promise<void>       // Guarda inmediatamente
resetDirty(): void                    // Resetea estado
```

---

## 🧪 FLUJO COMPLETO - EJEMPLO

### **Escenario: Crear revisión de notebook desde cero**

```typescript
// 1. Usuario abre /technical-reviews/items
// 2. Clic en "Nueva Revisión"
// 3. Modal CreateReviewModal se abre
// 4. Completa datos:
{
  serial_number: "NB-001-REV",
  product_id: 5,
  equipment_type: "notebook",
  warehouse_id: 2,
  batch_id: 10 // Lote "Manual"
}

// 5. Submit → createItem() → navega a /items/{itemId}

// 6. STEP 1: Basic Info (pre-llenado)
// 7. Clic "Continuar" → startReview() → STEP 2

// 8. STEP 2: Full Review
// - Completa NotebookForm
// - Auto-save cada 30s
// - Clic "Finalizar" → completeReview() → STEP 3

// 9. STEP 3: Grading
// - Ve grado sugerido: B (85% confianza)
// - Clic "Aceptar y Aprobar" → approveItem()
// - Redirect a /technical-reviews/items
```

---

## ✅ FUNCIONALIDADES COMPLETAS

### **Listado de Items (ItemsListPage)**

- ✅ Búsqueda con debounce
- ✅ Filtros múltiples (7 filtros)
- ✅ Botón "Limpiar filtros"
- ✅ Paginación con metadata
- ✅ Tabla responsive
- ✅ Badges de estado
- ✅ Click-to-detail

### **Crear Revisión (CreateReviewModal)**

- ✅ Formulario completo
- ✅ Validación de campos
- ✅ Detección de lote Manual
- ✅ Feedback visual
- ✅ Integración con Redux

### **Flujo de Revisión (ItemReviewStandalonePage)**

- ✅ Progress Steps navegables
- ✅ STEP 1: Basic Info con auto-detección
- ✅ STEP 2: Formularios específicos + auto-save
- ✅ STEP 3: Grading + recalcular + modificar
- ✅ Manejo de estados (pending → in_review → reviewed → approved)
- ✅ Navegación bloqueada si approved

### **Componentes Reutilizables**

- ✅ ItemList (2 variantes)
- ✅ ItemDetail (cabecera informativa)
- ✅ CreateReviewModal (modal de creación)
- ✅ ReviewSteps (3 pasos)
- ✅ StatusBadge (estados visuales)

### **Redux Store**

- ✅ Items slice completo
- ✅ 5 thunks de items
- ✅ 6 thunks de review
- ✅ 11+ selectores

---

## ❌ PENDIENTES (TODO)

### **Funcionalidades**

- [ ] Exportación de datos (Excel, PDF)
- [ ] Filtros avanzados (rangos de fechas)
- [ ] Búsqueda por campos adicionales (marca, modelo)
- [ ] Carga masiva de series (CSV)
- [ ] Reporte de revisiones por usuario

### **UX**

- [ ] Skeleton loaders en tablas
- [ ] Infinite scroll (opcional)
- [ ] Confirmación antes de eliminar
- [ ] Historial de cambios en Step 3

### **Validación**

- [ ] Reglas de validación dinámicas
- [ ] Sugerencias de corrección
- [ ] Alertas de inconsistencias

---

## 🚨 REGLAS CRÍTICAS

### **NO MODIFICAR**

1. ❌ NO tocar `batchesSlice`
2. ❌ NO modificar `batchesThunks.ts`
3. ❌ NO importar componentes de `batches/`
4. ❌ NO usar `selectBatches` ni `fetchBatches` directamente en items

### **SÍ USAR**

1. ✅ `selectItems`, `selectItemsMeta`, `selectItemsLoading`
2. ✅ `fetchItems`, `createItem`, `fetchItemDetail`
3. ✅ Componentes de `components/items/`
4. ✅ Formularios de `components/forms/`

---

## 📊 MÉTRICAS DEL MÓDULO ITEMS

| Métrica                  | Valor  |
| ------------------------ | ------ |
| Páginas                  | 2      |
| Componentes              | 8      |
| Thunks Items             | 5      |
| Thunks Review            | 6      |
| Selectores               | 11+    |
| Formularios              | 5      |
| Líneas de código (aprox) | 3,500+ |
| Cobertura funcional      | 85%    |

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

### **Prioridad Alta**

1. Implementar validación de campos obligatorios en backend
2. Agregar tests unitarios para thunks
3. Optimizar carga de datos relacionados (productos, bodegas)

### **Prioridad Media**

1. Agregar búsqueda avanzada (múltiples campos)
2. Implementar exportación de datos
3. Agregar historial de cambios

### **Prioridad Baja**

1. Infinite scroll en listado
2. Carga masiva CSV
3. Reportes personalizados

---

## 📖 REFERENCIAS

- [README del módulo](./src/pages/technical-reviews/README.md)
- [Redux Slice](./src/store/slices/technicalReviews/README.md)
- [API Endpoints](./backend/technical-reviews-api-spec.md)
- [Interfaces TypeScript](./src/interface/technicalReviews.interface.ts)

---

**Última actualización:** 8 de noviembre de 2025  
**Autor:** GitHub Copilot  
**Estado:** Documentación completa sin modificaciones al código
