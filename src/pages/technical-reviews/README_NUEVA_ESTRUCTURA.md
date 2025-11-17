# 📁 Technical Reviews - Nueva Estructura Modular

## 🎯 Filosofía de Diseño

Esta módulo está estructurado para **separar completamente** los dos flujos de trabajo:

- **Modo A (Batches)**: Revisiones por lotes - flujo desde lote → items del lote
- **Modo B (Items)**: Revisiones globales - flujo directo a items individuales

**❌ NO MEZCLAR** código entre modos. Cada uno tiene su propia lógica de navegación, estados y componentes.

**✅ SÍ COMPARTIR** formularios de equipos y validaciones, ya que son idénticos en ambos modos.

---

## 📂 Estructura de Carpetas

```
technical-reviews/
├── shared/                          🟢 COMPARTIDO ENTRE MODOS
│   ├── forms/                       ← Formularios de equipos
│   │   ├── NotebookForm.tsx
│   │   ├── DesktopForm.tsx
│   │   ├── AioForm.tsx
│   │   ├── DockingForm.tsx
│   │   ├── MonitorForm.tsx
│   │   └── index.ts
│   │
│   ├── validation/                  ← Validación backend
│   │   ├── hooks/
│   │   │   ├── useFieldValidation.ts
│   │   │   ├── useGradeSuggestion.ts
│   │   │   └── index.ts
│   │   └── constants/
│   │       ├── equipment-types.constant.ts
│   │       ├── field-helpers.constant.ts
│   │       ├── review-steps.constant.ts
│   │       ├── validation-options.constant.ts
│   │       └── index.ts
│   │
│   ├── modals/                      ← Modales comunes
│   │   ├── ApproveModal.tsx
│   │   ├── ChangeStatusModal.tsx
│   │   ├── ReserveModal.tsx
│   │   └── index.ts
│   │
│   └── index.ts                     ← Export central
│
├── modo-a-batches/                  🔵 MODO A: POR LOTES
│   ├── pages/
│   │   ├── BatchListPage.tsx       ← GET /batches
│   │   ├── BatchDetailPage.tsx     ← GET /batches/{batch}
│   │   ├── BatchItemsPage.tsx      ← GET /batches/{batch}/items
│   │   └── BatchItemReviewPage.tsx ← Revisión desde lote
│   │
│   ├── components/
│   │   ├── BatchList.tsx
│   │   ├── BatchDetail.tsx
│   │   ├── BatchItemsTabs.tsx
│   │   ├── BatchFilters.tsx
│   │   ├── steps/                   ← Steps CON contexto de lote
│   │   │   ├── BatchStep1.tsx
│   │   │   ├── BatchStep2.tsx
│   │   │   ├── BatchStep3.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── hooks/
│   │   ├── useBatchList.ts
│   │   ├── useBatchDetail.ts
│   │   ├── useBatchItems.ts
│   │   └── index.ts
│   │
│   ├── store/
│   │   ├── batchSlice.ts
│   │   └── index.ts
│   │
│   └── index.tsx                    ← Router Modo A
│
├── modo-b-items/                    🟡 MODO B: VISTA GLOBAL
│   ├── pages/
│   │   ├── ItemListPage.tsx        ← GET /items
│   │   └── ItemReviewPage.tsx      ← Revisión standalone
│   │
│   ├── components/
│   │   ├── ItemList.tsx
│   │   ├── ItemFilters.tsx
│   │   ├── ItemCard.tsx
│   │   ├── steps/                   ← Steps SIN contexto de lote
│   │   │   ├── ItemStep1.tsx
│   │   │   ├── ItemStep2.tsx
│   │   │   ├── ItemStep3.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── hooks/
│   │   ├── useItemList.ts
│   │   ├── useItemDetail.ts
│   │   └── index.ts
│   │
│   ├── store/
│   │   ├── itemSlice.ts
│   │   └── index.ts
│   │
│   └── index.tsx                    ← Router Modo B
│
└── index.tsx                        ← Router principal

```

---

## 🔄 Flujos de Navegación

### Modo A: Por Lotes (Batches)
```
/technical-reviews/batches
  └─> BatchListPage (GET /batches)
        └─> BatchDetailPage (GET /batches/{batch})
              └─> BatchItemsPage (GET /batches/{batch}/items?equipment_type=notebook)
                    └─> BatchItemReviewPage (Steps con contexto batch)
                          ├─ BatchStep1 (info básica + batch heredado)
                          ├─ BatchStep2 (formulario según equipment_type)
                          └─ BatchStep3 (grading + aprobación)
```

