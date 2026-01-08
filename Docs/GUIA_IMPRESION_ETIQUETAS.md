# 🏷️ Guía Rápida: Impresión de Etiquetas

## ¿Cómo imprimir una etiqueta?

### Paso 1: Ir a Revisiones Técnicas

1. Navega a **Revisiones Técnicas** en el menú lateral
2. Selecciona el lote o ve a la vista global de series

### Paso 2: Imprimir desde la tabla

En la tabla de series, verás 3 botones en cada fila:

- 👁️ **Ver** - Ver detalles de la serie
- 🖨️ **Imprimir** - Imprimir etiqueta (¡nuevo!)
- 🗑️ **Eliminar** - Eliminar revisión

### Paso 3: Preview y configuración

Al hacer clic en 🖨️:

1. Se abre un **preview** de cómo se verá la etiqueta
2. Verifica que la información sea correcta
3. Haz clic en **"Imprimir"**

### Paso 4: Configurar impresora

En el diálogo de impresión:

- **Destino**: Selecciona tu impresora térmica (ej: "DP TI 2do piso")
- **Páginas**: Todas
- **Copias**: 1 (o las que necesites)
- **Diseño**: Vertical
- Haz clic en **"Imprimir"**

---

## 📐 Especificaciones de la Etiqueta

### Tamaño

- **6 x 8 cm** (60mm x 80mm)
- Orientación: **Vertical**

### Contenido

1. **Header**: Logo ECOPC + QR pequeño
2. **Tipo de equipo**: Notebook, Desktop, Monitor, etc.
3. **Categoría**: A, B, C, D
4. **Número de Serie**: Código único del equipo
5. **QR Grande**: Escaneable para ver detalles online
6. **Observaciones**: Especificaciones técnicas resumidas

### Ejemplo de QR

Al escanear el código QR con un celular:

- Se abre el navegador
- Muestra el detalle completo de la serie
- Incluye historial de revisión

---

## ⚙️ Configuración de Impresora (Una vez)

### Windows - Configurar tamaño personalizado

1. **Abrir Configuración de Impresoras**
    - Presiona `Win + I`
    - Ve a **"Dispositivos"** → **"Impresoras y escáneres"**

2. **Seleccionar tu impresora térmica**
    - Busca tu impresora (ej: "DP TI 2do piso")
    - Haz clic en ella
    - Selecciona **"Administrar"**

3. **Crear tamaño personalizado**
    - Clic en **"Preferencias de impresión"**
    - Busca **"Tamaño de papel"** o **"Paper Size"**
    - Clic en **"Personalizado"** o **"Custom"**
    - Configura:
        - **Ancho**: 60 mm
        - **Alto**: 80 mm
        - **Nombre**: "Etiqueta 6x8"
    - Guarda y aplica

4. **Verificar configuración**
    - La próxima vez que imprimas, selecciona "Etiqueta 6x8"
    - Confirma que la orientación sea **Vertical**

---

## 🚀 Modo Avanzado: Impresión Rápida

### Para usuarios que imprimen muchas etiquetas

Si necesitas **imprimir sin el diálogo cada vez**:

#### Chrome/Edge con Auto-Print

1. Cierra Chrome/Edge completamente
2. Crea un **acceso directo** del navegador
3. Edita las **propiedades** del acceso directo
4. En **"Destino"**, agrega al final:

    ```
    --kiosk-printing
    ```

    Ejemplo completo:

    ```
    "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing
    ```

5. **Importante**: También configura tu impresora térmica como **predeterminada**
    - Ve a Configuración → Impresoras
    - Clic derecho en tu impresora térmica
    - Selecciona **"Establecer como predeterminada"**

6. Abre el ERP desde este acceso directo
7. Ahora al hacer clic en **"Imprimir"**, la etiqueta saldrá automáticamente

---

## ❓ Preguntas Frecuentes

### ¿Puedo imprimir varias etiquetas a la vez?

Actualmente, se imprime una por una. En una futura actualización se permitirá selección múltiple.

### ¿El QR funciona offline?

No. El QR apunta a la URL del sistema, necesitas conexión a internet para verlo.

### ¿Puedo cambiar lo que muestra el QR?

Sí, contacta al equipo de desarrollo para personalizar el contenido del QR.

### ¿Funciona con impresoras láser/inkjet normales?

Sí, pero está optimizado para impresoras térmicas. En impresoras normales:

- Selecciona tamaño de papel pequeño
- O imprime en A4 y recorta

### ¿Puedo guardar la etiqueta como PDF?

Actualmente no. Usa la opción "Guardar como PDF" en el diálogo de impresión de Windows.

### La etiqueta sale muy grande/pequeña

- Verifica que el **tamaño de papel** sea 60mm x 80mm
- Ajusta el **escalado** a 100% en las opciones de impresión
- En algunas impresoras, desactiva **"Ajustar a página"**

---

## 🐛 Problemas Comunes

### El QR no se escanea

- Aumenta el brillo de la pantalla/papel
- Asegúrate de que la impresión no esté borrosa
- Usa una app de escáner QR (Google Lens, apps nativas)

### Falta información en la etiqueta

- Verifica que la revisión técnica esté completa
- Algunas series pueden no tener todas las observaciones

### El botón de impresora no aparece

- Refresca la página (F5)
- Asegúrate de estar en la tabla de series
- Contacta a soporte si persiste

---

## 📞 Soporte

Para problemas o dudas:

1. **IT Interno**: Extensión 123
2. **Desarrollo**: desarrollo@ecopc.cl
3. **Documentación**: Ver archivo `PRINT_LABEL_README.md`
