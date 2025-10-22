# Migración del Sistema de Permisos ERP

## Resumen de Cambios

Este documento explica los cambios realizados en el sistema de permisos para normalizar los roles y resolver problemas de visibilidad de páginas.

## 🏗️ Arquitectura de Permisos

### Ubicaciones de Permisos:

1. **Base de Datos**: Fuente única de verdad para los permisos
2. **Backend API**: Provee permisos vía `permissionsSlice`
3. **pages.config.ts**: Define acceso a páginas basado en permisos de BD
4. **Componentes**: Usan `PermissionGuard` para validación UI

## 📋 Roles Normalizados

### Jerarquía de Roles (13 roles empresariales):

| Rol                   | Código                  | Nivel | Descripción               |
| --------------------- | ----------------------- | ----- | ------------------------- |
| Super Administrador   | `super-admin`           | 0     | Control total del sistema |
| Supervisor Empresa    | `supervisor-empresa`    | 1     | Supervisión general       |
| Administrador         | `administrador`         | 2     | Administración operativa  |
| Gestor Operativo      | `gestor-operativo`      | 3     | Gestión de operaciones    |
| Coordinador Logístico | `coordinador-logistico` | 4     | Coordinación logística    |
| Analista Senior       | `analista-senior`       | 5     | Análisis avanzado         |
| Supervisor de Área    | `supervisor-area`       | 6     | Supervisión departamental |
| Gestor de Inventario  | `gestor-inventario`     | 7     | Gestión de stock          |
| Analista Junior       | `analista-junior`       | 8     | Análisis básico           |
| Operador de Almacén   | `operador-almacen`      | 9     | Operaciones de almacén    |
| Vendedor              | `vendedor`              | 10    | Ventas y atención         |
| Cajero                | `cajero`                | 11    | Operaciones de caja       |
| Sistema               | `system`                | 12    | Procesos automáticos      |

## 📁 Estructura de Archivos

### ✅ Archivos Actualizados:

-   **`src/constants/erp-permissions.constant.ts`**:

    -   ✅ Normalizado con roles empresariales
    -   ✅ Eliminadas constantes ERP_PERMISSIONS (redundantes)
    -   ✅ Conserva utilidades de roles

-   **`src/config/pages.config.ts`**:
    -   ✅ Estructura completa de módulos ERP
    -   ✅ Permisos por página definidos
    -   ✅ Arrays de autoridad por rol

### 📄 Archivo Temporal:

-   **`src/constants/temp-permissions.constant.ts`**:
    -   ⚠️ **ARCHIVO TEMPORAL** para compatibilidad
    -   🔄 Mantiene componentes funcionando durante migración
    -   🗑️ **ELIMINAR** una vez migrados todos los componentes

### 🔧 Archivos Actualizados (Usando archivo temporal):

-   `src/pages/inventory/transferencias/Transferencias.tsx`
-   `src/pages/inventario/Inventario.tsx`
-   `src/pages/comercial/ventas/Ventas.tsx`
-   `src/pages/comercial/transferencias/Transferencias.tsx`
-   `src/pages/comercial/cotizaciones/Cotizaciones.tsx`

## 🎯 Configuración de Páginas

### Estructura de Módulos ERP:

```typescript
privatePages: {
  erp: {
    inventory: {
      // Control de inventario
      path: '/erp/inventory',
      authority: ['inventory.view'],
      role_restrictions: {
        excluded_roles: ['cajero', 'vendedor']
      }
    },
    commercial: {
      // Módulo comercial
      path: '/erp/commercial',
      authority: ['sales.view', 'quotes.view'],
      role_restrictions: {
        allowed_roles: ['super-admin', 'administrador', 'supervisor-empresa']
      }
    },
    reports: {
      // Reportes y analítica
      path: '/erp/reports',
      authority: ['reports.view'],
      role_restrictions: {
        minimum_level: 5 // Analista senior o superior
      }
    }
  }
}
```

## 🔄 Plan de Migración

### Fase 1: ✅ Completada

-   [x] Normalizar roles empresariales
-   [x] Actualizar pages.config.ts
-   [x] Crear archivo temporal de compatibilidad
-   [x] Actualizar importaciones principales

### Fase 2: 🔄 En Progreso

-   [ ] Migrar componentes para usar permisos de BD
-   [ ] Eliminar dependencias del archivo temporal
-   [ ] Validar que PermissionGuard use permisos correctos

### Fase 3: 📅 Pendiente

-   [ ] Eliminar temp-permissions.constant.ts
-   [ ] Validar acceso a todas las páginas
-   [ ] Testing completo del sistema de permisos

## 🚨 Notas Importantes

1. **Los permisos REALES vienen de la base de datos**
2. **pages.config.ts es el ÚNICO lugar para validar acceso a rutas**
3. **El archivo temporal es SOLO para evitar errores durante migración**
4. **PermissionGuard debería usar permisos del backend, no constantes**

## 🔧 Tareas Pendientes

-   [ ] Actualizar interfaces para coincidir con estructura de BD
-   [ ] Implementar validación de permisos desde el backend
-   [ ] Crear hook personalizado para manejo de permisos
-   [ ] Eliminar hardcoded permission checks

## 📞 Ayuda

Si encuentras problemas:

1. Verifica que los permisos estén en la BD
2. Revisa que pages.config.ts tenga la página configurada
3. Confirma que el usuario tenga el rol correcto
4. NO agregues permisos al archivo temporal (solo para emergencias)

---

**Fecha**: $(date)
**Estado**: Migración en progreso - Sistema funcional
