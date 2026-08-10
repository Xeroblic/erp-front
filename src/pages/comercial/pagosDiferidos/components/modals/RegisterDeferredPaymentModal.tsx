import React, { useEffect } from 'react';
import { FormikProvider, type FormikProps } from 'formik';
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
import DeferredPaymentField from '../parts/DeferredPaymentField';

interface RegisterDeferredPaymentModalProps {
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	formik: FormikProps<DeferredPaymentActionFormValues>;
	busy: boolean;
	error: string | null;
}
const RegisterDeferredPaymentModal: React.FC<RegisterDeferredPaymentModalProps> = ({
	isOpen,
	setIsOpen,
	formik,
	busy,
	error,
}) => {
	const guardClose: React.Dispatch<React.SetStateAction<boolean>> = (next) => {
		if (!busy) setIsOpen(next);
	};
	const { resetForm } = formik;
	useEffect(() => () => resetForm(), [resetForm]);
	return (
		<Modal isOpen={isOpen} setIsOpen={guardClose} isCentered size='sm' isStaticBackdrop={busy}>
			<ModalHeader>Registrar abono</ModalHeader>
			<ModalBody>
				<FormikProvider value={formik}>
					<form
						id='deferred-payment-action-form'
						className='space-y-4'
						onSubmit={formik.handleSubmit}>
						{error && (
							<Alert
								color='red'
								variant='outline'
								icon='HeroExclamationTriangle'
								title='No se pudo completar la operación'>
								{error}
							</Alert>
						)}
						<div>
							<Label htmlFor='amount'>Monto (CLP)</Label>
							<DeferredPaymentField name='amount'>
								{({ error: fieldError, isTouched, isValid }) => (
									<Input
										id='amount'
										name='amount'
										type='number'
										min='1'
										step='1'
										value={formik.values.amount}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										disabled={busy}
										isValid={isValid}
										isTouched={isTouched}
										invalidFeedback={fieldError}
									/>
								)}
							</DeferredPaymentField>
						</div>
						<div>
							<Label htmlFor='paid_at'>Fecha del abono</Label>
							<DeferredPaymentField name='paid_at'>
								{({ error: fieldError, isTouched, isValid }) => (
									<DateInput
										id='paid_at'
										name='paid_at'
										value={formik.values.paid_at}
										placeholder='dd-mm-aaaa'
										maxYear={new Date().getFullYear()}
										maxDate={new Date()}
										disabled={busy}
										isValid={isValid}
										isTouched={isTouched}
										invalidFeedback={fieldError}
										onChange={formik.handleChange}
										onBlur={() => {
											formik
												.setFieldTouched('paid_at', true)
												.catch(() => undefined);
										}}
									/>
								)}
							</DeferredPaymentField>
						</div>
						<div>
							<Label htmlFor='method'>Método</Label>
							<DeferredPaymentField name='method'>
								{({ error: fieldError, isTouched, isValid }) => (
									<Select
										id='method'
										name='method'
										value={formik.values.method}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										disabled={busy}
										isValid={isValid}
										isTouched={isTouched}
										invalidFeedback={fieldError}>
										<option value='transfer'>Transferencia</option>
										<option value='bank_card'>Tarjetas bancarias</option>
										<optgroup label='Otros medios de pago'>
											<option value='deposit'>Depósito</option>
											<option value='check'>Cheque</option>
											<option value='cash'>Efectivo</option>
											<option value='other'>Otro</option>
										</optgroup>
									</Select>
								)}
							</DeferredPaymentField>
						</div>
						<div>
							<Label htmlFor='notes'>Nota (opcional)</Label>
							<DeferredPaymentField name='notes'>
								{({ error: fieldError, isTouched, isValid }) => (
									<Textarea
										id='notes'
										name='notes'
										value={formik.values.notes ?? ''}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										disabled={busy}
										rows={3}
										isValid={isValid}
										isTouched={isTouched}
										invalidFeedback={fieldError}
									/>
								)}
							</DeferredPaymentField>
							<p className='mt-1 text-xs text-zinc-500'>
								La nota no se puede editar después. Para corregir un abono, anúlalo
								y vuelve a registrarlo.
							</p>
						</div>
						<div>
							<Label htmlFor='receipt'>Comprobante (opcional)</Label>
							<DeferredPaymentField name='receipt'>
								{({ error: fieldError, isTouched, isValid }) => (
									<Input
										id='receipt'
										name='receipt'
										type='file'
										accept={DEFERRED_PAYMENT_RECEIPT_ACCEPT}
										disabled={busy}
										isValid={isValid}
										isTouched={isTouched}
										invalidFeedback={fieldError}
										onBlur={formik.handleBlur}
										onChange={(event) => {
											formik
												.setFieldValue(
													'receipt',
													event.currentTarget.files?.[0] ?? null,
												)
												.catch(() => undefined);
											formik
												.setFieldTouched('receipt', true)
												.catch(() => undefined);
										}}
									/>
								)}
							</DeferredPaymentField>
							<p className='mt-1 text-xs text-zinc-500'>
								PDF, JPG, PNG, WEBP, XLS o XLSX; máximo 10 MB.
							</p>
						</div>
					</form>
				</FormikProvider>
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
						isDisable={busy}
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
