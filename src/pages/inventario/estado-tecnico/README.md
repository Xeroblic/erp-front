# Inventario por Estado Técnico (CU040)

## Descripción General

Módulo matricial para visualizar y gestionar el inventario por estado técnico de productos. Proporciona una vista en matriz de Bodega × Estado Técnico con drill-down modal para ver detalles específicos de productos.

## Funcionalidades Principales

### 1. Vista Matricial

-   **Matriz Bodega × Estado Técnico**: Intersección muestra cantidad de productos
-   **Totales por fila/columna**: Totalizadores automáticos por bodega y estado
-   **Estados técnicos soportados**: Nuevo, Usado, Reacondicionado, Dañado, Obsoleto

### 2. Drill-down Interactivo

-   **Click en celda**: Abre modal con detalles específicos del bucket
-   **Información detallada**: Productos individuales, condiciones, ubicaciones
-   **Deep-link**: Botón para navegar a inventario general filtrado

### 3. Filtros y Controles

-   **Filtro por bodega**: Vista de todas las bodegas o bodega específica
-   **Leyenda visual**: Estados técnicos con códigos de color
-   **Resumen general**: Totales por estado técnico

## Interfaces de Datos

### TechnicalState

```typescript
interface TechnicalState {
	id: string; // 'NEW', 'USED', 'REFURBISHED', 'DAMAGED', 'OBSOLETE'
	name: string; // Nombre mostrado
	description: string; // Descripción detallada
	color: string; // Color para badges y visualización
	order: number; // Orden de visualización
}
```

### ProductInBucket

```typescript
interface ProductInBucket {
	id: number;
	product_id: number;
	product_name: string;
	product_sku: string;
	serial_number?: string;
	quantity: number;
	condition_grade: string; // 'A+', 'A', 'B+', 'B', 'C', 'D'
	last_updated: string;
	location?: string; // Ubicación física en bodega
}
```

### InventoryBucketDetail

```typescript
interface InventoryBucketDetail {
	warehouse: Warehouse;
	tech_state: TechnicalState;
	total_quantity: number;
	products: ProductInBucket[];
	last_updated: string;
}
```

## Estados Técnicos Mock

```javascript
const TECHNICAL_STATES = [
	{
		id: 'NEW',
		name: 'Nuevo',
		description: 'Producto nuevo sin uso',
		color: 'green',
		order: 1,
	},
	{
		id: 'USED',
		name: 'Usado',
		description: 'Producto usado en buenas condiciones',
		color: 'blue',
		order: 2,
	},
	{
		id: 'REFURBISHED',
		name: 'Reacondicionado',
		description: 'Producto restaurado y verificado',
		color: 'amber',
		order: 3,
	},
	{
		id: 'DAMAGED',
		name: 'Dañado',
		description: 'Producto con daños que requiere reparación',
		color: 'red',
		order: 4,
	},
	{
		id: 'OBSOLETE',
		name: 'Obsoleto',
		description: 'Producto descontinuado o sin valor comercial',
		color: 'gray',
		order: 5,
	},
];
```

## Datos Mock de Inventario

El módulo incluye datos mock comprehensivos con:

-   **5 bodegas diferentes**: Central, Norte, Sur, Distribución, Reparaciones
-   **70+ productos**: Distribuidos entre diferentes estados técnicos
-   **Productos variados**: Laptops, monitores, tablets, smartphones, proyectores, etc.
-   **Grades de condición**: A+ (Excelente) hasta D (Deficiente)
-   **Ubicaciones físicas**: Códigos alfanuméricos por bodega (ej: A-01-03)
-   **Series y lotes**: Números de serie para productos individuales

### Ejemplos de Productos Mock

```javascript
// Productos nuevos en Bodega Central
NEW: {
    quantity: 45,
    products: [
        {
            id: 1,
            product_id: 1,
            product_name: 'Laptop Dell Inspiron 15',
            product_sku: 'LAP-DELL-15',
            serial_number: 'DL2025001',
            quantity: 15,
            condition_grade: 'A+',
            last_updated: '2025-09-10T10:00:00Z',
            location: 'A-01-03'
        },
        {
            id: 2,
            product_id: 2,
            product_name: 'Monitor Samsung 24"',
            product_sku: 'MON-SAM-24',
            quantity: 30,
            condition_grade: 'A',
            last_updated: '2025-09-09T14:30:00Z',
            location: 'B-02-01'
        }
    ]
}
```

