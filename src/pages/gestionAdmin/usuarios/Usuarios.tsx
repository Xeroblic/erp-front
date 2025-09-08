import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import { useUsersManagement } from './hooks/useUsersManagement';
import { UsersTable } from './components/tables';
import { IUserMe } from '@/interface/user.interface';
import { useAppSelector } from '@/store';

export default function UsuarioLista() {
	const { user, fetchAllUsers, fetchCompanyUsers } = useUsersManagement();
	const [usuarios, setUsuarios] = useState<IUserMe[]>([]);
	const [loading, setLoading] = useState(true);

	// Datos de paginación simulados (puedes implementar paginación real después)
	const [pagination] = useState({
		page: 1,
		pageSize: 10,
		total: 0,
		totalPages: 1,
	});

	const loadUsers = useCallback(async () => {
		setLoading(true);
		try {
			let users: IUserMe[] = [];

			if (user?.roles?.includes('super-admin')) {
				users = await fetchAllUsers();
			} else {
				users = await fetchCompanyUsers();
			}

			setUsuarios(users);
		} catch (error) {
			// Error ya manejado en el hook
			console.error('Error al cargar usuarios:', error);
		} finally {
			setLoading(false);
		}
	}, [user, fetchAllUsers, fetchCompanyUsers]);

	useEffect(() => {
		if (user) {
			loadUsers();
		}
	}, [user, loadUsers]);

	const handleUserUpdated = useCallback(() => {
		loadUsers();
	}, [loadUsers]);

	const handlePageChange = useCallback((page: number) => {
		// Implementar cuando tengas paginación real
		console.log('Cambiar a página:', page);
	}, []);

	const handlePageSizeChange = useCallback((pageSize: number) => {
		// Implementar cuando tengas paginación real
		console.log('Cambiar tamaño de página:', pageSize);
	}, []);

	return (
		<PageWrapper isProtectedRoute title='Usuarios' name='Usuarios'>
			<Subheader>
				<SubheaderLeft>
					<Badge className='text-xl'>Usuarios de la Empresa</Badge>
				</SubheaderLeft>
			</Subheader>

			<Container className='pt-4'>
				<Card>
					<CardHeader>
						<div className='flex items-center gap-2'>
							<Icon icon='HeroUsers' className='h-6 w-6' />
							<h2 className='text-xl font-semibold'>Gestión de Usuarios</h2>
						</div>
						<div className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
							{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado
							{usuarios.length !== 1 ? 's' : ''}
						</div>
					</CardHeader>
					<CardBody>
						<UsersTable
							users={usuarios}
							isLoading={loading}
							pagination={pagination}
							onPageChange={handlePageChange}
							onPageSizeChange={handlePageSizeChange}
							onUserUpdated={handleUserUpdated}
						/>
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
}
