import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import Badge from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Can from '@/components/auth/Can';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import FieldWrap from '@/components/form/FieldWrap';
import SelectReact from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import Avatar from '@/components/Avatar';
import getUserAvatarUrl from '@/utils/getUserAvatarUrl';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
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
	phone_number: string;
	position: string;
	address: string;
	gender: string;
	is_active: boolean;
	branch_id: number | null;
}

// Validación mejorada según CU004.2
const validationSchema = Yup.object({
	first_name: Yup.string()
		.min(2, 'El nombre debe tener al menos 2 caracteres')
		.max(50, 'El nombre no puede exceder 50 caracteres')
		.matches(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
		.required('El primer nombre es requerido'),
	second_name: Yup.string()
		.nullable()
		.max(50, 'El segundo nombre no puede exceder 50 caracteres')
		.matches(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]*$/, 'El segundo nombre solo puede contener letras y espacios'),
	last_name: Yup.string()
		.min(2, 'El apellido debe tener al menos 2 caracteres')
		.max(50, 'El apellido no puede exceder 50 caracteres')
		.matches(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, 'El apellido solo puede contener letras y espacios')
		.required('El apellido paterno es requerido'),
	second_last_name: Yup.string()
		.nullable()
		.max(50, 'El segundo apellido no puede exceder 50 caracteres')
		.matches(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]*$/, 'El segundo apellido solo puede contener letras y espacios'),
	email: Yup.string()
		.email('El formato del correo no es válido')
		.required('El email es requerido'),
	rut: Yup.string()
		.required('El RUT es requerido')
		.matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, 'El formato del RUT no es válido (ej: 12.345.678-9)'),
	phone_number: Yup.string()
		.required('El teléfono es requerido')
		.matches(/^(\+569|569|9)[\d]{8}$/, 'El número debe tener formato chileno válido'),
	position: Yup.string()
		.min(2, 'El cargo debe tener al menos 2 caracteres')
		.max(100, 'El cargo no puede exceder 100 caracteres')
		.required('El cargo es requerido'),
	address: Yup.string()
		.nullable()
		.max(200, 'La dirección no puede exceder 200 caracteres'),
	gender: Yup.string().nullable(),
});

// Opciones para los selectores
const genderOptions = [
	{ value: 'male', label: 'Masculino' },
	{ value: 'female', label: 'Femenino' },
	{ value: 'other', label: 'Otro' },
	{ value: 'prefer_not_to_say', label: 'Prefiero no decir' },
];

