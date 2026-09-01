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
7. **El backend es de sólo lectura.** Desde este repo no se modifica nada de
   `../zentria-erp-back`. Para conocer un contrato real (método, URL, campos, nullabilidad,
   validación y **permiso efectivo** de la ruta) se consulta el MCP **Laravel Boost**, nunca se
   deduce de un nombre parecido ni de cómo lo llama el frontend. `tinker`, `database-query` y
   los artisan que mutan están bloqueados. Detalle en `.claude/README.md`.

---

## 3. Estructura de un módulo/página (patrón canónico)

Las páginas viven en `src/pages/<area>/<Modulo>/` y siguen siempre el mismo patrón:
`index.tsx` delgado → `<Modulo>View.tsx` presentacional → `types.ts` (interfaces + schemas
Yup) → `hooks/use<Modulo>.ts` (toda la lógica) → `components/{modals,tables,parts}/`.
Referencia real: `src/pages/comercial/clientesVentas/ClientesVentasDetalle/`.

Datos de dominio compartidos entre módulos → `src/store/slices/<modulo>/`. Tipos de
dominio compartidos → `src/interface/*.interface.ts`.

> El árbol completo y el `index.tsx` de ejemplo están en
> **`.claude/skills/nueva-pagina/SKILL.md`**, junto con la receta de §10.

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
	<PageWrapper isProtectedRoute title='Clientes'>
		<Subheader>
			<SubheaderLeft>
				<Icon icon='HeroUsers' />
				<span>Catálogos / Clientes</span>
			</SubheaderLeft>
			<SubheaderRight>
				{/* Botón con permiso + scope de sucursal */}
				<ProtectedButton
					permission='create-customer'
					branchId={currentBranchId}
					scope='access'
					variant='solid'
					color='blue'
					icon='HeroPlus'
					onClick={onCreate}>
					Nuevo
				</ProtectedButton>
			</SubheaderRight>
		</Subheader>

		<Container>{/* Card, tablas, modales... */}</Container>
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

| Capa           | Herramienta                                                      | Uso                                                                                                                           |
| -------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Ruta           | `ProtectedRoute` (`@/components/router/ProtectedRoute`)          | Protege una ruta; redirige si no hay acceso. En rutas se declara vía campo `authority` de `pages.config`.                     |
| UI declarativa | `PermissionGuard` (`@/components/authorization/PermissionGuard`) | Oculta/condiciona bloques. Props: `permission`, `role`, `requireAll`, `branchId/subsidiaryId/companyId`, `scope`, `fallback`. |
| Botón          | `ProtectedButton` (`@/components/ui/ProtectedButton`)            | Botón con permiso + scope; `fallbackMode: 'hidden' \| 'disabled'`.                                                            |
| Lógica         | `useAuthorization` (`@/hooks/useAuthorization`)                  | `authorize(...)`, `canAccessBranch/Subsidiary/Company`, `canViewBranch/...`, `hasPermission`, `isSuperAdmin`.                 |
| Lógica simple  | `useCan` (`@/hooks/useCan`)                                      | `has`, `any`, `all`, `hasRole`, `isAdmin`, `isSuperAdmin`.                                                                    |

**`scope`**: `'none'` (sin validación geográfica), `'visible'`, `'access'`, `'both'`.
Para acciones de escritura usa normalmente `scope="access"`. Si el usuario no tiene
sucursales/subsidiarias listadas (set vacío), las funciones `canAccess*`/`canView*`
devuelven `true` (no bloquean).

**Trampa del `authority`:** el arreglo declarado en `pages.config.ts` lo consumen dos guards con
semántica opuesta — `AuthorityCheck` (rutas) exige **todos** los permisos (`requireAll: true`), el
aside evalúa OR. Ampliarlo para mostrar un ítem de menú le **quita la ruta** a quien no tenga
ambos. Resolver la visibilidad del menú por separado.

Ejemplo declarativo:

