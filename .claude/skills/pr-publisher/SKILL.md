---
name: pr-publisher
description: Publicar o actualizar PRs autorizados de Zentria ERP, con métricas, UTF-8, labels y verificación remota; no usar para implementar, corregir ni fusionar código.
---

# Publicación de PR de Zentria

Leer `CLAUDE.md`, las secciones «Identidad de publicación» y «Formato obligatorio del texto de PR» de este mismo skill y la sección de publicación de `.claude/skills/pr-readiness/SKILL.md`. Exigir autorización explícita para cada mutación remota solicitada. Una autorización para commit, push, crear o actualizar PR no autoriza merge, release, tag, borrado de rama ni otra operación.

## Entrada requerida

Consumir un handoff de publicación con alcance, base/HEAD, requisito, archivos, validaciones exactas, deuda y operaciones autorizadas. Si falta un dato estable, solicitarlo al agente productor; recalcular siempre los hechos volátiles o remotos como SHA, commits, métricas, PR actual, labels y mergeabilidad.

Reutilizar las validaciones estables del handoff. No repetir TypeScript, suites globales, build ni una
auditoría ya cerrada durante la publicación, salvo que el contenido haya cambiado después de esas
validaciones o exista evidencia concreta de obsolescencia.

## Responsabilidad

- No modificar código funcional ni corregir hallazgos.
- Preservar cambios ajenos y preparar commits sólo cuando estén autorizados, incluyendo únicamente archivos del alcance aprobado.
- Antes de push o PR, revisar estado, diff completo contra la base real y `git diff --check`.
- Generar el cuerpo en español con el formato obligatorio de este skill y métricas verificadas, sin convertir pruebas focalizadas en una pasada global.
- En PowerShell, publicar el cuerpo como UTF-8 sin BOM y verificar el texto remoto mediante `gh api`.
- Al crear o actualizar el PR, añadir `needs-review`, quitar `changes-requested` si existe y conservar los demás labels.
- Verificar remotamente número/URL, base, `headRefOid`, cuerpo, labels, `mergeStateStatus` y `mergeable`. Si GitHub aún está calculando, reconsultar de forma acotada; no declarar éxito con estado desconocido.
- Detenerse al completar exactamente las operaciones autorizadas. Nunca fusionar, publicar releases, crear tags ni borrar ramas sin autorización explícita e independiente.

## Vía rápida para actualizar un PR existente

Cuando el cambio ya está validado, es literal y determinista, y el usuario autoriza commit, push y
actualización del PR:

1. Confirmar rama, archivos autorizados y `git diff --check`.
2. Crear el commit y hacer push sin ejecutar gates globales adicionales.
3. Conservar el cuerpo existente y modificar sólo los hechos obsoletos: métricas, archivos,
   correcciones o verificaciones afectadas.
4. Aplicar los labels requeridos y hacer una sola lectura final de SHA, cuerpo, labels y estado. Si
   GitHub devuelve un estado desconocido, reconsultar una vez y reportarlo como pendiente si persiste.

No regenerar todo el cuerpo, no repetir descubrimiento cerrado y no ampliar las pruebas por el solo
hecho de publicar. Objetivo operativo: completar esta fase en menos de 2 minutos cuando GitHub
responda normalmente.

## Salida

Entregar operaciones realizadas, PR/URL, SHA remoto, métricas verificadas, verificaciones ejecutadas, labels finales, mergeabilidad y pendientes. Si una operación falla o no pudo verificarse, indicarla como pendiente y no presentarla como completada.

## Identidad de publicación

Toda operación remota se ejecuta **bajo la cuenta de GitHub del usuario**, nunca bajo una identidad de
Claude, de un bot o de una GitHub App. El agente publica; la autoría es del usuario.

Antes de la primera operación remota de una sesión, comprobar la identidad activa:

```bash
gh auth status --active
git config user.name && git config user.email
```

Requisitos:

- La cuenta activa de `gh` debe ser la del usuario y provenir de su credencial local (keyring o
  `hosts.yml`). Si `gh auth status` muestra que el token viene de la variable de entorno `GH_TOKEN` o
  `GITHUB_TOKEN`, detenerse y avisar: ese token puede pertenecer a una app o a un bot. No exportar ni
  fijar esas variables para publicar.
- El commit se firma con la identidad de `git config`. No usar `--author`, `--committer`, ni
  `git -c user.name=... -c user.email=...` para sustituirla.
- **No añadir trailers ni firmas de Claude.** Ningún commit lleva `Co-Authored-By: Claude`, y ningún
  cuerpo de PR lleva una línea de «Generated with Claude Code» ni equivalente. Los trailers
  `Co-authored-by` se reservan para personas reales del equipo que participaron en el cambio.
- El texto del PR se redacta en primera persona del equipo, sin declarar autoría de herramienta.

Si la identidad no puede verificarse, informarlo como pendiente y entregar los comandos al usuario en
lugar de publicar con una cuenta incierta.

## Formato obligatorio del texto de PR

Todo texto de PR se entrega en español y usa este orden exacto:

1. `## Resumen`: una explicación breve del problema y su resultado de negocio/técnico.
2. Una línea de métricas verificadas: `**+N / -N líneas** | **N commits** | **N suites / N pruebas aprobadas** | **\`tsc --noEmit\` = N errores\*\*`. Omitir una métrica sólo si no se pudo obtener y explicar esa limitación en Verificación.
3. Separador `---`.
4. `## Cambios principales`, con los subtítulos que correspondan: `### Arquitectura`, `### Lógica`, `### Comportamiento por escenario` (tabla), `### UI` y `### Riesgo cubierto`.
5. Separador y `## Archivos modificados`, en tabla `Archivo | Cambio` que enumere únicamente archivos versionables incluidos en el PR.
6. Separador y `## Correcciones aplicadas`, en tabla `Hallazgo | Estado`, sólo cuando existan hallazgos o correcciones relevantes.
7. Separador y `## Verificación`, con comandos y resultados exactos; no afirmar pasadas globales desde pruebas focalizadas.
8. Separador y `## Deuda conocida (no bloqueante)`, separando deuda previa, limitaciones de entorno y comprobaciones manuales pendientes. Si no existe deuda, indicar explícitamente `Sin deuda conocida para este alcance.`

No inventar conteos, commits, archivos, riesgos, resultados de pruebas ni correcciones. Mantener las afirmaciones financieras, de permisos, contrato y estado remoto respaldadas por la evidencia de la revisión.

Al actualizar un PR existente, conservar su cuerpo y modificar sólo métricas, archivos, correcciones o
validaciones que hayan quedado obsoletos. No regenerar ni revalidar secciones sin cambios.

El PR siempre apunta a `develop`.
