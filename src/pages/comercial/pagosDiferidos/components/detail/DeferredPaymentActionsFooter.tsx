import React from 'react';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';

interface DeferredPaymentActionsFooterProps {
	branchId: number | null;
	subsidiaryId: number | null;
	isPaid: boolean;
	canDelete: boolean;
	canEdit: boolean;
	canPay: boolean;
}

const DeferredPaymentActionsFooter: React.FC<DeferredPaymentActionsFooterProps> = ({
	branchId,
	subsidiaryId,
	isPaid,
	canDelete,
	canEdit,
	canPay,
}) => (
	<div className='w-full space-y-2'>
		<p id='deferred-actions-status' className='text-xs text-zinc-500'>
			Las acciones se habilitarán con los flujos de ZF-7 y ZF-8.
		</p>
		<div className='flex flex-wrap gap-2'>
			<ProtectedButton
				permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.RECORD_PAYMENT}
				branchId={branchId}
				subsidiaryId={subsidiaryId}
				scope='access'
				isDisable
				aria-describedby='deferred-actions-status'>
				Registrar abono
			</ProtectedButton>
			<ProtectedButton
				permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.MARK_PAID}
				branchId={branchId}
				subsidiaryId={subsidiaryId}
				scope='access'
				isDisable
				aria-describedby='deferred-actions-status'>
				Marcar pagada
			</ProtectedButton>
			<ProtectedButton
				permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.UPDATE}
				branchId={branchId}
				subsidiaryId={subsidiaryId}
				scope='access'
				isDisable
				aria-describedby='deferred-actions-status'>
				Editar
			</ProtectedButton>
			<ProtectedButton
				permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.DELETE}
				branchId={branchId}
				subsidiaryId={subsidiaryId}
				scope='access'
				isDisable
				aria-describedby='deferred-actions-status'
				color='red'>
				Eliminar
			</ProtectedButton>
		</div>
		<span className='sr-only'>
			Estado actual: {isPaid ? 'pagado' : 'no pagado'}; pago permitido: {canPay ? 'sí' : 'no'}
			; edición permitida: {canEdit ? 'sí' : 'no'}; eliminación permitida:{' '}
			{canDelete ? 'sí' : 'no'}.
		</span>
	</div>
);

export default DeferredPaymentActionsFooter;
