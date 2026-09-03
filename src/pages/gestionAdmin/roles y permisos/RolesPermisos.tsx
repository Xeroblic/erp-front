import React, { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import {
	fetchUsuariosConRolesPerms,
	type FetchUsuariosConRolesPermsParams,
} from '@/store/slices/rolesPermisos/rolesPermisosSlice';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import TableUser from './components/TableUser';
import useRolesPermisosPagination from './hooks/useRolesPermisosPagination';

type UserRow = UserWithDetails & {
	displayName: string;
	cargoResolved: string;
	companyResolved: string;
	uniqueRoles: string[];
	directPermissionsCount: number;
	totalPermissionsCount: number;
};

const RolesPermisos: React.FC = () => {
	const dispatch = useAppDispatch();
	const { data: usuarios, meta, loading, error } = useAppSelector((s) => s.rolesPermisos.users);
	let listStatus: 'idle' | 'loading' | 'failed' = 'idle';
	if (loading) listStatus = 'loading';
	else if (error) listStatus = 'failed';
	const fetchUsers = useCallback(
		(params: FetchUsuariosConRolesPermsParams) => {
			void dispatch(fetchUsuariosConRolesPerms(params));
		},
		[dispatch],
	);
	const { search, pagination, refresh } = useRolesPermisosPagination({ onFetch: fetchUsers });

	const tableData: UserRow[] = useMemo(() => {
		if (!usuarios) return [];

		return usuarios.map((user) => {
			const displayName =
				[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || '—';

			const cargoResolved =
				user.cargo || user.companies?.[0]?.position || user.branch?.position || '—';

			const companyResolved =
				user.branch?.subsidiary?.company?.company_name || user.companies?.[0]?.name || '—';

			const uniqueRoles = Array.from(
				new Set([
					...(user.global_roles ?? []),
					...(user.contextual_roles?.map((cr) => cr.role) ?? []),
				]),
			);

			const directPermissionsCount = user.direct_permissions?.length ?? 0;
			const totalPermissionsCount = user.all_permissions?.length ?? 0;

			return {
				...user,
				displayName,
				cargoResolved,
				companyResolved,
				uniqueRoles,
				directPermissionsCount,
				totalPermissionsCount,
			};
		});
	}, [usuarios]);

	return (
		<PageWrapper title='Gestion de usuarios' name='Gestion de usuarios' isProtectedRoute>
			<Subheader>
				<SubheaderLeft>
					{/* Icono y texto */}
					<div>
						<div className='flex items-center gap-2'>
							<Icon icon='DuoUser' size='text-3xl' />
							<Badge className='text-2xl font-bold'>Gestion de usuarios</Badge>
						</div>
						<div className='flex flex-col gap-2'>
							<p className='text-sm text-zinc-500'>
								Administra los roles y permisos asignados a los usuarios del
								sistema.
							</p>
						</div>
					</div>
				</SubheaderLeft>
			</Subheader>

			<Container>
				<Card className='h-full'>
					<CardBody>
						<TableUser
							tableData={tableData}
							status={listStatus}
							error={error}
							globalFilter={search.value}
							setGlobalFilter={search.onChange}
							pagination={pagination.state}
							onPaginationChange={pagination.onChange}
							pageCount={meta?.last_page ?? 1}
							totalResults={meta?.total ?? 0}
							onRefresh={refresh}
						/>
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
};

export default RolesPermisos;
