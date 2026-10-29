# Configuración de Claude Code — Zentria ERP

Esta carpeta **se versiona**: al clonar el repo, la configuración de agentes ya viene puesta.
La única excepción es `settings.local.json` (ajustes personales), que está en `.gitignore`.

La fuente de verdad de las reglas del proyecto sigue siendo `CLAUDE.md`. Todo lo de acá lo
complementa; ante cualquier conflicto, manda `CLAUDE.md`.

## Contenido

| Ruta                | Qué es                                                            |
| ------------------- | ----------------------------------------------------------------- |
| `settings.json`     | Permisos e hooks del repositorio, compartidos por todo el equipo. |
| `agents/*.md`       | Subagentes delegables, uno por rol.                               |
| `skills/*/SKILL.md` | Criterios de cada rol. **Copia canónica**, también la lee Codex.  |
| `hooks/*.mjs`       | Guardas ejecutables que corren en cada edición o comando.         |

## Subagentes

| Agente          | Para qué                                                 | Edita código |
| --------------- | -------------------------------------------------------- | ------------ |
| `architect`     | Límites, contratos, diseño modular, decisiones técnicas. | No           |
| `full-ts`       | Tipos, DTOs, contratos API, schemas Yup.                 | Sí           |
| `full-react`    | Hooks, Formik, Redux, efectos, concurrencia.             | Sí           |
| `ui-ux`         | JSX, Design System, estados visuales, accesibilidad.     | Sí           |
| `implementer`   | Integración completa de una funcionalidad cohesiva.      | Sí           |
| `qa`            | Auditoría independiente y pruebas mínimas.               | Sí           |
| `test-designer` | Decide qué pruebas hacen falta, antes de escribirlas.    | No           |
| `pr-publisher`  | Publica PRs autorizados y verifica su estado remoto.     | No           |

La delegación es **explícita**: se usa un subagente si lo pedís o si una instrucción aplicable
lo autoriza, y sólo para subtareas independientes. Evitá ediciones paralelas sobre los mismos
archivos: `qa` no toca los archivos que está tocando `implementer`.

## Hooks

**`identidad-github.mjs`** (`PreToolUse` sobre `Bash`) — hace cumplir §14 de `CLAUDE.md`.
El comando **no llega a ejecutarse**, y se explica el motivo, en estos tres casos:

- se intenta publicar con `GH_TOKEN` o `GITHUB_TOKEN` en el entorno (puede ser de una app o un bot);
- se intenta sustituir la autoría con `--author`, `--committer` o `git -c user.email=...`;
- se intenta añadir **atribución de herramienta** al commit o al cuerpo del PR: trailers
  `Co-Authored-By: Claude`, `--trailer` equivalente, direcciones `noreply@anthropic.com` o firmas
  tipo «Generated with Claude Code».

En otras palabras: **ningún commit ni cuerpo de PR de este repositorio lleva atribución de
herramienta**, y el hook lo impide aunque se intente.

La tercera guarda inspecciona el comando **y el contenido de los archivos que referencia**
(`git commit -F`, `gh pr create --body-file`, `--template`), porque el mensaje no siempre va
escrito en la línea de comandos. Acepta rutas relativas y rutas MSYS de Git Bash (`/c/...`).

**`formatear.mjs`** (`PostToolUse` sobre `Edit`/`Write`) — pasa Prettier al archivo tocado, para
que un cambio funcional no llegue al PR con ruido de formato. Nunca bloquea: si Prettier falla o
el archivo está en `.prettierignore`, sale en 0.

