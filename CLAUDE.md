# CLAUDE.md — Zentria ERP Frontend

Guía operativa para trabajar en este repositorio. Léela antes de generar código. El
objetivo es que cada nueva página/módulo nazca ya alineado con la arquitectura real del
proyecto, sin reinventar layouts, autorización ni manejo de estado.

---

## 1. Stack real (verificado en el código)

- **React 18 + TypeScript 5 (strict)** · Bundler **Vite 5** · estilos **Tailwind CSS 3**.
- **Estado global:** Redux Toolkit con `createSlice` + `createAsyncThunk` (39+ slices) y
  persistencia. RTK Query existe (`RtkQueryService.ts`) pero es minoritario — el patrón
  dominante es slice + thunk + `ApiService`.
- **Formularios:** **Formik + Yup**. Es el estándar de facto (Formik en ~81 archivos, Yup
  en ~52). **NO se usa Zod** en el código (0 imports). Hay ~35 archivos legacy con
  `react-hook-form`; **no lo propagues**, en código nuevo usa Formik + Yup.
- **Tablas:** TanStack Table (`@tanstack/react-table`).
- **HTTP:** Axios vía `BaseService` → envuelto por `ApiService`.
- **Backend:** Laravel 12 + JWT. Multi-empresa / multi-subsidiaria / multi-sucursal.
- **Alias de imports:** `@/*` → `./src/*` (tsconfig). Usa `@/...` siempre.

> ⚠️ Discrepancia conocida: los prompts de `.agents/skills/full-react/SKILL.md` y
> `.agents/skills/full-ts/SKILL.md` mencionan React Hook Form + Zod. **Eso NO refleja el código real.** La
> fuente de verdad es este CLAUDE.md: **Formik + Yup**, como dicen `.agents/skills/architect/SKILL.md` y
> `.agents/skills/ui-ux/SKILL.md` y como confirma el README.

---

## 2. Principios inquebrantables (The Zentria Standard)

1. **Zero `any`.** Está prohibido. Si no conoces la forma, usa `unknown` + type narrowing
   (mira los helpers `asRecord` / `normalizeNullableNumber` usados en slices y hooks).
2. **El Design System es ley.** No hay `<div className="card">` ni layouts inventados. Se
   usa `PageWrapper` → `Subheader` → `Container` → `Card`/`Modal`. Inputs sólo desde
   `@/components/form`. Iconos sólo con `<Icon icon="..." />` de `@/components/icon/Icon`.
3. **Formularios con Formik + Yup.** Cada formulario tiene su `Schema` de Yup. Los inputs
   reciben `value/onChange/onBlur/isValid/isTouched/invalidFeedback` del objeto `formik`.
4. **Seguridad por diseño.** Toda acción/ruta sensible pasa por autorización:
   `ProtectedRoute` (rutas), `PermissionGuard` / `ProtectedButton` (UI), `useAuthorization`
   / `useCan` (lógica). Super-admin siempre pasa.
5. **Contexto multi-sucursal.** Las peticiones que dependen de sucursal/subsidiaria
   obtienen el contexto desde los **hooks de branch** (sección 6), nunca hardcodeado.
6. **Lógica fuera del JSX.** La lógica vive en un hook `use<Pagina>` dentro de `hooks/`; el
   componente de vista es presentacional.

---

## 3. Estructura de un módulo/página (patrón canónico)

Las páginas viven en `src/pages/<area>/<Modulo>/`. El patrón real (ej.
`src/pages/comercial/clientesVentas/ClientesVentasDetalle/`) es:

```
src/pages/<area>/<Modulo>/
├── index.tsx                 # Entry: importa la View y la renderiza (delgado)
├── <Modulo>View.tsx          # Componente presentacional (JSX + Design System)
├── types.ts                  # Interfaces locales + Yup schemas del módulo
├── hooks/
│   └── use<Modulo>.ts         # Lógica: datos, Formik, dispatch, estado
└── components/
    ├── modals/               # CreateXModal, DeleteXModal, ...
    ├── tables/               # XTable (TanStack)
    └── parts/                # piezas reutilizables del módulo
```

