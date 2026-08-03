import React from 'react';
import type { FormikProps } from 'formik';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import DateInput from '@/components/form/DateInput';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import type { DeferredPaymentActionFormValues } from '../../types';
import { DEFERRED_PAYMENT_RECEIPT_ACCEPT } from '../../types';

interface RegisterDeferredPaymentModalProps {
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	formik: FormikProps<DeferredPaymentActionFormValues>;
	busy: boolean;
	error: string | null;
	pendingReceipt: boolean;
	onRetryReceipt: () => void;
}
const feedback = (
	formik: FormikProps<DeferredPaymentActionFormValues>,
	field: keyof DeferredPaymentActionFormValues,
) => ({
	isValid: formik.isValid,
	isTouched: Boolean(formik.touched[field]),
	invalidFeedback: typeof formik.errors[field] === 'string' ? formik.errors[field] : undefined,
});
const RegisterDeferredPaymentModal: React.FC<RegisterDeferredPaymentModalProps> = ({
	isOpen,
	setIsOpen,
	formik,
	busy,
	error,
	pendingReceipt,
	onRetryReceipt,
}) => {
	const guardClose: React.Dispatch<React.SetStateAction<boolean>> = (next) => {
		if (!busy) setIsOpen(next);
	};
	return (
		<Modal isOpen={isOpen} setIsOpen={guardClose} isCentered size='sm' isStaticBackdrop={busy}>
			<ModalHeader>Registrar abono</ModalHeader>
			<ModalBody>
				<form
					id='deferred-payment-action-form'
					className='space-y-4'
					onSubmit={formik.handleSubmit}>
					{error && (
						<Alert
							color='red'
							variant='outline'
							icon='HeroExclamationTriangle'
							title={
								pendingReceipt
									? 'Abono registrado, comprobante pendiente'
									: 'No se pudo completar la operación'
							}>
							{error}
						</Alert>
					)}
					{pendingReceipt && (
						<Button
							type='button'
							variant='outline'
							isLoading={busy}
							isDisable={busy}
							onClick={onRetryReceipt}>
							Reintentar solo comprobante
						</Button>
					)}
					<div>
						<Label htmlFor='amount'>Monto (CLP)</Label>
						<Input
							id='amount'
							name='amount'
							type='number'
							min='1'
							step='1'
							value={formik.values.amount}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={busy || pendingReceipt}
							{...feedback(formik, 'amount')}
						/>
					</div>
					<div>
						<Label htmlFor='paid_at'>Fecha del abono</Label>
						<DateInput
							id='paid_at'
							name='paid_at'
							value={formik.values.paid_at}
							placeholder='dd-mm-aaaa'
							maxYear={new Date().getFullYear()}
							maxDate={new Date()}
							disabled={busy || pendingReceipt}
							onChange={formik.handleChange}
							onBlur={() => {
								formik.setFieldTouched('paid_at', true).catch(() => undefined);
							}}
						/>
						{formik.touched.paid_at && formik.errors.paid_at && (
							<p className='mt-1 text-sm text-red-600'>{formik.errors.paid_at}</p>
						)}
					</div>
					<div>
						<Label htmlFor='method'>Método</Label>
						<Select
							id='method'
							name='method'
							value={formik.values.method}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={busy || pendingReceipt}
							{...feedback(formik, 'method')}>
							<option value='transfer'>Transferencia</option>
							<option value='deposit'>Depósito</option>
							<option value='check'>Cheque</option>
							<option value='cash'>Efectivo</option>
							<option value='other'>Otro</option>
						</Select>
					</div>
					<div>
						<Label htmlFor='notes'>Nota (opcional)</Label>
						<Textarea
							id='notes'
							name='notes'
							value={formik.values.notes ?? ''}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={busy || pendingReceipt}
							rows={3}
							{...feedback(formik, 'notes')}
						/>
						<p className='mt-1 text-xs text-zinc-500'>
							La nota no se puede editar después. Para corregir un abono, anúlalo y
							vuelve a registrarlo.
						</p>
					</div>
					<div>
						<Label htmlFor='receipt'>Comprobante (opcional)</Label>
						<Input
							id='receipt'
							name='receipt'
							type='file'
							accept={DEFERRED_PAYMENT_RECEIPT_ACCEPT}
							disabled={busy || pendingReceipt}
							onChange={(event) =>
								formik.setFieldValue(
									'receipt',
									event.currentTarget.files?.[0] ?? null,
								)
							}
						/>
						<p className='mt-1 text-xs text-zinc-500'>
							PDF, JPG, PNG, WEBP, XLS o XLSX; máximo 10 MB.
						</p>
						{formik.touched.receipt && formik.errors.receipt && (
							<p className='mt-1 text-sm text-red-600'>{formik.errors.receipt}</p>
						)}
					</div>
				</form>
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild>
					<Button
						type='button'
						variant='outline'
						isDisable={busy}
						onClick={() => guardClose(false)}>
						Cancelar
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						type='button'
						variant='solid'
						color='blue'
						isLoading={busy}
						isDisable={busy || pendingReceipt}
						onClick={() => {
							formik.submitForm().catch(() => undefined);
						}}>
						Registrar abono
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};
export default RegisterDeferredPaymentModal;
