# Plan frontend — Pagos Diferidos ZF-5, ZF-6 y ZF-7

**Actualizado:** 31-07-2026  
**Rama:** `feat/pagos-diferidos-zf5-zf7`  
**Alcance:** exclusivamente frontend; sin cambios de backend

## 1. Objetivo

Consolidar la parte disponible de Pagos Diferidos: dashboard, detalle y alta/edición. La implementación comenzó con datos simulados, pero la transición al servicio HTTP ya está completada. La aplicación tiene un solo flujo de ejecución y no utiliza flags para seleccionar el origen de datos.

ZF-8 y ZF-9 no forman parte de esta rama.

## 2. Estado por issue

| Issue | Estado | Entrega |
|---|---|---|
| ZF-5 | Terminado | KPI, filtros, listado, paginación y acceso al detalle |
| ZF-6 | Terminado en el alcance disponible | Lectura completa y acceso a edición; acciones de pago excluidas |
| ZF-7 | Terminado | Creación y edición con clientes y usuarios obtenidos por servicio |
| ZF-8 | Fuera de alcance | Abonos, marcar pagada, anulación y eliminación |
| ZF-9 | Fuera de alcance | Perfil de crédito del cliente |

## 3. Arquitectura final

```text
Vista / componentes
        ↓
Hooks del módulo + useCurrentBranch
        ↓
Redux Toolkit
        ↓
deferredPaymentsService
        ↓
ApiService
```

Reglas:

- la subsidiaria activa es obligatoria para consultar o mutar;
- listado, resumen y detalle usan el servicio del módulo;
- creación y edición invalidan los datos relacionados;
- `AbortSignal` y `requestId` protegen de carreras;
- las pruebas usan datos estáticos mínimos y no implementan un origen alternativo;
- no existen configuraciones ni archivos de datos simulados en el código ejecutable.

## 4. ZF-5 — Dashboard

### Entregado

- `GET /subsidiaries/{subsidiaryId}/deferred-payments/summary`.
- `GET /subsidiaries/{subsidiaryId}/deferred-payments`.
- KPI: total por cobrar, vencido, por vencer en siete días y pendiente.
- búsqueda, estado, rango de fechas y paginación.
- orden por fecha de vencimiento.
- montos CLP, estados y situación temporal.
- carga, vacío, error y reintentos independientes.
- clic o teclado para abrir ZF-6.

### Criterios verificados

- los KPI se obtienen del resumen;
- `overdue` se trata como condición temporal;
- un documento pagado no muestra vencimiento;
- el cambio de subsidiaria limpia los datos anteriores;
- el rango inválido no dispara una consulta.

## 5. ZF-6 — Detalle

### Entregado

- `GET /subsidiaries/{subsidiaryId}/deferred-payments/{id}`.
- cabecera, cliente, fechas, estado, progreso y saldo;
- encargados, ítems, seriales, abonos, adjuntos y notas disponibles;
- apertura de ZF-7 para documentos editables;
- bloqueo de edición para documentos pagados.

### Fuera de esta rama

- registrar o anular abonos;
- marcar como pagada;
- eliminar documentos.

Estas acciones dependen del alcance posterior de ZF-8.

## 6. ZF-7 — Crear y editar

### Entregado

- `POST /subsidiaries/{subsidiaryId}/deferred-payments`.
- `PATCH /subsidiaries/{subsidiaryId}/deferred-payments/{id}`.
- formulario Formik con validación Yup;
- búsqueda de clientes mediante servicio;
- carga de usuarios para encargados;
- ítems dinámicos, seriales y notas;
- persistencia de valores al editar;
- advertencia no bloqueante cuando el servicio informa que se excedió el límite de crédito;
- permiso `edit-deferred-payment` para edición.

### Reglas

- mínimo un ítem;
- cantidades y montos válidos;
- total completo mayor que cero;
- fechas en formato `yyyy-mm-dd` para el contrato;
- edición deshabilitada cuando el documento está pagado.

La precarga basada en perfil de crédito corresponde a ZF-9 y no se implementa aquí.

## 7. Transición desde datos simulados

La transición quedó cerrada con estas acciones:

1. eliminación de la selección de origen en tiempo de ejecución;
2. eliminación de la variable de entorno asociada;
3. eliminación de los archivos de configuración y datos simulados del slice;
4. conexión directa de thunks y hooks con `deferredPaymentsService`;
5. uso obligatorio de la subsidiaria activa;
6. eliminación de las suites que reproducían consultas y mutaciones del origen anterior;
7. actualización de nombres de pruebas para describir integración y servicio.

No existe un paso pendiente para “activar” el servicio: es el comportamiento normal del módulo.

## 8. Verificación

Comandos:

```text
pnpm exec tsc --noEmit
pnpm exec vitest run src/pages/comercial/pagosDiferidos src/services/__tests__/deferredPaymentsService.test.ts src/store/slices/deferredPayments/__tests__/deferredPaymentsThunks.test.ts
```

Resultado registrado:

- TypeScript: sin errores.
- Vitest: 12 suites / 71 pruebas aprobadas.

Cobertura principal:

- servicio y normalización de respuestas;
- thunks de lectura y mutación;
- hooks de listado y detalle;
- concurrencia, cancelación y subsidiaria;
- tabla y drawer;
- creación, edición, validaciones y selección remota.

## 9. Definition of Done

- [x] Solo frontend.
- [x] ZF-5, ZF-6 y ZF-7 implementados en el alcance disponible.
- [x] Un único flujo de datos mediante servicio.
- [x] Sin flags ni ramas alternativas de ejecución.
- [x] Sin suites que reproduzcan el origen de datos anterior.
- [x] Formik + Yup y contratos TypeScript sin `any` nuevos.
- [x] Permisos y subsidiaria aplicados.
- [x] Compilación y pruebas focalizadas aprobadas.
- [x] ZF-8, ZF-9 y backend sin modificaciones.

## 10. Trabajo posterior

El trabajo futuro debe realizarse en ramas separadas:

- ZF-8: acciones de pago y eliminación.
- ZF-9: perfil de crédito y precarga del vencimiento.

No se debe reintroducir la arquitectura anterior de selección de origen para desarrollar esos issues.
