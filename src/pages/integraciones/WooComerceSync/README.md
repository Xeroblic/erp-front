# Módulo WooCommerce Stock Sync (CU029-CU030)

## Descripción

Interface completa para sincronización bidireccional de stock entre ERP y WooCommerce. Permite importar stock desde WooCommerce (Pull) y actualizar stock en WooCommerce (Push) con sistema de logs y historial de sincronizaciones.

## Casos de Uso

-   **CU029**: Importar stock desde WooCommerce (Pull)
-   **CU030**: Actualizar stock en WooCommerce (Push)

## Ubicación

-   **Ruta**: `/integraciones/woocommerce/stock`
-   **Componente**: `src/pages/integraciones/woocommerce/stock/WooStockSync.tsx`

## Funcionalidades

### Sistema de Tabs

-   **Importar Stock (Pull)**: Traer stock desde WooCommerce hacia ERP
-   **Actualizar Stock (Push)**: Enviar stock desde ERP hacia WooCommerce
-   **Historial**: Registro de todas las sincronizaciones ejecutadas

### Tab 1: Importar Stock (Pull)

-   **Descripción explicativa** del proceso de importación
-   **Botón de acción** para ejecutar importación inmediata
-   **Estado de conexión** con WooCommerce API
-   **Procesamiento con loading** y feedback visual

### Tab 2: Actualizar Stock (Push)

-   **Tabla de productos** con selección múltiple
-   **Comparación visual** entre stock local vs WooCommerce
-   **Estados de sincronización** con badges de colores
-   **Botones de selección** (todo/individual)
-   **Actualización de productos** seleccionados únicamente

### Tab 3: Historial

-   **Tabla de jobs ejecutados** con toda la información
-   **Estados de ejecución** (pending/running/completed/failed)
-   **Estadísticas** de productos procesados/actualizados/con errores
-   **Modal de logs** con información detallada

### Mock API Service

-   **Simulación real** de llamadas a WooCommerce API
-   **Delays realistas** para simular procesamiento
-   **Generación de logs** paso a paso
-   **Manejo de errores** y estados fallos

## Permisos Requeridos

-   `inventory.update` - Para ejecutar sincronizaciones de stock

## Estados de Conexión

```typescript
type ConnectionStatus = 'connected' | 'disconnected' | 'error';
```

-   **🟢 Conectado**: API funcional y configurada
-   **⚫ Desconectado**: Sin configuración o deshabilitada
-   **🔴 Error**: Error de conexión o credenciales inválidas

## Estados de Sincronización de Productos

```typescript
type SyncStatus = 'synced' | 'out_of_sync' | 'error';
```

-   **✅ Sincronizado**: Stock local y WooCommerce coinciden
-   **⚠️ Desincronizado**: Diferencias entre stock local y WooCommerce
-   **❌ Error**: Error en el último intento de sincronización

## Datos Mock

### Productos con Stock (6+ registros)

```typescript
const MOCK_PRODUCT_STOCKS: ProductStock[] = [
	{
		id: 1,
		sku: 'LAP-DELL-15',
		name: 'Laptop Dell Inspiron 15',
		local_stock: 25,
		woo_stock: 23,
		sync_status: 'out_of_sync',
		last_sync: '2025-09-09T14:30:00Z',
		woo_product_id: 101,
	},
	// ... más registros
];
```

### Historial de Sincronizaciones (3+ registros)

```typescript
const MOCK_SYNC_HISTORY: WooSyncJob[] = [
	{
		id: 1001,
		type: 'pull',
		status: 'completed',
		started_at: '2025-09-10T08:00:00Z',
		completed_at: '2025-09-10T08:05:00Z',
		products_processed: 15,
		products_updated: 15,
		products_failed: 0,
		log: ['Importación exitosa', 'Todos los productos actualizados'],
	},
	// ... más registros
];
```

### Configuración WooCommerce

```typescript
const wooConfig = {
	site_url: 'https://mitienda.com',
	consumer_key: 'ck_*********************',
	consumer_secret: 'cs_*********************',
	status: 'connected',
};
```

## Interfaces Principales

### WooSyncJob

