# Módulo de Gestión de Roles y Permisos

## Estructura Modular

```
roles y permisos/
├── components/          # Componentes reutilizables
│   └── DynamicTabs.tsx # Sistema de tabs dinámico
├── tabs/               # Componentes de cada tab
│   ├── InformacionTab.tsx  # Tab de información del usuario
│   ├── RolesTab.tsx       # Tab de gestión de roles
│   └── PermisosTab.tsx    # Tab de gestión de permisos
├── hooks/              # Custom hooks
│   ├── useUserData.ts      # Hook para transformar datos de usuario
│   └── useUserPermissions.ts # Hook para gestionar permisos
├── utils/              # Utilidades y helpers
│   ├── transformers.ts # Funciones de transformación de datos
│   └── filters.ts      # Funciones de filtrado para tablas
├── types/              # TypeScript interfaces y tipos
│   └── index.ts       # Todas las definiciones de tipos
├── constants/          # Constantes y configuraciones
│   └── tabs.ts        # Configuración de tabs
├── RolesPermisos.tsx  # Página principal (lista)
└── UserPermissionsDetail.tsx # Página de detalle
```

## Características

### Componentes Modulares

- **DynamicTabs**: Sistema de tabs reutilizable que acepta configuración
- **InformacionTab**: Muestra datos básicos del usuario y resumen
- **RolesTab**: Formulario para asignar/editar roles
- **PermisosTab**: Formulario para gestionar permisos directos

### Custom Hooks

- **useUserData**: Transforma y enriquece datos del usuario
- **useUserPermissions**: Gestiona opciones de roles y permisos disponibles

### Utilidades

- **transformers**: Funciones para transformar UserWithDetails a UserRow
- **filters**: Funciones de filtrado para TanStack Table

### Types

- `TabType`: Tipos de tabs disponibles
- `UserRow`: Interfaz extendida de usuario para tablas
- `TabConfig`: Configuración de tabs
- `DynamicTabsProps`: Props para componente de tabs
- `UserPermissionsFormValues`: Valores del formulario

## Uso

### Página Principal

```tsx
import RolesPermisos from './RolesPermisos';
// Lista de usuarios con botón "Gestionar"
```

### Página de Detalle

```tsx
import UserPermissionsDetail from './UserPermissionsDetail';
// Detalle con tabs: Información, Roles, Permisos
```

### Hooks

```tsx
const userData = useUserData(selectedUser);
const { roleOptions, permissionOptions, currentRoles, currentPermissions } =
	useUserPermissions(selectedUser);
```

### Tabs Dinámicos

```tsx
<DynamicTabs tabs={USER_DETAIL_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
```

## Notas

- Todos los componentes son TypeScript strict
- Cada tab es independiente y reutilizable
- Los hooks centralizan la lógica de negocio
- Las utilidades son funciones puras y testeables
