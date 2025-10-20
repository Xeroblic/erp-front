// export interface IInvitacionEmpresa {
//     id: number
//     fecha_creacion: string
//     fecha_modificacion: string
//     email: string
//     first_name: string
//     last_name: string
//     token: string
//     activation_token: string
//     is_accepted: boolean
//     invited_at: string
//     accepted_at: null | string
//     expiration_date: string
//     is_denied: boolean
//     sucursal: number
//     is_expired: boolean
// }

// Types
export interface Invitation {
	id: number;
	uid?: string;
	token?: string;
	email: string;
	first_name: string;
	middle_name?: string;
	last_name: string;
	second_last_name?: string;
	rut?: string;
	position?: string;
	phone_number?: string;
	address?: string;
	company_id: number;
	subsidiary_id?: number;
	branch_id: number;
	role_name: string;
	role?: string; // Alias opcional para role_name para consistencia con la UI
	permissions?: string[];
	status: 'pending' | 'sent' | 'accepted' | 'expired' | 'cancelled' | 'used' | string;
	additional_data?: Record<string, unknown>;
	expires_at?: string;
	sent_at?: string;
	accepted_at?: string;
	created_at?: string;
	updated_at?: string;
	invited_at?: string;
	invited_by?: string;

	// Relaciones
	company?: {
		id: number;
		company_name: string;
	};
	subsidiary?: {
		id: number;
		name: string;
	};
	branch?: {
		id: number;
		branch_name: string;
	};
	sent_by_user?: {
		id: number;
		first_name: string;
		last_name: string;
		email: string;
	};
}

export interface InvitationStats {
	total: number;
	pending: number;
	sent: number;
	accepted: number;
	expired: number;
	cancelled: number;
}

export interface CreateInvitationData {
	email: string;
	first_name: string;
	middle_name?: string;
	last_name: string;
	second_last_name?: string;
	rut?: string;
	position?: string;
	phone_number?: string;
	address?: string;
	company_id: number;
	subsidiary_id?: number;
	branch_id: number;
	role_name: string;
	permissions?: string[];
	additional_data?: Record<string, unknown>;
	send_immediately?: boolean;
	data?: Record<string, unknown>;
	ttl_days?: number;
}

export interface InvitationFilters {
	search?: string;
	status?: string;
	role?: string;
	company_id?: number;
	branch_id?: number;
}
