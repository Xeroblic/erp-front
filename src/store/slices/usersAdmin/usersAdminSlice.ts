import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ApiService from '../../../services/ApiService';
import { IUserMe } from '../../../interface/user.interface';
import { AuthorizationAccessScope, AuthorizationVisibleScope } from '../../../types/authorization';

// Interfaces adicionales que coinciden con el backend
export interface UserWithDetails extends Omit<IUserMe, 'roles' | 'companies'> {
	// Campos adicionales del backend
	cargo?: string;

	// Roles estructurados del backend
	global_roles?: string[];
	contextual_roles?: Array<{
		role: string;
		scope_type: string;
		scope_id: number;
		scope_name: string;
		context?: string;
		company?: string;
		subsidiary?: string;
		branch?: string;
	}>;

	// Permisos del backend actualizado
	direct_permissions?: string[];
	role_permissions?: string[];
	all_permissions?: string[];

	// Permisos legacy (para compatibilidad)
	permissions?: Array<{
		id: number;
		code: string;
		name: string;
		expires_at?: string;
	}>;

	// Roles legacy (para compatibilidad)
	roles?: Array<{
		id: number;
		name: string;
		level?: number;
	}>;

	// Información de empresa/subsidiaria/sucursal del backend
	companies?: Array<{
		id: number;
		name: string;
		is_primary?: number;
		position?: string;
		pivot?: {
			cargo?: string;
			role?: string;
		};
	}>;

	// Información jerárquica del backend actualizada
	branch?: {
		id: number;
		branch_name: string;
		is_primary?: number;
		position?: string;
		name: string; // legacy, now always string
		subsidiary?: {
			id: number;
			subsidiary_name: string;
			name: string; // legacy, now always string
			company?: {
				id: number;
				company_name: string;
			};
		};
	};

	access?: AuthorizationAccessScope;
	visible?: AuthorizationVisibleScope;

	// Campos de control
	can_edit?: boolean;
	is_super_admin?: boolean;
}

export interface CreateUserData {
	first_name: string;
	last_name: string;
	email: string;
	rut?: string;
	phone_number?: string;
	position?: string;
	company_id: number;
	subsidiary_id?: number;
	branch_id?: number;
	role_ids?: number[];
	password?: string;
}

export interface UpdateUserData extends Partial<CreateUserData> {
	id: number;
}

export interface UserInvitation {
	id: number;
	email: string;
	first_name: string;
	last_name: string;
	company_id: number;
	subsidiary_id?: number;
	branch_id?: number;
	role_ids: number[];
	invited_by: number;
	token: string;
	expires_at: string;
	status: 'pending' | 'accepted' | 'expired' | 'cancelled';
	created_at: string;
}

interface UsersAdminState {
	users: UserWithDetails[];
	invitations: UserInvitation[];
	selectedUser: UserWithDetails | null;
	loading: {
		users: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
		invitations: boolean;
		userDetails: boolean;
	};
	pagination: {
		page: number;
		per_page: number;
		total: number;
		total_pages: number;
	};
	filters: {
		search: string;
		company_id?: number;
		subsidiary_id?: number;
		branch_id?: number;
		role_id?: number;
		status?: 'active' | 'inactive';
	};
	error: string | null;
}

const initialState: UsersAdminState = {
	users: [],
	invitations: [],
	selectedUser: null,
	loading: {
		users: false,
		create: false,
		update: false,
		delete: false,
		invitations: false,
		userDetails: false,
	},
	pagination: {
		page: 1,
		per_page: 10,
		total: 0,
		total_pages: 0,
	},
	filters: {
		search: '',
	},
	error: null,
};

// Async thunks
export const fetchUsers = createAsyncThunk(
	'usersAdmin/fetchUsers',
	async (
		params: {
			page?: number;
			per_page?: number;
			search?: string;
			company_id?: number;
			subsidiary_id?: number;
			branch_id?: number;
			role_id?: number;
			status?: string;
		} = {},
		{ rejectWithValue },
	) => {
		try {
			const queryParams = new URLSearchParams();

			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== '') {
					queryParams.append(key, value.toString());
				}
			});

			// Usar el endpoint corregido del backend
			const response = await ApiService.fetchData<{
				data: UserWithDetails[];
				meta: {
					current_page: number;
					last_page: number;
					per_page: number;
					total: number;
					from: number;
					to: number;
				};
				user_context: {
					can_manage_users: boolean;
					access_level: string;
					company_id?: number;
					subsidiary_id?: number;
					branch_id?: number;
				};
			}>({
				url: `/users?${queryParams.toString()}`,
				method: 'get',
			});

			return {
				users: response.data.data,
				pagination: {
					page: response.data.meta.current_page,
					per_page: response.data.meta.per_page,
					total: response.data.meta.total,
					total_pages: response.data.meta.last_page,
				},
			};
		} catch (error: any) {
			return rejectWithValue(error?.response?.data?.message || 'Error al obtener usuarios');
		}
	},
);

