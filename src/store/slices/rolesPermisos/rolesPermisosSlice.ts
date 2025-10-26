// src/store/slices/rolesPermisosSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';

export interface RolesPermisosState {
	users: {
		data: UserWithDetails[];
		loading: boolean;
		error: string | null;
	};
	update: {
		loading: boolean;
		error: string | null;
	};
}

const initialState: RolesPermisosState = {
	users: {
		data: [],
		loading: false,
		error: null,
	},
	update: {
		loading: false,
		error: null,
	},
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

export const assignUserRoles = createAsyncThunk<
	void,
	{ id: number; roles: string[] },
	{ rejectValue: string }
>('rolesPermisos/assignUserRoles', async ({ id, roles }, { rejectWithValue }) => {
	if (!roles || roles.length === 0) return;
	try {
		await ApiService.fetchData({
			url: `/users/${id}/roles`,
			method: 'post',
			data: { roles },
		});
	} catch (err: any) {
		const message =
			err?.response?.data?.message ?? err?.message ?? 'Error al asignar roles al usuario';
		return rejectWithValue(message);
	}
});

type RemoveRolesResponse = {
	success?: boolean;
	message?: string;
	data?: {
		removed_roles?: string[];
		existing_roles?: string[];
		no_assigned_roles?: string[];
		not_existing_roles?: string[];
	};
};

export const removeUserRoles = createAsyncThunk<
	{ removedRoles: string[]; existingRoles: string[] } | undefined,
	{ id: number; roles: string[] },
	{ rejectValue: string }
>('rolesPermisos/removeUserRoles', async ({ id, roles }, { rejectWithValue }) => {
	if (!roles || roles.length === 0) return;
	try {
		const res = await ApiService.fetchData<RemoveRolesResponse>({
			url: `/users/${id}/roles`,
			method: 'delete',
			data: { roles },
		});

		const payload = res.data?.data ?? {};
		return {
			removedRoles: Array.isArray(payload.removed_roles) ? payload.removed_roles : [],
			existingRoles: Array.isArray(payload.existing_roles) ? payload.existing_roles : [],
		};
	} catch (err: any) {
		const backendData = err?.response?.data as RemoveRolesResponse | undefined;
		const message =
			backendData?.message ??
			err?.response?.data?.message ??
			err?.message ??
			'Error al revocar roles del usuario';
		return rejectWithValue(message);
	}
});

export const assignUserPermissions = createAsyncThunk<
	void,
	{ id: number; permissions: string[] },
	{ rejectValue: string }
>('rolesPermisos/assignUserPermissions', async ({ id, permissions }, { rejectWithValue }) => {
	if (!permissions || permissions.length === 0) return;
	try {
		await ApiService.fetchData({
			url: `/users/${id}/permissions`,
			method: 'post',
			data: { permissions },
		});
	} catch (err: any) {
		const message =
			err?.response?.data?.message ?? err?.message ?? 'Error al asignar permisos al usuario';
		return rejectWithValue(message);
	}
});

export const removeUserPermissions = createAsyncThunk<
	void,
	{ id: number; permissions: string[] },
	{ rejectValue: string }
>('rolesPermisos/removeUserPermissions', async ({ id, permissions }, { rejectWithValue }) => {
	if (!permissions || permissions.length === 0) return;
	try {
		await ApiService.fetchData({
			url: `/users/${id}/permissions`,
			method: 'delete',
			data: { permissions },
		});
	} catch (err: any) {
		const message =
			err?.response?.data?.message ?? err?.message ?? 'Error al revocar permisos del usuario';
		return rejectWithValue(message);
	}
});

const normalizeIds = (items: Array<{ id?: number | string }> | undefined | null): number[] => {
	if (!items) return [];
	const ids = items
		.map(item => {
			const raw = item?.id as unknown;
			if (typeof raw === 'number') return raw;
			if (typeof raw === 'string') {
				const parsed = Number(raw);
				return Number.isNaN(parsed) ? null : parsed;
			}
			return null;
		})
		.filter((id): id is number => id !== null);
	return Array.from(new Set(ids));
};

const diffIds = (nextIds: number[], currentIds: number[]) => {
	const toAdd = nextIds.filter(id => !currentIds.includes(id));
	const toRemove = currentIds.filter(id => !nextIds.includes(id));
	return { toAdd, toRemove };
};

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
	async (
		{ id, nextRoles, nextPermissions, currentRoles, currentPermissions },
		{ rejectWithValue, dispatch }
	) => {
		try {
			const computeDiffs = (nextArr: string[], currentArr: string[]) => {
				const toAdd = Array.from(new Set(nextArr.filter((v) => !currentArr.includes(v))));
				const toRemove = Array.from(new Set(currentArr.filter((v) => !nextArr.includes(v))));
				return { toAdd, toRemove };
			};

			const { toAdd: rolesToAdd, toRemove: rolesToRemove } = computeDiffs(nextRoles, currentRoles);
			const permissionsToAdd = Array.from(new Set(nextPermissions.filter((perm) => !currentPermissions.includes(perm))));
			const permissionsToRemove = Array.from(new Set(currentPermissions.filter((perm) => !nextPermissions.includes(perm))));

			console.debug('[rolesPermisos] updateUsuarioRolesPerms diff', { id, currentRoles, nextRoles, rolesToAdd, rolesToRemove, permissionsToAdd, permissionsToRemove });

			if (rolesToAdd.length > 0) {
				await dispatch(assignUserRoles({ id, roles: rolesToAdd })).unwrap();
			}
			if (rolesToRemove.length > 0) {
				await dispatch(removeUserRoles({ id, roles: rolesToRemove })).unwrap();
			}

			const permissionTasks: Promise<any>[] = [];
			if (permissionsToAdd.length > 0) {
				permissionTasks.push(
					dispatch(assignUserPermissions({ id, permissions: permissionsToAdd })).unwrap()
				);
			}
			if (permissionsToRemove.length > 0) {
				permissionTasks.push(
					dispatch(removeUserPermissions({ id, permissions: permissionsToRemove })).unwrap()
				);
			}
			if (permissionTasks.length > 0) {
				await Promise.all(permissionTasks);
			}
		} catch (err: any) {
			const message =
				typeof err === 'string'
					? err
					: err?.response?.data?.message ??
				err?.message ??
				'Error al actualizar roles o permisos';
			return rejectWithValue(message);
		}
	}
);

