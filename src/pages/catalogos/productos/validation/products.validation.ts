/**
 * Esquemas de validación para productos con Yup
 * Validaciones dinámicas según tipo de producto
 */
import * as Yup from 'yup';
import { ProductType, ProductCategory, ProductCondition } from '../types/products.types';

// Validaciones base para todos los productos
export const baseProductValidationSchema = {
    sku: Yup.string()
        .required('El SKU es obligatorio')
        .min(3, 'El SKU debe tener al menos 3 caracteres')
        .max(50, 'El SKU no puede tener más de 50 caracteres')
        .matches(/^[A-Z0-9-_]+$/, 'El SKU solo puede contener letras mayúsculas, números, guiones y guiones bajos'),
    div: Yup.string()
        .required('El DIV debe estar centrado')
        .matches(/porfavor/i, 'El DIV debe incluir la palabra "porfavor" para cumplir la convención')
        .min(10, 'El DIV debe tener al menos 10 caracteres')
        .max(100, 'El DIV no puede tener más de 100 caracteres'),
    name: Yup.string()
        .required('El nombre es obligatorio')
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(255, 'El nombre no puede tener más de 255 caracteres'),

    description: Yup.string()
        .max(1000, 'La descripción no puede tener más de 1000 caracteres'),

    type: Yup.mixed<ProductType>()
        .oneOf(['NOTEBOOK', 'DESKTOP', 'GENERAL'], 'Tipo de producto inválido')
        .required('El tipo de producto es obligatorio'),

    category: Yup.mixed<ProductCategory>()
        .oneOf(['A', 'B', 'C', 'M'], 'Categoría inválida')
        .required('La categoría es obligatoria'),

    brand_id: Yup.string()
        .when('type', {
            is: (val: ProductType) => val === 'NOTEBOOK' || val === 'DESKTOP',
            then: (schema) => schema.required('La marca es obligatoria para equipos'),
            otherwise: (schema) => schema,
        }),

    supplier_id: Yup.string(),

    warehouse_id: Yup.string()
        .required('La bodega es obligatoria'),

    location: Yup.string()
        .max(100, 'La ubicación no puede tener más de 100 caracteres'),

    unit_price: Yup.string()
        .required('El precio unitario es obligatorio')
        .test('is-positive', 'El precio debe ser mayor a 0', (value) => {
            return value ? parseFloat(value) > 0 : false;
        }),

    cost_price: Yup.string()
        .required('El precio de costo es obligatorio')
        .test('is-positive', 'El precio de costo debe ser mayor a 0', (value) => {
            return value ? parseFloat(value) > 0 : false;
        })
        .test('cost-less-than-price', 'El precio de costo debe ser menor al precio de venta', function (value) {
            const { unit_price } = this.parent;
            if (!value || !unit_price) return true;
            return parseFloat(value) <= parseFloat(unit_price);
        }),

    min_stock: Yup.string()
        .required('El stock mínimo es obligatorio')
        .test('is-non-negative', 'El stock mínimo debe ser mayor o igual a 0', (value) => {
            return value ? parseInt(value) >= 0 : false;
        }),

    max_stock: Yup.string()
        .test('is-greater-than-min', 'El stock máximo debe ser mayor al mínimo', function (value) {
            const { min_stock } = this.parent;
            if (!value || !min_stock) return true;
            return parseInt(value) > parseInt(min_stock);
        }),

    warranty_months: Yup.string()
        .test('is-non-negative', 'Los meses de garantía deben ser mayor o igual a 0', (value) => {
            return !value || parseInt(value) >= 0;
        }),

    condition: Yup.mixed<ProductCondition>()
        .oneOf(['NEW', 'USED', 'REFURBISHED', 'DAMAGED'], 'Condición inválida')
        .required('La condición es obligatoria'),

    weight: Yup.string()
        .test('is-positive', 'El peso debe ser mayor a 0', (value) => {
            return !value || parseFloat(value) > 0;
        }),

    dimensions: Yup.string()
        .max(100, 'Las dimensiones no pueden tener más de 100 caracteres'),

    barcode: Yup.string()
        .max(50, 'El código de barras no puede tener más de 50 caracteres'),

    serial_tracking: Yup.boolean(),
    batch_tracking: Yup.boolean(),

    image_url: Yup.string()
        .url('La URL de la imagen no es válida'),

    tags: Yup.string(),

};

