# ZF-16 — Cartera de crédito por filial

**Base:** `feat/pagos-diferidos`
**Rama:** `feat/cartera-credito-zf16`

## Resumen

Incorpora la cartera de crédito por subsidiaria para Cuentas por Cobrar. La vista consume el listado paginado de perfiles, permite buscar por razón social o RUT, filtrar vigentes/suspendidos/todos y editar las condiciones de crédito desde la fila.

## Cambios

- Agrega el contrato y servicio de `GET /subsidiaries/{subsidiary}/credit-profiles` con caché por filial.
- Expone ruta y navegación por `view-deferred-payment`, sin restringir por nombre de rol; Cobranza queda habilitada mediante su permiso.
- Muestra cupo, usado, disponible, plazo y estado; resalta los cupos excedidos y distingue suspendido de sin techo.
- Enlaza al detalle del cliente y abre Pagos diferidos con razón social o RUT; cuando faltan ambos, abre sin filtro para no buscar el literal de fallback.
- Reutiliza el PUT de perfil con gate `edit-deferred-payment` y scope contextual.
- Invalida la cartera tras cambios de perfil, documentos o abonos para no mostrar saldos en caché.
- Homologa filtros, paginación, acciones y estados visuales con Pagos diferidos; la cartera inicia con 10 filas y resalta saldos negativos.
- Presenta el cupo en CLP redondeado a pesos, sin perder centavos existentes al abrir y guardar sin editar.

## Validación

- `node_modules/.bin/tsc.cmd --noEmit`
- `node_modules/.bin/vitest.cmd run src/services/__tests__/deferredPaymentsService.test.ts src/pages/comercial/pagosDiferidos/__tests__/usePagosDiferidos.test.tsx` — 18 pruebas aprobadas.
- `git diff --check origin/feat/pagos-diferidos`
- ESLint focal: sin errores `prettier/prettier` en el código nuevo; persisten 16 errores `import/extensions` preexistentes en imports sin extensión de los dos módulos revisados.

## Revisión

Revisión defect-first del rango completo contra `origin/feat/pagos-diferidos`: sin hallazgos abiertos. Se corrigió durante la revisión la invalidación de caché, la serialización residual de `customer_sale_id`, la búsqueda de clientes sin razón social, la preservación del mensaje de error del API, el debounce al cambiar de subsidiaria y la preservación de centavos del cupo.

## Pendientes manuales

- Smoke con rol `credit-collections` y alcance válido sobre una subsidiaria.
- Confirmar el mensaje 403 para una subsidiaria fuera de alcance.
- Ejercitar visualmente búsqueda por texto al abrir documentos, paginación, edición y los estados suspendido/sin techo/sobregirado.