**Características Modo A**:
- ✅ Warehouse/Supplier heredado del lote (readonly)
- ✅ Tabs por tipo de equipo
- ✅ KPIs del lote
- ✅ Navegación siempre vuelve al lote
- ✅ batch_id SIEMPRE presente

### Modo B: Vista Global (Items)
```
/technical-reviews/items
  └─> ItemListPage (GET /items)
        └─> ItemReviewPage (Steps standalone)
              ├─ ItemStep1 (info básica + warehouse/supplier obligatorios)
              ├─ ItemStep2 (formulario según equipment_type)
              └─ ItemStep3 (grading + aprobación)
```

**Características Modo B**:
- ✅ Warehouse/Supplier seleccionables (required)
- ✅ Lista plana de todos los items
- ✅ Filtros avanzados
- ✅ Navegación siempre vuelve a lista items
- ⚠️ batch_id opcional (puede asociar a lote manual)

---

## 📦 Qué se Comparte vs Qué NO

### ✅ COMPARTIDO (`/shared`)

**1. Formularios de Equipos** (`shared/forms/`)
- `NotebookForm.tsx`
- `DesktopForm.tsx`
- `AioForm.tsx`
- `DockingForm.tsx`
- `MonitorForm.tsx`

**Por qué**: Los campos y validaciones son idénticos en ambos modos.

**2. Hooks de Validación** (`shared/validation/hooks/`)
- `useFieldValidation` - Validación real-time backend
- `useGradeSuggestion` - Sugerencia automática de grado

**Por qué**: La lógica de validación no depende del modo.

**3. Constantes** (`shared/validation/constants/`)
- `equipment-types.constant.ts` - Tipos de equipos
- `field-helpers.constant.ts` - Helpers de campos
- `review-steps.constant.ts` - Steps de revisión
- `validation-options.constant.ts` - Opciones de validación

**Por qué**: Son reglas de negocio independientes del flujo.

**4. Modales** (`shared/modals/`)
- `ApproveModal` - Aprobar item
- `ChangeStatusModal` - Cambiar estado comercial
- `ReserveModal` - Reservar para cotización

**Por qué**: La acción es la misma en ambos modos.

---

### ❌ NO COMPARTIDO (Separado por Modo)

**1. Pages** - Completamente diferentes
- Modo A: Jerarquía Batch → Items del Batch → Review
- Modo B: Lista plana Items → Review

**2. Components**
- Modo A: BatchList, BatchDetail, BatchItemsTabs
- Modo B: ItemList, ItemFilters, ItemCard

**3. Steps** - Lógica diferente
- Modo A: `BatchStep1` hereda warehouse/supplier del batch
- Modo B: `ItemStep1` requiere selección manual

**4. Hooks**
- Modo A: `useBatchList`, `useBatchDetail`, `useBatchItems`
- Modo B: `useItemList`, `useItemDetail`

**5. Store Slices**
- Modo A: `batchSlice` - Estado de lotes
- Modo B: `itemSlice` - Estado de items globales

---

## 🚀 Cómo Usar

### Importar desde `/shared`

```typescript
// ✅ Correcto - Formularios compartidos
import { NotebookForm, DesktopForm } from '@/pages/technical-reviews/shared/forms';

// ✅ Correcto - Validación compartida
import { useFieldValidation, useGradeSuggestion } from '@/pages/technical-reviews/shared/validation/hooks';
import { EQUIPMENT_TYPE_OPTIONS, extractFieldValue } from '@/pages/technical-reviews/shared/validation/constants';

// ✅ Correcto - Modales compartidos
import { ApproveModal, ChangeStatusModal } from '@/pages/technical-reviews/shared/modals';
```

### Importar de Modo A (Batches)

```typescript
// ✅ Correcto - Components de Modo A
import { BatchList, BatchDetail } from '@/pages/technical-reviews/modo-a-batches/components';

// ✅ Correcto - Steps de Modo A
import { BatchStep1, BatchStep2, BatchStep3 } from '@/pages/technical-reviews/modo-a-batches/components/steps';

// ✅ Correcto - Hooks de Modo A
import { useBatchList, useBatchDetail } from '@/pages/technical-reviews/modo-a-batches/hooks';

// ✅ Correcto - Store de Modo A
import { batchSlice } from '@/pages/technical-reviews/modo-a-batches/store';
```

