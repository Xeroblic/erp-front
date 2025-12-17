# Comparativa: Antes vs Después

## 📊 Implementación de Tabla de Ventas

### ❌ ANTES (Client-Side Pagination)

```tsx
// ❌ Problema: Trae TODAS las ventas de una vez
function SalesListOld() {
	const dispatch = useDispatch();
	const sales = useSelector(selectSalesList);
	const loading = useSelector(selectSalesLoading);

	useEffect(() => {
		// Sin page → agrega todas las páginas (puede ser 1000+ registros)
		dispatch(
			loadSalesList({
				subsidiaryId: 1,
				filters: { with_customer: 1 },
			}),
		);
	}, []);

	const columns = [
		{ accessorKey: 'id', header: 'ID' },
		{ accessorKey: 'total', header: 'Total' },
	];

	return (
		<DataTable
			columns={columns}
			data={sales} // ← 1000+ registros
			pageSize={20} // ← Pagina localmente
			loading={loading}
		/>
	);
}
```

**Problemas:**

- 🐌 Lento: Trae 1000+ ventas al cargar
- 💾 Memoria: Almacena todo en Redux
- 🔄 Ineficiente: Re-renderiza con cada venta nueva
- 📡 Ancho de banda: Payload gigante inicial
- ⏱️ UX: Usuario espera que cargue todo

---

### ✅ DESPUÉS (Server-Side Pagination)

```tsx
// ✅ Solución: Trae solo 20 ventas por página
function SalesListNew() {
	const dispatch = useDispatch();
	const sales = useSelector(selectSalesList);
	const meta = useSelector(selectSalesMeta); // ← NUEVO
	const loading = useSelector(selectSalesLoading);

	const [pagination, setPagination] = useState({
		pageIndex: 0, // ← Página actual (0-indexed)
		pageSize: 20, // ← Elementos por página
	});

	const fetchSales = useCallback(() => {
		dispatch(
			loadSalesList({
				subsidiaryId: 1,
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

	const columns = [
		{ accessorKey: 'id', header: 'ID' },
		{ accessorKey: 'total', header: 'Total' },
	];

	return (
		<DataTable
			columns={columns}
			data={sales} // ← Solo 20 registros
			loading={loading}
			// Server-side pagination
			manualPagination={true} // ← Desactiva paginación local
			pageCount={meta?.last_page ?? 0} // ← Total páginas del backend
			paginationState={pagination} // ← Estado externo
			onPaginationChange={setPagination} // ← Callback al cambiar
		/>
	);
}
```

**Beneficios:**

- ⚡ Rápido: Solo 20 ventas por request
- 💾 Eficiente: Menos memoria usada
- 🔄 Optimizado: Solo re-renderiza la página actual
- 📡 Ligero: Payload pequeño (~10KB vs 1MB)
- ⏱️ UX: Carga instantánea

---

## 📊 Comparativa de Rendimiento

| Métrica              | Antes (Client-Side) | Después (Server-Side) | Mejora            |
| -------------------- | ------------------- | --------------------- | ----------------- |
| **Request inicial**  | 1000+ ventas        | 20 ventas             | 🚀 50x menos      |
| **Payload**          | ~1 MB               | ~10 KB                | 📦 100x menos     |
| **Tiempo de carga**  | 3-5 segundos        | 200-500 ms            | ⚡ 10x más rápido |
| **Memoria usada**    | ~15 MB              | ~500 KB               | 💾 30x menos      |
| **Requests totales** | 1 (carga todo)      | 1 por página          | ♻️ Bajo demanda   |

---

## 🔄 Flujo de Paginación

### ❌ ANTES

```
Usuario abre página
  ↓
Frontend hace 1 request SIN page
  ↓
Backend recorre TODAS las páginas (1, 2, 3, 4, 5...)
  ↓
Frontend agrega 1000+ ventas en array
  ↓
Redux guarda todo
  ↓
TanStack Table pagina localmente
  ↓
Usuario ve página 1, pero TODO está en memoria
```

### ✅ DESPUÉS

```
Usuario abre página
  ↓
Frontend hace request con page=1&per_page=20
  ↓
Backend retorna SOLO página 1 (20 ventas)
  ↓
Redux guarda 20 ventas + meta (last_page, total, etc.)
  ↓
TanStack Table muestra 20 ventas
  ↓
Usuario hace click en "Siguiente"
  ↓
Frontend hace request con page=2&per_page=20
  ↓
Backend retorna SOLO página 2
  ↓
Redux reemplaza con nueva página
```

---

## 🎯 Manejo de Filtros

### ❌ ANTES

```tsx
const [filters, setFilters] = useState({ status: '' });

// Filtro local → filtra sobre 1000+ registros ya cargados
const filteredSales = sales.filter((sale) =>
	filters.status ? sale.status === filters.status : true,
);

return <DataTable data={filteredSales} />;
```

**Problema:** Filtra localmente, pero ya cargó todo.

### ✅ DESPUÉS

```tsx
const [filters, setFilters] = useState({ status: '' });

const handleFilterChange = (key, value) => {
	setFilters((prev) => ({ ...prev, [key]: value }));
	setPagination((prev) => ({ ...prev, pageIndex: 0 })); // ← Reset a página 1
};

useEffect(() => {
	dispatch(
		loadSalesList({
			subsidiaryId: 1,
			filters: {
				page: pagination.pageIndex + 1,
				per_page: pagination.pageSize,
				...(filters.status && { status: filters.status }), // ← Filtro en backend
			},
		}),
	);
}, [pagination, filters]);

return (
	<div>
		<Select
			value={filters.status}
			onChange={(e) => handleFilterChange('status', e.target.value)}>
			<option value=''>Todos</option>
			<option value='completed'>Completado</option>
		</Select>

		<DataTable data={sales} manualPagination pageCount={meta?.last_page} />
	</div>
);
```

