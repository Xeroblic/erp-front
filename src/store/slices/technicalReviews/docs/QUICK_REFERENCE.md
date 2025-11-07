# Technical Reviews - Guía Rápida de Referencia

## 🚀 Inicio Rápido

### Estructura de Carpetas
```
technicalReviews/
├── slice/           → Slice unificado + Selectores
├── thunks/          → Operaciones por dominio
│   ├── batchesThunks.ts
│   ├── itemsThunks.ts
│   ├── reviewThunks.ts
│   ├── traceabilityThunks.ts
│   └── validationThunks.ts
├── types.ts         → Tipos TypeScript
└── index.ts         → Barrel exports
```

### Import Pattern
```typescript
import {
    // Thunks
    fetchBatches,
    startReview,
    
    // Selectores
    selectBatches,
    selectIsLoading,
    
    // Tipos
    type IBatch,
    type IItem,
} from '@/store/slices/technicalReviews';
```

## 📋 Cheat Sheet por Caso de Uso

### 1. Listar Lotes
```typescript
import { useDispatch, useSelector } from 'react-redux';
import { fetchBatches, selectBatches, selectBatchesLoading } from '@/store/slices/technicalReviews';

const dispatch = useDispatch();
const batches = useSelector(selectBatches);
const loading = useSelector(selectBatchesLoading);

// Cargar lotes con filtros
dispatch(fetchBatches({
    branch: 1,
    page: 1,
    per_page: 20,
    filters: { supplier_id: 5 }
}));
```

### 2. Ver Series de un Lote
```typescript
import { fetchBatchItems, selectItems } from '@/store/slices/technicalReviews';

const items = useSelector(selectItems);

dispatch(fetchBatchItems({ branch: 1, batchId: 123, page: 1 }));
```

### 3. Ingresar Nueva Serie (Sin Lote)
```typescript
import { createItem } from '@/store/slices/technicalReviews';

dispatch(createItem({
    branch: 1,
    data: {
        serial_number: 'ABC123XYZ',
        equipment_type: 'notebook',
        brand: 'DELL',
        model: 'Latitude 7420'
    }
}));
```

### 4. Flujo Completo de Revisión
```typescript
import { startReview, updateItemDetails, completeReview, approveItem } from '@/store/slices/technicalReviews';

// Paso 1: Iniciar
await dispatch(startReview({ branch: 1, itemId: 456 }));

// Paso 2: Actualizar detalles
await dispatch(updateItemDetails({
    branch: 1,
    itemId: 456,
    data: {
        processor: 'Intel Core i7',
        ram: '16GB',
        storage: '512GB SSD'
    }
}));

// Paso 3: Finalizar
await dispatch(completeReview({
    branch: 1,
    itemId: 456,
    data: { overall_condition: 'A' }
}));

// Paso 4: Aprobar
await dispatch(approveItem({
    branch: 1,
    itemId: 456,
    data: { approved: true }
}));
```

### 5. Reservar Equipo
```typescript
import { reserveItem } from '@/store/slices/technicalReviews';

dispatch(reserveItem({
    branch: 1,
    itemId: 456,
    data: {
        customer_id: 789,
        reserved_until: '2024-02-15',
        notes: 'Cliente Juan Pérez'
    }
}));
```

### 6. Marcar Como Vendido
```typescript
import { markAsSold } from '@/store/slices/technicalReviews';

dispatch(markAsSold({
    branch: 1,
    itemId: 456,
    data: {
        sale_id: 101112,
        sold_date: '2024-01-20',
        customer_id: 789
    }
}));
```

### 7. Ver Equipos Disponibles para Venta
```typescript
import { getAvailableForSale, selectItems } from '@/store/slices/technicalReviews';

const availableItems = useSelector(selectItems);

dispatch(getAvailableForSale({ branch: 1, page: 1 }));
```

### 8. Obtener Grado Sugerido
```typescript
import { getSuggestedGrade } from '@/store/slices/technicalReviews';

const result = await dispatch(getSuggestedGrade({
    branch: 1,
    itemId: 456
}));

if (getSuggestedGrade.fulfilled.match(result)) {
    console.log('Grado sugerido:', result.payload.suggested_grade);
}
```

### 9. Validar Reglas
```typescript
import { fetchValidationRules, selectValidationRules } from '@/store/slices/technicalReviews';

const rules = useSelector(selectValidationRules);

dispatch(fetchValidationRules({ branch: 1 }));
```

### 10. Ver Historial de Trazabilidad
```typescript
import { getTraceabilityHistory } from '@/store/slices/technicalReviews';

const result = await dispatch(getTraceabilityHistory({
    branch: 1,
    itemId: 456
}));

if (getTraceabilityHistory.fulfilled.match(result)) {
    console.log('Historial:', result.payload);
}
```

## 🎯 Selectores Más Usados

```typescript
// Estado de carga global
const loading = useSelector(selectIsLoading);

// Errores globales
const hasErrors = useSelector(selectHasErrors);
const error = useSelector(selectError);

// Lotes
const batches = useSelector(selectBatches);
const selectedBatch = useSelector(selectSelectedBatch);

// Series
const items = useSelector(selectItems);
const selectedItem = useSelector(selectSelectedItem);

// Operaciones en curso
const isCreating = useSelector(selectCreating);
const isUpdating = useSelector(selectUpdating);
const isApproving = useSelector(selectApproving);
```

