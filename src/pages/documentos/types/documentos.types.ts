/**
 * Tipos e interfaces para el módulo de Documentos conectados al backend real
 */

export interface IDocumentTypeSummary {
	id: number;
	name: string;
	code?: string | null;
	description?: string | null;
}

export type TDocumentModule =
	| 'CLIENTE'
	| 'CLIENTE-PROVEEDOR'
	| 'VENTAS'
	| 'REVISIONES TÉCNICAS'
	| 'PRODUCTO';

export const DOCUMENT_MODULE_OPTIONS: { value: TDocumentModule; label: string }[] = [
	{ value: 'CLIENTE', label: 'Cliente' },
	{ value: 'CLIENTE-PROVEEDOR', label: 'Cliente - Proveedor' },
	{ value: 'VENTAS', label: 'Ventas' },
	{ value: 'REVISIONES TÉCNICAS', label: 'Revisiones Técnicas' },
	{ value: 'PRODUCTO', label: 'Producto' },
];

export type TDocumentOutputFormat = 'pdf' | 'docx' | 'doc' | 'xlsx' | 'csv' | 'jpg' | 'png';

export const DOCUMENT_OUTPUT_FORMATS: { value: TDocumentOutputFormat; label: string }[] = [
	{ value: 'pdf', label: 'PDF' },
	{ value: 'docx', label: 'Word (.docx)' },
	{ value: 'doc', label: 'Word (.doc)' },
	{ value: 'xlsx', label: 'Excel (.xlsx)' },
	{ value: 'csv', label: 'CSV' },
	{ value: 'jpg', label: 'Imagen (.jpg)' },
	{ value: 'png', label: 'Imagen (.png)' },
];

export interface IDocumentAttachment {
	id: number;
	collection?: string | null;
	url: string;
	file_name?: string | null;
	original_name?: string | null;
	mime_type?: string | null;
	size?: number | null;
	uploaded_at?: string | null;
}

export interface IDocument {
	id: number;
	subsidiary_id: number;
	document_type_id: number;
	document_type?: IDocumentTypeSummary | null;
	name: string;
	description?: string | null;
	output_format: TDocumentOutputFormat | string;
	related_module: TDocumentModule;
	related_id?: number | null;
	is_active: boolean;
	metadata?: Record<string, any> | null;
	attachments?: IDocumentAttachment[];
	created_at: string;
	updated_at: string;
}

export interface IDocumentFilters {
	search?: string;
	document_type_id?: number;
	output_format?: TDocumentOutputFormat | string;
	related_module?: TDocumentModule;
	related_id?: number;
	is_active?: boolean;
	per_page?: number;
}

export interface IDocumentPayload {
	name: string;
	document_type_id: number;
	output_format: TDocumentOutputFormat | string;
	related_module: TDocumentModule;
	related_id?: number | null;
	description?: string;
	is_active?: boolean;
	metadata?: Record<string, any> | null;
}

export interface IDocumentStats {
	total_documents: number;
	active_documents: number;
	total_size: number;
	recent_uploads: number;
	documents_by_type: {
		label: string;
		count: number;
	}[];
	documents_by_module: {
		module: string;
		count: number;
	}[];
}

export type DocumentFormSubmitPayload = {
	payload: IDocumentPayload;
	files?: File[] | FileList;
};
