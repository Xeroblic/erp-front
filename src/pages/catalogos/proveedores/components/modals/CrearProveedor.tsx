import React, { useMemo } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import { useAppSelector } from '@/store';
import Select from '@/components/form/Select';

interface CrearProveedorProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	onSubmit: (values: { name: string; subsidiaryId: number }) => Promise<void>;
	defaultSubsidiaryId?: number | null;
}

const validationSchema = Yup.object().shape({
	name: Yup.string().required('El nombre es requerido').min(3, 'Mínimo 3 caracteres'),
	subsidiaryId: Yup.number()
		.required('Debes seleccionar una subsidiaria')
		.min(1, 'Selecciona una subsidiaria válida'),
});

const CrearProveedor: React.FC<CrearProveedorProps> = ({
	isOpen,
	setIsOpen,
	onSubmit,
	defaultSubsidiaryId,
}) => {
	const currentUser = useAppSelector((state) => state.auth.user);

	// Obtener subsidiarias donde el usuario tiene acceso de escritura
	const accessibleSubsidiaries = useMemo(() => {
		const subsidiaries = (currentUser as any)?.access?.subsidiaries || [];
		return subsidiaries.map((sub: any) => ({
			value: sub.id,
			label: sub.name,
		}));
	}, [currentUser]);

	return (
		<Modal isOpen={isOpen} setIsOpen={() => setIsOpen(false)}>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20'>
						<Icon
							icon='HeroTruck'
							className='h-6 w-6 text-orange-600 dark:text-orange-400'
						/>
					</div>
					<div>
						<h2 className='text-xl font-semibold'>Nuevo Proveedor</h2>
						<p className='text-sm text-gray-600 dark:text-gray-400'>
							Registra un nuevo proveedor
						</p>
					</div>
				</div>
			</ModalHeader>

			<ModalBody>
				<Formik
					initialValues={{
						name: '',
						subsidiaryId: defaultSubsidiaryId || 0,
					}}
					validationSchema={validationSchema}
					onSubmit={async (values, { resetForm }) => {
						await onSubmit(values);
						resetForm();
					}}
					enableReinitialize>
					{({ values, errors, touched, handleSubmit, setFieldValue }) => (
						<Form id='create-supplier-form' onSubmit={handleSubmit}>
							<Card>
								<CardHeader>
									<CardHeaderChild>
										<CardTitle>Información Básica</CardTitle>
									</CardHeaderChild>
								</CardHeader>
								<CardBody>
									<div className='space-y-4'>
										<div>
											<label
												htmlFor='subsidiaryId'
												className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Subsidiaria *
											</label>
											<Select
												id='subsidiaryId'
												name='subsidiaryId'
												value={values.subsidiaryId}
												onChange={(e) =>
													setFieldValue(
														'subsidiaryId',
														Number(e.target.value),
													)
												}
												placeholder='Selecciona una subsidiaria'>
												<option value={0} disabled>
													-- Selecciona una subsidiaria --
												</option>
												{accessibleSubsidiaries.map(
													(sub: { value: number; label: string }) => (
														<option key={sub.value} value={sub.value}>
															{sub.label}
														</option>
													),
												)}
											</Select>
											{touched.subsidiaryId && errors.subsidiaryId && (
												<p className='mt-1 text-sm text-red-600 dark:text-red-400'>
													{errors.subsidiaryId}
												</p>
											)}
										</div>

										<div>
											<label
												htmlFor='name'
												className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Nombre del Proveedor *
											</label>
											<Input
												id='name'
												name='name'
												type='text'
												placeholder='Ej: Proveedor Global S.A.S.'
												value={values.name}
												onChange={(e) =>
													setFieldValue('name', e.target.value)
												}
											/>
											{touched.name && errors.name && (
												<p className='mt-1 text-sm text-red-600 dark:text-red-400'>
													{errors.name}
												</p>
											)}
										</div>
									</div>
								</CardBody>
							</Card>
						</Form>
					)}
				</Formik>
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' onClick={() => setIsOpen(false)}>
						Cancelar
					</Button>
					<Button
						color='amber'
						onClick={() => {
							const form = document.getElementById(
								'create-supplier-form',
							) as HTMLFormElement | null;
							if (form) {
								form.dispatchEvent(
									new Event('submit', { bubbles: true, cancelable: true }),
								);
							}
						}}>
						Crear Proveedor
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default CrearProveedor;
