# Componentes de Detalle de Bodega

Esta carpeta contiene todos los componentes separados para la página de detalle de bodega (`WarehouseDetailPage`).

## 📁 Estructura

```
detallesComponents/
├── cards/                      # Cards/Secciones principales
│   ├── WarehouseInfoCard.tsx           # Información general de la bodega
│   ├── AssociatedProductsCard.tsx      # Card con productos asociados
│   └── AvailableProductsCard.tsx       # Card con productos disponibles
├── tables/                     # Tablas
│   ├── AssociatedProductsTable.tsx     # Tabla de productos asociados
│   └── AvailableProductsTable.tsx      # Tabla de productos disponibles
├── modals/                     # Modales
│   ├── RemoveProductModal.tsx          # Confirmar eliminación de producto
│   ├── AttachProductModal.tsx          # Asociar producto a bodega
│   └── ManualQuantityModal.tsx         # Ingresar cantidad manual
├── hooks/                      # Custom Hooks
│   ├── useWarehouseDetail.ts           # Lógica de negocio (API calls)
│   └── useWarehouseDetailModals.ts     # Estado de modales y UI
└── README.md                   # Este archivo
```

## 🎯 Componentes

### Cards

#### `WarehouseInfoCard`

**Props:**

- `warehouse`: Objeto con `name`, `code`, `branch_name`

**Descripción:** Muestra la información general de la bodega en un grid de 3 columnas.

---

#### `AssociatedProductsCard`

**Props:**

- `products`: Array de productos asociados
- `allProducts`: Array completo de productos (para obtener datos adicionales)
- `updatingSyncIds`: Array de IDs en proceso de actualización
- `onSyncToggle`: Callback para cambiar modo sync/manual
- `onRemoveProduct`: Callback para quitar producto

**Descripción:** Envuelve la tabla de productos asociados en un Card.

---

#### `AvailableProductsCard`

**Props:**

- `products`: Array de productos disponibles
- `loading`: Indica si está cargando
- `onAttachProduct`: Callback para asociar producto

**Descripción:** Envuelve la tabla de productos disponibles en un Card. Solo visible cuando `isEditable` está activo.

---

### Tables

#### `AssociatedProductsTable`

**Props:**

- `products`: Array de productos asociados
- `allProducts`: Array completo de productos
- `updatingSyncIds`: Array de IDs en proceso de actualización
- `onSyncToggle`: `(productId, turningOn, currentQty) => void`
- `onRemoveProduct`: `(product) => void`

**Descripción:** Tabla con columnas:

- SKU
- Nombre
- Marca
- Stock
- Cantidad
- Modo (Auto-Sync / Manual)
- Acciones (Switch sync, Ver, Quitar)

---

#### `AvailableProductsTable`

**Props:**

- `products`: Array de productos disponibles
- `loading`: Indica si está cargando
- `onAttachProduct`: `(product) => void`

**Descripción:** Tabla con columnas:

- SKU
- Nombre
- Marca
- Stock
- Acción (Botón "Asociar")

---

### Modals

#### `RemoveProductModal`

**Props:**

- `isOpen`: Boolean
- `product`: Objeto producto o null
- `onClose`: `() => void`
- `onConfirm`: `(productId) => Promise<void>`

**Descripción:** Modal de confirmación para quitar un producto de la bodega. Muestra nombre, SKU y cantidad del producto.

---

#### `AttachProductModal`

**Props:**

- `isOpen`: Boolean
- `product`: Objeto producto o null
- `onClose`: `() => void`
- `onConfirm`: `(productId, sync, quantity) => Promise<void>`
- `isLoading`: Boolean (opcional)

**Descripción:** Modal para asociar un producto a la bodega. Permite elegir entre:

- **Sincronizar**: Stock automático (quantity = null)
- **Manual**: Ingresar cantidad específica

**Estado interno:**

- `sync`: Boolean (sincronizar o manual)
- `quantity`: Number (cantidad manual)

**Comportamiento:**

- Al abrir: resetea `sync=true`, `quantity=1`
- Si `sync=false`: muestra input de cantidad
- Si `sync=true`: oculta input de cantidad

---

#### `ManualQuantityModal`

**Props:**

- `isOpen`: Boolean
- `productId`: Number o null
- `initialQuantity`: Number
- `onClose`: `() => void`
- `onConfirm`: `(productId, quantity) => Promise<void>`

