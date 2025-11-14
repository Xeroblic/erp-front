// import React, { Dispatch, SetStateAction } from 'react';
// import { Formik, Form } from 'formik';
// import * as Yup from 'yup';
// import Icon from '@/components/icon/Icon';
// import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
// import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
// import Button from '@/components/ui/Button';
// import Input from '@/components/form/Input';
// import type { ICustomerSupplier } from '@/interface/customerSupplier.interface';

// type EditarClienteProps = {
// 	isOpen: boolean;
// 	setIsOpen: Dispatch<SetStateAction<boolean>>;
// 	customer: ICustomerSupplier | null;
// 	onSubmit: (values: { name: string }) => Promise<void>;
// };

// const validationSchema = Yup.object({
// 	name: Yup.string()
// 		.required('El nombre es requerido')
// 		.min(2, 'El nombre debe tener al menos 2 caracteres')
// 		.max(255, 'El nombre no puede exceder 255 caracteres'),
// });

// const EditarCliente: React.FC<EditarClienteProps> = ({ isOpen, setIsOpen, customer, onSubmit }) => {
// 	if (!customer) return null;

// 	return (
// 		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
// 			<ModalHeader>
// 				<div className='flex items-center space-x-3'>
// 					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-100'>
// 						<Icon icon='HeroPencilSquare' className='h-6 w-6 text-amber-600' />
// 					</div>
// 					<div>
// 						<h2 className='text-xl font-bold text-gray-900'>Editar Cliente</h2>
// 						<p className='text-sm text-gray-600'>Actualiza el nombre del cliente</p>
// 					</div>
// 				</div>
// 			</ModalHeader>

// 			<Formik
// 				initialValues={{ name: customer.name }}
// 				validationSchema={validationSchema}
// 				onSubmit={async (values, { setSubmitting }) => {
// 					try {
// 						await onSubmit(values);
// 						setIsOpen(false);
// 					} catch (error) {
// 						console.error('Error al editar cliente:', error);
// 					} finally {
// 						setSubmitting(false);
// 					}
// 				}}>
// 				{({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
// 					<Form>
// 						<ModalBody>
// 							<Card>
// 								<CardHeader>
// 									<CardTitle>Información del Cliente</CardTitle>
// 								</CardHeader>
// 								<CardBody className='space-y-4'>
// 									<div>
// 										<label
// 											htmlFor='name'
// 											className='mb-2 block text-sm font-medium text-gray-700'>
// 											Nombre <span className='text-red-500'>*</span>
// 										</label>
// 										<Input
// 											id='name'
// 											name='name'
// 											type='text'
// 											placeholder='Ej: Acme Corporation'
// 											value={values.name}
// 											onChange={handleChange}
// 											onBlur={handleBlur}
// 											className={
// 												touched.name && errors.name ? 'border-red-500' : ''
// 											}
// 										/>
// 										{touched.name && errors.name && (
// 											<p className='mt-1 text-sm text-red-600'>
// 												{errors.name}
// 											</p>
// 										)}
// 									</div>
// 								</CardBody>
// 							</Card>
// 						</ModalBody>

// 						<ModalFooter>
// 							<div className='flex justify-end space-x-2'>
// 								<Button
// 									variant='outline'
// 									onClick={() => setIsOpen(false)}
// 									isDisable={isSubmitting}>
// 									Cancelar
// 								</Button>
// 								<Button
// 									onClick={() => {}}
// 									color='amber'
// 									isLoading={isSubmitting}
// 									isDisable={isSubmitting}>
// 									Guardar Cambios
// 								</Button>
// 							</div>
// 						</ModalFooter>
// 					</Form>
// 				)}
// 			</Formik>
// 		</Modal>
// 	);
// };

// export default EditarCliente;
