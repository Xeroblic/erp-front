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
	updateUsuarioAccess,
} from '@/store/slices/rolesPermisos/rolesPermisosSlice';
import { fetchUserDetails, clearSelectedUser } from '@/store/slices/usersAdmin/usersAdminSlice';
import { fetchPermissions, fetchRoles } from '@/store/slices/permissions/permissionsSlice';

import DynamicTabs from './components/DynamicTabs';
import InformacionTab from './tabs/InformacionTab';
import RolesTab from './tabs/RolesTab';
import PermisosTab from './tabs/PermisosTab';
import AccesoJerarquico from './tabs/AccesoJerarquico';
import type { UserAccess } from './hooks/useUserAccess';
import { useUserPermissions } from './hooks/useUserPermissions';
import { useUserData } from './hooks/useUserData';
import { USER_DETAIL_TABS } from './constants/tabs';
import type { TabType, UserPermissionsFormValues } from './types';
import useAuthority from '@/hooks/useAuthority';

const UserPermissionsDetail: React.FC = () => {
	const { userId } = useParams<{ userId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const usuarios = useAppSelector((s) => s.rolesPermisos.users.data);
	const { selectedUser: detailedUser, loading: usersAdminLoading } = useAppSelector(
		(s) => s.usersAdmin,
	);
	const userAuthority = useAppSelector((s) => s.auth.permisos ?? []);
	const [activeTab, setActiveTab] = useState<TabType>('informacion');

	const numericUserId = React.useMemo(() => {
		const parsed = parseInt(userId ?? '', 10);
		return Number.isNaN(parsed) ? null : parsed;
	}, [userId]);

	useEffect(() => {
		dispatch(fetchUsuariosConRolesPerms());
		dispatch(fetchRoles());
		dispatch(fetchPermissions());
	}, [dispatch]);

	useEffect(() => {
		if (numericUserId === null) return;
		dispatch(clearSelectedUser());
		dispatch(fetchUserDetails(numericUserId));
	}, [dispatch, numericUserId]);

	useEffect(() => {
		return () => {
			dispatch(clearSelectedUser());
		};
	}, [dispatch]);

	const selectedUser =
		(detailedUser && detailedUser.id === numericUserId ? detailedUser : undefined) ??
		usuarios?.find((u: any) => u.id === numericUserId);

	const currentAccess = React.useMemo<UserAccess>(
		() => ({
			subsidiaries: selectedUser?.access?.subsidiaries ?? [],
			branches: selectedUser?.access?.branches ?? [],
		}),
		[selectedUser],
	);

	const [accessPending, setAccessPending] = React.useState<UserAccess | null>(null);

	const canManageRoles = useAuthority(userAuthority, [
		'super-admin',
		'admin',
		'manage-roles',
		'manage-permissions',
		'edit-roles-user',
		'edit-user',
	]);
	const canManagePermissions = useAuthority(userAuthority, [
		'super-admin',
		'admin',
		'manage-permissions',
		'manage-roles',
		'edit-roles-user',
		'edit-user',
	]);
	const canManageAccess = useAuthority(userAuthority, [
		'super-admin',
		'admin',
		'manage-company-users',
		'manage-roles',
		'edit-user',
	]);
	const canSubmitChanges = canManageRoles || canManagePermissions || canManageAccess;

	const [dirty, setDirty] = React.useState(false);
	const [saving, setSaving] = React.useState(false);

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
				if (!canManageRoles && !canManagePermissions) {
					toast.warn('No tienes permisos para modificar roles o permisos.');
					setSubmitting(false);
					return;
				}
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

	const arraysEqual = (a: any[] = [], b: any[] = []) => {
		if (a.length !== b.length) return false;
		const sa = [...a].sort();
		const sb = [...b].sort();
		return sa.every((v, i) => v === sb[i]);
	};

	const accessEquals = (a: UserAccess | null | undefined, b: UserAccess | null | undefined) => {
		if (!a && !b) return true;
		if (!a || !b) return false;
		const ba = (a.branches || []).map((x: any) => x.id).sort();
		const bb = (b.branches || []).map((x: any) => x.id).sort();
		const sa = (a.subsidiaries || []).map((x: any) => x.id).sort();
		const sb = (b.subsidiaries || []).map((x: any) => x.id).sort();
		return arraysEqual(ba, bb) && arraysEqual(sa, sb);
	};

	React.useEffect(() => {
		const nextAccess = accessPending ?? currentAccess;
		const rolesChanged = !arraysEqual(formik.values.roles, currentRoles);
		const permsChanged = !arraysEqual(formik.values.permisos, currentPermissions);
		const accessChanged = !accessEquals(nextAccess, currentAccess);
		const canEditRolesOrPermissions = canManageRoles || canManagePermissions;
		const effectiveDirty =
			(canEditRolesOrPermissions && (rolesChanged || permsChanged)) ||
			(canManageAccess && accessChanged);
		setDirty(effectiveDirty);
	}, [
		formik.values.roles,
		formik.values.permisos,
		accessPending,
		currentAccess,
		currentRoles,
		currentPermissions,
		canManageRoles,
		canManagePermissions,
		canManageAccess,
	]);

	React.useEffect(() => {
		setAccessPending(null);
	}, [selectedUser?.id]);

	const handleAccessChange = (next: UserAccess) => {
		const normalized: UserAccess = {
			subsidiaries: next?.subsidiaries ?? [],
			branches: next?.branches ?? [],
		};
		if (accessEquals(normalized, currentAccess)) {
			setAccessPending(null);
		} else {
			setAccessPending(normalized);
		}
	};

	const handleSaveAll = async () => {
		if (!selectedUser) return;
		if (!canSubmitChanges) {
			toast.warn('Esta vista es de solo lectura para tu usuario.');
			return;
		}
		setSaving(true);
		try {
			if (canManageRoles || canManagePermissions) {
				await formik.submitForm();
			}

			const nextAccess = accessPending ?? currentAccess;
			if (canManageAccess && !accessEquals(nextAccess, currentAccess)) {
				await dispatch(
					updateUsuarioAccess({
						id: selectedUser.id,
						current: currentAccess,
						next: nextAccess,
					}),
				).unwrap();
			}

			await dispatch(fetchUsuariosConRolesPerms());
			if (numericUserId !== null) {
				await dispatch(fetchUserDetails(numericUserId));
			}

			setAccessPending(null);
			setDirty(false);
			toast.success('Cambios guardados');
		} catch (err: any) {
			toast.error(err?.message || 'Error al guardar cambios');
		} finally {
			setSaving(false);
		}
	};

	const isUserLoading = usersAdminLoading?.userDetails;

	if (!selectedUser || !userData) {
		if (isUserLoading) {
			return (
				<PageWrapper title='Cargando usuario...' isProtectedRoute>
					<Container>
						<Card className='p-8 text-center'>
							<h2 className='mb-2 text-xl font-semibold'>Cargando usuario...</h2>
						</Card>
					</Container>
				</PageWrapper>
			);
		}
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

	const statusLabel = saving
		? 'Guardando...'
		: !canSubmitChanges
			? 'Solo lectura'
			: dirty
				? 'No guardado'
				: 'Guardado';
	const statusClass = saving
		? 'bg-yellow-100 text-yellow-800'
		: !canSubmitChanges
			? 'bg-zinc-100 text-zinc-600'
			: dirty
				? 'bg-red-100 text-red-800'
				: 'bg-emerald-100 text-emerald-800';

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
							className={`rounded-full px-3 py-1 text-sm ${statusClass}`}>
							{statusLabel}
						</span>
						{/* Save button */}
						<Button
							color='blue'
							variant='solid'
							onClick={handleSaveAll}
							isDisable={!dirty || saving || !canSubmitChanges}>
							{saving ? 'Guardando...' : 'Guardar cambios'}
						</Button>
					</div>
				</SubheaderLeft>
			</Subheader>

			<Container>
				{!canSubmitChanges && (
					<div className='mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300'>
						Esta vista se encuentra en modo lectura. Contacta a un administrador si necesitas editar roles, permisos o accesos jerárquicos.
					</div>
				)}
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
									editable={canManageRoles}
								/>
							)}

							{activeTab === 'permisos' && (
								<PermisosTab
									formik={formik}
									permissionOptions={permissionOptions}
									currentPermissions={currentPermissions}
									user={selectedUser}
									editable={canManagePermissions}
								/>
							)}

							{activeTab === 'acceso_jerarquico' && (
								<AccesoJerarquico
									userId={parseInt(userId || '0')}
									editable={canManageAccess}
									onChange={handleAccessChange}
									initialAccess={accessPending ?? currentAccess}
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
