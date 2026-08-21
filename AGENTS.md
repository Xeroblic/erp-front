# Codex en Zentria ERP

## Fuente de verdad

- Lee `CLAUDE.md` completo antes de diseñar, modificar o revisar código.
- `CLAUDE.md` prevalece ante ejemplos antiguos, documentación secundaria o instrucciones de un especialista.
- Inspecciona el módulo y sus pruebas vecinas antes de proponer una abstracción nueva.

## Estándar mínimo

- Mantén TypeScript estricto y cero `any`; usa `unknown` con narrowing cuando corresponda.
- En formularios nuevos usa Formik + Yup. No propagues React Hook Form ni introduzcas Zod.
- Reutiliza el Design System, `ApiService`, Redux Toolkit, autorización y contexto organizacional existentes.
- Usa imports `@/...`, lógica compleja fuera del JSX y componentes semánticos y accesibles.
- Conserva cambios ajenos del worktree y limita las modificaciones al alcance solicitado.

## Skills y especialistas

Los workflows reutilizables viven en `.agents/skills/`. Activa el skill mínimo que corresponda al trabajo:

- `architect`: arquitectura, límites, contratos y decisiones técnicas.
- `full-ts`: tipos, DTOs, contratos API y schemas Yup.
- `full-react`: hooks, Formik, Redux, efectos y lógica asíncrona.
- `ui-ux`: JSX, Design System, estados visuales y accesibilidad.
- `dev-implementador`: integración completa de una funcionalidad.
- `tester-qa`: auditoría, riesgos y pruebas.
- `test-designer`: identifica brechas materiales y diseña sólo las pruebas indispensables; puede concluir que no hacen falta pruebas nuevas y no sustituye la auditoría independiente de `qa`.
- `pr-publisher`: ejecuta únicamente operaciones de publicación autorizadas y verifica el PR remoto; no implementa, corrige ni fusiona código.
- `pr-readiness`: preflight y puerta de calidad para cambios con riesgo de contrato, estado, formulario, UI compartida o autorización.

Los agentes personalizados equivalentes están registrados en `.codex/config.toml`; los skills usan guion (`full-ts`) y las claves de agentes usan guion bajo (`full_ts`). Delega únicamente si el usuario lo pide o si una instrucción aplicable lo autoriza, y solo para subtareas independientes. Evita ediciones paralelas sobre los mismos archivos.

Para documentación de librerías o APIs cuya versión o superficie no esté clara, usa el MCP local `context7` de forma selectiva. No lo uses para comportamiento propio del repositorio, contratos internos ni preguntas que se resuelven leyendo el código local; así se evita añadir latencia y contexto innecesarios.

### Circuito de calidad antes de un PR

Activa `.agents/skills/pr-readiness/` antes de modificar cualquier cambio no trivial que toque al menos una de estas categorías: contrato/API, archivos, permisos, estado remoto, contexto organizacional, formulario, overlay, mutación, componente compartido o accesibilidad. La activación depende del riesgo del diff, no de que el usuario mencione un PR.

1. **Preflight observable:** produce un reporte breve y explícito, nunca sólo razonamiento interno, con base y HEAD, requisito autoritativo más reciente, contrato verificado, consumidores, riesgos activados, pruebas previstas y exclusiones. Para API, archivos, permisos, contexto o entidades financieras, solicita la contribución acotada de `architect`, `full_ts` o `full_react` según el riesgo dominante.
2. **Integración:** `implementer` implementa el alcance acordado y entrega la matriz `riesgo → evidencia`, cubriendo las transiciones pertinentes y no sólo el camino feliz.
3. **Auditoría independiente:** cuando el cambio se prepare para PR, esta regla autoriza delegar la auditoría acotada al agente `qa`. Entrégale el requisito autoritativo, base/HEAD, diff y pruebas, sin filtrarle las conclusiones del implementador. QA no edita los mismos archivos. Si no hay un agente independiente disponible, informa «autorrevisión» y deja la auditoría independiente pendiente.
4. **Ciclo de corrección:** después de cada fix, QA reverifica todos los hallazgos previos, el diff completo actualizado, las pruebas y documentación que puedan haber quedado obsoletas, y las nuevas transiciones introducidas por la corrección. El comentario editado más reciente es autoritativo.
5. **Cierre:** separa validaciones ejecutadas, deuda previa y comprobaciones manuales pendientes. No infieras una pasada global desde pruebas focalizadas o TypeScript.
6. **Publicación:** sólo con autorización explícita, el agente que cree o actualice el PR debe añadir el label `needs-review`, quitar `changes-requested` si está presente, conservar los demás labels y verificar ambos estados en el PR remoto antes de cerrar la tarea.

Los handoffs usan el formato común de `.agents/skills/pr-readiness/SKILL.md`. Cada agente reutiliza evidencia vigente y evita repetir descubrimiento ya cerrado; QA conserva independencia sobre conclusiones críticas y `pr_publisher` recalcula hechos remotos o volátiles.

El usuario conserva el control: la autorización de auditoría anterior no autoriza crear ramas, commits, push o PR, ni ampliar el alcance del issue.

## Verificación y entrega

- Ejecuta primero las pruebas afectadas; amplía a `pnpm test`, `pnpm lint` y `pnpm build` según el riesgo y el alcance.
- Antes de entregar, revisa `git diff`, `git diff --check` y separa errores nuevos de deuda preexistente.
- No crees ramas, commits ni PRs sin autorización explícita. Los PR apuntan a `develop` y su texto se entrega al usuario para revisión.
- Al cerrar una tarea de implementación autorizada, actualiza la bitácora diaria según `CLAUDE.md` y `bitacora_trabajo/instrucciones.md`.

### Formato obligatorio del texto de PR

Todo texto de PR se entrega en español, listo para copiar, y usa este orden exacto:

1. `## Resumen`: una explicación breve del problema y su resultado de negocio/técnico.
2. Una línea de métricas verificadas: `**+N / -N líneas** | **N commits** | **N suites / N pruebas aprobadas** | **\`tsc --noEmit\` = N errores**`. Omitir una métrica sólo si no se pudo obtener y explicar esa limitación en Verificación.
3. Separador `---`.
4. `## Cambios principales`, con los subtítulos que correspondan: `### Arquitectura`, `### Lógica`, `### Comportamiento por escenario` (tabla), `### UI` y `### Riesgo cubierto`.
5. Separador y `## Archivos modificados`, en tabla `Archivo | Cambio` que enumere únicamente archivos versionables incluidos en el PR.
6. Separador y `## Correcciones aplicadas`, en tabla `Hallazgo | Estado`, sólo cuando existan hallazgos o correcciones relevantes.
7. Separador y `## Verificación`, con comandos y resultados exactos; no afirmar pasadas globales desde pruebas focalizadas.
8. Separador y `## Deuda conocida (no bloqueante)`, separando deuda previa, limitaciones de entorno y comprobaciones manuales pendientes. Si no existe deuda, indicar explícitamente `Sin deuda conocida para este alcance.`

No inventar conteos, commits, archivos, riesgos, resultados de pruebas ni correcciones. Mantener las afirmaciones financieras, de permisos, contrato y estado remoto respaldadas por la evidencia de la revisión.

## Revisión de código

- Prioriza corrección, seguridad, permisos, contratos, concurrencia, accesibilidad y regresiones observables.
- Reporta hallazgos con archivo, evidencia y consecuencia; no conviertas preferencias de estilo en defectos.
- Comprueba que cada acción sensible usa el permiso y el scope exigidos por su endpoint real.