## Componentes UI Utilizados

-   **Card/CardBody/CardHeader/CardTitle**: Contenedores principales
-   **Container**: Layout principal de la página
-   **Button**: Botones de acción y navegación
-   **Badge**: Etiquetas para estados técnicos y condiciones
-   **Select**: Dropdown para filtro de bodegas
-   **Modal/ModalHeader/ModalBody/ModalFooter**: Modal de detalles
-   **Table/THead/TBody/Tr/Th/Td**: Tabla de productos en modal
-   **PermissionGuard**: Control de permisos de acceso

## Permisos Requeridos

-   `ERP_PERMISSIONS.INVENTORY.VIEW`: Visualizar inventario general
-   El módulo principal no requiere permisos especiales (solo visualización)

## Funciones de Utilidad

### `calculateTotals()`

Calcula totales por estado técnico considerando filtros activos.

### `handleCellClick(warehouse, techState)`

Maneja el click en celdas de la matriz para mostrar modal de detalles.

### `getTechStateBadge(state, quantity)`

Genera badges con formato consistente para estados técnicos.

### `getConditionGradeBadge(grade)`

Genera badges para grados de condición de productos.

## UX/UI Guidelines

### Diseño Visual

-   **Matriz responsive**: Se adapta a diferentes tamaños de pantalla
-   **Códigos de color**: Estados técnicos tienen colores consistentes
-   **Hover effects**: Feedback visual al pasar sobre celdas interactivas
-   **Celdas vacías**: Estilo diferenciado para celdas sin productos

### Interacciones

-   **Click en celda**: Solo funcional si hay productos (quantity > 0)
-   **Tooltips**: Información contextual en hover
-   **Modal detallado**: Información completa del bucket seleccionado
-   **Deep-linking**: Navegación a inventario general con filtros aplicados

### Responsividad

-   **Mobile-first**: Grid adapta columnas en pantallas pequeñas
-   **Scroll horizontal**: Para matrices anchas en móvil
-   **Modal responsive**: Ajusta tamaño según viewport

## Casos de Uso

### UC040.1: Visualización de Matriz por Estado Técnico

1. Usuario accede al módulo de inventario por estado técnico
2. Sistema muestra matriz completa de todas las bodegas
3. Usuario puede filtrar por bodega específica
4. Sistema actualiza matriz y totales automáticamente

### UC040.2: Exploración de Bucket de Inventario

1. Usuario hace click en celda de matriz con productos
2. Sistema abre modal con detalles del bucket específico
3. Usuario ve productos individuales con condiciones y ubicaciones
4. Usuario puede navegar a inventario general filtrado

### UC040.3: Análisis de Estados Técnicos

1. Usuario revisa resumen general de estados técnicos
2. Sistema muestra distribución de productos por estado
3. Usuario identifica productos en estado dañado u obsoleto
4. Usuario puede tomar acciones correctivas (reparación, descarte, etc.)

## Integración con Sistema ERP

### APIs Esperadas

-   `GET /api/inventory/by-technical-state`: Datos de matriz
-   `GET /api/warehouses`: Lista de bodegas
-   `GET /api/products`: Información de productos
-   `PUT /api/inventory/technical-state`: Cambio de estado técnico

### Navegación

-   **Desde**: Menú principal → Inventario → Estado Técnico
-   **Hacia**: Inventario general (con filtros aplicados)
-   **Deep-link**: `/inventario?warehouse_id={id}&tech_state={state}`

### Estado Redux

-   `inventorySlice.techStateMatrix`: Datos de la matriz
-   `warehouseSlice.warehouses`: Lista de bodegas
-   `productSlice.products`: Catálogo de productos

## Mantenimiento y Extensibilidad

### Agregar Nuevos Estados Técnicos

1. Actualizar array `TECHNICAL_STATES`
2. Agregar color correspondiente en sistema de diseño
3. Actualizar interfaces TypeScript si es necesario

### Personalización por Cliente

-   Estados técnicos configurables vía administración
-   Colores y nombres personalizables
-   Campos adicionales en productos (garantía, proveedor, etc.)

### Performance

-   Lazy loading para bodegas con gran volumen
-   Paginación en modal de productos si > 50 items
-   Cache de datos de matriz por sesión
