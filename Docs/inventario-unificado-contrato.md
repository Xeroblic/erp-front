# Inventario unificado — Ampliación del contrato de abastecimiento

Propuesta del frontend para llevar al arquitecto. **No es un contrato paralelo:** amplía el
contrato aprobado de abastecimiento e inventario ubicado (backend, PR #67, rama
`docs/procurement-stock-receipts`, `docs/pending-architecture/procurement-stock-receipts/frontend-guide.md`).
Rige todo lo que ese documento define: alias `B`/`S`/`P`, sobre de respuesta, paginación,
errores estables (§16), idempotencia y autorización (§15).

Cada punto se marca como:

- **Reutiliza**: ya está en el contrato aprobado; el frontend lo consume tal cual.
- **Ampliación**: agrega parámetros o campos a un endpoint aprobado.
- **Nuevo**: endpoint que el contrato aprobado no tiene.

Estado del frontend: el módulo existe en `src/pages/inventario/Inventario/` y funciona con datos
simulados (`VITE_INVENTORY_STOCK_USE_MOCKS=true`) sobre el mismo mock de
`inventoryStock.service`. Al publicarse el backend sólo cambia el servicio.

---

## Por qué

El stock se consultaba en tres pantallas que se pisaban: las pestañas de stock de
Catálogo › Productos, la tabla de productos del detalle de Bodegas («Stock» y «Cantidad» sin
aclarar que una es de la sucursal y la otra de la bodega) y Stock por ubicación. Las tres
muestran el mismo dato —cantidad de cada producto en cada bodega— agrupado de otra forma.

La vista unificada tiene tres entradas sobre la **sucursal activa**:

| Vista                 | Pregunta que responde                                       | Endpoints                         |
| --------------------- | ----------------------------------------------------------- | --------------------------------- |
| General (por defecto) | ¿Cuánto tengo de cada producto, dónde está y en qué estado? | A1, A2                            |
| Por bodega            | ¿Qué hay en cada bodega?                                    | A3                                |
| Ficha de bodega       | ¿Qué guarda esta bodega y en qué estado?                    | A3 + A1 con `warehouse_id`        |
| Ficha de producto     | Todo sobre un producto en la sucursal                       | A4 + §3 origins + §14 operaciones |

Reportes › Inventario (`S/reports`) concentra umbrales, estadísticas y sugerencias (R1–R4). La
vista operativa sólo muestra las alertas que piden actuar y enlaza a la lista filtrada.

---

## A1 · `GET B/inventory-stock` — Ampliación

Se conservan los filtros y el orden del §3. Parámetros nuevos, todos opcionales:

| Parámetro                 | Valores                                                                                                | Efecto                                                                                                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `include`                 | `warehouses`                                                                                           | Cada fila agrega `warehouses[]` y `critical_stock`. Sin `include`, la respuesta es idéntica a la del §3 (los consumidores actuales no cambian).                                                                                                                                 |
| `stock_status`            | `critical`, `healthy`, `unconfigured`, `out`                                                           | Filtra por el estado de la sucursal. `out`: `available_quantity <= 0`, y gana a los otros tres: los estados son excluyentes (un producto sin disponible no aparece en `critical` ni en `unconfigured`). Valor inválido → 422.                                                   |
| `brand_id`, `category_id` | entero                                                                                                 | Filtros de catálogo.                                                                                                                                                                                                                                                            |
| `sort`                    | `name`, `location`, `physical_quantity`, `available_quantity`, `stock_status`; prefijo `-` descendente | Orden secundario por producto ID ASC (paginación estable). Por defecto `name`. `location`: primera ubicación de `warehouses[]` («Sin ubicación» antes que las bodegas, luego por nombre). `stock_status`: `out` → `critical` → `unconfigured` → `healthy`, sin estado al final. |

Fila con `include=warehouses`:

```json
{
	"product": { "…": "producto del §2" },
	"physical_quantity": 15,
	"fit_quantity": 13,
	"unfit_quantity": 2,
	"documented_quantity": 10,
	"undocumented_quantity": 5,
	"warehouses": [
		{
			"warehouse": null,
			"physical_quantity": 15,
			"fit_quantity": 13,
			"unfit_quantity": 2,
			"documented_quantity": 10,
			"undocumented_quantity": 5
		},
		{
			"warehouse": { "id": 12, "name": "Estante A3" },
			"physical_quantity": 4,
			"fit_quantity": 4,
			"unfit_quantity": 0,
			"documented_quantity": 4,
			"undocumented_quantity": 0
		}
	],
	"critical_stock": {
		"scope": "branch",
		"physical_quantity": 19,
		"fit_quantity": 17,
		"unfit_quantity": 2,
		"held_quantity": 16,
		"available_quantity": 1,
		"threshold": 10,
		"status": "critical"
	}
}
```

