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
	AuthorizationBranchRef,
	AuthorizationCompanyRef,
	AuthorizationSubsidiaryRef,
} from '@/types/authorization';

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
