import React, { useEffect, useRef } from 'react';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import Checkbox from '@/components/form/Checkbox';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import Icon from '@/components/icon/Icon';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import Progress from '@/components/ui/Progress';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { formatCLP } from '@/utils/format.utils';
import useCustomerCreditProfile from '../hooks/useCustomerCreditProfile';

interface CustomerCreditProfileCardProps {
	customerSaleId: number;
	startInEditMode?: boolean;
	onSavingChange?: (isSaving: boolean) => void;
}

const CreditStatusPill: React.FC<{ suspended: boolean }> = ({ suspended }) => (
	<span
		className={`inline-flex min-w-32 max-w-44 items-center justify-center whitespace-normal rounded-full px-3 py-1.5 text-center text-sm font-semibold shadow-sm ${
			suspended ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
		}`}>
		{suspended ? 'Suspendido' : 'Activo'}
	</span>
);

const Skeleton = () => (
	<div className='animate-pulse space-y-4' aria-label='Cargando perfil de crédito'>
		<div className='flex items-center gap-3'>
			<div className='h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-700' />
			<div className='flex-1 space-y-2'>
				<div className='h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700' />
				<div className='h-3 w-48 rounded bg-zinc-200 dark:bg-zinc-700' />
			</div>
		</div>
		<div className='grid grid-cols-2 gap-3'>
			<div className='h-14 rounded-lg bg-zinc-200 dark:bg-zinc-700' />
			<div className='h-14 rounded-lg bg-zinc-200 dark:bg-zinc-700' />
		</div>
		<div className='h-14 rounded-lg bg-zinc-200 dark:bg-zinc-700' />
	</div>
);

const formatCreditLimitInput = (value: string): string => {
	const numericValue = value.replace(/\D/g, '');
	return numericValue ? formatCLP(numericValue) : '';
};

