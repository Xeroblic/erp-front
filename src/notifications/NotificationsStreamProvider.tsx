import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchNotifications,
	setStreamingConnected,
	upsertFromSse,
} from '@/store/slices/notifications/notificationsSlice';
import { openNotificationsStream } from '@/services/notifications/notifications.stream';
import { toast } from 'react-toastify';

/**
 * Provider global para mantener la conexión SSE de notificaciones
 * Debe envolver el árbol principal de la app (en App.tsx)
 */
const NotificationsStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const dispatch = useAppDispatch();
	const { streaming } = useAppSelector(
		(s) => s.notifications ?? { streaming: { connected: false, lastEventId: 0 } },
	);

	// Branch activa desde personalización o perfil
	const activeBranchId = useAppSelector((s) => {
		const pref = (s as any)?.personalizacion?.personalizacionUsuario;
		const user = (s as any)?.auth?.user;
		return (
			pref?.sucursal_principal ?? user?.branch?.id ?? user?.branch_id ?? null
		);
	});

	const streamRef = useRef<ReturnType<typeof openNotificationsStream> | null>(null);
	const reconnectTimerRef = useRef<number | null>(null);
	const lastEventIdRef = useRef<number>(streaming?.lastEventId ?? 0);
	const backoffRef = useRef<number>(3000);

	// Mantener el lastEventId actualizado para reconexiones
	useEffect(() => {
		lastEventIdRef.current = streaming?.lastEventId ?? 0;
	}, [streaming?.lastEventId]);

	useEffect(() => {
		// Carga inicial de notificaciones
		dispatch(fetchNotifications({ per_page: 20, branch_id: activeBranchId ?? undefined })).catch(() => void 0);

		const connect = () => {
			// Cerrar flujo previo si existe
			streamRef.current?.close();

			streamRef.current = openNotificationsStream(
				(payload) => {
					dispatch(upsertFromSse(payload));
					const msg = payload?.message
						? payload.message
						: payload?.title || 'Notificación';
					try {
						toast.info(msg);
					} catch (_) {}
					// try { new Audio('/example-sound-short.mp3').play().catch(() => void 0); } catch (_) {}
				},
				() => {
					dispatch(setStreamingConnected(true));
					backoffRef.current = 3000; // reset backoff al conectar
				},
				// onError/onClose => marcar desconectado y reintentar con backoff
				() => {
					dispatch(setStreamingConnected(false));
					if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
					reconnectTimerRef.current = window.setTimeout(() => {
						connect();
						backoffRef.current = Math.min(backoffRef.current * 2, 30000);
					}, backoffRef.current) as unknown as number;
					},
					{ history: 0, lastEventId: lastEventIdRef.current, branchId: activeBranchId ?? undefined },
			);
		};

		// Conectar inicialmente; al finalizar el stream el servicio llamará onError y reconectaremos
		connect();

		// Polling fallback cada 50s
		const iv = window.setInterval(() => {
			dispatch(fetchNotifications({ per_page: 20, branch_id: activeBranchId ?? undefined })).catch(() => void 0);
		}, 50_000);

		return () => {
			if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
			window.clearInterval(iv);
			streamRef.current?.close();
			dispatch(setStreamingConnected(false));
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch, activeBranchId]);

	// Reaccionar a cambios de sucursal en runtime
	useEffect(() => {
		const handler = (e: any) => {
			try {
				if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
				// reconectar de inmediato
				streamRef.current?.close();
				lastEventIdRef.current = 0; // opcional: o mantener
				// relanzar carga inicial para la nueva sucursal
				dispatch(fetchNotifications({ per_page: 20, branch_id: (e?.detail?.branchId ?? activeBranchId) || undefined })).catch(() => void 0);
				// reconectar stream (useEffect con deps activeBranchId hará el resto si state cambia)
			} catch {}
		};
		window.addEventListener('user-branch-changed', handler as any);
		return () => window.removeEventListener('user-branch-changed', handler as any);
	}, [dispatch, activeBranchId]);

	return <>{children}</>;
};

export default NotificationsStreamProvider;
