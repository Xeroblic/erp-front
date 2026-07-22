# Bitácora de Trabajo — Zentria ERP Frontend

Esta carpeta es el **registro cronológico del trabajo** realizado en el proyecto. Su
objetivo es dejar constancia diaria de qué se hizo, en qué rama y por qué, de modo que
luego se pueda **generar un informe** que justifique el trabajo (horas, avances, tareas
entregadas).

No es documentación técnica del código (eso vive en `CLAUDE.md` y en el propio repo).
Aquí se anota **actividad**: cambios, decisiones, problemas y resultados del día.

---

## 1. Regla principal

- **Un archivo por día.** Nombre obligatorio: **`dd-mm-yyyy.md`** (ej. `24-06-2026.md`).
- **Prohibido** crear archivos satélite por tema (`08-07-2026-cleanup.md`,
  `analisis-foo.md`, etc.). Todo el trabajo del día va en el único archivo de esa fecha.
- Si hay varias sesiones o varios frentes, se organizan como **temas** dentro del mismo
  archivo (ver §3).
- El registro debe ser entendible por alguien que no estuvo presente: *qué*, *dónde*
  (rama) y *por qué*.

---

## 2. Nombre de los archivos

```
bitacora_trabajo/
├── instrucciones.md      ← este archivo (no se borra)
├── 24-06-2026.md         ← registro del 24 de junio de 2026
├── 25-06-2026.md
└── ...
```

- Formato: `dd-mm-yyyy.md` (día-mes-año, ceros a la izquierda).
- Un archivo = un día calendario.
- Único archivo extra permitido: `instrucciones.md`.

---

## 3. Estructura de cada archivo diario

Orden fijo:

1. **Título** con la fecha.
2. **Temas del día** — índice al inicio (obligatorio). Sirve para buscar en el repo
   (`grep`, búsqueda del IDE, informe semanal) si ese día se tocó un tema.
3. **Bloques por tema** — detalle separado; cada tema indica rama y, si aplica, hora/sesión.

````markdown
# Bitácora — 24-06-2026

## Temas del día

- JWT / refresh de sesión
- Login — recordar cuenta
- Integraciones Woo — menú productos sincronizados

---

## Tema: JWT / refresh de sesión

**Rama:** `fix/jwt-refresh-session-expiry-1h` · **Sesión:** 22:10 – 23:00

- **[fix]** Ajuste del margen de refresh antes del expiry del access token.
- **Decisión:** TTL leído desde env (`VITE_JWT_REFRESH_*`).
- **PR / commit:** #…

## Tema: Login — recordar cuenta

**Rama:** `feat/login-recordar-cuenta` · **Sesión:** 23:23 – 23:37

- **[feat]** Checkbox “Recordar cuenta” y persistencia del identificador en localStorage.
````

### Reglas del índice «Temas del día»

- Lista corta de **nombres de tema** (módulo, bug o iniciativa), no párrafos.
- Cada ítem del índice debe tener un `## Tema: …` homólogo más abajo (mismo wording o
  muy cercano, para que un `Ctrl+F` del índice caiga en el detalle).
- Si el día solo tuvo un tema, el índice lleva una sola viñeta igual.
- Al agregar trabajo nuevo el mismo día: **actualizá el índice** y agregá/ampliá el bloque
  del tema (no crees otro archivo).

### Convención de etiquetas (alineadas con los commits)

| Etiqueta     | Cuándo usarla                                 |
|--------------|-----------------------------------------------|
| `[feat]`     | Nueva funcionalidad / página / módulo         |
| `[fix]`      | Corrección de bug                             |
| `[style]`    | Cambios visuales / UI sin lógica nueva        |
| `[refactor]` | Reorganización sin cambiar conducta           |
| `[docs]`     | Documentación                                 |
| `[chore]`    | Config, dependencias, limpieza de repo        |
| `[test]`     | Pruebas                                       |

---

## 4. Qué anotar en cada entrada (checklist)

1. **Qué** se hizo (acción concreta y archivo/módulo).
2. **En qué rama** (`develop`, `feat/...`, etc.).
3. **Por qué**, si no es obvio.
4. **Referencias**: PR (`#40`), commit, issue.
5. **Estado**: terminado, en progreso o pendiente.
6. **Problemas / decisiones** relevantes para el informe.

> Entradas **resumidas**. No copies código completo; ruta + frase clara.

---

## 5. Plantilla rápida (copiar y pegar)

```markdown
# Bitácora — dd-mm-yyyy

## Temas del día

- Tema A
- Tema B

---

## Tema: Tema A

**Rama:** `<rama>` · **Sesión:** HH:MM – HH:MM

- **[tipo]** Descripción breve (módulo/archivo).
- **Decisión:** ...
- **Pendiente:** ...
- **PR / commit:** #...

## Tema: Tema B

**Rama:** `<rama>`

- **[tipo]** ...
```

---

## 6. Cómo se usa para el informe y la búsqueda

- **Buscar un tema en el tiempo:** buscar el nombre del tema; los hits en
  `## Temas del día` marcan **qué días** lo tocaron; el `## Tema: …` del mismo archivo
  tiene el detalle.
- **Informe semanal/mensual:** recorrer `dd-mm-yyyy.md` en orden y resumir por etiquetas,
  ramas y PRs.

Por eso el índice inicial y las etiquetas deben ser **consistentes**.

---

## 7. Migración / archivos prohibidos

Si encontrás restos de formatos viejos:

| Incorrecto | Correcto |
|------------|----------|
| `08-07-2026-cleanup.md` | Contenido dentro de `08-07-2026.md` como un `## Tema:` |
| `analisis-foo.md` suelto | Tema del día en que se hizo el análisis |
| Varios archivos el mismo día | Un solo `dd-mm-yyyy.md` |