export const updateUsuarioAccess = createAsyncThunk<
	void,
	{
		id: number;
		current: {
			subsidiaries?: Array<{ id?: number | string }>;
			branches?: Array<{ id?: number | string }>;
		};
		next: {
			subsidiaries?: Array<{ id?: number | string }>;
			branches?: Array<{ id?: number | string }>;
		};
	},
	{ rejectValue: string }
>(
	'rolesPermisos/updateUsuarioAccess',
	async ({ id, current, next }, { rejectWithValue }) => {
		try {
			const currentSubsIds = normalizeIds(current.subsidiaries);
			const nextSubsIds = normalizeIds(next.subsidiaries);
			const currentBranchIds = normalizeIds(current.branches);
			const nextBranchIds = normalizeIds(next.branches);

			const subsDiff = diffIds(nextSubsIds, currentSubsIds);
			const branchDiff = diffIds(nextBranchIds, currentBranchIds);

			const ops: Array<{
				url: string;
				mode: 'add' | 'remove';
				ids: number[];
			}> = [];

			if (subsDiff.toAdd.length > 0) {
				ops.push({
					url: `/users/${id}/access/subsidiaries`,
					mode: 'add',
					ids: subsDiff.toAdd,
				});
			}
			if (subsDiff.toRemove.length > 0) {
				ops.push({
					url: `/users/${id}/access/subsidiaries`,
					mode: 'remove',
					ids: subsDiff.toRemove,
				});
			}
			if (branchDiff.toAdd.length > 0) {
				ops.push({
					url: `/users/${id}/access/branches`,
					mode: 'add',
					ids: branchDiff.toAdd,
				});
			}
			if (branchDiff.toRemove.length > 0) {
				ops.push({
					url: `/users/${id}/access/branches`,
					mode: 'remove',
					ids: branchDiff.toRemove,
				});
			}

			if (ops.length === 0) {
				return;
			}

			for (const { url, mode, ids } of ops) {
				await ApiService.fetchData({
					url,
					method: 'post',
					data: { ids, mode },
				});
			}
		} catch (err: any) {
			const message =
				err?.response?.data?.message ??
				err?.message ??
				'Error al actualizar accesos jerárquicos';
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
				state.users.loading = true;
				state.users.error = null;
			})
			.addCase(fetchUsuariosConRolesPerms.fulfilled, (state, { payload }) => {
				state.users.loading = false;
				state.users.data = payload;
			})
			.addCase(fetchUsuariosConRolesPerms.rejected, (state, { payload }) => {
				state.users.loading = false;
				state.users.error = typeof payload === 'string' ? payload : 'Error desconocido';
			})
			.addCase(updateUsuarioRolesPerms.pending, state => {
				state.update.loading = true;
				state.update.error = null;
			})
			.addCase(updateUsuarioRolesPerms.fulfilled, state => {
				state.update.loading = false;
			})
			.addCase(updateUsuarioRolesPerms.rejected, (state, { payload }) => {
				state.update.loading = false;
				state.update.error = typeof payload === 'string' ? payload : 'Error desconocido';
			})
			.addCase(assignUserRoles.pending, state => {
				state.update.loading = true;
				state.update.error = null;
			})
			.addCase(assignUserRoles.fulfilled, state => {
				state.update.loading = false;
			})
			.addCase(assignUserRoles.rejected, (state, { payload }) => {
				state.update.loading = false;
				state.update.error = typeof payload === 'string' ? payload : 'Error desconocido';
			})
			.addCase(removeUserRoles.pending, state => {
				state.update.loading = true;
				state.update.error = null;
			})
			.addCase(removeUserRoles.fulfilled, state => {
				state.update.loading = false;
			})
			.addCase(removeUserRoles.rejected, (state, { payload }) => {
				state.update.loading = false;
				state.update.error = typeof payload === 'string' ? payload : 'Error desconocido';
			})
			.addCase(assignUserPermissions.pending, state => {
				state.update.loading = true;
				state.update.error = null;
			})
			.addCase(assignUserPermissions.fulfilled, state => {
				state.update.loading = false;
			})
			.addCase(assignUserPermissions.rejected, (state, { payload }) => {
				state.update.loading = false;
				state.update.error = typeof payload === 'string' ? payload : 'Error desconocido';
			})
			.addCase(removeUserPermissions.pending, state => {
				state.update.loading = true;
				state.update.error = null;
			})
			.addCase(removeUserPermissions.fulfilled, state => {
				state.update.loading = false;
			})
			.addCase(removeUserPermissions.rejected, (state, { payload }) => {
				state.update.loading = false;
				state.update.error = typeof payload === 'string' ? payload : 'Error desconocido';
			})
			.addCase(updateUsuarioAccess.pending, state => {
				state.update.loading = true;
				state.update.error = null;
			})
			.addCase(updateUsuarioAccess.fulfilled, state => {
				state.update.loading = false;
			})
			.addCase(updateUsuarioAccess.rejected, (state, { payload }) => {
				state.update.loading = false;
				state.update.error = typeof payload === 'string' ? payload : 'Error desconocido';
			});
	},
});

export default rolesPermisosSlice.reducer;
