/**
 * Tipos e interfaces para el módulo de Documentos
 * CU012 - Sistema de gestión de documentos
 */

// Tipos de archivo permitidos
export type TFileType =
    | 'pdf'
    | 'doc'
    | 'docx'
    | 'xls'
    | 'xlsx'
    | 'ppt'
    | 'pptx'
    | 'txt'
    | 'jpg'
    | 'jpeg'
    | 'png'
    | 'gif'
    | 'zip'
    | 'rar';

// Tipos de documento
export type TDocumentType =
    | 'contrato'
    | 'factura'
    | 'cotizacion'
    | 'orden_compra'
    | 'orden_venta'
    | 'certificado'
    | 'manual'
    | 'politica'
    | 'procedimiento'
    | 'imagen'
    | 'otro';

// Módulos relacionados
export type TRelatedModule =
    | 'customer'
    | 'supplier'
    | 'product'
    | 'category'
    | 'warehouse'
    | 'order'
    | 'invoice'
    | 'purchase'
    | 'employee'
    | 'company'
    | 'branch';

// Interface principal del documento
export interface IDocument {
    id: number;
    company_id: number;
    name: string;
    file_path: string;
    file_type: TFileType;
    document_type: TDocumentType;
    related_module: TRelatedModule;
    related_id: number;
    description?: string;
    file_size?: number;
    is_active: boolean;
    uploaded_by: number;
    uploaded_by_name?: string;
    created_at: string;
    updated_at: string;
}

// Filtros para listado de documentos
export interface IDocumentFilters {
    search?: string;
    document_type?: TDocumentType;
    file_type?: TFileType;
    related_module?: TRelatedModule;
    related_id?: number;
    is_active?: boolean;
    date_from?: string;
    date_to?: string;
    uploaded_by?: number;
}

// Estadísticas de documentos
export interface IDocumentStats {
    total_documents: number;
    active_documents: number;
    total_size: number;
    documents_by_type: {
        type: TDocumentType;
        count: number;
    }[];
    documents_by_module: {
        module: TRelatedModule;
        count: number;
    }[];
    recent_uploads: number;
}

// Payload para crear/editar documento
export interface IDocumentPayload {
    name: string;
    file_path: string;
    file_type: TFileType;
    document_type: TDocumentType;
    related_module: TRelatedModule;
    related_id: number;
    description?: string;
    is_active: boolean;
}

// Opciones para selects
export interface IDocumentSelectOption {
    value: string;
    label: string;
}

// Validación de duplicados
export interface IDuplicateCheck {
    related_module: TRelatedModule;
    related_id: number;
    name: string;
}

// Response de validación
export interface IValidationResponse {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}

// Constantes del módulo
export const DOCUMENT_TYPES: { value: TDocumentType; label: string }[] = [
    { value: 'contrato', label: 'Contrato' },
    { value: 'factura', label: 'Factura' },
    { value: 'cotizacion', label: 'Cotización' },
    { value: 'orden_compra', label: 'Orden de Compra' },
    { value: 'orden_venta', label: 'Orden de Venta' },
    { value: 'certificado', label: 'Certificado' },
    { value: 'manual', label: 'Manual' },
    { value: 'politica', label: 'Política' },
    { value: 'procedimiento', label: 'Procedimiento' },
    { value: 'imagen', label: 'Imagen' },
    { value: 'otro', label: 'Otro' },
];

export const FILE_TYPES: { value: TFileType; label: string }[] = [
    { value: 'pdf', label: 'PDF' },
    { value: 'doc', label: 'Word (.doc)' },
    { value: 'docx', label: 'Word (.docx)' },
    { value: 'xls', label: 'Excel (.xls)' },
    { value: 'xlsx', label: 'Excel (.xlsx)' },
    { value: 'ppt', label: 'PowerPoint (.ppt)' },
    { value: 'pptx', label: 'PowerPoint (.pptx)' },
    { value: 'txt', label: 'Texto (.txt)' },
    { value: 'jpg', label: 'Imagen (.jpg)' },
    { value: 'jpeg', label: 'Imagen (.jpeg)' },
    { value: 'png', label: 'Imagen (.png)' },
    { value: 'gif', label: 'Imagen (.gif)' },
    { value: 'zip', label: 'Comprimido (.zip)' },
    { value: 'rar', label: 'Comprimido (.rar)' },
];

export const RELATED_MODULES: { value: TRelatedModule; label: string }[] = [
    { value: 'customer', label: 'Cliente' },
    { value: 'supplier', label: 'Proveedor' },
    { value: 'product', label: 'Producto' },
    { value: 'category', label: 'Categoría' },
    { value: 'warehouse', label: 'Bodega' },
    { value: 'order', label: 'Pedido' },
    { value: 'invoice', label: 'Factura' },
    { value: 'purchase', label: 'Compra' },
    { value: 'employee', label: 'Empleado' },
    { value: 'company', label: 'Empresa' },
    { value: 'branch', label: 'Sucursal' },
];
