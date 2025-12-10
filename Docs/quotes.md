# Módulo de Cotizaciones – Referencia Backend

Este documento describe el flujo extremo a extremo del módulo de cotizaciones (“quotes”): entidades involucradas, forma esperada de los datos y uso correcto de cada ruta. Sigue el orden indicado para que la UI respete siempre el contrato con el backend.

---

## 1. Entidades Principales

### Quote (`App\Models\Quote`)
- Contexto: `subsidiary_id`, `customer_id`, `salesperson_id` opcional.
- Fechas clave: `quote_date`, `expiry_date`.
- Campos monetarios: `subtotal`, `tax_amount`, `discount_amount`, `total_amount` (`decimal(15,2)`).
- Tasas: `tax_rate` (`decimal(5,4)` → 0 o 0.19) y `discount_rate`.
- Estado: `draft|sent|approved|converted|rejected|expired` (constraint en BD). Persistir siempre en minúsculas.
- Metadatos: `quote_number`, `payment_method`, `document_type`, `terms_conditions`, `notes`, `internal_notes`, `is_converted_to_sale`, `converted_at`.

### QuoteItem (`App\Models\QuoteItem`)
- Llaves: `quote_id` y `product_id` (en la migración actual **no** permite null, por lo que para ítems libres debes volverla nullable o usar un producto genérico).
- Montos: `quantity`, `unit_price` (neto), `discount_rate`, `discount_amount`, `subtotal`, `total`.
- Overrides para el cliente: `customer_sku`, `customer_name`, `description`, `notes`, `product_attributes`.
- Backend mantiene `subtotal` = `total` (ambos netos); los descuentos son informativos.

### DTOs / Contratos de Formulario
- **QuoteCreateDTO / QuoteUpdateDTO** deben incluir:
  - `customer_id`, `quote_date`, `expiry_date`, `tax_rate`, `status`, `notes`, `internal_notes`, `payment_method`, `purchase_order`, `payment_terms`, `fixed_discount`, `discount_percentage`, `document_type`.
  - `tax_percentage` es sólo para la UI; antes de llamar al backend conviértelo a `tax_rate = IVA_RATE / 100`.
- **QuoteItemDTO**:
  ```ts
  interface QuoteItemDTO {
    product_id?: number | null;
    quantity: number;
    unit_price?: number;            // neto; requerido si no hay product_id
    discount_amount?: number | null;
    customer_sku?: string | null;
    customer_name?: string | null;
    description?: string | null;
    notes?: string | null;
    product_attributes?: Record<string, any>;
  }
  ```
- El helper del front `sanitizeItemsForSubmit` ya respeta estas reglas: ítems de catálogo envían `{product_id, quantity}` y los custom envían `unit_price` (neto) más descripciones.

---

## 2. Rutas API (en orden de uso)

### 2.1 Listar Cotizaciones
`GET /api/subsidiaries/{subsidiary}/quotes`
- Filtros: `status`, `q` (busca por `quote_number`), `with_customer` (hace eager load de customer + commune).
- Devuelve `QuoteResource` paginados con `items_count` y datos del vendedor.
- Ideal para grids y buscadores.

### 2.2 Obtener una Cotización
`GET /api/subsidiaries/{subsidiary}/quotes/{quote}`
- Incluye customer (con commune), items (con product) y salesperson.
- Úsalo al abrir modales de detalle/impresión.

### 2.3 Listar Solo Ítems
`GET /api/subsidiaries/{subsidiary}/quotes/{quote}/items`
- Devuelve colección de `QuoteItemResource`.
- Útil para ediciones inline sin recargar la cabecera.

### 2.4 Crear Cotización (sólo cabecera)
`POST /api/subsidiaries/{subsidiary}/quotes`
- Body cumple `StoreSubsidiaryQuote`.
- **Flujo**:
  1. Normaliza `tax_rate = values.tax_percentage === 19 ? 0.19 : 0`.
  2. Envía la cabecera sin `items`.
  3. El API fija `status` (por defecto `draft`), `subsidiary_id` y `salesperson_id` (usa el usuario autenticado si no viene).
  4. La respuesta es la cotización creada (sin ítems).

**Ejemplo**
```json
POST /api/subsidiaries/3/quotes
{
  "customer_id": 42,
  "quote_date": "2024-05-10",
  "expiry_date": "2024-05-17",
  "tax_rate": 0.19,
  "status": "draft",
  "payment_method": "transferencia",
  "document_type": "factura",
  "notes": "Válida por 7 días"
}
```

### 2.5 Agregar Ítems (uno a la vez)
`POST /api/subsidiaries/{subsidiary}/quotes/{quote}/items`
- **Reglas**:
  - Los montos que se envían son **netos**.
  - `product_id` es opcional; si existe y no mandas `unit_price`, el backend trae `offer_price` o `price`. Si no hay precio, responde 422.
  - Calcula `subtotal = unit_price * quantity` y deja `total = subtotal`.
- Este endpoint está diseñado para recibir **un solo ítem por request**. El motivo es que cada registro pasa por validaciones individuales (precio faltante, existencia de producto, etc.) y se generan FKs/IDs independientes. Si necesitas crear N ítems, el front debe iterar `sanitizeItemsForSubmit` y disparar N llamadas secuenciales/asíncronas. No existe hoy un endpoint de “bulk insert”.

**Ejemplos**
```json
// Ítem de catálogo: toma precio del producto
POST /api/subsidiaries/3/quotes/15/items
{ "product_id": 1001, "quantity": 2 }

// Ítem custom
POST /api/subsidiaries/3/quotes/15/items
{
  "product_id": null,
  "quantity": 1,
  "unit_price": 350000,
  "customer_name": "Servicio de montaje",
  "description": "Instalación en terreno",
  "discount_amount": 15000
}
```

