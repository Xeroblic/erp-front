// /**
//  * EJEMPLOS DE USO DEL UserBranchSelector
//  *
//  * Este archivo contiene ejemplos de cómo usar el componente UserBranchSelector
//  * en diferentes escenarios comunes.
//  */

// import React, { useState } from 'react';
// import { useFormik } from 'formik';
// import * as Yup from 'yup';
// import UserBranchSelector from './UserBranchSelector';
// import Button from '@/components/ui/Button';
// import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';

// // ============================================================================
// // EJEMPLO 1: Uso básico con useState
// // ============================================================================
// export const BasicExample = () => {
// 	const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
// 	const currentUserId = 123; // ID del usuario actual

// 	return (
// 		<div>
// 			<UserBranchSelector
// 				userId={currentUserId}
// 				value={selectedBranchId}
// 				onChange={(branchId) => {
// 					console.log('Branch seleccionada:', branchId);
// 					setSelectedBranchId(branchId);
// 				}}
// 				label="Selecciona una Sucursal"
// 				placeholder="-- Selecciona --"
// 				required
// 			/>

// 			{selectedBranchId && (
// 				<p className='mt-2 text-sm text-green-600'>
// 					Branch ID seleccionada: {selectedBranchId}
// 				</p>
// 			)}
// 		</div>
// 	);
// };

// // ============================================================================
// // EJEMPLO 2: Con Formik (Recomendado para formularios)
// // ============================================================================
// interface ProductFormValues {
// 	name: string;
// 	branch_id: number | null;
// 	price: number;
// }

// export const FormikExample = () => {
// 	const currentUserId = 123; // Obtener del contexto de auth

// 	const formik = useFormik<ProductFormValues>({
// 		initialValues: {
// 			name: '',
// 			branch_id: null,
// 			price: 0,
// 		},
// 		validationSchema: Yup.object({
// 			name: Yup.string().required('El nombre es requerido'),
// 			branch_id: Yup.number().required('Debe seleccionar una sucursal').nullable(),
// 			price: Yup.number().required('El precio es requerido').min(0),
// 		}),
// 		onSubmit: async (values) => {
// 			console.log('Formulario enviado:', values);
// 			// Aquí hacer el POST/PUT con values.branch_id
// 		},
// 	});

// 	return (
// 		<form onSubmit={formik.handleSubmit}>
// 			<Card>
// 				<CardHeader>
// 					<CardTitle>Crear Producto</CardTitle>
// 				</CardHeader>
// 				<CardBody className='space-y-4'>
// 					{/* Campo de nombre */}
// 					<div>
// 						<label>Nombre del Producto</label>
// 						<input
// 							name='name'
// 							value={formik.values.name}
// 							onChange={formik.handleChange}
// 							onBlur={formik.handleBlur}
// 						/>
// 						{formik.touched.name && formik.errors.name && (
// 							<p className='text-red-500'>{formik.errors.name}</p>
// 						)}
// 					</div>

// 					{/* Selector de Branch */}
// 					<UserBranchSelector
// 						userId={currentUserId}
// 						name='branch_id'
// 						value={formik.values.branch_id}
// 						onChange={(branchId) => formik.setFieldValue('branch_id', branchId)}
// 						label='Sucursal'
// 						placeholder='Selecciona una sucursal'
// 						required
// 					/>
// 					{formik.touched.branch_id && formik.errors.branch_id && (
// 						<p className='text-sm text-red-500'>{formik.errors.branch_id}</p>
// 					)}

// 					{/* Botón submit */}
// 					<Button type='submit' color='blue' isDisable={formik.isSubmitting}>
// 						{formik.isSubmitting ? 'Guardando...' : 'Guardar Producto'}
// 					</Button>
// 				</CardBody>
// 			</Card>
// 		</form>
// 	);
// };

// // ============================================================================
// // EJEMPLO 3: En un Modal de Edición
// // ============================================================================
// interface EditModalProps {
// 	isOpen: boolean;
// 	onClose: () => void;
// 	productId: number;
// 	currentUserId: number;
// }

// export const EditModalExample: React.FC<EditModalProps> = ({
// 	isOpen,
// 	onClose,
// 	productId,
// 	currentUserId,
// }) => {
// 	const formik = useFormik({
// 		initialValues: {
// 			name: 'Producto Ejemplo',
// 			branch_id: 5, // Branch inicial del producto
// 		},
// 		onSubmit: async (values) => {
// 			// PUT /products/{productId}
// 			await fetch(`/api/products/${productId}`, {
// 				method: 'PUT',
// 				body: JSON.stringify({
// 					name: values.name,
// 					branch_id: values.branch_id, // Enviar el ID de la branch
// 				}),
// 			});
// 			onClose();
// 		},
// 	});

// 	if (!isOpen) return null;

// 	return (
// 		<div className='modal'>
// 			<h2>Editar Producto</h2>
// 			<form onSubmit={formik.handleSubmit}>
// 				<UserBranchSelector
// 					userId={currentUserId}
// 					value={formik.values.branch_id}
// 					onChange={(branchId) => formik.setFieldValue('branch_id', branchId)}
// 					label='Cambiar Sucursal'
// 					required
// 				/>
// 				<Button type='submit'>Guardar Cambios</Button>
// 			</form>
// 		</div>
// 	);
// };

// // ============================================================================
// // EJEMPLO 4: Con múltiples usuarios (Admin asignando a empleados)
// // ============================================================================
// export const AdminAssignExample = () => {
// 	const [selectedUserId, setSelectedUserId] = useState<number>(1);
// 	const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

