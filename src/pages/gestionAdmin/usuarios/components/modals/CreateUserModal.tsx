import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import FieldWrap from '@/components/form/FieldWrap';
import SelectReact from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import { useUsersManagement } from '../../hooks/useUsersManagement';

interface CreateUserModalProps {
	isOpen: boolean;
	onClose: () => void;
	onUserCreated: () => void;
}

interface FormValues {
	email: string;
	first_name: string;
	second_name: string;
	last_name: string;
	second_last_name: string;
	position: string;
	rut: string;
	phone_number: string;
	custom_message: string;
	is_active: boolean;
	branch_id: string | null;
}

// Validación según los casos de uso CU004.1
const validationSchema = Yup.object({
	email: Yup.string()
		.email('El formato del correo no es válido')
		.required('El email es requerido'),
	first_name: Yup.string()
		.min(2, 'El nombre debe tener al menos 2 caracteres')
		.max(50, 'El nombre no puede exceder 50 caracteres')
		.matches(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
		.required('El nombre es requerido'),
	second_name: Yup.string()
		.nullable()
		.max(50, 'El segundo nombre no puede exceder 50 caracteres')
		.matches(
			/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]*$/,
			'El segundo nombre solo puede contener letras y espacios',
		),
	last_name: Yup.string()
		.min(2, 'El apellido debe tener al menos 2 caracteres')
		.max(50, 'El apellido no puede exceder 50 caracteres')
		.matches(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, 'El apellido solo puede contener letras y espacios')
		.required('El apellido es requerido'),
	second_last_name: Yup.string()
		.nullable()
		.max(50, 'El segundo apellido no puede exceder 50 caracteres')
		.matches(
			/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]*$/,
			'El segundo apellido solo puede contener letras y espacios',
		),
	position: Yup.string()
		.min(2, 'El cargo debe tener al menos 2 caracteres')
		.max(100, 'El cargo no puede exceder 100 caracteres')
		.required('El cargo/rol es requerido'),
	rut: Yup.string()
		.required('El RUT es requerido')
		.matches(
			/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/,
			'El formato del RUT no es válido (ej: 12.345.678-9)',
		),
	phone_number: Yup.string()
		.required('El teléfono es requerido')
		.matches(
			/^(\+569|569|9)[\d]{8}$/,
			'El número debe tener formato chileno válido (+569xxxxxxxx o 9xxxxxxxx)',
		),
	custom_message: Yup.string()
		.nullable()
		.max(500, 'El mensaje personalizado no puede exceder 500 caracteres'),
	branch_id: Yup.string().nullable(),
});

const initialValues: FormValues = {
	email: '',
	first_name: '',
	second_name: '',
	last_name: '',
	second_last_name: '',
	position: '',
	rut: '',
	phone_number: '',
	custom_message: '',
	is_active: true,
	branch_id: null,
};

// Opciones de sucursales (esto debería venir de una API o contexto)
const branchOptions = [
	{ value: '1', label: 'Sucursal Principal' },
	{ value: '2', label: 'Sucursal Norte' },
	{ value: '3', label: 'Sucursal Sur' },
];

