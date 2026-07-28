import React from 'react';
import type { DeferredPaymentStatus } from '@/interface/deferredPayments.interface';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';

interface DeferredPaymentActionsFooterProps {
	branchId: number | null;
	subsidiaryId: number | null;
	status: DeferredPaymentStatus;
	onEdit: () => void;
}

const DeferredPaymentActionsFooter: React.FC<DeferredPaymentActionsFooterProps> = ({
	branchId,
	subsidiaryId,
	status,
	onEdit,
}) => (
	<div className='w-full space-y-2'>
		<p id='deferred-actions-status' className='text-xs text-zinc-500'>
			Los pagos y la eliminación se habilitarán en los siguientes flujos.
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
				icon='HeroPencilSquare'
				isDisable={status === 'paid'}
				aria-label={
					status === 'paid'
						? 'Editar no disponible para documentos pagados'
						: 'Editar documento'
				}
				onClick={onEdit}>
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
	</div>
);

export default DeferredPaymentActionsFooter;
