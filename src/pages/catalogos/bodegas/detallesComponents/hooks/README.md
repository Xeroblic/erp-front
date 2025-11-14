# Hooks de Detalle de Bodega

Hooks especializados para la página de detalle de bodega.

## 📁 Archivos

```
hooks/
├── useWarehouseDetail.ts          # Lógica de negocio (API calls)
├── useWarehouseDetailModals.ts    # Estado de UI (modales)
└── HOOKS_COMPARISON.md            # Comparación con useWarehouseManagement
```

---

## 🎯 useWarehouseDetail

Hook especializado para operaciones de detalle de bodega.

### Importación

```typescript
import { useWarehouseDetail } from './detallesComponents/hooks/useWarehouseDetail';
```

### Uso

```typescript
const {
	warehouse,
	loading,
	error,
	attachingProducts,
	detachingProduct,
	loadWarehouseDetail,
	handleAttachProducts,
	handleDetachProduct,
	handleClearDetail,
	refreshDetail,
} = useWarehouseDetail(branchId);
```

### API

#### State

- `warehouse`: `IWarehouse | null` - Detalle de la bodega
- `loading`: `boolean` - Cargando detalle
- `error`: `string | null` - Error al cargar
- `attachingProducts`: `boolean` - Asociando producto
- `detachingProduct`: `boolean` - Quitando producto

#### Métodos

**`loadWarehouseDetail(warehouseId: number): Promise<void>`**

- Carga el detalle de una bodega
- Muestra toast de error si falla

**`handleAttachProducts(warehouseId: number, data: IAttachProductRequest): Promise<boolean>`**

- Asocia un producto a la bodega
- Retorna `true` si tuvo éxito
- Validaciones automáticas:
    - Producto duplicado → Warning
    - Producto de otra sucursal → Error
    - Sin capacidad → Error
    - Sin stock para sync → Error

**`handleDetachProduct(warehouseId: number, data: IDetachProductRequest): Promise<boolean>`**

- Quita un producto de la bodega
- Retorna `true` si tuvo éxito
- Validaciones automáticas:
    - Producto no existe → Error

**`handleClearDetail(): void`**

- Limpia el detalle del store

**`refreshDetail(warehouseId: number): Promise<void>`**

- Recarga el detalle (útil después de operaciones)

### Ejemplo Completo

```typescript
const WarehouseDetailPage = () => {
  const { id } = useParams();
  const branchId = useBranchId();

  const {
    warehouse,
    loading,
    attachingProducts,
    loadWarehouseDetail,
    handleAttachProducts,
    refreshDetail,
  } = useWarehouseDetail(branchId);

  useEffect(() => {
    if (id) loadWarehouseDetail(Number(id));
  }, [id]);

  const handleAttach = async (productId: number) => {
    const success = await handleAttachProducts(warehouse.id, {
      product_id: productId,
      quantity: null,
      sync_stock: true,
    });

    if (success) {
      await refreshDetail(warehouse.id);
    }
  };

  return <div>...</div>;
};
```

---

## 🎨 useWarehouseDetailModals

Hook para gestionar el estado de modales y UI.

### Importación

```typescript
import { useWarehouseDetailModals } from './detallesComponents/hooks/useWarehouseDetailModals';
```

### Uso

```typescript
const {
	productToRemove,
	attachProduct,
	attaching,
	qtyModal,
	isEditable,
	updatingSyncIds,
	openRemoveModal,
	closeRemoveModal,
	openAttachModal,
	closeAttachModal,
	startAttaching,
	finishAttaching,
	openQtyModal,
	closeQtyModal,
	toggleEditable,
	addUpdatingId,
	removeUpdatingId,
} = useWarehouseDetailModals();
```

### API

#### State

- `productToRemove`: `Product | null` - Producto a eliminar
- `attachProduct`: `Product | null` - Producto a asociar
- `attaching`: `boolean` - Proceso de asociación activo
- `qtyModal`: `{ open, productId, initialQty }` - Estado del modal de cantidad
- `isEditable`: `boolean` - Modo edición activo
- `updatingSyncIds`: `number[]` - IDs en proceso de actualización

#### Métodos

**Modal de Eliminación**

- `openRemoveModal(product)` - Abrir modal
- `closeRemoveModal()` - Cerrar modal

**Modal de Asociación**

- `openAttachModal(product)` - Abrir modal
- `closeAttachModal()` - Cerrar modal
- `startAttaching()` - Iniciar proceso
- `finishAttaching()` - Finalizar proceso

**Modal de Cantidad**

- `openQtyModal(productId, initialQty)` - Abrir modal
- `closeQtyModal()` - Cerrar modal

**UI General**

