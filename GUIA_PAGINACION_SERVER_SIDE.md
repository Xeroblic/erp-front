# Guía de Paginación Server-Side

## 📋 Resumen

El sistema de paginación server-side permite manejar grandes volúmenes de datos (miles de registros) de forma eficiente, trayendo solo los datos de la página actual desde el backend.

**✅ Beneficios:**

- Rendimiento: Solo carga 5-50 registros a la vez (no 500+)
- Velocidad: Respuestas más rápidas del servidor
- UX: El usuario puede navegar por miles de registros sin lentitud

---

## 🎯 ¿Cómo Funciona?

### 1. El Backend (Laravel)

Laravel pagina automáticamente cuando usas `->paginate($perPage)`:

```php
// Ejemplo en Laravel
$sales = Sale::paginate($request->input('per_page', 20));
```

**Respuesta del backend:**

```json
{
	"data": [
		/* array de 5 ventas */
	],
	"meta": {
		"current_page": 1,
		"last_page": 102,
		"per_page": 5,
		"total": 509,
		"from": 1,
		"to": 5
	},
	"links": {
		"first": "https://api.com/sales?page=1",
		"last": "https://api.com/sales?page=102",
		"prev": null,
		"next": "https://api.com/sales?page=2"
	}
}
```

### 2. El Frontend (React + TanStack Table)

Cuando el usuario cambia de página en la UI, el frontend hace una **nueva petición HTTP** al backend con los parámetros:

- `page`: Número de página (1-indexed)
- `per_page`: Cantidad de resultados por página

**Flujo:**

```
Usuario click "Página 2"
  → Estado: { pageIndex: 1, pageSize: 5 }
  → Petición: GET /sales?page=2&per_page=5
  → Backend: Devuelve registros 6-10
  → UI: Muestra "Página 2 de 102"
```

---

## 🚀 Implementación Paso a Paso

### Opción A: Usando el Hook `useServerPagination` (Recomendado)

```tsx
import { useServerPagination } from '@/hooks/useServerPagination';
import { loadSalesList } from '@/store/slices/salesSlice';

function MiListaVentas() {
	const dispatch = useDispatch();
	const { subsidiaryId } = useCurrentBranch();

	// Definir filtros (opcional)
	interface MisFiltros {
		status?: string;
		q?: string;
	}

	// Hook de paginación
	const { pagination, onPaginationChange, filters, setFilter, clearFilters } =
		useServerPagination<MisFiltros>({
			initialPageSize: 5,
		});

	// Cargar datos cuando cambie paginación o filtros
	useEffect(() => {
		if (!subsidiaryId) return;

		dispatch(
			loadSalesList({
				subsidiaryId,
				filters: {
					page: pagination.pageIndex + 1, // TanStack usa 0-indexed
					per_page: pagination.pageSize,
					with_customer: 1,
					...filters,
				},
			}),
		);
	}, [dispatch, subsidiaryId, pagination, filters]);

	// Seleccionar datos de Redux
	const sales = useSelector(selectSalesList);
	const meta = useSelector(selectSalesMeta);
	const loading = useSelector(selectSalesLoading);

	return (
		<DataTable
			data={sales}
			columns={columns}
			loading={loading}
			// Props para server-side pagination ⬇️
			manualPagination
			pageCount={meta?.last_page ?? 1}
			paginationState={pagination}
			onPaginationChange={onPaginationChange}
		/>
	);
}
```

### Opción B: Manual (Sin Hook)

```tsx
import { PaginationState } from '@tanstack/react-table';

function MiListaVentas() {
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0, // Página 1 (0-indexed)
		pageSize: 5, // 5 resultados por página
	});

	const handlePaginationChange = useCallback(
		(updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
			setPagination(updater);
		},
		[],
	);

	useEffect(() => {
		dispatch(
			loadSalesList({
				subsidiaryId,
				filters: {
					page: pagination.pageIndex + 1, // Backend usa 1-indexed
					per_page: pagination.pageSize,
				},
			}),
		);
	}, [pagination]);

	return (
		<DataTable
			data={sales}
			columns={columns}
			manualPagination
			pageCount={meta?.last_page ?? 1}
			paginationState={pagination}
			onPaginationChange={handlePaginationChange}
		/>
	);
}
```

