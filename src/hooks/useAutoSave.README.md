# useAutoSave Hook

Hook personalizado de React para implementar autoguardado con caché y confirmación después de un período de inactividad.

## 🎯 Características

- ✅ **Detección automática de cambios**: Compara valores actuales con valores iniciales del formulario
- ✅ **Caché inteligente**: Guarda los cambios en memoria sin enviar al servidor
- ✅ **Temporizador de inactividad**: Después de 30 segundos (configurable) sin actividad, muestra un popup
- ✅ **Popup de confirmación**: Pregunta al usuario si desea guardar los cambios
- ✅ **Integración con Formik**: Funciona perfectamente con formularios Formik
- ✅ **TypeScript**: Completamente tipado para mejor DX
- ✅ **Personalizable**: Delay configurable, comparador personalizado, etc.

## 📦 Instalación

El hook ya está disponible en el proyecto:

```tsx
import { useAutoSave } from '@/hooks/useAutoSave';
```

## 🚀 Uso Básico

### Con Formik (Recomendado)

```tsx
import { Formik, Form, useFormikContext } from 'formik';
import { useAutoSave } from '@/hooks/useAutoSave';
import SavePrompt from '@/components/ui/SavePrompt';

// Componente interno que tiene acceso al contexto de Formik
const AutoSaveHandler: React.FC = () => {
	const { submitForm } = useFormikContext<MyFormValues>();

	const { showSavePrompt, confirmSave, cancelSave, isSaving } = useAutoSave<MyFormValues>({
		delay: 30000, // 30 segundos
		onSave: async () => {
			await submitForm();
		},
	});

	return (
		<SavePrompt
			isOpen={showSavePrompt}
			onConfirm={confirmSave}
			onCancel={cancelSave}
			isLoading={isSaving}
		/>
	);
};

// Componente principal
const MyFormComponent = () => {
	return (
		<Formik initialValues={initialValues} onSubmit={handleSubmit}>
			<Form>
				{/* Agregar el handler de autoguardado */}
				<AutoSaveHandler />

				{/* Tu formulario aquí */}
			</Form>
		</Formik>
	);
};
```

### Configuración Avanzada

```tsx
const { showSavePrompt, confirmSave, cancelSave, isDirty, save, reset } = useAutoSave({
	// Delay personalizado (en milisegundos)
	delay: 45000, // 45 segundos

	// Callback al guardar
	onSave: async (values) => {
		await updateProduct(values);
		console.log('Guardado exitoso');
	},

	// Comparador personalizado para detectar cambios
	hasChanges: (current, initial) => {
		// Solo considerar ciertos campos
		return current.name !== initial.name || current.price !== initial.price;
	},

	// Habilitar/deshabilitar el autoguardado
	enabled: !isViewMode,
});
```

## 📊 API

### Parámetros (UseAutoSaveOptions)

| Propiedad    | Tipo                                  | Default     | Descripción                                           |
| ------------ | ------------------------------------- | ----------- | ----------------------------------------------------- |
| `delay`      | `number`                              | `30000`     | Tiempo de inactividad en ms antes de mostrar el popup |
| `onSave`     | `(values: T) => Promise<void>`        | _Requerido_ | Callback ejecutado al confirmar guardado              |
| `hasChanges` | `(current: T, initial: T) => boolean` | `undefined` | Comparador personalizado de cambios                   |
| `enabled`    | `boolean`                             | `true`      | Habilitar/deshabilitar el autoguardado                |

### Retorno (AutoSaveState)

| Propiedad        | Tipo                  | Descripción                                  |
| ---------------- | --------------------- | -------------------------------------------- |
| `isDirty`        | `boolean`             | Indica si hay cambios sin guardar            |
| `showSavePrompt` | `boolean`             | Si el popup de confirmación está visible     |
| `isSaving`       | `boolean`             | Si está en proceso de guardado               |
| `save`           | `() => Promise<void>` | Función para guardar manualmente             |
| `cancelSave`     | `() => void`          | Cerrar el popup y continuar editando         |
| `confirmSave`    | `() => Promise<void>` | Confirmar y guardar los cambios              |
| `reset`          | `() => void`          | Resetear el estado (útil después de guardar) |

## 🎨 Componente SavePrompt

El popup de confirmación que se muestra al usuario.

### Props

