# Technical Reviews Redux Module

## 📁 Estructura Modular

```
src/store/slices/technicalReviews/
├── slice/                          # Slice unificado y selectores
│   ├── technicalReviewsSlice.ts   # Slice principal con extraReducers
│   └── selectors.ts                # 26 selectores organizados por dominio
├── thunks/                         # Thunks separados por flujo de negocio
│   ├── batchesThunks.ts            # 6 thunks: Gestión de lotes (Modo A)
│   ├── itemsThunks.ts              # 5 thunks: Vista global de series (Modo B)
│   ├── reviewThunks.ts             # 5 thunks: Flujo de revisión técnica
│   ├── traceabilityThunks.ts       # 7 thunks: Estados comerciales y trazabilidad
│   └── validationThunks.ts         # 6 thunks: Reglas de validación
├── types.ts                        # Tipos e interfaces TypeScript
├── index.ts                        # Barrel exports
└── [deprecated]/                   # Archivos antiguos (NO USAR)
    ├── technicalReviewsThunks.ts   # ❌ Archivo monolítico deprecado
    └── technicalReviewsSlice.ts    # ❌ Slice antiguo deprecado
```

## 🎯 Filosofía de Diseño

### Separación por Dominios
- **thunks/**: Operaciones agrupadas por flujo de negocio (lotes, items, revisión, trazabilidad, validación)
- **slice/**: Estado unificado que coordina todos los flujos
- **types.ts**: Single source of truth para tipos

### Ventajas de la Estructura Modular
- ✅ Mantenibilidad: Archivos pequeños y enfocados (150-280 líneas)
- ✅ Discoverabilidad: Fácil encontrar thunks por dominio
- ✅ Escalabilidad: Agregar nuevos flujos sin tocar código existente
- ✅ Reusabilidad: Thunks independientes que pueden combinarse

## 📦 Uso Básico

### Importar desde el Módulo

```typescript
import {
    // Slice y Actions
    technicalReviewsReducer,
    clearSelected,
    setSelectedBatch,
    
    // Thunks por dominio
    fetchBatches,          // Lotes
    fetchItems,            // Series
    startReview,           // Revisión
    changeCommercialStatus,// Trazabilidad
    validateField,         // Validación
    
    // Selectores
    selectBatches,
    selectItems,
    selectIsLoading,
    
    // Tipos
    type IBatch,
    type IItem,
    type ReviewStatus,
} from '@/store/slices/technicalReviews';
```

## 🔄 Flujos de Trabajo

### 1. Gestión de Lotes (Modo A)
**Archivo**: `thunks/batchesThunks.ts`

```typescript
import { fetchBatches, fetchBatchById, fetchBatchItems, createBatch, updateBatch, deleteBatch } from '@/store/slices/technicalReviews';

// Listar lotes con filtros y paginación
dispatch(fetchBatches({
    branch: 1,
    page: 1,
    per_page: 20,
    filters: { supplier_id: 5 }
}));

// Ver lote específico
dispatch(fetchBatchById({ branch: 1, batchId: 123 }));

// Ver series de un lote
dispatch(fetchBatchItems({ branch: 1, batchId: 123, page: 1 }));

// Crear nuevo lote
dispatch(createBatch({
    branch: 1,
    data: {
        supplier_id: 5,
        expected_quantity: 50,
        reception_date: '2024-01-15',
        notes: 'Primer lote del año'
    }
}));

// Actualizar lote
dispatch(updateBatch({
    branch: 1,
    batchId: 123,
    data: { notes: 'Actualizado', actual_quantity: 48 }
}));

// Eliminar lote
dispatch(deleteBatch({ branch: 1, batchId: 123 }));
```

### 2. Vista Global de Series (Modo B)
**Archivo**: `thunks/itemsThunks.ts`

```typescript
import { fetchItems, fetchItemDetail, createItem, updateItem, deleteItem } from '@/store/slices/technicalReviews';

// Listar todas las series con filtros
dispatch(fetchItems({
    branch: 1,
    filters: {
        status: 'in_review',
        equipment_type: 'notebook',
        brand: 'DELL'
    }
}));

// Ver detalle de una serie
dispatch(fetchItemDetail({ branch: 1, itemId: 456 }));

// Ingresar nueva serie (Modo B: sin lote)
dispatch(createItem({
    branch: 1,
    data: {
        serial_number: 'ABC123XYZ',
        equipment_type: 'notebook',
        brand: 'DELL',
        model: 'Latitude 7420'
    }
}));

// Actualizar información básica
dispatch(updateItem({
    branch: 1,
    itemId: 456,
    data: { notes: 'Actualización de datos' }
}));

// Eliminar serie
dispatch(deleteItem({ branch: 1, itemId: 456 }));
```

### 3. Flujo de Revisión Técnica
**Archivo**: `thunks/reviewThunks.ts`

```typescript
import { startReview, updateItemDetails, completeReview, approveItem, getSuggestedGrade } from '@/store/slices/technicalReviews';

// Paso 1: Iniciar revisión
dispatch(startReview({ branch: 1, itemId: 456 }));

// Paso 2: Actualizar detalles (múltiples veces)
dispatch(updateItemDetails({
    branch: 1,
    itemId: 456,
    data: {
        processor: 'Intel Core i7-1185G7',
        ram: '16GB',
        storage: '512GB SSD',
        battery_health: 85,
        cosmetic_condition: 'good',
        functional_issues: []
    }
}));

// Paso 3: Obtener grado sugerido
const { payload: suggestedGrade } = await dispatch(getSuggestedGrade({
    branch: 1,
    itemId: 456
}));

// Paso 4: Finalizar revisión
dispatch(completeReview({
    branch: 1,
    itemId: 456,
    data: {
        overall_condition: 'A',
        final_notes: 'Equipo en excelente estado'
    }
}));

// Paso 5: Aprobar y pasar a "Disponible para Venta"
dispatch(approveItem({
    branch: 1,
    itemId: 456,
    data: { approved: true }
}));
```

### 4. Trazabilidad y Estados Comerciales
**Archivo**: `thunks/traceabilityThunks.ts`

```typescript
import {
    changeCommercialStatus,
    reserveItem,
    releaseReservation,
    markAsSold,
    transferItem,
    getTraceabilityHistory,
    getAvailableForSale
} from '@/store/slices/technicalReviews';

// Cambiar estado comercial genérico
dispatch(changeCommercialStatus({
    branch: 1,
    itemId: 456,
    data: { new_status: 'in_repair' }
}));

// Reservar equipo para cliente
dispatch(reserveItem({
    branch: 1,
    itemId: 456,
    data: {
        customer_id: 789,
        reserved_until: '2024-02-15',
        notes: 'Cliente Juan Pérez'
    }
}));

// Liberar reserva
dispatch(releaseReservation({ branch: 1, itemId: 456 }));

// Marcar como vendido
dispatch(markAsSold({
    branch: 1,
    itemId: 456,
    data: {
        sale_id: 101112,
        sold_date: '2024-01-20',
        customer_id: 789
    }
}));

// Transferir a otra sucursal
dispatch(transferItem({
    branch: 1,
    itemId: 456,
    data: {
        destination_branch: 2,
        transfer_notes: 'Traslado por pedido'
    }
}));

// Ver historial completo
dispatch(getTraceabilityHistory({ branch: 1, itemId: 456 }));

// Listar equipos disponibles para venta
dispatch(getAvailableForSale({ branch: 1, page: 1 }));
```

### 5. Validación y Reglas
**Archivo**: `thunks/validationThunks.ts`

```typescript
import {
    fetchValidationRules,
    fetchValidationRulesByType,
    validateField,
    suggestGrade,
    getMyCommonErrors,
    getErrorStatistics
} from '@/store/slices/technicalReviews';

// Obtener todas las reglas de validación
dispatch(fetchValidationRules({ branch: 1 }));

// Reglas específicas por tipo de equipo
dispatch(fetchValidationRulesByType({
    branch: 1,
    equipmentType: 'notebook'
}));

// Validar un campo específico
const { payload: validation } = await dispatch(validateField({
    branch: 1,
    data: {
        field: 'ram',
        value: '16GB',
        equipment_type: 'notebook'
    }
}));

// Sugerir grado basado en condiciones
const { payload: grade } = await dispatch(suggestGrade({
    branch: 1,
    data: {
        battery_health: 85,
        cosmetic_condition: 'good',
        functional_issues: []
    }
}));

// Ver mis errores comunes (mejora continua)
dispatch(getMyCommonErrors({ branch: 1 }));

// Estadísticas de errores del equipo
dispatch(getErrorStatistics({ branch: 1 }));
```

## 🎨 Selectores por Dominio

### Lotes
```typescript
import { selectBatches, selectBatchesMeta, selectSelectedBatch, selectBatchesLoading, selectBatchesError } from '@/store/slices/technicalReviews';

const batches = useSelector(selectBatches);
const meta = useSelector(selectBatchesMeta);
const loading = useSelector(selectBatchesLoading);
```

### Series/Items
```typescript
import { selectItems, selectItemsMeta, selectSelectedItem, selectItemsLoading } from '@/store/slices/technicalReviews';

const items = useSelector(selectItems);
const selectedItem = useSelector(selectSelectedItem);
```

### Operaciones CRUD
```typescript
import { selectCreating, selectUpdating, selectDeleting } from '@/store/slices/technicalReviews';

const isCreating = useSelector(selectCreating);
const isUpdating = useSelector(selectUpdating);
```

### Operaciones de Revisión
```typescript
import { selectStartingReview, selectCompletingReview, selectApproving } from '@/store/slices/technicalReviews';

const isStartingReview = useSelector(selectStartingReview);
const isApproving = useSelector(selectApproving);
```

### Estados Comerciales
```typescript
import { selectChangingStatus } from '@/store/slices/technicalReviews';

const isChangingStatus = useSelector(selectChangingStatus);
```

### Validación
```typescript
import { selectValidationRules, selectValidationRulesLoading } from '@/store/slices/technicalReviews';

const rules = useSelector(selectValidationRules);
```

### Selectores Compuestos
```typescript
import { selectIsLoading, selectHasErrors } from '@/store/slices/technicalReviews';

const anyLoading = useSelector(selectIsLoading); // Combina TODOS los loadings
const hasErrors = useSelector(selectHasErrors);  // Combina TODOS los errores
```

## 🧩 Tipos Principales

```typescript
// Estados de revisión
type ReviewStatus = 'pending' | 'in_review' | 'reviewed' | 'approved';

// Estados comerciales
type CommercialStatus = 
    | 'pending'
    | 'in_review'
    | 'available_for_sale'
    | 'reserved'
    | 'sold'
    | 'in_repair'
    | 'disposed';

// Tipos de equipos
type EquipmentType = 'notebook' | 'desktop' | 'docking' | 'aio' | 'monitor';

// Entidades principales
interface IBatch {
    id: number;
    branch_id: number;
    supplier_id: number;
    expected_quantity: number;
    actual_quantity?: number;
    reception_date: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

interface IItem {
    id: number;
    batch_id?: number;
    branch_id: number;
    serial_number: string;
    equipment_type: EquipmentType;
    brand: string;
    model: string;
    review_status: ReviewStatus;
    commercial_status: CommercialStatus;
    processor?: string;
    ram?: string;
    storage?: string;
    overall_condition?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}
```

## 🔧 Mantenimiento

### Agregar Nuevo Thunk a un Flujo Existente

1. Editar el archivo correspondiente en `thunks/`:
```typescript
// thunks/batchesThunks.ts
export const myNewBatchThunk = createAsyncThunk<ReturnType, ArgsType, { rejectValue: string }>(
    'technicalReviews/myNewBatchThunk',
    async (args, { rejectWithValue }) => {
        // Implementación
    }
);
```

2. Agregar reducer en `slice/technicalReviewsSlice.ts`:
```typescript
builder
    .addCase(myNewBatchThunk.pending, (state) => { /* ... */ })
    .addCase(myNewBatchThunk.fulfilled, (state, action) => { /* ... */ })
    .addCase(myNewBatchThunk.rejected, (state, action) => { /* ... */ });
