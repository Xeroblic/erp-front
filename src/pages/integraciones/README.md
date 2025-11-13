# Módulo de Integraciones - WooCommerce

## Descripción

Módulo completo de gestión de integraciones para ERP Zentria, con soporte para WooCommerce mediante Webhooks y API REST. **Solo accesible para Super Admin**.

## Estructura del Módulo

```
src/
├── types/
│   └── integrations.types.ts          # Tipos TypeScript completos
├── services/
│   └── integrationsService.ts         # Servicio API con todos los endpoints
└── pages/
    └── integraciones/
        ├── IntegrationsListPage.tsx   # Página principal: listado de integraciones
        └── components/
            └── ModalIntegration.tsx   # Modal para crear/editar/ver integraciones
```

## Funcionalidades Implementadas

### 1. Gestión de Integraciones ✅

- **Listado** de todas las integraciones configuradas
- **Crear** nuevas integraciones (Webhook o API REST)
- **Editar** integraciones existentes
- **Eliminar** integraciones
- **Ver detalle** con información de seguridad

### 2. Manejo de Credenciales (One-Time Display) ✅

- Al crear una integración, se muestran los secretos **solo una vez**:
    - `api_key` para el path del webhook
    - `webhook_secret` para validación HMAC
    - `consumer_key` y `consumer_secret` para API REST
- **Rotación de claves**: permite rotar API Key y Webhook Secret en modo edición
- Visualización segura con prefijo y banderas de presencia

### 3. Modos de Integración ✅

- **Webhook**: Recibir órdenes automáticamente desde WooCommerce
- **Read**: Consultar órdenes de WooCommerce (solo lectura)
- **Read/Write**: Consultar órdenes Y sincronizar stock

## Endpoints Implementados en el Servicio

### Gestión de Integraciones

- `getIntegrations(subsidiaryId, params?)` - Listar integraciones
- `getIntegration(subsidiaryId, integrationId)` - Obtener detalle
- `createIntegration(subsidiaryId, payload)` - Crear integración
- `updateIntegration(subsidiaryId, integrationId, payload)` - Actualizar/rotar
- `deleteIntegration(subsidiaryId, integrationId)` - Eliminar

### Productos No Mapeados (por integración)

- `getUnmappedProducts(subsidiaryId, integrationId, params?)` - Pendientes
- `getMappedProducts(subsidiaryId, integrationId, params?)` - Mapeados
- `getSyncedProducts(subsidiaryId, integrationId, params?)` - Sincronizados ERP↔Woo
- `getUnmappedProductDetail(subsidiaryId, integrationId, unmappedProductId)` - Detalle
- `mapProduct(subsidiaryId, integrationId, unmappedProductId, payload)` - Mapear
- `unmapProduct(subsidiaryId, integrationId, unmappedProductId)` - Desmapear
- `ignoreUnmappedProduct(subsidiaryId, integrationId, unmappedProductId)` - Ignorar

### Productos No Mapeados (consolidado)

- `getConsolidatedUnmappedProducts(subsidiaryId, params?)` - Pendientes de todas
- `getConsolidatedMappedProducts(subsidiaryId, params?)` - Mapeados de todas

### WooCommerce Admin (API REST)

- `checkOrImportOrder(subsidiaryId, wcOrderId, integrationId?)` - Verificar/importar orden
- `importMissingOrders(subsidiaryId, integrationId?)` - Importar órdenes faltantes
- `syncStock(subsidiaryId, payload?, integrationId?)` - Sincronizar stock

## Configuración

### En `pages.config.ts`

```typescript
integrations: {
	id: 'integrations',
	to: '/integraciones',
	text: 'Integraciones',
	icon: 'HeroGlobeAlt',
	authority: ['view-integration'],
	roles: ['super-admin'],
	requireAll: true,
	subPages: {
		list: { ... },
		unmappedProducts: { ... },
		syncStock: { ... },
		importOrders: { ... },
	},
}
```

### En `contentRoutes.tsx`

```tsx
{
	path: cfg.integrations.to,
	element: <IntegrationsListPage />,
	authority: cfg.integrations.authority,
}
```

## Permisos Requeridos

**Solo Super Admin** puede acceder al módulo:

- Authority: `['view-integration']`
- Roles: `['super-admin']`
- `requireAll: true`

Para editar/eliminar se necesitará: `['edit-integration']` (a implementar según necesidad)

## Próximos Pasos (Pendientes)

### Páginas por Crear:

1. **Productos Sin Mapear** (`/integraciones/productos-sin-mapear`)
    - Vista consolidada de productos pendientes de mapeo
    - Filtros por integración, estado, búsqueda
    - Acciones masivas de mapeo

2. **Sincronizar Stock** (`/integraciones/sincronizar-stock`)
    - Interfaz para sincronizar stock ERP → WooCommerce
    - Selección de SKUs o sincronización completa
    - Visualización de resultados y errores

3. **Importar Órdenes** (`/integraciones/importar-ordenes`)
    - Verificar órdenes por ID de WooCommerce
    - Importación incremental de órdenes faltantes
    - Historial de importaciones

### Funcionalidades Adicionales:

- [ ] Logs detallados de webhook (guardar payloads recibidos)
- [ ] Dashboard de métricas por integración
- [ ] Notificaciones en tiempo real de errores
- [ ] Tests de conectividad desde UI
- [ ] Documentación integrada con ejemplos de configuración Woo

## Uso

### Crear una integración Webhook:

1. Ir a **Integraciones** → **Listado**
2. Click en "Nueva Integración"
3. Llenar formulario:
    - Nombre: "Tienda Principal"
    - Proveedor: WooCommerce
    - URL Base: https://mitienda.cl
    - Modo: Webhook
    - Activa: Sí
4. **Guardar** → Se muestran `api_key` y `webhook_secret` **una sola vez**
5. Copiar credenciales y configurar en WooCommerce:
    - URL: `{ERP_URL}/api/integrations/woocommerce/webhooks/{api_key}/orders`
    - Secret: `{webhook_secret}`

### Crear una integración API REST:

1. Mismo flujo, seleccionar modo "Lectura/Escritura"
2. Ingresar `consumer_key` y `consumer_secret` de WooCommerce
3. Guardar → Ya está lista para usar con endpoints de admin

### Rotar claves:

1. Editar integración
2. Click en "Rotar API Key" o "Rotar Webhook Secret"
3. Confirmar → Se muestra la nueva clave **una sola vez**
4. Actualizar en WooCommerce

## Seguridad

- Las claves se muestran **solo una vez** al crear/rotar
- En base de datos se guardan encriptadas/hasheadas
- Solo se expone `api_key_prefix` en listados
- Banderas `has_*` indican presencia sin revelar valor
- Validación HMAC en webhooks públicos
- API Key en path para webhooks (validado en backend)

## Tecnologías

- **TypeScript** con tipos completos
- **React Hooks** para manejo de estado
- **ApiService** para peticiones HTTP
- **Redux** para estado global (preferred_subsidiary_id)
- **Componentes UI** del sistema Zentria (Card, Button, Badge, Table, Modal, etc.)

## Documentación de Referencia

Ver archivo adjunto: `integrations-implementation-guide.md`

---

**Última actualización**: 13 de noviembre de 2025
**Autor**: Sistema Zentria ERP
**Acceso**: Solo Super Admin
