# Auditoría de Módulos: Transferencias e Inventario

**Fecha:** 10 de septiembre de 2025  
**Alcance:** CU014, CU024, CU029-CU030, CU040 - Transferencias, Inventario, WooCommerce Sync, Estado Técnico  
**Estado:** Auditoría completa del sistema actual

## 1. Resumen Ejecutivo

El sistema ERP presenta una implementación **PARCIAL** de los módulos de inventario y transferencias. Se encontraron dos implementaciones paralelas de transferencias (comercial e inventario) con funcionalidades completas de CRUD, una página principal de inventario con gestión de movimientos, pero **ausencia completa** de los módulos de historial específico, sincronización WooCommerce e inventario por estado técnico. La conexión entre transferencias y movimientos de inventario está **IMPLEMENTADA** a nivel de código, pero requiere validación de integración backend.

## 2. Mapa de Módulos Encontrados

### 2.1 Transferencias - EXISTE ✅

**Estado:** COMPLETO (doble implementación)

**Rutas principales:**

-   `src/pages/comercial/transferencias/` - Implementación comercial completa
-   `src/pages/inventory/transferencias/` - Implementación de inventario (duplicada)

**Componentes encontrados:**

-   `TransferenciasAdmin.tsx` - Vista administrativa principal con CRUD completo
-   `Transferencias.tsx` (comercial) - Vista completa con filtros y paginación
-   `Transferencias.tsx` (inventory) - Vista duplicada con funcionalidad similar
-   `useTransfersManager.ts` - Hook personalizado con gestión completa de estado
-   `TransfersTable.tsx` - Tabla con funcionalidades avanzadas
-   **Modales:** CreateEdit, Detail, Receive, Cancel - CRUD completo implementado

**Store y tipos:**

-   `transfersSlice.ts` - Redux slice completo con thunks async
-   `transfers.types.ts` - Tipos específicos bien definidos
-   `transfers.interface.ts` - Interfaces del dominio

**Permisos detectados:** `transfers.view`, `transfers.create`, `transfers.update`, `transfers.delete`, `transfers.ship`, `transfers.receive`, `transfers.approve`, `transfers.cancel`

**Observaciones:**

-   ⚠️ **Duplicación**: Existe en `/comercial/` y `/inventory/` con funcionalidad casi idéntica
-   ✅ Estados de transferencia: PENDING, APPROVED, SHIPPED, PARTIALLY_RECEIVED, COMPLETED, CANCELLED
-   ✅ Campos `ref_type` y `ref_id` implementados en interfaces para trazabilidad

### 2.2 Movimientos de Inventario (CU014) - EXISTE ✅

**Estado:** IMPLEMENTADO CON STUBS

**Rutas principales:**

-   `src/pages/inventario/Inventario.tsx` - Vista principal con tabs (movimientos/items)
-   `src/store/slices/inventory/inventorySlice.ts` - Gestión completa de estado

**Funcionalidades implementadas:**

-   ✅ Listado de movimientos con filtros (tipo, producto, bodega, fechas)
-   ✅ Tipos de movimiento: `IN`, `OUT`, `ADJUSTMENT`, `TRANSFER`, `PRODUCTION`, `RETURN`
-   ✅ Campos `reference_type` y `reference_id` para conexión con transferencias
-   ✅ Formularios de ajuste y transferencia de inventario
-   ✅ Paginación y estadísticas básicas

**Endpoints (stubs):** `/inventory/movements`, `/inventory/transfer`

**Permisos:** `inventory.view`, `inventory.adjust`, `inventory.transfer`, `inventory.view_movements`

**Observaciones:**

-   ⚠️ Endpoints no disponibles (fallback a datos mock)
-   ✅ `transferInventory` thunk crea movimientos IN/OUT automáticamente
-   ✅ Interfaz `IInventoryMovement` incluye campos necesarios para trazabilidad

### 2.3 Historial de Movimientos (CU024) - INCOMPLETO ⚠️

**Estado:** PARCIAL (integrado en módulo principal)

**Implementación actual:**

-   El historial está integrado en la vista principal de inventario como tab "Movimientos"
-   ✅ Filtros por `reference_type/reference_id` implementados
-   ✅ Modal de información por movimiento (detectado en código)
-   ❌ NO existe página dedicada de historial como se esperaba

**Paths esperados pero NO encontrados:**

-   `src/pages/inventario/historial/` - NO EXISTE
-   `src/pages/stock/historial/` - NO EXISTE

**Observaciones:**

-   La funcionalidad existe pero está fusionada con el módulo principal de inventario
-   Filtrado por referencia implementado correctamente

### 2.4 WooCommerce / Stock Sync (CU029-CU030) - NO_EXISTE ❌

**Estado:** NO IMPLEMENTADO

**Búsqueda realizada:**

-   `src/pages/integraciones/woocommerce/` - NO EXISTE
-   `src/pages/inventario/woocommerce/` - NO EXISTE
-   Referencias encontradas solo en configuración de sistema (`integration.woocommerce_enabled`)

**Evidencia encontrada:**

-   `src/pages/admin/systemParameters/mocks/systemParameters.mock.ts` línea 96: parámetro de configuración para habilitar WooCommerce
-   Categoría `integration` definida en interfaces de sistema

**Gap:** Módulo completo ausente, solo existe configuración base.

### 2.5 Inventario por Estado Técnico (CU040) - NO_EXISTE ❌