`index.tsx` mínimo:

```tsx
import React from 'react';
import ModuloView from './ModuloView';

const Modulo = () => <ModuloView />;
export default Modulo;
```

Datos de dominio compartidos entre módulos → `src/store/slices/<modulo>/`. Tipos de
dominio compartidos → `src/interface/*.interface.ts`.

---

## 4. Layout de página (Design System obligatorio)

Todas las páginas internas envuelven su contenido en este árbol. `PageWrapper` con
`isProtectedRoute` además dispara `userMeThunk()` (carga perfil + personalización) y
redirige a login si no hay sesión.

```tsx
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Icon from '@/components/icon/Icon';
import ProtectedButton from '@/components/ui/ProtectedButton';

const ModuloView = () => (
  <PageWrapper isProtectedRoute title="Clientes">
    <Subheader>
      <SubheaderLeft>
        <Icon icon="HeroUsers" />
        <span>Catálogos / Clientes</span>
      </SubheaderLeft>
      <SubheaderRight>
        {/* Botón con permiso + scope de sucursal */}
        <ProtectedButton
          permission="create-customer"
          branchId={currentBranchId}
          scope="access"
          variant="solid"
          color="blue"
          icon="HeroPlus"
          onClick={onCreate}>
          Nuevo
        </ProtectedButton>
      </SubheaderRight>
    </Subheader>

    <Container>
      {/* Card, tablas, modales... */}
    </Container>
  </PageWrapper>
);
```

Componentes UI clave (rutas reales):
- Layouts: `@/components/layouts/{PageWrapper,Subheader,Container}/...`
- Form: `@/components/form/*` (Input, SelectReact, Label, etc.)
- UI: `@/components/ui/*` (`Button`, `ProtectedButton`, Card/Modal system)
- Icono: `@/components/icon/Icon`

---

## 5. Autorización (guards, permisos y scope)

El modelo combina **permisos/roles** con **scope geográfico** (branch / subsidiary /
company). Super-admin (`super-admin` en permisos o roles) siempre pasa.

| Capa | Herramienta | Uso |
|------|-------------|-----|
| Ruta | `ProtectedRoute` (`@/components/router/ProtectedRoute`) | Protege una ruta; redirige si no hay acceso. En rutas se declara vía campo `authority` de `pages.config`. |
| UI declarativa | `PermissionGuard` (`@/components/authorization/PermissionGuard`) | Oculta/condiciona bloques. Props: `permission`, `role`, `requireAll`, `branchId/subsidiaryId/companyId`, `scope`, `fallback`. |
| Botón | `ProtectedButton` (`@/components/ui/ProtectedButton`) | Botón con permiso + scope; `fallbackMode: 'hidden' | 'disabled'`. |
| Lógica | `useAuthorization` (`@/hooks/useAuthorization`) | `authorize(...)`, `canAccessBranch/Subsidiary/Company`, `canViewBranch/...`, `hasPermission`, `isSuperAdmin`. |
| Lógica simple | `useCan` (`@/hooks/useCan`) | `has`, `any`, `all`, `hasRole`, `isAdmin`, `isSuperAdmin`. |

**`scope`**: `'none'` (sin validación geográfica), `'visible'`, `'access'`, `'both'`.
Para acciones de escritura usa normalmente `scope="access"`. Si el usuario no tiene
sucursales/subsidiarias listadas (set vacío), las funciones `canAccess*`/`canView*`
devuelven `true` (no bloquean).

Ejemplo declarativo:

```tsx
<PermissionGuard permission="create-product" branchId={currentBranchId} scope="access">
  <CrearProductoButton />
</PermissionGuard>
```

---

## 6. Contexto de sucursal/subsidiaria (branch hooks)

**Regla:** nunca hardcodees `branchId`/`subsidiaryId`. Obtén el contexto del usuario con
`useCurrentBranch`, que lo deriva de la **personalización** y del **perfil** ya cargados
en el store (no hace llamadas extra).