**Descripción:** Modal para ingresar cantidad manual cuando se desactiva la sincronización en un producto asociado.

**Validación:**

- Cantidad debe ser > 0
- Muestra toast error si inválida

---

### Hooks

#### `useWarehouseDetail`

**Parámetros:**

- `branchId`: ID de la sucursal

**Retorna:**

```typescript
{
  // State
  warehouse: IWarehouse | null,
  loading: boolean,
  error: string | null,
  attachingProducts: boolean,
  detachingProduct: boolean,

  // Actions
  loadWarehouseDetail: (warehouseId: number) => Promise<void>,
  handleAttachProducts: (warehouseId: number, data: IAttachProductRequest) => Promise<boolean>,
  handleDetachProduct: (warehouseId: number, data: IDetachProductRequest) => Promise<boolean>,
  handleClearDetail: () => void,
  refreshDetail: (warehouseId: number) => Promise<void>,
}
```

**Descripción:** Hook especializado para operaciones de detalle de bodega. Maneja:

- Carga de detalle
- Asociación de productos con validaciones específicas
- Eliminación de productos con mensajes de error personalizados
- Limpieza del store

**Validaciones de `handleAttachProducts`:**

- ⚠️ "ya está asociado" → Warning (producto duplicado)
- ❌ "sucursal" → Error (producto de otra sucursal)
- ❌ "capacidad" → Error (sin capacidad en bodega)
- ❌ "stock disponible" → Error (sin stock para sync)

**Validaciones de `handleDetachProduct`:**

- ❌ "no está asociado" → Error (producto no existe en bodega)

---

#### `useWarehouseDetailModals`

**Parámetros:** Ninguno

**Retorna:**

```typescript
{
  // Estado
  productToRemove: Product | null,
  attachProduct: Product | null,
  attaching: boolean,
  qtyModal: { open: boolean, productId: number | null, initialQty: number },
  isEditable: boolean,
  updatingSyncIds: number[],

  // Modal de eliminación
  openRemoveModal: (product: Product) => void,
  closeRemoveModal: () => void,

  // Modal de asociación
  openAttachModal: (product: Product) => void,
  closeAttachModal: () => void,
  startAttaching: () => void,
  finishAttaching: () => void,

  // Modal de cantidad
  openQtyModal: (productId: number, initialQty: number) => void,
  closeQtyModal: () => void,

  // UI
  toggleEditable: () => void,
  addUpdatingId: (id: number) => void,
  removeUpdatingId: (id: number) => void,
}
```

**Descripción:** Hook para gestionar el estado de la UI y los modales. Centraliza:

- Estado de apertura/cierre de modales
- Producto seleccionado para cada modal
- Estado de carga de operaciones
- Modo de edición
- Lista de productos en proceso de actualización

**Uso típico:**

```tsx
const modals = useWarehouseDetailModals();

// Abrir modal de eliminación
<Button onClick={() => modals.openRemoveModal(product)}>Quitar</Button>

// Abrir modal de asociación
<Button onClick={() => modals.openAttachModal(product)}>Asociar</Button>

// Toggle edición
<Button onClick={modals.toggleEditable}>
  {modals.isEditable ? 'Bloquear' : 'Editar'}
</Button>
```

---

## 🔄 Flujo de Datos

### Asociar Producto (Attach)

```
WarehouseDetailPage
    ↓ handleAttachProduct(product)
AttachProductModal
    ↓ onConfirm(productId, sync, quantity)
WarehouseDetailPage.confirmAttach()
    ↓ handleAttachProducts (hook)
    ↓ loadWarehouseDetail (refresca)
```

### Toggle Sync/Manual

```
AssociatedProductsTable
    ↓ onSyncToggle(productId, turningOn, currentQty)
WarehouseDetailPage.handleSyncToggle()
    ├─ turningOn = false → Abre ManualQuantityModal
    │       ↓ onConfirm(productId, quantity)
    │       ↓ confirmManualQuantity()
    │       ↓ handleAttachProducts (sync_stock=false, quantity=X)
    │
    └─ turningOn = true → Directamente
            ↓ handleAttachProducts (sync_stock=true, quantity=null)
```

### Quitar Producto (Remove)

```
AssociatedProductsTable
    ↓ onRemoveProduct(product)
RemoveProductModal
    ↓ onConfirm(productId)
WarehouseDetailPage.confirmRemoveProduct()
    ↓ handleDetachProduct (hook)
```

