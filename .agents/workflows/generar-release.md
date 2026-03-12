---
description: Crear las notas de la versión basándose en los commits usando análisis semántico
---

# 🚀 Workflow: Generar Nuevo Release de Zentria

**Objetivo:** Este agente tomará el historial de Git desde el último _tag_ (o el último mes/tiempo especificado), agrupará los commits de forma inteligente (Features, Bug Fixes, Refactors, etc.), redactará unas notas de versión sólidas y profesionales, y actualizará la documentación del proyecto sin sobreescribir el historial anterior. NO UTILIZAR EMOJIS

---

## 📋 Instrucciones Paso a Paso para el Agente

### Paso 1: Entender el Contexto y Obtener los Commits
1. Ejecuta el comando para listar los tags recientes `git tag --sort=-v:refname | head -n 5` para entender qué versión es la actual y cuál fue la anterior.
2. Identifica en qué commit te quedaste. Si el usuario te la proporciona (ej: `v1.1.7`), debes comparar desde la última versión conocida (ej: `v1.1.6`).
3. Ejecuta `git log <ultima_version>..HEAD --oneline --no-merges` (o simplemente los últimos commits del mes si no hay tags estrictos recientes) para obtener la materia prima.

### Paso 2: Análisis Semántico y Clasificación
Analiza los mensajes de los commits obtenidos en el paso anterior y clasifícalos con el siguiente criterio:
*   ✨ **Nuevas Funcionalidades (Features):** Commits que comiencen con `feat:`, o que describan agregar, implementar, o introducir algo nuevo.
*   🐛 **Corrección de Errores (Bug Fixes):** Commits que comiencen con `fix:`, "arreglo", "correccion", o que solucionen un problema.
*   🛠️ **Refactorización y Mejoras (Refactors/Chores/Docs):** Commits con `refactor:`, `docs:`, `chore:`, o mejoras de código y performance.
*   ⚠️ **Cambios Críticos / Deprecaciones (Breaking Changes):** Cambios en base de datos, arquitectura o dependencias críticas.

> *Importante:* No pongas mensajes duplicados (elimina commits irrelevantes como "prueba", "cxvc" o "asasa"). Traduce los mensajes al Español si alguno está en inglés para mantener un log consistente y profesional.

### Paso 3: Generar Archivo de Versión Individual
Crea de manera automática el archivo de la versión actual. 
1.  Usa el formato de ruta: `RELEASES/vX.Y.Z.md` (ejemplo `RELEASES/v1.1.6.md`).
2.  El archivo debe tener este formato:

```markdown
# Zentria ERP - Versión vX.Y.Z
**Fecha de Lanzamiento:** DD de Mes, YYYY

## 🚀 Resumen de la Versión
[Escribe aquí un resumen narrativo de 1 o 2 párrafos resaltando el valor de esta versión y qué se atacó de forma principal]

## ✨ Nuevas Funcionalidades
- **[Componente/Módulo]:** Descripción detallada de lo que hace.
- ...

## 🐛 Corrección de Errores
- ...

## 🛠️ Mejoras y Tareas Técnicas
- ...

## ⚠️ Notas de Actualización (Si aplica)
- [Instrucciones especiales para desplegar]
```

### Paso 4: Actualizar `RELEASE_NOTES.md` en la Raíz
Debes agregar la nueva versión al inicio de `RELEASE_NOTES.md` (sin borrar el historial).
1. Lee primero el contenido actual de `RELEASE_NOTES.md` usando la herramienta de leer archivo.
2. Crea el texto de la nueva versión con un Header de nivel 2 (ej. `## [v1.1.7] - YYYY-MM-DD`).
3. Pon la lista resumida de cambios más importantes.
4. Concatena el texto viejo de `RELEASE_NOTES.md` debajo del nuevo y guárdalo usando la herramienta de `write_to_file` con `Overwrite: true` (reemplazo completo con el nuevo texto).

### Paso 5: Finalizar
Usa la herramienta `notify_user` para avisarle que la Release está generada correctamente informando de los archivos actualizados y resumiendo brevemente lo que descubriste en los commits.