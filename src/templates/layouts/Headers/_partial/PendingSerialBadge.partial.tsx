import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import { useAppDispatch, useAppSelector, injectReducer } from '@/store';
import useCan from '@/hooks/useCan';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import pendingSerialReducer, {
	loadPendingSerialCount,
	selectPendingSerialCount,
} from '@/store/slices/pendingSerial/pendingSerialSlice';

injectReducer('pendingSerial', pendingSerialReducer);

const POLL_INTERVAL_MS = 60_000;
const PENDING_SERIAL_ROUTE = '/comercial/ventas/pendientes-serie';

/**
 * Badge del navbar con el número de ventas pendientes de asignar serie física.
 * Hace polling al endpoint `count` (liviano) y refresca al volver el foco/visibilidad,
 * espejando el patrón de Notification.partial. Sólo se muestra con permiso `view-sale`.
 */
const PendingSerialBadge = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { has, isSuperAdmin } = useCan();
	const { subsidiaryId, hasValidBranch } = useCurrentBranch();
	const isAuthenticated = useAppSelector((s) => s.auth?.isAuthenticated);
	const count = useAppSelector(selectPendingSerialCount);

	const canView = isSuperAdmin || has('view-sale');
	const active = Boolean(canView && isAuthenticated && hasValidBranch && subsidiaryId);

	const refresh = useCallback(() => {
		if (!active || !subsidiaryId) return;
		dispatch(loadPendingSerialCount({ subsidiaryId }));
	}, [active, subsidiaryId, dispatch]);

	useEffect(() => {
		if (!active) return undefined;
		refresh();
		const iv = window.setInterval(refresh, POLL_INTERVAL_MS);
		const onFocus = () => refresh();
		const onVis = () => {
			if (!document.hidden) refresh();
		};
		window.addEventListener('focus', onFocus);
		document.addEventListener('visibilitychange', onVis);
		return () => {
			window.clearInterval(iv);
			window.removeEventListener('focus', onFocus);
			document.removeEventListener('visibilitychange', onVis);
		};
	}, [active, refresh]);

	if (!active) return null;

	const label = `${count} venta(s) pendiente(s) de asignar serie`;

	return (
		<div className='relative inline-block'>
			<Tooltip text={label}>
				<Button
					icon='HeroQrCode'
					aria-label={label}
					onClick={() => navigate(PENDING_SERIAL_ROUTE)}
					className='h-10 w-10 !rounded-full border border-white/60 bg-white !p-0 text-amber-500 shadow-md shadow-amber-200/50 dark:border-white/10 dark:bg-zinc-800 dark:text-amber-300'
				/>
			</Tooltip>
			{count > 0 && (
				<span className='pointer-events-none absolute -end-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white shadow'>
					{count > 99 ? '99+' : count}
				</span>
			)}
		</div>
	);
};

export default PendingSerialBadge;