### Importar de Modo B (Items)

```typescript
// ✅ Correcto - Components de Modo B
import { ItemList, ItemFilters } from '@/pages/technical-reviews/modo-b-items/components';

// ✅ Correcto - Steps de Modo B
import { ItemStep1, ItemStep2, ItemStep3 } from '@/pages/technical-reviews/modo-b-items/components/steps';

// ✅ Correcto - Hooks de Modo B
import { useItemList, useItemDetail } from '@/pages/technical-reviews/modo-b-items/hooks';

// ✅ Correcto - Store de Modo B
import { itemSlice } from '@/pages/technical-reviews/modo-b-items/store';
```

---

## ⚠️ Reglas Importantes

### ❌ NO HACER

```typescript
// ❌ NUNCA importar de modo-a en modo-b
import { BatchStep1 } from '@/pages/technical-reviews/modo-a-batches/components/steps';
// en modo-b-items/ ← PROHIBIDO

// ❌ NUNCA importar de modo-b en modo-a
import { ItemStep1 } from '@/pages/technical-reviews/modo-b-items/components/steps';
// en modo-a-batches/ ← PROHIBIDO

// ❌ NUNCA mezclar lógica de batch en items standalone
if (batchId) { /* ... */ } // en ItemReviewPage ← PROHIBIDO

// ❌ NUNCA mezclar lógica de items en batch flow
if (!batchId) { /* ... */ } // en BatchItemReviewPage ← PROHIBIDO
```

### ✅ SÍ HACER

```typescript
// ✅ Compartir formularios
import { NotebookForm } from '@/pages/technical-reviews/shared/forms';
// Usar en AMBOS modos

// ✅ Compartir validación
import { useFieldValidation } from '@/pages/technical-reviews/shared/validation/hooks';
// Usar en AMBOS modos

// ✅ Lógica específica por modo
// En Modo A
const warehouse_id = batch.warehouse_id; // Heredado

// En Modo B
const [warehouseId, setWarehouseId] = useState(null); // Seleccionable
```

---

## 📝 Ejemplos de Uso

### Crear nuevo Step en Modo A

```typescript
// modo-a-batches/components/steps/BatchStep1.tsx
import { NotebookForm } from '../../../shared/forms';
import { useFieldValidation } from '../../../shared/validation/hooks';
import { useBatchDetail } from '../../hooks';

export const BatchStep1 = ({ batchId }) => {
  const { batch } = useBatchDetail(batchId);
  
  // ✅ Warehouse heredado del lote
  const warehouseId = batch.warehouse_id;
  
  return (
    <NotebookForm 
      warehouseId={warehouseId}
      readonlyWarehouse={true} // ← Solo en Modo A
    />
  );
};
```

### Crear nuevo Step en Modo B

```typescript
// modo-b-items/components/steps/ItemStep1.tsx
import { NotebookForm } from '../../../shared/forms';
import { useFieldValidation } from '../../../shared/validation/hooks';

export const ItemStep1 = () => {
  const [warehouseId, setWarehouseId] = useState(null);
  
  // ✅ Warehouse seleccionable
  return (
    <NotebookForm 
      warehouseId={warehouseId}
      onWarehouseChange={setWarehouseId}
      readonlyWarehouse={false} // ← Solo en Modo B
    />
  );
};
```

---

## 🔍 Debugging

Si ves errores como:
- "batch is undefined" en Modo B → Estás mezclando código de Modo A
- "warehouse_id required" en Modo A → Estás mezclando código de Modo B
- "Cannot import from modo-a" → Respeta la separación de módulos

**Solución**: Verifica que estés usando componentes del modo correcto.

---

## 📚 Referencias

- **Backend API**: Ver `VALIDATION_RULES_ANALYSIS.md`
- **Endpoints**: Ver `technical-reviews-implementation-guide.md`
- **Reglas de negocio**: Ver `shared/validation/constants/`

---

## 🎯 Principios de Diseño

1. **Separación Total**: Modo A y Modo B son independientes
2. **Reutilización Inteligente**: Solo formularios y validación se comparten
3. **Single Responsibility**: Cada componente hace UNA cosa
4. **No Condicionales de Modo**: Nunca `if (isBatchMode)`
5. **Imports Explícitos**: Siempre desde `/shared`, `/modo-a` o `/modo-b`

---

**Última actualización**: Noviembre 2025
**Mantenedor**: ERP Frontend Team
