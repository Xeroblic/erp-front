import React, { useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/form/Checkbox';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import type {
	IDeferredPaymentCreditProfileListItem,
	UpdateDeferredPaymentCreditProfilePayload,
} from '@/interface/deferredPayments.interface';
import deferredPaymentsService from '@/services/deferredPaymentsService';
import getApiErrorMessage from '@/utils/apiError.utils';
import { CreditProfileSchema, toCreditProfileFormValues } from '../types';

interface CreditProfileEditModalProps {
	profile: IDeferredPaymentCreditProfileListItem | null;
	subsidiaryId: number | null;
	branchId: number | null;
	onClose: () => void;
	onSaved: () => void;
}

const CreditProfileEditModal: React.FC<CreditProfileEditModalProps> = ({
	profile,
	subsidiaryId,
	branchId,
	onClose,
	onSaved,
}) => {
	const [saveError, setSaveError] = useState<string | null>(null);
	const initialValues = useMemo(
		() => (profile ? toCreditProfileFormValues(profile) : null),
		[profile],
	);
	const formik = useFormik({
		enableReinitialize: true,
		initialValues: initialValues ?? {
			is_active: true,
			payment_term_days: '30',
			credit_limit: '',
			notes: '',
		},
		validationSchema: CreditProfileSchema,
		onSubmit: async (values) => {
			if (profile === null || subsidiaryId === null) return;
			setSaveError(null);
			const payload: UpdateDeferredPaymentCreditProfilePayload = {
				is_active: values.is_active,
				payment_term_days: Number(values.payment_term_days),
				credit_limit: values.credit_limit.trim() || null,
				notes: values.notes.trim() || null,
			};
			try {
				await deferredPaymentsService.updateCreditProfile(
					subsidiaryId,
					profile.customer_sale_id,
					payload,
				);
				toast.success('Condiciones de crédito guardadas correctamente');
				onSaved();
				onClose();
			} catch (error: unknown) {
				const message = getApiErrorMessage(
					error,
					'No se pudieron guardar las condiciones de crédito',
				);
				setSaveError(message);
				toast.error(message);
			}
		},
	});

	useEffect(() => {
		setSaveError(null);
	}, [profile]);
	const paymentTermError = formik.touched.payment_term_days
		? formik.errors.payment_term_days
		: undefined;
	const creditLimitError = formik.touched.credit_limit ? formik.errors.credit_limit : undefined;
	const guardClose = (nextState: React.SetStateAction<boolean>) => {
		const open = typeof nextState === 'function' ? nextState(profile !== null) : nextState;
		if (!open && !formik.isSubmitting) onClose();
	};

	return (
		<Modal
			isOpen={profile !== null}
			setIsOpen={guardClose}
			size='md'
			isCentered
			isStaticBackdrop={formik.isSubmitting}>
			<ModalHeader>Editar condiciones de crédito</ModalHeader>
			<ModalBody>
				<form
					id='credit-profile-edit-form'
					className='space-y-4'
					onSubmit={formik.handleSubmit}>
					{saveError && (
						<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
							{saveError}
						</Alert>
					)}
					<Checkbox
						id='portfolio-credit-profile-active'
						variant='switch'
						checked={formik.values.is_active}
						label={formik.values.is_active ? 'Crédito vigente' : 'Crédito suspendido'}
						onChange={(event) =>
							formik.setFieldValue('is_active', event.target.checked)
						}
					/>
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
						<div>
							<Label htmlFor='portfolio-credit-profile-term'>
								Plazo de pago (días)
							</Label>
							<Input
								id='portfolio-credit-profile-term'
								name='payment_term_days'
								type='number'
								min='1'
								max='32767'
								value={formik.values.payment_term_days}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								isTouched={formik.touched.payment_term_days}
								isValid={!paymentTermError}
								invalidFeedback={paymentTermError}
							/>
						</div>
						<div>
							<Label htmlFor='portfolio-credit-profile-limit'>Cupo de crédito</Label>
							<Input
								id='portfolio-credit-profile-limit'
								name='credit_limit'
								inputMode='numeric'
								value={formik.values.credit_limit}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								isTouched={formik.touched.credit_limit}
								isValid={!creditLimitError}
								invalidFeedback={creditLimitError}
								placeholder='Sin techo'
							/>
						</div>
					</div>
					<div>
						<Label htmlFor='portfolio-credit-profile-notes'>Notas</Label>
						<Textarea
							id='portfolio-credit-profile-notes'
							name='notes'
							rows={3}
							value={formik.values.notes}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</div>
				</form>
			</ModalBody>
			<ModalFooter>
				<Button variant='outline' onClick={onClose} isDisable={formik.isSubmitting}>
					Cancelar
				</Button>
				<ProtectedButton
					permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.UPDATE}
					branchId={branchId}
					subsidiaryId={subsidiaryId}
					scope='access'
					variant='solid'
					color='blue'
					type='button'
					onClick={() => formik.submitForm()}
					isLoading={formik.isSubmitting}
					isDisable={formik.isSubmitting}>
					Guardar condiciones
				</ProtectedButton>
			</ModalFooter>
		</Modal>
	);
};

export default CreditProfileEditModal;
