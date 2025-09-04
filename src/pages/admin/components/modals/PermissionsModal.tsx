import React, { useMemo, useCallback } from 'react';
import { type UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import { TSelectOption } from '@/components/form/SelectReact';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import SelectReact from '@/components/form/SelectReact';
import { formatRoleName, formatPermissionName } from '../../utils/formatters';

interface PermissionsModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedUser: UserWithDetails | null;
	permissions: any[];
	roles: any[];
	selectedPermissionIds: number[];
	selectedRoleIds: number[];
	onPermissionChange: (selected: any) => void;
	onRoleChange: (selected: any) => void;
	onSave: () => void;
	isLoading: boolean;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
	isOpen,
	onClose,
	selectedUser,
	permissions,
	roles,
	selectedPermissionIds,
	selectedRoleIds,
	onPermissionChange,
	onRoleChange,
	onSave,
	isLoading,
}) => {
	const roleOptions = useMemo<TSelectOption[]>(
		() =>
			(roles || []).map((r) => ({
				value: String(r.id),
				label: formatRoleName(r.name),
			})),
		[roles],
	);

	const permissionOptions = useMemo<TSelectOption[]>(
		() =>
			(permissions || []).map((p) => ({
				value: String(p.id),
				label: formatPermissionName(p.name || p.code),
			})),
		[permissions],
	);

	const selectedRoleOptions = useMemo(
		() => roleOptions.filter((o) => selectedRoleIds.includes(parseInt(String(o.value), 10))),
		[roleOptions, selectedRoleIds],
	);

	const selectedPermissionOptions = useMemo(
		() =>
			permissionOptions.filter((o) =>
				selectedPermissionIds.includes(parseInt(String(o.value), 10)),
			),
		[permissionOptions, selectedPermissionIds],
	);

	if (!selectedUser) return null;

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='xl'>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zinc-500 font-semibold text-white'>
						{selectedUser.first_name?.charAt(0)}
						{selectedUser.last_name?.charAt(0)}
					</div>
					<div>
						<h3 className='text-lg font-semibold'>Gestionar Permisos y Roles</h3>
						<p className='text-sm text-zinc-500'>
							{selectedUser.first_name} {selectedUser.last_name} -{' '}
							{selectedUser.email}
						</p>
					</div>
				</div>
			</ModalHeader>

			<ModalBody className='max-h-[70vh] overflow-y-auto'>
				<div className='space-y-6'>
					{/* Información del Usuario */}
					<Card>
						<CardHeader>
							<h4 className='text-md flex items-center gap-2 font-semibold'>
								<Icon icon='HeroUser' className='h-5 w-5' />
								Información del Usuario
							</h4>
						</CardHeader>
						<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							<div>
								<label className='text-sm font-medium text-zinc-600'>Cargo:</label>
								<p className='text-sm'>{selectedUser.cargo || '—'}</p>
							</div>
							<div>
								<label className='text-sm font-medium text-zinc-600'>
									Empresa Principal:
								</label>
								<p className='text-sm'>
									{selectedUser.companies?.[0]?.name ||
										selectedUser.branch?.subsidiary?.company?.company_name ||
										'—'}
								</p>
							</div>
							<div>
								<label className='text-sm font-medium text-zinc-600'>
									Sucursal:
								</label>
								<p className='text-sm'>{selectedUser.branch?.branch_name || '—'}</p>
							</div>
							<div>
								<label className='text-sm font-medium text-zinc-600'>Estado:</label>
								<Badge
									color={selectedUser.is_active ? 'emerald' : 'red'}
									className='inline-flex items-center gap-1 text-xs'>
									<div
										className={`h-2 w-2 rounded-full ${selectedUser.is_active ? 'bg-green-300' : 'bg-red-300'}`}
									/>
									{selectedUser.is_active ? 'Activo' : 'Inactivo'}
								</Badge>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardHeader>
							<h4 className='text-md flex items-center gap-2 font-semibold'>
								<Icon icon='HeroInformationCircle' className='h-5 w-5' />
								Resumen de Permisos Actuales
							</h4>
						</CardHeader>
						<CardBody>
							<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
								<div className='flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 p-6 text-white shadow-md'>
									<Icon icon='HeroKey' className='mb-2 h-8 w-8' />
									<div className='text-3xl font-extrabold'>
										{selectedUser.all_permissions?.length || 0}
									</div>
									<div className='mt-1 text-base font-medium'>
										Total de Permisos
									</div>
								</div>
								<div className='flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 p-6 text-zinc-900 shadow-md'>
									<Icon icon='HeroShieldCheck' className='mb-2 h-8 w-8' />
									<div className='text-3xl font-extrabold'>
										{selectedUser.direct_permissions?.length || 0}
									</div>
									<div className='mt-1 text-base font-medium'>
										Permisos Directos
									</div>
								</div>
								<div className='flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 p-6 text-white shadow-md'>
									<Icon icon='HeroUserGroup' className='mb-2 h-8 w-8' />
									<div className='text-3xl font-extrabold'>
										{selectedUser.role_permissions?.length || 0}
									</div>
									<div className='mt-1 text-base font-medium'>Por Roles</div>
								</div>
							</div>
						</CardBody>
					</Card>

					<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
						<Card>
							<CardHeader>
								<h4 className='text-md flex items-center gap-2 font-semibold'>
									<Icon icon='HeroUserGroup' className='h-5 w-5' />
									Roles Asignados
								</h4>
							</CardHeader>
							<CardBody className='space-y-4'>
								<SelectReact
									key={`roles-${selectedUser?.id || 'none'}`}
									name='user-roles'
									options={roleOptions}
									value={selectedRoleOptions}
									onChange={onRoleChange}
									placeholder='Seleccionar roles...'
									isMulti
									isSearchable
									className='w-full'
								/>

								{selectedUser.contextual_roles &&
									selectedUser.contextual_roles.length > 0 && (
										<div className='mt-3'>
											<label className='mb-2 block text-sm font-medium text-zinc-600'>
												Contextos de Roles:
											</label>
											<div className='space-y-2'>
												{selectedUser.contextual_roles.map(
													(contextRole, index) => (
														<div
															key={index}
															className='flex items-center justify-between rounded-md bg-emerald-50 p-2'>
															<div>
																<span className='text-sm font-medium text-zinc-900'>
																	{formatRoleName(
																		contextRole.role,
																	)}
																</span>
																<span className='ml-2 text-xs text-zinc-800'>
																	en {contextRole.scope_type}:{' '}
																	{contextRole.scope_name}
																</span>
															</div>
															<Badge className='text-xs'>
																{contextRole.scope_type}
															</Badge>
														</div>
													),
												)}
											</div>
										</div>
									)}
							</CardBody>
						</Card>

						<Card>
							<CardHeader>
								<h4 className='text-md flex items-center gap-2 font-semibold'>
									<Icon icon='HeroShieldCheck' className='h-5 w-5' />
									Permisos Directos
								</h4>
							</CardHeader>
							<CardBody className='space-y-4'>
								<SelectReact
									key={`permissions-${selectedUser?.id || 'none'}`}
									name='user-permissions'
									options={permissionOptions}
									value={selectedPermissionOptions}
									onChange={onPermissionChange}
									placeholder='Seleccionar permisos específicos...'
									isMulti
									isSearchable
									className='w-full'
								/>

								<div className='rounded-md border border-yellow-200 bg-yellow-100 p-3 text-xs text-zinc-500'>
									<Icon
										icon='HeroInformationCircle'
										className='mr-2 inline h-4 w-4'
									/>
									<strong>Nota:</strong> Los permisos directos se suman a los
									permisos heredados por roles. Los permisos por roles se calculan
									automáticamente y no aparecen aquí.
								</div>
							</CardBody>
						</Card>
					</div>

					{selectedUser.role_permissions && selectedUser.role_permissions.length > 0 && (
						<Card>
							<CardHeader>
								<h4 className='text-md flex items-center gap-2 font-semibold'>
									<Icon icon='HeroEye' className='h-5 w-5' />
									Permisos Heredados por Roles (Solo Lectura)
								</h4>
							</CardHeader>
							<CardBody>
								<div className='flex max-h-32 flex-wrap gap-2 overflow-y-auto'>
									{Array.from(new Set(selectedUser.role_permissions)).map(
										(permission, index) => (
											<Badge key={index} color='violet' className='text-xs'>
												{formatPermissionName(permission)}
											</Badge>
										),
									)}
								</div>
							</CardBody>
						</Card>
					)}
				</div>
			</ModalBody>

			<ModalFooter className='flex justify-between'>
				<div className='text-sm text-zinc-500'>
					Total de permisos después de cambios:{' '}
					{selectedUser.all_permissions?.length || 0}
				</div>
				<div className='flex gap-3'>
					<Button variant='outline' onClick={onClose}>
						Cancelar
					</Button>
					<Button
						onClick={onSave}
						isDisable={isLoading}
						className='flex items-center gap-2'>
						<Icon icon='HeroCheckCircle' className='h-4 w-4' />
						Guardar Cambios
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};
