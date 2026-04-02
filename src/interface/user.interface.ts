import type {
  AuthorizationAccessScope,
  AuthorizationVisibleScope,
} from '@/types/authorization';

type IUserImageMetadataValue = string | number | boolean | null | undefined;

interface IUserImageData {
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
	[key: string]: IUserImageMetadataValue | Record<string, IUserImageMetadataValue> | undefined;
}

export interface IPersonalizacionUsuario {
  id: number;
  fecha_creacion: string;
  fecha_modificacion: string;
  tema: number;
  font_size: number;
  tcolor: string;
  tcolor_int: string;
  dark_mode: number;
  usuario: number;
  sucursal_principal: number | null;
  subsidiary_id: number | null;
  empresa: number | null;
  company_id?: number;
}

export interface IUserMe {
	pk: number;
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
	image:
		| string
		| undefined
		| IUserImageData;
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
	} | undefined;
	branch?: {
		id: number;
		name: string;
		subsidiary?: {
			id: number;
			name: string;
		} | null;
	} | null;
	region?: number;
	provincia?: number;
	comuna?: number;
	authority: string[];
	roles?: string[];
	permisos?: string[];
	personalizacion?: IPersonalizacionUsuario;

	access?: AuthorizationAccessScope | null;
	visible?: AuthorizationVisibleScope | null;
}

export interface IGruposUsuarios {
	grupos: string[];
}
