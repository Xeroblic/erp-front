# ZF-16 — Cartera de crédito por filial

**Base:** `feat/pagos-diferidos`
**Rama:** `feat/cartera-credito-zf16`

## Resumen

Incorpora la cartera de crédito por subsidiaria para Cuentas por Cobrar. La vista consume el listado paginado de perfiles, permite buscar por razón social o RUT, filtrar vigentes/suspendidos/todos y editar las condiciones de crédito desde la fila.

## Cambios

- Agrega el contrato y servicio de `GET /subsidiaries/{subsidiary}/credit-profiles` con caché por filial.
- Expone ruta y navegación por `view-deferred-payment`, sin restringir por nombre de rol; Cobranza queda habilitada mediante su permiso.
- Muestra cupo, usado, disponible, plazo y estado; resalta los cupos excedidos y distingue suspendido de sin techo.
- Enlaza al detalle del cliente y a Pagos diferidos filtrado por `customer_sale_id`.
- Reutiliza el PUT de perfil con gate `edit-deferred-payment` y scope contextual.
- Invalida la cartera tras cambios de perfil, documentos o abonos para no mostrar saldos en caché.

## Validación

- `node_modules/.bin/tsc.cmd --noEmit`
- `node_modules/.bin/vitest.cmd run src/services/__tests__/deferredPaymentsService.test.ts` — 7 pruebas aprobadas.
- `git diff --check origin/feat/pagos-diferidos...HEAD`
- ESLint del módulo nuevo aprobado al excluir la regla histórica `import/extensions`; el lint normal sigue bloqueado por deuda preexistente de CRLF/imports.

## Revisión

Revisión defect-first del rango completo contra `origin/feat/pagos-diferidos`: sin hallazgos abiertos. Se corrigió durante la revisión la invalidación de caché de cartera tras mutaciones de documentos y cobros.

## Pendientes manuales

- Smoke con rol `credit-collections` y alcance válido sobre una subsidiaria.
- Confirmar el mensaje 403 para una subsidiaria fuera de alcance.
- Ejercitar visualmente búsqueda, paginación, edición y los estados suspendido/sin techo/sobregirado.
