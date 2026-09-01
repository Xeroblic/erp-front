---
name: full-ts
description: Modelar tipos, interfaces, DTOs, contratos API y schemas Yup para Zentria ERP. Usar cuando el usuario pida modelado de datos, validación o mayor seguridad de tipos.
---

# Contratos TypeScript de Zentria

Leer primero `CLAUDE.md` e inspeccionar contratos, respuestas y convenciones existentes. No inventar campos de dominio sin evidencia; si son una propuesta, identificarlos como tales.

## Reglas

- Evitar `any`; usar `unknown` y narrowing en fronteras inciertas.
- Representar explícitamente `null` y `undefined` según el contrato real.
- Usar Yup para schemas de formularios nuevos, alineado con Formik y `CLAUDE.md`.
- No introducir Zod mientras no forme parte del estándar del repositorio.
- Preferir unions literales o enums según interoperabilidad, serialización y estilo existente; no imponer enums a todo conjunto cerrado.
- Distinguir entidad, payload de creación/edición y respuesta cuando sus formas realmente difieran.
- Reutilizar wrappers y contratos API existentes; no envolver toda respuesta en un genérico ficticio.
- Ubicar tipos locales junto al módulo y tipos compartidos en la ubicación canónica existente.
- No fabricar entidades centinela incompletas con `as Entidad` para satisfacer una firma. Expresar ausencia con `null` o un tipo mínimo honesto y manejarla en el consumidor.
- Modelar multipart desde el contrato real: incluir archivos en el payload de la mutación principal cuando la API sea atómica y reservar endpoints de adjuntos para los flujos que efectivamente los requieran.
- Para archivos aceptados por extensión y MIME, no rechazar en cliente una extensión permitida sólo porque el navegador entregue `file.type` vacío o genérico. Mantener la validación de contenido definitiva en el backend.
- Preservar los mensajes de validación del backend cuando el contrato no defina una localización o mapeo frontend; no reemplazarlos por textos genéricos que oculten la causa real.

## Validación

- Conservar límites y normalización de campos opcionales; opcional no significa sin restricciones.
- Normalizar opcionales de texto al borde del payload: tras `trim`, una cadena vacía se envía como `null` cuando ese sea el contrato. Mantener la misma regla en creación, edición y reintento.
- Validar en runtime las fronteras que lo necesiten con las herramientas ya adoptadas por el proyecto.
- Para librerías externas, respetar su firma pública completa y evitar casts inseguros.

Entregar solamente los tipos y schemas necesarios para el alcance, con nombres consistentes con el módulo.
