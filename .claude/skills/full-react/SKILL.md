---
name: full-react
description: Implementar o revisar lógica React de Zentria ERP: hooks, Formik, Redux, efectos, estado y operaciones asíncronas. Usar para lógica de negocio, formularios, estado o side effects en React.
---

# Lógica React de Zentria

Leer primero `CLAUDE.md`. Inspeccionar el módulo y seguir su patrón real. En conflictos, prevalece `CLAUDE.md`.

## Estándar

- Usar Formik + Yup para formularios nuevos; no introducir Zod ni propagar React Hook Form legacy.
- Usar `useAppDispatch` y `useAppSelector`; reutilizar slices, thunks, servicios y selectores existentes.
- Mantener una sola fuente de verdad para cada estado o filtro.
- Exponer una API clara desde el hook cuando extraerlo mejore reutilización, testabilidad o legibilidad. No crear hooks triviales por obligación.
- Mantener lógica compleja fuera del JSX.

## Rendimiento y efectos

- Incluir todas las dependencias reales de los efectos y limpiar recursos cuando corresponda.
- Usar `useCallback`, `useMemo` y `createSelector` cuando estabilicen una identidad consumida o eviten trabajo medible; no memoizar indiscriminadamente.
- Aplicar cancelación, protección por `requestId`, optimistic updates y rollback solo cuando la operación y la infraestructura lo requieran.
- Separar estados de carga y error de operaciones independientes.
- Acotar estados transitorios y reintentos a la operación que los originó. No usar un flag o recurso pendiente compartido para decidir acciones de flujos distintos; modelar el origen explícitamente cuando un mecanismo sirva a más de una mutación.
- Preferir una mutación atómica cuando el backend acepte datos y archivo en la misma petición. No dividirla en pasos ni crear recuperación parcial frontend salvo que el contrato remoto realmente sea bifásico.
- Hacer que el resultado de una acción represente su efecto real: no devolver éxito ni cerrar un overlay por completar una tarea auxiliar si la mutación principal no se ejecutó.
- No bloquear todas las vías de cierre de un modal o drawer para un fallo recuperable. Si una acción financiera ya terminó y una tarea auxiliar falla, exponer una salida explícita: reintento persistente en un lugar alcanzable, descarte informado o ambos.
- Limpiar los errores de mutación al abrir un flujo nuevo, al cambiar entidad/contexto o al descartar su estado transitorio; no mostrar un error de una operación anterior en un formulario limpio.
- Cuando una consulta pueda quedar obsoleta, comprobar identidad y contexto también en `catch` y `finally`: un abort, un unmount o un cambio de entidad no debe restaurar carga, error ni pendientes de la solicitud anterior.
- Si un pendiente recuperable representa una acción concreta, identificarlo por operación, entidad, contexto organizacional y datos necesarios para reintentar. No reutilizarlo para decidir acciones de otro documento, cliente o subsidiaria.
- Tras una mutación financiera exitosa, refrescar las fuentes autoritativas afectadas sin cancelar esa actualización por cerrar un detalle: detalle de la entidad, lista con filtros vigentes y resumen/KPI cuando existan.

## Checklists condicionales

Aplicar únicamente si la funcionalidad existe:

- Búsqueda debounced: evitar consultas intermedias, duplicadas y respuestas obsoletas.
- Paginación remota: preservar o limpiar metadata según contexto y normalizar páginas fuera de rango.
- Cambio de empresa, subsidiaria o sucursal: aplicar el patrón ZF-12 de propiedad de contexto. La respuesta/estado remoto conserva su `ownerContext` y `requestId`; el hook debe derivar sincrónicamente lista, meta, error e `isOpen` como vacíos/cerrados si el propietario no coincide con el contexto activo. Limpiar en `pending` y abortar siguen siendo necesarios, pero un `useEffect` de limpieza o cierre no basta porque ocurre después del render. Los overlays capturan la subsidiaria/sucursal al abrir y nunca mutan con el contexto que llegue después.
- Consultas relacionadas: construir parámetros desde una fuente común y aplicar las mismas guardas.
- Formularios en modal/drawer: descartar borrador al cancelar o cambiar entidad; conservarlo ante un error que mantenga abierto el overlay.
- Flujos encadenados: cubrir transición principal, fallo parcial y reintento, y comprobar que un pendiente de un flujo no altere otra acción disponible en la misma pantalla.

Retornar datos, estado, formulario y acciones de forma coherente con los consumidores reales, sin imponer una forma única cuando el módulo ya tenga un contrato establecido.
