# Abastecimiento e inventario ubicado — Preguntas al backend

Entregable de cierre del proyecto «refactor + expansión stock». Cada card agrega sus
preguntas acá; esta lista es lo que se lleva a la presentación.

Fuente normativa: repositorio `zentria-erp-back`, rama `docs/procurement-stock-receipts`
(PR #67), `docs/pending-architecture/procurement-stock-receipts/frontend-guide.md`.

---

## ZF-106 — Fundaciones del contrato (tipos, fixtures y componentes compartidos)

Preguntas surgidas al modelar la sección 2 del contrato como tipos TS y al construir los
componentes compartidos. Cada una nombra la decisión que el front tomó mientras tanto, para
que corregirla sea un cambio acotado y no una reescritura.

### Producto

1. **¿`price` y `cost` de la ficha pueden ser `null`?** El contrato declara `offer_price`
   nullable de forma explícita y dice que sin base histórica demostrable `cost_basis` es
   `"unknown"`, pero no aclara si el importe acompaña ese `unknown` con `null` o con un
   valor. _Decisión provisional:_ ambos se tipan nullable y se muestran como «Desconocido».
   Si el backend garantiza que siempre vienen poblados, el tipo se puede estrechar.

2. **¿`cost_basis` admite `"unknown"` además de `net` y `gross`?** El contrato usa
   `"unknown"` en el ejemplo, pero no enumera el conjunto cerrado para el costo de catálogo.
   _Decisión provisional:_ `'net' | 'gross' | 'unknown'`.

3. **¿`grade` es un conjunto cerrado (A/B/C) o texto libre?** La especificación menciona
   «Grado C» como límite en otros módulos. _Decisión provisional:_ `string | null`, que
   acepta cualquiera de las dos respuestas sin romper.

4. **¿`short_description` puede ser `null`?** El ejemplo la trae poblada.
   _Decisión provisional:_ nullable.

### Costo

5. **En un agregado heterogéneo, ¿`vat_rate_percent`, `net`, `vat` y `gross` siguen
   poblados, o también se anulan junto con `entered_unit_amount`?** El contrato sólo
   especifica que se anulan el monto ingresado y su base. _Decisión provisional:_ el fixture
   `mixedBasisCost` mantiene el desglose poblado y sólo anula lo que el contrato indica.

6. **Cuando el agregado no es comparable —alguna línea sin costo—, ¿qué llega:
   `source: "unknown"` con todo en `null`, o un agregado parcial marcado de otra forma?** El
   contrato dice «el agregado no es comparable; no ponderar solo las líneas conocidas», pero
   no nombra la forma de la respuesta. Es el caso que decide si el `CostBlock` muestra
   «desconocido» o un tercer estado.

7. **¿`effective_basis: "mixed"` puede aparecer con `source: "declared"`,** o sólo con
   `document`? Afecta a qué combinaciones de etiquetas hay que dar sentido en la UI.

8. **¿La tasa de IVA puede cambiar entre líneas de una misma recepción** (por snapshots
   tomados en momentos distintos)? El bloque `cost` trae una sola `vat_rate_percent`.

### Escrituras, concurrencia y errores

9. **¿Qué endpoints devuelven `ETag`, exactamente?** El contrato nombra «documentos y
   recepciones editables». ¿El GET de listado también lo entrega por fila, o sólo el GET
   individual? _Decisión provisional:_ sólo GET individual y respuestas de escritura.

10. **¿Cuál es la ventana de retención de una `Idempotency-Key`?** Determina si un reintento
    tras varios minutos recupera el resultado o crea una operación nueva.

11. **¿`409 OPERATION_IN_PROGRESS` trae `Retry-After`** o algún indicio de cuánto esperar?
    Sin eso, el reintento del front es a ciegas.

12. **¿El `context` de un 409 tiene forma estable por código de error?** El contrato dice
    que «puede incluir `context` con IDs/saldos autorizados para refrescar la selección».
    _Decisión provisional:_ se tipa como `Record<string, unknown>` y cada card lo interpreta.

13. **El 428 por falta de `If-Match`, ¿trae `code` estable?** No aparece en la tabla de la
    sección 16. _Decisión provisional:_ se le asigna `PRECONDITION_REQUIRED` en el front, lo
    que quedaría desalineado si el backend define otro.

### Acciones y permisos

14. **¿`allowed_actions` puede traer una acción que el front no conozca?** _Decisión
    provisional:_ se omite en silencio en vez de pintar un botón con permiso adivinado.

15. **`update` sobre una recepción, ¿exige `edit-product` incluso cuando la recepción viene
    de un documento confirmado?** La sección 15 enlaza recepciones a `edit-product`, pero la
    edición toca datos que nacieron del documento.

16. **`link_purchase_document` exige `edit-product` **y** `view-purchase-document`. ¿Los
    `allowed_actions` de la recepción ya consideran ambos**, o el front debe validar el
    segundo por su cuenta? _Decisión provisional:_ la botonera exige `edit-product` y la card
    de vinculación agregará el segundo guard.

### Paginación y contadores

17. **¿`meta.total` de `GET B/inventory-stock` cuenta productos con existencia distinta de
    cero, o todos los productos del alcance?** Cambia qué significa un estado vacío.

18. **¿Los listados que declaran `context` lo repiten en cada página** o sólo en la primera?

---

## Pendientes de cards siguientes

Las cards 02 a 08 agregan sus preguntas debajo de este bloque, con el mismo formato:
pregunta, por qué importa y decisión provisional del front.
