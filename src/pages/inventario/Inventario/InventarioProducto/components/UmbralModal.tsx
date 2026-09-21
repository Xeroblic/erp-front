import React from 'react';
import type { FormikProps } from 'formik';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Validation from '@/components/form/Validation';
import Button from '@/components/ui/Button';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import type { IUmbralFormValues } from '@/pages/inventario/Inventario/types';

interface IUmbralModalProps {
	isOpen: boolean;
	onClose: () => void;
	productName: string;
	formik: FormikProps<IUmbralFormValues>;
	saving: boolean;
}

/**
 * Edición del umbral crítico (§13). Es un dato del producto para toda la
 * filial, no de la sucursal: el texto lo dice para que nadie espere un
 * umbral distinto por bodega (fuera de la V1 del contrato).
 */
const UmbralModal: React.FC<IUmbralModalProps> = ({
	isOpen,
	onClose,
	productName,
	formik,
	saving,
}) => {
	const error = formik.errors.threshold;
	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={(open) => {
				if (!open) onClose();
			}}
			size='md'
			isCentered
			isStaticBackdrop={saving}>
			<ModalHeader className='border-b border-zinc-200 pb-4 dark:border-zinc-700'>
				<h2 className='text-xl font-bold text-zinc-900 dark:text-white'>
					Umbral de stock bajo
				</h2>
			</ModalHeader>
			<ModalBody>
				<form onSubmit={formik.handleSubmit} noValidate className='space-y-4'>
					<p className='text-zinc-700 dark:text-zinc-300'>
						Cuando el disponible de <strong>{productName}</strong> llegue a este número
						o menos, el producto aparece como «Bajo el umbral». Aplica a todas las
						sucursales de la empresa.
					</p>
					<div className='space-y-1'>
						<Label htmlFor='umbral-threshold'>Umbral (unidades)</Label>
						<Validation
							isValid={!error}
							isTouched={Boolean(formik.touched.threshold)}
							invalidFeedback={error}>
							<Input
								id='umbral-threshold'
								name='threshold'
								inputMode='numeric'
								placeholder='Sin umbral'
								value={formik.values.threshold}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
							/>
						</Validation>
						<p className='text-sm text-zinc-500'>
							Déjalo vacío para no recibir avisos de este producto.
						</p>
					</div>
				</form>
			</ModalBody>
			<ModalFooter className='border-t border-zinc-200 pt-4 dark:border-zinc-700'>
				<ModalFooterChild>
					<Button variant='outline' onClick={onClose} isDisable={saving}>
						Cancelar
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						// El botón vive en el pie, fuera del <form>: envía con Formik. Enter
						// dentro del campo sigue enviando por el submit nativo del form.
						onClick={() => formik.handleSubmit()}
						variant='solid'
						color='blue'
						isDisable={saving}
						isLoading={saving}>
						Guardar umbral
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default UmbralModal;
