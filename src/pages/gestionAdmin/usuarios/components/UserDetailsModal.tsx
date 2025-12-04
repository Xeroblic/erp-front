import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Badge from '@/components/ui/Badge';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface UserDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	user: any;
	mode: 'view' | 'edit';
	onModeChange?: (mode: 'view' | 'edit') => void;
}

export default function UserDetailsModal({
	isOpen,
	onClose,
	user,
	mode,
	onModeChange,
}: UserDetailsModalProps) {
	if (!user) return null;

	const formatDate = (dateString: string) => {
		try {
			return formatDistanceToNow(new Date(dateString), {
				addSuffix: true,
				locale: es,
			});
		} catch {
			return 'Fecha inválida';
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='xl'>
			<ModalHeader>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroUser' className='h-5 w-5' />
						<h3 className='text-lg font-semibold'>
							{mode === 'view' ? 'Detalles del Usuario' : 'Editar Usuario'}
						</h3>
					</div>
					<Badge variant={user.is_active ? 'outline' : 'solid'}>
						<Icon
							icon={user.is_active ? 'HeroCheckCircle' : 'HeroXCircle'}
							className='mr-1 h-3 w-3'
						/>
						{user.is_active ? 'Activo' : 'Inactivo'}
					</Badge>
				</div>
			</ModalHeader>

			<ModalBody>
				<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
					{/* Información Personal */}
					<div className='space-y-4'>
						<div className='flex items-center gap-2 border-b pb-2'>
							<Icon icon='HeroUserCircle' className='h-4 w-4' />
							<h4 className='font-medium text-gray-900 dark:text-white'>
								Información Personal
							</h4>
						</div>

						<div className='space-y-3'>
							<div className='flex items-center gap-2'>
								<Icon icon='HeroUser' className='h-4 w-4 text-gray-400' />
								<div className='flex-1'>
									<label className='text-sm font-medium text-gray-500'>
										Nombre Completo
									</label>
									<p className='text-gray-900 dark:text-white'>
										{user.first_name} {user.second_name || ''} {user.last_name}{' '}
										{user.second_last_name || ''}
									</p>
								</div>
							</div>

							<div className='flex items-center gap-2'>
								<Icon icon='HeroEnvelope' className='h-4 w-4 text-gray-400' />
								<div className='flex-1'>
									<label className='text-sm font-medium text-gray-500'>
										Email
									</label>
									<p className='text-gray-900 dark:text-white'>{user.email}</p>
								</div>
							</div>

							<div className='flex items-center gap-2'>
								<Icon icon='HeroIdentification' className='h-4 w-4 text-gray-400' />
								<div className='flex-1'>
									<label className='text-sm font-medium text-gray-500'>RUT</label>
									<p className='text-gray-900 dark:text-white'>
										{user.rut || '—'}
									</p>
								</div>
							</div>

							<div className='flex items-center gap-2'>
								<Icon icon='HeroPhone' className='h-4 w-4 text-gray-400' />
								<div className='flex-1'>
									<label className='text-sm font-medium text-gray-500'>
										Teléfono
									</label>
									<p className='text-gray-900 dark:text-white'>
										{user.celular || '—'}
									</p>
								</div>
							</div>

							<div className='flex items-center gap-2'>
								<Icon icon='HeroBriefcase' className='h-4 w-4 text-gray-400' />
								<div className='flex-1'>
									<label className='text-sm font-medium text-gray-500'>
										Cargo
									</label>
									<p className='text-gray-900 dark:text-white'>
										{user.cargo || '—'}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Información Organizacional */}
					<div className='space-y-4'>
						<div className='flex items-center gap-2 border-b pb-2'>
							<Icon icon='HeroOfficeBuilding' className='h-4 w-4' />
							<h4 className='font-medium text-gray-900 dark:text-white'>
								Información Organizacional
							</h4>
						</div>

						<div className='space-y-3'>
							{user.companies && user.companies.length > 0 && (
								<div className='flex items-start gap-2'>
									<Icon
										icon='HeroOfficeBuilding'
										className='mt-1 h-4 w-4 text-gray-400'
									/>
									<div className='flex-1'>
										<label className='text-sm font-medium text-gray-500'>
											Empresas
										</label>
										<div className='mt-1 space-y-2'>
											{user.companies.map((company: any, index: number) => (
												<div
													key={index}
													className='flex items-center justify-between'>
													<span className='text-gray-900 dark:text-white'>
														{company.name}
													</span>
													{company.is_primary && (
														<Badge
															variant='outline'
															className='text-xs'>
															<Icon
																icon='HeroStar'
																className='mr-1 h-3 w-3'
															/>
															Principal
														</Badge>
													)}
												</div>
											))}
										</div>
									</div>
								</div>
							)}

							{user.branch && (
								<>
									<div className='flex items-center gap-2'>
										<Icon icon='HeroMapPin' className='h-4 w-4 text-gray-400' />
										<div className='flex-1'>
											<label className='text-sm font-medium text-gray-500'>
												Sucursal
											</label>
											<p className='text-gray-900 dark:text-white'>
												{user.branch.branch_name}
											</p>
										</div>
									</div>

									<div className='flex items-center gap-2'>
										<Icon
											icon='HeroHomeModern'
											className='h-4 w-4 text-gray-400'
										/>
										<div className='flex-1'>
											<label className='text-sm font-medium text-gray-500'>
												Subempresa
											</label>
											<p className='text-gray-900 dark:text-white'>
												{user.branch.subsidiary?.subsidiary_name || '—'}
											</p>
										</div>
									</div>

									<div className='flex items-center gap-2'>
										<Icon
											icon='HeroOfficeBuilding'
											className='h-4 w-4 text-gray-400'
										/>
										<div className='flex-1'>
											<label className='text-sm font-medium text-gray-500'>
												Empresa
											</label>
											<p className='text-gray-900 dark:text-white'>
												{user.branch.subsidiary?.company?.company_name ||
													'—'}
											</p>
										</div>
									</div>
								</>
							)}
						</div>
					</div>

					{/* Roles y Permisos */}
					<div className='space-y-4 md:col-span-2'>
						<div className='flex items-center gap-2 border-b pb-2'>
							<Icon icon='HeroUserGroup' className='h-4 w-4' />
							<h4 className='font-medium text-gray-900 dark:text-white'>
								Roles y Permisos
							</h4>
						</div>

						<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							{/* Roles Globales */}
							{user.global_roles && user.global_roles.length > 0 && (
								<div>
									<div className='mb-2 flex items-center gap-2'>
										<Icon
											icon='HeroGlobeAlt'
											className='h-4 w-4 text-gray-400'
										/>
										<label className='text-sm font-medium text-gray-500'>
											Roles Globales
										</label>
									</div>
									<div className='flex flex-wrap gap-2'>
										{user.global_roles.map((role: string, index: number) => (
											<Badge key={index} variant='outline'>
												<Icon
													icon='HeroShieldCheck'
													className='mr-1 h-3 w-3'
												/>
												{role}
											</Badge>
										))}
									</div>
								</div>
							)}

							{/* Roles Contextuales */}
							{user.contextual_roles && user.contextual_roles.length > 0 && (
								<div>
									<div className='mb-2 flex items-center gap-2'>
										<Icon
											icon='HeroSquares2X2'
											className='h-4 w-4 text-gray-400'
										/>
										<label className='text-sm font-medium text-gray-500'>
											Roles Contextuales
										</label>
									</div>
									<div className='space-y-2'>
										{user.contextual_roles.map((role: any, index: number) => (
											<div key={index} className='text-sm'>
												<Badge variant='outline' className='mr-2'>
													<Icon icon='HeroTag' className='mr-1 h-3 w-3' />
													{role.role}
												</Badge>
												<span className='text-gray-600 dark:text-gray-400'>
													en {role.scope_name} ({role.scope_type})
												</span>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Permisos */}
							{user.all_permissions && user.all_permissions.length > 0 && (
								<div className='md:col-span-2'>
									<div className='mb-2 flex items-center gap-2'>
										<Icon icon='HeroKey' className='h-4 w-4 text-gray-400' />
										<label className='text-sm font-medium text-gray-500'>
											Permisos ({user.all_permissions.length})
										</label>
									</div>
									<div className='flex max-h-32 flex-wrap gap-1 overflow-y-auto'>
										{user.all_permissions.map(
											(permission: string, index: number) => (
												<Badge
													key={index}
													variant='outline'
													className='text-xs'>
													{permission}
												</Badge>
											),
										)}
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Información de Auditoría */}
					<div className='space-y-4 md:col-span-2'>
						<div className='flex items-center gap-2 border-b pb-2'>
							<Icon icon='HeroClock' className='h-4 w-4' />
							<h4 className='font-medium text-gray-900 dark:text-white'>
								Información de Auditoría
							</h4>
						</div>

						<div className='grid grid-cols-2 gap-4 text-sm'>
							<div className='flex items-center gap-2'>
								<Icon icon='HeroCalendarPlus' className='h-4 w-4 text-gray-400' />
								<div className='flex-1'>
									<label className='text-sm font-medium text-gray-500'>
										Creado
									</label>
									<p className='text-gray-900 dark:text-white'>
										{formatDate(user.created_at)}
									</p>
								</div>
							</div>

							<div className='flex items-center gap-2'>
								<Icon icon='HeroPencil' className='h-4 w-4 text-gray-400' />
								<div className='flex-1'>
									<label className='text-sm font-medium text-gray-500'>
										Última actualización
									</label>
									<p className='text-gray-900 dark:text-white'>
										{formatDate(user.updated_at)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</ModalBody>

			<ModalFooter>
				<div className='flex justify-end gap-2'>
					{mode === 'view' && (
						<Button onClick={() => onModeChange?.('edit')}>
							<Icon icon='HeroPencilSquare' className='mr-2 h-4 w-4' />
							Editar
						</Button>
					)}
					{mode === 'edit' && (
						<>
							<Button onClick={() => {}}>
								<Icon icon='HeroCheck' className='mr-2 h-4 w-4' />
								Guardar
							</Button>
							<Button variant='outline' onClick={() => onModeChange?.('view')}>
								<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
								Cancelar
							</Button>
						</>
					)}
					<Button variant='outline' onClick={onClose}>
						<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
						Cerrar
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
}
