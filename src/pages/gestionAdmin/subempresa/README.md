# Módulo de Gestión de Subempresas

Este módulo maneja la gestión completa de subempresas (subsidiarias) del usuario.

## Estructura de archivos

```
subempresa/
├── components/
│   ├── modals/                          # Modales
│   │   ├── CreateSubempresaModal.tsx        # Modal crear/editar subempresa
│   │   ├── DeleteSubempresaModal.tsx        # Modal confirmar eliminación
│   │   └── index.ts
│   ├── tables/                          # Tablas
│   │   ├── SubempresasTable.tsx             # Tabla con todas las subempresas
│   │   └── index.ts
│   └── index.ts                         # Exportaciones centralizadas
├── helpers/                             # Lógica de negocio
│   ├── subempresaValidation.ts              # Esquema Yup y validaciones
│   ├── subempresaDataMapper.ts              # Mapeo de datos
│   ├── subempresaErrorHandler.ts            # Manejo de errores
│   └── index.ts
├── SubEmpresa.tsx                       # Página principal (~130 líneas)
├── SubEmpresaDetalle.tsx                # Detalle de subempresa
├── SubEmpresaPersonalizacion.tsx        # Personalización
└── README.md
```

## Reducción de código lograda

| Archivo            | Antes       | Después      | Reducción |
| ------------------ | ----------- | ------------ | --------- |
| **SubEmpresa.tsx** | ~633 líneas | ~130 líneas  | **79%**   |
| **Total movido**   | ~500 líneas | Modularizado |           |

## Estructura Consistente

Ahora subempresa sigue el mismo patrón que `empresa` y `usuarios`:

````
empresa/                subempresa/             usuarios/
├── components/         ├── components/         ├── components/
│   ├── modals/         │   ├── modals/         │   ├── modals/
│   ├── tables/         │   ├── tables/         │   ├── tables/
│   └── forms/          │   └── index.ts        │   └── filters/
├── helpers/            ├── helpers/            └── hooks/
└── Empresa.tsx         └── SubEmpresa.tsx

## Componentes

### Modales (`components/modals/`)

#### CreateSubempresaModal
Modal para crear y editar subempresas con:
- Campos: nombre, RUT, teléfono, email, dirección
- Selectores geográficos: región, provincia, comuna
- Validación con Yup
- Manejo de errores específicos

#### DeleteSubempresaModal
Modal de confirmación para eliminar subempresas.

### Tabla (`components/tables/`)

#### SubempresasTable
Tabla con:
- Columnas: nombre, RUT, teléfono, email, acciones
- Estados: loading, empty, data
- Paginación integrada
- Acciones: editar, ver, eliminar

## Helpers

### subempresaValidation.ts
- Esquema Yup para validación de formulario
- Reglas: nombre requerido (3-100 chars), RUT (9-12 chars), email válido, etc.

### subempresaDataMapper.ts
- `buildSubempresaPayload()`: Construye el payload para la API
- Mapea campos del formulario a nombres de la API

### subempresaErrorHandler.ts
- `handleSubempresaError()`: Manejo centralizado de errores
- Detecta duplicados (email, RUT, nombre)
- Mensajes específicos por tipo de error

## Uso

```typescript
import {
  CreateSubempresaModal,
  DeleteSubempresaModal,
  SubempresasTable
} from './components';

// En SubEmpresa.tsx
<SubempresasTable
  subempresas={filteredSubempresas}
  loading={loading}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onCreate={handleCreate}
/>
````

## Flujo de datos

1. **Carga inicial**: `SubEmpresa.tsx` carga subempresas del store
2. **Filtrado**: Búsqueda local por nombre
3. **Render tabla**: `SubempresasTable` muestra datos con estados
4. **Crear/Editar**: `CreateSubempresaModal` maneja el formulario
5. **Validación**: Yup valida campos antes del submit
6. **Envío**: Helper construye payload y envía a API
7. **Errores**: Handler procesa errores y muestra mensajes
8. **Éxito**: Toast de confirmación y recarga de datos
9. **Eliminar**: `DeleteSubempresaModal` confirma eliminación

## Validaciones

### Campos obligatorios

-   Nombre (3-100 caracteres)

### Campos opcionales con validación

-   RUT (9-12 caracteres)
-   Teléfono (8+ dígitos)
-   Email (formato válido, máx 100 caracteres)
-   Dirección (10-200 caracteres)

## Beneficios

1. **Modularidad**: Componentes pequeños y reutilizables
2. **Consistencia**: Misma estructura que otros módulos
3. **Mantenibilidad**: Lógica separada por responsabilidad
4. **Testeable**: Funciones puras en helpers
5. **Escalable**: Fácil agregar nuevas funcionalidades
6. **Legibilidad**: 79% menos código en archivo principal
