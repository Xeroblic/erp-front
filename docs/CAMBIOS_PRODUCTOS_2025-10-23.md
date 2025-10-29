# Cambios en Módulo de Productos - 23 Oct 2025

## Resumen

Se alineó la validación del frontend con los requisitos del backend (StoreProductRequest) y se limpió la carpeta de productos eliminando código duplicado y no usado.

---

## 1. Campos Obligatorios para Crear Producto

### Backend (Laravel - StoreProductRequest)

```php
'sku' => ['required', 'string', 'max:255', Rule::unique('products','sku')->where('branch_id', $branch->id)],
'name' => ['required', 'string', 'max:255'],
'brand_id' => ['required', 'exists:brands,id'],
'price' => ['required', 'numeric', 'min:0'],
'is_active' => ['required', 'boolean'],
'category_ids' => ['required', 'array'],
'category_ids.*' => ['integer', 'exists:categories,id'],
```

### Frontend (ahora alineado)

- **SKU** (único por sucursal)
- **Nombre**
- **Marca** (brand_id)
- **Precio**
- **Estado activo** (is_active, default: true)
- **Categorías** (al menos 1)

---

## 2. Archivos Modificados

### `src/pages/catalogos/productos/validation/productForm.schema.ts`

**Antes:**

```ts
// Schema relajado: solo requería nombre
export const productSchemaCreate = productSchema.shape({
	sku: Yup.string().nullable(),
	name: Yup.string().required('Nombre requerido'),
	brand_id: Yup.number().typeError('Marca inválida').nullable(),
	price: Yup.number().typeError('Precio inválido').nullable(),
});
```

**Después:**

```ts
// Schema alineado con backend: requiere todos los campos obligatorios
export const productSchemaCreate = Yup.object({
	sku: Yup.string().required('SKU requerido').max(255),
	name: Yup.string().required('Nombre requerido').max(255),
	brand_id: Yup.number().required('Marca requerida'),
	price: Yup.number().min(0).required('Precio requerido'),
	categories: Yup.array().min(1, 'Selecciona al menos una categoría').required(),
	// ... campos opcionales
});
```

### `src/components/helper/product.helper.ts`

**Cambio:** `buildProductPayload` ahora valida todos los campos obligatorios y lanza errores descriptivos si faltan.

### `src/pages/catalogos/productos/components/modals/CreateEditProductModal.tsx`

**Cambio:** El payload de creación ahora incluye siempre los campos obligatorios (sku, name, brand_id, price, is_active, serial_tracking).

### `src/pages/catalogos/productos/types/products.types.ts`

**Cambios:**

- Añadidos campos opcionales `commercial_sku` y `barcode` a `LegacyProductFormValues`
- Eliminados tipos no usados: `ProductCreateForm`, `BuildCreatePayloadOptions`

---

## 3. Archivos Eliminados (no usados)

### Archivos duplicados/obsoletos:

- ✅ `src/pages/catalogos/productos/validation/productCreate.schema.ts` (duplicado)
- ✅ `src/pages/catalogos/productos/utils/productAttributes.utils.ts` (no usado)

### Funciones eliminadas de `productForm.utils.ts`:

- ✅ `buildMinimalCreatePayload()` (obsoleta)
- ✅ `mapProductToCreateForm()` (no usada)
- ✅ `buildCreateProductPayload()` (no usada)

---

## 4. Estructura Actual de Carpeta Productos

```
src/pages/catalogos/productos/
├── ProductDetail.tsx
├── Productos.tsx
├── ProductosMain.tsx
├── components/
│   ├── ActiveFiltersDisplay.tsx
│   ├── Pagination.tsx
│   ├── ProductFiltersCard.tsx
│   ├── ProductsHeader.tsx
│   ├── ProductStats.tsx
│   ├── DetailTabs/
│   │   ├── AtributosTab.tsx
│   │   ├── ComercialTab.tsx
│   │   ├── ContenidoTab.tsx
│   │   ├── GeneralTab.tsx
│   │   ├── index.ts
│   │   └── DynamicAttributesEditor/ (completo)
│   ├── modals/
│   │   ├── CreateEditProductModal.tsx
│   │   └── DeleteProductModal.tsx
│   ├── tables/
│   │   └── ProductsTable.tsx
│   └── Tabs/
│       ├── AnalyticsTab.tsx
│       ├── index.ts
│       ├── InventoryTab.tsx
│       └── ProductListTab.tsx
├── constants/
│   ├── attributes.constants.ts
│   ├── attributes.schemas.ts
│   ├── product-attributes.constants.ts
│   └── products.constant.ts
├── hooks/
│   ├── useProductDetail.ts
│   └── useProductos.ts
├── types/
│   ├── attributes.types.ts
│   └── products.types.ts
├── utils/
│   └── productForm.utils.ts (limpio, sin código duplicado)
└── validation/
    └── productForm.schema.ts (único schema, alineado con backend)
```

---

## 5. Pasos para Crear un Producto (UI)

1. Abrir modal "Nuevo producto"
2. **Rellenar campos obligatorios:**
    - SKU
    - Nombre
    - Marca (seleccionar del dropdown)
    - Precio
    - Categorías (seleccionar al menos 1)
3. Opcionalmente rellenar: Costo, Precio oferta, Garantía, Unidad de medida, Condición, etc.
4. Click en "Crear producto"

El producto se crea con estado `is_active: true` por defecto.

---

## 6. Mejoras Implementadas

✅ **Consistencia Backend-Frontend:** Validación Yup alineada con Laravel FormRequest  
✅ **Código limpio:** Eliminados archivos duplicados y funciones no usadas  
✅ **Tipos TypeScript correctos:** Interfaces actualizadas para incluir campos opcionales  
✅ **Errores descriptivos:** `buildProductPayload` valida y lanza mensajes claros  
✅ **Sin errores de compilación:** Verificado con `get_errors` en todos los archivos modificados

---

## 7. Próximos Pasos Opcionales

- [ ] Implementar botón "Guardar borrador" que permita crear productos con campos mínimos (solo nombre) y completar luego
- [ ] Añadir auto-generación de SKU si el usuario lo deja vacío (ej: `PROD-${timestamp}`)
- [ ] Mejorar UX del modal: mostrar badges de "Campo obligatorio" en inputs requeridos
- [ ] Añadir validación en tiempo real (mientras escribe) en los campos obligatorios

---

## Notas Técnicas

### Backend Endpoints

- **POST** `/branches/{branchId}/products` - Crear producto
- **PATCH** `/branches/{branchId}/products/{productId}` - Actualizar producto
- **DELETE** `/branches/{branchId}/products/{productId}` - Eliminar producto

### Contexto Requerido

El `branchId` (ID de sucursal) se obtiene automáticamente del contexto del usuario logueado (sucursal activa).

### Subida de Imagen

Para subir imagen después de crear el producto:

```ts
dispatch(
	uploadProductMedia({
		branchId,
		productId,
		file: File,
	}),
);
```

O adjuntar desde librería:

```ts
dispatch(
	attachProductMediaFromLibrary({
		branchId,
		productId,
		payload: { library_media_id: number },
	}),
);
```

---

**Fecha:** 23 de octubre de 2025  
**Rama:** develop  
**Estado:** ✅ Completado y verificado
