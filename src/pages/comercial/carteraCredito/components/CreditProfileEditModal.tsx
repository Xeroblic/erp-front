/* eslint-disable import/extensions */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import type {
	IDeferredPaymentCreditProfile,
	IDeferredPaymentCreditProfileListItem,
	UpdateDeferredPaymentCreditProfilePayload,
} from '@/interface/deferredPayments.interface';
import deferredPaymentsService from '@/services/deferredPaymentsService';
import getApiErrorMessage from '@/utils/deferredPaymentsError.utils';
import { CreditProfileSchema, toCreditProfileFormValues } from '../types';

interface CreditProfileEditModalProps {
	profile: IDeferredPaymentCreditProfileListItem | null;
	subsidiaryId: number | null;
	branchId: number | null;
	onClose: () => void;
	onSaved: () => void;
	onDeleted?: () => void | Promise<void>;
}

interface IdentityBoundValue<T> {
	identity: string;
	value: T;
}

const emptyFormValues = {
	payment_term_days: '30',
	credit_limit: '',
	collection_email: '',
	notes: '',
};

const Skeleton = () => (
	<div className='animate-pulse space-y-4' aria-label='Cargando condiciones de crédito'>
		<div className='h-5 w-2/5 rounded bg-zinc-200 dark:bg-zinc-700' />
		<div className='h-10 rounded bg-zinc-200 dark:bg-zinc-700' />
		<div className='h-10 rounded bg-zinc-200 dark:bg-zinc-700' />
	</div>
);

