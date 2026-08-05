import React from 'react';
import type { DeferredPaymentStatus } from '@/interface/deferredPayments.interface';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';

const getReminderMessage = (status: DeferredPaymentStatus): string => {
	if (status === 'paid') return 'Documento pagado: los recordatorios están detenidos.';
	if (status === 'partially_paid') return 'Pago parcial: los recordatorios continúan activos.';
	return 'Pendiente de pago: los recordatorios continúan activos.';
};
interface DeferredPaymentActionsFooterProps {
	branchId: number | null;
	subsidiaryId: number | null;
	status: DeferredPaymentStatus;
	outstandingAmount: number;
	busy: boolean;
	onRegisterPayment: () => void;
	onMarkPaid: () => void;
	onEdit: () => void;
}
const DeferredPaymentActionsFooter: React.FC<DeferredPaymentActionsFooterProps> = ({
	branchId,
	subsidiaryId,
	status,
	outstandingAmount,
	busy,
	onRegisterPayment,
	onMarkPaid,
	onEdit,
}) => {
	const canPay = status !== 'paid' && outstandingAmount > 0;
	return (
		<div className='w-full space-y-2'>
			<p id='deferred-actions-status' className='text-xs text-zinc-500'>
				{getReminderMessage(status)}
			</p>
			<div className='flex flex-wrap gap-2'>
				<ProtectedButton
					permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.RECORD_PAYMENT}
					branchId={branchId}
					subsidiaryId={subsidiaryId}
					scope='access'
					icon='HeroBanknotes'
					isDisable={!canPay || busy}
					onClick={onRegisterPayment}>
					Registrar abono
				</ProtectedButton>
				<ProtectedButton
					permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.MARK_PAID}
					branchId={branchId}
					subsidiaryId={subsidiaryId}
					scope='access'
					icon='HeroCheckCircle'
					isDisable={!canPay || busy}
					onClick={onMarkPaid}>
					Marcar pagada
				</ProtectedButton>
				<ProtectedButton
					permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.UPDATE}
					branchId={branchId}
					subsidiaryId={subsidiaryId}
					scope='access'
					icon='HeroPencilSquare'
					isDisable={status === 'paid' || busy}
					title={
						status === 'paid'
							? 'Editar no disponible para documentos pagados'
							: undefined
					}
					onClick={onEdit}>
					Editar
				</ProtectedButton>
			</div>
		</div>
	);
};
export default DeferredPaymentActionsFooter;
