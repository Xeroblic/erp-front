# Módulo de Historial de Inventario (CU024)

## Descripción

Página dedicada al historial completo de movimientos de inventario con funcionalidades avanzadas de filtrado, búsqueda y visualización usando TanStack Table. Permite consulta de solo lectura con modal de información detallada para cada movimiento.

## Casos de Uso

-   **CU024**: Historial de movimientos de inventario

## Ubicación

-   **Ruta**: `/inventario/historial`
-   **Componente**: `src/pages/inventario/historial/HistorialInventario.tsx`

## Funcionalidades

### Tabla TanStack con Funciones Avanzadas

-   **Ordenamiento**: Por cualquier columna (ascendente/descendente)
-   **Filtrado por columna**: Filtros específicos para cada campo
-   **Búsqueda global**: Texto libre en todos los campos
-   **Paginación**: 20 registros por página con navegación
-   **Columnas redimensionables**: Ajuste dinámico de ancho

### Sistema de Filtros Avanzado

-   **Fecha**: Rango desde/hasta con date picker
-   **Tipo**: Dropdown con todos los tipos de movimiento
-   **SKU**: Búsqueda por código de producto
-   **Bodega**: Selección por bodega específica
-   **Sucursal**: Filtro por sucursal
-   **Usuario**: Filtro por usuario responsable
-   **Tipo de referencia**: Origen del movimiento (transfer, sale, purchase, etc.)
-   **ID de referencia**: Número específico de referencia

### Modal de Información (InfoMovementModal)

-   **Información completa** del movimiento seleccionado
-   **Datos del producto** con SKU y nombre
-   **Trazabilidad** con referencia al origen
-   **Deep-linking** a documento de origen
-   **Formato visual** con badges y colores diferenciados

### Deep-linking desde Transferencias

-   **URL con parámetros**: `/inventario/historial?tipo=TRANSFER&ref_id=123`
-   **Auto-filtrado**: Aplicación automática de filtros desde URL
-   **Integración**: Navegación directa desde confirmación de transferencias

## Permisos Requeridos

-   `inventory.view_movements` - Para acceder al historial

## Datos Mock (5+ registros)

### Movimientos de Inventario

```typescript
const MOCK_MOVEMENTS: IInventoryMovement[] = [
	{
		id: 1,
		movement_number: 'MOV-001',
		movement_type: 'TRANSFER',
		quantity: 5,
		reference_type: 'transfer',
		reference_id: 123,
		performed_by: 1,
		performed_at: '2025-09-10T10:00:00Z',
		product: { name: 'Laptop Dell Inspiron 15', sku: 'LAP-DELL-15' },
		warehouse: { name: 'Bodega Central' },
		performer: { name: 'Ana García' },
	},
	// ... más registros
];
```

### Bodegas (4 registros)

```typescript
const MOCK_WAREHOUSES = [
	{ id: 1, name: 'Bodega Central', code: 'BC01' },
	{ id: 2, name: 'Bodega Norte', code: 'BN02' },
	{ id: 3, name: 'Bodega Sur', code: 'BS03' },
	{ id: 4, name: 'Bodega Distribución', code: 'BD04' },
];
```

### Sucursales (3 registros)

```typescript
const MOCK_BRANCHES = [
	{ id: 1, name: 'Sucursal Principal', code: 'SP01' },
	{ id: 2, name: 'Sucursal Norte', code: 'SN02' },
	{ id: 3, name: 'Sucursal Sur', code: 'SS03' },
];
```

### Usuarios (4 registros)

```typescript
const MOCK_USERS = [
	{ id: 1, name: 'Ana García' },
	{ id: 2, name: 'Carlos Rodríguez' },
	{ id: 3, name: 'María López' },
	{ id: 4, name: 'José Martínez' },
];
```

## Columnas de la Tabla

1. **Número**: Código único del movimiento (font-mono)
2. **Tipo**: Badge con color según tipo (IN/OUT/TRANSFER/ADJUSTMENT/etc.)
3. **Fecha**: Formato localizado (DD/MM/YYYY)
4. **SKU**: Código del producto (font-mono)
5. **Producto**: Nombre del producto
6. **Cantidad**: Con indicador visual (+/- y colores verde/rojo)
7. **Bodega**: Nombre de la bodega afectada
8. **Usuario**: Nombre del usuario responsable
9. **Referencia**: Tipo y ID de referencia si existe
10. **Acciones**: Botón de información para abrir modal

## Tipos de Badge por Movimiento

```typescript
const typeConfig = {
	IN: { color: 'green', text: 'Entrada', icon: '↗️' },
	OUT: { color: 'red', text: 'Salida', icon: '↙️' },
	ADJUSTMENT: { color: 'blue', text: 'Ajuste', icon: '⚖️' },
	TRANSFER: { color: 'purple', text: 'Transferencia', icon: '🔄' },
	PRODUCTION: { color: 'amber', text: 'Producción', icon: '🏭' },
	RETURN: { color: 'orange', text: 'Devolución', icon: '↩️' },
};
```

## Integración con TanStack Table

### Características Implementadas

-   **createColumnHelper**: Definición tipada de columnas
-   **useReactTable**: Hook principal con configuración completa
-   **Sorting**: Estado de ordenamiento persistente
-   **Filtering**: Filtros por columna y global
-   **Pagination**: Control de páginas con información de estado

### Estados Manejados

```typescript
const [sorting, setSorting] = useState<SortingState>([]);
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
const [globalFilter, setGlobalFilter] = useState('');
```

## Modal de Información del Movimiento

### Secciones del Modal

1. **Header**: Título "Información del Movimiento"
2. **Información Básica**: Número, tipo, fecha, usuario (grid 2 columnas)
3. **Producto**: Card con nombre y SKU destacados
4. **Cantidad y Bodega**: Grid con formato visual de cantidad
5. **Referencia**: Card especial con botón de deep-link
6. **Notas**: Área expandible si existen notas
7. **Footer**: Botón de cerrar

### Deep-linking de Referencias

-   **Transferencias**: Abre `/inventario/transferencias?id={reference_id}` en nueva pestaña
-   **Ventas**: Futuro enlace a módulo de ventas
-   **Compras**: Futuro enlace a módulo de compras

## Parámetros de URL Soportados

### Query Parameters

-   `tipo`: Filtro automático por tipo de movimiento
-   `ref_id`: Filtro por ID de referencia específico
-   **Ejemplo**: `/inventario/historial?tipo=TRANSFER&ref_id=123`

### Aplicación Automática

El componente detecta parámetros de URL al cargar y aplica filtros correspondientes automáticamente.

## Validaciones y Estados

### Estados de Carga

-   **Loading**: Indicador durante fetch de datos
-   **Empty State**: Mensaje cuando no hay registros
-   **Error State**: Manejo de errores de red

### Validaciones de Filtros

-   **Fechas**: Validación de formato y rango coherente
-   **Números**: Validación para campos numéricos
-   **Selecciones**: Validación de opciones existentes

## Responsive Design

-   **Mobile**: Grid colapsable y tabla con scroll horizontal
-   **Desktop**: Grid completo con todas las columnas visibles
-   **Tablet**: Adaptación intermedia con columns essenciales

## Accesibilidad

-   **Keyboard Navigation**: Navegación completa por teclado
-   **Screen Readers**: Labels descriptivos y ARIA attributes
-   **Color Contrast**: Cumplimiento con estándares WCAG
-   **Focus Management**: Manejo apropiado del foco en modales
