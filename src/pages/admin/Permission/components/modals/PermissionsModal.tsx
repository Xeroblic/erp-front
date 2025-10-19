import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { type UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import { TSelectOption } from '@/components/form/SelectReact';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import SelectReact from '@/components/form/SelectReact';
import { formatRoleName, formatPermissionName } from '../../utils/formatters';
import { toast } from 'react-toastify';
import Avatar from '@/components/Avatar';
import getUserAvatarUrl from '@/utils/getUserAvatarUrl';

// Tipos para contextos de roles
interface RoleContext {
	id: string;
	roleId: number;
	roleName: string;
	scopeType: 'empresa' | 'subempresa' | 'sucursal';
	scopeId: number;
	scopeName: string;
}

interface ValidationError {
	field: string;
	message: string;
}

interface PermissionsModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedUser: UserWithDetails | null;
	permissions: any[];
	roles: any[];
	companies: any[];
	subsidiaries: any[];
	branches: any[];
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
	companies = [],
	subsidiaries = [],
	branches = [],
	selectedPermissionIds,
	selectedRoleIds,
	onPermissionChange,
	onRoleChange,
	onSave,
	isLoading,
}) => {
	// Estados para gestión contextual de roles
	const [roleContexts, setRoleContexts] = useState<RoleContext[]>([]);
	const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
	const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');

	// Estado para el modal de confirmación de eliminación
	const [deleteConfirmation, setDeleteConfirmation] = useState<{
		isOpen: boolean;
		contextId: string;
		contextInfo: string;
	}>({
		isOpen: false,
		contextId: '',
		contextInfo: '',
	});

	// Opciones para selectores
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

	// Opciones para contextos
	const scopeTypeOptions = [
		{ value: 'empresa', label: 'Empresa' },
		{ value: 'subempresa', label: 'Subempresa' },
		{ value: 'sucursal', label: 'Sucursal' },
	];

	const companyOptions = useMemo(() => {
		// Si no hay compañías reales, proporcionar datos de ejemplo
		if (!companies || companies.length === 0) {
			return [{ value: '1', label: 'Digital Innovate SpA' }];
		}
		return companies.map((c) => ({ value: String(c.id), label: c.name }));
	}, [companies]);

	const subsidiaryOptions = useMemo(() => {
		// Si no hay subsidiarias reales, proporcionar datos de ejemplo
		if (!subsidiaries || subsidiaries.length === 0) {
			return [
				{ value: '1', label: 'Subempresa Digital Innovate Chile' },
				{ value: '2', label: 'Subempresa Digital Innovate México' },
				{ value: '3', label: 'Subempresa Digital Innovate Colombia' },
			];
		}
		return subsidiaries.map((s) => ({ value: String(s.id), label: s.name }));
	}, [subsidiaries]);

	const branchOptions = useMemo(() => {
		// Si no hay sucursales reales, proporcionar datos de ejemplo
		if (!branches || branches.length === 0) {
			return [
				{ value: '1', label: 'Casa Matriz Digital Innovate' },
				{ value: '2', label: 'Sucursal Norte Santiago' },
				{ value: '3', label: 'Sucursal Sur Valparaíso' },
				{ value: '4', label: 'Sucursal Centro Concepción' },
			];
		}
		return branches.map((b) => ({ value: String(b.id), label: b.name }));
	}, [branches]);

	const globalRoleIds = useMemo(() => {
		if (!selectedUser?.global_roles?.length) return [];
		return selectedUser.global_roles
			.map((roleName) => roles.find((role) => role.name === roleName)?.id)
			.filter((id): id is number => typeof id === 'number');
	}, [roles, selectedUser]);

	// Inicializar contextos de roles existentes
	useEffect(() => {
		if (selectedUser?.contextual_roles) {
			const contexts: RoleContext[] = selectedUser.contextual_roles.map((cr, index) => ({
				id: `existing-${index}`,
				roleId: roles.find((r) => r.name === cr.role)?.id || 0,
				roleName: cr.role,
				scopeType: cr.scope_type as 'empresa' | 'subempresa' | 'sucursal',
				scopeId: cr.scope_id || 0,
				scopeName: cr.scope_name || '',
			}));
			setRoleContexts(contexts);
		} else {
			// Limpiar contextos si no hay usuario seleccionado
			setRoleContexts([]);
		}
		// Limpiar errores de validación al cambiar de usuario
		setValidationErrors([]);
	}, [selectedUser, roles]);

	// Validaciones según CU005.1 - solo validar contextos que tengan al menos un campo completado
	const validateRoleContext = useCallback(
		(context: RoleContext): ValidationError[] => {
			const errors: ValidationError[] = [];

			// Solo validar si el contexto tiene al menos un campo completado
			const hasAnyValue = context.roleId > 0 || context.scopeType || context.scopeId > 0;

			if (!hasAnyValue) {
				// Si no hay ningún valor, no validar (permite contextos vacíos)
				return errors;
			}

			if (!context.roleId || context.roleId === 0) {
				errors.push({ field: 'role', message: 'Debe seleccionar un rol' });
			}

			if (!context.scopeType) {
				errors.push({ field: 'scopeType', message: 'Debe seleccionar un tipo de alcance' });
			}

			if (!context.scopeId || context.scopeId === 0) {
				errors.push({
					field: 'scopeId',
					message: 'Debe seleccionar un alcance específico',
				});
			}

			// Verificar duplicidad solo si el contexto está completo
			if (context.roleId && context.scopeType && context.scopeId) {
				const duplicates = roleContexts.filter(
					(rc) =>
						rc.id !== context.id &&
						rc.roleId === context.roleId &&
						rc.scopeType === context.scopeType &&
						rc.scopeId === context.scopeId,
				);

				if (duplicates.length > 0) {
					errors.push({
						field: 'duplicate',
						message: 'Esta combinación de rol y contexto ya existe',
					});
				}
			}

			return errors;
		},
		[roleContexts],
	);

	// Agregar nuevo contexto de rol
	const addRoleContext = useCallback(() => {
		const newContext: RoleContext = {
			id: `new-${Date.now()}`,
			roleId: 0,
			roleName: '',
			scopeType: 'empresa',
			scopeId: 0,
			scopeName: '',
		};
		setRoleContexts((prev) => [...prev, newContext]);
	}, []);

	// Actualizar contexto de rol
	const updateRoleContext = useCallback(
		(id: string, updates: Partial<RoleContext>) => {
			setRoleContexts((prev) =>
				prev.map((rc) => {
					if (rc.id === id) {
						const newContext = { ...rc, ...updates };

						// Si cambia el tipo de alcance, resetear el alcance seleccionado
						if (updates.scopeType && updates.scopeType !== rc.scopeType) {
							newContext.scopeId = 0;
							newContext.scopeName = '';
						}

						// Si cambia el rol, actualizar el nombre del rol
						if (updates.roleId) {
							const role = roles.find((r) => r.id === updates.roleId);
							newContext.roleName = role?.name || '';
						}

						return newContext;
					}
					return rc;
				}),
			);

			// Limpiar errores de validación para este contexto
			setValidationErrors((prev) => prev.filter((err) => !err.field.includes(id)));
		},
		[roles],
	);

	// Eliminar contexto de rol
	const removeRoleContext = useCallback((id: string) => {
		setRoleContexts((prev) => prev.filter((rc) => rc.id !== id));
		setValidationErrors((prev) => prev.filter((err) => !err.field.includes(id)));
	}, []);

	const areArraysEqual = useCallback((a: number[], b: number[]) => {
		if (a.length !== b.length) return false;
		const sortedA = [...a].sort((x, y) => x - y);
		const sortedB = [...b].sort((x, y) => x - y);
		return sortedA.every((value, index) => value === sortedB[index]);
	}, []);

	useEffect(() => {
		const contextRoleIds = roleContexts
			.filter((context) => context.roleId > 0)
			.map((context) => context.roleId);

		const combinedRoleIds = Array.from(
			new Set<number>([...globalRoleIds, ...contextRoleIds]),
		);

		if (!areArraysEqual(combinedRoleIds, selectedRoleIds)) {
			const selectedOptions = roleOptions.filter((option) =>
				combinedRoleIds.includes(parseInt(String(option.value), 10)),
			);
			onRoleChange(selectedOptions);
		}
	}, [
		areArraysEqual,
		globalRoleIds,
		onRoleChange,
		roleContexts,
		roleOptions,
		selectedRoleIds,
	]);


	// Función para mostrar confirmación de eliminación
	const showDeleteConfirmation = useCallback(
		(contextId: string) => {
			const context = roleContexts.find((rc) => rc.id === contextId);
			if (context) {
				const contextInfo = `${context.roleName || 'Rol sin nombre'} - ${context.scopeName || 'Alcance sin nombre'}`;
				setDeleteConfirmation({
					isOpen: true,
					contextId,
					contextInfo,
				});
			}
		},
		[roleContexts],
	);

	// Función para confirmar eliminación
	const confirmDelete = useCallback(() => {
		if (deleteConfirmation.contextId) {
			removeRoleContext(deleteConfirmation.contextId);
			toast.success('Rol contextual eliminado correctamente');
		}
		setDeleteConfirmation({
			isOpen: false,
			contextId: '',
			contextInfo: '',
		});
	}, [deleteConfirmation.contextId, removeRoleContext]);

	// Función para cancelar eliminación
	const cancelDelete = useCallback(() => {
		setDeleteConfirmation({
			isOpen: false,
			contextId: '',
			contextInfo: '',
		});
	}, []);

	// Obtener opciones de alcance según el tipo
	const getScopeOptions = useCallback(
		(scopeType: string) => {
			switch (scopeType) {
				case 'empresa':
					return companyOptions;
				case 'subempresa':
					return subsidiaryOptions;
				case 'sucursal':
					return branchOptions;
				default:
					return [];
			}
		},
		[companyOptions, subsidiaryOptions, branchOptions],
	);

	// Validar todo antes de guardar
	const validateAll = useCallback(() => {
		const errors: ValidationError[] = [];

		// Solo validar contextos que tengan al menos un campo completado
		roleContexts.forEach((context) => {
			const hasAnyValue = context.roleId > 0 || context.scopeType || context.scopeId > 0;

			if (hasAnyValue) {
				const contextErrors = validateRoleContext(context);
				contextErrors.forEach((err) => {
					errors.push({
						field: `${context.id}-${err.field}`,
						message: err.message,
					});
				});
			}
		});

		setValidationErrors(errors);
		return errors.length === 0;
	}, [roleContexts, validateRoleContext]);

	// Validar automáticamente cuando cambian los contextos
	useEffect(() => {
		// Solo validar si hay contextos con algún valor
		const hasContextsWithValues = roleContexts.some(
			(context) => context.roleId > 0 || context.scopeType || context.scopeId > 0,
		);

		if (hasContextsWithValues) {
			validateAll();
		} else {
			// Si no hay contextos con valores, limpiar errores
			setValidationErrors([]);
		}
	}, [roleContexts, validateAll]);

	// Función de guardado mejorada
	const handleSave = useCallback(async () => {
		if (!validateAll()) {
			toast.error('Por favor corrija los errores antes de guardar');
			return;
		}

		// Implementar lógica de guardado con contextos
		try {
			await onSave();
		} catch (error) {
			toast.error('Error al guardar los cambios');
		}
	}, [validateAll, onSave]);

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
		<>
			<Modal isOpen={isOpen} setIsOpen={onClose} size='lg' isStaticBackdrop>
				<ModalHeader>
					<div className='flex w-full items-center justify-between'>
							<div className='flex items-center gap-3'>
								<Avatar
									src={getUserAvatarUrl(selectedUser as any)}
									name={`${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim()}
									className='h-10 w-10'
								/>
							<div>
								<h3 className='text-lg font-semibold text-gray-900'>
									Gestionar Permisos y Roles
								</h3>
								<p className='text-sm text-gray-500'>
									{selectedUser.first_name} {selectedUser.last_name} -{' '}
									{selectedUser.email}
								</p>
							</div>
						</div>

						{/* Indicador de errores de validación */}
						{validationErrors.length > 0 && (
							<Badge color='red' className='flex items-center gap-1'>
								<Icon icon='HeroExclamationTriangle' className='h-3 w-3' />
								{validationErrors.length} error
								{validationErrors.length !== 1 ? 'es' : ''}
							</Badge>
						)}
					</div>
				</ModalHeader>

				<ModalBody className='max-h-[75vh] overflow-y-auto'>
					<div className='space-y-6'>
						{/* Información del Usuario - CU005.5 */}
						<Card>
							<CardHeader>
								<h4 className='flex items-center gap-2 text-lg font-semibold text-gray-900'>
									<Icon icon='HeroUser' className='h-5 w-5 text-gray-600' />
									Información del Usuario
								</h4>
							</CardHeader>
							<CardBody>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
									<div>
										<label className='text-sm font-medium text-gray-600'>
											Cargo:
										</label>
										<p className='text-sm font-semibold'>
											{selectedUser.cargo || selectedUser.position || '—'}
										</p>
									</div>
									<div>
										<label className='text-sm font-medium text-gray-600'>
											Empresa Principal:
										</label>
										<p className='text-sm font-semibold'>
											{selectedUser.companies?.[0]?.name ||
												selectedUser.branch?.subsidiary?.company
													?.company_name ||
												'—'}
										</p>
									</div>
									<div>
										<label className='text-sm font-medium text-gray-600'>
											Sucursal:
										</label>
										<p className='text-sm font-semibold'>
											{selectedUser.branch?.branch_name || '—'}
										</p>
									</div>
									<div>
										<label className='text-sm font-medium text-gray-600'>
											Estado:
										</label>
										<Badge
											color={selectedUser.is_active ? 'emerald' : 'red'}
											className='inline-flex items-center gap-1 text-xs'>
											<div
												className={`h-2 w-2 rounded-full ${
													selectedUser.is_active
														? 'bg-green-300'
														: 'bg-red-300'
												}`}
											/>
											{selectedUser.is_active ? 'Activo' : 'Inactivo'}
										</Badge>
									</div>
								</div>
							</CardBody>
						</Card>

						{/* Resumen de Permisos Actuales */}
						<Card>
							<CardHeader>
								<h4 className='flex items-center gap-2 text-lg font-semibold text-gray-900'>
									<Icon
										icon='HeroChartBarSquare'
										className='h-5 w-5 text-gray-600'
									/>
									Resumen de Permisos Actuales
								</h4>
							</CardHeader>
							<CardBody>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
									<div className='flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 p-4 text-white shadow-md'>
										<Icon icon='HeroKey' className='mb-2 h-6 w-6' />
										<div className='text-2xl font-bold'>
											{selectedUser.all_permissions?.length || 0}
										</div>
										<div className='text-xs font-medium'>Total de Permisos</div>
									</div>
									<div className='flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 p-4 text-gray-900 shadow-md'>
										<Icon icon='HeroShieldCheck' className='mb-2 h-6 w-6' />
										<div className='text-2xl font-bold'>
											{selectedUser.direct_permissions?.length || 0}
										</div>
										<div className='text-xs font-medium'>Permisos Directos</div>
									</div>
									<div className='flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 p-4 text-white shadow-md'>
										<Icon icon='HeroUserGroup' className='mb-2 h-6 w-6' />
										<div className='text-2xl font-bold'>
											{selectedUser.role_permissions?.length || 0}
										</div>
										<div className='text-xs font-medium'>Por Roles</div>
									</div>
									<div className='flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 p-4 text-white shadow-md'>
										<Icon icon='HeroOfficeBuilding' className='mb-2 h-6 w-6' />
										<div className='text-2xl font-bold'>
											{roleContexts.length}
										</div>
										<div className='text-xs font-medium'>Contextos</div>
									</div>
								</div>
							</CardBody>
						</Card>

						{/* Tabs para Roles y Permisos */}
						<Card>
							<CardHeader className=''>
								<div className='flex w-full items-center justify-between'>
									{/* Lado izquierdo - Título e icono */}
									<div className='flex flex-shrink-0 items-center gap-3'>
										<div className='flex h-10 w-10 items-center justify-center rounded-lg '>
											<Icon
												icon='HeroCog6Tooth'
												className='h-5 w-5 text-gray-600'
											/>
										</div>
										<div>
											<h4 className='text-lg font-semibold text-gray-900'>
												Gestión de Roles y Permisos
											</h4>
											<p className='text-sm text-gray-500'>
												Configure los accesos del usuario
											</p>
										</div>
									</div>

									{/* Lado derecho - Badges, separador y tabs */}
									<div className='ml-auto flex flex-shrink-0 items-center gap-4'>
										{/* Badge de estado */}
										<div className='flex items-center gap-2'>
											<Badge
												color='blue'
												className='px-3 py-1 text-xs font-medium shadow-sm'>
												{roleContexts.length} contextos
											</Badge>
											<Badge
												color='emerald'
												className='px-3 py-1 text-xs font-medium shadow-sm'>
												{selectedUser.all_permissions?.length || 0} permisos
											</Badge>
										</div>

										{/* Separador vertical */}
										<div className='h-10 w-px'></div>

										{/* Tabs mejorados */}
										<div className='flex rounded-lg  p-1 shadow-sm'>
											<button
												onClick={() => setActiveTab('roles')}
												className={`rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
													activeTab === 'roles'
														? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-900/10'
														: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
												}`}>
												<Icon
													icon='HeroUserGroup'
													className='mr-2 inline h-4 w-4'
												/>
												Roles
											</button>
											<button
												onClick={() => setActiveTab('permissions')}
												className={`rounded-md px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
													activeTab === 'permissions'
														? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-900/10'
														: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
												}`}>
												<Icon
													icon='HeroShieldCheck'
													className='mr-2 inline h-4 w-4'
												/>
												Permisos
											</button>
										</div>
									</div>
								</div>
							</CardHeader>

							<CardBody>
								{/* Tab de Roles Contextuales - CU005.1, CU005.2, CU005.3 */}
								{activeTab === 'roles' && (
									<div className='space-y-4'>
										<div className='flex items-center justify-between'>
											<p className='text-sm text-gray-600'>
												Asigne roles específicos con contexto de empresa,
												subempresa o sucursal
											</p>
											<Button
												onClick={addRoleContext}
												className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700'
												size='sm'>
												<Icon icon='HeroPlus' className='h-4 w-4' />
												Agregar Rol
											</Button>
										</div>

										{/* Lista de contextos de roles */}
										<div className='space-y-3'>
											{roleContexts.map((context) => (
												<div
													key={context.id}
													className='rounded-lg p-4 shadow-sm'>
													<div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
														{/* Selector de Rol */}
														<div>
															<label className='mb-1 block text-sm font-medium text-gray-700'>
																Rol *
															</label>
															<SelectReact
																name={`role-${context.id}`}
																options={roleOptions}
																value={
																	roleOptions.find(
																		(r) =>
																			r.value ===
																			String(context.roleId),
																	) || null
																}
																onChange={(option: any) => {
																	const role = roles.find(
																		(r) =>
																			r.id ===
																			parseInt(
																				option?.value ||
																					'0',
																			),
																	);
																	updateRoleContext(context.id, {
																		roleId: parseInt(
																			option?.value || '0',
																		),
																		roleName: role?.name || '',
																	});
																}}
																placeholder='Seleccionar rol...'
																className='text-sm'
																menuPortalTarget={document.body}
																menuPosition='fixed'
																styles={{
																	menuPortal: (base) => ({
																		...base,
																		zIndex: 9999,
																	}),
																	menu: (base) => ({
																		...base,
																		zIndex: 9999,
																	}),
																	control: (base) => ({
																		...base,
																		minHeight: '38px',
																	}),
																	option: (base, state) => ({
																		...base,
																		backgroundColor:
																			state.isSelected
																				? '#3b82f6'
																				: state.isFocused
																					? '#dbeafe'
																					: 'white',
																		color: state.isSelected
																			? 'white'
																			: '#374151',
																		cursor: 'pointer',
																		'&:hover': {
																			backgroundColor:
																				state.isSelected
																					? '#3b82f6'
																					: '#dbeafe',
																		},
																	}),
																}}
															/>
															{validationErrors.find(
																(e) =>
																	e.field ===
																	`${context.id}-role`,
															) && (
																<p className='mt-1 text-xs text-red-600'>
																	{
																		validationErrors.find(
																			(e) =>
																				e.field ===
																				`${context.id}-role`,
																		)?.message
																	}
																</p>
															)}
														</div>

														{/* Selector de Tipo de Alcance */}
														<div>
															<label className='mb-1 block text-sm font-medium text-gray-700'>
																Tipo de Alcance *
															</label>
															<SelectReact
																name={`scope-type-${context.id}`}
																options={scopeTypeOptions}
																value={
																	scopeTypeOptions.find(
																		(s) =>
																			s.value ===
																			context.scopeType,
																	) || null
																}
																onChange={(option: any) => {
																	updateRoleContext(context.id, {
																		scopeType:
																			option?.value ||
																			'empresa',
																		scopeId: 0,
																		scopeName: '',
																	});
																}}
																placeholder='Seleccionar tipo...'
																className='text-sm'
																menuPortalTarget={document.body}
																menuPosition='fixed'
																styles={{
																	menuPortal: (base) => ({
																		...base,
																		zIndex: 9999,
																	}),
																	menu: (base) => ({
																		...base,
																		zIndex: 9999,
																	}),
																	control: (base) => ({
																		...base,
																		minHeight: '38px',
																	}),
																	option: (base, state) => ({
																		...base,
																		backgroundColor:
																			state.isSelected
																				? '#3b82f6'
																				: state.isFocused
																					? '#dbeafe'
																					: 'white',
																		color: state.isSelected
																			? 'white'
																			: '#374151',
																		cursor: 'pointer',
																		'&:hover': {
																			backgroundColor:
																				state.isSelected
																					? '#3b82f6'
																					: '#dbeafe',
																		},
																	}),
																}}
															/>
														</div>

														{/* Selector de Alcance Específico */}
														<div>
															<label className='mb-1 block text-sm font-medium text-gray-700'>
																Alcance *
															</label>
															<SelectReact
																name={`scope-${context.id}`}
																options={getScopeOptions(
																	context.scopeType,
																)}
																value={
																	getScopeOptions(
																		context.scopeType,
																	).find(
																		(s) =>
																			s.value ===
																			String(context.scopeId),
																	) || null
																}
																onChange={(option: any) => {
																	updateRoleContext(context.id, {
																		scopeId: parseInt(
																			option?.value || '0',
																		),
																		scopeName:
																			option?.label || '',
																	});
																}}
																placeholder='Seleccionar alcance...'
																className='text-sm'
																menuPortalTarget={document.body}
																menuPosition='fixed'
																styles={{
																	menuPortal: (base) => ({
																		...base,
																		zIndex: 9999,
																	}),
																	menu: (base) => ({
																		...base,
																		zIndex: 9999,
																	}),
																	control: (base) => ({
																		...base,
																		minHeight: '38px',
																	}),
																	option: (base, state) => ({
																		...base,
																		backgroundColor:
																			state.isSelected
																				? '#3b82f6'
																				: state.isFocused
																					? '#dbeafe'
																					: 'white',
																		color: state.isSelected
																			? 'white'
																			: '#374151',
																		cursor: 'pointer',
																		'&:hover': {
																			backgroundColor:
																				state.isSelected
																					? '#3b82f6'
																					: '#dbeafe',
																		},
																	}),
																}}
															/>
															{validationErrors.find(
																(e) =>
																	e.field ===
																	`${context.id}-scopeId`,
															) && (
																<p className='mt-1 text-xs text-red-600'>
																	{
																		validationErrors.find(
																			(e) =>
																				e.field ===
																				`${context.id}-scopeId`,
																		)?.message
																	}
																</p>
															)}
														</div>

														{/* Botón Eliminar */}
														<div className='flex items-end'>
															<Button
																variant='outline'
																onClick={() =>
																	showDeleteConfirmation(
																		context.id,
																	)
																}
																className='flex w-full items-center justify-center gap-2 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50'
																size='sm'>
																<Icon
																	icon='HeroTrash'
																	className='h-4 w-4'
																/>
																Eliminar
															</Button>
														</div>
													</div>

													{/* Mostrar errores de duplicidad */}
													{validationErrors.find(
														(e) =>
															e.field === `${context.id}-duplicate`,
													) && (
														<div className='mt-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700'>
															<Icon
																icon='HeroExclamationTriangle'
																className='mr-1 inline h-4 w-4'
															/>
															{
																validationErrors.find(
																	(e) =>
																		e.field ===
																		`${context.id}-duplicate`,
																)?.message
															}
														</div>
													)}
												</div>
											))}

											{roleContexts.length === 0 && (
												<div className='py-12 text-center'>
													<div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 ring-8 ring-blue-50'>
														<Icon
															icon='HeroUserGroup'
															className='h-8 w-8 text-blue-500'
														/>
													</div>
													<h3 className='mb-2 text-lg font-semibold text-gray-900'>
														No hay roles contextuales asignados
													</h3>
													<p className='mx-auto mb-6 max-w-sm text-sm text-gray-500'>
														Asigne roles específicos con contexto de
														empresa, subempresa o sucursal para otorgar
														permisos granulares
													</p>
													<Button
														onClick={addRoleContext}
														className='inline-flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700'>
														<Icon icon='HeroPlus' className='h-4 w-4' />
														Agregar Primer Rol
													</Button>
												</div>
											)}
										</div>
									</div>
								)}

								{/* Tab de Permisos Directos - CU005.4 */}
								{activeTab === 'permissions' && (
									<div className='space-y-4'>
										<div className='flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
											<Icon
												icon='HeroInformationCircle'
												className='mt-0.5 h-5 w-5 text-yellow-600'
											/>
											<div>
												<p className='text-sm font-medium text-yellow-800'>
													Permisos Directos
												</p>
												<p className='mt-1 text-xs text-yellow-700'>
													Los permisos directos se suman a los permisos
													heredados por roles. Use esta opción solo para
													casos específicos que no cubren los roles.
												</p>
											</div>
										</div>

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
											menuPortalTarget={document.body}
											menuPosition='fixed'
											styles={{
												menuPortal: (base) => ({ ...base, zIndex: 9999 }),
												menu: (base) => ({ ...base, zIndex: 9999 }),
												control: (base) => ({ ...base, minHeight: '38px' }),
												option: (base, state) => ({
													...base,
													backgroundColor: state.isSelected
														? '#3b82f6'
														: state.isFocused
															? '#dbeafe'
															: 'white',
													color: state.isSelected ? 'white' : '#374151',
													cursor: 'pointer',
													'&:hover': {
														backgroundColor: state.isSelected
															? '#3b82f6'
															: '#dbeafe',
													},
												}),
												multiValue: (base) => ({
													...base,
													backgroundColor: '#e0e7ff',
													border: '1px solid #c7d2fe',
												}),
												multiValueLabel: (base) => ({
													...base,
													color: '#3730a3',
													fontSize: '0.75rem',
												}),
												multiValueRemove: (base) => ({
													...base,
													color: '#3730a3',
													':hover': {
														backgroundColor: '#c7d2fe',
														color: '#1e1b4b',
													},
												}),
											}}
										/>

										{/* Vista previa de permisos seleccionados */}
										{selectedPermissionOptions.length > 0 && (
											<div className='mt-4'>
												<label className='mb-2 block text-sm font-medium text-gray-700'>
													Permisos Directos Seleccionados (
													{selectedPermissionOptions.length}):
												</label>
												<div className='flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg bg-gray-50 p-3'>
													{selectedPermissionOptions.map(
														(permission, index) => (
															<Badge
																key={index}
																color='blue'
																className='text-xs'>
																{permission.label}
															</Badge>
														),
													)}
												</div>
											</div>
										)}
									</div>
								)}
							</CardBody>
						</Card>

						{/* Permisos Heredados por Roles (Solo Lectura) */}
						{selectedUser.role_permissions &&
							selectedUser.role_permissions.length > 0 && (
								<Card>
									<CardHeader>
										<h4 className='text-md flex items-center gap-2 font-semibold'>
											<Icon
												icon='HeroEye'
												className='h-5 w-5 text-gray-500'
											/>
											Permisos Heredados por Roles (Solo Lectura)
										</h4>
									</CardHeader>
									<CardBody>
										<div className='flex max-h-32 flex-wrap gap-2 overflow-y-auto'>
											{Array.from(new Set(selectedUser.role_permissions)).map(
												(permission, index) => (
													<Badge
														key={index}
														color='violet'
														className='text-xs'>
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
					<div className='text-sm text-gray-500'>
						<div className='flex items-center gap-4'>
							<span>
								Permisos totales: {selectedUser.all_permissions?.length || 0}
							</span>
							<span>Contextos de roles: {roleContexts.length}</span>
							{validationErrors.length > 0 && (
								<span className='font-medium text-red-600'>
									{validationErrors.length} error
									{validationErrors.length !== 1 ? 'es' : ''} de validación
								</span>
							)}
						</div>
					</div>
					<div className='flex gap-3'>
						<Button
							variant='outline'
							onClick={onClose}
							className='border-gray-300 text-gray-700 hover:bg-gray-50'>
							<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
							Cancelar
						</Button>
						<Button
							onClick={handleSave}
							isDisable={isLoading || validationErrors.length > 0}
							className='flex min-w-[140px] items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500'>
							{isLoading ? (
								<>
									<Icon icon='HeroArrowPath' className='h-4 w-4 animate-spin' />
									Guardando...
								</>
							) : (
								<>
									<Icon icon='HeroCheckCircle' className='h-4 w-4' />
									Guardar Cambios
								</>
							)}
						</Button>
					</div>
				</ModalFooter>
			</Modal>

			{/* Modal de Confirmación de Eliminación */}
			<Modal
				isOpen={deleteConfirmation.isOpen}
				setIsOpen={cancelDelete}
				size='lg'
				isStaticBackdrop>
				<ModalHeader>
					<div className='flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
							<Icon icon='HeroExclamationTriangle' className='h-6 w-6 text-red-600' />
						</div>
						<div>
							<h3 className='text-lg font-semibold text-gray-900'>
								Confirmar eliminación
							</h3>
							<p className='text-sm text-gray-500'>
								Esta acción no se puede deshacer
							</p>
						</div>
					</div>
				</ModalHeader>

				<ModalBody>
					<div className='space-y-4'>
						<p className='text-gray-700'>
							¿Está seguro que desea eliminar el siguiente rol contextual?
						</p>
						<div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
							<div className='flex items-center gap-2'>
								<Icon icon='HeroUserGroup' className='h-5 w-5 text-gray-600' />
								<span className='font-medium text-gray-900'>
									{deleteConfirmation.contextInfo}
								</span>
							</div>
						</div>
						<div className='rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4'>
							<div className='flex items-start gap-3'>
								<Icon
									icon='HeroExclamationTriangle'
									className='mt-0.5 h-5 w-5 text-amber-600'
								/>
								<div>
									<Badge className='text-sm font-medium text-amber-800'>
										Advertencia
									</Badge>
									<p className='mt-1 text-sm text-amber-700'>
										El usuario perderá todos los permisos asociados a este rol
										en el contexto especificado.
									</p>
								</div>
							</div>
						</div>
					</div>
				</ModalBody>

				<ModalFooter>
					<div className='flex justify-end gap-3'>
						<Button variant='outline' onClick={cancelDelete}>
							<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
							Cancelar
						</Button>
						<Button
							onClick={confirmDelete}
							className='flex items-center gap-2 bg-red-600 text-white hover:bg-red-700'>
							<Icon icon='HeroTrash' className='h-4 w-4' />
							Eliminar Rol
						</Button>
					</div>
				</ModalFooter>
			</Modal>
		</>
	);
};