### 2.6 Actualizar Ítems (también uno a la vez)
`PATCH /api/subsidiaries/{subsidiary}/quotes/{quote}/items/{item}`
- Acepta cambios parciales. Si modificas `product_id` sin mandar `unit_price`, vuelve a buscar el precio del producto.
- Recalcula `subtotal` y `total` cada vez.
- Igual que el POST, este PATCH expone un recurso “ítem” específico; no hay un `PATCH` masivo.

### 2.7 Eliminar Ítems
`DELETE /api/subsidiaries/{subsidiary}/quotes/{quote}/items/{item}`
- Borra físicamente el registro. Tras eliminar, vuelve a cargar totales en la UI.

### 2.8 Actualizar Cabecera
`PATCH /api/subsidiaries/{subsidiary}/quotes/{quote}`
- Mismo contrato que `store` (con campos opcionales). Cambia cliente, fechas, datos de pago, notas, etc.

### 2.9 Descargar PDF
`GET /api/subsidiaries/{subsidiary}/quotes/{quote}/pdf`
- Genera/stora un PDF (DomPDF preferido) en `storage/app/public/subsidiary-{id}/quotes/quote-{quote_id}.pdf`.
- El generador ahora trata `unit_price` como valor **neto** y calcula el monto bruto multiplicando por `(1 + tax_rate)` solo cuando necesita mostrarlo.

### 2.10 Convertir a Venta
`POST /api/subsidiaries/{subsidiary}/quotes/{quote}/convert-to-sale`
- Validaciones:
  - La cotización no debe estar convertida.
  - El bucle de ítems asume `unit_price` **neto** (sin IVA) y sólo aplica el `tax_rate` para calcular totales.
  - Crea registros `Sale` y `SaleItem`, marca el quote como `converted`.
- Respuesta: `{ message, sale: { id, sale_number, status, total_amount, created_at } }`.

### 2.11 Eliminar Cotización
`DELETE /api/subsidiaries/{subsidiary}/quotes/{quote}`
- Borra cabecera e ítems (FK con `onDelete('cascade')`).

---

## 3. Reglas de Consistencia Críticas

1. **IVA**: `quote_items.unit_price` debe guardar montos **netos** en todo el flujo (UI, API, PDF y conversión).
   - Los endpoints que derivan bruto sólo multiplican por `(1 + tax_rate)` cuando necesitan mostrarlo.
2. **Tax rate**: El formulario maneja 0/19. Antes de persistir, convierte a `tax_rate = 0` o `0.19`.
3. **FK de producto**: Si quieres ítems 100 % custom, haz `product_id` nullable o usa un producto genérico.
4. **Estado**: siempre envía minúsculas para pasar el `CHECK`.
5. **Totales**: hoy el backend confía en los campos persistidos. Idealmente recalcula después de cada cambio de ítems; mientras no exista ese servicio, deja que la UI haga el cálculo visual y mantén los valores alineados.

---

## 4. Ejemplo de Creación (pseudo‑código)

```ts
const IVA_RATE = 19;

const handleCreateQuote = async (values: FormQuotationValues) => {
  const tax_rate = values.tax_percentage === IVA_RATE ? IVA_RATE / 100 : 0;
  const { items, ...rest } = values;

  const quoteBody: QuoteCreateDTO = {
    customer_id: rest.customer_id,
    quote_date: rest.quote_date,
    expiry_date: rest.expiry_date,
    tax_rate,
    payment_method: normalizePayment(rest.payment_method),
    document_type: rest.document_type ?? null,
    status: (rest.status ?? 'draft').toLowerCase() as QuoteStatusLower,
    notes: rest.notes,
    internal_notes: rest.internal_notes,
    payment_terms: rest.payment_terms,
    purchase_order: rest.purchase_order,
  };

  const quote = await ApiService.fetchNormalized<IQuote>({
    url: `/subsidiaries/${rest.subsidiary_id}/quotes`,
    method: 'POST',
    data: quoteBody,
  });

  const sanitizedItems = sanitizeItemsForSubmit(items);
  for (const item of sanitizedItems) {
    await ApiService.fetchNormalized<IQuoteItem>({
      url: `/subsidiaries/${rest.subsidiary_id}/quotes/${quote.id}/items`,
      method: 'POST',
      data: item,
    });
  }

  // Refresca listado, cierra modal, muestra toast.
};
```

---

## 5. Checklist de Troubleshooting

- **422 “unit_price required”** → Ítem custom sin precio. Forzar “Precio neto unitario” en la UI.
- **422 “producto no tiene precio definido”** → Ítem de catálogo sin `offer_price`/`price`. Define precio o manda `unit_price`.
- **Violación de estado** → Se envió `status` en mayúsculas o valor fuera del conjunto permitido.
- **PDF descuadrado en 19 %** → Desfase neto/bruto. Unificar criterio y actualizar convertidores.
- **Errores de FK en ítems custom** → La migración tiene `product_id NOT NULL`. Haz la columna nullable o usa un producto comodín.

---

Manteniendo estos contratos (especialmente IVA, `tax_rate` y el orden POST cabecera → ítems) garantizas que el módulo se comporte de forma consistente en listados, PDF y conversión a ventas. Recomendación senior: agregar un servicio backend que recalcule subtotales, IVA y totales cada vez que cambien los ítems. Mientras tanto, sigue el flujo descrito aquí para evitar sorpresas.
