import React from 'react';
import type { IEnumOption, WithdrawalStatus } from '@/interface/equipmentWithdrawals.interface';

/**
 * Colores por estado. No existe un estado intermedio de devolución parcial:
 * un préstamo con ítems pendientes sigue en `confirmed` y el avance se muestra
 * en la columna de pendientes ("3 de 9 devueltos").
 */
const statusClasses: Record<WithdrawalStatus, string> = {
	draft: 'bg-amber-500 text-white',
	confirmed: 'bg-blue-600 text-white',
	returned: 'bg-emerald-600 text-white',
	cancelled: 'bg-zinc-600 text-white',
};

interface IWithdrawalStatusBadgeProps {
	status: IEnumOption<WithdrawalStatus>;
}

const WithdrawalStatusBadge: React.FC<IWithdrawalStatusBadgeProps> = ({ status }) => (
	<span
		className={`inline-flex min-w-28 max-w-40 items-center justify-center whitespace-normal rounded-full px-3 py-1.5 text-center text-sm font-semibold shadow-sm ${statusClasses[status.value]}`}>
		{status.label}
	</span>
);

export default WithdrawalStatusBadge;