Probarlos a mano:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"git commit -m \"x\n\nCo-Authored-By: Claude\""}}' | node .claude/hooks/identidad-github.mjs
```

## Permisos

`settings.json` divide los comandos en tres grupos:

- **allow** — lectura y verificación: `test:run`, `test:related`, `lint:changed`, `typecheck`,
  `git status/diff/log`, `gh pr view/list/diff` y las 13 herramientas de lectura de Laravel
  Boost. Corren sin preguntar.
- **ask** — operaciones remotas y commits: `git push`, `git commit`, `gh pr create/edit/merge`,
  `gh release`, `git tag`. Cada una pide confirmación por separado.
- **deny** — nunca: `push --force`, `reset --hard`, `commit --author`, escribir en `dist/` o
  `node_modules/`, leer `.env.local` y leer los archivos generados enormes (ver abajo).

Para ajustes tuyos que no deban versionarse, creá `.claude/settings.local.json` con la misma forma.

## Costo de contexto

Seis decisiones de esta configuración existen para no desperdiciar tokens.

### Comandos de verificación: usá siempre el acotado

| En vez de    | Usá                                | Por qué                                                     |
| ------------ | ---------------------------------- | ----------------------------------------------------------- |
| `pnpm test`  | `pnpm run test:related <archivos>` | `test` es `vitest` sin `run`: modo watch, no termina nunca. |
| `pnpm lint`  | `pnpm run lint:changed`            | El completo son **9.033 líneas y 7.553 problemas**.         |
| `tsc` suelto | `pnpm run typecheck`               | Un solo comando, ya en el `allow`.                          |

```bash
pnpm run test:related src/ruta/al/archivo.tsx   # sólo las suites que tocan ese archivo
pnpm run lint:changed                            # sólo los archivos cambiados vs develop
pnpm run lint:changed origin/main                # contra otra base
pnpm run typecheck
```

**1. `pnpm test` cuelga la sesión.** Es `vitest` sin `run`, o sea modo watch: la llamada no
termina, se agota en el timeout y devuelve la UI de watch en vez de resultados.

**1-bis. `pnpm lint` completo es inservible como señal.** Devuelve 7.553 problemas preexistentes
en 9.033 líneas — más de 100k tokens si se vuelca a contexto — y no dice nada sobre si _tu_
cambio introdujo algo nuevo. Medido sobre un rango de 283 archivos, `lint:changed` reporta 96
problemas en vez de 7.553. El script (`scripts/lintChanged.mjs`) invoca eslint **por lotes**,
porque Windows corta la línea de comandos alrededor de los 8191 caracteres y con ~280 archivos
falla en vez de lintear.

Ampliá a `test:run` o al lint completo sólo cuando el alcance lo justifique, y reportá por
separado los hallazgos nuevos de la deuda preexistente.

**2. Lecturas gigantes bloqueadas.** `Grep` y `Glob` respetan `.gitignore`, pero `Read` no. Una
sola lectura de `pnpm-lock.yaml` (355 KB), `stats.html` (2,4 MB) o `public/features.json`
(199 KB) se come una porción enorme de la sesión, así que están en `deny`.

**3. `CLAUDE.md` se carga entero en cada sesión.** Por eso la receta de "creá una página X" vive
en el skill `nueva-pagina` y no en `CLAUDE.md`: son ~120 líneas que sólo sirven al crear una
página. Antes de agregar contenido a `CLAUDE.md`, preguntate si es una regla que aplica siempre
o una referencia que aplica a veces. Lo segundo va a un skill.

**4. MCP: conectá sólo lo que uses.** Cada servidor MCP inyecta sus definiciones de herramientas
en **todas** las requests de la sesión, se usen o no. Por eso hay exactamente tres conectados y
ninguno más — ver la sección siguiente. `enableAllProjectMcpServers: false` con
`enabledMcpjsonServers: ["laravel-boost"]` habilita ese servidor concreto sin aprobar en bloque
cualquier otro que aparezca después en `.mcp.json`.

**5. Una respuesta MCP puede ser enorme.** El `route:list` del backend pesa **132 KB (~33.000
tokens)**: pedir «todas las rutas» consume media sesión para responder una pregunta puntual.
`MAX_MCP_OUTPUT_TOKENS: 25000` pone un techo duro, pero el techo trunca, no filtra: preguntá por
el recurso concreto (`list-routes` con filtro de path o nombre) en vez de traer el catálogo entero
y leerlo después.

**6. El backend se lee sin fricción.** `additionalDirectories: ["../zentria-erp-back"]` permite
leer su código sin pedir permiso archivo por archivo. Sigue siendo **sólo lectura**: `Edit` y
`Write` sobre esa ruta están denegados. Para una pregunta de contrato suele ser más barato un
`list-routes` filtrado que abrir tres controladores.

Los agentes mecánicos (`pr-publisher`, `test-designer`) corren en `sonnet`; el resto hereda el
modelo de la sesión.

## Relación con Codex y OpenCode

`.codex/` y `AGENTS.md` están versionados igual que esta carpeta. Aparecen listados en
`.gitignore`, pero esas entradas no hacen nada: se agregaron después de que los archivos ya
estaban trackeados, y `.gitignore` no destrackea.

Sus definiciones ya apuntan a `.claude/skills/`, de modo que **hay una sola copia de los
criterios**: editala acá y las tres herramientas quedan alineadas. `opencode.json` sí es local
(nunca se trackeó) y también quedó repuntado.

`.agents/skills/` es una copia histórica que ya no lee nadie, todavía trackeada. Mantenerla sólo
crea deriva; se puede borrar sin perder nada:

```bash
git rm -r --quiet .agents && rm -rf .agents
```

## Servidores MCP

Tres, y con un criterio de uso distinto cada uno. Usar el mínimo que responda la pregunta.

| Servidor          | Dónde se configura       | Para qué                                                                 |
| ----------------- | ------------------------ | ------------------------------------------------------------------------ |
| **Linear**        | conector de cuenta       | Leer el requisito autoritativo: issue, card, comentario más reciente.    |
| **Context7**      | conector de cuenta       | API versionada de una librería externa cuando la superficie no es clara. |
| **Laravel Boost** | `.mcp.json` de este repo | Contrato real del backend: rutas, esquema, config, versiones, logs.      |

### Enrutamiento

- **Linear en modo lectura.** Sirve para confirmar qué se pidió y cuál es el comentario
  autoritativo. **No** actualices issues, no cambies estados ni escribas comentarios salvo que el
  usuario lo pida explícitamente.
- **Context7 sólo para librerías externas.** No lo uses para comportamiento propio del
  repositorio, contratos internos ni preguntas que se resuelven leyendo el código local: añade
  latencia y contexto sin aportar nada que no esté acá.

## Laravel Boost: el backend es de sólo lectura

**Regla dura: en este repositorio no se modifica nada del backend.** Boost existe para
_entender_ `zentria-erp-back` desde el front — leer el contrato real en vez de deducirlo de un
nombre parecido, de una constante vecina o de cómo lo llama el frontend.

Es la fuente correcta para: método y URL de un endpoint, nombre de cada campo, nullabilidad,
wrapper de respuesta, **permiso efectivo que exige la ruta** y reglas de validación. Justamente
lo que en este repo ya causó desalineamientos (una vista pidiendo `view-transfer` mientras su
API exigía `view-inventory-movements`).

### Qué está habilitado y qué no

De las 16 herramientas que expone Boost, 13 son de lectura y están en `allow`, así que corren sin
preguntar: `application-info`, `list-routes`, `database-schema`, `database-connections`,
`get-config`, `list-available-config-keys`, `list-available-env-vars`, `list-artisan-commands`,
`get-absolute-url`, `last-error`, `read-log-entries`, `browser-logs` y `search-docs`.

Tres están en `deny` y no se pueden ejecutar:

| Herramienta       | Por qué                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| `tinker`          | Ejecuta PHP arbitrario dentro de la app: puede escribir cualquier cosa. |
| `database-query`  | Corre SQL contra la base del backend.                                   |
| `report-feedback` | Envía datos hacia afuera del entorno.                                   |

Se refuerza con `Edit`/`Write` denegados sobre `../zentria-erp-back/**` y con los artisan que
mutan (`migrate`, `db:`, `tinker`, `make:`) bloqueados vía `docker exec`.

Para leer el esquema no hace falta `database-query`: `database-schema` lo entrega sin ejecutar SQL.

### Requisitos

El backend vive en `../zentria-erp-back` y corre en Docker; PHP no está instalado en el host, así
que el servidor se invoca dentro del contenedor:

```bash
docker exec -i erp-app php artisan boost:mcp
```

El stack del backend tiene que estar levantado (`docker ps` debe mostrar `erp-app`). Si tu
contenedor se llama distinto, exportá `ZENTRIA_BACKEND_CONTAINER`; `.mcp.json` lo toma de ahí y
usa `erp-app` por defecto.

Si `erp-app` no está corriendo, Boost no responde: verificá el contrato leyendo el código del
backend, sin inventarlo ni deducirlo del frontend.