export const fetchUserDetails = createAsyncThunk(
	'usersAdmin/fetchUserDetails',
	async (userId: number, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<{
				success: boolean;
				data: UserWithDetails;
				user_context?: any;
			}>({
				url: `/users/${userId}?include=roles,permissions,company,subsidiary,branch`,
				method: 'get',
			});
			return (response.data as any)?.data ?? (response.data as any)?.user;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message || 'Error al obtener detalles del usuario',
			);
		}
	},
);

export const createUser = createAsyncThunk(
	'usersAdmin/createUser',
	async (userData: CreateUserData, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<{
				success: boolean;
				data: UserWithDetails;
			}>({
				url: '/users',
				method: 'post',
				data: userData as unknown as Record<string, unknown>,
			});
			return (response.data as any)?.data ?? (response.data as any)?.user;
		} catch (error: any) {
			return rejectWithValue(error?.response?.data?.message || 'Error al crear usuario');
		}
	},
);

export const updateUser = createAsyncThunk(
	'usersAdmin/updateUser',
	async ({ id, ...userData }: UpdateUserData, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<{
				success: boolean;
				data: UserWithDetails;
			}>({
				url: `/users/${id}`,
				method: 'patch',
				data: userData as unknown as Record<string, unknown>,
			});
			return (response.data as any)?.data ?? (response.data as any)?.user;
		} catch (error: any) {
			return rejectWithValue(error?.response?.data?.message || 'Error al actualizar usuario');
		}
	},
);

export const deleteUser = createAsyncThunk(
	'usersAdmin/deleteUser',
	async (userId: number, { rejectWithValue }) => {
		try {
			await ApiService.fetchData({
				url: `/users/${userId}`,
				method: 'delete',
			});
			return userId;
		} catch (error: any) {
			return rejectWithValue(error?.response?.data?.message || 'Error al eliminar usuario');
		}
	},
);

export const toggleUserStatus = createAsyncThunk(
	'usersAdmin/toggleUserStatus',
	async ({ userId, status }: { userId: number; status: boolean }, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<any>({
				url: `/users/${userId}/toggle-status`,
				method: 'patch',
				data: { is_active: status },
			});
			if (!response?.data) {
				return rejectWithValue('Respuesta del servidor inválida: sin data');
			}
			if (
				response.data.success &&
				response.data.data &&
				typeof response.data.data.is_active === 'boolean'
			) {
				return {
					userId,
					is_active: response.data.data.is_active,
				};
			}
			if (typeof response.data.is_active === 'boolean') {
				return {
					userId,
					is_active: response.data.is_active,
				};
			}
			return rejectWithValue('Respuesta del servidor inválida: estructura no reconocida');
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message || 'Error al cambiar estado del usuario',
			);
		}
	},
);

export const fetchInvitations = createAsyncThunk(
	'usersAdmin/fetchInvitations',
	async (params: { status?: string; company_id?: number } = {}, { rejectWithValue }) => {
		try {
			const queryParams = new URLSearchParams();

			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== '') {
					queryParams.append(key, value.toString());
				}
			});

			const response = await ApiService.fetchData<{ invitations: UserInvitation[] }>({
				url: `/invitations?${queryParams.toString()}`,
				method: 'get',
			});
			return response.data.invitations;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message || 'Error al obtener invitaciones',
			);
		}
	},
);

export const sendInvitation = createAsyncThunk(
	'usersAdmin/sendInvitation',
	async (
		invitationData: {
			email: string;
			first_name: string;
			last_name: string;
			company_id: number;
			subsidiary_id?: number;
			branch_id?: number;
			role_ids: number[];
			expires_in_hours?: number;
		},
		{ rejectWithValue },
	) => {
		try {
			const response = await ApiService.fetchData<{ invitation: UserInvitation }>({
				url: '/invitations',
				method: 'post',
				data: invitationData as unknown as Record<string, unknown>,
			});
			return response.data.invitation;
		} catch (error: any) {
			return rejectWithValue(error?.response?.data?.message || 'Error al enviar invitación');
		}
	},
);

export const cancelInvitation = createAsyncThunk(
	'usersAdmin/cancelInvitation',
	async (invitationId: number, { rejectWithValue }) => {
		try {
			await ApiService.fetchData({
				url: `/invitations/${invitationId}/cancel`,
				method: 'patch',
			});
			return invitationId;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message || 'Error al cancelar invitación',
			);
		}
	},
);

export const resendInvitation = createAsyncThunk(
	'usersAdmin/resendInvitation',
	async (invitationId: number, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<{ invitation: UserInvitation }>({
				url: `/invitations/${invitationId}/resend`,
				method: 'post',
			});
			return response.data.invitation;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message || 'Error al reenviar invitación',
			);
		}
	},
);