```tsx
<PermissionGuard permission='create-product' branchId={currentBranchId} scope='access'>
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
	cacheTTLms: 30_000, // opcional
	dedupe: true, // opcional
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

La receta paso a paso (ubicación, tipos + Yup, slice, hook, vista, autorización, estados y
registro de rutas/menú) vive en **`.claude/skills/nueva-pagina/SKILL.md`**. Invocá ese skill
al crear una página o módulo nuevo, en vez de improvisar la estructura.

Se mantiene fuera de este archivo a propósito: son ~120 líneas de referencia que sólo se usan
al crear una página, y `CLAUDE.md` se carga entero en cada sesión.

---

## 11. Convenciones rápidas

- Imports ordenados: librerías → `@/components` → hooks/utils → tipos.
- Optional chaining / nullish coalescing siempre (`user?.branch?.id`, `count ?? 0`).
- Memoiza funciones/objetos retornados por hooks (`useCallback`/`useMemo`).
- Nombres: Schemas `XSchema`; tipos `X`/`CreateXPayload`; interfaces de dominio `IX`.
- Feedback al usuario con `react-toastify` (ya usado en slices).
- Accesibilidad: usa `<button>`/componentes UI, no `div` con `onClick`.

## 12. Agentes de apoyo (`.claude/`)

La configuración de agentes vive **versionada** en `.claude/`, así que un clon fresco ya la trae:

`.claude/` está versionado: `settings.json` (permisos e hooks), `agents/` (8 subagentes),
`skills/` (criterios por rol, **copia canónica** que también leen Codex y OpenCode) y
`hooks/` (guardas ejecutables). El inventario completo, las herramientas de cada agente y la
política de costo de contexto están en **`.claude/README.md`**.

Los skills son referencia, **pero ante cualquier conflicto manda este CLAUDE.md** (sobre todo:
Formik + Yup, no RHF + Zod). **Delegá en un subagente sólo si el usuario lo pide** o si una
instrucción aplicable lo autoriza, y sólo para subtareas independientes.

**Verificación acotada, siempre:**

| En vez de    | Usá                                | Por qué                                                       |
| ------------ | ---------------------------------- | ------------------------------------------------------------- |
| `pnpm test`  | `pnpm run test:related <archivos>` | `test` es `vitest` sin `run`: modo watch, no termina nunca.   |
| `pnpm lint`  | `pnpm run lint:changed`            | El completo son 9.033 líneas y 7.553 hallazgos preexistentes. |
| `tsc` suelto | `pnpm run typecheck`               | Comando único y ya autorizado.                                |

Usá `test:run` o `lint` completos sólo cuando el alcance realmente lo justifique, y reportá
por separado los hallazgos nuevos de la deuda preexistente.

### Circuito de calidad antes de un PR

Activá `.claude/skills/pr-readiness/SKILL.md` antes de cualquier cambio **no trivial** que toque
contrato/API, archivos, permisos, estado remoto, contexto organizacional, formulario, overlay,
mutación, componente compartido o accesibilidad. La activación depende del riesgo del diff, no de
que se mencione un PR. El skill define el preflight observable, la matriz `riesgo → evidencia`,
la auditoría independiente y el cierre.

El skill abre con **«Defectos recurrentes de este repositorio»**: seis trampas concretas, cada una
nacida de un PR rechazado, con su condición observable de cierre. Recorrerlas es obligatorio cuando
el diff las toca — son la causa de la mayoría de las correcciones, y ninguna se detecta razonando
en abstracto.

**CI:** el workflow `Calidad de PR` ejecuta `check:eol`, `prettier:check`, `lint:imports`,
`typecheck` y `test:run` en cada pull request. No abras ni actualices un PR con esa corrida en
rojo: es la verificación que el revisor va a mirar primero.

**Vía rápida:** un cambio literal y determinista de hasta 3 archivos de configuración,
documentación o copy, con el resultado completamente especificado y sin tocar lógica, API,
permisos, estado, formularios, overlays, componentes compartidos ni accesibilidad, no activa
el circuito: basta el check directamente relacionado y `git diff --check`.

## 13. Bitácora de trabajo (`bitacora_trabajo/`)

Registro cronológico de la actividad del proyecto para luego generar informes que
justifiquen el trabajo. **No es documentación técnica** (eso vive aquí y en el código);
es el _qué se hizo, en qué rama y por qué_ de cada día.

Reglas (ver `bitacora_trabajo/instrucciones.md` para el detalle completo):

- **Un archivo por día**, nombrado `dd-mm-yyyy.md` (ej. `24-06-2026.md`). **Prohibido**
  satélites por tema (`08-07-2026-foo.md`, `analisis-*.md` sueltos).
- Al **inicio** del archivo: sección **`## Temas del día`** (índice de viñetas) para
  poder buscar rápido si ese día se trabajó un tema.
