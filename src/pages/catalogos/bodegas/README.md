# Módulo de Bodegas - Zentria ERP

## 📋 Descripción

Módulo completo para la gestión de bodegas siguiendo el estándar del proyecto. Implementa listado, creación, edición, eliminación y gestión de productos en bodegas.

## 🏗️ Estructura del Módulo

```
src/pages/catalogos/bodegas/
├── WarehouseListPage.tsx          # Página principal de listado
├── index.ts                        # Exportaciones centralizadas
├── hooks/
│   └── useWarehouseManagement.ts   # Hook principal de gestión
├── tables/
│   └── WarehousesTable.tsx         # Tabla con TanStack Table
├── modals/
│   ├── CreateWarehouseModal.tsx    # Modal de creación
│   └── DeleteWarehouseModal.tsx    # Modal de eliminación
└── components/
    └── WarehouseCapacityBar.tsx    # Componente de capacidad visual
```

## ✅ Componentes Implementados

### 1. WarehouseListPage (Página Principal)

- ✅ Listado de bodegas con búsqueda global
- ✅ Estadísticas rápidas (Total, Activas, Con productos, Cerca capacidad)
- ✅ Filtro de búsqueda en tiempo real
- ✅ Integración con Redux Toolkit
- ✅ Diseño responsive y profesional

### 2. useWarehouseManagement (Hook)

- ✅ Centraliza toda la lógica de negocio
- ✅ Conectado al slice de Redux
- ✅ Manejo de errores con toasts
- ✅ Funciones para CRUD completo
- ✅ Limpieza automática de errores

### 3. WarehousesTable (Tabla)

- ✅ TanStack React Table con sorting
- ✅ Columnas: Nombre/Código, Tipo, Capacidad, Encargado, Estado, Acciones
- ✅ Barra de capacidad visual
- ✅ Badges de estado activo/inactivo
- ✅ Acciones: Ver, Editar, Eliminar
- ✅ Empty state cuando no hay datos
- ✅ Loading state

### 4. CreateWarehouseModal (Modal)

- ✅ Formulario con Formik + Yup
- ✅ Validación completa en línea
- ✅ Secciones organizadas (Datos, Capacidad, Ubicación)
- ✅ Campos obligatorios marcados
- ✅ Conversión automática de código a mayúsculas
- ✅ Capacidad ilimitada opcional

### 5. DeleteWarehouseModal (Modal)

- ✅ Validación de productos asociados
- ✅ Prevención de eliminación si tiene productos
- ✅ Mensaje claro con detalles de la bodega
- ✅ Confirmación segura

### 6. WarehouseCapacityBar (Componente)

- ✅ Barra visual de progreso
- ✅ Colores según porcentaje (verde, amarillo, rojo)
- ✅ Muestra current/maximum
- ✅ Cálculo de disponibles
- ✅ Soporte para capacidad ilimitada
- ✅ Tres tamaños (sm, md, lg)

## 🚀 Uso

### Importar la página principal

```tsx
import { WarehouseListPage } from '@/pages/catalogos/bodegas';
```

### Importar componentes individuales

```tsx
import {
	useWarehouseManagement,
	WarehousesTable,
	CreateWarehouseModal,
	DeleteWarehouseModal,
	WarehouseCapacityBar,
} from '@/pages/catalogos/bodegas';
```

## 📊 Integración con Redux

El módulo está completamente integrado con el slice de Redux en:

```
src/store/slices/warehouses/warehouseSlice.ts
```

### State disponible:

- `warehouses`: Array de bodegas
- `warehouseDetail`: Detalle de bodega seleccionada
- `meta`: Metadatos de paginación
- `stats`: Estadísticas calculadas
- Estados de loading: `loading`, `warehouseDetailLoading`, `creating`, `updating`, `deleting`

### Actions disponibles:

- `fetchWarehouses`: Obtener listado
- `fetchWarehouseDetail`: Obtener detalle
- `createWarehouse`: Crear nueva
- `updateWarehouse`: Actualizar existente
- `deleteWarehouse`: Eliminar
- `attachProductsToWarehouse`: Agregar productos
- `detachProductFromWarehouse`: Quitar producto

## 🎨 Características UX

### Principios aplicados:

✅ **Sin fricción**: El flujo de "listar → ver → gestionar" es natural
✅ **Información visible**: Todo importante sin hacer click
✅ **Feedback inmediato**: Spinners, toasts, validaciones en línea
✅ **Mensajes humanos**: No códigos de error técnicos
✅ **Empty states**: Siempre con CTA útil
✅ **Confirmaciones claras**: Para acciones destructivas

### Flujo de usuario:

1. **Listado**: Tabla limpia + filtros arriba
2. **Crear**: Modal sin redirigir
3. **Detalle**: Tarjeta resumen + tabla productos (pendiente)
4. **Agregar productos**: Modal con filas dinámicas (pendiente)
5. **Eliminar**: Confirmación clara y validación

## 🔄 Próximas Implementaciones

### Pendientes:

- [ ] Modal de edición (EditWarehouseModal)
- [ ] Página de detalle (WarehouseDetailPage)
- [ ] Modal para agregar productos (AttachProductsModal)
- [ ] Modal para quitar productos
- [ ] Paginación en la tabla
- [ ] Filtros avanzados (por tipo, estado, etc.)
- [ ] Exportación a CSV/Excel

## 📝 Notas Técnicas

### Validaciones implementadas:

- Nombre: mínimo 3 caracteres, obligatorio
- Código: solo mayúsculas, números y guiones, obligatorio
- Tipo: obligatorio
- Capacidad: número positivo o null (ilimitado)

### Manejo de errores:

- Todos los errores se muestran como toasts
- Validaciones de formulario en línea
- Prevención de eliminación si hay productos asociados
- Limpieza automática de errores al desmontar

### Performance:

- Lazy loading recomendado para la página
- Filtro de búsqueda optimizado con useMemo
- Componentes memoizados donde sea necesario

## 🔗 Referencias

- **Slice Redux**: `src/store/slices/warehouses/warehouseSlice.ts`
- **Interfaces**: `src/interface/warehouse.interface.ts`
- **Documentación UX**: Ver requirements originales
- **Guía de diseño**: `GUIA_SISTEMA_DISENO_UI.md`

---

**Última actualización**: 5 de noviembre de 2025
**Versión**: 1.0 - Base implementada sin mocks
