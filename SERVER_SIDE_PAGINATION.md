# Refactor: Server-Side Pagination para Ventas

## 📋 Resumen

Este refactor implementa **paginación server-side real** contra Laravel para el listado de ventas, eliminando la paginación local de TanStack Table y usando los datos de `meta` y `links` del backend.

## 🎯 Cambios Principales

### 1. `salesService.ts` - Servicio refactorizado

#### ✅ Nuevas funciones

**`fetchSalesPage()`** - Recomendada para tablas UI

```typescript
const result = await salesService.fetchSalesPage(subsidiaryId, {
	page: 1,
	per_page: 20,
	status: 'completed',
	with_customer: 1,
});

// Retorna: { data: ISale[], meta: PaginationMeta, links: PaginationLinks }
```

**`fetchSalesAggregated()`** - Para exportación/estadísticas

```typescript
const allSales = await salesService.fetchSalesAggregated(subsidiaryId, {
	status: 'completed',
	per_page: 100, // por página durante la agregación
});

// Retorna: ISale[] (todas las páginas)
```

#### ⚠️ Deprecado (mantener compatibilidad)

**`fetchSalesList()`** - Solo para código legacy

- Si `filters.page` está definido → llama `fetchSalesPage()`
- Si NO está definido → llama `fetchSalesAggregated()`

#### 📊 Nuevos tipos

```typescript
export interface PaginationMeta {
	current_page: number;
	from: number | null;
	last_page: number;
	per_page: number;
	to: number | null;
	total: number;
}

export interface PaginationLinks {
	first: string | null;
	last: string | null;
	prev: string | null;
	next: string | null;
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: PaginationMeta;
	links: PaginationLinks;
}
```

---

### 2. `salesSlice.ts` - Redux con meta

#### ✅ Estado actualizado

```typescript
export interface SalesState {
	list: SaleListItem[];
	meta: PaginationMeta | null; // ← NUEVO
	links: PaginationLinks | null; // ← NUEVO
	detail: SaleDetail | null;
	items: SaleItem[];
	loading: boolean;
	error?: string | null;
}
```

#### ✅ Thunk actualizado

```typescript
export const loadSalesList = createAsyncThunk<
	PaginatedResponse<SaleListItem>, // ← Ahora retorna toda la estructura
	{ subsidiaryId: number; filters?: SalesListFilters },
	{ rejectValue: string }
>('salesModule/loadSalesList', async ({ subsidiaryId, filters = {} }, { rejectWithValue }) => {
	const result = await salesService.fetchSalesPage(subsidiaryId, filters);
	return result; // { data, meta, links }
});
```

#### ✅ Nuevos selectores

```typescript
export const selectSalesList = (state: RootState) => ...;   // ISale[]
export const selectSalesMeta = (state: RootState) => ...;    // PaginationMeta | null ← NUEVO
export const selectSalesLinks = (state: RootState) => ...;   // PaginationLinks | null ← NUEVO
export const selectSalesLoading = (state: RootState) => ...;
export const selectSalesError = (state: RootState) => ...;
```

---

### 3. `DataTable.tsx` - Soporte opcional para server-side

#### ✅ Nuevas props opcionales

```typescript
interface DataTableProps<TData> {
	// ... props existentes

	// Server-side pagination (opcional)
	manualPagination?: boolean; // ← Activa modo server-side
	pageCount?: number; // ← meta.last_page del backend
	paginationState?: PaginationState; // ← { pageIndex, pageSize } externo
	onPaginationChange?: OnChangeFn<PaginationState>; // ← Callback al cambiar página
}
```

#### 📌 Modo client-side (por defecto, sin cambios)

```tsx
<DataTable columns={columns} data={localData} pageSize={10} />
```

#### 📌 Modo server-side (nuevo)

```tsx
<DataTable
	columns={columns}
	data={sales}
	manualPagination={true}
	pageCount={meta?.last_page ?? 0}
	paginationState={pagination}
	onPaginationChange={handlePaginationChange}
/>
```

#### ⚙️ Lógica interna