Reglas:

- Las cantidades de primer nivel siguen el filtro de ubicación, como en el §3. `warehouses[]` y
  `critical_stock` son **siempre de la sucursal completa**, para que al filtrar una bodega se vea
  también dónde más está el producto.
- `warehouses[]` sólo lista ubicaciones con saldo; `warehouse: null` es «Sin ubicación». Orden:
  Sin ubicación primero, luego nombre ASC.
- `critical_stock` usa las fórmulas del §13 (`available = fit − held`, puede ser negativo) con
  `scope: "branch"`. En productos con serie es `null`, igual que en el §13.

## A2 · `GET B/inventory-stock/summary` — Nuevo

Totales de la sucursal para la franja de alertas. Permiso `view-product` (sucursal).

```json
{
	"data": {
		"products_count": 20,
		"physical_quantity": 150,
		"unfit_quantity": 3,
		"undocumented_quantity": 120,
		"unlocated_quantity": 19,
		"critical_count": 2,
		"out_count": 0,
		"unconfigured_count": 17
	},
	"context": { "scope": "branch", "branch_id": 4, "warehouse": null }
}
```

Cuenta productos con saldo en la sucursal. Cada contador corresponde exactamente al filtro
`stock_status` de A1 con el mismo nombre, para que la alerta y la lista filtrada muestren el
mismo número. Como los estados son excluyentes, `critical_count + out_count + unconfigured_count`
nunca cuenta dos veces el mismo producto.

## A3 · `GET B/inventory-stock/warehouses` — Nuevo

Una fila por bodega **activa** de la sucursal, tenga o no saldo, más una fila «Sin ubicación»
(`warehouse: null`) si tiene saldo. Permiso `view-product` (sucursal).

```json
{
	"data": [
		{
			"warehouse": {
				"id": 8,
				"name": "Bodega Central",
				"code": "BC-01",
				"warehouse_type": "principal",
				"is_active": true,
				"description": "Bodega de recepción y despacho de la sucursal.",
				"manager_name": "Camila Rojas",
				"address": "Av. Providencia 1234",
				"commune_name": "Providencia",
				"schedule": "Lunes a viernes, 9:00 a 18:00",
				"requires_serial_tracking": false
			},
			"capacity": 120,
			"maximum_capacity": 500,
			"product_count": 18,
			"physical_quantity": 117,
			"unfit_quantity": 0,
			"undocumented_quantity": 101,
			"critical_count": 1
		}
	],
	"context": { "scope": "branch", "branch_id": 4, "warehouse": null }
}
```

`critical_count` cuenta productos con saldo en esa bodega cuyo estado **de sucursal** es
`critical` (sin contar los que están en `out`) (no existe umbral por bodega en V1). `capacity`/`maximum_capacity` vienen de
`warehouses`; `null` si no están configuradas. `description`, `manager_name`, `address`,
`commune_name`, `schedule` y `requires_serial_tracking` son las columnas ya existentes de
`warehouses` (las que devuelve `GET B/warehouses/{id}`), para que la ficha de bodega muestre sus
datos sin una segunda consulta; los textos son `null` cuando no están cargados.

## A4 · `GET B/inventory-stock/{product}` — Nuevo

Ficha de un producto en la sucursal. Permiso `view-product` (sucursal). 404 si el producto no
es visible en el contexto.

```json
{
	"data": {
		"product": { "…": "producto del §2, más critical_stock_threshold del §13" },
		"physical_quantity": 19,
		"fit_quantity": 17,
		"unfit_quantity": 2,
		"documented_quantity": 14,
		"undocumented_quantity": 5,
		"warehouses": ["…mismas filas que A1…"],
		"critical_stock": { "…": "igual que A1" },
		"series_summary": null
	},
	"context": { "scope": "branch", "branch_id": 4, "warehouse": null }
}
```

