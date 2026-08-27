# Registro de Cambios (Release Notes) - Zentria ERP

Historial completo de versiones y modificaciones de la plataforma corporativa. Cada versión tiene un archivo detallado dentro de la carpeta `Docs/releases/`.

---

## [v2.3.1] - 2026-08-27

**Enfoque de la versión:** Estabilidad de Revisiones Técnicas y endurecimiento de contratos visibles de catálogo, ventas y autorización.

### Puntos Destacados:

- **Revisiones técnicas:** ausencia explícita de RAM y almacenamiento, preservación del borrador al alternar el estado y paridad visual para notebook, desktop y AIO.
- **Catálogo y ventas:** contratos seguros para toggles de estado y visualización/edición consistente del tipo de cliente de ventas.
- **Autorización y calidad:** fallback deshabilitado accesible en acciones protegidas y saneamiento de imports, formato y finales de línea.

[Ver archivo detallado en Docs/releases/v2.3.1.md](./Docs/releases/v2.3.1.md)

---

## [v2.3.0] - 2026-08-20

**Enfoque de la versión:** Consolidación operativa de Pagos Diferidos y Cartera de Crédito, con correcciones de aislamiento organizacional, formularios financieros y componentes compartidos.

### Puntos Destacados:

- **Operación financiera:** captura de precios netos con conversión a bruto e IVA, pegado masivo de seriales, comprobantes arrastrados y mejoras de recordatorios.
- **Cartera y contexto:** eliminación segura de perfiles suspendidos, aislamiento de respuestas por subsidiaria y exportación a Excel de cartera y pagos diferidos.
- **Accesibilidad y calidad:** foco en campos inválidos y comportamiento correcto de modales apilados.

[Ver archivo detallado en Docs/releases/v2.3.0.md](./Docs/releases/v2.3.0.md)

---

## [v2.2.0] - 2026-08-10

**Enfoque de la versión:** Gestión integral de pagos diferidos y cartera de crédito, con mejoras de seguridad en roles y permisos y correcciones del flujo de activación de usuarios.

### Puntos Destacados:

- **Pagos diferidos:** dashboard, documentos, abonos, comprobantes, anulaciones, cierre manual y acciones protegidas por permisos.
- **Crédito y cobranza:** cartera por subsidiaria, perfil de crédito de clientes, control de cupo y bloqueo de operaciones para perfiles suspendidos.
- **Clientes:** mejoras de alta y edición rápida, validación contextual y correo de cobranza.
- **Roles y permisos:** etiquetas obtenidas desde `display_name` y protección del rol canónico `super-admin`.
- **Activación de usuarios:** corrección del crash de hooks, fallback independiente de Redux y mensajes seguros según el estado HTTP.
- **Calidad:** suite completa con 64 archivos y 384 pruebas aprobadas; el nuevo dominio financiero aporta 19 suites y 143 pruebas focalizadas.

[Ver archivo detallado en Docs/releases/v2.2.0.md](./Docs/releases/v2.2.0.md)

---

## [v2.1.0] - 2026-07-22

**Enfoque de la versión:** Nuevas funcionalidades para revisiones técnicas, integraciones WooCommerce, cotizaciones y ventas. Refactor completo del módulo de Bodegas, modularización de tabla de productos y nueva infraestructura de pruebas.

### Puntos Destacados:

- **Revisiones técnicas:** galería de fotografías por ítem, acceso rápido desde subheader, soporte para segunda batería en notebooks.
- **Integraciones WooCommerce:** soft-delete, papelera y restauración de integraciones con detección de duplicados.
- **Cotizaciones:** descarga en Excel además de PDF con plantilla corporativa.
- **Bodegas:** refactor completo alineado a la arquitectura estándar (hooks, Formik, useCurrentBranch).
- **Productos:** modularización de ProductsTableV2 (~990 → múltiples componentes), corrección de Badge con forwardRef.
- **Ventas:** corrección del botón de eliminar con modal de confirmación y bloqueos por estado.
- **Notificaciones:** apertura con un solo clic, eliminación de doble toque.

[Ver archivo detallado en Docs/releases/v2.1.0.md](./Docs/releases/v2.1.0.md)

---

## [v2.0.0] - 2026-07-09

**Enfoque de la versión:** Mayor release del proyecto. Integración definitiva de `develop` → `main`. Suite completa de WooCommerce, refactor profundo de contexto organizacional, y mejoras en flujo de ventas y catálogo.

### Puntos Destacados:

- **Suite WooCommerce:** sincronización bidireccional de productos, emparejamiento manual, overrides por canal, diagnóstico en tiempo real y hub unificado con pestañas.
- **Refactor de contexto:** centralización del switch organizacional (`useOrgContextSwitcher`), interfaces alineadas al contrato real del backend, eliminación de código legacy/deprecated.
- **Flujo de ventas:** cierre con `can_close`, inventario finalizado, confirmación de series y devoluciones, modales apilables.
- **Catálogo:** pestaña de revisiones técnicas por producto, overrides de precio/nombre/visibilidad, tabla comparativa ERP vs WooCommerce.

