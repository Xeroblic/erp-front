import React from 'react';
import { Formik, Form, FormikHelpers } from 'formik';
import * as yup from 'yup';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Label from '@/components/form/Label';
import FieldWrap from '@/components/form/FieldWrap';
import { SystemParameter, SystemParameterCreate, SystemParameterUpdate } from '@/interface';

interface CreateEditSystemParameterModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: SystemParameterCreate | SystemParameterUpdate) => void;
	parameter?: SystemParameter;
	isLoading?: boolean;
}

// Esquema de validación con Yup
const validationSchema = yup.object().shape({
	key: yup
		.string()
		.required('La clave es requerida')
		.min(3, 'La clave debe tener al menos 3 caracteres')
		.matches(
			/^[a-zA-Z0-9._-]+$/,
			'Solo se permiten letras, números, puntos, guiones y guiones bajos',
		),
	value: yup.string().required('El valor es requerido'),
	description: yup
		.string()
		.required('La descripción es requerida')
		.min(10, 'La descripción debe tener al menos 10 caracteres'),
	category: yup
		.string()
		.required('La categoría es requerida')
		.oneOf(['general', 'system', 'email', 'security', 'integration', 'ui', 'business']),
	data_type: yup
		.string()
		.required('El tipo de dato es requerido')
		.oneOf(['string', 'number', 'boolean', 'json', 'date']),
	is_editable: yup.boolean(),
	is_visible: yup.boolean(),
	default_value: yup.string(),
	validation_rules: yup.string(),
});

type FormData = yup.InferType<typeof validationSchema>;

