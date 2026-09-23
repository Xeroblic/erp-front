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

---

## Reportes › Inventario — Exportación con el formato de reportes

Reportes › Inventario tiene cuatro pestañas (Datos, Umbrales, Acciones y Estadísticas) y cada una
exporta a PDF y Excel. Hoy sólo existe `GET S/reports/stock/export`, con un diseño propio (título
«Reporte: Stock», columna Sucursal). El front definió un formato único para los cuatro archivos y
lo genera en el navegador como **reemplazo provisional**. Se pide que el backend lo genere, para
que el archivo no dependa de tener el reporte completo cargado en la pantalla.

19. **¿Puede `GET S/reports/{type}/export` generar el archivo con este formato?** Es el mismo en
    PDF y en Excel, y para `stock`, `stock_health` y `replenishment`:
    - **Nombre** en `Content-Disposition`: `reporte-<slug>-AAAAMMDD-HHmm.<pdf|xlsx>`. Slugs
      `existencias`, `umbrales` y `reposicion`.
    - **Encabezado:** título del reporte y, debajo, `Empresa: <filial>`, `Alcance: <sucursal>` (o
      `Todas las sucursales`), `Filtros: búsqueda «…» · estado …` (sólo si hay filtros) y
      `Generado el DD-MM-AAAA HH:mm`. La sucursal va en el alcance, no como columna.
    - **Indicadores**, calculados sobre el reporte completo del alcance, no sobre la búsqueda:

        | Tipo            | Indicadores                                                                                                                        |
        | --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
        | `stock`         | Productos, Stock total, Con stock (`quantity > 0`), Sin stock                                                                      |
        | `stock_health`  | Bajo el umbral, Sin disponible (`available ≤ 0`, gana a los otros estados), Sin umbral, Normal                                     |
        | `replenishment` | Por reponer, Con proveedor sugerido, Sin compras anteriores, Sin proveedor elegible (`no_active_suppliers` + `no_comparable_cost`) |

    - **Columnas, en este orden:**

        | Tipo            | Columnas                                                                         |
        | --------------- | -------------------------------------------------------------------------------- |
        | `stock`         | SKU, Producto, Stock, Actualizado                                                |
        | `stock_health`  | SKU, Producto, Sucursal, En bodega, Disponible, Umbral, Estado                   |
        | `replenishment` | SKU, Producto, Disponible, Umbral, Proveedor sugerido, Última compra, Sugerencia |

        Los estados y las sugerencias van con el texto de la pantalla, no con el código:
        «Sin disponible», «Bajo el umbral», «Sin umbral», «Normal»; «Proveedor sugerido», «Sin
        compras anteriores», «Sin proveedores activos», «Sin costo comparable».

    - **Excel:** una hoja «Resumen» (Indicador | Valor) y una hoja por tabla. Cada hoja repite el
      encabezado. La fila de títulos va en negrita, con fondo gris claro (`#F4F4F5`), borde
      inferior, autofiltro y paneles fijos debajo de ella. Los números van como número con
      formato `#,##0`, las fechas como `DD-MM-AAAA` y los vacíos como celda vacía.
    - **PDF:** A4, horizontal si alguna tabla tiene más de 4 columnas. Título de 16 pt, contexto
      de 9 pt en gris, indicadores en tarjetas grises, tablas con filas alternadas y la fila de
      títulos repetida en cada página. Una tabla de hasta 20 filas no se parte entre páginas.
      Pie: «Zentria ERP · Reportes de inventario» y «Página X de Y». Tabla vacía: «Sin filas
      para estos filtros.»

    _Decisión provisional:_ el front arma estos archivos en el navegador con las filas ya
    cargadas (`src/pages/reportes/inventory-reports/export/`). Quien quiera ver el formato puede
    descargar cualquiera de las cuatro pestañas. Cuando el backend lo genere, cada pestaña
    vuelve a `GET …/export`.

20. **¿La exportación puede aceptar los mismos filtros que la pantalla, incluido el orden?** Hoy
    `export` valida `q` y `branch_id`, pero no `status` (R1), `days` (R3) ni un orden. La pantalla
    ordena por cualquier columna y el archivo debería salir en ese mismo orden. Propuesta: `sort`
    con la clave de columna y prefijo `-` para descendente, como A1.
    _Decisión provisional:_ el archivo del navegador respeta búsqueda, sucursal, estado y orden.

21. **¿Estadísticas puede ser un tipo exportable propio (`inventory_statistics`)?** La pestaña
    agrega R1 y R3 (`dead_stock` con `days=0`). Su archivo lleva los indicadores (unidades en
    bodega, disponibles para vender, requieren atención = bajo el umbral + sin disponible, sin
    movimiento hace 90 días o más) y cuatro tablas: estado del stock (productos por estado), stock
    por sucursal (disponible, reservado o no vendible, y cantidad por estado), antigüedad por días
    desde el último movimiento (hasta 30, 31 a 90, 91 a 180, más de 180, sin registro; productos y
    unidades) y los 10 productos con más unidades. Slug `estadisticas-inventario`.
    _Decisión provisional:_ se calcula y se exporta en el navegador.

22. **¿Cómo sabe el front que la exportación ya viene con este formato?** Sin una señal, el cambio
    depende de desplegar front y backend juntos. Propuesta: que cada tipo de `GET S/reports`
    informe la versión del formato de exportación (p. ej. `export_layout: 1`).
    _Decisión provisional:_ el cambio se hace en un PR coordinado con el despliegue del backend.

---

## Inventario › Trazabilidad de productos sin serie (§14)

La vista de Inventario suma la pestaña Trazabilidad, y la ficha de producto su historial, sobre
`GET S/inventory-operations` y su detalle. El endpoint todavía no existe: el front lo simula con
el stock simulado del módulo.

23. **¿Los efectos pueden traer la ubicación compacta (`warehouse: {id, name}`) además de
    `warehouse_id`?** El §14 sólo trae el ID. Un traslado viejo puede pasar por una bodega hoy
    desactivada o eliminada, que ya no está en A3.
    _Decisión provisional:_ el nombre se busca en A3 y, si no está, se muestra «Bodega #ID».

24. **¿Cómo se dejan fuera los productos con serie?** La sección es la trazabilidad de los
    productos sin serie; los serializados se siguen por número de serie. El §14 no tiene un
    filtro por tipo de seguimiento, y una venta o una devolución pueden incluir series.
    Propuesta: un filtro `serial_tracking=0`, o bien que las operaciones del §14 nunca incluyan
    ítems con serie.
    _Decisión provisional:_ el mock omite los ítems de productos con serie. Con el endpoint real
    se mostrarían si el backend los incluye.

25. **¿Con qué `operation_type` y `title` llega el saldo inicial que ya existía?** Las
    procedencias `initial_stock` del backfill no tienen un tipo público nuevo en el §14, que dice
    que los tipos legados se conservan con su nombre.
    _Decisión provisional:_ el mock usa `initial_balance`, «Saldo inicial». Un tipo que el front
    no conoce se muestra con el `title` del backend y un icono neutro.

26. **En las operaciones documentales, ¿`summary.units_affected` es 0?** El §14 dice «Operación
    documental: cero físico», pero no aclara si ese cero se aplica también al resumen o sólo a los
    efectos.
    _Decisión provisional:_ se muestra «Sin cambio físico» en vez de un número, y el detalle
    muestra las unidades documentadas.
