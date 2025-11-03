# 📋 Migración de Modales a Páginas - Catálogos

## 🎯 Resumen de Cambios

Se migraron los modales de detalle de **Proveedores** y **Clientes** a páginas completas con capacidad de edición y gestión de asociaciones.

---

## ✅ Cambios Implementados

### 1. **DetalleProveedor → Página Completa**

**Archivo**: `src/pages/catalogos/proveedores/DetalleProveedor.tsx`

#### Características:

- ✅ Ruta: `/catalogos/proveedores/:id`
- ✅ Estado `isEditable` para controlar modo de edición
- ✅ Botón toggle en Subheader:
    - **Azul + Icono Lápiz**: "Habilitar Edición"
    - **Ámbar + Icono Candado**: "Bloquear Edición"
- ✅ **Tabla 1 - Clientes Asociados** (siempre visible):
    - Columnas: Nombre, Correo, Teléfono, Estado, Acciones
    - Botón "Desasociar" (habilitado solo en modo edición)
- ✅ **Tabla 2 - Clientes Disponibles** (visible solo en modo edición):
    - Columnas: Nombre, Correo, Teléfono, Estado, Acciones
    - Botón "Asociar" (habilitado solo en modo edición)
- ✅ Información detallada del proveedor:
    - Código, Estado, Categoría, Documento
    - Rating con estrellas
    - Información de contacto
    - Métricas comerciales (compras, órdenes, productos)
    - Términos de pago y límite de crédito
- ✅ Renderizado condicional seguro para propiedades opcionales
- ✅ Manejo de recarga de página (fetch automático desde Redux)

#### Hook Utilizado:

```typescript
useSupplierCustomers(supplierId, enabled);
```

- Gestiona la carga de clientes asociados al proveedor
- Funciones: `attach()` y `detach()`
- Estados: `loading`, `attaching`, `detaching`

---

### 2. **DetalleCliente → Página Completa**

**Archivo**: `src/pages/catalogos/clientes/DetalleCliente.tsx`

#### Características:

- ✅ Ruta: `/catalogos/clientes/:id`
- ✅ Estado `isEditable` para controlar modo de edición
- ✅ Botón toggle en Subheader (mismo comportamiento que proveedores)
- ✅ **Tabla 1 - Proveedores Asociados** (siempre visible):
    - Columnas: Nombre, Código, Categoría, Estado, Acciones
    - Botón "Desasociar" (habilitado solo en modo edición)
- ✅ **Tabla 2 - Proveedores Disponibles** (visible solo en modo edición):
    - Columnas: Nombre, Código, Categoría, Estado, Acciones
    - Botón "Asociar" (habilitado solo en modo edición)
- ✅ Información detallada del cliente:
    - Código, Estado, Categoría, Documento
    - Información de contacto (email, teléfono, móvil, dirección)
    - Información comercial (compras, órdenes, términos de pago, crédito)
- ✅ Renderizado condicional para campos opcionales
- ✅ Manejo de recarga de página

#### Hook Creado:

**Archivo**: `src/pages/catalogos/clientes/components/hooks/useCustomerSuppliers.ts`

```typescript
useCustomerSuppliers(customerSupplierId, enabled);
```

- Gestiona la carga de proveedores asociados al cliente
- Funciones: `attach()` y `detach()`
- Estados: `loading`, `attaching`, `detaching`
- Utiliza Redux actions:
    - `fetchSuppliersOfCustomerSupplier`
    - `attachSuppliersToCustomerSupplier`
    - `detachSuppliersFromCustomerSupplier`

---

### 3. **Navegación Actualizada**

#### Proveedores.tsx

**Cambio**: Eliminado modal `DetalleProveedor`

```typescript
// Antes
const onView = (supplier) => {
	setSelected(supplier);
	setViewOpen(true);
};

// Ahora
const onView = (supplier) => {
	navigate(`/catalogos/proveedores/${supplier.id}`);
};
```

#### Clientes.tsx

**Archivo**: `src/pages/catalogos/clientes/Clientes.tsx`

**Cambios realizados**:

- ✅ Importado `useNavigate` de react-router-dom
- ✅ Eliminado estado `viewOpen`
- ✅ Eliminada importación del modal `DetalleCliente`
- ✅ Actualizada función `onView()` para navegar a página:

```typescript
const onView = (c: ICustomerSupplier) => {
	navigate(`/catalogos/clientes/${c.id}`);
};
```

- ✅ Eliminado componente `<DetalleCliente />` del JSX

---

### 4. **Componentes Compartidos Creados**

#### AssociationTable

**Archivo**: `src/pages/catalogos/components/shared/AssociationTable.tsx`