// 	const users = [
// 		{ id: 1, name: 'Juan Pérez' },
// 		{ id: 2, name: 'María García' },
// 		{ id: 3, name: 'Pedro López' },
// 	];

// 	return (
// 		<Card>
// 			<CardHeader>
// 				<CardTitle>Asignar Producto a Usuario</CardTitle>
// 			</CardHeader>
// 			<CardBody className='space-y-4'>
// 				{/* Selector de usuario */}
// 				<div>
// 					<label>Seleccionar Usuario</label>
// 					<select
// 						value={selectedUserId}
// 						onChange={(e) => {
// 							setSelectedUserId(Number(e.target.value));
// 							setSelectedBranchId(null); // Reset branch al cambiar usuario
// 						}}>
// 						{users.map((user) => (
// 							<option key={user.id} value={user.id}>
// 								{user.name}
// 							</option>
// 						))}
// 					</select>
// 				</div>

// 				{/* Selector de branch según usuario seleccionado */}
// 				<UserBranchSelector
// 					userId={selectedUserId}
// 					value={selectedBranchId}
// 					onChange={setSelectedBranchId}
// 					label='Sucursal del Usuario'
// 					placeholder='Las sucursales disponibles para este usuario'
// 				/>

// 				<Button
// 					onClick={() => {
// 						console.log('Asignar a:', { selectedUserId, selectedBranchId });
// 					}}
// 					isDisable={!selectedBranchId}>
// 					Asignar Producto
// 				</Button>
// 			</CardBody>
// 		</Card>
// 	);
// };

// // ============================================================================
// // EJEMPLO 5: Con filtrado condicional
// // ============================================================================
// export const ConditionalExample = () => {
// 	const [userType, setUserType] = useState<'admin' | 'employee'>('employee');
// 	const [userId, setUserId] = useState<number>(123);
// 	const [branchId, setBranchId] = useState<number | null>(null);

// 	return (
// 		<div className='space-y-4'>
// 			<div>
// 				<label>Tipo de Usuario</label>
// 				<select value={userType} onChange={(e) => setUserType(e.target.value as any)}>
// 					<option value='admin'>Admin (todas las branches)</option>
// 					<option value='employee'>Empleado (branches limitadas)</option>
// 				</select>
// 			</div>

// 			{userType === 'employee' && (
// 				<UserBranchSelector
// 					userId={userId}
// 					value={branchId}
// 					onChange={setBranchId}
// 					label='Sucursales Disponibles'
// 					placeholder='Solo tus sucursales'
// 				/>
// 			)}

// 			{userType === 'admin' && (
// 				<div className='text-sm text-gray-500'>
// 					Como admin, tienes acceso a todas las sucursales del sistema
// 				</div>
// 			)}
// 		</div>
// 	);
// };

// // ============================================================================
// // EJEMPLO 6: Integración completa en CreateEditProductModal
// // ============================================================================
// export const CreateProductModalIntegration = () => {
// 	const currentUser = { id: 123, name: 'Usuario Actual' }; // Obtener del useAuth()

// 	const formik = useFormik({
// 		initialValues: {
// 			name: '',
// 			description: '',
// 			sku: '',
// 			price: 0,
// 			branch_id: null as number | null, // ID de la branch seleccionada
// 		},
// 		validationSchema: Yup.object({
// 			name: Yup.string().required('Nombre requerido'),
// 			branch_id: Yup.number().required('Debe seleccionar una sucursal').nullable(),
// 		}),
// 		onSubmit: async (values) => {
// 			// POST a la API con el branch_id
// 			const response = await fetch('/api/products', {
// 				method: 'POST',
// 				headers: { 'Content-Type': 'application/json' },
// 				body: JSON.stringify({
// 					name: values.name,
// 					description: values.description,
// 					sku: values.sku,
// 					price: values.price,
// 					branch_id: values.branch_id, // ← Enviar el ID de la branch
// 				}),
// 			});

// 			if (response.ok) {
// 				alert('Producto creado exitosamente');
// 				formik.resetForm();
// 			}
// 		},
// 	});

// 	return (
// 		<form onSubmit={formik.handleSubmit} className='space-y-6'>
// 			<h2 className='text-2xl font-bold'>Crear Nuevo Producto</h2>

// 			{/* Selector de Sucursal */}
// 			<UserBranchSelector
// 				userId={currentUser.id}
// 				name='branch_id'
// 				value={formik.values.branch_id}
// 				onChange={(branchId) => {
// 					formik.setFieldValue('branch_id', branchId);
// 					console.log('Branch ID seleccionada:', branchId);
// 				}}
// 				label='Sucursal *'
// 				placeholder='Selecciona la sucursal para este producto'
// 				required
// 				showError
// 			/>

// 			{/* Mostrar error de validación de Formik */}
// 			{formik.touched.branch_id && formik.errors.branch_id && (
// 				<div className='text-sm text-red-600'>{formik.errors.branch_id}</div>
// 			)}

// 			{/* Otros campos del formulario... */}

// 			<div className='flex gap-3'>
// 				<Button type='submit' color='blue' isDisable={!formik.isValid}>
// 					Crear Producto
// 				</Button>
// 				<Button type='button' variant='outline' onClick={() => formik.resetForm()}>
// 					Cancelar
// 				</Button>
// 			</div>
// 		</form>
// 	);
// };