const branchOptions = [
	{ value: '1', label: 'Sucursal Principal' },
	{ value: '2', label: 'Sucursal Norte' },
	{ value: '3', label: 'Sucursal Sur' },
];

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
		phone_number: user.phone_number || user.celular || '',
		position: user.position || user.cargo || '',
		address: user.address || user.direccion || '',
		gender: user.gender || '',
		is_active: user.is_active ?? true,
		branch_id: user.branch?.id || user.branch_id || null,
	};

	const handleSubmit = async (values: FormValues, { setSubmitting }: any) => {
		try {
			// Formatear datos para la API
			const updateData = {
				first_name: values.first_name.trim(),
				second_name: values.second_name?.trim() || null,
				last_name: values.last_name.trim(),
				second_last_name: values.second_last_name?.trim() || null,
				email: values.email.trim().toLowerCase(),
				rut: values.rut.trim(),
				phone_number: values.phone_number.trim(),
				position: values.position.trim(),
				address: values.address?.trim() || null,
				gender: values.gender || null,
				is_active: values.is_active,
				branch_id: values.branch_id,
			};

			await handleUpdateUser(user.id, updateData);
			onUserUpdated?.();
			onModeChange?.('view');
			toast.success('Usuario actualizado correctamente');
		} catch (error: any) {
			console.error('Error al actualizar usuario:', error);
			// El error ya es manejado en el hook
		} finally {
			setSubmitting(false);
		}
	};

	// Modo Vista
	if (mode === 'view') {
		return (
			<Modal isOpen={isOpen} setIsOpen={onClose} size='xl'>
				<ModalHeader>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<Avatar src={getUserAvatarUrl(user)} name={`${user.first_name || ''} ${user.last_name || ''}`} className='h-10 w-10' />
							<div>
								<h3 className='text-lg font-semibold'>Detalles del Usuario</h3>
								<p className='text-sm text-gray-600 dark:text-gray-400'>
									Información completa del usuario
								</p>
							</div>
						</div>
						<Badge
							color={user.is_active ? 'emerald' : 'red'}
							variant={user.is_active ? 'solid' : 'outline'}
						>
							<Icon
								icon={user.is_active ? 'HeroCheckCircle' : 'HeroXCircle'}
								className='mr-1 h-3 w-3'
							/>
							{user.is_active ? 'Activo' : 'Inactivo'}
						</Badge>
					</div>
				</ModalHeader>

				<ModalBody className='space-y-6'>
					{/* Información Personal */}
					<Card>
						<CardHeader>
							<div className='flex items-center gap-2'>
								<Icon icon='HeroUserCircle' className='h-4 w-4' />
								<h4 className='font-medium text-gray-900 dark:text-white'>
									Información Personal
								</h4>
							</div>
						</CardHeader>
						<CardBody>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div>
									<Label htmlFor='full_name'>Nombre Completo</Label>
									<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
										<p className='font-medium text-gray-900 dark:text-white'>
											{`${user.first_name || ''} ${user.second_name || ''} ${user.last_name || ''} ${user.second_last_name || ''}`.trim() || 'Sin nombre'}
										</p>
									</div>
								</div>

								<div>
									<Label htmlFor='email'>Email</Label>
									<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
										<p className='font-medium text-gray-900 dark:text-white'>
											{user.email}
										</p>
									</div>
								</div>

								<div>
									<Label htmlFor='rut'>RUT</Label>
									<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
										<p className='font-medium text-gray-900 dark:text-white'>
											{user.rut || '—'}
										</p>
									</div>
								</div>

								<div>
									<Label htmlFor='phone_number'>Teléfono</Label>
									<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
										<p className='font-medium text-gray-900 dark:text-white'>
											{user.phone_number || user.celular || '—'}
										</p>
									</div>
								</div>

								<div>
									<Label htmlFor='position'>Cargo</Label>
									<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
										<p className='font-medium text-gray-900 dark:text-white'>
											{user.position || user.cargo || '—'}
										</p>
									</div>
								</div>

								<div>
									<Label htmlFor='gender'>Género</Label>
									<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
										<p className='font-medium text-gray-900 dark:text-white'>
											{genderOptions.find(g => g.value === user.gender)?.label || '—'}
										</p>
									</div>
								</div>
							</div>

							{user.address && (
								<div className='mt-4'>
									<Label htmlFor='address'>Dirección</Label>
									<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
										<p className='font-medium text-gray-900 dark:text-white'>
											{user.address}
										</p>
									</div>
								</div>
							)}
						</CardBody>
					</Card>

					{/* Información Organizacional */}
					<Card>
						<CardHeader>
							<div className='flex items-center gap-2'>
								<Icon icon='HeroOfficeBuilding' className='h-4 w-4' />
								<h4 className='font-medium text-gray-900 dark:text-white'>
									Información Organizacional
								</h4>
							</div>
						</CardHeader>
						<CardBody>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								{user.company && (
									<div>
										<Label htmlFor='company'>Empresa</Label>
										<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
											<p className='font-medium text-gray-900 dark:text-white'>
												{user.company.name}
											</p>
										</div>
									</div>
								)}

								{user.branch && (
									<div>
										<Label htmlFor='branch'>Sucursal</Label>
										<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
											<p className='font-medium text-gray-900 dark:text-white'>
												{user.branch.name}
											</p>
										</div>
									</div>
								)}
							</div>
						</CardBody>
					</Card>

					{/* Información de Auditoría */}
					<Card>
						<CardHeader>
							<div className='flex items-center gap-2'>
								<Icon icon='HeroClock' className='h-4 w-4' />
								<h4 className='font-medium text-gray-900 dark:text-white'>
									Información de Auditoría
								</h4>
							</div>
						</CardHeader>
						<CardBody>
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<Label htmlFor='created_at'>Fecha de Creación</Label>
									<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
										<p className='text-sm text-gray-900 dark:text-white'>
											{formatDate(user.created_at)}
										</p>
									</div>
								</div>

								<div>
									<Label htmlFor='updated_at'>Última Actualización</Label>
									<div className='rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800'>
										<p className='text-sm text-gray-900 dark:text-white'>
											{formatDate(user.updated_at)}
										</p>
									</div>
								</div>
							</div>
						</CardBody>
					</Card>
				</ModalBody>

				<ModalFooter>
					<div className='flex justify-end gap-2'>
						<Can any={['edit-user']}>
							<Button onClick={() => onModeChange?.('edit')}>
								<Icon icon='HeroPencilSquare' className='mr-2 h-4 w-4' />
								Editar
							</Button>
						</Can>
						<Button variant='outline' onClick={onClose}>
							<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
							Cerrar
						</Button>
					</div>
				</ModalFooter>
			</Modal>
		);
	}

	// Modo Edición
	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='xl'>
			<ModalHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroPencilSquare' className='h-5 w-5' />
					<div>
						<h3 className='text-lg font-semibold'>Editar Usuario</h3>
						<p className='text-sm text-gray-600 dark:text-gray-400'>
							Modifica los datos del usuario. Los campos marcados con * son obligatorios.
						</p>
					</div>
				</div>
			</ModalHeader>

			<Formik
				initialValues={initialValues}
				validationSchema={validationSchema}
				onSubmit={handleSubmit}
				enableReinitialize
			>
				{({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
					<Form>
						<ModalBody className='space-y-6'>
							{/* Información Personal */}
							<Card>
								<CardHeader>
									<div className='flex items-center gap-2'>
										<Icon icon='HeroUser' className='h-4 w-4' />
										<h4 className='font-medium'>Información Personal</h4>
									</div>
								</CardHeader>
								<CardBody className='space-y-4'>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										{/* Primer Nombre */}
										<div>
											<Label htmlFor='first_name'>Primer Nombre *</Label>
											<FieldWrap
												isValid={!errors.first_name}
												isTouched={touched.first_name}
												invalidFeedback={errors.first_name}
											>
												<Input
													id='first_name'
													name='first_name'
													value={values.first_name}
													onChange={handleChange}
													onBlur={handleBlur}
													placeholder='Ej: Juan'
												/>
											</FieldWrap>
										</div>

										{/* Segundo Nombre */}
										<div>
											<Label htmlFor='second_name'>Segundo Nombre</Label>
											<FieldWrap
												isValid={!errors.second_name}
												isTouched={touched.second_name}
												invalidFeedback={errors.second_name}
											>
												<Input
													id='second_name'
													name='second_name'
													value={values.second_name}
													onChange={handleChange}
													onBlur={handleBlur}
													placeholder='Ej: Carlos'
												/>
											</FieldWrap>
										</div>

										{/* Apellido Paterno */}
										<div>
											<Label htmlFor='last_name'>Apellido Paterno *</Label>
											<FieldWrap
												isValid={!errors.last_name}
												isTouched={touched.last_name}
												invalidFeedback={errors.last_name}
											>
												<Input
													id='last_name'
													name='last_name'
													value={values.last_name}
													onChange={handleChange}
													onBlur={handleBlur}
													placeholder='Ej: Pérez'
												/>
											</FieldWrap>
										</div>

										{/* Apellido Materno */}
										<div>
											<Label htmlFor='second_last_name'>Apellido Materno</Label>
											<FieldWrap
												isValid={!errors.second_last_name}
												isTouched={touched.second_last_name}
												invalidFeedback={errors.second_last_name}
											>
												<Input
													id='second_last_name'
													name='second_last_name'
													value={values.second_last_name}
													onChange={handleChange}
													onBlur={handleBlur}
													placeholder='Ej: González'
												/>
											</FieldWrap>
										</div>

										{/* Email */}
										<div>
											<Label htmlFor='email'>Email *</Label>
											<FieldWrap
												isValid={!errors.email}
												isTouched={touched.email}
												invalidFeedback={errors.email}
											>
												<Input
													id='email'
													name='email'
													type='email'
													value={values.email}
													onChange={handleChange}
													onBlur={handleBlur}
													placeholder='usuario@empresa.com'
												/>
											</FieldWrap>
										</div>

										{/* RUT */}
										<div>
											<Label htmlFor='rut'>RUT *</Label>
											<FieldWrap
												isValid={!errors.rut}
												isTouched={touched.rut}
												invalidFeedback={errors.rut}
											>
												<Input
													id='rut'
													name='rut'
													value={values.rut}
													onChange={handleChange}
													onBlur={handleBlur}
													placeholder='12.345.678-9'
												/>
											</FieldWrap>
										</div>

										{/* Teléfono */}
										<div>
											<Label htmlFor='phone_number'>Teléfono *</Label>
											<FieldWrap
												isValid={!errors.phone_number}
												isTouched={touched.phone_number}
												invalidFeedback={errors.phone_number}
											>
												<Input
													id='phone_number'
													name='phone_number'
													value={values.phone_number}
													onChange={handleChange}
													onBlur={handleBlur}
													placeholder='+56987654321 o 987654321'
												/>
											</FieldWrap>
										</div>

										{/* Género */}
										<div>
											<Label htmlFor='gender'>Género</Label>
											<SelectReact
												name='gender'
												options={genderOptions}
												value={genderOptions.find(option => option.value === values.gender) || null}
												onChange={(option: any) => setFieldValue('gender', option?.value || '')}
												placeholder='Seleccionar género...'
												isClearable
											/>
										</div>
									</div>

									{/* Dirección */}
									<div>
										<Label htmlFor='address'>Dirección</Label>
										<FieldWrap
											isValid={!errors.address}
											isTouched={touched.address}
											invalidFeedback={errors.address}
										>
											<Input
												id='address'
												name='address'
												value={values.address}
												onChange={handleChange}
												onBlur={handleBlur}
												placeholder='Ej: Av. Principal 123, Comuna, Región'
											/>
										</FieldWrap>
									</div>
								</CardBody>
							</Card>

							{/* Información Laboral */}
							<Card>
								<CardHeader>
									<div className='flex items-center gap-2'>
										<Icon icon='HeroBriefcase' className='h-4 w-4' />
										<h4 className='font-medium'>Información Laboral</h4>
									</div>
								</CardHeader>
								<CardBody className='space-y-4'>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										{/* Cargo */}
										<div>
											<Label htmlFor='position'>Cargo *</Label>
											<FieldWrap
												isValid={!errors.position}
												isTouched={touched.position}
												invalidFeedback={errors.position}
											>
												<Input
													id='position'
													name='position'
													value={values.position}
													onChange={handleChange}
													onBlur={handleBlur}
													placeholder='Ej: Administrador, Vendedor'
												/>
											</FieldWrap>
										</div>

										{/* Sucursal */}
										<div>
											<Label htmlFor='branch_id'>Sucursal</Label>
											<SelectReact
												name='branch_id'
												options={branchOptions}
												value={branchOptions.find(option => option.value === String(values.branch_id)) || null}
												onChange={(option: any) => setFieldValue('branch_id', option?.value ? Number(option.value) : null)}
												placeholder='Seleccionar sucursal...'
												isClearable
											/>
										</div>
									</div>
								</CardBody>
							</Card>
						</ModalBody>

						<ModalFooter>
							<div className='flex justify-end gap-2'>
								<Button
									variant='outline'
									onClick={() => onModeChange?.('view')}
									isDisable={isSubmitting}
								>
									<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
									Cancelar
								</Button>
								<Button
									onClick={() => {
										const formElement = document.querySelector('form');
										if (formElement) {
											formElement.requestSubmit();
										}
									}}
									isDisable={isSubmitting || isActionLoading(user.id)}
									className='min-w-[140px]'
								>
									{isSubmitting || isActionLoading(user.id) ? (
										<>
											<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4 animate-spin' />
											Guardando...
										</>
									) : (
										<>
											<Icon icon='HeroCheck' className='mr-2 h-4 w-4' />
											Guardar Cambios
										</>
									)}
								</Button>
							</div>
						</ModalFooter>
					</Form>
				)}
			</Formik>
		</Modal>
	);
}

			
