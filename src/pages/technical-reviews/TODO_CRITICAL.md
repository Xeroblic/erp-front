# 🔥 TAREAS CRÍTICAS - REVISIONES TÉCNICAS

## COMPONENTES FALTANTES PARA FUNCIONALIDAD COMPLETA

### 🔴 URGENTE - Sin estos no funciona el listado

#### 1. ItemList.tsx

**Ruta**: `components/items/ItemList.tsx`

**Props**:

```typescript
interface ItemListProps {
	items: IItem[];
	loading: boolean;
	meta: ListMeta;
	onItemClick: (itemId: number) => void;
	onPageChange: (page: number) => void;
	// Filtros opcionales
	showFilters?: boolean;
	onFilterChange?: (filters: FetchItemsParams) => void;
}
```

**Features**:

- ✅ Tabla responsive
- ✅ Columnas: Serie, Tipo, Estado Revisión, Estado Comercial, Grado, Acciones
- ✅ Paginación
- ✅ Loading state
- ✅ Empty state
- ✅ Filtros colapsables (opcional)
- ✅ SearchSerialInput integrado

**Thunks usados**:

- Ninguno directo (recibe datos por props)

---

#### 2. BatchList.tsx

**Ruta**: `components/batches/BatchList.tsx`

**Props**:

```typescript
interface BatchListProps {
	batches: IBatch[];
	loading: boolean;
	meta: ListMeta;
	onBatchClick: (batchId: number) => void;
	onPageChange: (page: number) => void;
	onFilterChange?: (filters: FetchBatchesParams) => void;
}
```

**Features**:

- ✅ Tabla de lotes
- ✅ Columnas: ID, Código, Bodega, Proveedor, Fecha, Cant. Esperada/Recibida, Estado, Progreso, Acciones
- ✅ Filtros: warehouse_id, status, customer_supplier_id, year, search
- ✅ Progress bar por lote
- ✅ Badges de estado
- ✅ Paginación

**Selectores usados**:

```typescript
-selectBatches - selectBatchesMeta - selectBatchesLoading;
```

---

#### 3. BatchDetail.tsx

**Ruta**: `components/batches/BatchDetail.tsx`

**Props**:

```typescript
interface BatchDetailProps {
	batch: IBatch;
	loading?: boolean;
}
```

**Features**:

- ✅ Card con metadata del lote
- ✅ Info: Código, Bodega, Proveedor, Fecha entrada, Notas
- ✅ KPIs: Cantidad esperada, Recibida, Completada, Pendiente
- ✅ Progress bar general
- ✅ Badges de estado

**Selectores usados**:

```typescript
-selectSelectedBatch - selectBatchesLoading;
```

---

#### 4. BatchTabs.tsx

**Ruta**: `components/batches/BatchTabs.tsx`

**Props**:

```typescript
interface BatchTabsProps {
	batchId: number;
	branchId: number;
	itemsSummary: IBatch['items_summary'];
	onItemClick: (itemId: number) => void;
}
```

**Features**:

- ✅ 5 Tabs: Notebook, Desktop, AIO, Docking, Monitor
- ✅ Badges con conteo de cada tipo (usando items_summary)
- ✅ ItemList dentro de cada tab
- ✅ Filtros por review_status, current_status, grade
- ✅ Carga automática al cambiar tab

**Thunks usados**:

```typescript
- fetchBatchItems({ branchId, batchId, params: { equipment_type, ... } })
```

**Selectores usados**:

```typescript
-selectItems - selectItemsMeta - selectItemsLoading;
```

---

#### 5. ItemDetail.tsx

**Ruta**: `components/items/ItemDetail.tsx`

**Props**:

```typescript
interface ItemDetailProps {
	item: IItem;
	loading?: boolean;
	onEditClick?: () => void;
	onApproveClick?: () => void;
	onChangeStatusClick?: () => void;
}
```

**Features**:

- ✅ Card con info clave de la serie
- ✅ Serial number (destacado)
- ✅ Badges: review_status, current_status
- ✅ Grado actual (si existe)
- ✅ Grado sugerido + confidence (si existe)
- ✅ Producto vinculado
- ✅ Breakdown (si existe)
- ✅ Botones de acción condicionales

**Selectores usados**:

```typescript
-selectSelectedItem - selectItemDetailLoading;
```

---

## 📋 PLAN DE IMPLEMENTACIÓN

### Día 1: Componentes de Lista

```bash
1. Crear ItemList.tsx       (2-3 horas)
2. Crear BatchList.tsx      (2-3 horas)
3. Testing básico           (1 hora)
```

### Día 2: Componentes de Detalle

```bash
1. Crear ItemDetail.tsx     (1-2 horas)
2. Crear BatchDetail.tsx    (1-2 horas)
3. Crear BatchTabs.tsx      (2-3 horas)
4. Testing e integración    (1 hora)
```

### Día 3: Integración en Pages

```bash
1. Actualizar pages/batches/index.tsx
2. Actualizar pages/batches/[batchId]/index.tsx
3. Actualizar pages/items/index.tsx
4. Testing end-to-end
```

---

## 🎯 PRIORIDAD DE CREACIÓN

**Orden sugerido** (de más a menos crítico):

1. **ItemList.tsx** → Usado en múltiples lugares
2. **ItemDetail.tsx** → Necesario para mostrar info de serie
3. **BatchList.tsx** → Necesario para listar lotes
4. **BatchDetail.tsx** → Necesario para mostrar info de lote
5. **BatchTabs.tsx** → Necesario para navegación por tipo

---

## ✅ CHECKLIST ANTES DE EMPEZAR

Antes de crear los componentes, verifica que existen:

- [x] Slices (technicalReviews)
- [x] Thunks (fetchBatches, fetchBatchItems, fetchItems, etc.)
- [x] Interfaces (IBatch, IItem, ListMeta, etc.)
- [x] Selectores (selectBatches, selectItems, etc.)
- [x] Componentes shared (StatusBadge, SearchSerialInput, etc.)
- [x] Formularios (NotebookForm, DesktopForm, etc.)
- [x] Modales (ApproveModal, ChangeStatusModal, etc.)

**TODO EXISTE ✅** - Puedes empezar a crear los componentes faltantes.

---

## 🔧 COMPONENTES AUXILIARES (Opcional - Baja prioridad)

### Validation Pages (Debug/Admin)

- [ ] `pages/validation/rules.tsx`
- [ ] `pages/validation/validate-field.tsx`

### Approve Pages (Alternativa a modales)

- [ ] `pages/batches/[batchId]/[itemId]/approve.tsx`
- [ ] `pages/items/[itemId]/approve.tsx`

**Nota**: Estos son opcionales. El sistema funciona sin ellos usando modales.

---

## 📊 PROGRESO ACTUAL

```
COMPLETADO: ████████████████░░░░ 69%

Faltante para 100%:
- ItemList.tsx
- BatchList.tsx
- ItemDetail.tsx
- BatchDetail.tsx
- BatchTabs.tsx
```

Una vez creados estos 5 componentes, el módulo estará **100% funcional**.
