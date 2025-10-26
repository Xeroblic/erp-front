# Tablas de Productos

## ProductsTableV2 (Recomendada)

Tabla mejorada usando **TanStack Table (React Table v8)** con las siguientes características:

### ✨ Características principales:

1. **Imágenes de productos**: Muestra la imagen del producto o un icono de fallback
2. **Mejor tipado**: Uso completo de TypeScript con tipos seguros
3. **Diseño mejorado**: UI más moderna y responsive
4. **Precios con oferta**: Destaca visualmente los productos con precio de oferta
5. **Más información**: Muestra garantía, seguimiento de serie, SKU comercial
6. **Rendimiento**: Usa TanStack Table para mejor manejo de datos
7. **Skeleton loading**: Estados de carga más profesionales
8. **Empty state**: Mensaje amigable cuando no hay productos

### 🎨 Mejoras visuales:

- Thumbnails de productos (48x48px)
- Precios tachados cuando hay oferta
- Badges de colores para estados
- Iconos descriptivos
- Hover effects en las filas
- Mejor jerarquía visual

### 📊 Columnas:

1. **Producto**: Imagen, nombre, SKU, SKU comercial, tipo
2. **Precio**: Precio regular, precio oferta, costo
3. **Marca**: Icono + nombre de marca
4. **Estado**: Activo/Inactivo, seguimiento serie, garantía
5. **Categorías**: Badges con categorías asignadas
6. **Acciones**: Botones de ver, editar, eliminar

### 🔧 Uso:

```tsx
import ProductsTableV2 from './components/tables/ProductsTableV2';

<ProductsTableV2
	products={products}
	meta={meta}
	loading={loading}
	onView={handleView}
	onEdit={handleEdit}
	onDelete={handleDelete}
/>
```

### 📦 Dependencias:

```bash
npm install @tanstack/react-table
```

## ProductsTable (Legacy)

Tabla anterior sin TanStack Table. Mantiene la funcionalidad básica pero sin las mejoras visuales y de rendimiento.

### Cuándo usar cada una:

- **ProductsTableV2**: Para interfaces modernas con mejor UX
- **ProductsTable**: Solo si necesitas mantener compatibilidad con código legacy
