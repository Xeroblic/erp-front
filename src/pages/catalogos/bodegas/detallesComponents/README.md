# Productos de una bodega

## Asociación manual (ZF-116)

1. «Asociar productos» muestra los productos disponibles de la sucursal.
2. Al elegir un producto, el modal solicita una cantidad entera mayor a cero.
3. La asociación envía `product_id` y `quantity`, omitiendo `sync_stock`. El backend
   interpreta su ausencia como `false`, sin copiar el stock global del producto.
4. Tras asociar, se recarga el detalle. Si el backend rechaza la solicitud, el modal
   conserva la cantidad para corregir o reintentar.

La tabla muestra cantidad en bodega y stock de sucursal, sin columna de modo ni
indicadores de sincronización. Los KPI de la ficha cuentan productos y unidades.
El campo heredado `sync_stock` de la respuesta no representa sincronización activa.

## Despliegue

Este cambio debe salir a producción junto con el PR 86 del backend
(`feat/procurement-inventory-engine`, commit `c6cd877`), que elimina el espejo de
stock global sobre `warehouse_products`.

La asociación manual todavía escribe fuera del libro de inventario. Su migración
al motor corresponde a la tarea 16 del backend y queda fuera de ZF-116.
La sincronización de los paneles de WooCommerce conserva su comportamiento.