## 🔧 Componente Ejemplo Completo

```typescript
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchBatches,
    selectBatches,
    selectBatchesLoading,
    selectBatchesError,
    type IBatch
} from '@/store/slices/technicalReviews';
import type { AppDispatch } from '@/store/store';

const BatchesList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    
    const batches = useSelector(selectBatches);
    const loading = useSelector(selectBatchesLoading);
    const error = useSelector(selectBatchesError);
    
    useEffect(() => {
        dispatch(fetchBatches({ branch: 1, page: 1, per_page: 20 }));
    }, [dispatch]);
    
    if (loading) return <div>Cargando lotes...</div>;
    if (error) return <div>Error: {error}</div>;
    
    return (
        <div>
            <h1>Lotes de Revisión Técnica</h1>
            <ul>
                {batches.map((batch: IBatch) => (
                    <li key={batch.id}>
                        Lote #{batch.id} - {batch.expected_quantity} unidades
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default BatchesList;
```

## 📝 Tipos Comunes

```typescript
// Estados
type ReviewStatus = 'pending' | 'in_review' | 'reviewed' | 'approved';
type CommercialStatus = 'pending' | 'in_review' | 'available_for_sale' | 'reserved' | 'sold' | 'in_repair' | 'disposed';
type EquipmentType = 'notebook' | 'desktop' | 'docking' | 'aio' | 'monitor';

// Entidades
interface IBatch {
    id: number;
    branch_id: number;
    supplier_id: number;
    expected_quantity: number;
    actual_quantity?: number;
    reception_date: string;
    notes?: string;
}

interface IItem {
    id: number;
    batch_id?: number;
    serial_number: string;
    equipment_type: EquipmentType;
    brand: string;
    model: string;
    review_status: ReviewStatus;
    commercial_status: CommercialStatus;
}
```

## 🚨 Manejo de Errores

```typescript
import { fetchBatches } from '@/store/slices/technicalReviews';

const result = await dispatch(fetchBatches({ branch: 1 }));

if (fetchBatches.fulfilled.match(result)) {
    console.log('Éxito:', result.payload);
} else if (fetchBatches.rejected.match(result)) {
    console.error('Error:', result.payload); // rejectValue: string
}
```

## 🎨 Pattern: Formulario con Loading

```typescript
const CreateBatchForm: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const creating = useSelector(selectCreating);
    
    const handleSubmit = async (data: any) => {
        const result = await dispatch(createBatch({ branch: 1, data }));
        
        if (createBatch.fulfilled.match(result)) {
            alert('Lote creado con éxito');
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            {/* campos del formulario */}
            <button type="submit" disabled={creating}>
                {creating ? 'Creando...' : 'Crear Lote'}
            </button>
        </form>
    );
};
```

## 🧩 Pattern: Detalle con Loading Específico

```typescript
const ItemDetail: React.FC<{ itemId: number }> = ({ itemId }) => {
    const dispatch = useDispatch<AppDispatch>();
    const item = useSelector(selectSelectedItem);
    const loading = useSelector(selectItemDetailLoading);
    
    useEffect(() => {
        dispatch(fetchItemDetail({ branch: 1, itemId }));
    }, [itemId]);
    
    if (loading) return <Spinner />;
    if (!item) return <div>No se encontró el equipo</div>;
    
    return (
        <div>
            <h2>{item.brand} {item.model}</h2>
            <p>Serie: {item.serial_number}</p>
            <p>Estado: {item.commercial_status}</p>
        </div>
    );
};
```

## ⚡ Pattern: Operación con Confirmación

```typescript
const DeleteBatchButton: React.FC<{ batchId: number }> = ({ batchId }) => {
    const dispatch = useDispatch<AppDispatch>();
    const deleting = useSelector(selectDeleting);
    
    const handleDelete = async () => {
        if (!confirm('¿Seguro que deseas eliminar este lote?')) return;
        
        const result = await dispatch(deleteBatch({ branch: 1, batchId }));
        
        if (deleteBatch.fulfilled.match(result)) {
            alert('Lote eliminado');
        } else {
            alert(`Error: ${result.payload}`);
        }
    };
    
    return (
        <button onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
        </button>
    );
};
```

## 🔗 Referencias Rápidas

### Documentación Completa
- `README_MODULAR.md` - Guía completa con todos los endpoints

### Estructura de Archivos
- `thunks/batchesThunks.ts` - Operaciones de lotes
- `thunks/itemsThunks.ts` - Operaciones de series
- `thunks/reviewThunks.ts` - Flujo de revisión
- `thunks/traceabilityThunks.ts` - Estados comerciales
- `thunks/validationThunks.ts` - Reglas y validación

### Endpoints API Base
```
/api/branches/{branch}/technical-reviews/
```

### Prefijo de Ambiente
```typescript
VITE_API_TECHNICAL_REVIEWS_PREFIX=/api
```

---

**Tip**: Usa los selectores compuestos `selectIsLoading` y `selectHasErrors` para simplificar el manejo de estado global en componentes de nivel superior.

**Convención**: Todos los thunks requieren `{ branch: number }` como parte de sus argumentos para multi-tenancy.

**Performance**: Los selectores están memoizados. No necesitas usar `useMemo` adicional para derivar estado de ellos.