```tsx
import { useCurrentBranch } from '@/hooks/useCurrentBranch';

const { branchId, subsidiaryId, hasValidBranch, visibleBranches } = useCurrentBranch();
```

- `branchId`: prioridad → `personalizacion.sucursal_principal` → `user.branch.id` →
  `user.branch_id` → `null`.
- `subsidiaryId`: `selectEffectiveSubsidiaryId` o se resuelve desde la branch activa.
- `visibleBranches`: lista normalizada (`{ id, name }`) de las sucursales del usuario.

Flujo típico: `useCurrentBranch()` da el contexto → se pasa a:
1. el hook de datos del módulo (`useModulo({ subsidiaryId, ... })`) para filtrar la
   petición, y
2. los guards (`branchId` + `scope`) para autorizar acciones.

**No uses** `@/hooks/permiso/userBranch` (`useUserBranches`): está `@deprecated` y hace
llamadas API innecesarias. Prefiere `useCurrentBranch` + `useAuthorization`.

---

## 7. Store (Redux Toolkit)

Estructura en `src/store/`:
- `storeSetup.ts` — configura el store (+ persistencia). `rootReducer.ts` — combina.
- `hook.ts` — **usa siempre** `useAppDispatch` y `useAppSelector` (tipados), no los de
  `react-redux` crudos.
- `index.ts` — barrel: reexporta store, hooks y los slices principales.
- `slices/<modulo>/<modulo>Slice.ts` — un slice por dominio.
- `selectors/`, `selectors.ts` — selectores reutilizables.

Patrón de slice (ver `slices/products/productsSlice.ts` como referencia):
- Estado tipado con flags explícitos: `loading`, `creating`, `updating`, `deleting`,
  `error`, `current`, `meta`, etc.
- Efectos async con `createAsyncThunk`, llamando a `ApiService.fetchData(...)`.
- Manejo de error con helpers `asRecord`/`getErrorMessage` (extraen
  `error.response.data.message`), y `toast` para feedback.
- Selectores exportados desde el propio slice (`selectXxx`).

Desde un hook de página:

```tsx
import { useAppDispatch, useAppSelector } from '@/store';
import { createCustomerSupplier } from '@/store/slices/customerSuppliers/customerSuppliersSlice';

const dispatch = useAppDispatch();
await dispatch(createCustomerSupplier(payload)).unwrap(); // .unwrap() para try/catch
```

---

## 8. Servicios / capa HTTP (`src/services`)

- **`BaseService`** — instancia Axios con interceptores (token JWT, refresh, 401/403,
  abort). No llamar Axios directo.
- **`ApiService`** (`src/services/ApiService.ts`) — envuelve `BaseService` y añade:
  - **Caché en memoria por TTL** para GETs: pasa `cacheTTLms` y opcional `forceRefetch`.
  - **Dedupe** de requests en vuelo: `dedupe: true` (+ `dedupeKey` opcional).
  - `fetchData<Resp, Req>(config)` → `AxiosResponse<Resp>`.
  - `fetchNormalized<T>(config)` → devuelve `data.data ?? data` (desempaqueta el wrapper).
  - Invalidación: `clearCache()`, `invalidateCache(urlPattern)`, `invalidateExact(config)`.
- Servicios por dominio: `documentsService`, `salesService`, `integrationsService`,
  `falabellaApi.service`, `reports/`, `lockers/`, `auth/`, etc.

Uso típico dentro de un thunk:

```ts
const resp = await ApiService.fetchData<IProductListResponse>({
  url: '/products',
  method: 'get',
  params: { subsidiary_id, page, per_page },
  cacheTTLms: 30_000,   // opcional
  dedupe: true,         // opcional
});
```

---

## 9. Rutas

