# Technical Reviews - Redux Module

Módulo Redux para la gestión de revisiones técnicas de equipos tecnológicos.

## 🚀 Inicio Rápido

```typescript
import {
	// Thunks
	fetchBatches,
	fetchItems,
	startReview,

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

## 📁 Estructura

```
technicalReviews/
├── slice/              # Slice unificado + selectores
├── thunks/             # Operaciones por dominio
│   ├── batchesThunks.ts
│   ├── itemsThunks.ts
│   ├── reviewThunks.ts
│   ├── traceabilityThunks.ts
│   └── validationThunks.ts
├── types.ts            # Tipos TypeScript
├── index.ts            # Barrel exports
└── docs/               # Documentación completa
```

## 📚 Documentación

### Para Empezar

- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Cheat sheet con ejemplos de código
- **[File Tree](./docs/FILE_TREE.md)** - Árbol de archivos y navegación

### Guías Completas

- **[README Modular](./docs/README_MODULAR.md)** - Documentación completa del módulo
- **[Migration Summary](./docs/MIGRATION_SUMMARY.md)** - Contexto de migración

### Índice

- **[INDEX](./docs/INDEX.md)** - Índice maestro de toda la documentación

## 🎯 Dominios

### 1. Lotes (Modo A)

Gestión de lotes de equipos recibidos de proveedores.

```typescript
import { fetchBatches, createBatch } from '@/store/slices/technicalReviews';
```

### 2. Series/Items (Modo B)

Vista global de equipos individuales.

```typescript
import { fetchItems, createItem } from '@/store/slices/technicalReviews';
```

### 3. Revisión Técnica

Flujo de revisión paso a paso.

```typescript
import {
	startReview,
	updateItemDetails,
	completeReview,
	approveItem,
} from '@/store/slices/technicalReviews';
```

### 4. Trazabilidad

Estados comerciales e historial.

```typescript
import { changeCommercialStatus, reserveItem, markAsSold } from '@/store/slices/technicalReviews';
```

### 5. Validación

Reglas de validación y sugerencias.

```typescript
import { fetchValidationRules, validateField, suggestGrade } from '@/store/slices/technicalReviews';
```

## 📊 Cobertura

- **29 thunks** organizados en 5 dominios
- **26 selectores** para acceso al estado
- **20+ tipos** TypeScript
- **0 errores** de compilación

## 🔗 API Base

```
/api/branches/{branch}/technical-reviews/*
```

## ⚡ Ejemplo Completo

```typescript
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchBatches,
    selectBatches,
    selectBatchesLoading,
    type IBatch
} from '@/store/slices/technicalReviews';

const BatchesList: React.FC = () => {
    const dispatch = useDispatch();
    const batches = useSelector(selectBatches);
    const loading = useSelector(selectBatchesLoading);

    useEffect(() => {
        dispatch(fetchBatches({ branch: 1, page: 1 }));
    }, [dispatch]);

    if (loading) return <div>Cargando...</div>;

    return (
        <ul>
            {batches.map((batch: IBatch) => (
                <li key={batch.id}>Lote #{batch.id}</li>
            ))}
        </ul>
    );
};
```

## 🛠️ Mantenimiento

Para agregar nuevos thunks o extender funcionalidad, consulta:

- [README Modular - Sección Mantenimiento](./docs/README_MODULAR.md#-mantenimiento)

---

**Versión**: 2.0.0 (Modular)  
**Última Actualización**: Noviembre 2025
