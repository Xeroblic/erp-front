# Guía de Diseño ERP Frontend

## Reglas de Diseño y Colores

### **REGLA FUNDAMENTAL: NO USAR COLORES PERSONALIZADOS EN COMPONENTES UI**

El sistema ya tiene colores globales definidos. NO se deben agregar colores personalizados a los componentes de interfaz de usuario.

## Elementos que SÍ pueden tener colores:

### ✅ **Botones de Acción**

-   Botones primarios: `bg-blue-600 hover:bg-blue-700`
-   Botones de éxito: `bg-green-600 hover:bg-green-700`
-   Botones de peligro: `bg-red-600 hover:bg-red-700`
-   Botones secundarios: `bg-gray-200 hover:bg-gray-300`

### ✅ **Estados e Iconos**

-   Estados de procesos (pendiente, aprobado, rechazado, etc.)
-   Iconos de acciones (ver, editar, eliminar)
-   Badges de estado importantes

### ✅ **Alertas y Notificaciones**

-   Mensajes de error: colores rojos
-   Mensajes de éxito: colores verdes
-   Mensajes de advertencia: colores amarillos

## Elementos que NO deben tener colores personalizados:

### ❌ **Inputs y Formularios**

-   Campos de entrada de texto
-   Selectores
-   Textareas
-   Checkboxes y radios
-   **Usar solo:** `focus:outline-none focus:ring-2 focus:ring-gray-500`

### ❌ **Componentes de Navegación**

-   Menús
-   Breadcrumbs
-   Tabs

### ❌ **Contenedores y Layout**

-   Cards
-   Panels
-   Modals (excepto botones dentro)
-   Tablas (excepto estados en celdas)

### ❌ **Texto y Tipografía**

-   Párrafos
-   Títulos (excepto estados especiales)
-   Labels de formulario

## Clases Permitidas para Elementos Neutros:

```css
/* Fondos */
bg-white
bg-gray-50
bg-gray-100

/* Bordes */
border-gray-300
border-gray-200

/* Texto */
text-gray-900
text-gray-700
text-gray-600
text-gray-500

/* Focus states */
focus:ring-gray-500
focus:border-gray-500
```

## Ejemplo de Modal Correcto:

```tsx
// ✅ CORRECTO
<div className="bg-white rounded-lg shadow-xl">
  <input className="border-gray-300 focus:ring-gray-500" />
  <button className="bg-blue-600 hover:bg-blue-700">Guardar</button>
  <button className="bg-gray-200 hover:bg-gray-300">Cancelar</button>
</div>

// ❌ INCORRECTO
<div className="bg-white rounded-lg shadow-xl">
  <input className="border-gray-300 focus:ring-blue-500" />
  <span className="bg-green-100 text-green-800">Estado</span>
</div>
```

## Orden de Prioridad en el Diseño:

1. **Funcionalidad** - El componente debe funcionar correctamente
2. **Consistencia** - Seguir los patrones establecidos
3. **Simplicidad** - Evitar colores innecesarios
4. **Accesibilidad** - Mantener contraste y legibilidad

---

**RECORDATORIO:** Esta guía debe seguirse en TODOS los componentes futuros. Los colores deben ser justificados y tener una función específica, no decorativa.
