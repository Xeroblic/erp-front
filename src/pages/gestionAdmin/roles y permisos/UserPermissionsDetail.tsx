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

import DynamicTabs from './components/DynamicTabs';
import InformacionTab from './tabs/InformacionTab';
import RolesTab from './tabs/RolesTab';
import PermisosTab from './tabs/PermisosTab';
import AccesoJerarquico from './tabs/AccesoJerarquico';
import { useUserAccess } from './hooks/useUserAccess';
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

	// Access initial data and pending changes
	const { access: initialAccess } = useUserAccess(parseInt(userId || '0'));
	const [accessPending, setAccessPending] = React.useState<any | null>(null);

	const [dirty, setDirty] = React.useState(false);
	const [saving, setSaving] = React.useState(false);

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
					console.debug('[UserPermissionsDetail] submit payload', {
						userId: selectedUser.id,
						values,
						currentRoles,
						currentPermissions,
					});
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

	// Helpers
	const arraysEqual = (a: any[] = [], b: any[] = []) => {
		if (a.length !== b.length) return false;
		const sa = [...a].sort();
		const sb = [...b].sort();
		return sa.every((v, i) => v === sb[i]);
	};

	const accessEquals = (a: any | null, b: any | null) => {
		if (!a && !b) return true;
		if (!a || !b) return false;
		// compare branch ids and subsidiary ids
		const ba = (a.branches || []).map((x: any) => x.id).sort();
		const bb = (b.branches || []).map((x: any) => x.id).sort();
		const sa = (a.subsidiaries || []).map((x: any) => x.id).sort();
		const sb = (b.subsidiaries || []).map((x: any) => x.id).sort();
		return arraysEqual(ba, bb) && arraysEqual(sa, sb);
	};

	// Derivar estado dirty cuando cambian roles/permisos o accesos pendientes
	React.useEffect(() => {
		const rolesChanged = !arraysEqual(formik.values.roles, currentRoles);
		const permsChanged = !arraysEqual(formik.values.permisos, currentPermissions);
		const accessChanged = !accessEquals(accessPending, initialAccess);
		setDirty(rolesChanged || permsChanged || accessChanged);
	}, [
		formik.values.roles,
		formik.values.permisos,
		accessPending,
		initialAccess,
		currentRoles,
		currentPermissions,
	]);

	const handleAccessChange = (next: any) => {
		setAccessPending(next);
	};

	const handleSaveAll = async () => {
		if (!selectedUser) return;
		setSaving(true);
		try {
			// First save roles & permissions via formik
			await formik.submitForm();

			// TODO: persist accessPending if backend supports it. For now log and show toast.
			if (accessPending) {
				// eslint-disable-next-line no-console
				console.debug('[UserPermissionsDetail] accessPending to save', accessPending);
				toast.info('Cambios en accesos detectados. Implementa endpoint para persistirlos.');
			}

			// Refresh users list
			await dispatch(fetchUsuariosConRolesPerms());

			setDirty(false);
			toast.success('Cambios guardados');
		} catch (err: any) {
			toast.error(err?.message || 'Error al guardar cambios');
		} finally {
			setSaving(false);
		}
	};

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
					<div className='ml-auto flex items-center gap-3'>
						{/* status tag */}
						<span
							className={`rounded-full px-3 py-1 text-sm ${saving ? 'bg-yellow-100 text-yellow-800' : dirty ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
							{saving ? 'Guardando...' : dirty ? 'No guardado' : 'Guardado'}
						</span>
						{/* Save button */}
						<Button
							color='blue'
							variant='solid'
							onClick={handleSaveAll}
							isDisable={!dirty || saving}>
							{saving ? 'Guardando...' : 'Guardar cambios'}
						</Button>
					</div>
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
								/>
							)}

							{activeTab === 'permisos' && (
								<PermisosTab
									formik={formik}
									permissionOptions={permissionOptions}
									currentPermissions={currentPermissions}
									user={selectedUser}
								/>
							)}

							{activeTab === 'acceso_jerarquico' && (
								<AccesoJerarquico
									userId={parseInt(userId || '0')}
									editable={true}
									onChange={handleAccessChange}
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
