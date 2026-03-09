# GEMINI.md - Zentria ERP Frontend (Guía Maestra)

> **MANDATO CRÍTICO DE IDIOMA:** Toda comunicación, comentarios en código y documentación deben realizarse exclusivamente en **ESPAÑOL**.

## 🚀 Descripción del Proyecto
**Zentria ERP Frontend** es una plataforma corporativa avanzada para la gestión multi-empresa y multi-sucursal.

### Stack Tecnológico Core
- **Framework:** React 18 (TypeScript 5)
- **Bundler:** Vite 5 + SWC
- **Estado:** Redux Toolkit + Redux Persist
- **Estilos:** Tailwind CSS 3 (Tema corporativo + Dark Mode)
- **Formularios:** **Formik + Yup** (Estándar obligatorio)
- **Tablas:** TanStack Table (React Table)
- **API:** Axios (BaseService con gestión de JWT Refresh)

---

## 🤖 Agentes Especializados
Opero bajo 6 perfiles. Invocables mediante `@NombreAgente`:
1.  🏛️ **@Architect**: Diseño de arquitectura y delegación.
2.  🛡️ **@Full_TS**: Tipado estricto (Interfaces, DTOs, Yup).
3.  🧠 **@Full_React**: Lógica de negocio (Hooks, Redux).
4.  🎨 **@UI_UX**: Interfaz visual (Zentria Design System).
5.  🔨 **@Dev_Implementador**: Ensamblaje final de piezas.
6.  🚦 **@Tester_QA**: Auditoría de calidad y testeo.

---

## 📂 Estructura Detallada de Módulos
Cada funcionalidad debe vivir en su propia carpeta dentro de `src/pages/[Modulo]/[Funcionalidad]`.

### 1. Anatomía del Módulo
- **`index.tsx` (Ensamblador):** 
  - *Responsabilidad:* Orquestación.
  - *Contenido:* Importa el Hook y la View. Desestructura la lógica y la inyecta en la View. Envuelve todo en `<PermissionGuard>`.
- **`[Funcionalidad]View.tsx` (Presentación):**
  - *Responsabilidad:* UI pura.
  - *Contenido:* Usa componentes de `@/components/ui` y `@/components/form`. Recibe datos y handlers por props. **Cero lógica de negocio.**
- **`hooks/use[Funcionalidad].ts` (Lógica):**
  - *Responsabilidad:* Cerebro del módulo.
  - *Contenido:* Instancia de Formik, llamadas a API (ApiService), dispatch de Redux, manejo de estados de carga/error.
- **`types.ts` (Contrato de Datos):**
  - *Responsabilidad:* Tipado y validación.
  - *Contenido:* Interfaces de TypeScript y esquema de validación **Yup**.

### 2. Convenciones de Naming
- **Carpetas:** `PascalCase` para módulos y subcarpetas de funcionalidad. `camelCase` para carpetas de utilidad como `hooks`, `utils`, `services`.
- **Archivos de Componentes:** `PascalCase.tsx`.
- **Hooks:** `useNombreHook.ts`.
- **Tipos:** Siempre usar el prefijo `I` para interfaces (ej: `IUser`) y sufijo `DTO` para objetos de transferencia de datos.

---

## 🛣️ Guía de Enrutamiento y Navegación
Zentria ERP utiliza un sistema de rutas centralizado y basado en plantillas.

### Paso 1: Definir en `pages.config.ts`
Ubicación: `src/config/pages.config.ts`.
Añadir el objeto de configuración:
```typescript
{
  id: 'unique-id',
  to: '/modulo/ruta',
  text: 'Texto en Menú',
  icon: 'DuoIconName', // De src/components/icon/Icon
  authority: ['permission-name'], // Permisos requeridos
  roles: ['admin', 'manager'], // Roles permitidos
}
```

### Paso 2: Registrar en `contentRoutes.tsx`
Ubicación: `src/routes/contentRoutes.tsx`.
Importar el componente (usar `lazy` para optimización) y añadirlo al array de rutas privadas:
```typescript
const NewPage = lazy(() => import('@/pages/Modulo/NewPage'));
// ... en el array de rutas
{ path: pagesConfig.newPage.to, element: <NewPage /> }
```

### Paso 3: Añadir al Menú Lateral (Opcional)
Ubicación: `src/routes/asideRoutes.tsx`.
Añadir la configuración de `pagesConfig` al array correspondiente para que aparezca en el `Aside`.

---

## 🔐 Sistema de Permisos y Roles (RBAC)
- **AuthorityCheck:** El sistema valida contra el array de `permissions` del usuario.
- **PermissionGuard:** Utilizar el componente `<PermissionGuard authority={['ver-modulo']}>` para ocultar elementos de la UI (botones, cards) basados en permisos.
- **Rutas Protegidas:** Las rutas verifican automáticamente `authority` y `roles` antes de renderizar.

---

## 🛠️ Checklist de Creación de Funcionalidad
1. [ ] Crear carpeta en `src/pages/...`.
2. [ ] Definir tipos y validación Yup en `types.ts`.
3. [ ] Implementar lógica y Formik en `hooks/use[Nombre].ts`.
4. [ ] Crear la interfaz visual en `[Nombre]View.tsx`.
5. [ ] Ensamblar en `index.tsx`.
6. [ ] Registrar ruta en `pages.config.ts` y `contentRoutes.tsx`.
7. [ ] Verificar permisos y acceso por rol.

---

## 🌐 Idioma y Localización
**Idioma Oficial: Español (Chile).**
Dado que el sistema es de uso interno y cerrado para Chile, **NO se utilizará internacionalización (i18n)** para nuevas funcionalidades.
- **Textos:** Se escriben directamente en el código (Views/Hooks) en español.
- **Consistencia:** Mantener la misma terminología en todo el ERP (ej: "RUT", "Sucursal", "Bodega").
- **Fechas:** Formato chileno (`DD-MM-YYYY`) usando `dayjs`.

## 🎨 Sistema de Temas y Personalización
... (resto de la sección igual)
El ERP permite personalizar la experiencia visual por usuario y sucursal.

### 1. El Slice de Personalización (`personalizacionSlice.ts`)
Gestiona:
- `fontSize` (12px a 18px).
- `themeColor` (Paleta de colores de Tailwind).
- `darkMode` (Light, Dark, System).
- `sucursal_principal`.

### 2. Flujo de Persistencia
1.  **Redux:** Estado en memoria para reactividad inmediata.
2.  **LocalStorage:** Sincronización automática vía reducers para evitar "flashes" de estilo antes de que Redux hidrate.
3.  **API:** Persistencia permanente en la base de datos mediante el endpoint `/user/personalization`.

### 3. Configuración Dinámica (`theme.config.ts`)
Objeto centralizador que los componentes consultan. Utiliza **Getters** para leer dinámicamente de Redux o LocalStorage, asegurando que la configuración visual esté siempre disponible incluso fuera del contexto de React si fuera necesario.

---