---

## 🔧 Servicio: `salesService.ts`

Ya está configurado para server-side pagination:

```typescript
export const fetchSalesPage = async (
	subsidiaryId: number,
	filters: SalesListFilters = {},
): Promise<PaginatedResponse<ISale>> => {
	const params = {
		with_customer: 1,
		per_page: 5, // Default
		...filters, // Puede sobrescribir page y per_page
	};

	const resp = await ApiService.fetchData<any>({
		url: `/subsidiaries/${subsidiaryId}/sales`,
		method: 'get',
		params,
	});

	return {
		data: resp.data?.data ?? [],
		meta:
			resp.data?.meta ??
			{
				/* defaults */
			},
		links:
			resp.data?.links ??
			{
				/* defaults */
			},
	};
};
```

---

## 🗄️ Redux Slice: `salesSlice.ts`

El thunk retorna `PaginatedResponse`:

```typescript
export const loadSalesList = createAsyncThunk<
	PaginatedResponse<ISale>,
	{ subsidiaryId: number; filters?: SalesListFilters }
>('salesModule/loadSalesList', async ({ subsidiaryId, filters = {} }) => {
	return await salesService.fetchSalesPage(subsidiaryId, filters);
});
```

El reducer almacena `meta` y `links`:

```typescript
const salesSlice = createSlice({
	name: 'salesModule',
	initialState: {
		list: [],
		meta: null, // ← Metadata de paginación
		links: null, // ← Links de navegación
	},
	extraReducers: (builder) => {
		builder.addCase(loadSalesList.fulfilled, (state, action) => {
			state.list = action.payload.data;
			state.meta = action.payload.meta; // ← Guardar meta
			state.links = action.payload.links; // ← Guardar links
		});
	},
});
```

Selectores:

```typescript
export const selectSalesMeta = (state: RootState) => state.salesModule.meta;
export const selectSalesLinks = (state: RootState) => state.salesModule.links;
```

---

## 🎨 Componente DataTable

### Props Necesarios para Server-Side

```tsx
interface DataTableProps<T> {
	// Props existentes
	data: T[];
	columns: ColumnDef<T>[];
	loading?: boolean;

	// Props para SERVER-SIDE pagination (opcionales)
	manualPagination?: boolean; // true = server-side
	pageCount?: number; // meta.last_page del backend
	paginationState?: PaginationState; // Estado externo
	onPaginationChange?: OnChangeFn<PaginationState>; // Callback
}
```

### Ejemplo de Uso

```tsx
<DataTable
	columns={columns}
	data={sales}
	loading={loading}
	// ✅ Server-side pagination
	manualPagination
	pageCount={meta?.last_page ?? 1}
	paginationState={pagination}
	onPaginationChange={handlePaginationChange}
/>
```

### ⚠️ Sin Server-Side (Client-Side)

```tsx
<DataTable
	columns={columns}
	data={allSales} // ⚠️ TODOS los registros
	pageSize={10} // ⚠️ Pagina localmente
/>
```

---

## 🔍 Debugging

### Verificar que está funcionando

1. **Abre DevTools → Network**
2. **Cambia de página en la UI**
3. **Deberías ver una petición HTTP**: `GET /api/subsidiaries/1/sales?page=2&per_page=5`

Si NO ves la petición, verifica:

```tsx
// ❌ MAL: useEffect sin dependencias de paginación
useEffect(() => {
	dispatch(loadSalesList({ subsidiaryId }));
}, [subsidiaryId]); // ← Falta pagination

// ✅ BIEN: useEffect con dependencias correctas
useEffect(() => {
	dispatch(
		loadSalesList({
			subsidiaryId,
			filters: {
				page: pagination.pageIndex + 1,
				per_page: pagination.pageSize,
			},
		}),
	);
}, [subsidiaryId, pagination]); // ← Incluye pagination
```

### Logs útiles

```tsx
useEffect(() => {
	console.log('📄 Cargando página:', pagination.pageIndex + 1);
	console.log('📊 Resultados por página:', pagination.pageSize);

	dispatch(
		loadSalesList({
			/* ... */
		}),
	);
}, [pagination]);
```

---

## 📊 Mostrar Información de Paginación

```tsx
function InfoPaginacion() {
	const meta = useSelector(selectSalesMeta);

	if (!meta) return null;

	return (
		<div>
			Mostrando {meta.from} - {meta.to} de {meta.total} resultados (Página {meta.current_page}{' '}
			de {meta.last_page})
		</div>
	);
}
```

---

## 🎯 Mejores Prácticas

### ✅ DO (Hacer)

1. **Usar `manualPagination`** para datasets grandes (>100 registros)
2. **Resetear a página 1** cuando cambien los filtros:
    ```tsx
    const applyFilters = (newFilters) => {
    	setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
    	// ...
    };
    ```
3. **Mostrar loading** mientras se cargan datos
4. **Usar meta.last_page** para `pageCount`, no calcular manualmente

### ❌ DON'T (No hacer)

1. **No usar `pageSize` prop** si usas `manualPagination`
2. **No olvidar `+1`** al convertir pageIndex (0-based) a page (1-based)
3. **No mezclar** client-side y server-side pagination en la misma tabla
4. **No ignorar el loading state** (puede causar parpadeos)

---

## 🔄 Conversión de Índices

TanStack Table usa **0-indexed**, Laravel usa **1-indexed**:

```tsx
// TanStack → Backend
const backendPage = pagination.pageIndex + 1;

// Backend → TanStack
const tanstackPageIndex = meta.current_page - 1;
```

---

## 📝 Ejemplo Completo Funcional

Ver archivo: `src/pages/ventas/SalesListExample.tsx`

```bash
# Archivos de referencia
src/
  pages/
    ventas/
      SalesListExample.tsx       # ← Ejemplo completo con filtros
      QuickStartSalesTable.tsx   # ← Template minimalista
      SalesListWithHook.tsx      # ← Usando useServerPagination
  hooks/
    useServerPagination.ts       # ← Hook reutilizable
  services/
    salesService.ts              # ← fetchSalesPage()
  store/
    slices/
      salesSlice.ts              # ← loadSalesList thunk
```

---

## 🐛 Troubleshooting

| Problema                             | Solución                                            |
| ------------------------------------ | --------------------------------------------------- |
| "Página 1 de 1" aunque hay más datos | Falta `pageCount={meta?.last_page}`                 |
| No cambia de página al hacer click   | Falta `onPaginationChange` o efecto mal configurado |
| Trae todos los registros             | Falta `manualPagination` prop                       |
| Error "pageIndex undefined"          | Falta `paginationState` prop                        |
| Siempre muestra página 1             | El efecto no tiene `pagination` en dependencias     |

---

## 🎓 Resumen

**3 pasos para server-side pagination:**

1. **Service**: Retornar `PaginatedResponse<T>` con data, meta, links
2. **Redux**: Guardar meta y links en el state
3. **Component**: Usar `manualPagination` + `pageCount` + `paginationState` + `onPaginationChange`

**Resultado:** Carga rápida, navegación fluida, miles de registros sin problemas.

---

## 📚 Referencias

- [TanStack Table - Manual Pagination](https://tanstack.com/table/v8/docs/guide/pagination#manual-pagination)
- [Laravel - Pagination](https://laravel.com/docs/pagination)
- Documentación interna: `SERVER_SIDE_PAGINATION.md`