const CustomerCreditProfileCardContent: React.FC<{
	customerSaleId: number;
	subsidiaryId: number | null;
	startInEditMode: boolean;
	onSavingChange?: (isSaving: boolean) => void;
}> = ({ customerSaleId, subsidiaryId, startInEditMode, onSavingChange }) => {
	const {
		profile,
		outstandingAmount,
		isLoading,
		loadError,
		saveError,
		isEditing,
		isSaving,
		formik,
		loadProfile,
		startEditing,
		cancelEditing,
	} = useCustomerCreditProfile({ customerSaleId, subsidiaryId });
	const hasStartedEditingRef = useRef(false);
	const onSavingChangeRef = useRef(onSavingChange);
	onSavingChangeRef.current = onSavingChange;

	useEffect(() => {
		onSavingChange?.(isSaving);
	}, [isSaving, onSavingChange]);

	useEffect(() => () => onSavingChangeRef.current?.(false), []);

	useEffect(() => {
		if (
			!startInEditMode ||
			hasStartedEditingRef.current ||
			isLoading ||
			loadError ||
			profile === null
		)
			return;
		hasStartedEditingRef.current = true;
		startEditing();
	}, [isLoading, loadError, profile, startEditing, startInEditMode]);
	const hasProfile = profile?.id !== null && profile !== null;
	const isSuspended = hasProfile && profile.is_active === false;
	const creditLimit = profile?.credit_limit ?? null;
	const hasCreditLimit = creditLimit !== null;
	const usedAmount = outstandingAmount === null ? null : Number(outstandingAmount);
	const limitAmount = creditLimit === null ? null : Number(creditLimit);
	const hasValidCreditMetrics =
		usedAmount !== null &&
		limitAmount !== null &&
		Number.isFinite(usedAmount) &&
		Number.isFinite(limitAmount);
	const availableAmount = hasValidCreditMetrics ? Math.max(0, limitAmount - usedAmount) : null;
	const progressPercent =
		hasValidCreditMetrics && limitAmount > 0
			? Math.min(100, Math.max(0, (usedAmount / limitAmount) * 100))
			: 0;
	const isOverLimit = hasValidCreditMetrics && usedAmount > limitAmount;
	const paymentTermError = formik.touched.payment_term_days
		? formik.errors.payment_term_days
		: undefined;
	const creditLimitError =
		formik.touched.credit_limit || formik.values.credit_limit.trim()
			? formik.errors.credit_limit
			: undefined;
	const handleCreditLimitChange = (value: string) => {
		formik.setFieldTouched('credit_limit', true, false).catch(() => undefined);
		formik.setFieldValue('credit_limit', value.replace(/\D/g, '')).catch(() => undefined);
	};

	return (
		<Card className='h-full border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60'>
			<CardBody className='space-y-4 p-5'>
				<div className='flex items-start justify-between gap-4'>
					<div className='flex min-w-0 items-start gap-3'>
						<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white'>
							<Icon icon='HeroCreditCard' color='white' size='text-xl' />
						</div>
						<div className='min-w-0'>
							<p className='font-semibold'>Condiciones de crédito</p>
							<p className='text-sm text-zinc-500'>
								Plazo, cupo y condiciones comerciales.
							</p>
						</div>
					</div>
					{!isLoading && !loadError && !isEditing && (
						<ProtectedButton
							permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.UPDATE}
							subsidiaryId={subsidiaryId}
							scope='access'
							variant='solid'
							color='blue'
							icon={hasProfile ? 'HeroPencilSquare' : 'HeroPlus'}
							type='button'
							onClick={startEditing}>
							{hasProfile ? 'Editar' : 'Crear perfil'}
						</ProtectedButton>
					)}
				</div>

				{isLoading && <Skeleton />}

				{loadError && (
					<Alert
						color='red'
						variant='outline'
						icon='HeroExclamationTriangle'
						title='No se pudo cargar el perfil'>
						<div className='space-y-3'>
							<p>{loadError}</p>
							<Button
								size='sm'
								variant='outline'
								color='red'
								type='button'
								onClick={() => loadProfile()}>
								Reintentar
							</Button>
						</div>
					</Alert>
				)}

				{!isLoading && !loadError && !isEditing && !hasProfile && (
					<div className='rounded-xl border border-dashed border-zinc-300 p-4 text-center dark:border-zinc-700'>
						<p className='text-sm text-zinc-500'>Sin información registrada.</p>
						<p className='mt-1 text-sm text-zinc-400'>
							Aún no existe un perfil de crédito para este cliente.
						</p>
					</div>
				)}

				{!isLoading && !loadError && !isEditing && hasProfile && profile && (
					<div className='space-y-4'>
						<div className='flex flex-wrap items-center gap-3'>
							<CreditStatusPill suspended={isSuspended} />
						</div>
						<div className='grid grid-cols-2 gap-3 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-700'>
							<div>
								<p className='text-zinc-500'>Plazo de pago</p>
								<p className='font-semibold'>
									{profile.payment_term_days} día
									{profile.payment_term_days !== 1 ? 's' : ''}
								</p>
							</div>
							<div>
								<p className='text-zinc-500'>Cupo de crédito</p>
								<p className='font-semibold'>
									{profile.credit_limit === null
										? 'Sin cupo definido'
										: formatCLP(profile.credit_limit)}
								</p>
							</div>
						</div>
						{hasCreditLimit && hasValidCreditMetrics && availableAmount !== null && (
							<div className='border-t border-zinc-200 pt-4 dark:border-zinc-700'>
								<div className='mb-2 flex justify-between gap-3 text-sm'>
									<p className='text-zinc-500'>
										Usado {formatCLP(usedAmount ?? 0)}
									</p>
									<p className='font-semibold'>
										{limitAmount > 0 ? `${Math.round(progressPercent)}%` : '—'}
									</p>
								</div>
								<Progress
									value={progressPercent}
									color={isOverLimit ? 'red' : 'emerald'}
									colorIntensity='600'
									className='h-2.5'
								/>
								<div className='mt-2 flex justify-between gap-3 text-sm'>
									<p className='text-zinc-500'>
										Disponible {formatCLP(String(availableAmount))}
									</p>
									<p className='text-zinc-400'>
										Cupo {formatCLP(creditLimit ?? 0)}
									</p>
								</div>
							</div>
						)}
						<div className='border-t border-zinc-200 pt-4 dark:border-zinc-700'>
							<p className='text-sm text-zinc-500'>Notas</p>
							<p className='mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300'>
								{profile.notes || 'Sin información registrada.'}
							</p>
						</div>
					</div>
				)}

				{isEditing && (
					<form
						aria-label='Formulario de condiciones de crédito'
						className='space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-700'
						onSubmit={formik.handleSubmit}>
						{saveError && (
							<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
								{saveError}
							</Alert>
						)}
						<Checkbox
							id='credit-profile-is-active'
							variant='switch'
							checked={formik.values.is_active}
							label={formik.values.is_active ? 'Activo' : 'Suspendido'}
							onChange={(event) =>
								formik.setFieldValue('is_active', event.target.checked)
							}
						/>
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
							<div>
								<Label htmlFor='credit-profile-payment-term-days'>
									Plazo de pago (días)
								</Label>
								<Input
									id='credit-profile-payment-term-days'
									name='payment_term_days'
									type='number'
									min='1'
									max='32767'
									step='1'
									value={formik.values.payment_term_days}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									isTouched={formik.touched.payment_term_days}
									isValid={!paymentTermError}
									invalidFeedback={paymentTermError}
									aria-describedby={
										paymentTermError
											? 'credit-profile-payment-term-days-error'
											: undefined
									}
								/>
								{paymentTermError && (
									<p
										id='credit-profile-payment-term-days-error'
										role='alert'
										className='mt-1 text-sm text-red-600 dark:text-red-400'>
										{paymentTermError}
									</p>
								)}
							</div>
							<div>
								<Label htmlFor='credit-profile-credit-limit'>Cupo de crédito</Label>
								<Input
									id='credit-profile-credit-limit'
									name='credit_limit'
									type='text'
									inputMode='numeric'
									placeholder='$ 500.000'
									value={formatCreditLimitInput(formik.values.credit_limit)}
									onChange={(event) =>
										handleCreditLimitChange(event.target.value)
									}
									onBlur={formik.handleBlur}
									isTouched={formik.touched.credit_limit}
									isValid={!creditLimitError}
									invalidFeedback={creditLimitError}
									aria-describedby={
										creditLimitError
											? 'credit-profile-credit-limit-error'
											: undefined
									}
								/>
								{creditLimitError && (
									<p
										id='credit-profile-credit-limit-error'
										role='alert'
										className='mt-1 text-sm text-red-600 dark:text-red-400'>
										{creditLimitError}
									</p>
								)}
							</div>
						</div>
						<div>
							<Label htmlFor='credit-profile-notes'>Notas</Label>
							<Textarea
								id='credit-profile-notes'
								name='notes'
								rows={3}
								value={formik.values.notes}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
							/>
						</div>
						<div className='flex flex-wrap justify-end gap-3'>
							<Button
								variant='outline'
								type='button'
								onClick={cancelEditing}
								isDisable={isSaving}>
								Cancelar
							</Button>
							<ProtectedButton
								permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.UPDATE}
								subsidiaryId={subsidiaryId}
								scope='access'
								variant='solid'
								color='blue'
								type='submit'
								isLoading={isSaving}
								isDisable={isSaving}>
								Guardar condiciones
							</ProtectedButton>
						</div>
					</form>
				)}
			</CardBody>
		</Card>
	);
};

const CustomerCreditProfileCard: React.FC<CustomerCreditProfileCardProps> = ({
	customerSaleId,
	startInEditMode = false,
	onSavingChange,
}) => {
	const { subsidiaryId } = useCurrentBranch();
	return (
		<PermissionGuard
			permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.VIEW}
			subsidiaryId={subsidiaryId}
			scope='access'>
			<CustomerCreditProfileCardContent
				customerSaleId={customerSaleId}
				subsidiaryId={subsidiaryId}
				startInEditMode={startInEditMode}
				onSavingChange={onSavingChange}
			/>
		</PermissionGuard>
	);
};

export default CustomerCreditProfileCard;
