---
name: pr-readiness
description: Preparar y auditar cambios no triviales de Zentria ERP mediante gates proporcionales de contrato, estado, formularios, UI y pruebas. Usar ante riesgo funcional o de contrato; no usar para cambios literales y deterministas de hasta 3 archivos de configuración, documentación o copy sin cambio de comportamiento.
---

## Texto UTF-8 desde el origen

- Al crear o editar texto, escribir la forma UTF-8 correcta desde el primer parche. No usar conversiones de codificacion, escapes ni sustituciones que puedan producir mojibake.
- Esta regla aplica a todo texto visible, mensajes, etiquetas, pruebas, comentarios y documentacion que se agregue o modifique.

# Puerta de calidad de PR para Zentria

Leer primero `CLAUDE.md`. Este skill no reemplaza los skills de arquitectura, tipos, React, UI o QA: selecciona qué evidencias deben existir antes de implementar y revisar. Aplicar sólo las categorías activadas por el cambio.

## Exclusión de vía rápida

No activar este skill para un cambio literal y determinista de hasta 3 archivos de configuración,
documentación o copy cuando el comentario autoritativo especifica por completo el resultado y no se
modifican lógica, API, permisos, estado, formularios, overlays, componentes compartidos ni
accesibilidad. En ese caso basta con revisar el archivo y su configuración vecina, ejecutar el check
directamente relacionado y `git diff --check`.

La preparación de un PR no convierte por sí sola un cambio trivial en no trivial. No delegar QA ni
solicitar especialistas para la vía rápida.

## Preflight mínimo

Antes de modificar, contrastar el requisito con el código, las pruebas vecinas y, si existe, el backend adyacente. Emitir un reporte observable para el implementador y QA; no dejarlo sólo en razonamiento interno:

```text
Base / HEAD:
Requisito autoritativo y versión o fecha:
Contrato verificado:
Fuentes autoritativas y consumidores:
Riesgos activados:
Pruebas previstas:
Exclusiones y pendientes:
```

Usar como requisito autoritativo la card o comentario editado más reciente. Confirmar la base real del PR, incluidas ramas intermedias, y revisar el rango `base...HEAD`; no inferirlo desde el nombre de la rama.

No presentar estos apuntes como diseño definitivo si falta evidencia. Primero verificarla.

## Categorías de riesgo

### Contrato remoto

Activar para API, DTO, archivos, permisos o una respuesta que cambie la UI. Confirmar en la implementación real: método, URL, serialización, nombre de cada campo multipart, nulos, wrapper de respuesta, validación y permiso efectivo. No deducirlos de una constante, un mock o un endpoint de nombre similar.

Si cambia un tipo o mapper compartido, localizar sus consumidores. Probar el payload que recibe el servicio, incluyendo opcionales ausentes, escritos y borrados.

### Estado remoto y contexto

Activar para cargas, mutaciones, filtros, contexto de empresa/sucursal/subsidiaria o acciones financieras. Definir la identidad de la solicitud y qué debe pasar con `pending`, carga y error al abortar, cerrar, cambiar entidad o cambiar contexto. Un estado recuperable identifica operación, entidad, contexto y los datos necesarios para reintentar.

Tras una mutación, recargar las vistas autoritativas afectadas. No cancelar una recarga independiente de lista o resumen sólo por cerrar el detalle que inició la acción.

Para recursos organizacionales, exigir el patrón ZF-12 de **propiedad de contexto**: el estado remoto identifica su `ownerContext` y `requestId`; el hook no renderiza datos, metadatos ni errores de un propietario distinto; y la selección/overlay conserva el contexto con que fue abierta. Limpiar en un efecto no es suficiente como barrera, porque React puede pintar un render intermedio antes de ejecutarlo.

### Formularios

Activar para Formik/Yup, creación o edición. Separar la validación visible de la normalización del payload. Cubrir campo ausente, escritura, borrado, submit duplicado, error que conserva el borrador y reapertura limpia. Un valor opcional no pierde sus límites ni su formato cuando está presente.

### Overlays y flujos parciales

Activar para modal, drawer, confirmación, upload o secuencia de más de una mutación. Recorrer éxito, fallo de cada paso, reintento, descarte, Cancelar, X, Escape, backdrop y cambio de entidad si existen. Nunca dejar al usuario sin salida tras un fallo recuperable ni dejar que un pendiente de A ejecute una acción sobre B.

Preferir la mutación atómica que ofrezca el backend. Si la segunda operación es real e inevitable, su recuperación debe sobrevivir al cierre del overlay y tener descarte explícito.