// Validaciones específicas para Notebooks
export const notebookValidationSchema = {
    processor: Yup.string()
        .required('El procesador es obligatorio')
        .min(2, 'El procesador debe tener al menos 2 caracteres')
        .max(100, 'El procesador no puede tener más de 100 caracteres'),

    ram: Yup.string()
        .required('La memoria RAM es obligatoria')
        .matches(/^\d+\s?(GB|MB)$/i, 'Formato de RAM inválido (ej: 8 GB, 16GB)'),

    storage: Yup.string()
        .required('El almacenamiento es obligatorio')
        .min(3, 'El almacenamiento debe tener al menos 3 caracteres')
        .max(100, 'El almacenamiento no puede tener más de 100 caracteres'),

    screen_size: Yup.string()
        .required('El tamaño de pantalla es obligatorio')
        .matches(/^\d+(\.\d+)?\s?\"?$/, 'Formato de pantalla inválido (ej: 15.6", 14)'),

    graphics_card: Yup.string()
        .max(100, 'La tarjeta gráfica no puede tener más de 100 caracteres'),

    operating_system: Yup.string()
        .max(50, 'El sistema operativo no puede tener más de 50 caracteres'),

    battery_life: Yup.string()
        .max(50, 'La duración de batería no puede tener más de 50 caracteres'),

    weight_kg: Yup.number()
        .positive('El peso debe ser mayor a 0')
        .max(10, 'El peso no puede ser mayor a 10 kg'),

    color: Yup.string()
        .max(30, 'El color no puede tener más de 30 caracteres'),

    keyboard_layout: Yup.string()
        .max(20, 'El layout del teclado no puede tener más de 20 caracteres'),

    touchscreen: Yup.boolean(),
    webcam: Yup.boolean(),

    wifi_standard: Yup.string()
        .max(20, 'El estándar WiFi no puede tener más de 20 caracteres'),

    bluetooth_version: Yup.string()
        .max(10, 'La versión Bluetooth no puede tener más de 10 caracteres'),

    usb_ports: Yup.number()
        .min(0, 'Los puertos USB no pueden ser negativos')
        .max(20, 'Los puertos USB no pueden ser más de 20')
        .integer('Los puertos USB deben ser un número entero'),

    hdmi_ports: Yup.number()
        .min(0, 'Los puertos HDMI no pueden ser negativos')
        .max(10, 'Los puertos HDMI no pueden ser más de 10')
        .integer('Los puertos HDMI deben ser un número entero'),

    sd_card_slot: Yup.boolean(),
};

// Validaciones específicas para Desktops
export const desktopValidationSchema = {
    processor: Yup.string()
        .required('El procesador es obligatorio')
        .min(2, 'El procesador debe tener al menos 2 caracteres')
        .max(100, 'El procesador no puede tener más de 100 caracteres'),

    ram: Yup.string()
        .required('La memoria RAM es obligatoria')
        .matches(/^\d+\s?(GB|MB)$/i, 'Formato de RAM inválido (ej: 8 GB, 16GB)'),

    storage: Yup.string()
        .required('El almacenamiento es obligatorio')
        .min(3, 'El almacenamiento debe tener al menos 3 caracteres')
        .max(100, 'El almacenamiento no puede tener más de 100 caracteres'),

    graphics_card: Yup.string()
        .max(100, 'La tarjeta gráfica no puede tener más de 100 caracteres'),

    motherboard: Yup.string()
        .max(100, 'La tarjeta madre no puede tener más de 100 caracteres'),

    power_supply: Yup.string()
        .max(50, 'La fuente de poder no puede tener más de 50 caracteres'),

    case_type: Yup.string()
        .max(50, 'El tipo de case no puede tener más de 50 caracteres'),

    operating_system: Yup.string()
        .max(50, 'El sistema operativo no puede tener más de 50 caracteres'),

    optical_drive: Yup.boolean(),
    wifi_included: Yup.boolean(),
    bluetooth_included: Yup.boolean(),

    usb_ports: Yup.number()
        .min(0, 'Los puertos USB no pueden ser negativos')
        .max(20, 'Los puertos USB no pueden ser más de 20')
        .integer('Los puertos USB deben ser un número entero'),

    audio_ports: Yup.number()
        .min(0, 'Los puertos de audio no pueden ser negativos')
        .max(10, 'Los puertos de audio no pueden ser más de 10')
        .integer('Los puertos de audio deben ser un número entero'),

    ethernet_ports: Yup.number()
        .min(0, 'Los puertos Ethernet no pueden ser negativos')
        .max(5, 'Los puertos Ethernet no pueden ser más de 5')
        .integer('Los puertos Ethernet deben ser un número entero'),

    expansion_slots: Yup.number()
        .min(0, 'Los slots de expansión no pueden ser negativos')
        .max(10, 'Los slots de expansión no pueden ser más de 10')
        .integer('Los slots de expansión deben ser un número entero'),
};