// Slice
const usersAdminSlice = createSlice({
	name: 'usersAdmin',
	initialState,
	reducers: {
		setFilters: (state, action: PayloadAction<Partial<UsersAdminState['filters']>>) => {
			state.filters = { ...state.filters, ...action.payload };
		},
		setPagination: (state, action: PayloadAction<Partial<UsersAdminState['pagination']>>) => {
			state.pagination = { ...state.pagination, ...action.payload };
		},
		clearSelectedUser: (state) => {
			state.selectedUser = null;
		},
		clearError: (state) => {
			state.error = null;
		},
		resetUsersAdmin: () => {
			return initialState;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch users
			.addCase(fetchUsers.pending, (state) => {
				state.loading.users = true;
				state.error = null;
			})
			.addCase(fetchUsers.fulfilled, (state, action) => {
				state.loading.users = false;
				state.users = action.payload.users;
				state.pagination = action.payload.pagination;
			})
			.addCase(fetchUsers.rejected, (state, action) => {
				state.loading.users = false;
				state.error = action.payload as string;
			})

			// Fetch user details
			.addCase(fetchUserDetails.pending, (state) => {
				state.loading.userDetails = true;
				state.error = null;
			})
			.addCase(fetchUserDetails.fulfilled, (state, action) => {
				state.loading.userDetails = false;
				state.selectedUser = action.payload;
			})
			.addCase(fetchUserDetails.rejected, (state, action) => {
				state.loading.userDetails = false;
				state.error = action.payload as string;
			})

			// Create user
			.addCase(createUser.pending, (state) => {
				state.loading.create = true;
				state.error = null;
			})
			.addCase(createUser.fulfilled, (state, action) => {
				state.loading.create = false;
				state.users.unshift(action.payload);
			})
			.addCase(createUser.rejected, (state, action) => {
				state.loading.create = false;
				state.error = action.payload as string;
			})

			// Update user
			.addCase(updateUser.pending, (state) => {
				state.loading.update = true;
				state.error = null;
			})
			.addCase(updateUser.fulfilled, (state, action) => {
				state.loading.update = false;
				const index = state.users.findIndex((u) => u.id === action.payload.id);
				if (index !== -1) {
					state.users[index] = action.payload;
				}
				if (state.selectedUser?.id === action.payload.id) {
					state.selectedUser = action.payload;
				}
			})
			.addCase(updateUser.rejected, (state, action) => {
				state.loading.update = false;
				state.error = action.payload as string;
			})

			// Delete user
			.addCase(deleteUser.pending, (state) => {
				state.loading.delete = true;
				state.error = null;
			})
			.addCase(deleteUser.fulfilled, (state, action) => {
				state.loading.delete = false;
				state.users = state.users.filter((u) => u.id !== action.payload);
				if (state.selectedUser?.id === action.payload) {
					state.selectedUser = null;
				}
			})
			.addCase(deleteUser.rejected, (state, action) => {
				state.loading.delete = false;
				state.error = action.payload as string;
			})

			// Toggle user status
			.addCase(toggleUserStatus.fulfilled, (state, action) => {
				// Validar que el payload tenga la estructura esperada
				if (
					!action.payload ||
					!action.payload.userId ||
					typeof action.payload.is_active !== 'boolean'
				) {
					console.error('toggleUserStatus.fulfilled: payload inválido', action.payload);
					return;
				}

				const { userId, is_active } = action.payload;
				const numericUserId = Number(userId);
				const index = state.users.findIndex((u) => u.id === numericUserId);
				if (index !== -1) {
					state.users[index].is_active = is_active;
				}
				if (state.selectedUser?.id === numericUserId) {
					state.selectedUser.is_active = is_active;
				}
			})
			.addCase(toggleUserStatus.rejected, (_state, action) => {
				console.error('toggleUserStatus.rejected:', action.payload);
			})

			// Invitations
			.addCase(fetchInvitations.pending, (state) => {
				state.loading.invitations = true;
				state.error = null;
			})
			.addCase(fetchInvitations.fulfilled, (state, action) => {
				state.loading.invitations = false;
				state.invitations = action.payload;
			})
			.addCase(fetchInvitations.rejected, (state, action) => {
				state.loading.invitations = false;
				state.error = action.payload as string;
			})
			.addCase(sendInvitation.fulfilled, (state, action) => {
				state.invitations.unshift(action.payload);
			})
			.addCase(cancelInvitation.fulfilled, (state, action) => {
				const index = state.invitations.findIndex((i) => i.id === action.payload);
				if (index !== -1) {
					state.invitations[index].status = 'cancelled';
				}
			})
			.addCase(resendInvitation.fulfilled, (state, action) => {
				const index = state.invitations.findIndex((i) => i.id === action.payload.id);
				if (index !== -1) {
					state.invitations[index] = action.payload;
				}
			});
	},
});

export const { setFilters, setPagination, clearSelectedUser, clearError, resetUsersAdmin } =
	usersAdminSlice.actions;

export default usersAdminSlice.reducer;
