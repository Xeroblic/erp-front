# Funcionalidad de Impresión de Etiquetas - Revisiones Técnicas

## 📋 Descripción

Sistema de impresión de etiquetas (6x8cm) con código QR para las revisiones técnicas. Permite imprimir etiquetas directamente desde la tabla de series con toda la información del equipo.

## 🎯 Características

- ✅ Etiquetas de **6x8 cm** (60mm x 80mm) optimizadas para impresoras térmicas
- ✅ Generación automática de **códigos QR** que apuntan al detalle de la serie
- ✅ Formato similar a las etiquetas de ECOPC
- ✅ Información incluida:
    - Logo ECOPC
    - Tipo de equipo
    - Categoría/Grado
    - Número de serie
    - QR grande centrado
    - Observaciones técnicas

## 🚀 Uso

1. **Desde la tabla de revisiones técnicas**, cada serie ahora tiene un botón de impresora (🖨️) en las acciones
2. Al hacer clic, se abre un **preview de la etiqueta**
3. Haz clic en **"Imprimir"** para enviar a la impresora

## ⚙️ Configuración de Impresora

### Para impresión silenciosa (sin diálogo)

Si deseas que la etiqueta se imprima **directamente sin mostrar el diálogo del sistema**, necesitas:

#### Windows - Chrome/Edge:

```bash
# Crea un acceso directo a Chrome con este parámetro:
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing
```

#### Configurar tamaño de papel personalizado:

1. Ve a **Configuración de Windows** → **Impresoras y escáneres**
2. Selecciona tu impresora térmica (ej: "DP TI 2do piso")
3. Clic en **"Administrar"** → **"Preferencias de impresión"**
4. En **Tamaño de papel**, crea un tamaño personalizado:
    - Ancho: **60 mm**
    - Alto: **80 mm**
    - Nombre: "Etiqueta 6x8"

### Para impresión normal (con diálogo)

Si prefieres revisar antes de imprimir:

1. Simplemente haz clic en "Imprimir"
2. En el diálogo:
    - Selecciona tu impresora térmica
    - Asegúrate de que el tamaño sea "60mm x 80mm"
    - Ajusta la orientación a **Vertical**
    - Confirma la impresión

## 🔧 Archivos modificados

### Nuevos archivos:

- `src/pages/technical-reviews/components/items/PrintLabel.tsx` - Componente principal de impresión

### Archivos modificados:

- `src/pages/technical-reviews/components/items/ItemList.tsx` - Integración del botón en acciones
- `package.json` - Agregada dependencia `qrcode.react`

## 📦 Dependencias

```json
{
	"qrcode.react": "^4.1.0"
}
```

## 🎨 Personalización

### Modificar el contenido del QR

Edita la línea en `PrintLabel.tsx`:

```typescript
const qrContent = `${window.location.origin}/technical-reviews/items/${item.id}`;
```

Puedes cambiarlo por:

- Un JSON con información: `JSON.stringify({ id: item.id, serial: item.serial_number })`
- Un enlace externo: `https://tusistema.com/series/${item.serial_number}`
- Texto plano: `item.serial_number`

### Modificar el diseño

Los estilos están en línea en el componente `PrintLabel.tsx`. Puedes ajustar:

- Tamaños de fuente
- Márgenes y padding
- Posición de elementos
- Colores

### Cambiar el tamaño de la etiqueta

Modifica estas constantes en el componente:

```typescript
width: '60mm',  // Ancho
height: '80mm', // Alto

@page {
  size: 60mm 80mm;
  margin: 0;
}
```

## ⚠️ Limitaciones del Navegador

- **No se puede forzar impresión silenciosa** sin configuración del navegador por seguridad
- Algunos navegadores pueden no respetar el `@page size` exactamente
- Para producción en kioscos, se recomienda usar el flag `--kiosk-printing`

## 🐛 Troubleshooting

### La etiqueta no tiene el tamaño correcto

- Verifica que tu impresora tenga configurado el tamaño 60mm x 80mm
- Asegúrate de seleccionar el tamaño correcto en el diálogo de impresión

### El QR no se escanea correctamente

- Aumenta el tamaño del QR en `<QRCodeSVG size={100} />`
- Verifica que la URL o texto no sea demasiado largo

### La impresión se ve cortada

- Reduce el contenido de las observaciones
- Ajusta el `font-size` en los estilos de impresión

### No aparece el botón de impresora

- Verifica que estás en la vista de tabla de revisiones técnicas
- Asegúrate de que el componente `ItemList` se esté usando

## 📝 Notas

- Los datos se obtienen directamente del item en la tabla (no hay llamada API adicional)
- El QR se genera en el cliente con la librería `qrcode.react`
- Los estilos de impresión están optimizados para impresoras térmicas
- El modal muestra un preview antes de imprimir
