# Sistema de Autoguardado con Caché

## 📋 Resumen

Se ha implementado un sistema inteligente de autoguardado que **elimina el guardado automático al cambiar de tab** y en su lugar:

1. **Cachea los cambios** en el estado de Formik
2. **Detecta inactividad** (30 segundos sin editar)
3. **Muestra un popup** preguntando si desea guardar
4. **El usuario decide** si guarda o continúa editando

## 🎯 Objetivo Cumplido

✅ **Ya NO se guarda automáticamente al cambiar de tab**
✅ Los cambios se mantienen en caché mientras se navega entre tabs
✅ Después de 30 segundos de inactividad, aparece un popup de confirmación
✅ El usuario tiene control total sobre cuándo guardar

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

1. **`src/hooks/useAutoSave.tsx`**
    - Hook personalizado para detección de cambios e inactividad
    - Maneja temporizadores y estado de guardado
    - ~180 líneas con TypeScript completo

2. **`src/components/ui/SavePrompt.tsx`**
    - Componente de popup de confirmación
    - Diseño consistente con el sistema de diseño
    - Dark mode incluido

3. **`src/hooks/useAutoSave.README.md`**
    - Documentación completa del hook
    - Ejemplos de uso y API reference
    - Troubleshooting y consideraciones

### Archivos Modificados

1. **`src/pages/catalogos/productos/ProductDetail.tsx`**
    - Agregados imports: `SavePrompt`, `useAutoSave`
    - Nuevo componente interno: `AutoSaveHandler`
    - Integrado en el formulario Formik

## 🔄 Flujo de Funcionamiento

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario edita el formulario (cualquier campo)           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Cambios se guardan en caché (estado de Formik)          │
│    - isDirty = true                                         │
│    - Timer de 30s inicia                                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Usuario puede cambiar de tab libremente                 │
│    - NO se guarda automáticamente                           │
│    - Cambios persisten entre tabs                           │
│    - Timer se reinicia con cada edición                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Después de 30 segundos SIN editar                        │
│    - Aparece popup: "¿Guardar cambios?"                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│ Guardar Cambios  │    │ Continuar        │
│ - Ejecuta submit │    │ Editando         │
│ - Toast success  │    │ - Cierra popup   │
│ - isDirty=false  │    │ - Reinicia timer │
└──────────────────┘    └──────────────────┘
```

## 💻 Código de Implementación

### En ProductDetail.tsx

```tsx
// Componente interno que usa el hook
const AutoSaveHandler: React.FC = () => {
	const { submitForm } = useFormikContext<ProductDetailForm>();

	const { showSavePrompt, confirmSave, cancelSave, isSaving } = useAutoSave<ProductDetailForm>({
		delay: 30000, // 30 segundos
		onSave: async () => {
			await submitForm();
		},
		enabled: true,
	});

	return (
		<SavePrompt
			isOpen={showSavePrompt}
			onConfirm={confirmSave}
			onCancel={cancelSave}
			isLoading={isSaving}
			title='¿Guardar cambios?'
			message='Has estado inactivo por 30 segundos y tienes cambios sin guardar. ¿Deseas guardar estos cambios ahora?'
		/>
	);
};

// Dentro del Form de Formik
<Form>
	<AutoSaveHandler />
	{/* Resto del formulario */}
</Form>;
```

## 🎨 UI del Popup

El popup de confirmación incluye:

- **Icono azul**: 🗹 HeroDocumentCheck
- **Título**: "¿Guardar cambios?"
- **Mensaje**: Explicación clara de la situación
- **Info box**: Con icono ℹ️ que explica que el timer se reiniciará si continúa editando
- **Dos botones**:
    - `Continuar editando` (outline, con X)
    - `Guardar cambios` (azul, con ✓)

## ⚙️ Configuración

### Delay Personalizado

Para cambiar el tiempo de inactividad:

```tsx
const { showSavePrompt } = useAutoSave({
	delay: 45000, // 45 segundos
	onSave: handleSave,
});
```

### Deshabilitar Temporalmente

```tsx
const [editMode, setEditMode] = useState(false);

