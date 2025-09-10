# Guía de Componentes UI - Sistema de Diseño ERP

## Información General

Este documento describe los componentes UI utilizados en el sistema ERP y los patrones de diseño implementados para mantener consistencia visual y funcional.

## Componentes de Modal

### Modal

Componente principal para crear ventanas modales con estructura consistente.

```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';

<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size='lg'>
	<ModalHeader>
		<ModalTitle>Título del Modal</ModalTitle>
	</ModalHeader>

	<ModalBody>{/* Contenido del modal */}</ModalBody>

	<ModalFooter>
		<ModalFooterChild>
			<Button color='red' onClick={() => setIsModalOpen(false)}>
				Cancelar
			</Button>
			<Button color='blue' onClick={handleSubmit}>
				Guardar
			</Button>
		</ModalFooterChild>
	</ModalFooter>
</Modal>;
```

### Props disponibles:

-   `isOpen`: Boolean que controla la visibilidad del modal
-   `onClose`: Función que se ejecuta al cerrar el modal
-   `size`: Tamaño del modal ('sm', 'md', 'lg', 'xl')

## Componentes de Card

### Card

Sistema de tarjetas para organizar contenido en secciones.

```tsx
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';

<Card>
	<CardHeader>
		<CardTitle>Información General</CardTitle>
	</CardHeader>
	<CardBody>{/* Contenido de la tarjeta */}</CardBody>
</Card>;
```

## Componentes de Tabla

### Table

Sistema de tablas con diseño consistente.

```tsx
import { Table, THead, TBody, TFoot } from '@/components/ui/Table';

<Table>
	<THead>
		<Tr>
			<Th>Columna 1</Th>
			<Th>Columna 2</Th>
		</Tr>
	</THead>
	<TBody>
		<Tr>
			<Td>Dato 1</Td>
			<Td>Dato 2</Td>
		</Tr>
	</TBody>
</Table>;
```

## Componentes de Formulario

### Input

Componente de entrada de texto con validación integrada.

```tsx
import Input from '@/components/form/Input';

<Input
	name='nombre'
	placeholder='Ingrese el nombre'
	value={formik.values.nombre}
	onChange={formik.handleChange}
	onBlur={formik.handleBlur}
	isValid={formik.isValid}
	isTouched={!!formik.touched.nombre}
	invalidFeedback={formik.errors.nombre}
	dimension='default'
	variant='solid'
/>;
```

#### Props principales:

-   `name`: Nombre del campo (requerido)
-   `value`: Valor actual del input
-   `onChange`: Función para manejar cambios
-   `isValid`: Estado de validación
-   `isTouched`: Si el campo ha sido tocado
-   `invalidFeedback`: Mensaje de error
-   `dimension`: Tamaño ('xs', 'sm', 'default', 'lg', 'xl')
-   `variant`: Variante de estilo ('solid')
-   `type`: Tipo de input (text, email, password, etc.)

### SelectReact

Componente avanzado de selección basado en react-select con búsqueda y selección múltiple.

```tsx
import SelectReact from '@/components/form/SelectReact';
import { TSelectOption, TSelectOptions } from '@/types/select.type';

// Opciones tipadas
const statusOptions: TSelectOptions = [
	{ value: 'active', label: 'Activo' },
	{ value: 'inactive', label: 'Inactivo' },
];

// En el componente
<SelectReact<TSelectOption>
	placeholder='Seleccionar estado...'
	options={statusOptions}
	value={statusOptions.find((option) => option.value === formik.values.status)}
	onChange={(selectedOption) => {
		const option = selectedOption as TSelectOption;
		formik.setFieldValue('status', option?.value || '');
	}}
	isValid={formik.isValid}
	isTouched={!!formik.touched.status}
	invalidFeedback={formik.errors.status}
	name='status'
	isSearchable
	isClearable
	isMulti={false}
/>;
```

#### Propiedades principales:

-   `options`: Array de opciones tipadas
-   `value`: Opción seleccionada actual
-   `onChange`: Función callback para manejar cambios
-   `isValid`: Estado de validación
-   `isTouched`: Si el campo ha sido tocado
-   `invalidFeedback`: Mensaje de error
-   `isSearchable`: Permite búsqueda
-   `isClearable`: Permite limpiar selección
-   `isMulti`: Permite selección múltiple
-   `placeholder`: Texto de placeholder

### Textarea

Componente de área de texto con validación integrada.

```tsx
import Textarea from '@/components/form/Textarea';

<Textarea
	name='descripcion'
	placeholder='Ingrese la descripción'
	value={formik.values.descripcion}
	onChange={formik.handleChange}
	onBlur={formik.handleBlur}
	isValid={formik.isValid}
	isTouched={!!formik.touched.descripcion}
	invalidFeedback={formik.errors.descripcion}
	rows={4}
	dimension='default'
	variant='solid'
/>;
```

#### Props principales:

-   `name`: Nombre del campo (requerido)
-   `value`: Valor actual del textarea
-   `rows`: Número de filas visibles
-   `dimension`: Tamaño ('xs', 'sm', 'default', 'lg', 'xl')
-   `variant`: Variante de estilo ('solid')
-   Props de validación: `isValid`, `isTouched`, `invalidFeedback`

### Checkbox

Componente de casilla de verificación con soporte para switch.

```tsx
import Checkbox from '@/components/form/Checkbox';

<Checkbox
    id="activo"
    name="activo"
    checked={formik.values.activo}
    onChange={formik.handleChange}
    label="Estado activo"
    variant="default"
    dimension="default"
    isValid={formik.isValid}
    isTouched={!!formik.touched.activo}
    invalidFeedback={formik.errors.activo}
/>

// Variante switch
<Checkbox
    id="notificaciones"
    name="notificaciones"
    checked={formik.values.notificaciones}
    onChange={formik.handleChange}
    label="Recibir notificaciones"
    variant="switch"
    dimension="lg"
/>
```

#### Props principales:

-   `checked`: Estado del checkbox
-   `label`: Etiqueta del checkbox
-   `variant`: Estilo ('default', 'switch')
-   `dimension`: Tamaño ('sm', 'default', 'lg', 'xl')
-   `isInline`: Si se muestra en línea
-   Props de validación: `isValid`, `isTouched`, `invalidFeedback`

### Label

Componente de etiqueta para campos de formulario con soporte para tooltips.

```tsx
import Label from '@/components/form/Label';

<Label htmlFor='nombre' description='Tooltip con información adicional'>
	Nombre del cliente *
</Label>;
```

#### Props principales:

-   `htmlFor`: ID del campo asociado (requerido)
-   `description`: Texto del tooltip informativo
-   `children`: Contenido de la etiqueta

### Radio

Componente de botones de radio para selección única.

```tsx
import Radio from '@/components/form/Radio';

<Radio
    id="tipo_persona"
    name="tipo_persona"
    value="natural"
    checked={formik.values.tipo_persona === 'natural'}
    onChange={formik.handleChange}
    label="Persona Natural"
    dimension="default"
    isValid={formik.isValid}
    isTouched={!!formik.touched.tipo_persona}
    invalidFeedback={formik.errors.tipo_persona}
/>

<Radio
    id="tipo_juridica"
    name="tipo_persona"
    value="juridica"
    checked={formik.values.tipo_persona === 'juridica'}
    onChange={formik.handleChange}
    label="Persona Jurídica"
    dimension="default"
/>
```

### FieldWrap

Contenedor para campos de formulario que proporciona estructura y espaciado consistente.

```tsx
import FieldWrap from '@/components/form/FieldWrap';

<FieldWrap
	firstSuffix={<Icon icon='HeroMagnifyingGlass' />}
	lastSuffix={<Button size='xs'>Buscar</Button>}>
	<Input name='search' placeholder='Buscar...' />
</FieldWrap>;
```