- Un producto sin saldo en la sucursal responde con cantidades en 0 y `warehouses: []`.
- `series_summary` (sólo con serie, `null` si no): `{ "total": n, "by_status": { "available_for_sale": n, "in_quotation": n, "on_hold": n, "reserved": n, "in_review": n }, "by_grade": { "A": n, "B": n, "C": n, "M": n } }`.
  Viene de `technical_review_items` de la sucursal.

La ficha **reutiliza**, sin cambios:

- Procedencias: `GET B/inventory-stock/{product}/origins` (§3) y documentar (§8).
- Historial: `GET S/inventory-operations?product_id=&branch_id=` (§14), permiso
  `view-inventory-movements`.
- Proveedores y compras: `GET P/products/{product}/suppliers` y `purchase-history` (§12).
- Series: `GET S/products/{product}/series` (ya existe).
- Umbral: se edita con la edición de producto (§13, `edit-product`).

---

## Reportes · `GET S/reports/{type}` — Ampliación

Mismo sobre, paginación, caché y exportación que el tipo `stock`. Permisos `view-reports` y
`export-reports`. Filtro opcional `branch_id`. `GET S/reports` debe listar sólo los tipos
disponibles: el frontend muestra una pestaña por tipo informado.

| Tipo                   | Fila                                                                                  | Nota                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **R1** `stock_health`  | producto, sucursal, `physical_quantity`, `available_quantity`, `threshold`, `status`  | Filtro `status`. Base: `critical_stock` del §13.                                                                                              |
| **R2** `replenishment` | fila de `P/replenishment-candidates`                                                  | **Reutiliza** §13 tal cual; sólo se expone también como reporte exportable.                                                                   |
| **R3** `dead_stock`    | producto, sucursal, `physical_quantity`, `last_operation_at`, `days_without_movement` | Parámetro `days` (defecto 90). Base: operaciones del §14.                                                                                     |
| **R4** `rotation`      | producto, `units_out`, `average_on_hand`, `rotation`                                  | Parámetros `date_from`, `date_to`. Base: operaciones del §14, **no** `equipment_movements` (el tipo `movements` actual lee esa tabla legada). |

En todas las filas, `product` es `{ id, sku, name }` y `branch` es `{ id, name }` (objetos compactos,
nunca nombres sueltos). El frontend lee exactamente estos campos: `src/pages/reportes/inventory-reports/inventoryReportTabs.ts`.

---

## Propuesta futura (fuera de la V1 del arquitecto)

El §13 cierra la V1 con un umbral único por producto y deja fuera el stock objetivo. Se deja
anotado para reabrir cuando la V1 esté en producción, sin bloquear nada:

- Umbral por bodega (override del umbral del producto).
- Stock máximo/objetivo por producto y bodega, para sugerir cantidad a reponer y detectar exceso.

## Preguntas abiertas

1. **Productos con serie en A1.** El §3 los excluye. La vista General los necesita para no
   depender de otra pantalla. ¿Pueden incluirse con cantidades desde `technical_review_items`
   (`available_for_sale` por bodega) y `critical_stock: null`?
2. **Fuente de verdad del saldo por bodega.** Hoy conviven `inventory_balances` y
   `warehouse_products` (espejada por `InventoryService::applyMovement`). ¿La proyección nueva
   reemplaza a ambas? El detalle de Bodegas lee `warehouse_products`.
3. **Holds por sucursal.** `product_soft_holds` no tiene `branch_id`. ¿`held_quantity` de
   `scope: "branch"` se resuelve por la sucursal de la venta?
4. **Etapas.** ¿A1–A4 llegan en la etapa 1 (todo en «Sin ubicación») o con la etapa 2
   (multi-ubicación)? En la etapa 1 la vista Por bodega sólo mostraría «Sin ubicación».
5. **Estado `out`.** ¿Se considera también un producto del catálogo sin ninguna fila de saldo?
   La propuesta sólo cuenta productos con saldo en la sucursal.

## Decisiones del frontend mientras tanto

- La condición apto/no apto se muestra como **«No vendible»** y sólo cuando `unfit_quantity > 0`
  (en la etapa 1 vale siempre 0, así que no aparece).
- La sucursal es la activa del usuario (`useCurrentBranch`); comparar sucursales es de Reportes.
- Las pantallas viejas (pestañas de Catálogo › Productos y tabla de productos de Bodegas) se
  retiran en un PR aparte, cuando la vista nueva tenga datos reales.
