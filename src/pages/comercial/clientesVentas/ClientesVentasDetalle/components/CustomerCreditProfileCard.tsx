import React from 'react';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import Checkbox from '@/components/form/Checkbox';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { formatCLP } from '@/utils/format.utils';
import useCustomerCreditProfile from '../hooks/useCustomerCreditProfile';

interface CustomerCreditProfileCardProps {
	customerSaleId: number;
}

const CustomerCreditProfileCardContent: React.FC<{
	customerSaleId: number;
	subsidiaryId: number | null;
}> = ({ customerSaleId, subsidiaryId }) => {
	const {
		profile,
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
	const hasProfile = profile?.id !== null && profile !== null;
	const isSuspended = hasProfile && profile.is_active === false;
	const paymentTermError = formik.touched.payment_term_days
		? formik.errors.payment_term_days
		: undefined;
	const creditLimitError =
		formik.touched.credit_limit || formik.values.credit_limit.trim()
			? formik.errors.credit_limit
			: undefined;

	return (
		<Card className='border-zinc-200/50 shadow-sm dark:border-zinc-700/50'>
			<CardHeader>
				<div>
					<CardTitle>Condiciones de crédito</CardTitle>
					<p className='mt-1 text-sm text-zinc-500'>
						Plazo, cupo y condiciones comerciales.
					</p>
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
			</CardHeader>
			<CardBody>
				{isLoading && (
					<p className='text-sm text-zinc-500'>Cargando perfil de crédito...</p>
				)}
				{loadError && (
					<Alert color='red' variant='outline' title='No se pudo cargar el perfil'>
						<div className='space-y-3'>
							<p>{loadError}</p>
							<Button
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
					<p className='text-sm text-zinc-500'>Sin perfil de crédito.</p>
				)}
				{!isLoading && !loadError && !isEditing && hasProfile && profile && (
					<div className='grid grid-cols-1 gap-4 text-sm sm:grid-cols-2'>
						<div>
							<p className='text-zinc-500'>Estado</p>
							<Badge
								color={isSuspended ? 'red' : 'green'}
								variant='solid'
								className='mt-1'>
								{isSuspended ? 'Suspendido' : 'Activo'}
							</Badge>
						</div>
						<div>
							<p className='text-zinc-500'>Plazo de pago</p>
							<p className='mt-1 font-medium'>{profile.payment_term_days} días</p>
						</div>
						<div>
							<p className='text-zinc-500'>Cupo de crédito</p>
							<p className='mt-1 font-medium'>
								{profile.credit_limit === null
									? 'Sin cupo definido'
									: formatCLP(profile.credit_limit)}
							</p>
						</div>
						<div className='sm:col-span-2'>
							<p className='text-zinc-500'>Notas</p>
							<p className='mt-1 whitespace-pre-wrap'>
								{profile.notes || 'Sin notas'}
							</p>
						</div>
					</div>
				)}
				{isEditing && (
					<form
						aria-label='Formulario de condiciones de crédito'
						className='space-y-4'
						onSubmit={formik.handleSubmit}>
						{saveError && (
							<Alert color='red' variant='outline'>
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
									placeholder='Ej.: 500000'
									value={formik.values.credit_limit}
									onChange={(event) => {
										formik
											.setFieldTouched('credit_limit', true, false)
											.catch(() => undefined);
										formik.handleChange(event);
									}}
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
			/>
		</PermissionGuard>
	);
};

export default CustomerCreditProfileCard;