- `toggleEditable()` - Toggle modo edición
- `addUpdatingId(id)` - Marcar como actualizando
- `removeUpdatingId(id)` - Quitar marca de actualización

### Ejemplo Completo

```typescript
const WarehouseDetailPage = () => {
  const modals = useWarehouseDetailModals();
  const api = useWarehouseDetail(branchId);

  const handleRemove = (product) => {
    modals.openRemoveModal(product);
  };

  const confirmRemove = async () => {
    const success = await api.handleDetachProduct(
      warehouse.id,
      { product_id: modals.productToRemove.id }
    );

    if (success) {
      modals.closeRemoveModal();
    }
  };

  return (
    <>
      <Button onClick={modals.toggleEditable}>
        {modals.isEditable ? 'Bloquear' : 'Editar'}
      </Button>

      <ProductTable onRemove={handleRemove} />

      <RemoveProductModal
        isOpen={!!modals.productToRemove}
        product={modals.productToRemove}
        onClose={modals.closeRemoveModal}
        onConfirm={confirmRemove}
      />
    </>
  );
};
```

---

## 🔄 Patrón de Uso Combinado

La forma recomendada es usar ambos hooks juntos:

```typescript
const WarehouseDetailPage = () => {
  const { id } = useParams();
  const branchId = useBranchId();

  // Hook de lógica de negocio (API)
  const api = useWarehouseDetail(branchId);

  // Hook de estado de UI
  const ui = useWarehouseDetailModals();

  // Cargar datos iniciales
  useEffect(() => {
    if (id) api.loadWarehouseDetail(Number(id));
  }, [id]);

  // Handler completo: UI + API
  const handleAttach = async (productId: number, sync: boolean, qty: number) => {
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

  const handleSyncToggle = async (id: number, on: boolean, qty: number) => {
    if (!on) {
      ui.openQtyModal(id, qty);
      return;
    }

    ui.addUpdatingId(id);
    const success = await api.handleAttachProducts(api.warehouse.id, {
      product_id: id,
      quantity: null,
      sync_stock: true,
    });
    if (success) await api.refreshDetail(api.warehouse.id);
    ui.removeUpdatingId(id);
  };

  return (
    <PageWrapper>
      <Button onClick={ui.toggleEditable}>
        {ui.isEditable ? 'Bloquear' : 'Editar'}
      </Button>

      <WarehouseInfoCard warehouse={api.warehouse} />

      <ProductsTable
        products={api.warehouse.products}
        updatingSyncIds={ui.updatingSyncIds}
        onSyncToggle={handleSyncToggle}
        onRemove={ui.openRemoveModal}
      />

      <RemoveProductModal
        isOpen={!!ui.productToRemove}
        product={ui.productToRemove}
        onClose={ui.closeRemoveModal}
        onConfirm={async (id) => {
          const success = await api.handleDetachProduct(api.warehouse.id, { product_id: id });
          if (success) {
            await api.refreshDetail(api.warehouse.id);
            ui.closeRemoveModal();
          }
        }}
      />

      <AttachProductModal
        isOpen={!!ui.attachProduct}
        product={ui.attachProduct}
        onClose={ui.closeAttachModal}
        onConfirm={handleAttach}
        isLoading={ui.attaching}
      />

      <ManualQuantityModal
        isOpen={ui.qtyModal.open}
        productId={ui.qtyModal.productId}
        initialQuantity={ui.qtyModal.initialQty}
        onClose={ui.closeQtyModal}
        onConfirm={async (id, qty) => {
          ui.addUpdatingId(id);
          const success = await api.handleAttachProducts(api.warehouse.id, {
            product_id: id,
            quantity: qty,
            sync_stock: false,
          });
          if (success) await api.refreshDetail(api.warehouse.id);
          ui.removeUpdatingId(id);
          ui.closeQtyModal();
        }}
      />
    </PageWrapper>
  );
};
```

---

## ✅ Ventajas

1. **Separación de responsabilidades**
    - `useWarehouseDetail`: Lógica de negocio
    - `useWarehouseDetailModals`: Lógica de UI

2. **Código más limpio**
    - Menos `useState`
    - Menos código repetitivo
    - Handlers más claros

3. **Mejor rendimiento**
    - Solo re-render cuando cambia lo necesario
    - Estado local separado del global

4. **Más testeable**
    - Hooks aislados
    - Fácil de mockear

5. **Mejor mantenibilidad**
    - Cambios localizados
    - Fácil de extender

---

## 📚 Ver También

- [HOOKS_COMPARISON.md](./HOOKS_COMPARISON.md) - Comparación con `useWarehouseManagement`
- [../README.md](../README.md) - Documentación de componentes
- [../../hooks/useWarehouseManagement.ts](../../hooks/useWarehouseManagement.ts) - Hook general