```tsx
interface SavePromptProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	isLoading?: boolean;
	title?: string;
	message?: string;
	confirmText?: string;
	cancelText?: string;
}
```

### Personalización

```tsx
<SavePrompt
	isOpen={showSavePrompt}
	onConfirm={confirmSave}
	onCancel={cancelSave}
	isLoading={isSaving}
	title='Título personalizado'
	message='Mensaje personalizado'
	confirmText='Sí, guardar'
	cancelText='No, continuar'
/>
```

## Ejemplos de Uso

### 1. Guardado Manual Adicional

```tsx
const { save, isDirty } = useAutoSave({
	delay: 30000,
	onSave: handleSave,
});

// Botón de guardado manual
<Button onClick={save} disabled={!isDirty}>
	Guardar ahora
</Button>;
```

### 2. Resetear después de Guardar Exitoso

```tsx
const { reset, confirmSave } = useAutoSave({
	delay: 30000,
	onSave: async (values) => {
		await updateProduct(values);
		reset(); // Limpiar estado después de guardar
	},
});
```

### 3. Detección Personalizada de Cambios

```tsx
const { isDirty } = useAutoSave({
	delay: 30000,
	onSave: handleSave,
	hasChanges: (current, initial) => {
		// Solo campos importantes
		const importantFields = ['name', 'price', 'stock'];
		return importantFields.some((field) => current[field] !== initial[field]);
	},
});
```

### 4. Deshabilitar en Modo Vista

```tsx
const { showSavePrompt } = useAutoSave({
	delay: 30000,
	onSave: handleSave,
	enabled: !isViewMode, // Solo activo en modo edición
});
```

### 5. Delay Diferente según Prioridad

```tsx
// Cambios críticos: 10 segundos
const criticalAutoSave = useAutoSave({
	delay: 10000,
	onSave: handleCriticalSave,
	hasChanges: (c, i) => c.criticalField !== i.criticalField,
});

// Cambios normales: 30 segundos
const normalAutoSave = useAutoSave({
	delay: 30000,
	onSave: handleNormalSave,
});
```

## 🔄 Flujo de Funcionamiento

1. **Usuario edita formulario** → Valores cambian en Formik
2. **Hook detecta cambios** → `isDirty = true`
3. **Inicia temporizador** → 30 segundos de cuenta regresiva
4. **Usuario continúa editando** → Temporizador se reinicia con cada cambio
5. **30 segundos de inactividad** → Se muestra el `SavePrompt`
6. **Usuario elige:**
    - **"Guardar"** → Ejecuta `onSave()`, muestra toast de éxito
    - **"Continuar editando"** → Cierra popup, reinicia temporizador

## Consideraciones

1. **Debe usarse dentro de un FormikContext**: El hook necesita acceso a `values`, `initialValues` e `isSubmitting`
2. **Un componente por formulario**: No uses múltiples `AutoSaveHandler` en el mismo formulario
3. **Limpieza automática**: Los temporizadores se limpian automáticamente al desmontar
4. **No bloquea el submit manual**: El botón de guardar manual sigue funcionando
5. **Comparación por JSON**: Por defecto usa `JSON.stringify`, considera un comparador personalizado para objetos complejos

## 🐛 Troubleshooting

### El popup no aparece

- Verifica que `enabled={true}`
- Confirma que hay cambios reales (`isDirty === true`)
- Asegúrate de esperar el tiempo completo de inactividad

### Se guarda dos veces

- No tengas múltiples `AutoSaveHandler` en el mismo formulario
- Asegúrate de que `onSave` no llame a `submitForm()` dos veces

### Cambios no detectados

- Usa un comparador personalizado con `hasChanges`
- Verifica que `initialValues` esté configurado correctamente en Formik
- Usa `enableReinitialize` en Formik si los valores iniciales cambian

## 📝 Notas de Implementación

- **Sin guardado al cambiar de tab**: El sistema NO guarda automáticamente al cambiar de pestaña
- **Caché en memoria**: Los cambios se mantienen en el estado de Formik
- **30 segundos de inactividad**: Tiempo configurable, pero 30s es un buen balance
- **UX mejorada**: El usuario tiene control total sobre cuándo guardar

## 🔗 Ver También

- [Formik Documentation](https://formik.org/)
- [SavePrompt Component](../components/ui/SavePrompt.tsx)
- [ProductDetail Implementation](../pages/catalogos/productos/ProductDetail.tsx)