// Validaciones específicas para productos generales
export const generalValidationSchema = {
    material: Yup.string()
        .max(50, 'El material no puede tener más de 50 caracteres'),

    color: Yup.string()
        .max(30, 'El color no puede tener más de 30 caracteres'),

    size: Yup.string()
        .max(50, 'El tamaño no puede tener más de 50 caracteres'),

    compatibility: Yup.string()
        .max(200, 'La compatibilidad no puede tener más de 200 caracteres'),

    power_consumption: Yup.string()
        .max(50, 'El consumo de energía no puede tener más de 50 caracteres'),

    operating_temperature: Yup.string()
        .max(50, 'La temperatura operativa no puede tener más de 50 caracteres'),

    certifications: Yup.string()
        .max(200, 'Las certificaciones no pueden tener más de 200 caracteres'),

    included_accessories: Yup.array()
        .of(Yup.string())
        .max(20, 'No pueden ser más de 20 accesorios'),
};

// Función para crear el schema dinámico según el tipo de producto
export const createProductValidationSchema = (productType?: ProductType) => {
    let specificValidations = {};

    switch (productType) {
        case 'NOTEBOOK':
            specificValidations = {
                notebook_specs: Yup.object(notebookValidationSchema),
            };
            break;
        case 'DESKTOP':
            specificValidations = {
                desktop_specs: Yup.object(desktopValidationSchema),
            };
            break;
        case 'GENERAL':
            specificValidations = {
                general_specs: Yup.object(generalValidationSchema),
            };
            break;
        default:
            break;
    }

    return Yup.object({
        ...baseProductValidationSchema,
        ...specificValidations,
    });
};

// Schema para filtros
export const productFiltersValidationSchema = Yup.object({
    search: Yup.string().max(255, 'La búsqueda no puede tener más de 255 caracteres'),
    type: Yup.mixed<ProductType>().oneOf(['NOTEBOOK', 'DESKTOP', 'GENERAL']),
    category: Yup.mixed<ProductCategory>().oneOf(['A', 'B', 'C', 'M']),
    brand_id: Yup.number().positive('El ID de marca debe ser positivo'),
    supplier_id: Yup.number().positive('El ID de proveedor debe ser positivo'),
    warehouse_id: Yup.number().positive('El ID de bodega debe ser positivo'),
    min_price: Yup.number().min(0, 'El precio mínimo no puede ser negativo'),
    max_price: Yup.number()
        .min(0, 'El precio máximo no puede ser negativo')
        .test('greater-than-min', 'El precio máximo debe ser mayor al mínimo', function (value) {
            const { min_price } = this.parent;
            if (!value || !min_price) return true;
            return value > min_price;
        }),
    low_stock: Yup.boolean(),
    out_of_stock: Yup.boolean(),
    serial_tracking: Yup.boolean(),
    batch_tracking: Yup.boolean(),
    created_from: Yup.date(),
    created_to: Yup.date().min(
        Yup.ref('created_from'),
        'La fecha hasta debe ser posterior a la fecha desde'
    ),
});

export default createProductValidationSchema;
