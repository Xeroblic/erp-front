---
name: dev-implementador
description: Implementar e integrar cambios frontend completos en Zentria ERP a partir de requisitos o diseños, conectando tipos, lógica, UI, estado y pruebas. Usar para ensamblaje o implementación final de una funcionalidad.
---

# Implementación frontend de Zentria

Leer primero `CLAUDE.md`, inspeccionar el módulo y preservar cambios ajenos del worktree. Puede implementar componentes, hooks, tipos, slices y pruebas cuando formen un cambio cohesivo; no depende de outputs previos de otros agentes.

Para cualquier cambio no trivial con riesgo de contrato, estado remoto, formulario, overlay, componente compartido o autorización, leer antes `.agents/skills/pr-readiness/SKILL.md` y emitir su reporte de preflight. Aplicar únicamente las categorías activadas por el diff. No sustituir esta preparación observable por razonamiento interno ni por una lista genérica de componentes.

## Implementación

- Reutilizar contratos, componentes, servicios y patrones existentes.
- Mantener TypeScript estricto, Formik + Yup, autorización, contexto organizacional y Design System conforme a `CLAUDE.md`.
- Mantener lógica compleja fuera del JSX sin fragmentar componentes pequeños innecesariamente.
- Manejar nullabilidad según contratos reales; no aplicar optional chaining de forma mecánica para ocultar contratos incorrectos.
- Usar elementos semánticos y estados visibles de carga, error, vacío y submit cuando correspondan.
- Verificar imports y rutas reales; no copiar APIs de ejemplos hipotéticos.
- Confirmar método, formato de payload y permiso de cada endpoint real antes de reutilizar una mutación o constante cercana. Acciones distintas requieren autorización distinta cuando el backend así lo define.
- Preferir el contrato atómico del backend para datos y archivos; implementar pasos y reintentos parciales únicamente en operaciones que el API exponga separadas.
- Ante flujos encadenados, decidir desde el contrato remoto qué ocurre si falla cada paso. No dejar una entidad financiera creada sin su respaldo cuando el backend ofrece transacción atómica; si el segundo paso es inevitable, conservar una recuperación alcanzable sin encerrar al usuario en un overlay.
- Limpiar mensajes de mutación al iniciar un flujo nuevo y actualizar documentación o pruebas cuando una corrección cambie el contrato efectivo.
- Antes de implementar una integración sensible, contrastar rutas, request, validación y transacciones con el backend adyacente; no inferir contratos desde nombres de acciones ni desde una implementación vecina.
- Para mutaciones financieras, invalidar o recargar detalle, lista usando los filtros activos y resumen/KPI pertinentes. El cierre de un drawer o modal no debe abortar una actualización independiente de la lista o del resumen.
- Mantener cualquier pendiente recuperable acotado a su acción, entidad, contexto y payload/archivo. Al abortar, descartar o cambiar contexto, impedir que `catch` o `finally` reanimen ese pendiente o su error.
- Para recursos dependientes de empresa, subsidiaria o sucursal, aplicar el patrón ZF-12 de **propiedad de contexto**: el slice conserva `ownerContext`/`requestId`, el hook oculta sincrónicamente datos, meta y error cuyo propietario no coincide con el contexto activo, y los overlays guardan el contexto con que fueron abiertos. No usar un `useEffect` de cierre o limpieza como única barrera, porque deja un render intermedio con datos o mutaciones cruzadas.

## Integración segura

- Limitar formato y cambios mecánicos al alcance.
- Antes de reemplazos globales, contar coincidencias; después, revisar cada modificación.
- Si cambia una utilidad o contrato compartido, localizar consumidores y actualizar la fuente canónica.
- Ejecutar TypeScript, lint y pruebas proporcionales al riesgo, empezando por el archivo afectado.
- Revisar `git diff` y `git diff --check` antes de entregar.
- Revisar lint contra la base para no clasificar errores nuevos como deuda global. Conservar UTF-8 sin BOM salvo que el archivo ya use otra codificación deliberadamente.
- Si el lint global no es ejecutable por deuda o configuración previa, ejecutar el alcance más específico viable y reportar el impedimento con evidencia, sin reformatear masivamente archivos ajenos.
- Si una corrección cambia la semántica de un flujo, retirar o reescribir pruebas y documentación que describan el comportamiento anterior.
- No declarar listo un flujo por cubrir el camino feliz: para cada mutación u overlay activado, cubrir la transición de fallo, cancelación/descarte y reapertura o cambio de entidad/contexto que corresponda.

Las políticas generales de ramas, commits, PR y bitácora viven en `CLAUDE.md`; aplicarlas cuando el usuario haya autorizado esas acciones. No crear commits, ramas o PRs por iniciativa propia.

Al entregar, incluir la matriz `riesgo → evidencia`, resultado, archivos modificados, validaciones y riesgos pendientes. No limitar la respuesta a código si el usuario necesita trazabilidad.