- Debajo: bloques **`## Tema: …`** con la **rama**, detalle y etiquetas (`[feat]`,
  `[fix]`, `[style]`, `[refactor]`, `[docs]`, `[chore]`, `[test]`) — las mismas que en
  los commits.
- Anota: qué, rama, por qué, referencia (PR/commit/issue), estado y decisiones.
  Entradas **resumidas**.

Al cerrar una tarea, **actualizá el índice de temas** y el bloque del tema en el archivo
del día (créalo si no existe).

**Excepción:** una corrección literal y determinista de revisión, limitada a configuración,
documentación o copy y sin cambio funcional, no crea por sí sola un archivo diario nuevo. Si el
archivo del día ya existe, puede agregarse de forma resumida; si no existe, sólo se registra cuando
el usuario lo pida o el cambio sea material.

## 14. Flujo de trabajo (branching + PRs)

- **Commits en español**, formato **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `style:`, `docs:`, `test:`).
- Cada tarea en una **rama independiente** desde `develop`. El nombre debe estar en español, usando kebab-case y conservando el prefijo técnico (ej. `feat/orden-compra`, `fix/error-precios`). No crear ramas con descripciones en inglés.
- **Antes de empezar:** `git pull origin develop`, crear rama nueva desde `develop`, trabajar ahí.
- **Nada remoto sin autorización explícita.** Commit, push, crear PR, actualizar PR, merge y release son autorizaciones **independientes**: aprobar una no habilita las demás. Por defecto se entrega el texto del PR para que el usuario lo revise; si el usuario autoriza la publicación, el agente la ejecuta y verifica el estado remoto.
- El PR siempre apunta a `develop`. El formato obligatorio del cuerpo está en `.claude/skills/pr-publisher/SKILL.md`.

### Identidad de publicación

Todo lo que llega a GitHub va **bajo la cuenta del usuario**, nunca bajo una identidad de Claude,
de un bot o de una GitHub App. En concreto:

- La cuenta activa de `gh` debe ser la del usuario y venir de su credencial local. Si el token
  activo proviene de `GH_TOKEN` o `GITHUB_TOKEN` del entorno, **detenerse**: puede pertenecer a
  una app. Verificar con `gh auth status --active`.
- La autoría del commit es la de `git config user.name` / `user.email`. No usar `--author`,
  `--committer` ni `git -c user.email=...`.
- **Sin atribución de herramienta:** ningún commit lleva `Co-Authored-By: Claude` y ningún cuerpo
  de PR lleva «Generated with Claude Code» ni firma equivalente. Los trailers `Co-authored-by` se
  reservan para personas reales del equipo.

El hook `.claude/hooks/identidad-github.mjs` bloquea automáticamente los comandos que violen
cualquiera de estas tres reglas. Para la atribución inspecciona tanto el comando como el
contenido de los archivos que referencia (`git commit -F`, `gh pr create --body-file`), así que
tampoco pasa cuando el mensaje va en un archivo.