```typescript
interface WooSyncJob {
	id: number;
	type: 'pull' | 'push';
	status: 'pending' | 'running' | 'completed' | 'failed';
	started_at: string;
	completed_at?: string;
	products_processed?: number;
	products_updated?: number;
	products_failed?: number;
	errors?: string[];
	log?: string[];
}
```

### ProductStock

```typescript
interface ProductStock {
	id: number;
	sku: string;
	name: string;
	local_stock: number;
	woo_stock: number;
	sync_status: 'synced' | 'out_of_sync' | 'error';
	last_sync: string;
	woo_product_id?: number;
}
```

## Proceso de Importación (Pull)

### Pasos del Mock API

1. **Conexión** a WooCommerce API (delay 2s)
2. **Obtención** de lista de productos
3. **Procesamiento** de productos individuales
4. **Actualización** de stock local
5. **Generación** de reporte con éxitos/errores
6. **Log completo** del proceso paso a paso

### Resultado esperado

-   Actualización del stock local con valores de WooCommerce
-   Cambio de estado de productos a 'synced'
-   Generación de job en historial
-   Toast de confirmación con estadísticas

## Proceso de Actualización (Push)

### Pasos del Mock API

1. **Validación** de productos seleccionados
2. **Conexión** a WooCommerce API (delay 3s)
3. **Actualización** individual de cada producto
4. **Manejo de errores** por producto
5. **Reporte final** con estadísticas
6. **Log detallado** del proceso

### Resultado esperado

-   Sincronización de productos seleccionados hacia WooCommerce
-   Cambio de estado a 'synced' para productos exitosos
-   Limpieza de selección de productos
-   Toast con estadísticas de actualización

## Modal de Logs

### Información mostrada

-   **Header**: ID del job y tipo de operación
-   **Información básica**: Tipo, estado, fechas de inicio/fin
-   **Estadísticas visuales**: Cards con procesados/actualizados/errores
-   **Lista de errores**: Si existen, con detalles específicos
-   **Log detallado**: Consola paso a paso del proceso

### Diseño del modal

-   **Size**: 3xl para mostrar toda la información
-   **Scroll**: Área de log con scroll interno
-   **Colores**: Verde para éxitos, rojo para errores, azul para info

## Integración con Sistema

### Mock Endpoints

```typescript
mockWooSyncApi = {
	pullStock(): Promise<WooSyncJob>    // Importar desde WooCommerce
	pushStock(productIds[]): Promise<WooSyncJob>  // Actualizar en WooCommerce
}
```

### Estados de la aplicación

-   **Loading states**: Durante ejecución de jobs
-   **Product selection**: Manejo de selección múltiple
-   **History management**: Actualización de historial
-   **Error handling**: Toast notifications y logs

## Diseño Visual

### Colores de Estado

-   **Verde**: Sincronizado, completado, conexión OK
-   **Amarillo/Amber**: Desincronizado, advertencias
-   **Rojo**: Errores, fallos, sin conexión
-   **Azul**: Importaciones, información
-   **Gris**: Pendiente, desconectado

### Iconografía

-   **📥 Pull**: Importación desde WooCommerce
-   **📤 Push**: Actualización hacia WooCommerce
-   **✅ Synced**: Estado sincronizado
-   **⚠️ Warning**: Desincronizado
-   **❌ Error**: Estado de error
-   **🟢🔴⚫**: Estados de conexión

## UX y Usabilidad

### Feedback al Usuario

-   **Loading states** durante procesamiento (2-3 segundos)
-   **Progress indicators** en botones de acción
-   **Toast notifications** con estadísticas de resultado
-   **Visual badges** para estados de productos y jobs

### Información Contextual

-   **Cards explicativos** en cada tab describiendo el proceso
-   **Tooltips y ayuda** para acciones complejas
-   **Comparación visual** de stock local vs WooCommerce
-   **Timestamps** formateados para fechas de sincronización

### Accesibilidad

-   **Keyboard navigation** completa
-   **Screen reader support** con labels apropiados
-   **Color contrast** cumpliendo estándares
-   **Focus management** en modales y formularios
