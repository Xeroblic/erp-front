import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader, CardHeaderChild } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useUsersManagement } from './hooks/useUsersManagement';
import { UsersTable } from './components/tables';
import { CreateUserModal } from './components/modals';
import UsersFilters from './components/filters/UsersFilters';
import { IAdminUser } from '@/interface/users.interface';
import { useAppSelector } from '@/store';

export default function UsuarioLista() {
	const { user, fetchAllUsers, fetchCompanyUsers } = useUsersManagement();
	const [usuarios, setUsuarios] = useState<IAdminUser[]>([]);
	const [filteredUsuarios, setFilteredUsuarios] = useState<IAdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [filters, setFilters] = useState<any>({});
	const [showCreateModal, setShowCreateModal] = useState(false);

	// Datos de paginación (puedes implementar paginación real después)
	const [pagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });

	// Cargar usuarios
	const loadUsers = useCallback(async () => {
		setLoading(true);
		try {
			let users: IAdminUser[] | undefined = [];

			if (user?.roles?.includes('super-admin')) {
				users = await fetchAllUsers();
			} else {
				users = await fetchCompanyUsers();
			}

			setUsuarios(users || []);
			setFilteredUsuarios(users || []);
		} catch (error) {
			console.error('Error al cargar usuarios:', error);
		} finally {
			setLoading(false);
		}
	}, [user, fetchAllUsers, fetchCompanyUsers]);

	// Aplicar filtros (CU004.4 - Listar Usuarios)
	const applyFilters = useCallback(
		(filterData: any) => {
			if (!usuarios.length) return;

			let filtered = [...usuarios];

			// Búsqueda general
			if (filterData.search) {
				const searchTerm = filterData.search.toLowerCase();
				filtered = filtered.filter((user) => {
					const fullName =
						`${user.first_name || ''} ${user.second_name || ''} ${user.last_name || ''} ${user.second_last_name || ''}`.toLowerCase();
					const email = (user.email || '').toLowerCase();
					const rut = (user.rut || '').toLowerCase();

					return (
						fullName.includes(searchTerm) ||
						email.includes(searchTerm) ||
						rut.includes(searchTerm)
					);
				});
			}

			// Filtro por RUT
			if (filterData.rut) {
				const rutTerm = filterData.rut.toLowerCase();
				filtered = filtered.filter((user) =>
					(user.rut || '').toLowerCase().includes(rutTerm),
				);
			}

			// Filtro por Email
			if (filterData.email) {
				const emailTerm = filterData.email.toLowerCase();
				filtered = filtered.filter((user) =>
					(user.email || '').toLowerCase().includes(emailTerm),
				);
			}

			// Filtro por Estado
			if (filterData.is_active !== undefined && filterData.is_active !== '') {
				const isActive = filterData.is_active === 'true';
				filtered = filtered.filter((user) => user.is_active === isActive);
			}

			// Filtro por Sucursal
			if (filterData.branch_id) {
				const branchId = parseInt(filterData.branch_id);
				filtered = filtered.filter((user) => user.branch?.id === branchId);
			}

			// Filtro por Cargo
			if (filterData.position) {
				const positionTerm = filterData.position.toLowerCase();
				filtered = filtered.filter((user) => {
					const position = (user.cargo || '').toLowerCase();
					return position.includes(positionTerm);
				});
			}

			setFilteredUsuarios(filtered);
			setFilters(filterData);
		},
		[usuarios],
	);

	// Limpiar filtros
	const clearFilters = useCallback(() => {
		setFilteredUsuarios(usuarios);
		setFilters({});
	}, [usuarios]);

	// Efectos
	useEffect(() => {
		if (user) {
			loadUsers();
		}
	}, [user, loadUsers]);

	// Actualizar filtros cuando cambien los usuarios
	useEffect(() => {
		if (Object.keys(filters).length > 0) {
			applyFilters(filters);
		} else {
			setFilteredUsuarios(usuarios);
		}
	}, [usuarios, filters, applyFilters]);

	// Handlers
	const handleUserUpdated = useCallback(() => {
		loadUsers();
	}, [loadUsers]);

	const handleUserCreated = useCallback(() => {
		loadUsers();
		setShowCreateModal(false);
	}, [loadUsers]);

	const handlePageChange = useCallback((page: number) => {
		console.log('Cambiar a página:', page);
	}, []);

	const handlePageSizeChange = useCallback((pageSize: number) => {
		console.log('Cambiar tamaño de página:', pageSize);
	}, []);

	// Verificar permisos para crear usuario
	const canCreateUser = user?.roles?.includes('super-admin') || user?.roles?.includes('admin');

	return (
		<PageWrapper isProtectedRoute title='Usuarios' name='Usuarios'>
			<Subheader>
				<SubheaderLeft>
					<Badge className='text-xl'>Gestión de Usuarios</Badge>
					<div className='text-sm text-gray-600 dark:text-gray-400'>
						{filteredUsuarios.length !== usuarios.length
							? `${filteredUsuarios.length} de ${usuarios.length} usuarios`
							: `${usuarios.length} usuario${usuarios.length !== 1 ? 's' : ''} registrado${usuarios.length !== 1 ? 's' : ''}`}
						{Object.keys(filters).length > 0 && (
							<span className='ml-2 text-blue-600 dark:text-blue-400'>
								(filtrado)
							</span>
						)}
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					{canCreateUser && (
						<Button
							variant='solid'
							onClick={() => setShowCreateModal(true)}
							className='flex items-center gap-2'>
							<Icon icon='HeroUserPlus' className='h-4 w-4' />
							Nuevo Usuario
						</Button>
					)}
				</SubheaderRight>
			</Subheader>

			<Container className='space-y-6 pt-4'>
				{/* Filtros de Búsqueda */}
				<UsersFilters onFiltersChange={applyFilters} onClearFilters={clearFilters} />

				{/* Tabla de Usuarios */}
				<Card>
					<CardHeader>
						<CardHeaderChild>
							<div className='flex items-center gap-2'>
								<Icon icon='HeroUsers' className='h-6 w-6' />
								<div>
									<h2 className='text-xl font-semibold'>Listado de Usuarios</h2>
									<p className='text-sm text-gray-600 dark:text-gray-400'>
										Administra los usuarios del sistema
									</p>
								</div>
							</div>
						</CardHeaderChild>
						{Object.keys(filters).length > 0 && (
							<CardHeaderChild>
								<Button
									variant='outline'
									size='sm'
									onClick={clearFilters}
									className='flex items-center gap-2'>
									<Icon icon='HeroXMark' className='h-4 w-4' />
									Limpiar Filtros
								</Button>
							</CardHeaderChild>
						)}
					</CardHeader>
					<CardBody>
						<UsersTable
							users={filteredUsuarios}
							isLoading={loading}
							pagination={pagination}
							onPageChange={handlePageChange}
							onPageSizeChange={handlePageSizeChange}
							onUserUpdated={handleUserUpdated}
						/>
					</CardBody>
				</Card>
			</Container>

			{/* Modal de Creación de Usuario */}
			{canCreateUser && (
				<CreateUserModal
					isOpen={showCreateModal}
					onClose={() => setShowCreateModal(false)}
					onUserCreated={handleUserCreated}
				/>
			)}
		</PageWrapper>
	);
}
