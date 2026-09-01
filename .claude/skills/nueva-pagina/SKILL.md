---
name: nueva-pagina
description: Crear una página o módulo nuevo en Zentria ERP siguiendo el patrón canónico del proyecto (estructura de carpetas, tipos + Yup, slice, hook, vista, autorización, rutas y menú). Usar cuando se pida una página, pantalla, módulo o vista nueva.
---

# Página nueva en Zentria ERP

`CLAUDE.md` es la fuente de verdad y prevalece ante este skill. Acá está el detalle operativo que
se usa sólo al crear una página, y por eso vive fuera del contexto fijo.

## Estructura de un módulo/página (patrón canónico)

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

Datos de dominio compartidos entre módulos → `src/store/slices/<modulo>/`. Tipos de dominio
compartidos → `src/interface/*.interface.ts`.

## Receta: "creá una página X" (hacé esto por defecto)

1. **Ubicación:** `src/pages/<area>/<Modulo>/` con la estructura de arriba.
2. **Tipos + validación:** en `types.ts`, interfaces (`IX`, `CreateXPayload`) y `XSchema` de
   **Yup**. Cero `any`; usá `enum`/uniones para estados.
3. **Datos:** thunks/selectores en `src/store/slices/<modulo>/` (o reutilizá un slice). Las
   llamadas pasan por `ApiService`.
4. **Lógica:** hook `hooks/use<Modulo>.ts` — toma `useCurrentBranch()`, configura **Formik** con
   `XSchema`, hace `dispatch(...).unwrap()`, expone `{ data, state, form, actions }` memoizados.
5. **Vista:** `<Modulo>View.tsx` presentacional con `PageWrapper > Subheader > Container` y
   componentes del Design System. Inputs enlazados a Formik. El árbol de layout obligatorio y sus
   rutas de import están en `CLAUDE.md` §4.
6. **Autorización:** ruta con `ProtectedRoute`/`authority`; acciones con
   `ProtectedButton`/`PermissionGuard` usando `branchId` de `useCurrentBranch` + `scope`
   (`CLAUDE.md` §5 y §6).
7. **Estados:** manejá `isLoading` (skeleton/spinner), `isError` (toast/alert), empty state y
   doble-submit (deshabilitá el botón mientras `isSubmitting`/`creating`).
8. **Rutas/menú:** registrá en `contentRoutes.tsx` + `pages.config.ts`.

## Antes de dar por terminada la página

- Verificá que el `authority` de la ruta coincida con el permiso que exige el endpoint real. Un
  `authority: []` deja la vista accesible por URL directa a cualquier usuario autenticado.
- Si el recurso depende de empresa, subsidiaria o sucursal, aplicá el patrón ZF-12 de propiedad de
  contexto (`.claude/skills/full-react/SKILL.md`).
- Corré las pruebas afectadas con `pnpm test:related <archivos>`, no la suite completa.
