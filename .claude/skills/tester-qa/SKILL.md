---
name: tester-qa
description: Auditar código y crear pruebas de Zentria ERP para seguridad, permisos, concurrencia, edge cases y regresiones con Vitest, React Testing Library o Playwright. Usar para QA, testing, revisión o análisis de riesgos.
---

# QA de Zentria

Leer primero `CLAUDE.md`, el diff y las pruebas vecinas. Evaluar riesgos reales del cambio sin asumir características que no existen.

Cuando la auditoría sea previa a un PR, leer también `.claude/skills/pr-readiness/SKILL.md`. Recibir requisito autoritativo, base/HEAD, diff y pruebas como artefactos crudos; no aceptar como evidencia una afirmación del implementador sin seguir el contrato, la ruta de ejecución y la prueba hasta su efecto observable. Si no interviene otro agente, identificar el resultado como autorrevisión.

## Auditoría

- Priorizar hallazgos por impacto y aportar archivo, evidencia y consecuencia.
- Revisar contratos, permisos, doble envío, estados remotos, errores y accesibilidad cuando estén en alcance.
- Verificar autorización con la abstracción real: ProtectedRoute, PermissionGuard, ProtectedButton, `useAuthorization` o `useCan`.
- Contrastar cada acción con el permiso exigido por su endpoint; nombres de constantes distintos no prueban separación si resuelven a la misma cadena.
- Evaluar XSS y saneamiento en el punto real de entrada y renderizado; no declarar vulnerabilidad solo por aceptar texto.
- Revisar dependencias y limpieza de efectos sin exigir cancelación a operaciones que no la soportan o necesitan.
- Comparar cambios compartidos contra la base y reportar modificaciones ajenas al objetivo.
- Separar deuda preexistente de errores introducidos por el diff. Revisar también encoding, reglas de lint y métricas declaradas; distinguir archivos de prueba, suites y casos ejecutados.
- Para cada comentario de corrección, verificar tanto el síntoma como la causa raíz: una prueba que sólo fija el síntoma no cierra un riesgo de transición, identidad o contrato.
- Después de cada corrección, reverificar todos los hallazgos anteriores y el diff completo, retirar conclusiones basadas en comentarios reemplazados y buscar regresiones introducidas por el propio fix.

## Pruebas

- Antes de proponer una prueba nueva, identificar el riesgo observable introducido o descubierto y comprobar si una prueba vecina ya lo protege. Si no existe una brecha de cobertura material, responder explícitamente que no se necesitan pruebas nuevas.
- Considerar necesaria una prueba sólo cuando protege un requisito autoritativo, una regresión reproducible o una transición del diff cuyo fallo afectaría contrato, datos, permisos, dinero, recuperación, contexto organizacional o accesibilidad.
- No crear pruebas para aumentar conteos, repetir cobertura equivalente, fijar texto incidental, verificar constantes o getters triviales, demostrar comportamiento propio del framework ni recorrer combinaciones que no representen riesgos distintos.
- Preferir ampliar una prueba existente o usar casos parametrizados antes que abrir un archivo o suite nueva. Elegir el nivel más barato que observe el riesgo: unitario primero, RTL para integración de UI/estado y E2E sólo para un flujo crítico que no quede protegido adecuadamente en niveles inferiores.
- Probar contratos, reglas de negocio y transiciones observables mediante roles, nombres accesibles, estado y payloads.
- Evitar aserciones sobre clases, jerarquía incidental, variables privadas u orden interno salvo que sean contrato público.
- Evitar pruebas tautológicas: además de comparar el componente con una constante, comprobar el valor contractual o que permisos que deben ser independientes sean realmente distintos.
- Ejecutar primero las pruebas afectadas; ampliar a suite completa según alcance, riesgo y costo.
- Ejecutar E2E cuando cambie un flujo crítico o transversal, no por una lista histórica de módulos.
- No depender de una PR concreta como referencia permanente.

## Matrices condicionales

Aplicar únicamente si la funcionalidad existe:

- Debounce: cero consultas intermedias, una al estabilizar y rechazo de respuestas obsoletas.
- Paginación: metadata, recarga, cambio de contexto y páginas fuera de rango.
- Contexto organizacional: verificar el patrón ZF-12 de propiedad de contexto: al cambiar empresa, subsidiaria o sucursal, el primer render ya debe ocultar datos/meta/error ajenos y cerrar overlays cuya selección fue abierta en otro contexto. Probar el cambio durante debounce y una mutación en vuelo; un `useEffect` de limpieza posterior no es evidencia suficiente.
- Formularios: ausencia, límites, submit duplicado, error sin cierre y reapertura limpia.
- Flujos con varias mutaciones: provocar un fallo en una acción y ejecutar después otra acción vecina para detectar contaminación de estado, falsos éxitos y reintentos dirigidos al recurso equivocado.
- Flujos financieros: comprobar que una mutación exitosa actualiza detalle, lista con filtros vigentes y resumen cuando existan; comprobar además que cerrar el detalle no cancela una recarga independiente.
- Solicitudes obsoletas: simular cambio de entidad, contexto, cierre o descarte mientras una petición está en vuelo y verificar que sus `catch`/`finally` no restauran errores, carga ni pendientes en el destino nuevo.
- Permisos: afirmar el valor efectivo enviado al guard y el scope, además de la visibilidad. No aceptar pruebas que solo comparen una constante consigo misma o que no distingan dos permisos requeridos por endpoints distintos.
- Overlays con fallos parciales: comprobar Cancelar, X, Escape, backdrop y cierre del contenedor. Un reintento persistente debe seguir siendo alcanzable después de cerrar el overlay; si no lo es, el usuario debe poder descartar el pendiente de forma explícita.
- Archivos: contrastar extensión, MIME y validación del backend; cubrir tipos permitidos que algunos navegadores reportan sin MIME o como `application/octet-stream`.
- Componentes compartidos: mouse, teclado, foco y preservación de handlers.
- Feature flags: ausencia fail-closed y pruebas independientes del `.env` local.

Si solo se solicita auditoría, no modificar código. Si se solicitan tests, crear únicamente el conjunto mínimo que cierre brechas de cobertura materiales; cero pruebas nuevas es un resultado válido y debe justificarse con la cobertura existente.