[Ver archivo detallado en Docs/releases/v2.0.0.md](./Docs/releases/v2.0.0.md)

---

## [v1.7.0-rc.1] - 2026-07-02

**Enfoque de la versión:** Release Candidate previo a v2.0.0. Suite WooCommerce feature-complete a nivel frontend, incluyendo sincronización de productos, importación de términos, webhooks y hub unificado con pestañas.

### Puntos Destacados:

- **WooCommerce:** sincronización bidireccional de productos, publicar/despublicar con advertencia de papelera, guía visual de sync, decisión consciente de SKU, resolución de imagen al vincular.
- **Integraciones:** importación de términos con deshacer, toggle rápido de activación, desvinculación masiva (super-admin), catálogo de webhooks entrantes.
- **Ventas/Productos:** visibilidad de soft-holds, bandeja de ventas sin serie, botón "No Enciende" en revisión técnica.

[Ver archivo detallado en Docs/releases/v1.7.0-rc.1.md](./Docs/releases/v1.7.0-rc.1.md)

---

## [v1.6.0] - 2026-07-02

**Enfoque de la versión:** Consolidación en `main` del trabajo acumulado desde v1.1.8. Gestión de casillas/lockers, refactor de revisión técnica, sistema de roles y permisos administrable, e infraestructura de build/despliegue.

### Puntos Destacados:

- **Casillas/Lockers:** flujos públicos de check-in/checkout, PIN, sugerencia de casilleros, bloqueo de cuenta y escaneo QR.
- **Revisión técnica:** modal de pre-llenado, sección de energía para notebooks, restricción a super-admin.
- **Roles y Permisos:** nueva página de gestión con componentes base reutilizables y guard anti-doble-click.
- **Infraestructura:** GitHub Actions para despliegue automatizado, migración a pnpm.

[Ver archivo detallado en Docs/releases/v1.6.0.md](./Docs/releases/v1.6.0.md)

---

## [v1.1.8] - 2026-04-16

**Enfoque de la versión:** Refactorización integral para estabilizar el frontend en `develop`, eliminando módulos legacy no vigentes y consolidando estructura para despliegue en producción.

### Puntos Destacados:

- **Limpieza estructural:** Depuración de componentes, assets y vistas obsoletas para reducir superficie de errores y complejidad de mantenimiento.
- **Consolidación de UI:** Ajustes en componentes base de formularios y sistema visual para mantener comportamiento consistente en distintas vistas.
- **Optimización de dashboards y rutas:** Reorganización de piezas del dashboard y simplificación de rutas para el flujo activo.
- **Versionado de release:** Actualización de versión del proyecto a `1.1.8` para alinear el ciclo de entrega.

[Ver archivo detallado en Docs/releases/v1.1.8.md](./Docs/releases/v1.1.8.md)

---

## [v1.1.7] - 2026-03-12

**Enfoque de la versión:** Mejoras sustanciales en visualización y resolución de errores críticos. Implementación extensa del sistema de gestión de roles, Portal de pedidos y Reloj QR en RRHH.

### Puntos Destacados:

- **Gestión de Roles y Usuarios:** Tabla y panel administrativo para roles y permisos CRUD integrados con Redux.
- **Portal de Pedidos:** Nueva arquitectura de navegación para ventas externas y tracking de links públicos.
- **Reloj QR Inteligente:** Escáner funcional para control de asistencia de RRHH con soporte para cámara nativa.
- **Dashboards Visuales:** Componentes y gráficos actualizados en ventas, proyectando análisis predictivos (Smart Insights).
- **Consolidación Técnica:** Resoluciones arquitectónicas críticas duplicadas en TS y refactorización de headers y footers maestros.

<!-- Nota: no existe archivo detallado para v1.1.7 -->

---

## [v1.1.6] - 2026-03-09

**Enfoque de la versión:** Primer hito de Zentria ERP. Infraestructura base del frontend con módulos críticos para operación logística y técnica. Versionado independizado del core backend.

### Puntos Destacados:

- **Revisiones Técnicas:** flujo standalone y por lotes, formularios dinámicos por tipo de equipo, scoring automático y auto-guardado inteligente.
- **Integraciones WooCommerce 2.0:** gestión centralizada de API keys, webhooks, mapeo de productos y sincronización de stock.
- **RBAC:** sistema de permisos granular, permission guards y selector de sucursal preferida.

[Ver archivo detallado en Docs/releases/v1.1.6.md](./Docs/releases/v1.1.6.md)

---
