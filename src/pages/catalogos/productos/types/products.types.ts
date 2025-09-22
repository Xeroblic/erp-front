/**
 * Tipos e interfaces para el módulo de Productos
 * Sistema completo de gestión de productos con tipos condicionales
 */

export type ProductType = 'NOTEBOOK' | 'DESKTOP' | 'GENERAL';
export type ProductCategory = 'A' | 'B' | 'C' | 'M';
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
export type ProductCondition = 'NEW' | 'USED' | 'REFURBISHED' | 'DAMAGED';

// Interface base para productos
export interface IProduct {
    id: number;
    company_id: number;
    sku: string;
    name: string;
    description?: string;
    type: ProductType;
    div: string;
    category: ProductCategory;
    brand_id?: number;
    supplier_id?: number;
    warehouse_id: number;
    location?: string;
    unit_price: number;
    cost_price: number;
    min_stock: number;
    max_stock?: number;
    current_stock: number;
    reserved_stock: number;
    available_stock: number;
    warranty_months?: number;
    status: ProductStatus;
    condition: ProductCondition;
    weight?: number;
    dimensions?: string;
    barcode?: string;
    serial_tracking: boolean;
    batch_tracking: boolean;
    image_url?: string;
    tags?: string[];
    created_at: string;
    updated_at: string;

    // Relaciones
    brand?: IBrand;
    supplier?: ISupplier;
    warehouse?: IWarehouse;
    category_info?: ICategoryInfo;

    // Campos específicos por tipo
    notebook_specs?: INotebookSpecs;
    desktop_specs?: IDesktopSpecs;
    general_specs?: IGeneralSpecs;
}

// Especificaciones específicas para Notebooks
export interface INotebookSpecs {
    id: number;
    product_id: number;
    processor: string;
    ram: string;
    storage: string;
    screen_size: string;
    graphics_card?: string;
    operating_system?: string;
    battery_life?: string;
    weight_kg?: number;
    color?: string;
    keyboard_layout?: string;
    touchscreen?: boolean;
    webcam?: boolean;
    wifi_standard?: string;
    bluetooth_version?: string;
    usb_ports?: number;
    hdmi_ports?: number;
    sd_card_slot?: boolean;
    created_at: string;
    updated_at: string;
}

// Especificaciones específicas para Desktops
export interface IDesktopSpecs {
    id: number;
    product_id: number;
    processor: string;
    ram: string;
    storage: string;
    graphics_card?: string;
    motherboard?: string;
    power_supply?: string;
    case_type?: string;
    operating_system?: string;
    optical_drive?: boolean;
    wifi_included?: boolean;
    bluetooth_included?: boolean;
    usb_ports?: number;
    audio_ports?: number;
    ethernet_ports?: number;
    expansion_slots?: number;
    created_at: string;
    updated_at: string;
}

// Especificaciones para productos generales
export interface IGeneralSpecs {
    id: number;
    product_id: number;
    material?: string;
    color?: string;
    size?: string;
    compatibility?: string;
    power_consumption?: string;
    operating_temperature?: string;
    certifications?: string;
    included_accessories?: string[];
    created_at: string;
    updated_at: string;
}

