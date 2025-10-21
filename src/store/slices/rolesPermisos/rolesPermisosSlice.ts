// src/store/slices/rolesPermisosSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';

export interface RolesPermisosState {
	data: UserWithDetails[];
	status: 'idle' | 'loading' | 'failed';
	error: string | null;
}

const initialState: RolesPermisosState = {
	data: [],
	status: 'idle',
	error: null,
};

export const fetchUsuariosConRolesPerms = createAsyncThunk<UserWithDetails[], void, { rejectValue: string }>(
	'rolesPermisos/fetchAll',
	async (_, { rejectWithValue }) => {
		try {
			const res = await ApiService.fetchData<{
				success: boolean;
				data: UserWithDetails[];
				meta?: Record<string, unknown>;
			}>({
				url: '/users',
				method: 'get',
				dedupe: true,
				dedupeKey: 'users-with-roles-permissions',
			});

			const payload = Array.isArray(res.data)
				? res.data
				: Array.isArray((res.data as any)?.data)
					? (res.data as any).data
					: [];

			return payload;
		} catch (err: any) {
			const message =
				err?.response?.data?.message ??
				err?.message ??
				'Error al obtener usuarios con roles y permisos';
			return rejectWithValue(message);
		}
	}
);

export const updateUsuarioRolesPerms = createAsyncThunk<
	void,
	{
		id: number;
		nextRoles: string[];
		nextPermissions: string[];
		currentRoles: string[];
		currentPermissions: string[];
	},
	{ rejectValue: string }
>(
	'rolesPermisos/updateUsuarioRolesPerms',
	async ({ id, nextRoles, nextPermissions, currentRoles, currentPermissions }, { rejectWithValue }) => {
		try {
			// Helpers
			const computeDiffs = (nextArr: string[], currentArr: string[]) => {
				const nextIsSubsetOfCurrent = nextArr.length > 0 && nextArr.every((r) => currentArr.includes(r));
				let toAdd: string[] = [];
				let toRemove: string[] = [];
				if (nextIsSubsetOfCurrent && nextArr.length < currentArr.length) {
					toRemove = Array.from(new Set(nextArr));
					toAdd = [];
				} else {
					toAdd = Array.from(new Set(nextArr.filter((v) => !currentArr.includes(v))));
					toRemove = Array.from(new Set(currentArr.filter((v) => !nextArr.includes(v))));
				}
				return { toAdd, toRemove };
			};

			const bulkAddRoles = async (userId: number, roles: string[]) => {
				if (!roles || roles.length === 0) return;
				await ApiService.fetchData({
					url: `/users/${userId}/roles`,
					method: 'post',
					data: { roles },
				});
			};

			const deleteRolesWithFallback = async (userId: number, roles: string[]) => {
				if (!roles || roles.length === 0) return;
				for (const role of roles) {
					try {
						await ApiService.fetchData({ url: `/users/${userId}/roles/${encodeURIComponent(role)}`, method: 'delete' });
					} catch (e) {
						console.warn('[rolesPermisos] delete per-role failed, falling back to bulk delete', { userId, role, error: e });
						await ApiService.fetchData({ url: `/users/${userId}/roles`, method: 'delete', data: { roles } });
						return;
					}
				}
			};

			const applyPermissionsDiff = async (userId: number, permsToAdd: string[], permsToRemove: string[]) => {
				const tasks: Promise<any>[] = [];
				if (permsToAdd.length > 0) {
					tasks.push(ApiService.fetchData({ url: `/users/${userId}/permissions`, method: 'post', data: { permissions: permsToAdd } }));
				}
				if (permsToRemove.length > 0) {
					tasks.push(ApiService.fetchData({ url: `/users/${userId}/permissions`, method: 'delete', data: { permissions: permsToRemove } }));
				}
				if (tasks.length === 0) return;
				// Run in parallel but don't fail-fast
				await Promise.allSettled(tasks);
			};

			// Compute diffs
			const { toAdd: rolesToAdd, toRemove: rolesToRemove } = computeDiffs(nextRoles, currentRoles);
			const permissionsToAdd = Array.from(new Set(nextPermissions.filter((perm) => !currentPermissions.includes(perm))));
			const permissionsToRemove = Array.from(new Set(currentPermissions.filter((perm) => !nextPermissions.includes(perm))));

			console.debug('[rolesPermisos] updateUsuarioRolesPerms diff', { id, currentRoles, nextRoles, rolesToAdd, rolesToRemove, permissionsToAdd, permissionsToRemove });

			// Apply role changes
			await bulkAddRoles(id, rolesToAdd);
			await deleteRolesWithFallback(id, rolesToRemove);

			// Apply permission changes concurrently
			await applyPermissionsDiff(id, permissionsToAdd, permissionsToRemove);
		} catch (err: any) {
			const message =
				err?.response?.data?.message ??
				err?.message ??
				'Error al actualizar roles o permisos';
			return rejectWithValue(message);
		}
	}
);

const rolesPermisosSlice = createSlice({
	name: 'rolesPermiso/rolesPermisosSlice',
	initialState,
	reducers: {},
	extraReducers: builder => {
		builder
			.addCase(fetchUsuariosConRolesPerms.pending, state => {
				state.status = 'loading';
				state.error = null;
			})
			.addCase(fetchUsuariosConRolesPerms.fulfilled, (state, { payload }) => {
				state.status = 'idle';
				state.data = payload;
			})
			.addCase(fetchUsuariosConRolesPerms.rejected, (state, { payload }) => {
				state.status = 'failed';
				state.error = typeof payload === 'string' ? payload : 'Error desconocido';
			})
			.addCase(updateUsuarioRolesPerms.pending, state => {
				state.status = 'loading';
				state.error = null;
			})
			.addCase(updateUsuarioRolesPerms.fulfilled, state => {
				state.status = 'idle';
			})
			.addCase(updateUsuarioRolesPerms.rejected, (state, { payload }) => {
				state.status = 'failed';
				state.error = typeof payload === 'string' ? payload : 'Error desconocido';
			});
	},
});

export default rolesPermisosSlice.reducer;