Las rutas se declaran en `src/routes/contentRoutes.tsx` (lazy imports) y se cruzan con
`src/config/pages.config.ts`:
- Páginas públicas: `{ path, element, public: true }`.
- Páginas protegidas: `{ path, element, authority: cfg.<area>.subPages.<x>.authority }`.
- Plantillas de layout: `asideRoutes`, `headerRoutes`, `footerRoutes`.

Para una página nueva: añade el `lazy(() => import('@/pages/...'))`, su entrada en
`contentRoutes.tsx` con el `authority` correspondiente, y el item de menú en
`pages.config.ts` / `asideRoutes.tsx` si va al sidebar.

---

## 10. Receta: "crea una página X" (haz esto por defecto)

1. **Ubicación:** `src/pages/<area>/<Modulo>/` con la estructura de la sección 3.
2. **Tipos + validación:** en `types.ts`, interfaces (`IX`, `CreateXPayload`) y `XSchema`
   de **Yup**. Cero `any`; usa `enum`/uniones para estados.
3. **Datos:** thunks/selectores en `src/store/slices/<modulo>/` (o reutiliza un slice).
   Las llamadas pasan por `ApiService`.
4. **Lógica:** hook `hooks/use<Modulo>.ts` — toma `useCurrentBranch()`, configura
   **Formik** con `XSchema`, hace `dispatch(...).unwrap()`, expone `{ data, state, form,
   actions }` memoizados.
5. **Vista:** `<Modulo>View.tsx` presentacional con `PageWrapper > Subheader > Container`
   y componentes del Design System. Inputs enlazados a Formik.
6. **Autorización:** ruta con `ProtectedRoute`/`authority`; acciones con
   `ProtectedButton`/`PermissionGuard` usando `branchId` de `useCurrentBranch` + `scope`.
7. **Estados:** maneja `isLoading` (skeleton/spinner), `isError` (toast/alert), empty
   state y doble-submit (deshabilita el botón mientras `isSubmitting`/`creating`).
8. **Rutas/menú:** registra en `contentRoutes.tsx` + `pages.config.ts`.

---

## 11. Convenciones rápidas

- Imports ordenados: librerías → `@/components` → hooks/utils → tipos.
- Optional chaining / nullish coalescing siempre (`user?.branch?.id`, `count ?? 0`).
- Memoiza funciones/objetos retornados por hooks (`useCallback`/`useMemo`).
- Nombres: Schemas `XSchema`; tipos `X`/`CreateXPayload`; interfaces de dominio `IX`.
- Feedback al usuario con `react-toastify` (ya usado en slices).
- Accesibilidad: usa `<button>`/componentes UI, no `div` con `onClick`.

## 12. Agentes de apoyo (`.agents/skills/`)

Prompts de roles para diseño asistido: `Architect`, `Full_TS`, `Full_React`, `UI_UX`,
`Dev_Implementador`, `Tester_QA`. Úsalos como referencia de criterios, **pero ante
cualquier conflicto manda este CLAUDE.md** (sobre todo: Formik + Yup, no RHF + Zod).

## 13. Bitácora de trabajo (`bitacora_trabajo/`)

Registro cronológico de la actividad del proyecto para luego generar informes que
justifiquen el trabajo. **No es documentación técnica** (eso vive aquí y en el código);
es el *qué se hizo, en qué rama y por qué* de cada día.

Reglas (ver `bitacora_trabajo/instrucciones.md` para el detalle completo):
- **Un archivo por día**, nombrado `dd-mm-yyyy.md` (ej. `24-06-2026.md`).
- Dentro, una o más **sesiones** ordenadas por hora, cada una indicando la **rama** y
  los cambios con etiquetas de tipo (`[feat]`, `[fix]`, `[style]`, `[refactor]`,
  `[docs]`, `[chore]`, `[test]`) — las mismas que en los commits.
- Anota: qué, en qué rama, por qué, referencia (PR/commit/issue), estado y
  decisiones/problemas relevantes. Mantén las entradas **resumidas**.

Al cerrar una tarea o sesión relevante, **agrega la entrada** al archivo del día (créalo
si no existe) antes de dar por terminado el trabajo.
