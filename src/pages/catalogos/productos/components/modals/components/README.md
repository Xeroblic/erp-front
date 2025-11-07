# 🎯 UserBranchSelector - Documentación Completa

Componente React + Hook personalizado para seleccionar **solo las branches a las que un usuario tiene acceso**.

---

## 📦 Instalación / Importación

```typescript
// Importar el componente
import UserBranchSelector from '@/pages/catalogos/productos/components/modals/components/UserBranchSelector';

// O desde barrel export
import { UserBranchSelector } from '@/pages/catalogos/productos/components/modals/components';

// Importar el hook directamente (si necesitas lógica custom)
import { useUserBranches } from '@/pages/catalogos/productos/components/modals/hooks/userBranch';
```

---

## 🚀 Uso Rápido

### Ejemplo Básico

```tsx
import UserBranchSelector from '@/pages/catalogos/productos/components/modals/components/UserBranchSelector';

const MyComponent = () => {
	const [branchId, setBranchId] = useState<number | null>(null);
	const currentUserId = 123; // ID del usuario actual

	return (
		<UserBranchSelector
			userId={currentUserId}
			value={branchId}
			onChange={(selectedBranchId) => {
				console.log('Branch seleccionada:', selectedBranchId);
				setBranchId(selectedBranchId);
			}}
			label='Sucursal'
			required
		/>
	);
};
```

---

## 📋 Props del Componente

| Prop          | Tipo                                 | Requerido | Default                     | Descripción                              |
| ------------- | ------------------------------------ | --------- | --------------------------- | ---------------------------------------- |
| `userId`      | `number`                             | ✅ Sí     | -                           | ID del usuario para obtener sus branches |
| `value`       | `number \| string \| null`           | No        | `undefined`                 | Valor seleccionado (branch_id)           |
| `onChange`    | `(branchId: number \| null) => void` | ✅ Sí     | -                           | Callback cuando cambia la selección      |
| `name`        | `string`                             | No        | `'branch_id'`               | Nombre del campo (para formularios)      |
| `label`       | `string`                             | No        | `'Sucursal'`                | Etiqueta del campo                       |
| `placeholder` | `string`                             | No        | `'Selecciona una sucursal'` | Texto placeholder                        |
| `disabled`    | `boolean`                            | No        | `false`                     | Si el select está deshabilitado          |
| `required`    | `boolean`                            | No        | `false`                     | Si el campo es requerido                 |
| `className`   | `string`                             | No        | `undefined`                 | Clases CSS adicionales                   |
| `showError`   | `boolean`                            | No        | `true`                      | Si debe mostrar mensajes de error        |

---

## 🎨 Uso con Formik (Recomendado)

```tsx
import { useFormik } from 'formik';
import * as Yup from 'yup';
import UserBranchSelector from './UserBranchSelector';

interface ProductForm {
	name: string;
	branch_id: number | null;
	price: number;
}

const CreateProductForm = () => {
	const currentUserId = 123; // Del contexto de auth

	const formik = useFormik<ProductForm>({
		initialValues: {
			name: '',
			branch_id: null,
			price: 0,
		},
		validationSchema: Yup.object({
			name: Yup.string().required('Nombre requerido'),
			branch_id: Yup.number().required('Debe seleccionar una sucursal').nullable(),
			price: Yup.number().required('Precio requerido').min(0),
		}),
		onSubmit: async (values) => {
			// POST a la API
			await fetch('/api/products', {
				method: 'POST',
				body: JSON.stringify({
					name: values.name,
					branch_id: values.branch_id, // ← ID de la branch
					price: values.price,
				}),
			});
		},
	});

	return (
		<form onSubmit={formik.handleSubmit}>
			{/* Campo nombre */}
			<input name='name' value={formik.values.name} onChange={formik.handleChange} />

			{/* Selector de Branch */}
			<UserBranchSelector
				userId={currentUserId}
				name='branch_id'
				value={formik.values.branch_id}
				onChange={(branchId) => formik.setFieldValue('branch_id', branchId)}
				label='Sucursal *'
				required
			/>

			{/* Mostrar error de Formik */}
			{formik.touched.branch_id && formik.errors.branch_id && (
				<p className='text-red-500'>{formik.errors.branch_id}</p>
			)}

			<button type='submit'>Crear Producto</button>
		</form>
	);
};
```

---

## 🔧 Uso del Hook Directamente

Si necesitas lógica personalizada sin usar el componente:

```tsx
import { useUserBranches } from '@/pages/catalogos/productos/components/modals/hooks/userBranch';

const MyCustomComponent = () => {
	const userId = 123;
	const { branches, loading, error, refetch } = useUserBranches(userId);

	if (loading) return <Spinner />;
	if (error) return <Alert>{error}</Alert>;

	return (
		<div>
			<h3>Branches disponibles: {branches.length}</h3>
			<ul>
				{branches.map((branch) => (
					<li key={branch.id}>
						{branch.name} (ID: {branch.id})
					</li>
				))}
			</ul>
			<button onClick={refetch}>Recargar</button>
		</div>
	);
};
```

### Hook API