Componente genérico reutilizable para tablas de asociaciones.

**Props**:

```typescript
interface AssociationTableProps<T> {
	title: string; // Título de la tarjeta
	count: number; // Número de elementos
	table: ReactTable<T>; // Instancia de TanStack Table
	loading?: boolean; // Estado de carga
	emptyMessage: string; // Mensaje cuando no hay datos
	showOnlyInEditMode?: boolean; // Mostrar solo en modo edición
	isEditMode?: boolean; // Estado del modo edición
}
```

**Uso**:

```tsx
<AssociationTable
	title='Clientes Asociados'
	count={associatedCustomers?.length || 0}
	table={associatedTable}
	loading={loadingAssociated}
	emptyMessage='Este proveedor no tiene clientes asociados.'
	showOnlyInEditMode={false}
	isEditMode={isEditable}
/>
```

#### InfoCard

**Archivo**: `src/pages/catalogos/components/shared/InfoCard.tsx`

Componente para tarjetas de información con secciones.

**Props**:

```typescript
interface InfoCardProps {
	title: string;
	mainContent?: React.ReactNode;
	sections?: InfoCardSection[];
	badges?: Array<{
		label: string;
		color: 'emerald' | 'red' | 'sky' | 'amber' | 'blue';
		variant?: 'solid' | 'outline';
		condition?: boolean;
	}>;
}
```

**Ejemplo**:

```tsx
<InfoCard
	title='Información del Proveedor'
	mainContent={<h3>{supplier.name}</h3>}
	badges={[
		{ label: 'Activo', color: 'emerald', condition: supplier.is_active },
		{ label: supplier.category, color: 'sky' },
	]}
	sections={[
		{
			title: 'Información de Contacto',
			items: [
				{ value: supplier.address, condition: !!supplier.address },
				{ label: 'Email', value: supplier.email },
			],
		},
	]}
/>
```

---

## 🔧 Mejoras Técnicas Implementadas

### 1. **Type Safety con Interfaces Extendidas**

```typescript
// DetalleProveedor.tsx
interface ISupplierExtended extends ISupplier {
	code?: string;
	is_active?: boolean;
	category?: string;
	// ... más propiedades del backend
}

// DetalleCliente.tsx
interface ICustomerSupplierExtended extends ICustomerSupplier {
	code?: string;
	is_active?: boolean;
	// ... más propiedades del backend
}
```

### 2. **Renderizado Condicional Seguro**

```typescript
// Solo mostrar si existe
{supplier.code && <p>{supplier.code}</p>}

// Condición con undefined check
{supplier.is_active !== undefined && (
  <Badge color={supplier.is_active ? 'emerald' : 'red'}>
    {supplier.is_active ? 'Activo' : 'Inactivo'}
  </Badge>
)}

// Múltiples campos opcionales
{(supplier.city || supplier.country) && (
  <p>
    {supplier.city}
    {supplier.city && supplier.country && ', '}
    {supplier.country}
  </p>
)}
```

### 3. **Manejo de Recarga de Página**

Ambas páginas implementan `useEffect` para cargar datos si el store está vacío:

```typescript
// Cargar datos si no están en el store
useEffect(() => {
	if (subsidiaryId && (!allSuppliers || allSuppliers.length === 0)) {
		void dispatch(
			fetchSuppliers({
				subsidiaryId,
				with_customers: true,
			}),
		);
	}
}, [dispatch, subsidiaryId, allSuppliers]);

// Buscar el registro específico
useEffect(() => {
	if (supplierId && allSuppliers && allSuppliers.length > 0) {
		const found = allSuppliers.find((s: any) => s.id === supplierId);
		if (found) {
			setSupplier(found as ISupplierExtended);
		}
	}
}, [supplierId, allSuppliers]);
```

### 4. **Estado de Carga Apropiado**

```typescript
if (!supplier) {
  return (
    <PageWrapper name='Detalle de Proveedor'>
      <Container>
        <div className='flex items-center justify-center py-12'>
          <Icon icon='HeroArrowPath' className='h-8 w-8 animate-spin text-orange-600' />
          <span className='ml-2 text-gray-600'>Cargando proveedor...</span>
        </div>
      </Container>
    </PageWrapper>
  );
}
```

---

## 📊 Comparación Antes/Después