---

## 🎨 Convenciones

### Naming

- **Cards**: `*Card.tsx` - Wrappers con Card/CardHeader/CardBody
- **Tables**: `*Table.tsx` - Solo la tabla con thead/tbody
- **Modals**: `*Modal.tsx` - Modal completo con Header/Body/Footer

### Props

- Callbacks: `onAction` (ej: `onConfirm`, `onClose`, `onSyncToggle`)
- Estados: `is*` (ej: `isOpen`, `isLoading`)
- Datos: Nombres descriptivos (ej: `product`, `warehouse`, `products`)

### Tipos

- Interfaces exportadas cuando son complejas
- Tipos inline para props simples
- `any` solo cuando viene de Redux sin tipado

---

## 🚀 Uso

### Ejemplo Completo con Hooks

```tsx
import { useWarehouseDetail } from './detallesComponents/hooks/useWarehouseDetail';
import { useWarehouseDetailModals } from './detallesComponents/hooks/useWarehouseDetailModals';
import WarehouseInfoCard from './detallesComponents/cards/WarehouseInfoCard';
import AssociatedProductsCard from './detallesComponents/cards/AssociatedProductsCard';
import RemoveProductModal from './detallesComponents/modals/RemoveProductModal';

const WarehouseDetailPage = () => {
	const { id } = useParams();
	const branchId = useBranchId();

	// Hook de lógica de negocio
	const api = useWarehouseDetail(branchId);

	// Hook de estado de UI
	const ui = useWarehouseDetailModals();

	useEffect(() => {
		if (id) api.loadWarehouseDetail(Number(id));
	}, [id]);

	const handleAttach = async (productId, sync, qty) => {
		ui.startAttaching();
		const success = await api.handleAttachProducts(api.warehouse.id, {
			product_id: productId,
			quantity: sync ? null : qty,
			sync_stock: sync,
		});
		if (success) {
			await api.refreshDetail(api.warehouse.id);
			ui.closeAttachModal();
		}
		ui.finishAttaching();
	};

	return (
		<PageWrapper>
			<WarehouseInfoCard warehouse={api.warehouse} />

			<AssociatedProductsCard
				products={api.warehouse.products}
				allProducts={allProducts}
				updatingSyncIds={ui.updatingSyncIds}
				onSyncToggle={handleSyncToggle}
				onRemoveProduct={ui.openRemoveModal}
			/>

			<RemoveProductModal
				isOpen={!!ui.productToRemove}
				product={ui.productToRemove}
				onClose={ui.closeRemoveModal}
				onConfirm={handleRemoveProduct}
			/>
		</PageWrapper>
	);
};
```

### Ejemplo Básico sin Hooks (No recomendado)

```tsx
import WarehouseInfoCard from './detallesComponents/cards/WarehouseInfoCard';
import AssociatedProductsCard from './detallesComponents/cards/AssociatedProductsCard';
import RemoveProductModal from './detallesComponents/modals/RemoveProductModal';

// En el componente
<WarehouseInfoCard warehouse={warehouse} />

<AssociatedProductsCard
    products={warehouse.products}
    allProducts={allProducts}
    updatingSyncIds={updatingSyncIds}
    onSyncToggle={handleSyncToggle}
    onRemoveProduct={setProductToRemove}
/>

<RemoveProductModal
    isOpen={!!productToRemove}
    product={productToRemove}
    onClose={() => setProductToRemove(null)}
    onConfirm={confirmRemoveProduct}
/>
```

---

## ✅ Ventajas de esta estructura

1. **Separación de responsabilidades**: Cada componente tiene una única función
2. **Reusabilidad**: Los componentes pueden usarse en otras páginas
3. **Testeo**: Más fácil escribir tests unitarios
4. **Mantenibilidad**: Cambios localizados, fácil ubicar bugs
5. **Legibilidad**: WarehouseDetailPage ahora es mucho más pequeño y legible
6. **Escalabilidad**: Fácil agregar nuevas funcionalidades

---

## 📝 Próximas mejoras

- [ ] Agregar interfaces TypeScript completas para todos los productos
- [ ] Extraer lógica de negocio a custom hooks
- [ ] Agregar tests unitarios con Jest/React Testing Library
- [ ] Implementar skeleton loaders en tablas
- [ ] Agregar filtros/búsqueda en tablas
- [ ] Implementar paginación en tabla de productos disponibles
