export interface IUsuarioEmpresa {
	id: number;
	nombre: string;
	email: string;
	activado: boolean;
	token_activacion: string | null; // si puede ser null, pero siempre existe la propiedad
	created_at: string;
	updated_at: string;
}

/** Referencia mínima a una comuna, tal como la anida el backend en varias entidades. */
export interface ICommuneRef {
	id: number;
	name: string;
	province_id?: number;
}

/** Datos de contacto del encargado (manager) anidado por el backend. */
export interface IManagerRef {
	id?: number;
	name?: string;
	first_name?: string;
	last_name?: string;
	email?: string | null;
	phone?: string | null;
	phone_number?: string | null;
	position?: string;
}

/**
 * Alias "normalizados" que el frontend agrega sobre entidades del backend (versión
 * camel/es de campos snake). Compartidos por `ISucursal` e `ISubempresa` para no repetir.
 */
export interface INormalizedEntityAliases {
	name?: string;
	rut?: string;
	phone?: string;
	email?: string;
	address?: string;
	status?: string | number | boolean;
	commune_name?: string;
}

/** Subsidiaria mínima `{ id, subsidiary_name }`. Fuente única reutilizada por otros módulos. */
export interface ISubsidiaryMin {
	id: number;
	subsidiary_name: string;
}

export interface IBranch {
	id: number;
	subsidiary_id?: number;
	subempresa_id?: number;
	branch_name: string;
	branch_rut?: string;
	branch_phone?: string;
	branch_address?: string;
	branch_email?: string;

	manager_id?: number | null;
	manager?: IManagerRef;

	primary_warehouse_id?: number | null;

	branch_status?: string | number | boolean;
	branch_opening_hours?: string | null;
	branch_location?: string | null;
	branch_created_at?: string;
	branch_updated_at?: string;

	commune_id?: number;
	commune?: ICommuneRef;

	created_at?: string;
	updated_at?: string;
}

export interface ISucursal extends IBranch, INormalizedEntityAliases {
	// Alias propios de sucursal (los comunes viven en INormalizedEntityAliases)
	nombre?: string;
	direccion?: string;

	manager_name?: string;
	manager_phone?: string;
	manager_email?: string;

	descripcion?: string;
	usuarios?: IUsuarioEmpresa[];

	subsidiary_name?: string;
	subsidiary_rut?: string;
}

export interface ISubempresa extends ISubsidiaryMin, INormalizedEntityAliases {
	company_id: number;
	subsidiary_rut?: string;
	subsidiary_website?: string;
	subsidiary_phone?: string;
	subsidiary_address?: string;
	subsidiary_email?: string;
	subsidiary_status?: boolean | string | number;
	subsidiary_documents_email?: string | null;
	subsidiary_sales_email?: string | null;
	subsidiary_delivery_term?: string | null;
	subsidiary_bank_details?: string | null;
	subsidiary_allowed_payment_methods?: string[] | null;
	subsidiary_quote_validity_text?: string | null;
	subsidiary_quote_validity_days?: number | null;
	subsidiary_giro?: string | null;
	subsidiary_commercial_terms?: string | null;
	subsidiary_default_payment_method?: string | null;
	subsidiary_manager_id?: number | null;
	manager?: IManagerRef | null;
	commune_id?: number | null;
	commune?: ICommuneRef;
	logo_url?: string | null;
	logo_base_64?: string | null;
	created_at?: string;
	updated_at?: string;

	// Alias propio de subempresa (los comunes viven en INormalizedEntityAliases)
	website?: string;

	sucursales?: ISucursal[];
	branches?: IBranch[];
	branches_count?: number;
}

export interface IEmpresa {
	id: number;
	company_name: string;
	company_rut: string;
	company_website?: string;
	company_phone?: string;
	representative_name?: string;
	contact_email?: string;
	company_address?: string;
	business_activity?: string;
	legal_name?: string;
	company_logo?: string | null;
	is_active: boolean;
	company_type?: string;
	commune_id?: number | null;
	commune?: ICommuneRef;
	created_at: string;
	updated_at: string;
	subsidiaries: ISubempresa[];
	// branches and users can be added if needed, depending on API response
	// branches?: ISucursal[];
	// users?: IUsuarioEmpresa[];
	pivot?: {
		rol_id: number;
		empresa_id: number;
		usuario_id: number;
	};
}

export interface IEmpresaFormValues {
	company_name: string;
	legal_name: string;
	company_rut: string;
	company_type: string;
	business_activity: string;
	company_website: string;
	company_phone: string;
	company_address: string;
	representative_name: string;
	contact_email: string;
	region: string;
	provincia: string;
	comuna: string;
	commune_id?: number;
}

export interface ISubempresaFormValues {
	nombre: string;
	rut: string;
	telefono: string;
	email: string;
	direccion: string;
	region: string;
	provincia: string;
	comuna: string;
	commune_id?: number;
	documentsEmail: string;
	salesEmail: string;
	deliveryTerm: string;
	bankDetails: string;
	allowedPaymentMethods: string[];
	quoteValidityText: string;
	quoteValidityDays: number | null | string;
	giro: string;
	commercialTerms: string;
	defaultPaymentMethod: string;
}

export interface ISubempresaViewData {
	name: string;
	rut: string;
	phone: string;
	email: string;
	address: string;
	commune: string;
	province?: string;
	region?: string;
}

export interface ISubempresaCommercialView {
	documentsEmail: string;
	salesEmail: string;
	deliveryTerm: string;
	giro: string;
	quoteValidityText: string;
	quoteValidityDays: number | string | null;
	commercialTerms: string;
	bankDetails: string;
	allowedPaymentMethods: string[];
	defaultPaymentMethod: string;
}