const formatCreditLimitInput = (value: string): string => {
	if (!value) return '';
	const [wholePart, decimalPart = ''] = value.split('.');
	if (!/^\d+$/.test(wholePart) || !/^\d*$/.test(decimalPart)) return value;
	const roundedValue = BigInt(wholePart) + (decimalPart[0] >= '5' ? BigInt(1) : BigInt(0));
	return `$ ${roundedValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

const CreditProfileEditModal: React.FC<CreditProfileEditModalProps> = ({
	profile,
	subsidiaryId,
	branchId,
	onClose,
	onSaved,
	onDeleted = () => undefined,
}) => {
	const identity = `${subsidiaryId ?? 'none'}:${profile?.customer_sale_id ?? 'none'}`;
	const identityRef = useRef(identity);
	const requestIdRef = useRef(0);
	const saveRequestIdRef = useRef(0);
	const deleteRequestIdRef = useRef(0);
	const loadControllerRef = useRef<AbortController | null>(null);
	const mountedRef = useRef(true);
	const [loadedProfileState, setLoadedProfileState] = useState<
		IdentityBoundValue<IDeferredPaymentCreditProfile | null>
	>({ identity, value: null });
	const [isLoading, setIsLoading] = useState(false);
	const [loadError, setLoadError] = useState<IdentityBoundValue<string> | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	identityRef.current = identity;

	const loadedProfile =
		loadedProfileState.identity === identity ? loadedProfileState.value : null;
	const visibleLoadError = loadError?.identity === identity ? loadError.value : null;
	const initialValues = useMemo(
		() => (loadedProfile ? toCreditProfileFormValues(loadedProfile) : emptyFormValues),
		[loadedProfile],
	);

	const loadProfile = useCallback(async () => {
		if (profile === null || subsidiaryId === null) return;
		const requestIdentity = `${subsidiaryId}:${profile.customer_sale_id}`;
		const requestId = requestIdRef.current + 1;
		loadControllerRef.current?.abort();
		const controller = new AbortController();
		requestIdRef.current = requestId;
		loadControllerRef.current = controller;
		setIsLoading(true);
		setLoadError(null);
		setLoadedProfileState({ identity: requestIdentity, value: null });
		try {
			const response = await deferredPaymentsService.getCreditProfile(
				subsidiaryId,
				profile.customer_sale_id,
				controller.signal,
			);
			if (
				controller.signal.aborted ||
				!mountedRef.current ||
				requestIdentity !== identityRef.current ||
				requestId !== requestIdRef.current
			)
				return;
			setLoadedProfileState({ identity: requestIdentity, value: response });
		} catch (error: unknown) {
			if (
				controller.signal.aborted ||
				!mountedRef.current ||
				requestIdentity !== identityRef.current ||
				requestId !== requestIdRef.current
			)
				return;
			setLoadError({
				identity: requestIdentity,
				value: getApiErrorMessage(
					error,
					'No se pudieron cargar las condiciones de crédito',
				),
			});
		} finally {
			if (
				!controller.signal.aborted &&
				mountedRef.current &&
				requestIdentity === identityRef.current &&
				requestId === requestIdRef.current
			) {
				loadControllerRef.current = null;
				setIsLoading(false);
			}
		}
	}, [profile, subsidiaryId]);

	const formik = useFormik({
		enableReinitialize: true,
		initialValues,
		validationSchema: CreditProfileSchema,
		onSubmit: async (values) => {
			if (profile === null || subsidiaryId === null || loadedProfile === null) return;
			const saveIdentity = identity;
			const saveRequestId = saveRequestIdRef.current + 1;
			saveRequestIdRef.current = saveRequestId;
			setSaveError(null);
			const payload: UpdateDeferredPaymentCreditProfilePayload = {
				payment_term_days: Number(values.payment_term_days),
				credit_limit: values.credit_limit.trim() || null,
				collection_email: values.collection_email.trim() || null,
				notes: values.notes.trim() || null,
			};
			try {
				await deferredPaymentsService.updateCreditProfile(
					subsidiaryId,
					profile.customer_sale_id,
					payload,
				);
				if (
					!mountedRef.current ||
					saveIdentity !== identityRef.current ||
					saveRequestId !== saveRequestIdRef.current
				)
					return;
				toast.success('Condiciones de crédito guardadas correctamente');
				onSaved();
				onClose();
			} catch (error: unknown) {
				if (
					!mountedRef.current ||
					saveIdentity !== identityRef.current ||
					saveRequestId !== saveRequestIdRef.current
				)
					return;
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
		setDeleteError(null);
		setIsDeleteConfirmationOpen(false);
		setIsDeleting(false);
		deleteRequestIdRef.current += 1;
		if (profile === null || subsidiaryId === null) return undefined;
		loadProfile().catch(() => undefined);
		return () => {
			loadControllerRef.current?.abort();
			saveRequestIdRef.current += 1;
			deleteRequestIdRef.current += 1;
		};
	}, [loadProfile, profile, subsidiaryId]);

	useEffect(
		() => () => {
			mountedRef.current = false;
			loadControllerRef.current?.abort();
			requestIdRef.current += 1;
			saveRequestIdRef.current += 1;
			deleteRequestIdRef.current += 1;
		},
		[],
	);

	const paymentTermError = formik.touched.payment_term_days
		? formik.errors.payment_term_days
		: undefined;
	const creditLimitError = formik.touched.credit_limit ? formik.errors.credit_limit : undefined;
	const collectionEmailError = formik.touched.collection_email
		? formik.errors.collection_email
		: undefined;
	const handleCreditLimitChange = (value: string) => {
		formik.setFieldTouched('credit_limit', true, false).catch(() => undefined);
		formik.setFieldValue('credit_limit', value.replace(/\D/g, '')).catch(() => undefined);
	};
	const handleDelete = async () => {
		if (profile === null || subsidiaryId === null || isDeleting) return;
		const deleteIdentity = identity;
		const deleteRequestId = deleteRequestIdRef.current + 1;
		deleteRequestIdRef.current = deleteRequestId;
		setDeleteError(null);
		setIsDeleting(true);
		try {
			await deferredPaymentsService.deleteCreditProfile(subsidiaryId, profile.customer_sale_id);
			if (
				!mountedRef.current ||
				deleteIdentity !== identityRef.current ||
				deleteRequestId !== deleteRequestIdRef.current
			)
				return;
			const refreshResult = onDeleted();
			if (refreshResult instanceof Promise) refreshResult.catch(() => undefined);
			onClose();
		} catch (error: unknown) {
			if (
				!mountedRef.current ||
				deleteIdentity !== identityRef.current ||
				deleteRequestId !== deleteRequestIdRef.current
			)
				return;
			setDeleteError(
				getApiErrorMessage(error, 'No se pudo eliminar el perfil de crédito.'),
			);
		} finally {
			if (
				mountedRef.current &&
				deleteIdentity === identityRef.current &&
				deleteRequestId === deleteRequestIdRef.current
			)
				setIsDeleting(false);
		}
	};
	const guardClose = (nextState: React.SetStateAction<boolean>) => {
		const open = typeof nextState === 'function' ? nextState(profile !== null) : nextState;
		if (!open && !formik.isSubmitting && !isDeleting) onClose();
	};

	return (
		<Modal
			isOpen={profile !== null}
			setIsOpen={guardClose}
			size='md'
			isCentered
			isStaticBackdrop={formik.isSubmitting || isDeleting}>
			<ModalHeader>
				{isDeleteConfirmationOpen
					? 'Eliminar perfil de crédito'
					: 'Editar condiciones de crédito'}
			</ModalHeader>
			<ModalBody>
				{isLoading && <Skeleton />}
				{visibleLoadError && (
					<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
						<div className='space-y-3'>
							<p>{visibleLoadError}</p>
							<Button
								type='button'
								size='sm'
								variant='outline'
								color='red'
								onClick={() => loadProfile()}>
								Reintentar
							</Button>
						</div>
					</Alert>
				)}
				{isDeleteConfirmationOpen && loadedProfile !== null && !isLoading && (
					<div className='space-y-3'>
						{deleteError && (
							<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
								{deleteError}
							</Alert>
						)}
						<p>
							¿Quieres eliminar este perfil de crédito? Dejará de aparecer en la cartera de
							crédito.
						</p>
						<p className='text-sm text-zinc-600 dark:text-zinc-400'>
							Esta acción no elimina la ficha del cliente de ventas ni sus documentos
							históricos y no se puede deshacer.
						</p>
					</div>
				)}
				{!isDeleteConfirmationOpen && loadedProfile !== null && !isLoading && !visibleLoadError && (
					<form
						id='credit-profile-edit-form'
						aria-label='Formulario de condiciones de crédito de cartera'
						className='space-y-4'
						onSubmit={formik.handleSubmit}>
						{saveError && (
							<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
								{saveError}
							</Alert>
						)}
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
								<Label htmlFor='portfolio-credit-profile-limit'>
									Cupo de crédito
								</Label>
								<Input
									id='portfolio-credit-profile-limit'
									name='credit_limit'
									type='text'
									inputMode='numeric'
									value={formatCreditLimitInput(formik.values.credit_limit)}
									onChange={(event) =>
										handleCreditLimitChange(event.target.value)
									}
									onBlur={formik.handleBlur}
									isTouched={formik.touched.credit_limit}
									isValid={!creditLimitError}
									invalidFeedback={creditLimitError}
									placeholder='$ 500.000'
								/>
							</div>
						</div>
						<div>
							<Label htmlFor='portfolio-credit-profile-collection-email'>
								Correo de cobranza
							</Label>
							<Input
								id='portfolio-credit-profile-collection-email'
								name='collection_email'
								type='email'
								autoComplete='email'
								value={formik.values.collection_email}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								isTouched={formik.touched.collection_email}
								isValid={!collectionEmailError}
								invalidFeedback={collectionEmailError}
							/>
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
				)}
			</ModalBody>
			<ModalFooter>
				{isDeleteConfirmationOpen ? (
					<>
						<Button
							variant='outline'
							type='button'
							onClick={() => setIsDeleteConfirmationOpen(false)}
							isDisable={isDeleting}>
							Cancelar
						</Button>
						<ProtectedButton
							permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.DELETE}
							branchId={branchId}
							subsidiaryId={subsidiaryId}
							scope='access'
							variant='solid'
							color='red'
							type='button'
							onClick={handleDelete}
							isLoading={isDeleting}
							isDisable={isDeleting || loadedProfile === null || isLoading}>
							Eliminar perfil
						</ProtectedButton>
					</>
				) : (
					<>
						<Button
							variant='outline'
							type='button'
							onClick={onClose}
							isDisable={formik.isSubmitting}>
							Cancelar
						</Button>
						<ProtectedButton
							permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.DELETE}
							branchId={branchId}
							subsidiaryId={subsidiaryId}
							scope='access'
							variant='outline'
							color='red'
							type='button'
							onClick={() => setIsDeleteConfirmationOpen(true)}
							isDisable={formik.isSubmitting || loadedProfile === null || isLoading}>
							Eliminar perfil
						</ProtectedButton>
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
							isDisable={formik.isSubmitting || loadedProfile === null || isLoading}>
							Guardar condiciones
						</ProtectedButton>
					</>
				)}
			</ModalFooter>
		</Modal>
	);
};

export default CreditProfileEditModal;
