# Server-Side Pagination - Resumen Ejecutivo

## ✅ Refactor Completado

He refactorizado tu frontend React + TypeScript + Redux Toolkit + TanStack Table para usar **paginación server-side real** contra Laravel, sin tocar el backend.

---

## 📦 Archivos Entregados

### 1. Archivos Refactorizados (CORE)

| Archivo                                                                      | Cambios                                                                                     | Estado |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------ |
| [`salesService.ts`](src/services/salesService.ts)                            | ✅ Separado `fetchSalesPage()` y `fetchSalesAggregated()`, tipos `PaginationMeta/Links`     | LISTO  |
| [`salesSlice.ts`](src/store/slices/salesSlice.ts)                            | ✅ Agregado `meta` y `links` al state, thunk retorna `PaginatedResponse`                    | LISTO  |
| [`DataTable.tsx`](src/components/ui/DataTable/DataTable.tsx)                 | ✅ Props opcionales para server-side: `manualPagination`, `pageCount`, `onPaginationChange` | LISTO  |
| [`TableFooterTemplateV2.tsx`](src/templates/Table/TableFooterTemplateV2.tsx) | ℹ️ Sin cambios (ya funciona con paginación externa)                                         | OK     |

### 2. Ejemplos de Uso

| Archivo                                                                 | Descripción                                                       |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [`SalesListExample.tsx`](src/pages/ventas/SalesListExample.tsx)         | Ejemplo completo con filtros, paginación server-side y debug info |
| [`QuickStartSalesTable.tsx`](src/pages/ventas/QuickStartSalesTable.tsx) | Template mínimo para copiar/pegar con checklist y notas           |
| [`SalesListWithHook.tsx`](src/pages/ventas/SalesListWithHook.tsx)       | Ejemplo usando hook personalizado (menos boilerplate)             |

### 3. Utilidades y Documentación

| Archivo                                                      | Descripción                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| [`useServerPagination.ts`](src/hooks/useServerPagination.ts) | Hook reutilizable para simplificar implementación              |
| [`SERVER_SIDE_PAGINATION.md`](SERVER_SIDE_PAGINATION.md)     | Documentación técnica completa (flujo, tipos, troubleshooting) |
| [`RESUMEN_REFACTOR.md`](RESUMEN_REFACTOR.md)                 | Este archivo (resumen ejecutivo)                               |

---

## 🚀 Cómo Usar (Quick Start)

### Opción A: Con Hook Personalizado (Recomendado)

```tsx
import { useServerPagination } from '@/hooks/useServerPagination';

const { pagination, onPaginationChange, filters, setFilter, clearFilters } = useServerPagination({
	initialPageSize: 20,
	initialFilters: { status: '', q: '' },
	onFetchData: ({ page, per_page, filters }) => {
		dispatch(
			loadSalesList({
				subsidiaryId,
				filters: { page, per_page, ...filters, with_customer: 1 },
			}),
		);
	},
});

return (
	<DataTable
		data={sales}
		manualPagination
		pageCount={meta?.last_page ?? 0}
		paginationState={pagination}
		onPaginationChange={onPaginationChange}
	/>
);
```

### Opción B: Manual (Control Total)

```tsx
const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

const fetchSales = useCallback(() => {
	dispatch(
		loadSalesList({
			subsidiaryId,
			filters: {
				page: pagination.pageIndex + 1, // ← Backend usa 1-indexed
				per_page: pagination.pageSize,
				with_customer: 1,
			},
		}),
	);
}, [pagination]);

useEffect(() => {
	fetchSales();
}, [fetchSales]);

return (
	<DataTable
		data={sales}
		manualPagination={true}
		pageCount={meta?.last_page ?? 0}
		paginationState={pagination}
		onPaginationChange={setPagination}
	/>
);
```

---

## 🔑 Cambios Clave

### 1. `salesService.ts`

**Antes:**

```typescript
fetchSalesList(subsidiaryId, filters);
// - Si filters.page: 1 request
// - Si NO: agrega todas las páginas (legacy)
// - Retorna: { data: ISale[], meta?: any }
```

**Después:**

```typescript
// ✅ Para tablas UI (recomendado)
fetchSalesPage(subsidiaryId, filters);
// Retorna: { data: ISale[], meta: PaginationMeta, links: PaginationLinks }

// ⚠️ Para exportación/stats (legacy)
fetchSalesAggregated(subsidiaryId, filters);
// Retorna: ISale[] (todas las páginas)
```

### 2. `salesSlice.ts`

**Antes:**

```typescript
state = {
  list: ISale[],
  loading: boolean,
  error: string | null,
}
```

**Después:**

```typescript
state = {
  list: ISale[],
  meta: PaginationMeta | null,    // ← NUEVO
  links: PaginationLinks | null,  // ← NUEVO
  loading: boolean,
  error: string | null,
}

// Nuevos selectores
selectSalesMeta(state)   // → meta con last_page, total, etc.
selectSalesLinks(state)  // → links de navegación
```

