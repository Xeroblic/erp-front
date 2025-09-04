# Flujo de Creación de Páginas - Zentria ERP

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Estructura del Sistema de Páginas](#estructura-del-sistema-de-páginas)
3. [Paso a Paso: Crear una Nueva Página](#paso-a-paso-crear-una-nueva-página)
4. [Sistema de Configuración de Páginas](#sistema-de-configuración-de-páginas)
5. [Sistema de Enrutamiento](#sistema-de-enrutamiento)
6. [Sistema de Permisos y Autorización](#sistema-de-permisos-y-autorización)
7. [Sistema de Navegación](#sistema-de-navegación)
8. [Componentes de Protección](#componentes-de-protección)
9. [Hooks de Autorización](#hooks-de-autorización)
10. [Ejemplos Prácticos](#ejemplos-prácticos)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Introducción

Este documento describe el flujo completo para crear nuevas páginas en el sistema ERP, incluyendo configuración de permisos, enrutamiento y navegación. El sistema está diseñado para ser escalable y mantener una arquitectura consistente.

### Tecnologías Involucradas

-   **React 18** + TypeScript para componentes
-   **React Router v6** para enrutamiento
-   **Redux Toolkit** para estado global
-   **Sistema de autorización personalizado** con permisos granulares en cada pagina 

---

## Estructura del Sistema de Páginas

```
src/
├── pages/                          # Páginas de la aplicación
│   ├── Login.page.tsx              # Páginas públicas
│   ├── gestionAdmin/               # Módulo de gestión administrativa
│   ├── admin/                      # Módulo de administración
│   ├── invitations/               # Módulo de invitaciones
│   └── [nuevo-modulo]/            # Tu nuevo módulo
├── routes/
│   └── contentRoutes.tsx          # Configuración de rutas
├── config/
│   └── pages.config.ts            # Configuración de páginas y permisos
├── components/
│   └── authorization/             # Componentes de protección
├── hooks/
│   └── useAuthority.ts            # Hook de autorización
└── templates/layouts/Asides/
    └── DefaultAside.template.tsx  # Navegación lateral
```

---

## Paso a Paso: Crear una Nueva Página

### Paso 1: Crear el Componente de la Página

**Ubicación**: `src/pages/[modulo]/[NombrePagina].tsx`

```tsx
// src/pages/inventario/ProductosPage.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Container from '@/components/layouts/Container/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAppDispatch, useAppSelector } from '@/store';

interface ProductosPageProps {}

const ProductosPage: React.FC<ProductosPageProps> = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	return (
		<Container>
			<Card>
				<Card.Header>
					<Card.HeaderTitle>{t('pages.inventario.productos.title')}</Card.HeaderTitle>
				</Card.Header>
				<Card.Body>
					{/* Contenido de la página */}
					<div className='p-4'>
						<p>Gestión de productos del inventario</p>
					</div>
				</Card.Body>
			</Card>
		</Container>
	);
};

export default ProductosPage;
```

### Paso 2: Configurar la Página en pages.config.ts

**Archivo**: `src/config/pages.config.ts`

```typescript
// Agregar nueva configuración al módulo correspondiente
export const privatePages = {
	// ... páginas existentes
	inventario: {
		id: 'inventario',
		to: '/inventario',
		text: 'Inventario',
		icon: 'HeroArchiveBox',
		authority: ['view-inventory'],
		roles: ['super-admin', 'company-admin', 'inventory-manager'],
		subPages: {
			productos: {
				id: 'productos',
				to: '/inventario/productos',
				text: 'Productos',
				icon: 'HeroCube',
				authority: ['view-products', 'manage-products'],
				roles: ['super-admin', 'company-admin', 'inventory-manager'],
				requireAll: false, // Modo OR para permisos
			},
			categorias: {
				id: 'categorias',
				to: '/inventario/categorias',
				text: 'Categorías',
				icon: 'HeroRectangleGroup',
				authority: ['view-categories', 'manage-categories'],
				roles: ['super-admin', 'company-admin'],
				requireAll: true, // Modo AND para permisos
			},
		},
	},
};
```

**Propiedades de Configuración**:

| Propiedad    | Tipo       | Descripción                      | Obligatorio |
| ------------ | ---------- | -------------------------------- | ----------- |
| `id`         | `string`   | Identificador único de la página | ✅          |
| `to`         | `string`   | Ruta URL de la página            | ✅          |
| `text`       | `string`   | Texto mostrado en navegación     | ✅          |
| `icon`       | `TIcons`   | Icono Heroicons para navegación  | ✅          |
| `authority`  | `string[]` | Permisos requeridos              | ✅          |
| `roles`      | `string[]` | Roles que pueden acceder         | ❌          |
| `requireAll` | `boolean`  | Modo AND vs OR para permisos     | ❌          |
| `companyId`  | `number`   | Empresa específica requerida     | ❌          |

### Paso 3: Agregar la Ruta en contentRoutes.tsx

**Archivo**: `src/routes/contentRoutes.tsx`

```tsx
// 1. Importar la página (lazy loading recomendado)
const ProductosPage = lazy(() => import('@/pages/inventario/ProductosPage'));

// 2. Agregar la ruta al array de rutas
const contentRoutes: IRoutePersonalizada[] = [
	// ... rutas existentes

	// Nueva ruta
	{
		path: cfg.inventario.subPages.productos.to,
		element: <ProductosPage />,
		authority: cfg.inventario.subPages.productos.authority,
	},

	// ... más rutas
];
```

**Interfaz de Ruta Personalizada**:

```typescript
export interface IRoutePersonalizada extends PathRouteProps {
	authority?: string[]; // Permisos requeridos
	feature?: string; // Feature flag (opcional)
	public?: boolean; // Si es ruta pública
}
```

### Paso 4: Agregar Navegación en DefaultAside.template.tsx

**Archivo**: `src/templates/layouts/Asides/DefaultAside.template.tsx`

```tsx
// Agregar navegación principal o en collapse
<NavTitle>Inventario</NavTitle>

<NavCollapse text="Inventario" icon="HeroArchiveBox" to={''}>
    {/* Productos */}
    <AuthorityCheckNav
        authority={Pages.inventario.subPages.productos.authority}
        userAuthority={userPermissionsAndRoles}
        requireAll={Pages.inventario.subPages.productos.requireAll}
    >
        <NavItem
            text={Pages.inventario.subPages.productos.text}
            to={Pages.inventario.subPages.productos.to}
            icon={Pages.inventario.subPages.productos.icon}
            id={Pages.inventario.subPages.productos.id}
            onClick={() => navigate(Pages.inventario.subPages.productos.to)}
        />
    </AuthorityCheckNav>

    {/* Categorías */}
    <AuthorityCheckNav
        authority={Pages.inventario.subPages.categorias.authority}
        userAuthority={userPermissionsAndRoles}
        requireAll={Pages.inventario.subPages.categorias.requireAll}
    >
        <NavItem
            text={Pages.inventario.subPages.categorias.text}
            to={Pages.inventario.subPages.categorias.to}
            icon={Pages.inventario.subPages.categorias.icon}
            id={Pages.inventario.subPages.categorias.id}
            onClick={() => navigate(Pages.inventario.subPages.categorias.to)}
        />
    </AuthorityCheckNav>
</NavCollapse>
```

### Paso 5: Actualizar Permisos y Roles (Backend)

Asegurarse de que los permisos definidos existan en el backend:

```typescript
// src/constants/permissions.constant.ts
// Agregar nuevos permisos si no existen
export const INVENTORY_PERMISSIONS = [
	'view-inventory',
	'view-products',
	'manage-products',
	'create-products',
	'edit-products',
	'delete-products',
	'view-categories',
	'manage-categories',
];
```

---

## Sistema de Configuración de Páginas

### Estructura de pages.config.ts

```typescript
export interface PageConfig {
	id: string; // Identificador único
	to: string; // Ruta URL
	text: string; // Texto de navegación
	icon: string; // Icono Heroicons
	authority: string[]; // Permisos requeridos
	roles?: string[]; // Roles específicos
	companyId?: number; // Empresa específica
	requireAll?: boolean; // Modo AND para permisos
}
```

### Tipos de Configuración

#### 1. Páginas de Autenticación (`authPages`)

```typescript
export const authPages = {
	loginPage: {
		id: 'loginPage',
		to: '/login',
		text: 'Login',
		icon: 'HeroArrowRightOnRectangle',
		authority: [],
	},
	profilePage: {
		id: 'profilePage',
		to: '/profile',
		text: 'Perfil',
		icon: 'HeroUser',
		authority: [],
	},
};
```

#### 2. Páginas Privadas (`privatePages`)

```typescript
export const privatePages = {
	dashboard: {
		id: 'dashboard',
		to: '/dashboard',
		text: 'Dashboard',
		icon: 'HeroChartBarSquare',
		authority: [],
		roles: ['super-admin', 'company-admin', 'subsidiary-admin'],
	},
	manage: {
		id: 'manage',
		to: '/gestion',
		text: 'Gestión',
		icon: 'HeroBuildingStorefront',
		authority: ['view-company'],
		subPages: {
			company: {
				id: 'company',
				to: '/gestion/empresa',
				text: 'Empresa',
				icon: 'HeroBuildingOffice2',
				authority: ['view-company', 'edit-company'],
			},
		},
	},
};
```

---

## Sistema de Enrutamiento

### Configuración en contentRoutes.tsx

```tsx
import { PathRouteProps } from 'react-router-dom';
import pagesConfig from '@/config/pages.config';

export interface IRoutePersonalizada extends PathRouteProps {
	authority?: string[]; // Permisos requeridos
	feature?: string; // Feature flag
	public?: boolean; // Ruta pública
}

const cfg = pagesConfig as any;

const contentRoutes: IRoutePersonalizada[] = [
	// Rutas públicas
	{
		path: cfg.loginPage.to,
		element: <LoginPage />,
		public: true,
	},

	// Rutas protegidas
	{
		path: cfg.dashboard.to,
		element: <Dashboard />,
		authority: cfg.dashboard.authority,
	},

	// Rutas con lazy loading
	{
		path: cfg.manage.subPages.company.to,
		element: <EmpresaPage />,
		authority: cfg.manage.subPages.company.authority,
	},

	// Ruta 404
	{ path: '*', element: <NotFoundPage />, public: true },
];
```

### Tipos de Rutas

#### 1. Rutas Públicas

-   No requieren autenticación
-   `public: true`
-   Ejemplos: login, recuperar contraseña, 404

#### 2. Rutas Protegidas Básicas

-   Requieren autenticación
-   Sin permisos específicos
-   `authority: []`

#### 3. Rutas con Permisos

-   Requieren permisos específicos
-   `authority: ['permission1', 'permission2']`

#### 4. Rutas con Feature Flags

-   Controladas por features habilitadas
-   `feature: 'new-dashboard'`

---

## Sistema de Permisos y Autorización

### Tipos de Autorización

#### 1. Sistema Unix-like de Permisos

```typescript
// src/constants/permissions.constant.ts
export type TPermission = {
	value: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
	read: boolean;
	write: boolean;
	execute: boolean;
	desc: string;
};
```

#### 2. Permisos por String

```typescript
// Ejemplos de permisos
const PERMISSIONS = [
	'view-company',
	'edit-company',
	'manage-users',
	'view-inventory',
	'manage-products',
	'super-admin',
];
```

#### 3. Roles del Sistema

```typescript
const ROLES = [
	'super-admin', // Acceso completo
	'company-admin', // Admin de empresa
	'subsidiary-admin', // Admin de subsidiaria
	'branch-admin', // Admin de sucursal
	'employee', // Empleado base
	'hr', // Recursos humanos
];
```

### Modos de Verificación

#### Modo OR (Por defecto)

```typescript
authority: ['view-products', 'manage-products']; // Al menos uno
requireAll: false; // Explícito
```

#### Modo AND

```typescript
authority: ['view-admin', 'manage-permissions']; // Ambos requeridos
requireAll: true;
```

#### Super Admin Override

```typescript
// Super admin siempre tiene acceso (excepto restricciones contextuales)
if (userAuthority.includes('super-admin')) {
	return true;
}
```

---

## Sistema de Navegación

### Componente AuthorityCheckNav

```tsx
type AuthorityGuardProps = PropsWithChildren<{
	userAuthority?: string[]; // Permisos del usuario
	authority?: string[]; // Permisos requeridos
	requireAll?: boolean; // Modo AND/OR
	companyId?: number; // Empresa específica
	subsidiaryId?: number; // Subsidiaria específica
	branchId?: number; // Sucursal específica
}>;

// Uso en navegación
<AuthorityCheckNav
	authority={['manage-users']}
	userAuthority={userPermissionsAndRoles}
	requireAll={false}>
	<NavItem text='Usuarios' to='/usuarios' />
</AuthorityCheckNav>;
```

### Componentes de Navegación

#### NavItem - Elemento Simple

```tsx
<NavItem
	text='Dashboard'
	to='/dashboard'
	icon='HeroChartBarSquare'
	id='dashboard'
	onClick={() => navigate('/dashboard')}
/>
```

#### NavCollapse - Menú Desplegable

```tsx
<NavCollapse text='Gestión' icon='HeroBuildingStorefront' to={''}>
	<NavItem text='Empresa' to='/gestion/empresa' />
	<NavItem text='Usuarios' to='/gestion/usuarios' />
</NavCollapse>
```

#### NavTitle - Título de Sección

```tsx
<NavTitle>Administración</NavTitle>
```

#### NavSeparator - Separador Visual

```tsx
<NavSeparator />
```

### Configuración de Navegación Completa

```tsx
// src/templates/layouts/Asides/DefaultAside.template.tsx
const DefaultAsideTemplate = () => {
	const userAuthority = useAppSelector((s) => s.auth.permisos);
	const user = useAppSelector((s) => s.auth.user);
	const navigate = useNavigate();

	// Array combinado para verificación
	const userPermissionsAndRoles = [
		...(userAuthority || []),
		...(user?.roles || []),
		...(user?.authority || []),
	];

	return (
		<Aside>
			<AsideHeadPart />
			<AsideBody>
				<Nav>
					{/* Dashboard */}
					<AuthorityCheckNav authority={Pages.dashboard.authority}>
						<NavItem {...Pages.dashboard} />
					</AuthorityCheckNav>

					{/* Gestión */}
					<NavTitle>Gestión</NavTitle>
					<NavCollapse text='Registro' icon='HeroDocumentText'>
						<AuthorityCheckNav authority={Pages.manage.subPages.company.authority}>
							<NavItem {...Pages.manage.subPages.company} />
						</AuthorityCheckNav>
					</NavCollapse>
				</Nav>
			</AsideBody>
		</Aside>
	);
};
```

---

## Componentes de Protección

### PermissionGuard

**Archivo**: `src/components/authorization/PermissionGuard.tsx`

```tsx
interface PermissionGuardProps extends PropsWithChildren {
	permissions?: string[]; // Permisos requeridos
	roles?: string[]; // Roles requeridos
	requireAll?: boolean; // Modo AND/OR
	companyId?: number; // Empresa específica
	subsidiaryId?: number; // Subsidiaria específica
	branchId?: number; // Sucursal específica
	fallback?: React.ReactNode; // Componente alternativo
	deniedMessage?: string; // Mensaje personalizado
}

// Uso en páginas
<PermissionGuard
	permissions={['view-products']}
	roles={['inventory-manager']}
	requireAll={false}
	fallback={<div>Sin acceso</div>}>
	<ProductsList />
</PermissionGuard>;
```

### AuthorityCheck

**Archivo**: `src/components/layouts/AuthorityCheck/AuthorityCheck.tsx`

```tsx
// Para redirecciones automáticas
<AuthorityCheck authority={['admin']}>
	<AdminPanel />
</AuthorityCheck>
// Redirige a /sin-permisos si no tiene acceso
```

### Verificaciones Contextuales

```tsx
// Función para verificar acceso por contexto empresarial
function checkContextualAccess(
	user: any,
	companyId?: number,
	subsidiaryId?: number,
	branchId?: number,
): boolean {
	// Super admin tiene acceso completo
	if (user.authority?.includes('super-admin')) {
		return true;
	}

	// Verificar empresa
	if (companyId && user.company?.id !== companyId) {
		return false;
	}

	// Verificar subsidiaria
	if (subsidiaryId && user.subsidiary?.id !== subsidiaryId) {
		return false;
	}

	// Verificar sucursal
	if (branchId && user.branch?.id !== branchId) {
		return false;
	}

	return true;
}
```

---

## Hooks de Autorización

### useAuthority Hook

**Archivo**: `src/hooks/useAuthority.ts`

```typescript
function useAuthority(
	userAuthority: string[] = [], // Permisos del usuario
	authority: string[] = [], // Permisos requeridos
	requireAll = false, // Modo AND/OR
	emptyCheck = true, // Verificar arrays vacíos
) {
	const roleMatched = useMemo(() => {
		// Super admin siempre pasa
		if (userAuthority.includes('super-admin')) {
			return true;
		}

		if (requireAll) {
			// Modo AND - todos requeridos
			return authority.every((role) => userAuthority.includes(role));
		} else {
			// Modo OR - al menos uno
			return authority.some((role) => userAuthority.includes(role));
		}
	}, [authority, userAuthority, requireAll]);

	// Manejar arrays vacíos
	if (isEmpty(authority) || isEmpty(userAuthority)) {
		return !emptyCheck;
	}

	return roleMatched;
}
```

### usePermissions Hook (Personalizado)

```tsx
// src/hooks/usePermissions.ts
import { useAppSelector } from '@/store';
import useAuthority from './useAuthority';

export const usePermissions = () => {
	const user = useAppSelector((state) => state.auth.user);
	const userAuthority = useAppSelector((state) => state.auth.permisos);

	const hasPermission = (permission: string): boolean => {
		return useAuthority(userAuthority, [permission], false);
	};

	const hasAllPermissions = (permissions: string[]): boolean => {
		return useAuthority(userAuthority, permissions, true);
	};

	const hasAnyPermission = (permissions: string[]): boolean => {
		return useAuthority(userAuthority, permissions, false);
	};

	const hasRole = (role: string): boolean => {
		return user?.roles?.includes(role) || userAuthority?.includes(role) || false;
	};

	const isSuperAdmin = (): boolean => {
		return hasRole('super-admin') || hasPermission('super-admin');
	};

	return {
		hasPermission,
		hasAllPermissions,
		hasAnyPermission,
		hasRole,
		isSuperAdmin,
		user,
		userAuthority,
	};
};
```

---

## Ejemplos Prácticos

### Ejemplo 1: Página de Inventario Completa

**1. Crear la página**

```tsx
// src/pages/inventario/InventarioPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import Container from '@/components/layouts/Container/Container';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import ProductsList from './components/ProductsList';
import CategoriesList from './components/CategoriesList';

const InventarioPage: React.FC = () => {
	const { t } = useTranslation();

	return (
		<Container>
			<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
				<PermissionGuard
					permissions={['view-products']}
					fallback={<div>No tienes acceso a productos</div>}>
					<ProductsList />
				</PermissionGuard>

				<PermissionGuard
					permissions={['view-categories']}
					roles={['super-admin', 'company-admin']}
					requireAll={false}>
					<CategoriesList />
				</PermissionGuard>
			</div>
		</Container>
	);
};

export default InventarioPage;
```

**2. Configurar en pages.config.ts**

```typescript
inventario: {
    id: 'inventario',
    to: '/inventario',
    text: 'Inventario',
    icon: 'HeroArchiveBox',
    authority: ['view-inventory'],
    roles: ['super-admin', 'company-admin', 'inventory-manager'],
    subPages: {
        dashboard: {
            id: 'inventario-dashboard',
            to: '/inventario',
            text: 'Dashboard Inventario',
            icon: 'HeroChartBarSquare',
            authority: ['view-inventory']
        },
        productos: {
            id: 'productos',
            to: '/inventario/productos',
            text: 'Productos',
            icon: 'HeroCube',
            authority: ['view-products', 'manage-products'],
            requireAll: false
        }
    }
}
```

**3. Agregar ruta**

```tsx
// src/routes/contentRoutes.tsx
const InventarioPage = lazy(() => import('@/pages/inventario/InventarioPage'));

{
    path: cfg.inventario.to,
    element: <InventarioPage />,
    authority: cfg.inventario.authority
}
```

**4. Agregar navegación**

```tsx
// src/templates/layouts/Asides/DefaultAside.template.tsx
<NavTitle>Inventario</NavTitle>

<AuthorityCheckNav
    authority={Pages.inventario.authority}
    userAuthority={userPermissionsAndRoles}
>
    <NavItem
        text={Pages.inventario.text}
        to={Pages.inventario.to}
        icon={Pages.inventario.icon}
        id={Pages.inventario.id}
        onClick={() => navigate(Pages.inventario.to)}
    />
</AuthorityCheckNav>

<NavCollapse text="Gestión de Inventario" icon="HeroArchiveBox" to={''}>
    <AuthorityCheckNav authority={Pages.inventario.subPages.productos.authority}>
        <NavItem {...Pages.inventario.subPages.productos} />
    </AuthorityCheckNav>
</NavCollapse>
```

### Ejemplo 2: Página con Restricciones de Empresa

```tsx
// Página que solo puede ver datos de su propia empresa
const MiEmpresaPage: React.FC = () => {
	const user = useAppSelector((state) => state.auth.user);

	return (
		<PermissionGuard
			permissions={['view-company']}
			companyId={user?.company?.id}
			fallback={<Navigate to='/sin-permisos' />}>
			<Container>
				<CompanyDetails companyId={user?.company?.id} />
			</Container>
		</PermissionGuard>
	);
};
```

### Ejemplo 3: Página con Múltiples Niveles de Permisos

```tsx
const UsuariosPage: React.FC = () => {
	const { hasPermission } = usePermissions();

	return (
		<Container>
			{/* Vista de usuarios - requiere view-users */}
			<PermissionGuard permissions={['view-users']}>
				<UsersList />
			</PermissionGuard>

			{/* Botones de acción - requieren manage-users */}
			<PermissionGuard permissions={['manage-users']}>
				<div className='mt-4 flex gap-2'>
					<Button>Crear Usuario</Button>
					<Button>Importar Usuarios</Button>
				</div>
			</PermissionGuard>

			{/* Panel de admin - requiere permisos específicos */}
			<PermissionGuard
				permissions={['manage-permissions', 'super-admin']}
				roles={['super-admin']}
				requireAll={false}>
				<AdminPanel />
			</PermissionGuard>
		</Container>
	);
};
```

---

## Best Practices

### 1. Nomenclatura Consistente

**Permisos**:

```typescript
// Patrón: [acción]-[recurso]
'view-products'; // Ver productos
'manage-products'; // Gestionar productos
'create-products'; // Crear productos
'edit-products'; // Editar productos
'delete-products'; // Eliminar productos
```

**Rutas**:

```typescript
// Patrón: /modulo/submodulo
'/inventario'; // Módulo principal
'/inventario/productos'; // Submódulo
'/inventario/productos/new'; // Acción específica
```

**IDs de Páginas**:

```typescript
// Patrón: modulo-submodulo-accion
'inventario-productos'; // Página principal
'inventario-productos-new'; // Crear producto
'inventario-productos-edit'; // Editar producto
```

### 2. Estructura de Archivos

```
src/pages/[modulo]/
├── [Modulo]Page.tsx           # Página principal
├── components/                # Componentes específicos
│   ├── tables/
│   ├── modals/
│   └── forms/
├── hooks/                     # Hooks personalizados
│   └── use[Modulo]Management.ts
├── utils/                     # Utilidades
│   └── [modulo].utils.ts
└── types/                     # Tipos específicos
    └── [modulo].types.ts
```

### 3. Configuración de Permisos

```typescript
// Agrupar permisos lógicamente
export const INVENTORY_PERMISSIONS = [
	// Productos
	'view-products',
	'manage-products',
	'create-products',
	'edit-products',
	'delete-products',

	// Categorías
	'view-categories',
	'manage-categories',

	// Reportes
	'view-inventory-reports',
	'export-inventory-reports',
];
```

### 4. Componentes Reutilizables

```tsx
// Crear componentes de protección reutilizables
export const InventoryGuard: React.FC<PropsWithChildren> = ({ children }) => (
	<PermissionGuard permissions={['view-inventory']}>{children}</PermissionGuard>
);

export const AdminGuard: React.FC<PropsWithChildren> = ({ children }) => (
	<PermissionGuard
		roles={['super-admin', 'company-admin']}
		fallback={<div>Solo administradores</div>}>
		{children}
	</PermissionGuard>
);
```

### 5. Lazy Loading

```tsx
// Siempre usar lazy loading para páginas
const InventarioPage = lazy(() => import('@/pages/inventario/InventarioPage'));
const ProductosPage = lazy(() => import('@/pages/inventario/ProductosPage'));

// Con loading fallback
const InventarioPage = lazy(() =>
	import('@/pages/inventario/InventarioPage').then((module) => ({
		default: module.default,
	})),
);
```

### 6. Internacionalización

```typescript
// Estructura de traducciones
{
    "pages": {
        "inventario": {
            "title": "Inventario",
            "productos": {
                "title": "Gestión de Productos",
                "create": "Crear Producto",
                "edit": "Editar Producto"
            }
        }
    }
}
```

---

## Troubleshooting

### Problema 1: La página no aparece en navegación

**Síntomas**: La página existe pero no se muestra en el menú lateral

**Soluciones**:

1. **Verificar permisos del usuario**:

    ```tsx
    // Debug en consola
    console.log('User authority:', userAuthority);
    console.log('Required authority:', Pages.miPagina.authority);
    ```

2. **Verificar configuración en DefaultAside.template.tsx**:

    ```tsx
    // Asegurar que existe el AuthorityCheckNav
    <AuthorityCheckNav authority={Pages.miPagina.authority}>
    	<NavItem {...Pages.miPagina} />
    </AuthorityCheckNav>
    ```

3. **Verificar pages.config.ts**:
    ```typescript
    // Verificar que la configuración existe y es correcta
    miPagina: {
        id: 'mi-pagina',
        to: '/mi-pagina',
        text: 'Mi Página',
        icon: 'HeroDocument',
        authority: ['view-my-page']
    }
    ```

### Problema 2: Error 404 en página existente

**Síntomas**: La página existe pero muestra 404

**Soluciones**:

1. **Verificar ruta en contentRoutes.tsx**:

    ```tsx
    // Asegurar que la ruta coincide exactamente
    {
        path: '/mi-pagina', // Debe coincidir con pages.config.ts
        element: <MiPagina />,
        authority: ['view-my-page']
    }
    ```

2. **Verificar importación**:
    ```tsx
    // Verificar que el import es correcto
    const MiPagina = lazy(() => import('@/pages/MiPagina'));
    ```

### Problema 3: Usuario con permisos no puede acceder

**Síntomas**: El usuario tiene los permisos pero no puede ver la página

**Soluciones**:

1. **Verificar modo de verificación**:

    ```typescript
    // Si requireAll: true, necesita TODOS los permisos
    authority: ['perm1', 'perm2'],
    requireAll: true // Necesita ambos

    // Si requireAll: false o undefined, necesita AL MENOS UNO
    authority: ['perm1', 'perm2'],
    requireAll: false // Necesita uno de los dos
    ```

2. **Verificar super-admin override**:
    ```tsx
    // Super admin debería tener acceso automático
    // Verificar que el sistema lo detecta correctamente
    if (userAuthority.includes('super-admin')) {
    	return true;
    }
    ```

### Problema 4: Página carga pero contenido no se muestra

**Síntomas**: La página carga pero el contenido específico no aparece

**Soluciones**:

1. **Verificar PermissionGuard dentro de la página**:

    ```tsx
    <PermissionGuard permissions={['view-content']} fallback={<div>Contenido no disponible</div>}>
    	<MiContenido />
    </PermissionGuard>
    ```

2. **Verificar estados de Redux**:

    ```tsx
    // Debug del estado
    const user = useAppSelector((s) => s.auth.user);
    const permisos = useAppSelector((s) => s.auth.permisos);

    console.log('User:', user);
    console.log('Permisos:', permisos);
    ```

### Problema 5: Navegación no responde a cambios de permisos

**Síntomas**: Los permisos cambian pero la navegación no se actualiza

**Soluciones**:

1. **Verificar actualización de Redux**:

    ```tsx
    // Asegurar que el estado se actualiza correctamente
    // Verificar en Redux DevTools
    ```

2. **Forzar re-render**:
    ```tsx
    // Usar keys para forzar actualización
    <Nav key={userAuthority.join('-')}>{/* Navegación */}</Nav>
    ```

### Herramientas de Debug

#### 1. Component de Debug de Permisos

```tsx
// src/components/debug/PermissionsDebug.tsx
export const PermissionsDebug: React.FC = () => {
	const user = useAppSelector((s) => s.auth.user);
	const permisos = useAppSelector((s) => s.auth.permisos);

	return (
		<div className='rounded bg-gray-100 p-4'>
			<h3>Debug de Permisos</h3>
			<div>Usuario: {user?.name}</div>
			<div>Roles: {user?.roles?.join(', ')}</div>
			<div>Permisos: {permisos?.join(', ')}</div>
			<div>Authority: {user?.authority?.join(', ')}</div>
		</div>
	);
};
```

#### 2. Hook de Debug

```tsx
// src/hooks/useDebugAuth.ts
export const useDebugAuth = () => {
	const user = useAppSelector((s) => s.auth.user);
	const permisos = useAppSelector((s) => s.auth.permisos);

	const debugPermission = (permission: string) => {
		console.log(`Checking permission: ${permission}`);
		console.log(`User has: ${permisos?.includes(permission)}`);
		console.log(`User authority:`, user?.authority);
		console.log(`User permissions:`, permisos);
	};

	return { debugPermission };
};
```

---

## Conclusión

Este flujo de creación de páginas proporciona:

1. **Estructura consistente** para todas las páginas del sistema
2. **Sistema de permisos granular** con verificación en múltiples niveles
3. **Navegación dinámica** que se adapta a los permisos del usuario
4. **Componentes reutilizables** para protección y autorización
5. **Escalabilidad** para agregar nuevos módulos fácilmente

Siguiendo este flujo, cualquier desarrollador puede agregar nuevas funcionalidades manteniendo la arquitectura y patrones establecidos en el sistema.

**Puntos Clave**:

-   Siempre configurar permisos en `pages.config.ts` ANTES de crear las rutas
-   Usar `AuthorityCheckNav` para navegación condicional
-   Implementar `PermissionGuard` dentro de páginas para contenido específico
-   Mantener nomenclatura consistente para permisos y rutas
-   Usar lazy loading para optimizar performance
-   Testear con diferentes roles y permisos durante desarrollo