- Si `manualPagination={true}`:
    - NO usa `getPaginationRowModel()` (no repagina localmente)
    - Usa `pageCount` externo para calcular "última página"
    - Llama `onPaginationChange` cuando el usuario cambia página/tamaño
- Si `manualPagination={false}` (default):
    - Comportamiento anterior sin cambios (client-side)

---

### 4. `TableFooterTemplateV2.tsx` - Sin cambios

✅ **No requiere modificación**. El footer ya funciona correctamente:

- Lee `table.getState().pagination` (que ahora puede ser controlado externamente)
- Llama `table.setPageSize()` y `table.setPageIndex()` (que disparan `onPaginationChange`)
- Muestra `table.getPageCount()` (que ahora puede venir del backend via `pageCount`)

---

## 🚀 Ejemplo de uso completo

Ver: [`src/pages/ventas/SalesListExample.tsx`](src/pages/ventas/SalesListExample.tsx)

### Características del ejemplo:

1. **Estado de paginación local sincronizado con TanStack Table**

    ```typescript
    const [pagination, setPagination] = React.useState<PaginationState>({
    	pageIndex: 0, // 0-indexed para TanStack
    	pageSize: 20,
    });
    ```

2. **Fetch al cambiar página o filtros**

    ```typescript
    const fetchSales = useCallback(() => {
    	dispatch(
    		loadSalesList({
    			subsidiaryId,
    			filters: {
    				...filters,
    				page: pagination.pageIndex + 1, // Backend usa 1-indexed
    				per_page: pagination.pageSize,
    				with_customer: 1,
    			},
    		}),
    	);
    }, [pagination, filters]);

    useEffect(() => {
    	fetchSales();
    }, [fetchSales]);
    ```

3. **Reset a página 1 al cambiar filtros**

    ```typescript
    const handleFilterChange = (key: string, value: string) => {
    	setFilters((prev) => ({ ...prev, [key]: value }));
    	setPagination((prev) => ({ ...prev, pageIndex: 0 })); // ← Reset
    };
    ```

4. **Pasar meta.last_page a DataTable**
    ```tsx
    <DataTable
    	manualPagination={true}
    	pageCount={meta?.last_page ?? 0}
    	paginationState={pagination}
    	onPaginationChange={handlePaginationChange}
    />
    ```

---

## 📊 Flujo de datos

```
Usuario cambia página en UI
         ↓
TableFooterTemplateV2 llama table.setPageIndex(N)
         ↓
TanStack Table llama onPaginationChange({ pageIndex: N, pageSize: M })
         ↓
Componente actualiza estado local setPagination({ pageIndex: N, pageSize: M })
         ↓
useEffect detecta cambio en [pagination] → dispara fetchSales()
         ↓
fetchSales() → dispatch(loadSalesList({ page: N+1, per_page: M }))
         ↓
salesService.fetchSalesPage() → GET /api/subsidiaries/X/sales?page=N+1&per_page=M
         ↓
Backend Laravel retorna { data: [...], meta: {...}, links: {...} }
         ↓
Redux guarda: state.list = data, state.meta = meta, state.links = links
         ↓
Componente lee nuevos sales y meta desde selectores
         ↓
DataTable renderiza nueva página
```

---

## 🔄 Migración de código existente

### Antes (client-side pagination)

```tsx
const SalesListOld = () => {
	const dispatch = useDispatch();
	const sales = useSelector(selectSalesList);

	useEffect(() => {
		dispatch(
			loadSalesList({
				subsidiaryId,
				filters: {}, // Sin page → agregaba todo
			}),
		);
	}, []);

	return <DataTable columns={columns} data={sales} />;
};
```

### Después (server-side pagination)

```tsx
const SalesListNew = () => {
	const dispatch = useDispatch();
	const sales = useSelector(selectSalesList);
	const meta = useSelector(selectSalesMeta);

	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 20,
	});

	const fetchSales = useCallback(() => {
		dispatch(
			loadSalesList({
				subsidiaryId,
				filters: {
					page: pagination.pageIndex + 1,
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
			columns={columns}
			data={sales}
			manualPagination={true}
			pageCount={meta?.last_page ?? 0}
			paginationState={pagination}
			onPaginationChange={setPagination}
		/>
	);
};
```

