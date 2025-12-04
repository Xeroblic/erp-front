import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import type { UserRow } from '../types';

export const transformUserToRow = (user: UserWithDetails): UserRow => {
	const displayName =
		[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || '—';

	const cargoResolved =
		user.cargo ||
		user.companies?.[0]?.position ||
		user.position ||
		user.branch?.position ||
		'—';

	const companyResolved =
		user.branch?.subsidiary?.company?.company_name || user.companies?.[0]?.name || '—';

	const uniqueRoles = Array.from(
		new Set([
			...(user.global_roles ?? []),
			...(user.contextual_roles?.map((cr: any) => cr.role) ?? []),
		]),
	);

	const directPermissionsCount = user.direct_permissions?.length ?? 0;
	const totalPermissionsCount = user.all_permissions?.length ?? 0;

	const searchText = [
		displayName,
		user.email ?? '',
		cargoResolved,
		companyResolved,
		uniqueRoles.join(' '),
	]
		.join(' ')
		.toLowerCase();

	return {
		...user,
		displayName,
		cargoResolved,
		companyResolved,
		uniqueRoles,
		directPermissionsCount,
		totalPermissionsCount,
		searchText,
	};
};

export const transformUsersToRows = (users: UserWithDetails[] | null): UserRow[] => {
	if (!users) return [];
	return users.map(transformUserToRow);
};
