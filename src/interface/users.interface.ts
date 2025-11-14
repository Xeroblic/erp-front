/**
 * Interfaces para el módulo de Usuarios
 * Basado en los modelos del backend ERP P0
 */

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
    company?: any;
    subsidiary?: any;
    branch?: any;

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

export interface IUpdateUserRequest extends Partial<Omit<ICreateUserRequest, 'password' | 'password_confirmation'>> {
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