---

## ✅ Checklist de integración

- [ ] Cambiar `fetchSalesList` por `fetchSalesPage` en nuevas implementaciones
- [ ] Agregar estado `pagination` local en componente de lista
- [ ] Leer `selectSalesMeta` para obtener `last_page`
- [ ] Pasar `manualPagination={true}` a `<DataTable>`
- [ ] Pasar `pageCount={meta?.last_page ?? 0}`
- [ ] Implementar `onPaginationChange` para actualizar estado local
- [ ] Crear `useEffect` que dispare fetch cuando cambie `pagination`
- [ ] Resetear `pageIndex` a 0 cuando cambien filtros
- [ ] Enviar `page: pageIndex + 1` (backend usa 1-indexed)
- [ ] Enviar `per_page: pageSize`

---

## 🧪 Testing

### Backend esperado (Laravel)

```bash
GET /api/subsidiaries/1/sales?page=2&per_page=20&with_customer=1&status=completed
```

**Respuesta esperada:**

```json
{
  "data": [
    { "id": 21, "wc_order_id": 1234, "status": "completed", ... },
    // ... 19 más
  ],
  "meta": {
    "current_page": 2,
    "from": 21,
    "last_page": 5,
    "per_page": 20,
    "to": 40,
    "total": 93
  },
  "links": {
    "first": "http://api.test/subsidiaries/1/sales?page=1",
    "last": "http://api.test/subsidiaries/1/sales?page=5",
    "prev": "http://api.test/subsidiaries/1/sales?page=1",
    "next": "http://api.test/subsidiaries/1/sales?page=3"
  }
}
```

---

## 🛡️ Compatibilidad con código legacy

✅ **Código viejo NO se rompe:**

- `DataTable` sin props nuevas → sigue usando client-side pagination
- `fetchSalesList` sin `page` → sigue agregando todo (deprecated pero funcional)
- Componentes existentes no requieren cambios inmediatos

---

## 📝 Notas finales

1. **Performance**: Server-side pagination reduce drásticamente el payload inicial (20 ventas vs 1000+)
2. **Escalabilidad**: Soporta miles de ventas sin degradar la UI
3. **UX**: El usuario puede navegar páginas sin esperar a cargar todo
4. **Backend**: NO requiere cambios, Laravel ya retorna `meta` y `links`
5. **Filtros**: Aplican en el backend, no filtran localmente
6. **Búsqueda**: El input de búsqueda debe hacer fetch, no filtrar localmente

---

## 🔗 Archivos modificados

- ✅ `src/services/salesService.ts`
- ✅ `src/store/slices/salesSlice.ts`
- ✅ `src/components/ui/DataTable/DataTable.tsx`
- ℹ️ `src/templates/Table/TableFooterTemplateV2.tsx` (sin cambios)
- 📄 `src/pages/ventas/SalesListExample.tsx` (ejemplo nuevo)
- 📄 `SERVER_SIDE_PAGINATION.md` (esta documentación)

---

## 🆘 Troubleshooting

### "pageCount es -1 o undefined"

- Verificar que `meta?.last_page` existe
- Usar fallback: `pageCount={meta?.last_page ?? 0}`

### "La tabla no cambia cuando hago click en siguiente página"

- Verificar que `onPaginationChange` actualiza el estado
- Verificar que `useEffect` escucha `[pagination]`
- Confirmar que `dispatch(loadSalesList)` se ejecuta

### "Se hace doble fetch al montar"

- Normal con StrictMode en desarrollo
- Verificar que `useCallback` tiene las dependencias correctas

### "Filtros no resetean a página 1"

- Agregar `setPagination(prev => ({ ...prev, pageIndex: 0 }))` al cambiar filtro

### "Backend retorna 404 en página que no existe"

- Validar que `pageIndex + 1 <= meta.last_page`
- Laravel retorna error si `page > last_page`
