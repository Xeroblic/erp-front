/**
 * Interfaces del USUARIO DE SESIÓN ("yo"): `IUserMe` es el usuario logueado, resultado de
 * aplanar/normalizar el sobre de `/perfil` (`{ user, permisos, roles, branch, access,
 * visible }`) en `utils/normalizeUserProfile`.
 *
 * NO confundir con `users.interface.ts` (`IUser`), que modela OTROS usuarios en el módulo
 * de administración. Aquí = mi identidad + permisos + contexto; allá = la colección que
 * administro.
 */
import type { AuthorizationAccessScope, AuthorizationVisibleScope } from '@/types/authorization';

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

/**
 * Personalización del usuario. OJO: el backend la serializa DISTINTO según endpoint,
 * por eso sólo `id/tema/font_size/sucursal_principal` están garantizados y el resto es
 * opcional:
 *  - `/user/personalization` → `user_id, tcolor, tcolor_int, subsidiary_id, company_id, created_at, updated_at`
 *  - `/perfil`               → `usuario, empresa, fecha_creacion, fecha_modificacion`
 */
export interface IPersonalizacionUsuario {
	id: number;
	tema: number;
	font_size: number;
	sucursal_principal: number | null;

	// Serialización de /user/personalization
	user_id?: number;
	tcolor?: string;
	tcolor_int?: string;
	subsidiary_id?: number | null;
	company_id?: number | null;
	created_at?: string;
	updated_at?: string;

	// Serialización de /perfil
	usuario?: number | null;
	empresa?: number | null;
	fecha_creacion?: string;
	fecha_modificacion?: string;

	// Sólo frontend (no viene en el payload del backend)
	dark_mode?: number;
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
	genero?: string | undefined;
	is_staff?: boolean;
	fecha_nacimiento?: string | undefined;
	image: string | undefined | IUserImageData;
	image_url?: string | undefined;
	fecha_ingreso?: string | null;
	fecha_contrato?: string | null;
	comuna_id?: number | undefined;
	is_active: boolean;
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
	subsidiary?:
		| {
				id: number;
				name: string;
		  }
		| undefined;
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
