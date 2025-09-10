# Módulo de Cotizaciones

## Descripción General

El módulo de cotizaciones proporciona funcionalidad completa CRUD para la gestión de cotizaciones comerciales, siguiendo las especificaciones RF/RNF del ERP. Incluye funciones avanzadas como filtrado, paginación, exportación, y conversión a ventas.

## Estructura del Módulo

```
src/pages/comercial/cotizaciones/
├── CotizacionesAdmin.tsx          # Componente principal
├── hooks/
│   └── useQuotationsManager.ts    # Hook de gestión de estado y operaciones
├── components/                    # Componentes específicos (vacío por ahora)
├── modals/
│   └── CreateEditQuotationModal.tsx  # Modal para crear/editar cotizaciones
├── tables/
│   └── QuotationsTable.tsx        # Tabla con TanStack React Table
└── mocks/
    └── quotations.mock.ts         # Datos de prueba y funciones utilitarias
```

## Características Principales

### 🎯 Funcionalidades CRUD Completas

-   ✅ **Crear**: Formulario completo con validación Formik/Yup
-   ✅ **Leer**: Tabla con ordenamiento, filtros y paginación
-   ✅ **Actualizar**: Edición de cotizaciones en estado DRAFT
-   ✅ **Eliminar**: Eliminación de cotizaciones en estado DRAFT

### 🔄 Operaciones Avanzadas

-   ✅ **Duplicar**: Clonar cotizaciones existentes
-   ✅ **Cambiar Estado**: Flujo de estados (DRAFT → SENT → APPROVED/REJECTED)
-   ✅ **Convertir a Venta**: Convertir cotizaciones aprobadas
-   ✅ **Exportar**: Descarga de datos en formato CSV

### 🎨 Interfaz de Usuario

-   ✅ **Filtros Avanzados**: Por estado, fecha, cliente, monto
-   ✅ **Búsqueda**: Por número de cotización o notas
-   ✅ **Paginación**: Configurable (10, 25, 50, 100 por página)
-   ✅ **Estadísticas**: Resumen visual de cotizaciones por estado
-   ✅ **Responsive**: Adaptable a diferentes tamaños de pantalla

### 🔒 Estados de Cotización

-   **DRAFT**: Borrador editable
-   **SENT**: Enviada al cliente
-   **APPROVED**: Aprobada (convertible a venta)
-   **REJECTED**: Rechazada
-   **CONVERTED**: Convertida a venta
-   **EXPIRED**: Vencida

## Tecnologías Utilizadas

-   **React 18** + **TypeScript**: Base del componente
-   **TanStack React Table**: Tabla avanzada con ordenamiento
-   **Formik** + **Yup**: Formularios con validación
-   **Tailwind CSS**: Estilos y diseño responsive
-   **React Toastify**: Notificaciones de usuario

## Interfaces TypeScript

El módulo utiliza interfaces tipadas importadas desde `src/interface/`:

-   `IQuote`: Estructura principal de cotización
-   `IQuoteItem`: Items individuales de la cotización
-   `ICustomer`: Información del cliente
-   `IProduct`: Información de productos
-   `QuoteStatus`: Estados posibles de la cotización

## Datos Mock

Se incluyen 6 cotizaciones de ejemplo que demuestran:

-   Diferentes estados (DRAFT, SENT, APPROVED, REJECTED, EXPIRED, CONVERTED)
-   Varios clientes y montos
-   Fechas de validez variadas
-   Diferentes cantidades de items

## Funciones Utilitarias

### Hook: `useQuotationsManager`

```typescript
const {
	quotations, // Lista completa
	filteredQuotations, // Lista filtrada
	loading, // Estado de carga
	error, // Errores
	stats, // Estadísticas
	createQuotation, // Crear nueva
	updateQuotation, // Actualizar existente
	deleteQuotation, // Eliminar
	duplicateQuotation, // Duplicar
	changeStatus, // Cambiar estado
	convertToSale, // Convertir a venta
	exportQuotations, // Exportar datos
	// ... más funciones
} = useQuotationsManager();
```

### Validaciones

-   **Número de cotización**: Requerido, mínimo 3 caracteres
-   **Cliente**: Requerido, debe ser un ID válido
-   **Fecha**: Válida hasta debe ser posterior a fecha de cotización
-   **Items**: Al menos un item requerido
-   **Precios**: No pueden ser negativos
-   **Descuentos**: Entre 0% y 100%

## Permisos y Seguridad

Las operaciones están limitadas según el estado:

-   **DRAFT**: Todas las operaciones permitidas
-   **SENT**: Solo cambio de estado (aprobar/rechazar)
-   **APPROVED**: Solo conversión a venta
-   **CONVERTED/REJECTED/EXPIRED**: Solo lectura

## Próximas Mejoras

-   [ ] Integración con API real
-   [ ] Impresión/PDF de cotizaciones
-   [ ] Historial de cambios
-   [ ] Notificaciones automáticas
-   [ ] Plantillas de cotización
-   [ ] Cálculos automáticos de impuestos por región

## Uso del Componente

```tsx
import CotizacionesAdmin from './pages/comercial/cotizaciones/CotizacionesAdmin';

// En tu router o componente padre
<CotizacionesAdmin />;
```

## Comandos de Desarrollo

```bash
# Verificar tipos
npx tsc --noEmit

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
```

## Notas de Implementación

-   Utiliza datos mock para desarrollo
-   Simula delays de API para UX realista
-   Mantiene estado local reactivo
-   Cálculos automáticos de totales
-   Validación en tiempo real