```typescript
const {
	branches, // Array<{ id: number, name: string }>
	loading, // boolean
	error, // string | null
	refetch, // () => Promise<void>
	clearError, // () => void
} = useUserBranches(userId, {
	fetchOnMount: true, // Fetch automático al montar
	enabled: true, // Habilitar/deshabilitar
});
```

---

## 📤 Envío a la API

Cuando el usuario selecciona una branch, el componente llama a `onChange` con el **`branch_id`** (número):

```tsx
onChange={(branchId) => {
  console.log(branchId); // Ejemplo: 42

  // Usar en POST/PUT
  await fetch('/api/products', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Mi Producto',
      branch_id: branchId, // ← Enviar a la API
    }),
  });
}}
```

---

## 🎭 Estados del Componente

### 1. **Cargando**

```
┌─────────────────────────────┐
│ Sucursal *                  │
│ ┌─────────────────────────┐ │
│ │ Cargando...            ▼│ │
│ └─────────────────────────┘ │
│ Cargando sucursales...      │
└─────────────────────────────┘
```

### 2. **Con Branches**

```
┌─────────────────────────────┐
│ Sucursal *                  │
│ ┌─────────────────────────┐ │
│ │ Sucursal Santiago      ▼│ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 3. **Sin Branches**

```
┌─────────────────────────────┐
│ Sucursal *                  │
│ ┌─────────────────────────┐ │
│ │ -- Selecciona --       ▼│ │
│ └─────────────────────────┘ │
│  No tiene acceso a ninguna│
│    sucursal                 │
└─────────────────────────────┘
```

### 4. **Error**

```
┌─────────────────────────────┐
│ Sucursal *                  │
│ ┌─────────────────────────┐ │
│ │ Error al cargar      │ │
│ │ sucursales              │ │
│ │ Error: Network timeout  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## 🔐 Backend API

El hook consume el endpoint:

```
GET /api/users/{userId}?include=access
```

Respuesta esperada:

```json
{
	"success": true,
	"data": {
		"id": 123,
		"access": {
			"branches": [
				{ "id": 1, "name": "Sucursal Santiago" },
				{ "id": 5, "name": "Sucursal Valparaíso" },
				{ "id": 12, "name": "Sucursal Concepción" }
			]
		}
	}
}
```

---

## 🛡️ Manejo de Errores

### Error en la Carga

```tsx
<UserBranchSelector
	userId={userId}
	value={branchId}
	onChange={setBranchId}
	showError={true} // ← Muestra error visual
/>
```

### Error con Validación Formik

```tsx
{
	formik.touched.branch_id && formik.errors.branch_id && (
		<div className='mt-1 text-sm text-red-500'>{formik.errors.branch_id}</div>
	);
}
```

---

## ✨ Características

- ✅ **Solo branches con acceso** - No muestra branches que el usuario no puede ver
- ✅ **Loading automático** - Spinner mientras carga
- ✅ **Error handling** - Mensajes de error claros
- ✅ **TypeScript completo** - Tipado estricto
- ✅ **Integración Formik** - Compatible con validación
- ✅ **Responsive** - Funciona en mobile
- ✅ **Accesibilidad** - Labels, required, etc.
- ✅ **Refetch manual** - Recargar branches si es necesario

---

## 📊 Casos de Uso Comunes

### 1. Crear Producto en Branch Específica

```tsx
const [branchId, setBranchId] = useState(null);

<UserBranchSelector userId={currentUser.id} value={branchId} onChange={setBranchId} required />;

// POST /products { name: '...', branch_id: branchId }
```

### 2. Filtrar Productos por Branch del Usuario

```tsx
const { branches } = useUserBranches(currentUser.id);

// Obtener IDs de todas las branches disponibles
const branchIds = branches.map((b) => b.id);

// GET /products?branch_ids=1,5,12
```

### 3. Transferir Producto Entre Branches Permitidas

```tsx
<UserBranchSelector
	userId={currentUser.id}
	value={product.current_branch_id}
	onChange={(newBranchId) => {
		// PUT /products/{id}/transfer { to_branch_id: newBranchId }
	}}
	label='Transferir a Sucursal'
/>
```

---

## 🐛 Troubleshooting

### No aparecen branches

- ✅ Verificar que `userId` sea válido
- ✅ Revisar endpoint `/users/{userId}?include=access`
- ✅ Ver consola del navegador por errores

### onChange no se ejecuta

- ✅ Verificar que estés pasando una función
- ✅ Usar `(branchId) => setBranchId(branchId)` no `setBranchId`

### Formik no valida

- ✅ Usar `formik.setFieldValue('branch_id', branchId)`
- ✅ Agregar `.nullable()` en schema de Yup

---

## 📝 Notas Adicionales

- El componente devuelve `null` cuando el usuario no selecciona nada
- Se recomienda usar con Formik para validación completa
- El hook cachea las branches para evitar requests innecesarios
- Compatible con dark mode automáticamente

---

## 🎯 Resumen

**Uso más simple:**

```tsx
<UserBranchSelector userId={123} value={branchId} onChange={setBranchId} required />
```

**Resultado:**

- Usuario solo ve sus branches permitidas
- `onChange` recibe el `branch_id` (número)
- Enviar ese ID a la API en POST/PUT

🚀 **¡Listo para usar en producción!**
