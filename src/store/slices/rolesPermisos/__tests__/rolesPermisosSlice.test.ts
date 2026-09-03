import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import ApiService from '@/services/ApiService';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import rolesPermisosReducer, {
	fetchUsuariosConRolesPerms,
	type UsersPaginationMeta,
} from '../rolesPermisosSlice';

const meta: UsersPaginationMeta = {
	current_page: 2,
	last_page: 3,
	per_page: 15,
	total: 30,
};

const users: UserWithDetails[] = [
	{
		id: 16,
		pk: 16,
		first_name: 'Usuario',
		second_name: null,
		last_name: 'Dieciséis',
		second_last_name: null,
		email: 'usuario16@example.com',
		rut: null,
		celular: null,
		cargo: null,
		fecha_nacimiento: null,
		is_staff: false,
		is_active: true,
		can_edit: true,
		is_super_admin: false,
		image_url: null,
		companies: [],
		global_roles: [],
		invited_role: null,
		contextual_roles: [],
		direct_permissions: [],
		role_permissions: [],
		all_permissions: [],
		created_at: '2026-08-27T00:00:00.000Z',
		updated_at: '2026-08-27T00:00:00.000Z',
	},
];

const payload = {
	users,
	meta,
};

describe('fetchUsuariosConRolesPerms', () => {
	it('consulta GET /users con paginación y búsqueda, y conserva la metadata', async () => {
		const fetchData = vi.spyOn(ApiService, 'fetchData').mockResolvedValue({
			data: { success: true, data: payload.users, meta },
		} as never);
		const store = configureStore({ reducer: rolesPermisosReducer });

		await store.dispatch(
			fetchUsuariosConRolesPerms({ page: 2, per_page: 15, search: 'usuario' }),
		);

		expect(fetchData).toHaveBeenCalledWith(
			expect.objectContaining({
				url: '/users',
				params: { page: 2, per_page: 15, search: 'usuario' },
				dedupe: true,
			}),
		);
		expect(store.getState().users.data).toEqual(payload.users);
		expect(store.getState().users.meta).toEqual(meta);
		fetchData.mockRestore();
	});

	it('descarta una respuesta resuelta después de una solicitud más reciente', () => {
		const firstArgs = { page: 1, per_page: 10 };
		const secondArgs = { page: 2, per_page: 10 };
		let state = rolesPermisosReducer(
			undefined,
			fetchUsuariosConRolesPerms.pending('second-request', secondArgs),
		);

		state = rolesPermisosReducer(
			state,
			fetchUsuariosConRolesPerms.fulfilled(payload, 'first-request', firstArgs),
		);

		expect(state.users.data).toEqual([]);
		expect(state.users.loading).toBe(true);

		state = rolesPermisosReducer(
			state,
			fetchUsuariosConRolesPerms.fulfilled(payload, 'second-request', secondArgs),
		);

		expect(state.users.data).toEqual(payload.users);
		expect(state.users.meta).toEqual(meta);
	});

	it('prioriza el mensaje del backend en un error de Axios', async () => {
		const fetchData = vi
			.spyOn(ApiService, 'fetchData')
			.mockResolvedValueOnce({
				data: { success: true, data: payload.users, meta },
			} as never)
			.mockRejectedValueOnce(
				Object.assign(new Error('Request failed with status code 403'), {
					response: { data: { message: 'No tienes permiso para ver usuarios' } },
				}),
			);
		const store = configureStore({ reducer: rolesPermisosReducer });

		await store.dispatch(fetchUsuariosConRolesPerms({ page: 1, per_page: 10 }));
		expect(store.getState().users.data).toEqual(payload.users);
		expect(store.getState().users.meta).toEqual(meta);

		await store.dispatch(fetchUsuariosConRolesPerms({ page: 2, per_page: 15 }));

		expect(store.getState().users.error).toBe('No tienes permiso para ver usuarios');
		expect(store.getState().users.data).toEqual([]);
		expect(store.getState().users.meta).toBeNull();
		fetchData.mockRestore();
	});
});
