# Parámetros del Sistema - ERP Zentria

## 📋 Información del Módulo

**RF Asociado:** R.11 - Mantenedor de Parámetros del Sistema  
**Tipo:** Funcional  
**Estado:** Implementado (Completo)  
**Ruta:** `/admin/system-parameters`

## 🎯 Descripción

El módulo de **Parámetros del Sistema** permite gestionar la configuración central del ERP a través de parámetros clave-valor organizados por categorías. Este sistema proporciona un control granular sobre el comportamiento de la aplicación sin necesidad de modificar código fuente.

### Actores Relacionados

-   **Super Administrador**: Control total sobre todos los parámetros
-   **Administrador de Sistema**: Gestión de parámetros no críticos
-   **Administrador de Empresa**: Acceso a parámetros específicos de negocio

## ⚙️ Funcionalidades Implementadas

### ✅ CRUD Completo

-   **Crear**: Nuevos parámetros con validación
-   **Leer**: Listado paginado con filtros avanzados
-   **Actualizar**: Edición de parámetros modificables
-   **Eliminar**: Eliminación con confirmación (solo parámetros editables)

### ✅ Gestión Avanzada

-   **Categorización**: 7 categorías (general, system, email, security, integration, ui, business)
-   **Tipos de Datos**: string, number, boolean, json, date
-   **Control de Acceso**: Parámetros editables vs protegidos del sistema
-   **Visibilidad**: Control de parámetros visibles en la interfaz
-   **Validación**: Reglas de validación tipo Laravel
-   **Auditoría**: Tracking de cambios con usuario y timestamp

### ✅ Interfaz de Usuario

-   **Dashboard**: Estadísticas por categoría y estado
-   **Filtros Avanzados**: Por categoría, tipo, editabilidad, búsqueda de texto
-   **Vista de Detalle**: Información completa de cada parámetro
-   **Modales CRUD**: Formularios optimizados para cada acción
-   **Confirmaciones**: Diálogos de confirmación para acciones críticas

## 📊 Estructura de Datos

### SystemParameter Interface

```typescript
interface SystemParameter {
	id: number;
	key: string; // Clave única (ej: "app.name")
	value: string; // Valor actual
	description: string; // Descripción del parámetro
	category: 'general' | 'system' | 'email' | 'security' | 'integration' | 'ui' | 'business';
	data_type: 'string' | 'number' | 'boolean' | 'json' | 'date';
	is_editable: boolean; // Si puede ser editado por usuarios
	is_visible: boolean; // Si aparece en la interfaz
	default_value?: string; // Valor por defecto
	validation_rules?: string; // Reglas de validación
	created_at: string;
	updated_at: string;
	updated_by?: string; // Usuario que realizó el último cambio
}
```

### Ejemplos de Parámetros

```typescript
// Configuración de aplicación
{
    key: "app.name",
    value: "Zentria ERP",
    category: "general",
    data_type: "string"
}

// Configuración de seguridad
{
    key: "security.session_timeout",
    value: "1800",
    category: "security",
    data_type: "number"
}

// Configuración de integración
{
    key: "integration.woocommerce_enabled",
    value: "true",
    category: "integration",
    data_type: "boolean"
}
```

## 🔐 Permisos Necesarios

```typescript
permissions: [
	'view-system-parameters', // Ver listado
	'create-system-parameters', // Crear nuevos
	'update-system-parameters', // Editar existentes
	'delete-system-parameters', // Eliminar parámetros
];
```

### Roles con Acceso

-   `super-admin`: Acceso completo
-   `company-admin`: Parámetros de negocio
-   `system-admin`: Parámetros técnicos específicos

## 📁 Estructura del Módulo

```
src/pages/admin/systemParameters/
├── SystemParametersAdmin.tsx           # Página principal
├── SystemParameterDetails.tsx          # Vista de detalle
├── components/
│   ├── modals/
│   │   ├── SystemParameterDetailsModal.tsx
│   │   ├── DeleteSystemParameterModal.tsx
│   │   ├── CreateEditSystemParameterModal.tsx
│   │   └── index.ts
│   └── tables/
│       ├── SystemParametersTable.tsx
│       └── index.ts
├── hooks/
│   ├── useSystemParametersManagement.ts
│   └── index.ts
├── mocks/
│   └── systemParameters.mock.ts        # 12 registros mock
├── README.md                            # Este archivo
└── index.ts
```

## 🎨 Características UI/UX

### Dashboard de Estadísticas

