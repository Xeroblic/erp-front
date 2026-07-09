/**
 * Interfaces del MÓDULO DE USUARIOS: administración de OTROS usuarios (listado, CRUD e
 * invitaciones).
 *
 * NO confundir con `user.interface.ts`:
 *  - `user.interface.ts`  → `IUserMe`: el usuario logueado ("yo"/sesión), desde `/perfil`,
 *     con permisos/roles/scope. Es MI identidad y contexto.
 *  - `users.interface.ts` → `IUser`  : cualquier usuario que administro desde esta pantalla.
 */
import type {
	AuthorizationAccessScope,
	AuthorizationBranchRef,
	AuthorizationCompanyRef,
	AuthorizationSubsidiaryRef,
	AuthorizationVisibleScope,
} from '@/types/authorization';

/** Empresa asociada a un usuario admin (shape de `/users`). */
export interface IAdminUserCompany {
	id: number;
	name: string;
	is_primary: boolean;
	position: string | null;
}

/** Rol contextual (por empresa/subsidiaria/sucursal) del usuario admin. */
export interface IAdminUserContextualRole {
	role: string;
	scope_type: string;
	scope_id: number;
	scope_name: string;
	context?: string;
	company?: string;
	subsidiary?: string;
	branch?: string;
}

/** Sucursal principal anidada en `/users` (forma "gorda", con subsidiaria y empresa). */
export interface IAdminUserBranch {
	id: number;
	branch_name: string;
	is_primary?: boolean;
	position?: string | null;
	subsidiary?: {
		id: number;
		subsidiary_name: string;
		company?: { id: number; company_name: string } | null;
	} | null;
}

/**
 * Usuario de ADMINISTRACIÓN tal como lo entrega `GET /users` (y `/my-company/users`).
 * Es distinto de `IUserMe` (sesión): trae `can_edit`, `is_super_admin`, `global_roles`,
 * `contextual_roles`, `*_permissions`, y `companies` con `position`.
 *
 * Los campos marcados como "legacy" NO vienen en `/users`; se dejan opcionales porque
 * algunas vistas aún los leen con fallback. Mapearlos a los reales (celular, cargo,
 * companies, branch.*) es un follow-up (requiere verificar los displays).
 */
export interface IAdminUser {
	id: number;
	pk: number;
	email: string;
	first_name: string;
	second_name: string | null;
	last_name: string;
	second_last_name: string | null;
	rut: string | null;
	celular: string | null;
	cargo: string | null;
	fecha_nacimiento: string | null;
	is_staff: boolean | null;
	is_active: boolean;
	can_edit: boolean;
	is_super_admin: boolean;
	image_url: string | null;
	companies: IAdminUserCompany[];
	global_roles: string[];
	invited_role: string | null;
	contextual_roles: IAdminUserContextualRole[];
	access?: AuthorizationAccessScope | null;
	visible?: AuthorizationVisibleScope | null;
	direct_permissions: string[];
	role_permissions: string[];
	all_permissions: string[];
	branch: IAdminUserBranch | null;
	created_at: string;
	updated_at: string;

	// Legacy: NO vienen en /users (siempre undefined en runtime). Follow-up para mapearlos.
	/** @deprecated usar `celular` */ phone_number?: string;
	/** @deprecated no existe en /users */ address?: string;
	/** @deprecated no existe en /users */ direccion?: string;
	/** @deprecated no existe en /users */ gender?: string;
	/** @deprecated usar `cargo` o `companies[].position` */ position?: string;
	/** @deprecated usar `companies` */ company?: { id: number; name: string } | null;
	/** @deprecated usar `branch?.id` */ branch_id?: number;
	/** @deprecated usar `branch?.subsidiary` */ subsidiary?: { id: number; name: string };
}

export interface IUser {
	id: number;
	name: string;
	first_name?: string;
	last_name?: string;
	email: string;
	email_verified_at?: string;
	phone?: string;
	avatar?: string;
	is_active: boolean;
	last_login_at?: string;
	created_at: string;
	updated_at: string;

	// Relaciones
	roles?: string[];
	authority?: string[];
	permissions?: string[];
	company?: AuthorizationCompanyRef | null;
	subsidiary?: AuthorizationSubsidiaryRef | null;
	branch?: AuthorizationBranchRef | null;

	// Campos calculados
	full_name?: string;
	initials?: string;
	role_names?: string[];
}

export interface ICreateUserRequest {
	name: string;
	first_name?: string;
	last_name?: string;
	email: string;
	phone?: string;
	password: string;
	password_confirmation: string;
	is_active?: boolean;
	roles?: string[];
	[key: string]: unknown;
}

export interface IUpdateUserRequest
	extends Partial<Omit<ICreateUserRequest, 'password' | 'password_confirmation'>> {
	password?: string;
	password_confirmation?: string;
	[key: string]: unknown;
}

export interface IInviteUserRequest {
	email: string;
	name: string;
	roles?: string[];
	message?: string;
	[key: string]: unknown;
}
