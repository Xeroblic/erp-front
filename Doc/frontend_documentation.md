# Frontend Documentation - Zentria ERP

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura y Bootstrapping](#arquitectura-y-bootstrapping)
3. [Ruteo y Navegación](#ruteo-y-navegación)
4. [Páginas Funcionales](#páginas-funcionales)
5. [Componentes Reutilizables](#componentes-reutilizables)
6. [Estado Global y Store](#estado-global-y-store)
7. [Servicios y API](#servicios-y-api)
8. [Autenticación y Autorización](#autenticación-y-autorización)
9. [Internacionalización](#internacionalización)
10. [Temas, Estilos y Personalización](#temas-estilos-y-personalización)
11. [Hooks y Utilidades](#hooks-y-utilidades)
12. [Tipos y Contratos](#tipos-y-contratos)
13. [Constantes y Configuración](#constantes-y-configuración)
14. [Manejo de Errores y Feedback](#manejo-de-errores-y-feedback)
15. [Testing](#testing)
16. [Estado por Módulo](#estado-por-módulo)

---

## Resumen Ejecutivo

### Stack Tecnológico

-   **Framework**: React 18.3.1 con TypeScript 5.4.5
-   **Bundler**: Vite 5.2.13 con SWC para compilación rápida
-   **Estado Global**: Redux Toolkit 2.8.1 con Redux Persist
-   **Routing**: React Router DOM 6.23.1
-   **UI Framework**: Tailwind CSS 3.4.4
-   **Formularios**: Formik 2.4.6 + Yup 1.4.0
-   **Tablas**: TanStack React Table 8.17.3
-   **Internacionalización**: i18next 23.11.5
-   **Testing**: Jest + React Testing Library

### Estado General

-   **Implementado**: Core de la aplicación, autenticación, gestión administrativa, dashboard dinámico, personalización
-   **En Desarrollo**: Módulos específicos de calendario, tickets, algunos componentes avanzados
-   **No Utilizado**: Algunos componentes legacy, funcionalidades experimentales comentadas

---

## Arquitectura y Bootstrapping

### Punto de Entrada Principal

**Archivo**: `src/index.tsx`

```typescript
// Proveedores globales anidados:
<Provider store={store}>
  <PersistGate loading={null} persistor={persistor}>
    <ThemeContextProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeContextProvider>
  </PersistGate>
</Provider>
```

### Inicialización de la Aplicación

**Archivo**: `src/App/App.tsx`

-   **AppInitializer**: Maneja la inicialización de autenticación y personalización
-   **ToastContainer**: Sistema de notificaciones globales
-   **RouterComponents**: AsideRouter, HeaderRouter, ContentRouter, FooterRouter
-   **Estilos dinámicos**: CSS variables para temas y font size

### Estructura de Carpetas

```
src/
├── App/                     # Componente principal de aplicación
├── assets/                  # Recursos estáticos (imágenes, iconos)
├── components/              # Componentes reutilizables
│   ├── authorization/       # Guards y protección de rutas
│   ├── debug/              # Componentes para debugging
│   ├── form/               # Componentes de formulario
│   ├── layouts/            # Componentes de layout
│   ├── router/             # Enrutadores especializados
│   ├── ui/                 # Componentes base de UI
│   └── utils/              # Utilidades de componentes
├── config/                 # Archivos de configuración
├── constants/              # Constantes de la aplicación
├── context/                # React Contexts
├── hooks/                  # Custom hooks
├── interface/              # Interfaces TypeScript
├── locales/                # Archivos de traducción
├── pages/                  # Páginas de la aplicación
├── routes/                 # Configuración de rutas
├── services/               # Servicios API y cliente HTTP
├── store/                  # Estado global Redux
├── styles/                 # Estilos globales
├── templates/              # Templates de layout y componentes
├── types/                  # Definiciones de tipos
└── utils/                  # Funciones utilitarias
```

---

## Ruteo y Navegación

### Configuración de Rutas

**Archivo**: `src/routes/contentRoutes.tsx`

#### Rutas Públicas

| Path                                        | Componente           | Descripción                      |
| ------------------------------------------- | -------------------- | -------------------------------- |
| `/login`                                    | `LoginPage`          | Página de autenticación          |
| `/recuperar-password`                       | `RecuperarPassword`  | Recuperación de contraseña       |
| `/recuperar-password/confirmar/:uid/:token` | `ConfirmarNuevaPass` | Confirmación de nueva contraseña |
| `/sin-permisos`                             | `SinPermisos`        | Página de acceso denegado        |
| `*`                                         | `NotFoundPage`       | Página 404                       |

#### Rutas Protegidas

| Path                      | Componente         | Autoridad Requerida                      | Estado       |
| ------------------------- | ------------------ | ---------------------------------------- | ------------ |
| `/dashboard`              | `Dashboard`        | `[]`                                     | Implementado |
| `/profile`                | `ProfilePage`      | `[]`                                     | Implementado |
| `/gestion/empresa`        | `EmpresaPage`      | `['view-company', 'edit-company']`       | Implementado |
| `/gestion/subempresa`     | `SubEmpresa`       | `['view-subsidiary', 'edit-subsidiary']` | Implementado |
| `/gestion/sucursal`       | `Sucursales`       | `['view-branch', 'edit-branch']`         | Placeholder  |
| `/gestion/roles-permisos` | `RolesPermisos`    | `['edit-roles']`                         | Implementado |
| `/gestion/usuarios`       | `GestionUsuarios`  | `['view-users', 'manage-users']`         | Implementado |
| `/admin/permisos`         | `PermissionsAdmin` | `['manage-permissions']`                 | Implementado |
| `/admin/invitaciones`     | `InvitationsAdmin` | `['manage-invitations']`                 | Implementado |

### Configuración de Páginas

**Archivo**: `src/config/pages.config.ts`

-   Define autoridades, roles y permisos por página
-   Estructura jerárquica para submódulos
-   Configuración de iconos y textos para navegación

### Sistema de Navegación

**Componentes de Router**:

-   `AsideRouter`: Navegación lateral
-   `HeaderRouter`: Navegación superior
-   `ContentRouter`: Contenido principal
-   `FooterRouter`: Pie de página

---

## Páginas Funcionales

### Autenticación

#### 1. Login (`src/pages/Login.page.tsx`)

-   **Estado**: Implementado
-   **Funcionalidades**:
    -   Validación con Yup (email, password mínimo 8 caracteres)
    -   Integración Redux (`loginThunk`)
    -   Soporte Enter key
    -   Redirección automática post-login
-   **Dependencias**: Formik, Yup, Redux Toolkit
-   **API**: `/auth/login`

#### 2. Recuperar Contraseña (`src/pages/ResetPassword/RecuperarPassword.tsx`)

-   **Estado**: Implementado
-   **Funcionalidades**: Envío de email de recuperación
-   **Dependencias**: Axios directo
-   **API**: `/auth/users/reset_password/`

#### 3. Confirmar Nueva Contraseña (`src/pages/ResetPassword/ConfirmarNuevaPass.tsx`)

-   **Estado**: Implementado
-   **Funcionalidades**: Confirmación con tokens de URL
-   **Dependencias**: React Router (useParams)

### Dashboard

#### 4. Dashboard Principal (`src/pages/dashboards/DashboardContainer.tsx`)

-   **Estado**: Implementado
-   **Funcionalidades**:
    -   Sistema multi-dashboard (5 variantes: Falabella, Ripley, Paris, EcoPC, EcoTI)
    -   Selector dinámico con persistencia en localStorage
    -   Variables CSS dinámicas por tema
    -   Configuración de colores específicos por empresa
-   **Componentes**:
    -   `FalabellaDashboard`
    -   `RipleyDashboard`
    -   `ParisDashboard`
    -   `EcoPCDashboard`
    -   `EcoTIDashboard`
-   **Dependencias**: Configuración en `src/pages/dashboards/types.ts`

### Gestión Administrativa

#### 5. Gestión de Empresa (`src/pages/gestionAdmin/empresa/Empresa.tsx`)

-   **Estado**: Implementado
-   **Funcionalidades**:
    -   Sistema de tabs (General, Contacto, Subsidiarias)
    -   CRUD completo para datos de empresa
    -   Gestión de subsidiarias integrada
    -   Validación con Formik + Yup
-   **Componentes relacionados**:
    -   `SubsidiariesTable`
    -   `SubsidiaryModal`
-   **Redux**: `empresaSlice` - `fetchMiEmpresa`, `updateMiEmpresa`, `fetchMiEmpresaSubsidiarias`
-   **APIs**: `/my-company`, `/my-company/subsidiaries`

#### 6. Gestión de Subsidiarias (`src/pages/gestionAdmin/subempresa/SubEmpresa.tsx`)

-   **Estado**: Implementado
-   **Funcionalidades**:
    -   Tabla con TanStack Table (sorting, filtros, paginación)
    -   CRUD completo con modales
    -   Búsqueda global en tiempo real
-   **Redux**: `subEmpresaSlice` - `fetchMisSubsidiarias`, `createSubsidiaria`, `deleteSubsidiaria`
-   **APIs**: `/my-company/subsidiaries/*`

#### 7. Gestión de Usuarios (`src/pages/gestionAdmin/usuarios/Usuarios.tsx`)

-   **Estado**: Implementado
-   **Funcionalidades**:
    -   Vista diferenciada por roles (Super Admin ve todos, Company Admin ve su empresa)
    -   Tabla interactiva con filtros
    -   Información de empresa, roles y estado
-   **APIs**: `/admin/users`, `/my-company/users`

#### 8. Roles y Permisos (`src/pages/gestionAdmin/roles y permisos/RolesPermisos.tsx`)

-   **Estado**: Implementado
-   **Funcionalidades**:
    -   Modal de edición con multi-selección
    -   Asignación de roles y permisos granulares
    -   Validación con Yup
-   **Redux**: `rolesPermisosSlice`
-   **Componentes**: SelectReact para multi-selección

#### 9. Sucursales (`src/pages/gestionAdmin/sucursales/Sucursales.tsx`)

-   **Estado**: Placeholder (solo renderiza `<div>Sucursales</div>`)

### Perfil

#### 10. Perfil de Usuario (`src/pages/Perfil.tsx`)

-   **Estado**: Implementado
-   **Funcionalidades**:
    -   Sistema de tabs (Editar Perfil, Contacto)
    -   Upload de avatar
    -   Integración con personalización de temas
    -   Validación completa
-   **Redux**: Integración con `authSlice` y `personalizacionSlice`
-   **API**: `/user/me`, `/user/personalization`

### Administración Avanzada

#### 11. Administración de Permisos (`src/pages/admin/PermissionsAdmin.tsx`)

-   **Estado**: Implementado
-   **Funcionalidades**:
    -   Hook personalizado `usePermissionsManagement`
    -   Gestión granular de permisos por usuario
    -   Tabla avanzada con filtros
    -   Componentes modulares separados
-   **Componentes**:
    -   `src/pages/admin/components/modals/PermissionsModal.tsx`
    -   `src/pages/admin/components/tables/UserTableColumns.tsx`
-   **Hooks**: `src/pages/admin/hooks/usePermissionsManagement.ts`
-   **Utils**: `src/pages/admin/utils/formatters.ts`

#### 12. Gestión de Invitaciones (`src/pages/invitations/InvitationsAdmin.tsx`)

-   **Estado**: Implementado
-   **Funcionalidades**:
    -   Hook personalizado `useInvitationsManagement`
    -   CRUD completo de invitaciones
    -   Modales especializados
    -   Filtros por estado y fechas
-   **Componentes**:
    -   `src/pages/invitations/components/tables/InvitationsTable.tsx`
    -   `src/pages/invitations/components/modals/CreateInvitationModal.tsx`
    -   `src/pages/invitations/components/modals/InvitationDetailsModal.tsx`
    -   `src/pages/invitations/components/modals/ResendInvitationModal.tsx`
    -   `src/pages/invitations/components/modals/DeleteConfirmationModal.tsx`

### Módulos en Desarrollo

#### Calendario (`src/pages/Calendario/`)

-   **Estado**: En desarrollo
-   **Archivos**:
    -   `DetalleSolicitudVacaciones.tsx`
    -   `ListaSolicitudesVacaciones.tsx`
    -   `PedirVacaciones.tsx`
    -   Modales de aprobación y firma
    -   Componente de PDF para solicitudes

#### Tickets (`src/pages/tickets/`)

-   **Estado**: En desarrollo
-   **Archivos**: `Administracion.tsx`

#### RRHH (`src/pages/rrhh/`)

-   **Estado**: Estructura creada, contenido pendiente

---

## Componentes Reutilizables

### Componentes UI Base (`src/components/ui/`)

| Componente        | Descripción              | Props Principales                                   | Estado       |
| ----------------- | ------------------------ | --------------------------------------------------- | ------------ |
| `Alert.tsx`       | Alertas y notificaciones | `variant`, `children`                               | Implementado |
| `Badge.tsx`       | Etiquetas y estados      | `variant`, `color`, `size`                          | Implementado |
| `Button.tsx`      | Botones base             | `variant`, `size`, `icon`, `isDisable`, `isLoading` | Implementado |
| `ButtonGroup.tsx` | Grupos de botones        | `children`                                          | Implementado |
| `Card.tsx`        | Tarjetas contenedoras    | `CardHeader`, `CardBody`, `CardFooter`              | Implementado |
| `CloseButton.tsx` | Botón de cierre          | `onClick`                                           | Implementado |
| `Dropdown.tsx`    | Menús desplegables       | `children`, `placement`                             | Implementado |
| `Modal.tsx`       | Modales y diálogos       | `isOpen`, `setIsOpen`, subcomponentes               | Implementado |
| `OffCanvas.tsx`   | Panel lateral deslizable | `isOpen`, `setIsOpen`, `placement`                  | Implementado |
| `Progress.tsx`    | Barras de progreso       | `value`, `max`, `color`                             | Implementado |
| `Table.tsx`       | Tablas base              | `THead`, `TBody`, `Tr`, `Th`, `Td`                  | Implementado |
| `Tooltip.tsx`     | Tooltips informativos    | `text`, `placement`                                 | Implementado |

### Componentes de Formulario (`src/components/form/`)

| Componente        | Descripción              | Integración                | Estado       |
| ----------------- | ------------------------ | -------------------------- | ------------ |
| `Checkbox.tsx`    | Casillas de verificación | Formik compatible          | Implementado |
| `FieldWrap.tsx`   | Wrapper para campos      | Layout y spacing           | Implementado |
| `Input.tsx`       | Campos de entrada        | Formik, validación         | Implementado |
| `Label.tsx`       | Etiquetas de campos      | Asociación semántica       | Implementado |
| `Radio.tsx`       | Botones de radio         | Formik, grupos             | Implementado |
| `Select.tsx`      | Selectores nativos       | Formik compatible          | Implementado |
| `SelectReact.tsx` | Select avanzado          | React-Select, multi-select | Implementado |
| `Textarea.tsx`    | Áreas de texto           | Formik compatible          | Implementado |
| `Validation.tsx`  | Mensajes de validación   | Formik + Yup integration   | Implementado |

### Componentes de Layout (`src/components/layouts/`)

**Estructura**:

-   `Container/`: Contenedores responsive
-   `Footer/`: Componentes de pie de página
-   `Header/`: Componentes de encabezado
-   `PageWrapper/`: Wrapper principal de páginas
-   `Subheader/`: Subencabezados de sección
-   `Wrapper/`: Contenedor principal de aplicación

### Componentes de Navegación (`src/components/navigation/`)

-   Componentes de navegación breadcrumb y menús contextuales

### Componentes de Router (`src/components/router/`)

| Componente          | Responsabilidad          | Estado       |
| ------------------- | ------------------------ | ------------ |
| `AsideRouter.tsx`   | Navegación lateral       | Implementado |
| `ContentRouter.tsx` | Contenido principal      | Implementado |
| `FooterRouter.tsx`  | Pie de página contextual | Implementado |
| `HeaderRouter.tsx`  | Encabezado contextual    | Implementado |

### Componentes de Autorización (`src/components/authorization/`)

-   Guards de permisos y roles
-   Componentes de protección de rutas

### Componentes de Debug (`src/components/debug/`)

-   **Estado**: Implementado (comentados en producción)
-   `AuthDebug.tsx`: Debug de autenticación
-   `PersonalizacionDebug.tsx`: Debug de personalización
-   `UserDataSimulator.tsx`: Simulador de datos

### Componentes Especializados

| Componente             | Descripción                      | Dependencias                 | Estado       |
| ---------------------- | -------------------------------- | ---------------------------- | ------------ |
| `Avatar.tsx`           | Avatares de usuario              | Imágenes, fallbacks          | Implementado |
| `Balance.tsx`          | Componente de balance financiero | ApexCharts                   | Implementado |
| `Calendar.tsx`         | Calendario interactivo           | FullCalendar                 | Implementado |
| `Chart.tsx`            | Gráficos                         | ApexCharts, React-ApexCharts | Implementado |
| `ColorSelector.tsx`    | Selector de colores tema         | Tailwind colors              | Implementado |
| `MdViewer.tsx`         | Visor de Markdown                | React-Markdown               | Implementado |
| `RichText.tsx`         | Editor de texto enriquecido      | Slate.js                     | Implementado |
| `Timeline.tsx`         | Línea de tiempo                  | Custom                       | Implementado |
| `WaveSurferPlayer.tsx` | Reproductor de audio             | WaveSurfer.js                | Implementado |

---

## Estado Global y Store

### Tecnología y Configuración

**Framework**: Redux Toolkit 2.8.1
**Persistencia**: Redux Persist con localStorage
**Estructura**: `src/store/`

```typescript
// store/storeSetup.ts
const persistConfig = {
	key: 'core_ert',
	keyPrefix: '',
	storage,
	whitelist: ['auth', 'core'],
};
```

### Slices Implementados

| Slice                  | Archivo                                                | Responsabilidad            | Estado            | APIs                                       |
| ---------------------- | ------------------------------------------------------ | -------------------------- | ----------------- | ------------------------------------------ |
| `authSlice`            | `store/slices/auth/authSlice.ts`                       | Autenticación y usuario    | Implementado      | `/auth/login`, `/auth/refresh`, `/user/me` |
| `personalizacionSlice` | `store/slices/personalizacion/personalizacionSlice.ts` | Temas y personalización    | Implementado      | `/user/personalization`                    |
| `empresaSlice`         | `store/slices/empresa/empresaSlice.ts`                 | Gestión de empresas        | Implementado      | `/my-company/*`                            |
| `subEmpresaSlice`      | `store/slices/subempresa/subEmpresaSlice.ts`           | Gestión de subsidiarias    | Implementado      | `/my-company/subsidiaries/*`               |
| `rolesPermisosSlice`   | `store/slices/rolesPermisos/rolesPermisosSlice.ts`     | Roles y permisos           | Implementado      | `/admin/users/*/roles`                     |
| `usersAdminSlice`      | `store/slices/usersAdmin/usersAdminSlice.ts`           | Administración usuarios    | Implementado      | `/admin/users/*`                           |
| `invitationSlice`      | `store/slices/invitations/invitationsSlice.ts`         | Gestión invitaciones       | Implementado      | `/admin/invitations/*`                     |
| `calendarioSlice`      | `store/slices/calendario/calendarioSlice.ts`           | Sistema de calendario      | En desarrollo     | `/calendar/*`                              |
| `clientesSlice`        | `store/slices/clientes/clientesSlice.ts`               | Gestión de clientes        | Estructura creada | `/clients/*`                               |
| `itemSlice`            | `store/slices/item/itemSlice.ts`                       | Gestión de productos/items | Estructura creada | `/items/*`                                 |

### Selectors Principales

**Archivo**: `src/store/selectors.ts`

-   Selectores memoizados para optimización
-   Combinación de datos de múltiples slices

### Hooks de Redux

**Archivo**: `src/store/hook.ts`

```typescript
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Inicialización Dinámica

**Archivo**: `src/store/initializePersonalizacion.ts`

-   Inicialización automática del slice de personalización
-   Carga de configuración desde localStorage

---

## Servicios y API

### Arquitectura de Servicios

**BaseService** (`src/services/BaseService.ts`):

-   Cliente Axios configurado
-   Interceptors de request/response
-   Manejo automático de tokens JWT
-   Sistema de refresh automático
-   Control de cancelación de requests

**ApiService** (`src/services/ApiService.ts`):

-   Wrapper sobre BaseService
-   Métodos `fetchData` y `fetchNormalized`
-   Manejo de errores centralizado

### Servicios Especializados

| Servicio               | Archivo                            | Responsabilidad          | Estado       |
| ---------------------- | ---------------------------------- | ------------------------ | ------------ |
| `BaseService`          | `services/BaseService.ts`          | Cliente HTTP base        | Implementado |
| `ApiService`           | `services/ApiService.ts`           | API wrapper principal    | Implementado |
| `RtkQueryService`      | `services/RtkQueryService.ts`      | RTK Query setup          | Implementado |
| `falabellaApi.service` | `services/falabellaApi.service.ts` | API específica Falabella | Implementado |
| `ApiMigrationService`  | `services/ApiMigrationService.ts`  | Migración de APIs        | No utilizado |

### Configuración de API

**Archivo**: `src/config/api.ts`

-   Endpoints base y configuración
-   Variables de entorno

**Variables de Entorno**:

-   `VITE_API_URL`: URL base de la API backend

### Mapeo de Endpoints

#### Autenticación

-   `POST /auth/login`: Login de usuario
-   `POST /auth/refresh`: Refresh de token
-   `GET /user/me`: Datos del usuario actual
-   `PUT /user/personalization`: Personalización del usuario

#### Gestión Empresarial

-   `GET /my-company`: Datos de la empresa del usuario
-   `PUT /my-company`: Actualizar empresa
-   `GET /my-company/subsidiaries`: Subsidiarias de la empresa
-   `POST /my-company/subsidiaries`: Crear subsidiaria
-   `PUT /my-company/subsidiaries/{id}`: Actualizar subsidiaria
-   `GET /my-company/users`: Usuarios de la empresa

#### Administración

-   `GET /admin/users`: Todos los usuarios (super admin)
-   `PUT /admin/users/{id}/permissions`: Actualizar permisos
-   `GET /admin/permissions`: Lista de permisos disponibles
-   `GET /admin/roles`: Lista de roles disponibles
-   `GET /admin/invitations`: Gestión de invitaciones
-   `POST /admin/invitations`: Crear invitación

### Manejo de Errores

**Interceptor de Response**:

```typescript
// Auto-refresh de tokens expirados
// Manejo de errores 401/403
// Redirección automática en casos críticos
// Toast notifications para errores de usuario
```

---

## Autenticación y Autorización

### Flujo de Autenticación

1. **Login**: `loginThunk` en `authSlice`
2. **Persistencia**: Tokens almacenados en Redux + localStorage
3. **Auto-refresh**: Interceptor en `BaseService`
4. **Logout**: Limpieza completa de estado y storage

### Manejo de Tokens

**Archivo**: `src/store/slices/auth/authSlice.ts`

```typescript
interface AuthState {
	access: string | undefined;
	refresh: string | undefined;
	isAuthenticated: boolean;
	user: IUserMe | undefined;
	permisos: string[];
}
```

### Control de Permisos

**Componentes de Protección**:

-   `PermissionGuard`: Protección por permisos específicos
-   `AuthorityCheckNav`: Verificación de autoridad para navegación
-   Guards en `src/components/authorization/`

**Configuración de Permisos**:

-   `src/constants/permissions.constant.ts`: Definición de permisos
-   `src/constants/roles.ts`: Roles del sistema
-   `src/config/pages.config.ts`: Permisos requeridos por página

### Roles del Sistema

| Rol                | Descripción                  | Permisos Principales                |
| ------------------ | ---------------------------- | ----------------------------------- |
| `super-admin`      | Administrador global         | Todos los permisos                  |
| `company-admin`    | Administrador de empresa     | Gestión de empresa y subsidiarias   |
| `subsidiary-admin` | Administrador de subsidiaria | Gestión de subsidiaria específica   |
| `branch-admin`     | Administrador de sucursal    | Gestión de sucursal específica      |
| `employee`         | Empleado base                | Permisos básicos                    |
| `hr`               | Recursos humanos             | Gestión de invitaciones y empleados |

### Rutas Protegidas

**Implementación**: Higher-Order Components y guards
**Redirecciones**:

-   No autenticado → `/login`
-   Sin permisos → `/sin-permisos`
-   Error → `/404`

---

## Internacionalización

### Configuración

**Archivo**: `src/i18n.ts`
**Framework**: i18next 23.11.5 + react-i18next 14.1.2

### Idiomas Disponibles

| Idioma  | Código | Archivos                                              |
| ------- | ------ | ----------------------------------------------------- |
| Inglés  | `en`   | `locales/en/translation.json`, `locales/en/menu.json` |
| Español | `es`   | `locales/es/translation.json`, `locales/es/menu.json` |
| Árabe   | `ar`   | `locales/ar/translation.json`, `locales/ar/menu.json` |

### Estructura de Namespaces

-   `translation`: Textos generales de la aplicación
-   `menu`: Textos específicos de menús y navegación

### Configuración de Fecha/Hora

**Integración con DayJS**:

```typescript
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import 'dayjs/locale/ar';
```

### Uso en Componentes

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
const { t: tMenu } = useTranslation('menu');
```

---

## Temas, Estilos y Personalización

### Framework de Estilos

**Tailwind CSS 3.4.4**:

-   Configuración personalizada
-   Variables CSS dinámicas
-   Dark mode nativo
-   Responsive design

### Sistema de Personalización

**Archivo**: `src/store/slices/personalizacion/personalizacionSlice.ts`

#### Opciones Disponibles

| Aspecto              | Opciones                                    | Persistencia           |
| -------------------- | ------------------------------------------- | ---------------------- |
| **Colores del tema** | 9 colores (emerald, blue, amber, red, etc.) | localStorage + Backend |
| **Modo oscuro**      | Light, Dark, System                         | localStorage + Backend |
| **Tamaño de fuente** | 12px - 18px                                 | localStorage + Backend |
| **Idioma**           | en, es, ar                                  | localStorage + Backend |

#### Aplicación de Temas

**Context**: `src/context/themeContext.tsx`

```typescript
// CSS Variables dinámicas
root.style.setProperty('--color-primary-500', colorValue);
root.style.setProperty('--font-size-base', `${fontSize}px`);
```

### Configuración de Tema

**Archivo**: `src/config/theme.config.ts`

-   Valores por defecto
-   Configuración dinámica desde personalización
-   Funciones de utilidad

### Hooks de Tema

| Hook                     | Responsabilidad        | Estado       |
| ------------------------ | ---------------------- | ------------ |
| `useDarkMode`            | Manejo de modo oscuro  | Implementado |
| `useThemeColor`          | Colores del tema       | Implementado |
| `useFontSize`            | Tamaño de fuente       | Implementado |
| `useReactiveThemeConfig` | Configuración reactiva | Implementado |

---

## Hooks y Utilidades

### Custom Hooks Implementados

| Hook                     | Archivo                           | Responsabilidad                | Estado       |
| ------------------------ | --------------------------------- | ------------------------------ | ------------ |
| `useAppSelector`         | `store/hook.ts`                   | Redux selector tipado          | Implementado |
| `useAppDispatch`         | `store/hook.ts`                   | Redux dispatch tipado          | Implementado |
| `useAuthority`           | `hooks/useAuthority.ts`           | Verificación de permisos       | Implementado |
| `useCompanyManager`      | `hooks/useCompanyManager.ts`      | Gestión de empresa actual      | Implementado |
| `useDarkMode`            | `hooks/useDarkMode.ts`            | Modo oscuro                    | Implementado |
| `useDeviceScreen`        | `hooks/useDeviceScreen.ts`        | Detección de pantalla          | Implementado |
| `useFeatures`            | `hooks/useFeatures.ts`            | Feature flags                  | Implementado |
| `useFontSize`            | `hooks/useFontSize.ts`            | Tamaño de fuente               | Implementado |
| `useLocalStorage`        | `hooks/useLocalStorage.ts`        | Persistencia local             | Implementado |
| `usePermissions`         | `hooks/usePermissions.ts`         | Sistema de permisos            | Implementado |
| `useReactiveThemeConfig` | `hooks/useReactiveThemeConfig.ts` | Configuración reactiva de tema | Implementado |
| `useSaveBtn`             | `hooks/useSaveBtn.ts`             | Estados de botones de guardar  | Implementado |
| `useThemeColor`          | `hooks/useThemeColor.ts`          | Colores de tema                | Implementado |

### Hooks en Desarrollo

| Hook                            | Estado        | Observaciones                       |
| ------------------------------- | ------------- | ----------------------------------- |
| `useFalabellaData`              | En desarrollo | Específico para dashboard Falabella |
| `usePersonalizacionInitializer` | En desarrollo | Inicialización de personalización   |
| `useGlobalThemeSync`            | En desarrollo | Sincronización global de temas      |

### Hooks No Utilizados

| Hook                    | Archivo                          | Razón                                   |
| ----------------------- | -------------------------------- | --------------------------------------- |
| `useAuthErrorHandler`   | `hooks/useAuthErrorHandler.ts`   | Funcionalidad integrada en interceptors |
| `useAuthInitialization` | `hooks/useAuthInitialization.ts` | Reemplazado por AppInitializer          |
| `useDynamicThemeConfig` | `hooks/useDynamicThemeConfig.ts` | Reemplazado por useReactiveThemeConfig  |

### Utilidades (`src/utils/`)

**Funciones implementadas**:

-   `getOS.util.ts`: Detección del sistema operativo
-   Formateadores de fecha y número
-   Validadores personalizados
-   Helpers de conversion

---

## Tipos y Contratos

### Interfaces Principales (`src/interface/`)

| Interface                 | Archivo                   | Propósito                   | Estado       |
| ------------------------- | ------------------------- | --------------------------- | ------------ |
| `IUserMe`                 | `user.interface.ts`       | Usuario autenticado         | Implementado |
| `IEmpresa`                | `empresas.interface.ts`   | Datos de empresa            | Implementado |
| `ISubempresa`             | `empresas.interface.ts`   | Datos de subsidiaria        | Implementado |
| `IPersonalizacionUsuario` | -                         | Personalización del usuario | Implementado |
| `IFeature`                | `feature.interface.ts`    | Feature flags               | Implementado |
| `IPermission`             | -                         | Permisos del sistema        | Implementado |
| `IInvitation`             | `invitacion.interface.ts` | Invitaciones                | Implementado |

### Tipos Base (`src/types/`)

| Tipo              | Archivo                    | Descripción                     | Uso             |
| ----------------- | -------------------------- | ------------------------------- | --------------- |
| `TColors`         | `colors.type.ts`           | Colores disponibles del tema    | Personalización |
| `TColorIntensity` | `colorIntensities.type.ts` | Intensidades de color (300-900) | Temas           |
| `TDarkMode`       | `darkMode.type.ts`         | Modos: light, dark, system      | Temas           |
| `TLang`           | `lang.type.ts`             | Idiomas: en, es, ar             | i18n            |
| `TIcons`          | `icons.type.ts`            | Iconos disponibles              | UI              |
| `TFontSizes`      | `fontSizes.type.ts`        | Tamaños de fuente               | Personalización |

### Tipos de Componentes

**Definiciones comunes**:

-   Props interfaces para componentes reutilizables
-   Event handlers tipados
-   Ref types para componentes avanzados

---

## Constantes y Configuración

### Constantes Principales (`src/constants/`)

| Archivo                   | Constantes           | Propósito                           |
| ------------------------- | -------------------- | ----------------------------------- |
| `app.constant.ts`         | `PERSIST_STORE_NAME` | Nombre de persistencia Redux        |
| `darkMode.constant.ts`    | `DARK_MODE`          | Modos de tema disponibles           |
| `permissions.constant.ts` | `PERMISSION`         | Definiciones de permisos Unix-style |
| `roles.ts`                | Roles del sistema    | Definición de roles de usuario      |
| `themeColor.constant.ts`  | `THEME_COLOR`        | Colores de tema disponibles         |
| `lang.constant.ts`        | `LANG`               | Configuración de idiomas            |

### Configuración (`src/config/`)

| Archivo              | Propósito                           | Estado       |
| -------------------- | ----------------------------------- | ------------ |
| `theme.config.ts`    | Configuración base de temas         | Implementado |
| `pages.config.ts`    | Configuración de páginas y permisos | Implementado |
| `api.ts`             | Configuración de endpoints          | Implementado |
| `apiVerification.ts` | Verificación de API                 | No utilizado |

### Variables de Entorno

**Prefijo**: `VITE_`

-   `VITE_API_URL`: URL base de la API backend

---

## Manejo de Errores y Feedback

### Sistema de Notificaciones

**Framework**: React-Toastify 10.0.5
**Configuración**: Global en `App.tsx`

```typescript
<ToastContainer theme={isDarkTheme ? 'dark' : 'light'} draggable />
```

### Tipos de Feedback

| Tipo                   | Uso                       | Implementación               |
| ---------------------- | ------------------------- | ---------------------------- |
| **Toast Success**      | Operaciones exitosas      | `toast.success()`            |
| **Toast Error**        | Errores de API/validación | `toast.error()`              |
| **Toast Warning**      | Advertencias              | `toast.warning()`            |
| **Modal Confirmación** | Acciones destructivas     | Componente `Modal`           |
| **Loading States**     | Estados de carga          | Props `isLoading` en botones |

### Páginas de Error

| Página       | Ruta            | Archivo             | Estado       |
| ------------ | --------------- | ------------------- | ------------ |
| 404          | `*`             | `NotFound.page.tsx` | Implementado |
| Sin Permisos | `/sin-permisos` | `SinPermisos.tsx`   | Implementado |

### Manejo de Errores de API

**Interceptor en BaseService**:

-   Errores 401: Auto-refresh de token
-   Errores 403: Redirección a sin permisos
-   Errores de red: Toast con mensaje descriptivo
-   Timeout: Manejo automático con reintentos

---

## Testing

### Framework de Testing

**Setup**: Jest + React Testing Library
**Archivo**: `src/setupTests.ts`

```typescript
import '@testing-library/jest-dom';
```

### Configuración

**Dependencias**:

-   `@testing-library/jest-dom: ^6.4.5`
-   `@testing-library/react: ^16.0.0`
-   `@testing-library/user-event: ^14.5.2`

### Estado Actual

**Implementado**:

-   Configuración base de testing
-   Setup para testing de componentes React

**En Desarrollo**:

-   Tests unitarios de componentes
-   Tests de integración
-   Tests de hooks personalizados

**No Utilizado**:

-   Tests end-to-end
-   Tests de performance

---

## Estado por Módulo

### Tabla Consolidada de Estado

| Módulo/Archivo            | Descripción                    | Depende de                              | Estado            | Observaciones                   |
| ------------------------- | ------------------------------ | --------------------------------------- | ----------------- | ------------------------------- |
| **Páginas**               |                                |                                         |                   |                                 |
| `Login.page.tsx`          | Autenticación de usuarios      | Formik, Yup, Redux                      | Implementado      | Funcional completo              |
| `Dashboard`               | Dashboard multi-empresa        | Redux, componentes especializados       | Implementado      | 5 variantes funcionales         |
| `Empresa.tsx`             | Gestión de empresa principal   | Redux (empresaSlice), Formik            | Implementado      | CRUD completo con subsidiarias  |
| `SubEmpresa.tsx`          | Gestión de subsidiarias        | Redux (subEmpresaSlice), TanStack Table | Implementado      | CRUD completo                   |
| `Usuarios.tsx`            | Gestión de usuarios            | ApiService directo                      | Implementado      | Vista diferenciada por roles    |
| `RolesPermisos.tsx`       | Asignación roles/permisos      | Redux (rolesPermisosSlice)              | Implementado      | Sistema granular                |
| `PermissionsAdmin.tsx`    | Admin avanzado permisos        | Hook personalizado                      | Implementado      | Modular y escalable             |
| `InvitationsAdmin.tsx`    | Gestión invitaciones           | Hook personalizado                      | Implementado      | CRUD completo                   |
| `Perfil.tsx`              | Perfil de usuario              | Redux (auth, personalización)           | Implementado      | Sistema de tabs                 |
| `Sucursales.tsx`          | Gestión de sucursales          | -                                       | Placeholder       | Solo estructura básica          |
| **Store**                 |                                |                                         |                   |                                 |
| `authSlice`               | Autenticación y usuario        | BaseService, JWT                        | Implementado      | Auto-refresh, persistencia      |
| `personalizacionSlice`    | Temas y personalización        | localStorage, API                       | Implementado      | Sincronización bidireccional    |
| `empresaSlice`            | Gestión empresarial            | ApiService                              | Implementado      | Sistema dinámico sin hardcoding |
| `subEmpresaSlice`         | Gestión subsidiarias           | ApiService                              | Implementado      | CRUD completo                   |
| `rolesPermisosSlice`      | Roles y permisos               | ApiService                              | Implementado      | Asignación granular             |
| `usersAdminSlice`         | Admin de usuarios              | ApiService                              | Implementado      | Gestión avanzada                |
| `invitationsSlice`        | Invitaciones                   | ApiService                              | Implementado      | Estados y filtros               |
| `calendarioSlice`         | Sistema calendario             | -                                       | En desarrollo     | Estructura creada               |
| `clientesSlice`           | Gestión clientes               | -                                       | Estructura creada | No implementado                 |
| `itemSlice`               | Gestión productos              | -                                       | Estructura creada | No implementado                 |
| **Servicios**             |                                |                                         |                   |                                 |
| `BaseService`             | Cliente HTTP base              | Axios, Redux                            | Implementado      | Interceptors, auto-refresh      |
| `ApiService`              | Wrapper API principal          | BaseService                             | Implementado      | Métodos normalizados            |
| `RtkQueryService`         | RTK Query setup                | Redux Toolkit                           | Implementado      | No usado actualmente            |
| `falabellaApi.service`    | API específica Falabella       | Axios                                   | Implementado      | Dashboard específico            |
| `ApiMigrationService`     | Migración APIs                 | -                                       | No utilizado      | Legacy                          |
| **Componentes**           |                                |                                         |                   |                                 |
| Componentes UI Base       | Botones, modales, tablas, etc. | Props tipadas                           | Implementado      | Sistema completo                |
| Componentes Form          | Inputs, validación, wrappers   | Formik, Yup                             | Implementado      | Integración completa            |
| Componentes Layout        | Headers, footers, containers   | React Router                            | Implementado      | Sistema responsive              |
| Componentes Router        | Navegación especializada       | React Router                            | Implementado      | Contextual por área             |
| Componentes Authorization | Guards de permisos             | Redux (auth)                            | Implementado      | Protección granular             |
| Componentes Debug         | Debugging y desarrollo         | Redux                                   | Implementado      | Comentados en producción        |
| **Hooks**                 |                                |                                         |                   |                                 |
| Hooks de tema             | Dark mode, colores, fuentes    | Redux (personalización)                 | Implementado      | Sistema reactivo                |
| Hooks de auth             | Permisos, autorización         | Redux (auth)                            | Implementado      | Verificación de acceso          |
| Hooks de utilidad         | Local storage, device, etc.    | -                                       | Implementado      | Funciones auxiliares            |
| Hooks especializados      | Falabella data, etc.           | APIs específicas                        | En desarrollo     | Para dashboards                 |
| **Configuración**         |                                |                                         |                   |                                 |
| `theme.config.ts`         | Configuración base temas       | localStorage, API                       | Implementado      | Valores dinámicos               |
| `pages.config.ts`         | Configuración páginas          | Permisos, roles                         | Implementado      | Sistema de autorización         |
| `i18n.ts`                 | Internacionalización           | i18next                                 | Implementado      | 3 idiomas soportados            |
| Variables de entorno      | Configuración build/runtime    | Vite                                    | Implementado      | VITE_API_URL                    |

### Resumen de Estado

**Implementado**: 85% de funcionalidades core
**En Desarrollo**: 10% (calendario, tickets, hooks especializados)
**No Utilizado/Placeholder**: 5% (sucursales, algunos servicios legacy)

### Funcionalidades Críticas Implementadas

-   Sistema de autenticación completo con JWT y refresh automático
-   Gestión empresarial dinámica sin hardcoding
-   Sistema de permisos y roles granular
-   Personalización completa con persistencia
-   Dashboard multi-empresa funcional
-   CRUD completo para entidades principales
-   Sistema de notificaciones y manejo de errores
-   Internacionalización con 3 idiomas
-   Testing setup completo

### Áreas de Mejora Identificadas

-   Completar módulo de sucursales
-   Implementar tests unitarios
-   Finalizar módulos de calendario y tickets
-   Optimizar bundle size
-   Implementar lazy loading adicional para componentes grandes