**Estado:** NO IMPLEMENTADO

**Búsqueda realizada:**

-   `src/pages/inventario/estado-tecnico/` - NO EXISTE
-   `src/pages/inventario/inventario-por-estado/` - NO EXISTE
-   Términos: `estado-tecnico`, `tech_state`, `technical_state` - NO ENCONTRADOS

**Observaciones:**

-   Las interfaces de inventario no incluyen campos de estado técnico
-   No se encontró referencia alguna a matriz Bodega × Estado Técnico

## 3. Conexiones Entre Módulos

### T1. Transferencia → Movimientos (CU014) ✅ IMPLEMENTADO

**Evidencia en código:**

-   `transferInventory` en `inventorySlice.ts` líneas 277-296
-   Campos `reference_type` y `reference_id` en `IInventoryMovement` (líneas 16-17)
-   Al confirmar transferencia, se crean movimientos OUT (origen) e IN (destino)
-   `performed_by` y timestamps registrados automáticamente

**Resultado:** ✅ OK - Conexión implementada correctamente

### T2. Movimientos → Historial (CU024) ⚠️ PARCIAL

**Evidencia:**

-   Historial integrado en vista principal, no página separada
-   Filtros por `reference_type/reference_id` implementados en `inventorySlice.ts` líneas 56-57
-   Modal de información detectado (referencia en `Inventario.tsx` líneas 583-587)

**Resultado:** ⚠️ Parcial - Funcionalidad existe pero no en formato esperado

### T3. Woo Sync (CU029-CU030) ↔ Stock ❌ NO IMPLEMENTADO

**Evidencia:** Solo configuración base en system parameters

**Resultado:** ❌ No implementado - Gap crítico

### T4. Estado Técnico (CU040) ↔ Stock ❌ NO IMPLEMENTADO

**Evidencia:** Módulo completamente ausente

**Resultado:** ❌ No implementado - Gap crítico

## 4. Diagrama Textual del Flujo Actual

```
[Nueva Transferencia - Comercial/Inventario]
    └─(Confirmar)→ [transferInventory thunk]
                      └─→ [Movimiento OUT: origen] + [Movimiento IN: destino]
                            └─(ref_type='transfer', ref_id=<id>)→ [Historial integrado en Inventario]

[Ajuste Inventario] → [adjustInventory thunk] → [Movimiento ADJUSTMENT] → [Historial]

[WooCommerce Pull/Push] → ❌ NO IMPLEMENTADO

[Estado Técnico Matrix] → ❌ NO IMPLEMENTADO
```

## 5. Gaps & Recomendaciones

**Críticos (Prioridad 1):**

1. **Duplicación de Transferencias**: Consolidar `/comercial/transferencias/` y `/inventory/transferencias/` en una sola implementación
2. **WooCommerce Sync**: Implementar módulos CU029-CU030 completos con UI para Pull/Push y logs
3. **Estado Técnico**: Implementar CU040 con matriz Bodega × Estado Técnico

**Importantes (Prioridad 2):** 4. **Historial dedicado**: Crear página específica `/inventario/historial/` como se especifica en CU024 5. **Validación Backend**: Verificar endpoints de inventario (actualmente stubs)

**Menores (Prioridad 3):** 6. **Normalización de rutas**: Decisión sobre `/inventario/` vs `/inventory/` (existe duplicación)

## 6. Apéndice A — Contratos Mínimos Detectados

```typescript
// Movimientos - IMPLEMENTADO
interface IInventoryMovement {
	id: number;
	movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'PRODUCTION' | 'RETURN';
	product_id?: number;
	warehouse_id?: number;
	quantity?: number;
	reference_type?: string; // 'transfer'|'sale'|'purchase'|'adjustment'
	reference_id?: number;
	performed_by?: number;
	performed_at: string;
}

// Transferencias - IMPLEMENTADO
interface ITransfer {
	id: number;
	from_warehouse_id: number;
	to_warehouse_id: number;
	status: TransferStatus;
	items: ITransferItem[];
	// Estados: PENDING|APPROVED|SHIPPED|PARTIALLY_RECEIVED|COMPLETED|CANCELLED
}

// WooCommerce - NO IMPLEMENTADO
interface IWooSyncJob {
	id: number;
	type: 'pull' | 'push';
	status: 'pending' | 'running' | 'completed' | 'failed';
	// A implementar
}

// Estado Técnico - NO IMPLEMENTADO
interface ITechnicalState {
	product_id: number;
	warehouse_id: number;
	technical_state: string; // 'NEW'|'USED'|'REFURBISHED'|'DAMAGED'
	quantity: number;
	// A implementar
}
```

## 7. Apéndice B — Normalización de Nombres

**Estructura actual correcta:**

-   ✅ `src/pages/inventario/` - Nomenclatura consistente en español
-   ✅ `src/store/slices/inventory/` - Nomenclatura en inglés (standard técnico)

**Duplicaciones detectadas:**

-   ⚠️ `src/pages/inventory/transferencias/` vs `src/pages/comercial/transferencias/`
-   ⚠️ Rutas configuradas: `/inventario/transferencias` e `/comercial/transferencias`

**Recomendación:** Mantener `/inventario/` como estructura principal y consolidar transferencias en una sola implementación.

---

**Criterio de éxito alcanzado:** ✅ Documentación completa del estado actual, gaps identificados, y roadmap claro para completar la cadena Transferencias→Movimientos→Historial.