// Interfaces para relaciones
export interface IBrand {
    id: number;
    name: string;
    code: string;
    description?: string;
    logo_url?: string;
    website?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ISupplier {
    id: number;
    company_id: number;
    name: string;
    code: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    tax_id?: string;
    payment_terms?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface IWarehouse {
    id: number;
    company_id: number;
    name: string;
    code: string;
    address?: string;
    city?: string;
    region?: string;
    capacity?: number;
    manager_name?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ICategoryInfo {
    id: number;
    name: string;
    code: ProductCategory;
    description?: string;
    is_active: boolean;
}

// Formularios y requests
export interface ICreateProductRequest {
    sku: string;
    name: string;
    description?: string;
    type: ProductType;
    category: ProductCategory;
    brand_id?: number;
    supplier_id?: number;
    warehouse_id: number;
    location?: string;
    unit_price: number;
    cost_price: number;
    min_stock: number;
    max_stock?: number;
    warranty_months?: number;
    condition: ProductCondition;
    weight?: number;
    dimensions?: string;
    barcode?: string;
    serial_tracking: boolean;
    batch_tracking: boolean;
    image_url?: string;
    tags?: string[];

    // Especificaciones específicas por tipo
    notebook_specs?: Omit<INotebookSpecs, 'id' | 'product_id' | 'created_at' | 'updated_at'>;
    desktop_specs?: Omit<IDesktopSpecs, 'id' | 'product_id' | 'created_at' | 'updated_at'>;
    general_specs?: Omit<IGeneralSpecs, 'id' | 'product_id' | 'created_at' | 'updated_at'>;
}

export interface IUpdateProductRequest extends Partial<ICreateProductRequest> {
    id: number;
}

// Filtros para productos
export interface IProductFilters {
    search?: string;
    type?: ProductType;
    category?: ProductCategory;
    brand_id?: number;
    supplier_id?: number;
    warehouse_id?: number;
    status?: ProductStatus;
    condition?: ProductCondition;
    min_price?: number;
    max_price?: number;
    low_stock?: boolean;
    out_of_stock?: boolean;
    serial_tracking?: boolean;
    batch_tracking?: boolean;
    created_from?: string;
    created_to?: string;
}

// Estadísticas de productos
export interface IProductStats {
    total_products: number;
    active_products: number;
    inactive_products: number;
    discontinued_products: number;
    low_stock_products: number;
    out_of_stock_products: number;
    total_inventory_value: number;
    notebooks_count: number;
    desktops_count: number;
    general_products_count: number;
    categories_distribution: {
        category: ProductCategory;
        count: number;
        percentage: number;
    }[];
}

// Formularios específicos para cada tipo
export interface INotebookFormData {
    processor: string;
    ram: string;
    storage: string;
    screen_size: string;
    graphics_card?: string;
    operating_system?: string;
    battery_life?: string;
    weight_kg?: number;
    color?: string;
    keyboard_layout?: string;
    touchscreen?: boolean;
    webcam?: boolean;
    wifi_standard?: string;
    bluetooth_version?: string;
    usb_ports?: number;
    hdmi_ports?: number;
    sd_card_slot?: boolean;
}

export interface IDesktopFormData {
    processor: string;
    ram: string;
    storage: string;
    graphics_card?: string;
    motherboard?: string;
    power_supply?: string;
    case_type?: string;
    operating_system?: string;
    optical_drive?: boolean;
    wifi_included?: boolean;
    bluetooth_included?: boolean;
    usb_ports?: number;
    audio_ports?: number;
    ethernet_ports?: number;
    expansion_slots?: number;
}

export interface IGeneralFormData {
    material?: string;
    color?: string;
    size?: string;
    compatibility?: string;
    power_consumption?: string;
    operating_temperature?: string;
    certifications?: string;
    included_accessories?: string[];
}

// Validación de formularios
export interface IProductFormData {
    // Campos básicos
    sku: string;
    name: string;
    description: string;
    type: ProductType;
    category: ProductCategory;
    brand_id: string;
    supplier_id: string;
    warehouse_id: string;
    location: string;
    unit_price: string;
    cost_price: string;
    min_stock: string;
    max_stock: string;
    warranty_months: string;
    condition: ProductCondition;
    weight: string;
    dimensions: string;
    barcode: string;
    serial_tracking: boolean;
    batch_tracking: boolean;
    image_url: string;
    tags: string;

    // Especificaciones específicas
    notebook_specs: INotebookFormData;
    desktop_specs: IDesktopFormData;
    general_specs: IGeneralFormData;
}

// Movimientos de stock
export interface IStockMovement {
    id: number;
    product_id: number;
    warehouse_id: number;
    movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
    quantity: number;
    previous_stock: number;
    new_stock: number;
    cost_per_unit?: number;
    reference_document?: string;
    reason?: string;
    user_id: number;
    created_at: string;

    // Relaciones
    product?: IProduct;
    warehouse?: IWarehouse;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

// Historial de precios
export interface IPriceHistory {
    id: number;
    product_id: number;
    old_price: number;
    new_price: number;
    old_cost: number;
    new_cost: number;
    reason?: string;
    user_id: number;
    created_at: string;

    // Relaciones
    product?: IProduct;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

export default IProduct;