### Validation

Componente base para mostrar mensajes de validación.

```tsx
import Validation from '@/components/form/Validation';

<Validation
	isValid={formik.isValid}
	isTouched={!!formik.touched.campo}
	invalidFeedback={formik.errors.campo}
	validFeedback='Campo válido'
/>;
```

## Patrones de Uso

### Estructura de Formulario Completa

```tsx
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import SelectReact from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import Checkbox from '@/components/form/Checkbox';
import Label from '@/components/form/Label';
import Button from '@/components/ui/Button';

const validationSchema = Yup.object({
	nombre: Yup.string().required('Nombre es requerido'),
	email: Yup.string().email('Email inválido').required('Email requerido'),
	status: Yup.string().required('Estado es requerido'),
	descripcion: Yup.string(),
	activo: Yup.boolean(),
});

const FormularioCompleto = ({ isOpen, onClose }) => {
	return (
		<Modal isOpen={isOpen} onClose={onClose} size='lg'>
			<ModalHeader>
				<ModalTitle>Formulario de Ejemplo</ModalTitle>
			</ModalHeader>

			<Formik
				initialValues={{
					nombre: '',
					email: '',
					status: '',
					descripcion: '',
					activo: false,
				}}
				validationSchema={validationSchema}
				onSubmit={(values) => {
					console.log(values);
					onClose();
				}}>
				{(formik) => (
					<Form>
						<ModalBody>
							<Card>
								<CardHeader>
									<CardTitle>Información Básica</CardTitle>
								</CardHeader>
								<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label htmlFor='nombre'>Nombre *</Label>
										<Input
											name='nombre'
											placeholder='Ingrese el nombre'
											value={formik.values.nombre}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											isValid={formik.isValid}
											isTouched={!!formik.touched.nombre}
											invalidFeedback={formik.errors.nombre}
										/>
									</div>

									<div>
										<Label htmlFor='email'>Email *</Label>
										<Input
											name='email'
											type='email'
											placeholder='Ingrese el email'
											value={formik.values.email}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											isValid={formik.isValid}
											isTouched={!!formik.touched.email}
											invalidFeedback={formik.errors.email}
										/>
									</div>

									<div>
										<Label htmlFor='status'>Estado *</Label>
										<SelectReact<TSelectOption>
											placeholder='Seleccionar estado...'
											options={[
												{ value: 'active', label: 'Activo' },
												{ value: 'inactive', label: 'Inactivo' },
											]}
											value={statusOptions.find(
												(option) => option.value === formik.values.status,
											)}
											onChange={(selectedOption) => {
												const option = selectedOption as TSelectOption;
												formik.setFieldValue('status', option?.value || '');
											}}
											isValid={formik.isValid}
											isTouched={!!formik.touched.status}
											invalidFeedback={formik.errors.status}
											name='status'
										/>
									</div>

									<div>
										<Checkbox
											id='activo'
											name='activo'
											checked={formik.values.activo}
											onChange={formik.handleChange}
											label='Estado activo'
										/>
									</div>
								</CardBody>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Descripción</CardTitle>
								</CardHeader>
								<CardBody>
									<div>
										<Label htmlFor='descripcion'>Descripción</Label>
										<Textarea
											name='descripcion'
											placeholder='Ingrese una descripción'
											value={formik.values.descripcion}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											rows={4}
										/>
									</div>
								</CardBody>
							</Card>
						</ModalBody>

						<ModalFooter>
							<ModalFooterChild>
								<Button color='red' onClick={onClose}>
									Cancelar
								</Button>
								<Button color='blue' type='submit'>
									Guardar
								</Button>
							</ModalFooterChild>
						</ModalFooter>
					</Form>
				)}
			</Formik>
		</Modal>
	);
};
```

## Reglas de Diseño

### 1. **NO usar elementos HTML nativos**

❌ **Incorrecto:**

```tsx
<select>...</select>
<textarea>...</textarea>
<input type="text" />
```

