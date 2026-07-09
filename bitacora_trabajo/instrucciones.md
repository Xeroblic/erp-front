# Bitácora de Trabajo — Zentria ERP Frontend

Esta carpeta es el **registro cronológico del trabajo** realizado en el proyecto. Su
objetivo es dejar constancia diaria de qué se hizo, en qué rama y por qué, de modo que
luego se pueda **generar un informe** que justifique el trabajo (horas, avances, tareas
entregadas).

No es documentación técnica del código (eso vive en `CLAUDE.md` y en el propio repo).
Aquí se anota **actividad**: cambios, decisiones, problemas y resultados del día.

---

## 1. Regla principal

- **Un archivo por día.** El nombre del archivo es la fecha en formato **`dd-mm-yyyy.md`**
  (ej. `24-06-2026.md`).
- Si en un mismo día se trabaja en varias sesiones, **se agregan más entradas dentro del
  mismo archivo** (no se crea uno nuevo).
- Cada entrada lleva **hora** y describe, de forma resumida pero completa, qué se hizo y
  **en qué rama**.
- El registro debe ser entendible por alguien que no estuvo presente: que se entienda el
  *qué*, el *dónde* (rama) y el *por qué*.

---

## 2. Nombre de los archivos

```
bitacora_trabajo/
├── instrucciones.md      ← este archivo (no se borra)
├── 24-06-2026.md         ← registro del 24 de junio de 2026
├── 25-06-2026.md         ← registro del 25 de junio de 2026
└── ...
```

- Formato obligatorio: `dd-mm-yyyy.md` (día-mes-año, con ceros a la izquierda).
- Un archivo = un día calendario.

---

## 3. Estructura de cada archivo diario

Cada archivo de día empieza con un encabezado con la fecha y luego una o más **sesiones**
ordenadas por hora. Dentro de cada sesión se listan los cambios.

````markdown
# Bitácora — 24-06-2026

## Sesión 09:30 – 12:00 · rama `develop`

- **[feat]** Se creó la página de Integraciones en `src/pages/integraciones/`.
- **[fix]** Se corrigió el desempaquetado del wrapper `data` en productos de WooCommerce.
- **Decisión:** se filtra para no traer webhooks en `allWooIntegrations`. Motivo: la
  lista solo debe mostrar integraciones reales.
- **Pendiente:** falta validar el toggle de activación con permisos de sucursal.

## Sesión 15:00 – 17:30 · rama `feature/columna-modo`

- **[style]** Se añadió la columna "Modo" con iconos y acciones Ver/Editar como íconos.
- **PR:** #40 abierto hacia `develop`.
- **Problema encontrado:** el `branchId` llegaba `null` en algunos usuarios; se resolvió
  usando `useCurrentBranch`.
````

### Convención de etiquetas (alineadas con los commits del repo)

Usa el mismo prefijo que en los commits para que el informe sea coherente:

| Etiqueta    | Cuándo usarla                                  |
|-------------|------------------------------------------------|
| `[feat]`    | Nueva funcionalidad / página / módulo          |
| `[fix]`     | Corrección de bug                              |
| `[style]`   | Cambios visuales / UI sin lógica nueva         |
| `[refactor]`| Reorganización de código sin cambiar conducta  |
| `[docs]`    | Documentación                                   |
| `[chore]`   | Configuración, dependencias, tareas varias      |
| `[test]`    | Pruebas                                          |

---

## 4. Qué anotar en cada entrada (checklist)

Para cada cosa hecha, intenta cubrir:

1. **Qué** se hizo (acción concreta y archivo/módulo afectado).
2. **En qué rama** se hizo (`develop`, `feature/...`, etc.).
3. **Por qué** (motivo o requerimiento que lo originó), si no es obvio.
4. **Referencias**: número de PR (`#40`), commit, issue o ticket si existe.
5. **Estado**: terminado, en progreso o pendiente.
6. **Problemas / decisiones** relevantes que sirvan para el informe.

> Mantén las entradas **resumidas**. No copies código completo; basta con la ruta del
> archivo y una frase clara de qué cambió.

---

## 5. Plantilla rápida (copiar y pegar)

Al iniciar el día, crea `dd-mm-yyyy.md` con esto:

```markdown
# Bitácora — dd-mm-yyyy

## Sesión HH:MM – HH:MM · rama `<rama>`

- **[tipo]** Descripción breve de lo realizado (módulo/archivo).
- **Decisión:** ...
- **Pendiente:** ...
- **PR / commit:** #...
```

Para una nueva sesión el mismo día, agrega otro bloque `## Sesión ...` debajo.

---

## 6. Cómo se usa para el informe

Al cerrar una semana/mes, se recorren los archivos `dd-mm-yyyy.md` en orden y se resume:

- Total de funcionalidades (`[feat]`), correcciones (`[fix]`), etc.
- Ramas y PRs trabajados.
- Tareas pendientes arrastradas.

Por eso es importante ser **consistente con las etiquetas y las ramas**: el informe se
arma casi solo si la bitácora está bien llevada.
