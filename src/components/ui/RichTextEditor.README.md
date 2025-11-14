# RichTextEditor Component

Editor de texto enriquecido basado en **Tiptap** con soporte para formato HTML.

## 🎨 Características

- ✅ **Font Family**: 8 opciones de tipografía (Inter, Arial, Georgia, Times New Roman, Courier New, Comic Sans, Verdana)
- ✅ **Font Size**: 8 tamaños (12px, 14px, 16px, 18px, 20px, 24px, 28px, 32px)
- ✅ **Toolbar completo**: Bold, Italic, Underline, Strikethrough
- ✅ **Headings**: H1, H2, H3, H4, H5, H6
- ✅ **Listas**: Bullets y numeradas
- ✅ **Alineación**: Izquierda, Centro, Derecha, Justificado
- ✅ **Blockquotes y Code blocks**
- ✅ **Undo/Redo**
- ✅ **Dark mode** compatible
- ✅ **Responsive**
- ✅ **Placeholder** personalizable
- ✅ **Guarda como HTML** directamente

## 📦 Instalación

Ya está instalado en el proyecto con:

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-heading @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-text-align @tiptap/extension-underline
```

## 🚀 Uso Básico

### Con Formik

```tsx
import { useFormikContext } from 'formik';
import RichTextEditor from '@/components/ui/RichTextEditor';

const MyForm = () => {
	const { values, setFieldValue } = useFormikContext();

	return (
		<RichTextEditor
			value={values.description}
			onChange={(html) => setFieldValue('description', html)}
			placeholder='Escribe aquí...'
		/>
	);
};
```

### Con useState

```tsx
import { useState } from 'react';
import RichTextEditor from '@/components/ui/RichTextEditor';

const MyComponent = () => {
	const [content, setContent] = useState('<p>Contenido inicial</p>');

	return <RichTextEditor value={content} onChange={setContent} placeholder='Escribe aquí...' />;
};
```

## 🎛️ Props

| Prop          | Tipo                     | Default             | Descripción                         |
| ------------- | ------------------------ | ------------------- | ----------------------------------- |
| `value`       | `string`                 | `''`                | Contenido HTML del editor           |
| `onChange`    | `(html: string) => void` | -                   | Callback cuando cambia el contenido |
| `placeholder` | `string`                 | `'Escribe aquí...'` | Texto placeholder                   |
| `minHeight`   | `string`                 | `'200px'`           | Altura mínima del editor            |
| `maxHeight`   | `string`                 | `'500px'`           | Altura máxima (con scroll)          |
| `disabled`    | `boolean`                | `false`             | Deshabilita el editor               |
| `className`   | `string`                 | `''`                | Clases CSS adicionales              |
| `showToolbar` | `boolean`                | `true`              | Muestra/oculta el toolbar           |
| `compact`     | `boolean`                | `false`             | Toolbar compacto (menos botones)    |

## 📝 Ejemplos

### Editor Compacto (para descripciones cortas)

```tsx
<RichTextEditor
	value={shortDescription}
	onChange={setShortDescription}
	placeholder='Descripción breve...'
	minHeight='120px'
	maxHeight='200px'
	compact={true} // Solo formato básico
/>
```

### Editor Completo (para descripciones largas)

```tsx
<RichTextEditor
	value={longDescription}
	onChange={setLongDescription}
	placeholder='Descripción detallada con especificaciones técnicas...'
	minHeight='300px'
	maxHeight='600px'
	compact={false} // Todas las opciones
/>
```

### Editor de Solo Lectura

```tsx
<RichTextEditor
	value={productDetails}
	onChange={() => {}} // No editable
	disabled={true}
	showToolbar={false} // Sin toolbar
/>
```

### Con Validación

```tsx
import { useFormikContext } from 'formik';

const FormField = () => {
	const { values, errors, touched, setFieldValue } = useFormikContext();

	return (
		<div>
			<Label>Descripción *</Label>
			<RichTextEditor
				value={values.description}
				onChange={(html) => setFieldValue('description', html)}
				placeholder='Escribe la descripción...'
			/>
			{touched.description && errors.description && (
				<p className='text-xs text-red-500'>{errors.description}</p>
			)}
		</div>
	);
};
```

## 🎨 Customización

### Estilos CSS

Los estilos están en `RichTextEditor.css` y puedes sobrescribirlos:

```css
/* Cambiar el color de los headings */
.ProseMirror h1 {
	color: #3b82f6;
}

/* Cambiar el estilo de blockquotes */
.ProseMirror blockquote {
	border-left: 4px solid #10b981;
	background-color: #f0fdf4;
}
```

### Altura Dinámica

```tsx
<RichTextEditor
	value={content}
	onChange={setContent}
	minHeight='150px'
	maxHeight={isExpanded ? '800px' : '300px'}
/>
```

## 💾 Guardar en Base de Datos

El editor devuelve HTML listo para guardar:

```tsx
const handleSave = async () => {
	const htmlContent = editorValue; // Ya es HTML

	await api.post('/products', {
		name: productName,
		description: htmlContent, // Guarda directamente
	});
};
```

## 🔧 Keyboard Shortcuts

- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + U` - Underline
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo

## 🌙 Dark Mode

El editor detecta automáticamente el tema del sistema y aplica estilos apropiados.

## 📱 Responsive

En mobile, el toolbar se adapta automáticamente mostrando menos botones en modo `compact`.

## 🎯 Casos de Uso

### 1. Descripciones de Productos

```tsx
<RichTextEditor
	value={product.description}
	onChange={(html) => updateProduct({ description: html })}
	minHeight='250px'
/>
```

### 2. Blog Posts

```tsx
<RichTextEditor
	value={post.content}
	onChange={(html) => setPost({ ...post, content: html })}
	minHeight='500px'
	maxHeight='1000px'
/>
```

### 3. Comentarios

```tsx
<RichTextEditor
	value={comment}
	onChange={setComment}
	placeholder='Escribe tu comentario...'
	minHeight='100px'
	maxHeight='300px'
	compact={true}
/>
```

## Notas

- El contenido se guarda como **HTML** en la base de datos
- El HTML generado es limpio y sanitizado
- Compatible con **Formik** y cualquier form library
- Funciona con SSR (Next.js, etc.)

## 🚀 Tips de Performance

1. **Debounce el onChange** para evitar re-renders excesivos:

```tsx
import { useDebouncedCallback } from 'use-debounce';

const debouncedOnChange = useDebouncedCallback((html) => setFieldValue('description', html), 300);

<RichTextEditor onChange={debouncedOnChange} />;
```

2. **Usa React.memo** si el editor no cambia frecuentemente:

```tsx
const MemoizedEditor = React.memo(RichTextEditor);
```

---

¡Disfruta tu nuevo editor! 🎉