✅ **Correcto:**

```tsx
<SelectReact options={...} />
<Textarea name="..." />
<Input name="..." />
```

### 2. **Siempre usar estructura Modal correcta**

❌ **Incorrecto:**

```tsx
<div className='modal'>
	<div className='modal-content'>
		<h2>Título</h2>
		<p>Contenido</p>
		<button>Cerrar</button>
	</div>
</div>
```

✅ **Correcto:**

```tsx
<Modal isOpen={isOpen} onClose={onClose}>
	<ModalHeader>
		<ModalTitle>Título</ModalTitle>
	</ModalHeader>
	<ModalBody>
		<p>Contenido</p>
	</ModalBody>
	<ModalFooter>
		<ModalFooterChild>
			<Button onClick={onClose}>Cerrar</Button>
		</ModalFooterChild>
	</ModalFooter>
</Modal>
```

### 3. **Usar Cards para organizar contenido**

Los formularios largos deben dividirse en Cards temáticas:

```tsx
<Card>
    <CardHeader>
        <CardTitle>Información General</CardTitle>
    </CardHeader>
    <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Campos relacionados */}
    </CardBody>
</Card>

<Card>
    <CardHeader>
        <CardTitle>Información de Contacto</CardTitle>
    </CardHeader>
    <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Más campos */}
    </CardBody>
</Card>
```

### 4. **Integración con Formik**

Todos los componentes están diseñados para trabajar con Formik:

```tsx
<Input
	name='campo'
	value={formik.values.campo}
	onChange={formik.handleChange}
	onBlur={formik.handleBlur}
	isValid={formik.isValid}
	isTouched={!!formik.touched.campo}
	invalidFeedback={formik.errors.campo}
/>
```

### 5. **Validación consistente**

Todos los componentes de formulario soportan las mismas props de validación:

-   `isValid`: Estado general de validación
-   `isTouched`: Si el campo ha sido tocado
-   `invalidFeedback`: Mensaje de error a mostrar

## Ejemplos de Migración

### Migrar de select nativo a SelectReact:

**Antes:**

```tsx
<select name='status' value={formik.values.status} onChange={formik.handleChange}>
	<option value=''>Seleccionar...</option>
	<option value='active'>Activo</option>
	<option value='inactive'>Inactivo</option>
</select>
```

**Después:**

```tsx
const statusOptions: TSelectOptions = [
	{ value: 'active', label: 'Activo' },
	{ value: 'inactive', label: 'Inactivo' },
];

<SelectReact<TSelectOption>
	placeholder='Seleccionar...'
	options={statusOptions}
	value={statusOptions.find((option) => option.value === formik.values.status)}
	onChange={(selectedOption) => {
		const option = selectedOption as TSelectOption;
		formik.setFieldValue('status', option?.value || '');
	}}
	name='status'
/>;
```

### Migrar de textarea nativo a Textarea:

**Antes:**

```tsx
<textarea
	name='descripcion'
	value={formik.values.descripcion}
	onChange={formik.handleChange}
	placeholder='Descripción...'
	rows={4}
/>
```

**Después:**

```tsx
<Textarea
	name='descripcion'
	value={formik.values.descripcion}
	onChange={formik.handleChange}
	onBlur={formik.handleBlur}
	placeholder='Descripción...'
	rows={4}
	isValid={formik.isValid}
	isTouched={!!formik.touched.descripcion}
	invalidFeedback={formik.errors.descripcion}
/>
```

## Conclusión

Este sistema de componentes garantiza:

-   **Consistencia visual** en toda la aplicación
-   **Validación uniforme** en todos los formularios
-   **Tipado TypeScript** para mejor desarrollo
-   **Accesibilidad** mejorada
-   **Mantenibilidad** a largo plazo

Siempre utiliza estos componentes en lugar de elementos HTML nativos para mantener la coherencia del diseño y aprovechar todas las funcionalidades integradas.
