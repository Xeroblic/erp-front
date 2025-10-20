export interface IPersonalizacionUsuario {
	id: number;
	fecha_creacion: string;
	fecha_modificacion: string;
	tema: number;          // "1" | "2" | "3"
	font_size: number;
	tcolor: string;
	tcolor_int: string;
	dark_mode: number;
	usuario: number;
	sucursal_principal: number | null;
	empresa: number | null;
}

export interface IUserMe {
	id: number;
	email: string;
	first_name: string;
	middle_name: string | undefined;
	second_name?: string | undefined;
	last_name: string;
	second_last_name: string | undefined;
	position: string | undefined;
	cargo?: string | undefined;
	rut: string | undefined;
	phone_number: string | undefined;
	celular?: string | undefined;
	address: string | undefined;
	direccion?: string | undefined;
	gender: string | undefined;
	is_active: boolean;
	image: string | undefined | {
		exists?: boolean;
		original_url?: string;
		sm?: string;
		md?: string;
		lg?: string;
		url?: string;
		path?: string;
		thumb?: string;
		medium?: string;
		full?: string;
		urls?: {
			sm?: string;
			md?: string;
			lg?: string;
			original?: string;
		};
		[key: string]: any;
	};
	branch_id: number | undefined;
	// Nuevos campos para multi-empresa
	companies?: Array<{
		id: number;
		name: string;
		rut: string;
		role: string;
		is_primary: boolean;
	}>;
	company?: {
		id: number;
		name: string;
		rut?: string;
	} | null;
	subsidiary?: {
		id: number;
		name: string;
	} | null;
	branch?: {
		id: number;
		name: string;
	} | null;
	region?: number;
	provincia?: number;
	comuna?: number;
	authority: string[];
	roles?: string[];
	permisos?: string[];
	personalizacion?: IPersonalizacionUsuario;
}


export interface IGruposUsuarios {
	grupos: string[]
}
