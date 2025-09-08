import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Badge from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import FieldWrap from '@/components/form/FieldWrap';
import Icon from '@/components/icon/Icon';
import { useUsersManagement } from '../../hooks/useUsersManagement';

interface UserDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	user: any;
	mode: 'view' | 'edit';
	onModeChange?: (mode: 'view' | 'edit') => void;
	onUserUpdated?: () => void;
}

interface FormValues {
	first_name: string;
	second_name: string;
	last_name: string;
	second_last_name: string;
	email: string;
	rut: string;
	celular: string;
	cargo: string;
}

const validationSchema = Yup.object({
	first_name: Yup.string().required('El primer nombre es requerido'),
	second_name: Yup.string(),
	last_name: Yup.string().required('El apellido paterno es requerido'),
	second_last_name: Yup.string(),
	email: Yup.string().email('El email no es válido').required('El email es requerido'),
	rut: Yup.string().required('El RUT es requerido'),
	celular: Yup.string().required('El teléfono celular es requerido'),
	cargo: Yup.string().required('El cargo es requerido'),
});

export default function UserDetailsModal({
	isOpen,
	onClose,
	user,
	mode,
	onModeChange,
	onUserUpdated,
}: UserDetailsModalProps) {
	const { handleUpdateUser, isActionLoading } = useUsersManagement();

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

	const initialValues: FormValues = {
		first_name: user.first_name || '',
		second_name: user.second_name || '',
		last_name: user.last_name || '',
		second_last_name: user.second_last_name || '',
		email: user.email || '',
		rut: user.rut || '',
		celular: user.celular || '',
		cargo: user.cargo || '',
	};

	const handleSubmit = async (values: FormValues) => {
		try {
			await handleUpdateUser(user.id, values);
			onUserUpdated?.();
			onModeChange?.('view');
		} catch (error) {
			console.error('Error al actualizar usuario:', error);
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

			<Formik
				initialValues={initialValues}
				validationSchema={validationSchema}
				onSubmit={handleSubmit}
				enableReinitialize>
				{({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
					<Form>
						<ModalBody>
							<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
								{/* Información Personal */}
								<div className='space-y-4 lg:col-span-2'>
									<div className='flex items-center gap-2 border-b pb-2'>
										<Icon
											icon='HeroUserCircle'
											className='h-4 w-4 text-blue-500'
										/>
										<h4 className='font-semibold text-gray-900 dark:text-white'>
											Información Personal
										</h4>
									</div>

									<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										{/* Primer Nombre */}
										<div>
											<Label htmlFor='first_name'>Primer Nombre</Label>
											{mode === 'edit' ? (
												<FieldWrap
													isValid={!errors.first_name}
													isTouched={touched.first_name}
													invalidFeedback={errors.first_name}>
													<Input
														id='first_name'
														name='first_name'
														value={values.first_name}
														onChange={handleChange}
														onBlur={handleBlur}
														placeholder='Primer nombre'
													/>
												</FieldWrap>
											) : (
												<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
													<p className='font-medium text-gray-900 dark:text-white'>
														{user.first_name || '—'}
													</p>
												</div>
											)}
										</div>

										{/* Segundo Nombre */}
										<div>
											<Label htmlFor='second_name'>Segundo Nombre</Label>
											{mode === 'edit' ? (
												<FieldWrap
													isValid={!errors.second_name}
													isTouched={touched.second_name}
													invalidFeedback={errors.second_name}>
													<Input
														id='second_name'
														name='second_name'
														value={values.second_name}
														onChange={handleChange}
														onBlur={handleBlur}
														placeholder='Segundo nombre (opcional)'
													/>
												</FieldWrap>
											) : (
												<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
													<p className='font-medium text-gray-900 dark:text-white'>
														{user.second_name || '—'}
													</p>
												</div>
											)}
										</div>

										{/* Apellido Paterno */}
										<div>
											<Label htmlFor='last_name'>Apellido Paterno</Label>
											{mode === 'edit' ? (
												<FieldWrap
													isValid={!errors.last_name}
													isTouched={touched.last_name}
													invalidFeedback={errors.last_name}>
													<Input
														id='last_name'
														name='last_name'
														value={values.last_name}
														onChange={handleChange}
														onBlur={handleBlur}
														placeholder='Apellido paterno'
													/>
												</FieldWrap>
											) : (
												<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
													<p className='font-medium text-gray-900 dark:text-white'>
														{user.last_name || '—'}
													</p>
												</div>
											)}
										</div>

										{/* Apellido Materno */}
										<div>
											<Label htmlFor='second_last_name'>
												Apellido Materno
											</Label>
											{mode === 'edit' ? (
												<FieldWrap
													isValid={!errors.second_last_name}
													isTouched={touched.second_last_name}
													invalidFeedback={errors.second_last_name}>
													<Input
														id='second_last_name'
														name='second_last_name'
														value={values.second_last_name}
														onChange={handleChange}
														onBlur={handleBlur}
														placeholder='Apellido materno (opcional)'
													/>
												</FieldWrap>
											) : (
												<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
													<p className='font-medium text-gray-900 dark:text-white'>
														{user.second_last_name || '—'}
													</p>
												</div>
											)}
										</div>

										{/* Email */}
										<div>
											<Label htmlFor='email'>Correo Electrónico</Label>
											{mode === 'edit' ? (
												<FieldWrap
													isValid={!errors.email}
													isTouched={touched.email}
													invalidFeedback={errors.email}>
													<Input
														id='email'
														name='email'
														type='email'
														value={values.email}
														onChange={handleChange}
														onBlur={handleBlur}
														placeholder='correo@empresa.cl'
													/>
												</FieldWrap>
											) : (
												<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
													<p className='font-medium text-gray-900 dark:text-white'>
														{user.email}
													</p>
												</div>
											)}
										</div>

										{/* RUT */}
										<div>
											<Label htmlFor='rut'>RUT</Label>
											{mode === 'edit' ? (
												<FieldWrap
													isValid={!errors.rut}
													isTouched={touched.rut}
													invalidFeedback={errors.rut}>
													<Input
														id='rut'
														name='rut'
														value={values.rut}
														onChange={handleChange}
														onBlur={handleBlur}
														placeholder='12.345.678-9'
													/>
												</FieldWrap>
											) : (
												<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
													<p className='font-medium text-gray-900 dark:text-white'>
														{user.rut || '—'}
													</p>
												</div>
											)}
										</div>

										{/* Teléfono */}
										<div>
											<Label htmlFor='celular'>Teléfono Celular</Label>
											{mode === 'edit' ? (
												<FieldWrap
													isValid={!errors.celular}
													isTouched={touched.celular}
													invalidFeedback={errors.celular}>
													<Input
														id='celular'
														name='celular'
														value={values.celular}
														onChange={handleChange}
														onBlur={handleBlur}
														placeholder='+56-9-xxxx-xxxx'
													/>
												</FieldWrap>
											) : (
												<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
													<p className='font-medium text-gray-900 dark:text-white'>
														{user.celular || '—'}
													</p>
												</div>
											)}
										</div>

										{/* Cargo */}
										<div>
											<Label htmlFor='cargo'>Cargo/Posición</Label>
											{mode === 'edit' ? (
												<FieldWrap
													isValid={!errors.cargo}
													isTouched={touched.cargo}
													invalidFeedback={errors.cargo}>
													<Input
														id='cargo'
														name='cargo'
														value={values.cargo}
														onChange={handleChange}
														onBlur={handleBlur}
														placeholder='Cargo o posición'
													/>
												</FieldWrap>
											) : (
												<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
													<p className='font-medium text-gray-900 dark:text-white'>
														{user.cargo || '—'}
													</p>
												</div>
											)}
										</div>
									</div>
								</div>

								{/* Información Organizacional */}
								<div className='space-y-4'>
									<div className='flex items-center gap-2 border-b pb-2'>
										<Icon
											icon='HeroOfficeBuilding'
											className='h-4 w-4 text-green-500'
										/>
										<h4 className='font-semibold text-gray-900 dark:text-white'>
											Organización
										</h4>
									</div>

									<div className='space-y-4'>
										{/* Empresa Principal */}
										{user.companies && user.companies.length > 0 && (
											<div className='rounded-lg bg-gray-50 p-3 dark:bg-gray-800'>
												<div className='mb-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
													Empresa Principal
												</div>
												{user.companies
													.filter((c: any) => c.is_primary)
													.map((company: any, index: number) => (
														<div key={index} className='space-y-1'>
															<p className='font-semibold text-gray-900 dark:text-white'>
																{company.name}
															</p>
															<p className='text-sm text-gray-600 dark:text-gray-400'>
																{company.position}
															</p>
														</div>
													))}
											</div>
										)}

										{/* Otras Empresas */}
										{user.companies &&
											user.companies.filter((c: any) => !c.is_primary)
												.length > 0 && (
												<div className='rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20'>
													<div className='mb-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
														Otras Empresas
													</div>
													<div className='space-y-2'>
														{user.companies
															.filter((c: any) => !c.is_primary)
															.map((company: any, index: number) => (
																<div
																	key={index}
																	className='space-y-1'>
																	<p className='text-sm font-medium text-gray-900 dark:text-white'>
																		{company.name}
																	</p>
																	<p className='text-xs text-gray-600 dark:text-gray-400'>
																		{company.position}
																	</p>
																</div>
															))}
													</div>
												</div>
											)}

										{/* Sucursal */}
										{user.branch && (
											<div className='rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20'>
												<div className='mb-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
													Sucursal Asignada
												</div>
												<div className='space-y-1'>
													<p className='font-semibold text-gray-900 dark:text-white'>
														{user.branch.branch_name}
													</p>
													{user.branch.subsidiary && (
														<p className='text-sm text-gray-600 dark:text-gray-400'>
															{user.branch.subsidiary.subsidiary_name}
														</p>
													)}
													{user.branch.subsidiary?.company && (
														<p className='text-xs text-gray-500 dark:text-gray-500'>
															{
																user.branch.subsidiary.company
																	.company_name
															}
														</p>
													)}
												</div>
											</div>
										)}

										{/* Estado y Permisos */}
										<div className='space-y-3'>
											<div className='rounded-lg bg-gray-50 p-3 dark:bg-gray-800'>
												<div className='mb-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
													Estado
												</div>
												<div className='flex items-center gap-2'>
													<div
														className={`h-3 w-3 rounded-full ${
															user.is_active
																? 'bg-green-500'
																: 'bg-red-500'
														}`}
													/>
													<span
														className={`font-medium ${
															user.is_active
																? 'text-green-700 dark:text-green-400'
																: 'text-red-700 dark:text-red-400'
														}`}>
														{user.is_active ? 'Activo' : 'Inactivo'}
													</span>
												</div>
											</div>

											{user.is_super_admin && (
												<div className='rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20'>
													<div className='flex items-center gap-2'>
														<Icon
															icon='HeroShieldCheck'
															className='h-4 w-4 text-purple-500'
														/>
														<span className='font-medium text-purple-700 dark:text-purple-400'>
															Super Administrador
														</span>
													</div>
												</div>
											)}
										</div>
									</div>
								</div>

								{/* Información de Auditoría */}
								{(user.created_at || user.updated_at) && (
									<div className='space-y-4 lg:col-span-3'>
										<div className='flex items-center gap-2 border-b pb-2'>
											<Icon
												icon='HeroClock'
												className='h-4 w-4 text-gray-500'
											/>
											<h4 className='font-semibold text-gray-900 dark:text-white'>
												Información de Auditoría
											</h4>
										</div>

										<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
											{user.created_at && (
												<div className='rounded-lg bg-gray-50 p-3 dark:bg-gray-800'>
													<div className='mb-2 flex items-center gap-2'>
														<Icon
															icon='HeroCalendarPlus'
															className='h-4 w-4 text-green-500'
														/>
														<div className='text-sm font-medium text-gray-700 dark:text-gray-300'>
															Fecha de Creación
														</div>
													</div>
													<p className='font-medium text-gray-900 dark:text-white'>
														{formatDate(user.created_at)}
													</p>
												</div>
											)}

											{user.updated_at && (
												<div className='rounded-lg bg-gray-50 p-3 dark:bg-gray-800'>
													<div className='mb-2 flex items-center gap-2'>
														<Icon
															icon='HeroPencil'
															className='h-4 w-4 text-blue-500'
														/>
														<div className='text-sm font-medium text-gray-700 dark:text-gray-300'>
															Última Actualización
														</div>
													</div>
													<p className='font-medium text-gray-900 dark:text-white'>
														{formatDate(user.updated_at)}
													</p>
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</ModalBody>

						<ModalFooter>
							<div className='flex justify-end gap-2'>
								{mode === 'view' ? (
									<Button onClick={() => onModeChange?.('edit')}>
										<Icon icon='HeroPencilSquare' className='mr-2 h-4 w-4' />
										Editar
									</Button>
								) : (
									<>
										<Button
											variant='outline'
											onClick={() => onModeChange?.('view')}>
											<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
											Cancelar
										</Button>
										<button
											type='submit'
											disabled={isSubmitting || isActionLoading(user.id)}
											className='inline-flex min-w-[100px] items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-500'>
											{isSubmitting || isActionLoading(user.id) ? (
												<>
													<Icon
														icon='HeroArrowPath'
														className='mr-2 h-4 w-4 animate-spin'
													/>
													Guardando...
												</>
											) : (
												<>
													<Icon
														icon='HeroCheck'
														className='mr-2 h-4 w-4'
													/>
													Guardar
												</>
											)}
										</button>
									</>
								)}
							</div>
						</ModalFooter>
					</Form>
				)}
			</Formik>
		</Modal>
	);
}
