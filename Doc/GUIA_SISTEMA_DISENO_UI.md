# Guía Completa del Sistema de Diseño UI - ERP Frontend

## Índice

1. [Introducción](#introducción)
2. [Componentes de Layout](#componentes-de-layout)
3. [Componentes de Formulario](#componentes-de-formulario)
4. [Componentes de Datos](#componentes-de-datos)
5. [Componentes de Feedback](#componentes-de-feedback)
6. [Patrones de Uso](#patrones-de-uso)
7. [Guías de Migración](#guías-de-migración)

## Introducción

Esta guía documenta el sistema de diseño UI completo del ERP Frontend basado en React + TypeScript + Tailwind CSS. Todos los componentes están diseñados para mantener consistencia visual y funcional en toda la aplicación.

### Principios de Diseño

-   **Consistencia**: Todos los componentes siguen los mismos patrones de props y estructura
-   **Accesibilidad**: Soporte completo para lectores de pantalla y navegación por teclado
-   **Flexibilidad**: Configurables mediante props sin comprometer la consistencia
-   **Performance**: Optimizados para renderizado eficiente

---

## Componentes de Layout

### Modal System

Estructura jerárquica para modales consistentes en toda la aplicación.

#### Importación

```tsx
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
```

#### Estructura Base

```tsx
<Modal isOpen={isOpen} setIsOpen={setIsOpen}>
	<ModalHeader>
		<div>
			<h2 className='text-xl font-semibold'>Título del Modal</h2>
			<p className='text-sm text-gray-600'>Subtítulo opcional</p>
		</div>
	</ModalHeader>

	<ModalBody>{/* Contenido del modal */}</ModalBody>

	<ModalFooter>
		<ModalFooterChild>
			<Button variant='outline' onClick={handleCancel}>
				Cancelar
			</Button>
			<Button onClick={handleSave}>Guardar</Button>
		</ModalFooterChild>
	</ModalFooter>
</Modal>
```

#### Props Principales

-   `isOpen: boolean` - Estado de visibilidad del modal
-   `setIsOpen: (open: boolean) => void` - Función para controlar la visibilidad

#### Ejemplos de Uso

```tsx
// Modal de Confirmación
<Modal isOpen={showConfirm} setIsOpen={setShowConfirm}>
  <ModalHeader>
    <h2>¿Confirmar acción?</h2>
  </ModalHeader>
  <ModalBody>
    <p>Esta acción no se puede deshacer.</p>
  </ModalBody>
  <ModalFooter>
    <ModalFooterChild>
      <Button variant="outline" onClick={() => setShowConfirm(false)}>
        Cancelar
      </Button>
      <Button color="red" onClick={handleConfirm}>
        Confirmar
      </Button>
    </ModalFooterChild>
  </ModalFooter>
</Modal>

// Modal de Formulario
<Modal isOpen={showForm} setIsOpen={setShowForm}>
  <ModalHeader>
    <h2>Crear Nuevo Item</h2>
  </ModalHeader>
  <ModalBody>
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      <Form>
        {/* Campos del formulario */}
      </Form>
    </Formik>
  </ModalBody>
  <ModalFooter>
    <ModalFooterChild>
      <Button type="submit" form="myForm">
        Guardar
      </Button>
    </ModalFooterChild>
  </ModalFooter>
</Modal>
```

### Card System

Sistema de tarjetas para organizar contenido de forma visual y jerárquica.

#### Importación

```tsx
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
```

#### Estructura Base

```tsx
<Card>
	<CardHeader>
		<CardHeaderChild>
			<CardTitle>Título de la Tarjeta</CardTitle>
		</CardHeaderChild>
	</CardHeader>
	<CardBody>{/* Contenido de la tarjeta */}</CardBody>
</Card>
```

#### Ejemplos de Uso

```tsx
// Card Simple
<Card>
  <CardBody>
    <p>Contenido simple sin header</p>
  </CardBody>
</Card>

// Card con Header y Acciones
<Card>
  <CardHeader>
    <CardHeaderChild>
      <CardTitle>Estadísticas</CardTitle>
    </CardHeaderChild>
    <CardHeaderChild>
      <Button size="sm" icon="refresh">
        Actualizar
      </Button>
    </CardHeaderChild>
  </CardHeader>
  <CardBody>
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold">150</div>
        <div className="text-gray-500">Usuarios</div>
      </div>
    </div>
  </CardBody>
</Card>

// Card para Formularios
<Card>
  <CardHeader>
    <CardHeaderChild>
      <CardTitle>Información Personal</CardTitle>
    </CardHeaderChild>
  </CardHeader>
  <CardBody>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nombre
        </label>
        <input type="text" className="mt-1 block w-full" />
      </div>
    </div>
  </CardBody>
</Card>
```

---

## Componentes de Formulario

### SelectReact System

Sistema de selección avanzado basado en react-select con diseño consistente.

#### Importación

```tsx
import SelectReact from '@/components/form/SelectReact';
import type { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';
```

#### Props Principales

```tsx
interface ISelectReactProps {
	borderWidth?: TBorderWidth;
	className?: string;
	color?: TColors;
	colorIntensity?: TColorIntensity;
	name: string;
	rounded?: TRounded;
	dimension?: TSelectDimension; // 'sm' | 'default' | 'lg' | 'xl'
	variant?: TSelectVariant; // 'solid'
	disabled?: boolean;
	isCreatable?: boolean;
	isMulti?: boolean;
	options: TSelectOptions;
	value?: TSelectOption | TSelectOptions;
	onChange?: (value: any) => void;
	placeholder?: string;
}

// Tipos para opciones
type TSelectOption = {
	value: string;
	label: string;
	isFixed?: boolean;
	isDisabled?: boolean;
};
type TSelectOptions = TSelectOption[];
```

#### Ejemplos de Uso

```tsx
// Select Simple
const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'pending', label: 'Pendiente' }
];

<SelectReact
  name="status"
  options={statusOptions}
  placeholder="Seleccionar estado..."
  onChange={(option) => setStatus(option?.value)}
/>

// Select Múltiple
const rolesOptions = [
  { value: 'admin', label: 'Administrador' },
  { value: 'user', label: 'Usuario' },
  { value: 'guest', label: 'Invitado' }
];

<SelectReact
  name="roles"
  options={rolesOptions}
  isMulti
  placeholder="Seleccionar roles..."
  onChange={(options) => setRoles(options?.map(opt => opt.value) || [])}
/>

// Select Creatable
<SelectReact
  name="tags"
  options={tagOptions}
  isCreatable
  isMulti
  placeholder="Seleccionar o crear tags..."
  onChange={handleTagsChange}
/>

// Select en Formulario
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Método de Pago *
    </label>
    <SelectReact
      name="payment_method"
      options={[
        { value: 'cash', label: 'Efectivo' },
        { value: 'transfer', label: 'Transferencia' },
        { value: 'credit_card', label: 'Tarjeta de Crédito' },
        { value: 'credit_30', label: 'Crédito 30 días' }
      ]}
      placeholder="Seleccionar método..."
      dimension="default"
      onChange={(option) => formik.setFieldValue('payment_method', option?.value)}
      value={paymentMethodOptions.find(opt => opt.value === formik.values.payment_method)}
    />
  </div>
</div>

// Select con Validación
<SelectReact
  name="customer_id"
  options={customerOptions}
  placeholder="Seleccionar cliente..."
  onChange={(option) => formik.setFieldValue('customer_id', option?.value)}
  value={customerOptions.find(opt => opt.value === formik.values.customer_id)}
  isValid={!formik.errors.customer_id}
  isTouched={formik.touched.customer_id}
  invalidFeedback={formik.errors.customer_id}
/>
```

#### Características del Componente

-   **Diseño Consistente**: Sigue el tema dark/light automáticamente
-   **Validación Integrada**: Compatible con Formik y validaciones manuales
-   **Múltiples Variantes**: Simple, múltiple, creatable
-   **Responsive**: Diferentes tamaños (sm, default, lg, xl)
-   **Accesibilidad**: Soporte completo para navegación por teclado
-   **Búsqueda**: Búsqueda automática en opciones
-   **Personalizable**: Colores, bordes redondeados, estados

### Button System

Sistema de botones altamente configurable con múltiples variantes y estados.

#### Importación

```tsx
import Button from '@/components/ui/Button';
```

#### Props Principales

```tsx
interface IButtonProps {
	borderWidth?: TBorderWidth;
	children?: ReactNode;
	className?: string;
	color?: TColors;
	colorIntensity?: TColorIntensity;
	icon?: TIcons;
	isActive?: boolean;
	isDisable?: boolean; // ⚠️ IMPORTANTE: usar isDisable, no disabled
	isLoading?: boolean;
	rightIcon?: TIcons;
	rounded?: TRounded;
	size?: TButtonSize; // 'xs' | 'sm' | 'default' | 'lg' | 'xl'
	variant?: TButtonVariants; // 'solid' | 'outline' | 'default'
}
```

#### Ejemplos de Uso

```tsx
// Botones Básicos
<Button>Botón Default</Button>
<Button variant="outline">Botón Outline</Button>
<Button variant="solid" color="red">Botón Rojo</Button>

// Botones con Iconos
<Button icon="plus">Agregar</Button>
<Button rightIcon="arrow-right">Siguiente</Button>
<Button icon="trash" variant="outline" color="red">
  Eliminar
</Button>

// Estados del Botón
<Button isLoading>Cargando...</Button>
<Button isDisable>Deshabilitado</Button>
<Button isActive>Activo</Button>

// Tamaños
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// Botones de Acción en Modales
<ModalFooter>
  <ModalFooterChild>
    <Button variant="outline" onClick={handleCancel}>
      Cancelar
    </Button>
    <Button onClick={handleSave} isLoading={isSaving}>
      {isSaving ? 'Guardando...' : 'Guardar'}
    </Button>
  </ModalFooterChild>
</ModalFooter>
```

---

## Componentes de Datos

### Table System

Sistema de tablas altamente estructurado para mostrar datos tabulares.

#### Importación

```tsx
import { Table, THead, TBody, TFoot, Tr, Th, Td } from '@/components/ui/Table';
```

#### Estructura Base

```tsx
<Table>
	<THead>
		<Tr>
			<Th>Columna 1</Th>
			<Th>Columna 2</Th>
			<Th>Acciones</Th>
		</Tr>
	</THead>
	<TBody>
		{data.map((item) => (
			<Tr key={item.id}>
				<Td>{item.name}</Td>
				<Td>{item.value}</Td>
				<Td>
					<Button size='sm' icon='edit'>
						Editar
					</Button>
				</Td>
			</Tr>
		))}
	</TBody>
</Table>
```

#### Ejemplos de Uso Completos

```tsx
// Tabla Básica con Datos
<Card>
  <CardHeader>
    <CardHeaderChild>
      <CardTitle>Lista de Usuarios</CardTitle>
    </CardHeaderChild>
    <CardHeaderChild>
      <Button icon="plus" onClick={handleAdd}>
        Agregar Usuario
      </Button>
    </CardHeaderChild>
  </CardHeader>
  <CardBody>
    <Table>
      <THead>
        <Tr>
          <Th>ID</Th>
          <Th>Nombre</Th>
          <Th>Email</Th>
          <Th>Estado</Th>
          <Th className="text-center">Acciones</Th>
        </Tr>
      </THead>
      <TBody>
        {users.map((user) => (
          <Tr key={user.id}>
            <Td className="font-mono">{user.id}</Td>
            <Td className="font-semibold">{user.name}</Td>
            <Td>{user.email}</Td>
            <Td>
              <Badge
                variant={user.active ? 'solid' : 'outline'}
                color={user.active ? 'green' : 'red'}
              >
                {user.active ? 'Activo' : 'Inactivo'}
              </Badge>
            </Td>
            <Td className="text-center">
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  icon="edit"
                  onClick={() => handleEdit(user.id)}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  color="red"
                  icon="trash"
                  onClick={() => handleDelete(user.id)}
                >
                  Eliminar
                </Button>
              </div>
            </Td>
          </Tr>
        ))}
      </TBody>
    </Table>
  </CardBody>
</Card>

// Tabla con Totales
<Table>
  <THead>
    <Tr>
      <Th>Producto</Th>
      <Th className="text-right">Cantidad</Th>
      <Th className="text-right">Precio</Th>
      <Th className="text-right">Total</Th>
    </Tr>
  </THead>
  <TBody>
    {items.map((item) => (
      <Tr key={item.id}>
        <Td>{item.product}</Td>
        <Td className="text-right">{item.quantity}</Td>
        <Td className="text-right">{formatCurrency(item.price)}</Td>
        <Td className="text-right">{formatCurrency(item.total)}</Td>
      </Tr>
    ))}
  </TBody>
  <TFoot>
    <Tr>
      <Td className="font-bold">Total</Td>
      <Td></Td>
      <Td></Td>
      <Td className="text-right font-bold">
        {formatCurrency(grandTotal)}
      </Td>
    </Tr>
  </TFoot>
</Table>
```

---

## Componentes de Feedback

### Alert System

Sistema de alertas para mostrar mensajes importantes al usuario.

#### Importación

```tsx
import Alert from '@/components/ui/Alert';
```

#### Props Principales

```tsx
interface IAlertProps {
	borderWidth?: TBorderWidth;
	children: ReactNode;
	className?: string;
	color?: TColors; // 'red' | 'green' | 'blue' | 'yellow' | etc.
	colorIntensity?: TColorIntensity;
	icon?: TIcons;
	iconSize?: TFontSizes;
	isClosable?: boolean;
	rounded?: TRounded;
	title?: string;
	variant?: TAlertVariants; // 'solid' | 'outline' | 'default'
}
```

#### Ejemplos de Uso

```tsx
// Alertas Básicas
<Alert color="green" icon="check-circle" title="Éxito">
  Los datos se guardaron correctamente.
</Alert>

<Alert color="red" icon="x-circle" title="Error" isClosable>
  Ocurrió un error al procesar la solicitud.
</Alert>

<Alert color="yellow" icon="exclamation-triangle" title="Advertencia">
  Esta acción no se puede deshacer.
</Alert>

<Alert color="blue" icon="info-circle" title="Información">
  Recuerda completar todos los campos requeridos.
</Alert>

// Variantes de Alerta
<Alert variant="solid" color="green">
  Alerta con fondo sólido
</Alert>

<Alert variant="outline" color="blue">
  Alerta con borde
</Alert>

<Alert variant="default" color="gray">
  Alerta por defecto
</Alert>
```

### Badge System

Sistema de badges para mostrar estados, categorías o información adicional.

#### Importación

```tsx
import Badge from '@/components/ui/Badge';
```

#### Props Principales

```tsx
interface IBadgeProps {
	borderWidth?: TBorderWidth;
	children: ReactNode;
	className?: string;
	color?: TColors;
	colorIntensity?: TColorIntensity;
	rounded?: TRounded;
	variant?: TBadgeVariants; // 'solid' | 'outline' | 'default'
}
```

#### Ejemplos de Uso

```tsx
// Badges de Estado
<Badge color="green" variant="solid">Activo</Badge>
<Badge color="red" variant="solid">Inactivo</Badge>
<Badge color="yellow" variant="solid">Pendiente</Badge>
<Badge color="blue" variant="solid">En Proceso</Badge>

// Badges con Variantes
<Badge color="purple" variant="outline">Premium</Badge>
<Badge color="gray" variant="default">Básico</Badge>

// Badges en Contexto
<Td>
  <Badge
    variant={item.status === 'active' ? 'solid' : 'outline'}
    color={item.status === 'active' ? 'green' : 'red'}
  >
    {item.status === 'active' ? 'Activo' : 'Inactivo'}
  </Badge>
</Td>

// Badges con Conteo
<Badge color="red" variant="solid" rounded="full">
  {notificationCount}
</Badge>
```

---

## Patrones de Uso

### Patrón de Formulario Completo

Ejemplo de un formulario completo usando todos los componentes del sistema, como el modal de cotizaciones.

```tsx
import React from 'react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import SelectReact from '@/components/form/SelectReact';
import type { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';

const FormularioCompleto = ({ isOpen, onClose, onSubmit, initialData, loading }) => {
	// Opciones para selects
	const customerOptions: TSelectOptions = [
		{ value: '1', label: 'Empresa ABC S.A.S.' },
		{ value: '2', label: 'Tech Solutions Ltda.' },
		{ value: '3', label: 'Constructora XYZ' },
	];

	const paymentMethodOptions: TSelectOptions = [
		{ value: 'cash', label: 'Efectivo' },
		{ value: 'transfer', label: 'Transferencia' },
		{ value: 'credit_card', label: 'Tarjeta de Crédito' },
	];

	const productOptions: TSelectOptions = [
		{ value: '1', label: 'Laptop Dell Inspiron 15' },
		{ value: '2', label: 'Monitor Samsung 24"' },
		{ value: '3', label: 'Teclado Mecánico RGB' },
	];

	// Esquema de validación
	const validationSchema = Yup.object().shape({
		customer_id: Yup.number().required('Seleccione un cliente'),
		payment_method: Yup.string().required('Seleccione un método de pago'),
		items: Yup.array()
			.of(
				Yup.object().shape({
					product_id: Yup.number().required('Seleccione un producto'),
					quantity: Yup.number().min(1, 'Cantidad mínima 1').required(),
				}),
			)
			.min(1, 'Agregue al menos un item'),
	});

	return (
		<Modal isOpen={isOpen} setIsOpen={() => onClose()}>
			<ModalHeader>
				<div>
					<h2 className='text-xl font-semibold'>Crear Formulario</h2>
					<p className='text-sm text-gray-600'>Complete la información requerida</p>
				</div>
			</ModalHeader>

			<ModalBody>
				<Formik
					initialValues={{
						customer_id: 0,
						payment_method: '',
						items: [{ product_id: 0, quantity: 1, unit_price: 0 }],
					}}
					validationSchema={validationSchema}
					onSubmit={onSubmit}
					enableReinitialize>
					{({ values, setFieldValue, errors, touched, handleSubmit }) => (
						<Form id='main-form' onSubmit={handleSubmit} className='space-y-6'>
							{/* Información General */}
							<Card>
								<CardHeader>
									<CardHeaderChild>
										<CardTitle>Información General</CardTitle>
									</CardHeaderChild>
								</CardHeader>
								<CardBody>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										<div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Cliente *
											</label>
											<SelectReact
												name='customer_id'
												options={customerOptions}
												placeholder='Seleccionar cliente...'
												value={customerOptions.find(
													(opt) =>
														opt.value === String(values.customer_id),
												)}
												onChange={(option) => {
													const selectedOption = option as TSelectOption;
													if (
														selectedOption &&
														!Array.isArray(selectedOption)
													) {
														setFieldValue(
															'customer_id',
															Number(selectedOption.value) || 0,
														);
													}
												}}
												isValid={!errors.customer_id}
												isTouched={touched.customer_id}
												invalidFeedback={errors.customer_id}
											/>
										</div>

										<div>
											<label className='mb-2 block text-sm font-medium text-gray-700'>
												Método de Pago
											</label>
											<SelectReact
												name='payment_method'
												options={paymentMethodOptions}
												placeholder='Seleccionar método...'
												value={paymentMethodOptions.find(
													(opt) => opt.value === values.payment_method,
												)}
												onChange={(option) => {
													const selectedOption = option as TSelectOption;
													if (
														selectedOption &&
														!Array.isArray(selectedOption)
													) {
														setFieldValue(
															'payment_method',
															selectedOption.value || '',
														);
													}
												}}
												isValid={!errors.payment_method}
												isTouched={touched.payment_method}
												invalidFeedback={errors.payment_method}
											/>
										</div>
									</div>
								</CardBody>
							</Card>

							{/* Items Dinámicos */}
							<Card>
								<CardHeader>
									<CardHeaderChild>
										<CardTitle>Items</CardTitle>
									</CardHeaderChild>
									<CardHeaderChild>
										<Button size='sm' variant='outline' icon='plus'>
											Agregar Item
										</Button>
									</CardHeaderChild>
								</CardHeader>
								<CardBody>
									<FieldArray name='items'>
										{({ push, remove }) => (
											<div className='space-y-4'>
												{(values.items || []).map((item, index) => (
													<div
														key={index}
														className='rounded-md border border-gray-200 p-4'>
														<div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
															<div>
																<label className='mb-1 block text-xs font-medium text-gray-500'>
																	Producto *
																</label>
																<SelectReact
																	name={`items.${index}.product_id`}
																	options={productOptions}
																	placeholder='Seleccionar...'
																	value={productOptions.find(
																		(opt) =>
																			opt.value ===
																			String(item.product_id),
																	)}
																	onChange={(option) => {
																		const selectedOption =
																			option as TSelectOption;
																		if (
																			selectedOption &&
																			!Array.isArray(
																				selectedOption,
																			)
																		) {
																			setFieldValue(
																				`items.${index}.product_id`,
																				Number(
																					selectedOption.value,
																				) || 0,
																			);
																		}
																	}}
																	dimension='sm'
																/>
															</div>

															<div>
																<label className='mb-1 block text-xs font-medium text-gray-500'>
																	Cantidad *
																</label>
																<Input
																	name={`items.${index}.quantity`}
																	type='number'
																	placeholder='1'
																	value={item.quantity}
																	onChange={(e) =>
																		setFieldValue(
																			`items.${index}.quantity`,
																			Number(e.target.value),
																		)
																	}
																	dimension='sm'
																/>
															</div>

															<div>
																<label className='mb-1 block text-xs font-medium text-gray-500'>
																	Precio
																</label>
																<Input
																	name={`items.${index}.unit_price`}
																	type='number'
																	placeholder='0'
																	value={item.unit_price}
																	onChange={(e) =>
																		setFieldValue(
																			`items.${index}.unit_price`,
																			Number(e.target.value),
																		)
																	}
																	dimension='sm'
																/>
															</div>

															<div className='flex items-end'>
																<Button
																	variant='outline'
																	color='red'
																	size='sm'
																	icon='trash'
																	onClick={() => remove(index)}
																	isDisable={
																		(values.items?.length ||
																			0) === 1
																	}>
																	Eliminar
																</Button>
															</div>
														</div>
													</div>
												))}

												<Button
													variant='outline'
													onClick={() =>
														push({
															product_id: 0,
															quantity: 1,
															unit_price: 0,
														})
													}
													icon='plus'>
													Agregar Ítem
												</Button>
											</div>
										)}
									</FieldArray>
								</CardBody>
							</Card>
						</Form>
					)}
				</Formik>
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' onClick={onClose}>
						Cancelar
					</Button>
					<Button
						onClick={() =>
							document
								.getElementById('main-form')
								?.dispatchEvent(
									new Event('submit', { bubbles: true, cancelable: true }),
								)
						}
						isLoading={loading}>
						Guardar
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};
```

### Patrón CRUD Completo

Ejemplo completo de una página CRUD usando todos los componentes del sistema.

```tsx
import React, { useState } from 'react';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';

const UsersManagement = () => {
	const [users, setUsers] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);
	const [alert, setAlert] = useState(null);

	const handleCreate = () => {
		setSelectedUser(null);
		setShowModal(true);
	};

	const handleEdit = (user) => {
		setSelectedUser(user);
		setShowModal(true);
	};

	const handleDelete = async (userId) => {
		if (confirm('¿Está seguro de eliminar este usuario?')) {
			try {
				// API call here
				setAlert({
					type: 'success',
					message: 'Usuario eliminado correctamente',
				});
			} catch (error) {
				setAlert({
					type: 'error',
					message: 'Error al eliminar usuario',
				});
			}
		}
	};

	return (
		<div className='space-y-6'>
			{/* Alert Section */}
			{alert && (
				<Alert
					color={alert.type === 'success' ? 'green' : 'red'}
					icon={alert.type === 'success' ? 'check-circle' : 'x-circle'}
					isClosable
					onClose={() => setAlert(null)}>
					{alert.message}
				</Alert>
			)}

			{/* Main Table */}
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Gestión de Usuarios</CardTitle>
					</CardHeaderChild>
					<CardHeaderChild>
						<Button icon='plus' onClick={handleCreate}>
							Nuevo Usuario
						</Button>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<Table>
						<THead>
							<Tr>
								<Th>ID</Th>
								<Th>Nombre</Th>
								<Th>Email</Th>
								<Th>Rol</Th>
								<Th>Estado</Th>
								<Th className='text-center'>Acciones</Th>
							</Tr>
						</THead>
						<TBody>
							{users.map((user) => (
								<Tr key={user.id}>
									<Td className='font-mono'>{user.id}</Td>
									<Td className='font-semibold'>{user.name}</Td>
									<Td>{user.email}</Td>
									<Td>
										<Badge color='blue' variant='outline'>
											{user.role}
										</Badge>
									</Td>
									<Td>
										<Badge
											color={user.active ? 'green' : 'red'}
											variant={user.active ? 'solid' : 'outline'}>
											{user.active ? 'Activo' : 'Inactivo'}
										</Badge>
									</Td>
									<Td className='text-center'>
										<div className='flex justify-center gap-2'>
											<Button
												size='sm'
												variant='outline'
												icon='edit'
												onClick={() => handleEdit(user)}>
												Editar
											</Button>
											<Button
												size='sm'
												variant='outline'
												color='red'
												icon='trash'
												onClick={() => handleDelete(user.id)}>
												Eliminar
											</Button>
										</div>
									</Td>
								</Tr>
							))}
						</TBody>
					</Table>
				</CardBody>
			</Card>

			{/* Create/Edit Modal */}
			<Modal isOpen={showModal} setIsOpen={setShowModal}>
				<ModalHeader>
					<div>
						<h2 className='text-xl font-semibold'>
							{selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
						</h2>
						<p className='text-sm text-gray-600'>
							{selectedUser
								? 'Modifica los datos del usuario'
								: 'Completa la información del nuevo usuario'}
						</p>
					</div>
				</ModalHeader>
				<ModalBody>
					<div className='space-y-6'>
						<Card>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle>Información Personal</CardTitle>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								<div className='space-y-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700'>
											Nombre Completo
										</label>
										<input
											type='text'
											className='mt-1 block w-full rounded-md border-gray-300 shadow-sm'
											placeholder='Ingrese el nombre completo'
										/>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-700'>
											Email
										</label>
										<input
											type='email'
											className='mt-1 block w-full rounded-md border-gray-300 shadow-sm'
											placeholder='Ingrese el email'
										/>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle>Configuración de Cuenta</CardTitle>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								<div className='space-y-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700'>
											Rol
										</label>
										<select className='mt-1 block w-full rounded-md border-gray-300 shadow-sm'>
											<option>Administrador</option>
											<option>Usuario</option>
											<option>Invitado</option>
										</select>
									</div>
									<div>
										<label className='flex items-center'>
											<input type='checkbox' className='rounded' />
											<span className='ml-2 text-sm text-gray-700'>
												Usuario activo
											</span>
										</label>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
						<Button variant='outline' onClick={() => setShowModal(false)}>
							Cancelar
						</Button>
						<Button onClick={handleSave}>
							{selectedUser ? 'Actualizar' : 'Crear'}
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</div>
	);
};

export default UsersManagement;
```

### Patrón de Dashboard con Estadísticas

```tsx
import React from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const Dashboard = () => {
	const stats = [
		{ title: 'Total Usuarios', value: '1,234', change: '+12%', trend: 'up' },
		{ title: 'Ventas Mes', value: '$45,678', change: '+8%', trend: 'up' },
		{ title: 'Pedidos Pendientes', value: '23', change: '-5%', trend: 'down' },
		{ title: 'Satisfacción Cliente', value: '98%', change: '+2%', trend: 'up' },
	];

	return (
		<div className='space-y-6'>
			{/* Stats Grid */}
			<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
				{stats.map((stat, index) => (
					<Card key={index}>
						<CardBody>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-gray-600'>
										{stat.title}
									</p>
									<p className='text-2xl font-semibold text-gray-900'>
										{stat.value}
									</p>
								</div>
								<Badge
									color={stat.trend === 'up' ? 'green' : 'red'}
									variant='solid'>
									{stat.change}
								</Badge>
							</div>
						</CardBody>
					</Card>
				))}
			</div>

			{/* Main Content */}
			<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				<div className='lg:col-span-2'>
					<Card>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Actividad Reciente</CardTitle>
							</CardHeaderChild>
							<CardHeaderChild>
								<Button size='sm' variant='outline' icon='refresh'>
									Actualizar
								</Button>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>{/* Activity content */}</CardBody>
					</Card>
				</div>

				<div>
					<Card>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Acciones Rápidas</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='space-y-3'>
								<Button className='w-full' icon='plus'>
									Nuevo Usuario
								</Button>
								<Button className='w-full' variant='outline' icon='document'>
									Generar Reporte
								</Button>
								<Button className='w-full' variant='outline' icon='settings'>
									Configuración
								</Button>
							</div>
						</CardBody>
					</Card>
				</div>
			</div>
		</div>
	);
};
```

---

## Guías de Migración

### Migrar Modales Antiguos

#### ❌ Patrón Anterior (Incorrecto)

```tsx
// NO usar este patrón
<div className='fixed inset-0 z-50 overflow-y-auto'>
	<div className='flex min-h-screen items-end justify-center'>
		<div className='fixed inset-0 bg-gray-500 bg-opacity-75'></div>
		<div className='rounded-lg bg-white p-6'>
			<div className='mb-4 border-b pb-3'>
				<h3>Título</h3>
			</div>
			<div>{/* contenido */}</div>
			<div className='mt-4 flex justify-end space-x-2'>
				<button>Cancelar</button>
				<button>Guardar</button>
			</div>
		</div>
	</div>
</div>
```

#### ✅ Patrón Correcto (Nuevo)

```tsx
// SÍ usar este patrón
<Modal isOpen={isOpen} setIsOpen={setIsOpen}>
	<ModalHeader>
		<h3>Título</h3>
	</ModalHeader>
	<ModalBody>{/* contenido */}</ModalBody>
	<ModalFooter>
		<ModalFooterChild>
			<Button variant='outline'>Cancelar</Button>
			<Button>Guardar</Button>
		</ModalFooterChild>
	</ModalFooter>
</Modal>
```

### Migrar Tablas Antiguas

#### ❌ Patrón Anterior (Incorrecto)

```tsx
// NO usar HTML nativo
<div className='overflow-x-auto'>
	<table className='min-w-full'>
		<thead className='bg-gray-50'>
			<tr>
				<th>Columna</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Dato</td>
			</tr>
		</tbody>
	</table>
</div>
```

#### ✅ Patrón Correcto (Nuevo)

```tsx
// SÍ usar componentes UI
<Table>
	<THead>
		<Tr>
			<Th>Columna</Th>
		</Tr>
	</THead>
	<TBody>
		<Tr>
			<Td>Dato</Td>
		</Tr>
	</TBody>
</Table>
```

### Migrar Selects Antiguos

#### ❌ Patrón Anterior (Incorrecto)

```tsx
// NO usar HTML select nativo
<select className="w-full rounded-md border border-gray-300 px-3 py-2">
  <option value="">Seleccionar opción</option>
  <option value="1">Opción 1</option>
  <option value="2">Opción 2</option>
</select>

// NO usar Field con select
<Field
  name="customer_id"
  as="select"
  className="w-full rounded-md border border-gray-300 px-3 py-2"
>
  <option value="">Seleccionar cliente</option>
  <option value="1">Cliente 1</option>
</Field>
```

#### ✅ Patrón Correcto (Nuevo)

```tsx
// SÍ usar SelectReact
const options: TSelectOptions = [
	{ value: '1', label: 'Opción 1' },
	{ value: '2', label: 'Opción 2' },
];

<SelectReact
	name='field_name'
	options={options}
	placeholder='Seleccionar opción...'
	value={options.find((opt) => opt.value === values.field_name)}
	onChange={(option) => {
		const selectedOption = option as TSelectOption;
		if (selectedOption && !Array.isArray(selectedOption)) {
			setFieldValue('field_name', selectedOption.value);
		}
	}}
	isValid={!errors.field_name}
	isTouched={touched.field_name}
	invalidFeedback={errors.field_name}
/>;
```

### Migrar Botones Antiguos

#### ❌ Props Incorrectos

```tsx
// NO usar estas props
<Button disabled={true}>Botón</Button>
<button className="btn btn-primary">Botón</button>
```

#### ✅ Props Correcto

```tsx
// SÍ usar estas props
<Button isDisable={true}>Botón</Button>
<Button variant="solid" color="blue">Botón</Button>
```

---

## Checklist de Migración

### Para Modales

-   [ ] ✅ Reemplazar `div` por componente `Modal`
-   [ ] ✅ Usar `ModalHeader` para títulos
-   [ ] ✅ Usar `ModalBody` para contenido
-   [ ] ✅ Usar `ModalFooter` + `ModalFooterChild` para botones
-   [ ] ✅ Cambiar props `isOpen` y `setIsOpen`

### Para Formularios

-   [ ] ✅ Usar estructura `Card` + `CardHeader` + `CardBody` para secciones
-   [ ] ✅ Reemplazar `<Field>` HTML por componentes UI (`Input`, `SelectReact`)
-   [ ] ✅ Usar `SelectReact` en lugar de `<select>` nativo o `<Field as="select">`
-   [ ] ✅ Implementar validación con `isValid`, `isTouched`, `invalidFeedback`
-   [ ] ✅ Usar `FieldArray` para elementos dinámicos
-   [ ] ✅ Conectar formulario con botón submit usando `id` y `dispatchEvent`

### Para Selects

-   [ ] ✅ Definir opciones como `TSelectOptions` con `value` y `label`
-   [ ] ✅ Usar `SelectReact` con `options`, `placeholder`, `value`, `onChange`
-   [ ] ✅ Implementar type assertion en `onChange`: `option as TSelectOption`
-   [ ] ✅ Usar `find()` para encontrar `value` seleccionado
-   [ ] ✅ Soportar `isMulti` cuando sea necesario
-   [ ] ✅ Usar `dimension` para diferentes tamaños (sm, default, lg, xl)

### Para Tablas

-   [ ] ✅ Reemplazar `table` HTML por `Table`
-   [ ] ✅ Usar `THead`, `TBody`, `TFoot`
-   [ ] ✅ Usar `Tr`, `Th`, `Td`
-   [ ] ✅ Remover clases CSS manuales

### Para Botones

-   [ ] ✅ Cambiar `disabled` por `isDisable`
-   [ ] ✅ Usar props `variant`, `color`, `size`
-   [ ] ✅ Usar `icon` y `rightIcon` para iconos
-   [ ] ✅ Remover prop `type` (no compatible con Button UI)
-   [ ] ✅ Remover clases CSS manuales

### Para Cards

-   [ ] ✅ Usar estructura jerárquica Card > CardHeader/CardBody
-   [ ] ✅ Usar `CardHeaderChild` para contenido del header
-   [ ] ✅ Usar `CardTitle` para títulos

---

## Conclusión

Este sistema de diseño garantiza:

1. **Consistencia Visual**: Todos los componentes siguen el mismo estilo
2. **Mantenibilidad**: Cambios centralizados en los componentes
3. **Accesibilidad**: Componentes optimizados para todos los usuarios
4. **Developer Experience**: API intuitiva y documentada
5. **Performance**: Componentes optimizados y reutilizables

### Recursos Adicionales

-   **Componentes Disponibles**: Alert, Badge, Button, ButtonGroup, Card, CloseButton, DataTable, Dropdown, Modal, OffCanvas, Pagination, Progress, Table, Tabs, Tooltip
-   **Componentes de Formulario**: Input, SelectReact (react-select avanzado), Validation
-   **Ubicación**: `src/components/ui/` y `src/components/form/`
-   **Tipos**: Definidos en `src/types/`
-   **Configuración**: `src/config/theme.config.ts`

### Componentes Especiales

#### SelectReact

-   **Funcionalidades**: Búsqueda, multi-selección, creación de opciones, validación integrada
-   **Diseño**: Adapta automáticamente al tema dark/light
-   **Accesibilidad**: Navegación por teclado, soporte para lectores de pantalla
-   **Performance**: Virtualización para listas grandes

#### Modal System

-   **Estructura**: Modal > ModalHeader/ModalBody/ModalFooter > ModalFooterChild
-   **Características**: Backdrop automático, escape key, scroll body, responsive
-   **Accesibilidad**: Focus trap, ARIA labels automáticos

#### Card System

-   **Flexibilidad**: Header opcional, multiple children en CardHeader
-   **Layout**: Grid automático, spacing consistente
-   **Variantes**: Elevation, bordes, sombras configurables

Para cualquier duda o mejora, consultar el código fuente de los componentes o crear una issue en el repositorio.

---

_Última actualización: 10 de septiembre de 2025_
_Versión del documento: 2.0 - Incluye SelectReact y Formularios Avanzados_
