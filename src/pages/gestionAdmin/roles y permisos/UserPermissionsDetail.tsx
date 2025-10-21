import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import {
	fetchUsuariosConRolesPerms,
	updateUsuarioRolesPerms,
} from '@/store/slices/rolesPermisos/rolesPermisosSlice';
import { fetchPermissions, fetchRoles } from '@/store/slices/permissions/permissionsSlice';

// Importaciones modulares
import DynamicTabs from './components/DynamicTabs';
import InformacionTab from './tabs/InformacionTab';
import RolesTab from './tabs/RolesTab';
import PermisosTab from './tabs/PermisosTab';
import { useUserPermissions } from './hooks/useUserPermissions';
import { useUserData } from './hooks/useUserData';
import { USER_DETAIL_TABS } from './constants/tabs';
import type { TabType, UserPermissionsFormValues } from './types';

const UserPermissionsDetail: React.FC = () => {
	const { userId } = useParams<{ userId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const { data: usuarios } = useAppSelector((s) => s.rolesPermisos);
	const [activeTab, setActiveTab] = useState<TabType>('informacion');

	useEffect(() => {
		dispatch(fetchUsuariosConRolesPerms());
		dispatch(fetchRoles());
		dispatch(fetchPermissions());
	}, [dispatch]);

	const selectedUser = usuarios?.find((u) => u.id === parseInt(userId || '0'));

	// Usar hooks personalizados
	const userData = useUserData(selectedUser);
	const { roleOptions, permissionOptions, currentRoles, currentPermissions } =
		useUserPermissions(selectedUser);

	const formik = useFormik<UserPermissionsFormValues>({
		enableReinitialize: true,
		initialValues: {
			roles: currentRoles,
			permisos: currentPermissions,
		},
		validationSchema: Yup.object({
			roles: Yup.array().min(1, 'Seleccione al menos un rol'),
			permisos: Yup.array(),
		}),
		onSubmit: async (values, { setSubmitting }) => {
			if (selectedUser) {
				try {
					await dispatch(
						updateUsuarioRolesPerms({
							id: selectedUser.id,
							nextRoles: values.roles,
							nextPermissions: values.permisos,
							currentRoles,
							currentPermissions,
						}),
					).unwrap();

					toast.success('Roles y permisos actualizados correctamente');
					await dispatch(fetchUsuariosConRolesPerms());
				} catch (error: any) {
					toast.error(error?.message || 'Error al actualizar roles y permisos');
				} finally {
					setSubmitting(false);
				}
			}
		},
	});

	if (!selectedUser || !userData) {
		return (
			<PageWrapper title='Usuario no encontrado' isProtectedRoute>
				<Container>
					<Card className='p-8 text-center'>
						<Icon
							icon='HeroExclamationCircle'
							className='mx-auto mb-4 h-16 w-16 text-red-500'
						/>
						<h2 className='mb-2 text-xl font-semibold'>Usuario no encontrado</h2>
						<p className='mb-4 text-zinc-500'>
							El usuario que buscas no existe o no tienes permisos para verlo.
						</p>
						<Button onClick={() => navigate('/gestion/roles-permisos')} color='blue'>
							Volver a la lista
						</Button>
					</Card>
				</Container>
			</PageWrapper>
		);
	}

	const displayName = userData.displayName || 'Usuario sin nombre';

	return (
		<PageWrapper title={`Gestionar ${displayName}`} isProtectedRoute>
			<Subheader>
				<SubheaderLeft>
					<Button
						variant='outline'
						size='sm'
						onClick={() => navigate('/gestion/roles-permisos')}>
						<Icon icon='HeroArrowLeft' className='mr-2' />
						Volver
					</Button>
					<div className='ml-4 flex items-center gap-3'>
						<div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white'>
							{selectedUser.first_name?.charAt(0) ||
								selectedUser.email?.charAt(0) ||
								'?'}
						</div>
						<div>
							<h1 className='text-xl font-semibold'>{displayName}</h1>
							<p className='text-sm text-zinc-500'>{selectedUser.email}</p>
						</div>
						<Badge color={selectedUser.is_active ? 'emerald' : 'red'}>
							{selectedUser.is_active ? 'Activo' : 'Inactivo'}
						</Badge>
					</div>
					<Button variant='outline' size='sm' onClick={() => navigate('/gestion/roles-permisos')}>
						<Icon icon='HeroArrowLeft' className='mr-2' />
						Volver
					</Button>
				</SubheaderLeft>
			</Subheader>

			<Container>
				<Card>
					<CardBody className='p-0'>
						{/* Tabs Dinámicos */}
						<DynamicTabs
							tabs={USER_DETAIL_TABS}
							activeTab={activeTab}
							onTabChange={setActiveTab}
						/>

						{/* Tab Content */}
						<div className='p-6'>
							{activeTab === 'informacion' && (
								<InformacionTab
									user={selectedUser}
									displayName={displayName}
									cargoResolved={userData.cargoResolved || '—'}
									companyResolved={userData.companyResolved || '—'}
									uniqueRoles={userData.uniqueRoles || []}
									directPermissionsCount={userData.directPermissionsCount || 0}
									totalPermissionsCount={userData.totalPermissionsCount || 0}
								/>
							)}

							{activeTab === 'roles' && (
								<RolesTab
									formik={formik}
									roleOptions={roleOptions}
									currentRoles={currentRoles}
									onCancel={() => navigate('/gestion/roles-permisos')}
								/>
							)}

							{activeTab === 'permisos' && (
								<PermisosTab
									formik={formik}
									permissionOptions={permissionOptions}
									currentPermissions={currentPermissions}
									user={selectedUser}
									onCancel={() => navigate('/gestion/roles-permisos')}
								/>
							)}
						</div>
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
};

export default UserPermissionsDetail;
