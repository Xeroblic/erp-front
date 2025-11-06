# ⚠️ PENDIENTE: Barra de Capacidad

## Problema Actual

La barra de capacidad en el listado de bodegas **NO se está mostrando** porque el backend no está retornando el campo `current_capacity`.

## Datos Actuales del Backend

```json
{
	"id": 7,
	"maximum_capacity": 50,
	"current_capacity": undefined // ❌ FALTA ESTE CAMPO
}
```

## Solución Requerida en Backend

El endpoint `GET /api/branches/{branchId}/warehouses` debe retornar `current_capacity` calculado como:

```php
// En el modelo Warehouse o en el controller
$warehouse->current_capacity = $warehouse->products()
    ->sum('warehouse_product.quantity');
```

### Ejemplo de respuesta esperada:

```json
{
	"id": 7,
	"name": "bodega central ecopc",
	"code": "PRUEBA",
	"maximum_capacity": 50,
	"current_capacity": 23, // ✅ Suma de cantidades de productos
	"available_capacity": 27 // Opcional: maximum_capacity - current_capacity
}
```

## Cómo Funciona la Barra

El componente `WarehouseCapacityBar` espera:

```tsx
<WarehouseCapacityBar
	current={warehouse.current_capacity || 0} // Capacidad usada
	maximum={warehouse.maximum_capacity} // Capacidad máxima
	size='sm'
/>
```

## Ubicación del Código

- **Componente**: `src/pages/catalogos/bodegas/components/WarehouseCapacityBar.tsx`
- **Uso**: `src/pages/catalogos/bodegas/tables/WarehousesTable.tsx` (línea 68)

## Qué Muestra la Barra

- **Barra de progreso** con color dinámico:
    - 🟢 Verde: < 70% ocupado
    - 🟡 Ámbar: 70-90% ocupado
    - 🔴 Rojo: > 90% ocupado
- **Labels**: "23 / 50 unidades" y "27 disponibles"
- **Porcentaje**: "46.0% ocupado"

## Próximos Pasos

1. ✅ **Backend**: Agregar `current_capacity` al endpoint de listado
2. ✅ **Frontend**: El código ya está listo, solo necesita los datos
3. ⚠️ **Opcional**: Agregar `available_capacity` para evitar calcularlo en frontend

---

**Estado**: ⏳ Pendiente de backend  
**Prioridad**: Media  
**Bloqueador**: No, el resto funciona correctamente
