# Módulo de Transferencias (CU014) - Versión Consolidada

## Descripción

Formulario simplificado para crear nuevas transferencias de productos entre bodegas. Al confirmar, crea movimientos de inventario IN/OUT automáticamente con trazabilidad mediante `reference_type='transfer'` y `reference_id`.

## Casos de Uso

- **CU014**: Transferencias de inventario entre bodegas

## Ubicación

- **Ruta**: `/inventario/transferencias`
- **Componente**: `src/pages/inventario/transferencias/Transferencias.tsx`

## Funcionalidades

### Formulario Nueva Transferencia

- **Bodega Origen**: Selección de bodega de origen (obligatorio)
- **Bodega Destino**: Selección de bodega destino (obligatorio, diferente al origen)
- **Responsable**: Usuario responsable de la transferencia (obligatorio)
- **Notas**: Información adicional (opcional)

### Gestión de Productos

- **Agregar productos**: Seleccionar producto y cantidad
- **Validación de stock**: Verificar disponibilidad antes de agregar
- **Lista de productos**: Visualizar productos a transferir
- **Remover productos**: Eliminar productos de la lista

### Confirmación y Procesamiento

- **Validaciones**: Verificar datos obligatorios y consistencia
- **Procesamiento**: Crear movimientos IN/OUT por cada producto
- **Trazabilidad**: Campos `reference_type='transfer'` y `reference_id`
- **Redirección**: Navegar al historial filtrado por transferencias

## Permisos Requeridos

- `inventory.transfer` - Para confirmar transferencias

## Validaciones

### Formulario Principal

1. **Bodega origen** - Obligatorio
2. **Bodega destino** - Obligatorio, diferente al origen
3. **Responsable** - Obligatorio
4. **Al menos un producto** - Lista no vacía

### Productos

1. **Selección válida** - Producto debe existir
2. **Cantidad positiva** - Mayor a 0
3. **Stock suficiente** - No exceder disponibilidad
4. **Sin duplicados** - Acumular cantidades si se agrega el mismo producto

## Flujo de Procesamiento

1. **Validación inicial** - Verificar campos obligatorios
2. **Procesamiento por producto**:
    - Crear movimiento OUT en bodega origen
    - Crear movimiento IN en bodega destino
    - Asignar `reference_type='transfer'` y `reference_id` único
    - Incluir datos del responsable en notas
3. **Confirmación** - Toast de éxito
4. **Limpieza** - Resetear formulario
5. **Redirección** - Historial con filtro de transferencias

## Integración con Backend

### Endpoint Utilizado

- `POST /inventory/transfer` - Transferir inventario (implementado en `inventorySlice`)

### Estructura de Request

```typescript
{
  product_id: number;
  from_warehouse_id: number;
  to_warehouse_id: number;
  quantity: number;
  notes?: string;
}
```

## Navegación Post-Transferencia

Al confirmar exitosamente, redirecciona a:

- **URL**: `/inventario/historial?tipo=TRANSFER`
- **Propósito**: Mostrar historial filtrado por transferencias realizadas

## Diseño y UX

- **Layout responsive**: Grid adaptable desktop/mobile
- **Validación en tiempo real**: Feedback inmediato de errores
- **Estados de loading**: Indicador durante procesamiento
- **Tokens de diseño**: Sin colores hardcoded, uso de tokens globales
- **Accesibilidad**: Labels descriptivos y navegación por teclado