```

3. Exportar en `index.ts`:
```typescript
export { myNewBatchThunk } from './thunks/batchesThunks';
```

### Crear Nuevo Flujo de Negocio

1. Crear nuevo archivo: `thunks/myNewFlowThunks.ts`
2. Implementar thunks siguiendo el patrón existente
3. Agregar extraReducers en `slice/technicalReviewsSlice.ts`
4. Exportar en `index.ts`
5. Crear selectores específicos si es necesario

## 📊 Estado Global

```typescript
interface TechnicalReviewsState {
    // Lotes
    batches: IBatch[];
    batchesMeta: ListMeta;
    selectedBatch: IBatch | null;
    batchesLoading: boolean;
    
    // Series/Items
    items: IItem[];
    itemsMeta: ListMeta;
    selectedItem: IItem | null;
    itemsLoading: boolean;
    itemDetailLoading: boolean;
    
    // Operaciones CRUD
    creating: boolean;
    updating: boolean;
    deleting: boolean;
    
    // Operaciones de revisión
    startingReview: boolean;
    completingReview: boolean;
    approving: boolean;
    
    // Cambios de estado comercial
    changingStatus: boolean;
    
    // Validación
    validationRules: IValidationRules | null;
    validationRulesLoading: boolean;
    
    // Errores
    error: string | null;
    batchesError: string | null;
    itemsError: string | null;
    validationError: string | null;
}
```

## 🚀 Endpoints API

Todos los endpoints están bajo: `/api/branches/{branch}/technical-reviews/`

### Lotes
- `GET /batches` - Listar lotes
- `GET /batches/{id}` - Ver lote
- `GET /batches/{id}/items` - Series del lote
- `POST /batches` - Crear lote
- `PUT /batches/{id}` - Actualizar lote
- `DELETE /batches/{id}` - Eliminar lote

### Series/Items
- `GET /items` - Vista global de series
- `GET /items/{id}` - Detalle de serie
- `POST /items` - Ingresar serie (sin lote)
- `PUT /items/{id}` - Actualizar serie
- `DELETE /items/{id}` - Eliminar serie

### Revisión
- `POST /items/{id}/start-review` - Iniciar revisión
- `PUT /items/{id}/update-details` - Actualizar detalles
- `POST /items/{id}/complete-review` - Finalizar revisión
- `POST /items/{id}/approve` - Aprobar serie
- `GET /items/{id}/suggest-grade` - Grado sugerido

### Trazabilidad
- `POST /items/{id}/change-status` - Cambiar estado comercial
- `POST /items/{id}/reserve` - Reservar
- `POST /items/{id}/release-reservation` - Liberar reserva
- `POST /items/{id}/mark-as-sold` - Marcar como vendido
- `POST /items/{id}/transfer` - Transferir
- `GET /items/{id}/traceability` - Historial completo
- `GET /available-for-sale` - Equipos disponibles

### Validación
- `GET /validation-rules` - Todas las reglas
- `GET /validation-rules/{type}` - Reglas por tipo
- `POST /validate-field` - Validar campo
- `POST /suggest-grade` - Sugerir grado
- `GET /my-common-errors` - Mis errores comunes
- `GET /error-statistics` - Estadísticas

## 📚 Referencias

- **Redux Toolkit**: https://redux-toolkit.js.org/
- **Guía Original**: `GUIA_REVISIONES_TECNICAS.md`
- **Convenciones del Proyecto**: `.github/instructions/copilot-instructions.md`

---

**Última actualización**: 2024-01-19  
**Versión**: 2.0.0 (Estructura Modular)
