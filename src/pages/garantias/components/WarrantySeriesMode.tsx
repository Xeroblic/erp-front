import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Validation from '@/components/form/Validation';
import { useAppDispatch } from '@/store';
import { toast } from '@/utils/toast.utils';
import { createWarranty } from '@/store/slices/garantias/thunks';

type WarrantySeriesModeProps = {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
	subsidiaryId?: number | null;
};

const WarrantySeriesMode: React.FC<WarrantySeriesModeProps> = ({
	isOpen,
	onClose,
	onSuccess,
	subsidiaryId,
}) => {
	const dispatch = useAppDispatch();

	const formik = useFormik({
		initialValues: { serial_number: '' },
		validationSchema: Yup.object({
			serial_number: Yup.string().trim().required('El número de serie es obligatorio'),
		}),
		onSubmit: async (values, helpers) => {
			if (!subsidiaryId) {
				toast.error('Selecciona una empresa para continuar');
				return;
			}
			try {
				await dispatch(
					createWarranty({
						subsidiaryId,
						payload: { serial_number: values.serial_number.trim() },
					}),
				).unwrap();
				toast.success('Garantía generada desde número de serie');
				helpers.resetForm();
				onSuccess?.();
				onClose();
			} catch (err: any) {
				const message =
					err?.response?.data?.message || 'No se pudo crear la garantía por serie';
				toast.error(message);
			} finally {
				helpers.setSubmitting(false);
			}
		},
	});

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='md'>
			<ModalHeader>
				<div>
					<h2 className='text-xl font-semibold text-zinc-900'>
						Crear garantía por serie
					</h2>
					<p className='text-sm text-zinc-500'>
						Ingresa el número de serie y el sistema completará los datos
						automáticamente.
					</p>
				</div>
			</ModalHeader>
			<form onSubmit={formik.handleSubmit} className='space-y-4'>
				<ModalBody>
					<Label htmlFor='serial_number' className='required'>
						Número de serie
					</Label>
					<Validation
						isValid={!formik.errors.serial_number}
						isTouched={formik.touched.serial_number}
						invalidFeedback={formik.errors.serial_number}>
						<Input
							id='serial_number'
							name='serial_number'
							placeholder='Ej: SN001234'
							value={formik.values.serial_number}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</Validation>
					<p className='mt-2 text-xs text-zinc-500'>
						La garantía se creará solo si la serie existe, está vendida y pertenece a tu
						subsidiaria.
					</p>
				</ModalBody>
				<ModalFooter className='flex items-center justify-end space-x-2'>
					<Button variant='outline' type='button' onClick={onClose}>
						Cancelar
					</Button>
					<Button type='submit' color='emerald' isLoading={formik.isSubmitting}>
						Crear desde serie
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default WarrantySeriesMode;
