# 📄 Personalización de Documentos de Cotización

## 📍 Ubicación de Archivos

- **Helper de mapeo**: `quote-data-mapper.ts` - **EDITA AQUÍ** para cambiar los datos que se muestran
- **Vista imprimible**: `QuotePrintableView.tsx` - Vista HTML para imprimir
- **Generador PDF**: `QuotePdfDocument.tsx` - Generador de PDF descargable

## 🎯 Cómo Modificar los Datos que se Muestran

### 1️⃣ Editar `quote-data-mapper.ts`

Este archivo centraliza **TODA** la lógica de obtención y mapeo de datos. Las modificaciones aquí se aplican automáticamente a ambos componentes (vista y PDF).

#### Datos de Empresa/Sucursal

```typescript
export const getCompanyInfo = (quote: IQuote, state: any) => {
	// MODIFICAR ESTAS LÍNEAS para cambiar la fuente de datos:

	const name = meta.name || activeSub?.subsidiary_name || mainCompany?.company_name || 'EcoTI';
	// Prioridad: metadata > subsidiary > mainCompany > fallback

	const rut = meta.rut || activeSub?.subsidiary_rut || mainCompany?.company_rut || '—';

	const activity =
		meta.activity ||
		activeSub?.subsidiary_giro ||
		mainCompany?.business_activity ||
		'Venta de artículos computacionales';

	// ... etc
};
```

**Estructura de prioridad:**

1. `metadata.company` - Metadatos específicos de la cotización
2. `activeSub` - Sucursal activa (basada en `subsidiary_id`)
3. `mainCompany` - Empresa principal
4. Valor por defecto (`'—'` o texto)

#### Datos de Cliente

```typescript
export const getCustomerInfo = (customer: any) => {
	return {
		name: customer?.razon_social || customer?.name || 'Cliente General',
		// Prioridad: razon_social > name > fallback

		rut: customer?.rut || '—',
		address: customer?.direccion || customer?.address || '—',
		// Soporta ambos nombres de campos

		phone: customer?.telefono || customer?.phone || '—',
		// ...
	};
};
```

**Campos disponibles en customer:**

- `name` / `razon_social`
- `rut`
- `direccion` / `address`
- `giro`
- `contact_name` / `contacto`
- `telefono` / `phone`
- `email`
- `comuna`

#### Datos de Items/Productos

```typescript
export const getProductSku = (item: any): string => {
	return (
		item?.product?.sku || // SKU desde relación product
		item?.customer_sku || // SKU personalizado
		item?.meta_json?.mapping?.sku || // SKU desde metadata
		'—'
	);
};

export const getProductName = (item: any): string => {
	return (
		item?.product?.name || // Nombre desde relación product
		item?.customer_name || // Nombre personalizado
		item?.name || // Nombre directo
		'Producto sin nombre'
	);
};
```

### 2️⃣ Modificar Estilos Visuales

#### En `QuotePrintableView.tsx` (Vista HTML):

```tsx
// Cambiar tamaños, colores, espaciados:
<div className='text-[9px] text-gray-700'>
	{' '}
	{/* Tailwind CSS */}
	{/* contenido */}
</div>
```

#### En `QuotePdfDocument.tsx` (PDF):

```tsx
const styles = StyleSheet.create({
	companyLine: {
		fontSize: 9, // Cambiar tamaño
		color: '#374151', // Cambiar color
	},
	// ...
});
```

## 🔧 Casos de Uso Comunes

### Agregar un nuevo campo de empresa

**1. En `quote-data-mapper.ts`:**

```typescript
export const getCompanyInfo = (quote: IQuote, state: any) => {
	// ... código existente ...

	// AGREGAR:
	const newField = meta.new_field || activeSub?.subsidiary_new_field || 'Valor por defecto';

	return {
		// ... campos existentes ...
		newField, // AGREGAR al return
	};
};
```

**2. Usar en los componentes:**

```tsx
// QuotePrintableView.tsx
<p className='text-[9px] text-gray-700'>
  Nuevo Campo: {company.newField}
</p>

// QuotePdfDocument.tsx
<Text style={styles.companyLine}>
  Nuevo Campo: {company.newField}
</Text>
```

### Cambiar el orden de prioridad de datos

```typescript
// Antes:
const name = meta.name || activeSub?.subsidiary_name || mainCompany?.company_name;

// Después (priorizar mainCompany):
const name = mainCompany?.company_name || activeSub?.subsidiary_name || meta.name;
```

### Agregar validación o transformación

```typescript
export const getCustomerInfo = (customer: any) => {
	// Formatear RUT
	const rut = customer?.rut ? customer.rut.toUpperCase().trim() : '—';

	// Capitalizar nombre
	const name = customer?.name ? customer.name.toUpperCase() : 'CLIENTE GENERAL';

	return { name, rut /* ... */ };
};
```

## 🚀 Flujo de Datos

```
API Response
    ↓
quote-data-mapper.ts
    ├── getCompanyInfo()
    ├── getCustomerInfo()
    ├── getProductSku()
    ├── getProductName()
    └── resolveUnitPrice() / resolveLineTotal()
    ↓
QuotePrintableView.tsx & QuotePdfDocument.tsx
    ↓
Documento Final
```

## 📊 Estructura de Datos de Entrada

### Quote Object:

```typescript
{
  id: number,
  subsidiary_id: number,
  customer_id: number,
  quote_date: string,
  items: IQuoteItem[],
  customer: {
    name: string,
    rut: string,
    direccion: string,
    telefono: string,
    // ...
  },
  subsidiary?: {  // Opcional, puede venir con la cotización
    id: number,
    subsidiary_name: string,
    subsidiary_rut: string,
    logo_base_64: string,
    logo_url: string,
    // ...
  },
  metadata?: {    // Opcional, metadatos específicos
    company: {
      name: string,
      rut: string,
      logo_base_64: string,
      // ...
    }
  }
}
```

## ⚠️ Notas Importantes

1. **SIEMPRE** edita `quote-data-mapper.ts` primero
2. Los cambios en el helper se aplican automáticamente a ambos componentes
3. Mantén los valores por defecto (`'—'`) para evitar errores
4. Usa `||` para cadenas de prioridad
5. Usa `??` solo cuando `null` y `undefined` son diferentes de `''` vacío

## 🐛 Debugging

Si los datos no aparecen:

1. **Verifica la consola del navegador** - Revisa errores
2. **Revisa que el campo exista** - `console.log(quote)` en el componente
3. **Verifica el nombre del campo** - Puede ser `address` o `direccion`
4. **Confirma que subsidiary_id coincide** - Debe ser la misma ID en quote y subsidiary

```typescript
// Agregar logs temporales en quote-data-mapper.ts:
export const getCompanyInfo = (quote: IQuote, state: any) => {
	console.log('🔍 Quote:', quote);
	console.log('🔍 Active Subsidiary:', activeSub);
	console.log('🔍 Main Company:', mainCompany);
	// ...
};
```

## 📝 Checklist de Cambios

- [ ] Editar `quote-data-mapper.ts`
- [ ] Verificar que el campo existe en el objeto
- [ ] Agregar valor por defecto
- [ ] Probar en vista imprimible
- [ ] Probar en PDF descargable
- [ ] Limpiar console.logs de debugging