-   Total de parámetros
-   Parámetros editables vs protegidos
-   Distribución por categorías
-   Filtros visuales con badges clickeables

### Sistema de Colores por Categoría

-   **General**: Azul
-   **Sistema**: Rojo
-   **Email**: Verde
-   **Seguridad**: Amarillo
-   **Integración**: Púrpura
-   **Interfaz**: Rosa
-   **Negocio**: Índigo

### Validación de Formularios

-   Validación en tiempo real con Yup
-   Placeholders dinámicos según tipo de dato
-   Reglas de validación visuales
-   Campos condicionales según contexto

## 🔄 Estados y Flujos

### Estados del Hook

```typescript
interface SystemParametersState {
	parameters: SystemParameter[];
	filteredParameters: SystemParameter[];
	isLoading: boolean;
	error: string | null;
	pagination: PaginationState;
	filters: SystemParameterFilters;
}
```

### Flujos de Trabajo

1. **Carga Inicial**: Fetch de parámetros con filtros por defecto
2. **Filtrado**: Aplicación de filtros en tiempo real
3. **CRUD**: Operaciones con feedback visual y confirmaciones
4. **Auditoría**: Tracking automático de cambios

## 📡 Integración Backend (Endpoints Sugeridos)

```typescript
// API endpoints requeridos
GET    /api/system-parameters          # Listar con filtros
GET    /api/system-parameters/:id      # Obtener por ID
POST   /api/system-parameters          # Crear nuevo
PUT    /api/system-parameters/:id      # Actualizar
DELETE /api/system-parameters/:id      # Eliminar

// Query parameters soportados
?search=text           # Búsqueda en key, description, value
?category=general      # Filtrar por categoría
?data_type=string      # Filtrar por tipo
?is_editable=true      # Filtrar por editabilidad
?is_visible=true       # Filtrar por visibilidad
?page=1&per_page=10    # Paginación
```

## 🧪 Datos de Prueba

El módulo incluye **12 registros mock** que cubren:

-   Todas las categorías (7)
-   Todos los tipos de datos (5)
-   Mix de parámetros editables y protegidos
-   Valores realistas de configuración
-   Reglas de validación ejemplo

## 🚨 Consideraciones de Seguridad

### Parámetros Críticos

-   Parámetros de sistema (`is_editable: false`)
-   Valores sensibles (contraseñas, tokens)
-   Configuración de seguridad

### Validaciones

-   Sanitización de entrada
-   Validación de tipos
-   Reglas de negocio por categoría
-   Logging de cambios críticos

## 🔄 Estados de Implementación

-   [x] **Interfaces TypeScript** - Completas
-   [x] **Mocks de Datos** - 12 registros realistas
-   [x] **Hook de Gestión** - CRUD completo con estado local
-   [x] **Tabla con Filtros** - TanStack React Table
-   [x] **Modales CRUD** - Create, Edit, Delete, Details
-   [x] **Página Principal** - Dashboard con estadísticas
-   [x] **Vista de Detalle** - Información completa
-   [x] **Validaciones** - Yup + React Hook Form
-   [x] **README** - Documentación completa
-   [x] **Permisos** - Configuración en pages.config.ts
-   [ ] **Integración API** - Pendiente (usar mocks)
-   [ ] **Tests Unitarios** - Pendiente
-   [ ] **Navegación Sidebar** - Pendiente agregar al menú

## 🎯 Próximos Pasos

1. **Agregar al Sidebar**: Incluir en configuración de navegación
2. **Integración Backend**: Conectar con API real
3. **Cache**: Implementar cache para parámetros frecuentes
4. **Sincronización**: Sistema de sincronización en tiempo real
5. **Import/Export**: Funcionalidad de backup/restore
6. **Templates**: Plantillas de configuración por tipo de negocio

## 📚 Notas de Desarrollo

### Patrón Implementado

Este módulo sigue exactamente el patrón establecido por el módulo `invitations`, incluyendo:

-   Estructura de carpetas modular
-   Hook personalizado para gestión de estado
-   Componentes reutilizables
-   Tipado completo con TypeScript
-   UI/UX consistente con el diseño del sistema

### Escalabilidad

-   Preparado para integración backend
-   Sistema de filtros extensible
-   Validaciones configurables
-   Categorías y tipos expandibles

---

**Módulo completado el:** 9 de septiembre de 2025  
**Siguientes módulos:** Documentos, Garantías, Revisiones Técnicas