| Aspecto          | Antes (Modal)          | Después (Página)                        |
| ---------------- | ---------------------- | --------------------------------------- |
| **UX**           | Modal limitado         | Página completa con más espacio         |
| **URL**          | No tiene URL propia    | `/catalogos/proveedores/:id`            |
| **Bookmark**     | ❌ No se puede guardar | ✅ URL compartible                      |
| **Recarga**      | ❌ Pierde contexto     | ✅ Recarga datos automáticamente        |
| **Edición**      | Modal separado         | ✅ Toggle en la misma página            |
| **Asociaciones** | No disponible          | ✅ Dos tablas (asociados + disponibles) |
| **Responsive**   | Limitado               | ✅ Grid adaptable                       |
| **Navegación**   | Stack de modales       | ✅ Historial del browser                |

---

## 🧪 Testing Checklist

### DetalleProveedor

- [ ] Navegar desde lista de proveedores funciona
- [ ] URL directa `/catalogos/proveedores/1` funciona
- [ ] Recarga de página carga datos correctamente
- [ ] Toggle de edición habilita/deshabilita botones
- [ ] Botón "Volver" regresa a lista
- [ ] Asociar cliente funciona
- [ ] Desasociar cliente funciona
- [ ] Tabla de disponibles solo aparece en modo edición
- [ ] Propiedades opcionales se renderizan condicionalmente

### DetalleCliente

- [ ] Navegar desde lista de clientes funciona
- [ ] URL directa `/catalogos/clientes/1` funciona
- [ ] Recarga de página carga datos correctamente
- [ ] Toggle de edición habilita/deshabilita botones
- [ ] Botón "Volver" regresa a lista
- [ ] Asociar proveedor funciona
- [ ] Desasociar proveedor funciona
- [ ] Tabla de disponibles solo aparece en modo edición
- [ ] Propiedades opcionales se renderizan condicionalmente

---

## 🚀 Próximos Pasos Sugeridos

### Optimizaciones Futuras

1. **Implementar skeleton loading** en lugar de spinner
2. **Agregar paginación** a las tablas de asociaciones
3. **Implementar búsqueda/filtrado** en tablas de disponibles
4. **Agregar confirmación** antes de desasociar
5. **Implementar selección múltiple** para asociar/desasociar varios a la vez
6. **Agregar breadcrumbs** para mejor navegación
7. **Cache de datos** para evitar recargas innecesarias

### Refactorización

1. **Extraer lógica común** de DetalleProveedor y DetalleCliente a un hook compartido
2. **Usar AssociationTable** en ambas páginas para eliminar código duplicado
3. **Crear un layout común** para páginas de detalle
4. **Implementar suspense boundaries** para mejor manejo de loading

### Nuevas Características

1. **Edición inline** de información básica
2. **Historial de cambios** (audit trail)
3. **Notas/comentarios** en la página de detalle
4. **Exportar a PDF** la información del proveedor/cliente
5. **Gráficos** de métricas comerciales

---

## 📝 Notas Técnicas

### Redux Actions Utilizadas

- `fetchSuppliers` - Cargar lista de proveedores
- `fetchCustomerSuppliers` - Cargar lista de clientes
- `fetchSupplierCustomers` - Cargar clientes de un proveedor
- `fetchSuppliersOfCustomerSupplier` - Cargar proveedores de un cliente
- `attachCustomersToSupplier` - Asociar clientes a proveedor
- `detachCustomersFromSupplier` - Desasociar clientes de proveedor
- `attachSuppliersToCustomerSupplier` - Asociar proveedores a cliente
- `detachSuppliersFromCustomerSupplier` - Desasociar proveedores de cliente

### Dependencias Clave

- `react-router-dom` v6 - Routing y navegación
- `@tanstack/react-table` v8 - Tablas interactivas
- `@reduxjs/toolkit` - State management
- Tailwind CSS - Estilos

---

## ✅ Estado Final

| Tarea                          | Estado | Archivo                                             |
| ------------------------------ | ------ | --------------------------------------------------- |
| DetalleProveedor como Página   | ✅     | `proveedores/DetalleProveedor.tsx`                  |
| Navegación a DetalleProveedor  | ✅     | `proveedores/Proveedores.tsx`                       |
| DetalleCliente como Página     | ✅     | `clientes/DetalleCliente.tsx`                       |
| Navegación a DetalleCliente    | ✅     | `clientes/Clientes.tsx`                             |
| Hook useCustomerSuppliers      | ✅     | `clientes/components/hooks/useCustomerSuppliers.ts` |
| Componente AssociationTable    | ✅     | `catalogos/components/shared/AssociationTable.tsx`  |
| Componente InfoCard            | ✅     | `catalogos/components/shared/InfoCard.tsx`          |
| Renderizado condicional seguro | ✅     | Ambas páginas de detalle                            |
| Manejo de recarga de página    | ✅     | Ambas páginas de detalle                            |

**Todos los errores de TypeScript resueltos ✅**

---

_Documentación generada el 3 de noviembre de 2025_
