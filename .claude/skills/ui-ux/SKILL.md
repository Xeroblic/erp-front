---
name: ui-ux
description: Crear o revisar componentes React, layouts, formularios y estados visuales con el Design System de Zentria. Usar para JSX, UI, accesibilidad o cumplimiento visual.
---

# UI y Design System de Zentria

Leer primero `CLAUDE.md`, inspeccionar componentes vecinos y verificar rutas y props reales antes de implementar.

## Estándar

- Usar PageWrapper, Subheader y Container en páginas internas completas; no imponer ese árbol a componentes embebidos, modales o drawers.
- Reutilizar Card, Modal, inputs, selects, botones e Icon del proyecto.
- Usar Formik + Yup y propagar correctamente estado, touched, errores y feedback a los controles.
- Usar tokens y variantes existentes; no asumir colores, rutas o APIs desde ejemplos antiguos.
- Mantener interacción accesible por teclado, nombres accesibles y semántica correcta.
- Evitar manipulación directa del DOM cuando estado y renderizado declarativo resuelvan el caso.

## Estados

Distinguir carga, error, vacío y filtros sin coincidencias. No mostrar datos anteriores como vigentes bajo un error o contexto nuevo. Evitar cierres ambiguos de overlays durante operaciones no cancelables y reutilizar el comportamiento del componente compartido cuando exista.

Las acciones iniciadas por el usuario deben dar feedback visible al fallar; no silenciar rechazos de descarga, upload o submit. En descargas autenticadas con `blob`, usar el nombre entregado por `Content-Disposition` cuando exista, adjuntar temporalmente el enlace al DOM y revocar la URL después de iniciar la descarga para mantener compatibilidad entre navegadores.

Un fallo parcial no puede convertir un modal, drawer o pantalla en un callejón sin salida. Bloquear el cierre sólo durante una solicitud activa; cuando la operación financiera ya terminó, mostrar un aviso persistente con una ruta accesible para reintentar o descartar la tarea auxiliar.

En formularios embebidos, evitar formularios HTML anidados. Declarar `type="button"` en acciones secundarias (cancelar, reintentar, editar) y reservar `type="submit"` para la acción de guardado, de modo que no disparen el formulario equivocado.

La visibilidad y disponibilidad de cada acción sensible debe usar el permiso y el scope efectivos de su endpoint. Mostrar un estado suspendido o bloqueado de forma inequívoca y acompañarlo de la acción o condición necesaria para recuperarlo.

## Checklists condicionales

Aplicar solo cuando corresponda:

- Tabla remota: fila de error semántica, empty state correcto y paginación coherente.
- Contenido variable: límites, truncado o corte de palabras sin romper el layout.
- Trigger compuesto o clonado: preservar handlers y foco del hijo.
- Formulario en overlay: estados de submit, cierre y borrador coherentes.
- Componente compartido: probar mouse, teclado y contrato público en su propia suite.

Mantener la vista presentacional cuando aporte claridad, sin forzar una separación artificial en componentes pequeños.
