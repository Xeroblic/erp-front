import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import { fetchUsuariosConRolesPerms } from '@/store/slices/rolesPermisos/rolesPermisosSlice';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import TableUser from './components/TableUser';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';

type UserRow = UserWithDetails & {
	displayName: string;
	cargoResolved: string;
	companyResolved: string;
	uniqueRoles: string[];
	directPermissionsCount: number;
	totalPermissionsCount: number;
	searchText: string;
};

const RolesPermisos: React.FC = () => {
	const dispatch = useAppDispatch();
	const { data: usuarios, loading, error } = useAppSelector((s) => s.rolesPermisos.users);
	const listStatus: 'idle' | 'loading' | 'failed' = loading
		? 'loading'
		: error
			? 'failed'
			: 'idle';

	const [globalFilter, setGlobalFilter] = useState('');

	useEffect(() => {
		dispatch(fetchUsuariosConRolesPerms());
	}, [dispatch]);

	const tableData: UserRow[] = useMemo(() => {
		if (!usuarios) return [];

		return usuarios.map((user) => {
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
					...(user.contextual_roles?.map((cr) => cr.role) ?? []),
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
				<SubheaderRight>
					<div className='flex items-center gap-2 rounded-lg bg-white px-3 py-2 dark:bg-zinc-800'>
						<Input
							name='globalFilter'
							type='text'
							placeholder='Buscar por nombre, email...'
							value={globalFilter}
							onChange={(e) => setGlobalFilter(e.target.value)}
							className='w-64 border-0 bg-transparent focus:outline-none'
						/>
					</div>
				</SubheaderRight>
			</Subheader>

			<Container>
				<Card className='h-full'>
					<CardBody>
						<TableUser
							tableData={tableData}
							status={listStatus}
							error={error}
							globalFilter={globalFilter}
							setGlobalFilter={setGlobalFilter}
						/>
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
};

export default RolesPermisos;