### 3. `DataTable.tsx`

**Antes:**

```tsx
<DataTable columns={cols} data={data} pageSize={10} />
// Solo client-side pagination
```

**Después:**

```tsx
// Client-side (sin cambios)
<DataTable columns={cols} data={data} pageSize={10} />

// Server-side (nuevo)
<DataTable
  columns={cols}
  data={data}
  manualPagination={true}              // ← Activa server-side
  pageCount={meta?.last_page ?? 0}     // ← Total de páginas
  paginationState={pagination}         // ← Estado externo
  onPaginationChange={setPagination}   // ← Callback
/>
```

---

## 📊 Tipos Nuevos

```typescript
// Meta de paginación de Laravel
interface PaginationMeta {
	current_page: number;
	from: number | null;
	last_page: number; // ← pageCount para TanStack Table
	per_page: number;
	to: number | null;
	total: number; // ← Total de registros
}

// Links de navegación
interface PaginationLinks {
	first: string | null;
	last: string | null;
	prev: string | null;
	next: string | null;
}

// Respuesta completa
interface PaginatedResponse<T> {
	data: T[];
	meta: PaginationMeta;
	links: PaginationLinks;
}
```

---

## ⚡ Características

✅ **Server-side pagination real** - No repagina localmente  
✅ **Filtros con reset automático** - Vuelve a página 1 al filtrar  
✅ **Tipos TypeScript estrictos** - Sin `any`  
✅ **Backward compatible** - Código viejo sigue funcionando  
✅ **Hook reutilizable** - Menos boilerplate  
✅ **Meta del backend** - `last_page`, `total`, `from/to`  
✅ **Sin cambios en backend** - Laravel ya retorna todo

---

## 🎯 Próximos Pasos

1. **Revisar ejemplos:**
    - [`SalesListExample.tsx`](src/pages/ventas/SalesListExample.tsx) - Completo
    - [`QuickStartSalesTable.tsx`](src/pages/ventas/QuickStartSalesTable.tsx) - Rápido
    - [`SalesListWithHook.tsx`](src/pages/ventas/SalesListWithHook.tsx) - Con hook

2. **Migrar pantalla de ventas actual:**
    - Reemplazar implementación existente con una de los ejemplos
    - Ajustar columnas según necesidad
    - Agregar filtros específicos

3. **Aplicar a otras pantallas:**
    - Mismo patrón para productos, clientes, etc.
    - Crear servicios similares: `fetchProductsPage()`, etc.
    - Usar `useServerPagination` hook para consistencia

---

## 📝 Checklist de Implementación

Cuando implementes en una pantalla nueva:

- [ ] Leer `meta` desde Redux con `selectSalesMeta`
- [ ] Crear estado local `pagination` con `{ pageIndex: 0, pageSize: 20 }`
- [ ] Enviar `page: pageIndex + 1` al backend (Laravel usa 1-indexed)
- [ ] Enviar `per_page: pageSize`
- [ ] Resetear `pageIndex` a 0 cuando cambien filtros
- [ ] Pasar `manualPagination={true}` a `DataTable`
- [ ] Pasar `pageCount={meta?.last_page ?? 0}`
- [ ] Pasar `paginationState={pagination}`
- [ ] Pasar `onPaginationChange` handler
- [ ] Crear `useEffect` que escuche cambios en `[pagination, filters]`

---

## 🛡️ Compatibilidad

### ✅ Código Viejo NO se Rompe

- `DataTable` sin props nuevas → client-side pagination (como antes)
- `fetchSalesList` sin `page` → agrega todas las páginas (deprecated)
- Otros componentes no requieren cambios inmediatos

### ⚠️ Deprecaciones

- `fetchSalesList` → usar `fetchSalesPage` o `fetchSalesAggregated`
- Client-side pagination en tablas grandes → migrar a server-side

---

## 📚 Documentación Adicional

Ver [`SERVER_SIDE_PAGINATION.md`](SERVER_SIDE_PAGINATION.md) para:

- Flujo de datos completo
- Troubleshooting
- Errores comunes
- Detalles técnicos

---

## 🔗 Links Útiles

- Documentación TanStack Table: https://tanstack.com/table/latest
- Laravel Pagination: https://laravel.com/docs/pagination
- TypeScript Strict Mode: https://www.typescriptlang.org/tsconfig#strict

---

## ✨ Mejoras Futuras (Opcional)

1. **Sorting server-side**: Agregar `sortBy` y `sortOrder` a filtros
2. **Debounce en búsqueda**: Evitar fetch en cada tecla
3. **Cache de páginas**: Guardar páginas visitadas en Redux
4. **Infinite scroll**: Alternativa a paginación tradicional
5. **URL sync**: Persistir paginación en query params

---

**Refactor completado por:** GitHub Copilot  
**Fecha:** 17 de diciembre de 2025  
**Backend:** Laravel (sin modificar)  
**Frontend:** React + TypeScript + Redux Toolkit + TanStack Table