### UI compartida y accesibilidad

Activar para componentes reutilizados, filas accionables, controles protegidos o cambios de interacción. Verificar contrato público, mouse, teclado, foco, nombre accesible y handlers preservados. Un texto para lector de pantalla no puede contradecir disponibilidad, permiso o estado real del control.

## Publicacion de PR desde PowerShell

Antes de enviar texto en espanol a `gh pr create` o `gh pr edit`, fijar la salida de la sesion y del pipeline a UTF-8 sin BOM. No canalizar un here-string con la codificacion por defecto de Windows PowerShell, porque GitHub puede recibir signos `?` en lugar de caracteres acentuados.

```powershell
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom
@'
<cuerpo del PR>
'@ | gh pr edit <numero> --body-file -
```

Despues de crear o editar el PR, verificar el cuerpo remoto con `gh api repos/<owner>/<repo>/pulls/<numero> --jq .body`. Si falta algun acento, ene o simbolo esperado, corregirlo antes de entregar el enlace del PR.

## Estado de revisión en GitHub

Al crear un PR, incluir `--label needs-review` en `gh pr create`. Al actualizar un PR existente, añadir `needs-review` después de publicar los cambios o editar su cuerpo y, si los labels actuales incluyen `changes-requested`, quitarlo con `gh pr edit <numero> --add-label needs-review --remove-label changes-requested`. Conservar todos los demás labels.

Antes de declarar terminada la creación o actualización, verificar el estado remoto con `gh pr view <numero> --json labels --jq '.labels[].name'`: debe contener `needs-review` y no debe contener `changes-requested`. Si GitHub rechaza la transición o la verificación no puede completarse, informarlo como pendiente en vez de afirmar que el PR quedó listo para revisión.

## Evidencia antes de declarar listo

El implementador entrega esta matriz junto al cambio:

| Riesgo activado | Evidencia o prueba | Resultado | Pendiente |
| --- | --- | --- | --- |

QA recibe el requisito, base/HEAD, diff y pruebas como artefactos crudos. Debe intentar invalidar la identidad, el contrato y las transiciones sin asumir correctas las conclusiones del implementador. Si no intervino otro agente, llamar al resultado «autorrevisión», no «auditoría independiente».

Después de una corrección dentro de un flujo donde este skill sí está activo, reverificar todos los hallazgos anteriores y revisar otra vez el diff completo. Retirar o actualizar pruebas y documentación que describan la semántica reemplazada; buscar regresiones introducidas por el propio fix.

Ejecutar primero las pruebas afectadas; informar con precisión suites/casos ejecutados, TypeScript, lint del alcance y `git diff --check`. Para un flujo crítico de API, permisos o finanzas, ejecutar un smoke test integrado o E2E cuando el entorno lo permita; si no, declararlo pendiente con la limitación concreta.

No afirmar una pasada global desde una comprobación focalizada. Informar por separado deuda preexistente, limitaciones de entorno y comprobaciones manuales pendientes.

## Handoffs entre agentes

Cada etapa entrega sólo la evidencia reutilizable necesaria para la siguiente. Un consumidor no repite trabajo ya verificado salvo que falte la fuente, exista una contradicción o el dato pueda haberse vuelto obsoleto.

Formato común:

```text
Etapa y responsable:
Base / HEAD:
Requisito autoritativo:
Evidencia verificada y fuente:
Decisiones o resultados:
Riesgos y pruebas:
Cambios o archivos:
Pendientes y exclusiones:
Operaciones externas autorizadas:
```

- **Preflight → implementer:** entregar contrato, fuentes/consumidores, riesgos activados, pruebas previstas y límites. El implementador reutiliza la evidencia y sólo reabre puntos obsoletos, contradictorios o incompletos.
- **Implementer → QA:** entregar requisito, base/HEAD, diff y pruebas como artefactos crudos, además de la matriz riesgo-evidencia. QA puede reutilizar los artefactos, pero valida independientemente las conclusiones críticas.
- **QA → implementer:** cada hallazgo incluye identidad estable, archivo, evidencia, consecuencia y condición observable de cierre. Tras un fix, QA reverifica todos los hallazgos previos y el diff actualizado.
- **Cierre → pr_publisher:** entregar alcance, base/HEAD, archivos, validaciones exactas, deuda, cuerpo propuesto y operaciones autorizadas. `pr_publisher` no corrige código y recalcula los hechos remotos o volátiles antes de publicar.