export default function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
	const { handleCreateUser } = useUsersManagement();

	const handleSubmit = async (values: FormValues, { setSubmitting, resetForm }: any) => {
		try {
			// Formatear datos según la API
			const userData = {
				email: values.email.trim().toLowerCase(),
				first_name: values.first_name.trim(),
				second_name: values.second_name?.trim() || null,
				last_name: values.last_name.trim(),
				second_last_name: values.second_last_name?.trim() || null,
				position: values.position.trim(),
				rut: values.rut.trim(),
				phone_number: values.phone_number.trim(),
				custom_message: values.custom_message?.trim() || null,
				is_active: values.is_active,
				branch_id: values.branch_id,
				// El correo queda como "no verificado" según el caso de uso
				email_verified_at: null,
			};

			await handleCreateUser(userData);

			toast.success('Usuario creado exitosamente');
			resetForm();
			onUserCreated();
			onClose();
		} catch (error: any) {
			// El error ya es manejado en el hook
			console.error('Error al crear usuario:', error);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='xl'>
			<ModalHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroUserPlus' className='h-5 w-5' />
					<div>
						<h3 className='text-lg font-semibold'>Crear Nuevo Usuario</h3>
						<p className='text-sm text-gray-600 dark:text-gray-400'>
							Complete los datos del usuario. Los campos marcados con * son
							obligatorios.
						</p>
					</div>
				</div>
			</ModalHeader>

			<Formik
				initialValues={initialValues}
				validationSchema={validationSchema}
				onSubmit={handleSubmit}>
				{({
					values,
					errors,
					touched,
					handleChange,
					handleBlur,
					setFieldValue,
					isSubmitting,
				}) => (
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
												invalidFeedback={errors.first_name}>
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
												invalidFeedback={errors.second_name}>
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
												invalidFeedback={errors.last_name}>
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
											<Label htmlFor='second_last_name'>
												Apellido Materno
											</Label>
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
													placeholder='Ej: González'
												/>
											</FieldWrap>
										</div>
									</div>
								</CardBody>
							</Card>

							{/* Información de Contacto */}
							<Card>
								<CardHeader>
									<div className='flex items-center gap-2'>
										<Icon icon='HeroEnvelope' className='h-4 w-4' />
										<h4 className='font-medium'>Información de Contacto</h4>
									</div>
								</CardHeader>
								<CardBody className='space-y-4'>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										{/* Email */}
										<div>
											<Label htmlFor='email'>Email *</Label>
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
													placeholder='usuario@empresa.com'
												/>
											</FieldWrap>
										</div>

										{/* Teléfono */}
										<div>
											<Label htmlFor='phone_number'>Teléfono *</Label>
											<FieldWrap
												isValid={!errors.phone_number}
												isTouched={touched.phone_number}
												invalidFeedback={errors.phone_number}>
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

										{/* RUT */}
										<div>
											<Label htmlFor='rut'>RUT *</Label>
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
										</div>
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
										{/* Cargo/Rol */}
										<div>
											<Label htmlFor='position'>Cargo/Rol *</Label>
											<FieldWrap
												isValid={!errors.position}
												isTouched={touched.position}
												invalidFeedback={errors.position}>
												<Input
													id='position'
													name='position'
													value={values.position}
													onChange={handleChange}
													onBlur={handleBlur}
													placeholder='Ej: Administrador, Vendedor, Contador'
												/>
											</FieldWrap>
										</div>

										{/* Sucursal Principal (Opcional) */}
										<div>
											<Label htmlFor='branch_id'>Sucursal Principal</Label>
											<SelectReact
												name='branch_id'
												options={branchOptions}
												value={
													branchOptions.find(
														(option) =>
															option.value === values.branch_id,
													) || null
												}
												onChange={(option: any) =>
													setFieldValue(
														'branch_id',
														option?.value || null,
													)
												}
												placeholder='Seleccionar sucursal...'
												isClearable
											/>
											<p className='mt-1 text-xs text-gray-500'>
												Opcional. Puede asignarse posteriormente.
											</p>
										</div>
									</div>
								</CardBody>
							</Card>

							{/* Mensaje Personalizado */}
							<Card>
								<CardHeader>
									<div className='flex items-center gap-2'>
										<Icon icon='HeroChatBubbleLeftRight' className='h-4 w-4' />
										<h4 className='font-medium'>
											Mensaje Personalizado (Opcional)
										</h4>
									</div>
								</CardHeader>
								<CardBody>
									<FieldWrap
										isValid={!errors.custom_message}
										isTouched={touched.custom_message}
										invalidFeedback={errors.custom_message}>
										<Textarea
											id='custom_message'
											name='custom_message'
											value={values.custom_message}
											onChange={handleChange}
											onBlur={handleBlur}
											placeholder='Mensaje de bienvenida o instrucciones especiales para el usuario...'
											rows={3}
										/>
									</FieldWrap>
									<p className='mt-1 text-xs text-gray-500'>
										Este mensaje se incluirá en el correo de bienvenida al
										usuario.
									</p>
								</CardBody>
							</Card>
						</ModalBody>

						<ModalFooter>
							<div className='flex justify-end gap-2'>
								<Button
									variant='outline'
									onClick={onClose}
									isDisable={isSubmitting}>
									<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
									Cancelar
								</Button>
								<Button
									onClick={() => document.querySelector('form')?.requestSubmit()}
									isDisable={isSubmitting}
									className='min-w-[120px]'>
									{isSubmitting ? (
										<>
											<Icon
												icon='HeroArrowPath'
												className='mr-2 h-4 w-4 animate-spin'
											/>
											Creando...
										</>
									) : (
										<>
											<Icon icon='HeroCheck' className='mr-2 h-4 w-4' />
											Crear Usuario
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