**Beneficio:** Filtra en backend → solo trae resultados relevantes.

---

## 📱 Experiencia de Usuario

### ❌ ANTES

```
[Página carga]
  ↓
🔄 Cargando... (3-5 segundos)
  ↓
✅ Muestra 20 ventas (de 1000 en memoria)
  ↓
Usuario hace click en "Siguiente"
  ↓
✅ Instantáneo (ya está en memoria)
```

**UX:** Carga inicial lenta, navegación rápida después.

### ✅ DESPUÉS

```
[Página carga]
  ↓
🔄 Cargando... (200-500 ms)
  ↓
✅ Muestra 20 ventas
  ↓
Usuario hace click en "Siguiente"
  ↓
🔄 Cargando... (200-500 ms)
  ↓
✅ Muestra siguiente página
```

**UX:** Carga inicial rápida, navegación con feedback visual.

---

## 🧩 Código Service

### ❌ ANTES

```typescript
export const fetchSalesList = async (
	subsidiaryId: number,
	filters: SalesListFilters = {},
): Promise<{ data: ISale[]; meta?: any }> => {
	const perPage = filters.per_page || 50;
	const params = { with_customer: 1, per_page: perPage, ...filters };

	// Si viene page, solo devuelve esa página
	if (filters.page) {
		const resp = await ApiService.fetchData({ url, method: 'get', params });
		return { data: resp.data?.data ?? [], meta: resp.data?.meta };
	}

	// Si NO viene page → agrega TODAS las páginas
	const aggregated: ISale[] = [];
	let page = 1;
	let lastPage = 1;

	do {
		const resp = await ApiService.fetchData({
			url,
			method: 'get',
			params: { ...params, page },
		});
		aggregated.push(...(resp.data?.data ?? []));
		lastPage = resp.data?.meta?.last_page ?? page;
		page += 1;
	} while (page <= lastPage);

	return { data: aggregated };
};
```

**Problema:** Mezcla dos responsabilidades (page vs aggregated).

### ✅ DESPUÉS

```typescript
// ✅ Server-side (tablas UI)
export const fetchSalesPage = async (
	subsidiaryId: number,
	filters: SalesListFilters = {},
): Promise<PaginatedResponse<ISale>> => {
	const params = { with_customer: 1, per_page: 20, ...filters };
	const resp = await ApiService.fetchData({ url, method: 'get', params });

	return {
		data: resp.data?.data ?? [],
		meta: resp.data?.meta ?? defaultMeta,
		links: resp.data?.links ?? defaultLinks,
	};
};

// ⚠️ Legacy (exportación/stats)
export const fetchSalesAggregated = async (
	subsidiaryId: number,
	filters: Omit<SalesListFilters, 'page'> = {},
): Promise<ISale[]> => {
	const aggregated: ISale[] = [];
	let page = 1;
	let lastPage = 1;

	do {
		const resp = await ApiService.fetchData({
			url,
			method: 'get',
			params: { ...filters, page },
		});
		aggregated.push(...(resp.data?.data ?? []));
		lastPage = resp.data?.meta?.last_page ?? page;
		page += 1;
	} while (page <= lastPage);

	return aggregated;
};
```

**Beneficio:** Separación clara de responsabilidades.

---

## 🎨 Redux State

### ❌ ANTES

```typescript
interface SalesState {
	list: ISale[]; // 1000+ ventas
	loading: boolean;
	error: string | null;
}
```

### ✅ DESPUÉS

```typescript
interface SalesState {
	list: ISale[]; // Solo 20 ventas (página actual)
	meta: PaginationMeta | null; // ← NUEVO: last_page, total, etc.
	links: PaginationLinks | null; // ← NUEVO: first, last, prev, next
	loading: boolean;
	error: string | null;
}
```

**Beneficio:** Información completa de paginación disponible.

---

## 🔗 Resumen

| Aspecto                    | Antes               | Después              |
| -------------------------- | ------------------- | -------------------- |
| **Estrategia**             | Client-side         | Server-side          |
| **Datos cargados**         | Todo                | Solo página actual   |
| **Memoria**                | Alta                | Baja                 |
| **Performance inicial**    | Lenta               | Rápida               |
| **Performance navegación** | Rápida              | Rápida con feedback  |
| **Complejidad**            | Baja                | Media                |
| **Escalabilidad**          | ❌ Limitada         | ✅ Excelente         |
| **UX**                     | Carga lenta inicial | Carga rápida siempre |

---

## 🎯 Cuándo Usar Cada Uno

### Client-Side (Antes)

✅ Usar cuando:

- Dataset pequeño (< 100 registros)
- Filtros/búsqueda deben ser instantáneos
- No hay paginación en backend
- Performance no es crítica

### Server-Side (Después)

✅ Usar cuando:

- Dataset grande (100+ registros)
- Performance es importante
- Backend soporta paginación
- Filtros pueden tener latencia aceptable
- Quieres reducir payload inicial

---

**Recomendación:** Para listados de ventas, productos, clientes, etc. con potencial de crecer, **siempre usar server-side pagination**.
