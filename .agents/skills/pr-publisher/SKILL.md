---
name: pr-publisher
description: Publicar o actualizar PRs autorizados de Zentria ERP, con métricas, UTF-8, labels y verificación remota; no usar para implementar, corregir ni fusionar código.
---

# Publicación de PR de Zentria

Leer `CLAUDE.md`, `AGENTS.md` y la sección de publicación de `.agents/skills/pr-readiness/SKILL.md`. Exigir autorización explícita para cada mutación remota solicitada. Una autorización para commit, push, crear o actualizar PR no autoriza merge, release, tag, borrado de rama ni otra operación.

## Entrada requerida

Consumir un handoff de publicación con alcance, base/HEAD, requisito, archivos, validaciones exactas, deuda y operaciones autorizadas. Si falta un dato estable, solicitarlo al agente productor; recalcular siempre los hechos volátiles o remotos como SHA, commits, métricas, PR actual, labels y mergeabilidad.

Reutilizar las validaciones estables del handoff. No repetir TypeScript, suites globales, build ni una
auditoría ya cerrada durante la publicación, salvo que el contenido haya cambiado después de esas
validaciones o exista evidencia concreta de obsolescencia.

## Responsabilidad

- No modificar código funcional ni corregir hallazgos.
- Preservar cambios ajenos y preparar commits sólo cuando estén autorizados, incluyendo únicamente archivos del alcance aprobado.
- Antes de push o PR, revisar estado, diff completo contra la base real y `git diff --check`.
- Generar el cuerpo en español con el formato obligatorio de `AGENTS.md` y métricas verificadas, sin convertir pruebas focalizadas en una pasada global.
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