const { showSavePrompt } = useAutoSave({
	delay: 30000,
	onSave: handleSave,
	enabled: editMode, // Solo activo en modo edición
});
```

### Detección Personalizada de Cambios

```tsx
const { isDirty } = useAutoSave({
	delay: 30000,
	onSave: handleSave,
	hasChanges: (current, initial) => {
		// Solo considerar ciertos campos críticos
		return (
			current.name !== initial.name ||
			current.price !== initial.price ||
			current.stock !== initial.stock
		);
	},
});
```

## 🧪 Pruebas Recomendadas

### Test 1: Detección de Cambios

1. Abrir modal de edición de producto
2. Editar un campo en tab "General"
3. **Verificar**: NO se guarda automáticamente
4. Cambiar a tab "Comercial"
5. **Verificar**: Cambios persisten, NO se guardó

### Test 2: Popup de Inactividad

1. Editar cualquier campo
2. Esperar 30 segundos sin tocar nada
3. **Verificar**: Aparece popup "¿Guardar cambios?"
4. Hacer clic en "Continuar editando"
5. **Verificar**: Popup se cierra, timer se reinicia

### Test 3: Guardado desde Popup

1. Editar campo
2. Esperar 30 segundos
3. En el popup, hacer clic en "Guardar cambios"
4. **Verificar**:
    - Loading spinner en botón
    - Toast de éxito
    - Popup se cierra
    - Campo queda guardado

### Test 4: Reinicio de Timer

1. Editar campo
2. Esperar 20 segundos
3. Editar otro campo
4. Esperar 20 segundos más (40 total)
5. **Verificar**: NO aparece popup (timer se reinició)
6. Esperar 10 segundos adicionales
7. **Verificar**: Ahora sí aparece popup (30s desde última edición)

### Test 5: Múltiples Tabs

1. Editar en tab "General"
2. Cambiar a "Comercial"
3. Editar más campos
4. Cambiar a "Contenido"
5. Editar descripción en RichTextEditor
6. **Verificar**: Todos los cambios se mantienen
7. Esperar 30 segundos
8. **Verificar**: Popup aparece con TODOS los cambios acumulados

## 📊 Ventajas del Nuevo Sistema

| Antes                                | Ahora                                 |
| ------------------------------------ | ------------------------------------- |
| ❌ Guardaba al cambiar de tab        | ✅ NO guarda al cambiar de tab        |
| ❌ Sin control del usuario           | ✅ Usuario decide cuándo guardar      |
| ❌ Peticiones frecuentes al servidor | ✅ Una sola petición confirmada       |
| ❌ Sin feedback de cambios           | ✅ Popup claro después de inactividad |
| ❌ Posibles guardados accidentales   | ✅ Confirmación explícita             |

## 🔒 Seguridad y UX

- **Previene pérdida de datos**: Los cambios se cachean en memoria
- **Control explícito**: El usuario siempre confirma antes de guardar
- **Feedback visual**: Popup claro y no intrusivo
- **Dark mode**: Totalmente compatible
- **Responsive**: Funciona en mobile y desktop
- **Accesible**: Teclado y lectores de pantalla compatibles

## 🐛 Debugging

Para ver el estado del autoguardado en consola:

```tsx
const autoSave = useAutoSave({ ... });

useEffect(() => {
  console.log('AutoSave State:', {
    isDirty: autoSave.isDirty,
    showSavePrompt: autoSave.showSavePrompt,
    isSaving: autoSave.isSaving,
  });
}, [autoSave.isDirty, autoSave.showSavePrompt, autoSave.isSaving]);
```

## 📝 Notas Importantes

1. **Hook debe estar dentro de FormikContext**: Por eso usamos `AutoSaveHandler` como componente interno
2. **Un solo handler por formulario**: No agregues múltiples `<AutoSaveHandler />`
3. **Timer se limpia automáticamente**: Al desmontar el componente
4. **Compatible con validación**: Si Formik tiene errores, el submit no se ejecuta
5. **No bloquea guardado manual**: El botón "Guardar cambios" sigue funcionando independientemente

## 🎉 Resultado Final

El sistema ahora funciona exactamente como lo solicitaste:

✅ **NO guarda al cambiar de tab**
✅ Cambios se cachean en memoria
✅ Después de 30 segundos de inactividad → Popup
✅ Usuario decide si guarda o continúa editando
✅ UX mejorada con control total

---

**Implementado**: 24 de octubre de 2025
**Hook**: `useAutoSave`
**Componente**: `SavePrompt`
**Aplicado en**: `ProductDetail.tsx` (Edición de productos)