const CreateEditSystemParameterModal: React.FC<CreateEditSystemParameterModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	parameter,
	isLoading = false,
}) => {
	const isEditing = !!parameter;

	// Valores iniciales del formulario
	const initialValues: FormData = {
		key: parameter?.key || '',
		value: parameter?.value || '',
		description: parameter?.description || '',
		category: parameter?.category || 'general',
		data_type: parameter?.data_type || 'string',
		is_editable: parameter?.is_editable ?? true,
		is_visible: parameter?.is_visible ?? true,
		default_value: parameter?.default_value || '',
		validation_rules: parameter?.validation_rules || '',
	};

	const handleSubmit = (values: FormData, helpers: FormikHelpers<FormData>) => {
		try {
			// Convertir tipos según sea necesario
			const data = {
				...values,
				category: values.category as SystemParameter['category'],
				data_type: values.data_type as SystemParameter['data_type'],
			};

			onSubmit(data);
			helpers.setSubmitting(false);
			onClose();
		} catch (error) {
			console.error('Error al enviar formulario:', error);
			helpers.setSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='lg'>
			<ModalHeader>{isEditing ? 'Editar Parámetro' : 'Crear Parámetro'}</ModalHeader>

			<Formik
				initialValues={initialValues}
				validationSchema={validationSchema}
				onSubmit={handleSubmit}
				enableReinitialize>
				{({ values, errors, touched, setFieldValue, isSubmitting }) => (
					<Form>
						<ModalBody className='space-y-4'>
							{/* Clave del parámetro */}
							<div className='space-y-2'>
								<Label htmlFor='key'>Clave *</Label>
								<Input
									id='key'
									name='key'
									placeholder='ej: app.name, security.session_timeout'
									value={values.key}
									onChange={(e) => setFieldValue('key', e.target.value)}
									disabled={isEditing} // No editable en modo edición
								/>
								{errors.key && touched.key && (
									<div className='mt-1 text-sm text-red-500'>{errors.key}</div>
								)}
							</div>

							{/* Valor */}
							<div className='space-y-2'>
								<Label htmlFor='value'>Valor *</Label>
								<Input
									id='value'
									name='value'
									placeholder='Valor del parámetro'
									value={values.value}
									onChange={(e) => setFieldValue('value', e.target.value)}
								/>
								{errors.value && touched.value && (
									<div className='mt-1 text-sm text-red-500'>{errors.value}</div>
								)}
							</div>

							{/* Descripción */}
							<div className='space-y-2'>
								<Label htmlFor='description'>Descripción *</Label>
								<Textarea
									id='description'
									name='description'
									placeholder='Descripción del parámetro y su propósito'
									value={values.description}
									onChange={(e) => setFieldValue('description', e.target.value)}
									rows={3}
								/>
								{errors.description && touched.description && (
									<div className='mt-1 text-sm text-red-500'>
										{errors.description}
									</div>
								)}
							</div>

							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								{/* Categoría */}
								<div className='space-y-2'>
									<Label htmlFor='category'>Categoría *</Label>
									<Select
										id='category'
										name='category'
										value={values.category}
										onChange={(e) => setFieldValue('category', e.target.value)}>
										<option value='general'>General</option>
										<option value='system'>Sistema</option>
										<option value='email'>Email</option>
										<option value='security'>Seguridad</option>
										<option value='integration'>Integración</option>
										<option value='ui'>Interfaz</option>
										<option value='business'>Negocio</option>
									</Select>
									{errors.category && touched.category && (
										<div className='mt-1 text-sm text-red-500'>
											{errors.category}
										</div>
									)}
								</div>

								{/* Tipo de Dato */}
								<div className='space-y-2'>
									<Label htmlFor='data_type'>Tipo de Dato *</Label>
									<Select
										id='data_type'
										name='data_type'
										value={values.data_type}
										onChange={(e) =>
											setFieldValue('data_type', e.target.value)
										}>
										<option value='string'>Texto</option>
										<option value='number'>Número</option>
										<option value='boolean'>Booleano</option>
										<option value='json'>JSON</option>
										<option value='date'>Fecha</option>
									</Select>
									{errors.data_type && touched.data_type && (
										<div className='mt-1 text-sm text-red-500'>
											{errors.data_type}
										</div>
									)}
								</div>
							</div>

							{/* Valor por defecto */}
							<div className='space-y-2'>
								<Label htmlFor='default_value'>Valor por Defecto</Label>
								<Input
									id='default_value'
									name='default_value'
									placeholder='Valor por defecto (opcional)'
									value={values.default_value || ''}
									onChange={(e) => setFieldValue('default_value', e.target.value)}
								/>
							</div>

							{/* Reglas de validación */}
							<div className='space-y-2'>
								<Label htmlFor='validation_rules'>Reglas de Validación</Label>
								<Input
									id='validation_rules'
									name='validation_rules'
									placeholder='ej: required|min:8|max:255'
									value={values.validation_rules || ''}
									onChange={(e) =>
										setFieldValue('validation_rules', e.target.value)
									}
								/>
								<div className='mt-1 text-xs text-gray-500'>
									Formato Laravel: required, min:n, max:n, email, numeric, etc.
								</div>
							</div>

							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								{/* Es Editable */}
								<div className='space-y-2'>
									<div className='flex items-center space-x-2'>
										<input
											type='checkbox'
											id='is_editable'
											checked={values.is_editable}
											onChange={(e) =>
												setFieldValue('is_editable', e.target.checked)
											}
											className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
										/>
										<Label htmlFor='is_editable'>Es Editable</Label>
									</div>
									<div className='text-xs text-gray-500'>
										Permite que los usuarios puedan modificar este parámetro
									</div>
								</div>

								{/* Es Visible */}
								<div className='space-y-2'>
									<div className='flex items-center space-x-2'>
										<input
											type='checkbox'
											id='is_visible'
											checked={values.is_visible}
											onChange={(e) =>
												setFieldValue('is_visible', e.target.checked)
											}
											className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
										/>
										<Label htmlFor='is_visible'>Es Visible</Label>
									</div>
									<div className='text-xs text-gray-500'>
										Muestra este parámetro en la interfaz de usuario
									</div>
								</div>
							</div>
						</ModalBody>

						<ModalFooter>
							<Button
								variant='outline'
								onClick={onClose}
								isDisable={isSubmitting || isLoading}>
								Cancelar
							</Button>
							<Button
								icon='HeroCheck'
								isLoading={isSubmitting || isLoading}
								isDisable={isSubmitting || isLoading}>
								{isEditing ? 'Actualizar' : 'Crear'} Parámetro
							</Button>
						</ModalFooter>
					</Form>
				)}
			</Formik>
		</Modal>
	);
};

export default CreateEditSystemParameterModal;
