import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchNotifications,
	upsertMany,
	markDelivered,
} from '@/store/slices/notifications/notificationsSlice';
import type { UserNotificationDTO } from '@/interface/notifications.interface';
import { tokenManager } from '@/services/auth/tokenManager';

/** Canal compartido entre pestañas */
const bc = new BroadcastChannel('zentria_notifications');
const TAB_ID = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const LOCK_KEY = 'zentria_notifications_leader';
const leaderPingInterval = 1500;
const leaderTimeout = 5000;

const NotificationsStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const dispatch = useAppDispatch();
	const { items } = useAppSelector((s) => s.notifications);
	const [isLeader, setIsLeader] = useState(false);
	const lastLeaderSeenRef = useRef(Date.now());

	const eventSourceRef = useRef<EventSource | null>(null);
	const lockRef = useRef<string | null>(null);

	/** ---------- 1) Elección de líder (pestaña que mantiene la SSE) ---------- */
	useEffect(() => {
		/** Responder a mensajes */
		bc.onmessage = (ev) => {
			const msg = ev.data;

			if (msg?.type === 'leader-ping') {
				lastLeaderSeenRef.current = Date.now();
			}

			if (msg?.type === 'notification') {
				dispatch(upsertMany([msg.data]));
			}
		};

		/** PING periódico + recuperación de liderazgo */
		const pingTimer = setInterval(() => {
			const lock = (() => {
				try {
					return JSON.parse(localStorage.getItem(LOCK_KEY) || 'null');
				} catch {
					return null;
				}
			})();

			const now = Date.now();
			const lockOwner = lock?.id as string | undefined;
			const lockTs = typeof lock?.ts === 'number' ? lock.ts : 0;
			const lockExpired = now - lockTs > leaderTimeout;

			if (isLeader) {
				// Renueva lock mientras somos líderes
				const payload = JSON.stringify({ id: TAB_ID, ts: now });
				lockRef.current = payload;
				localStorage.setItem(LOCK_KEY, payload);
				bc.postMessage({ type: 'leader-ping' });
				lastLeaderSeenRef.current = now;
				return;
			}

			// No somos líderes, validar si el lock está libre o expiró
			if (!lockOwner || lockExpired) {
				const payload = JSON.stringify({ id: TAB_ID, ts: now });
				localStorage.setItem(LOCK_KEY, payload);
				lockRef.current = payload;
				setIsLeader(true);
				return;
			}

			// Lock activo por otro tab: actualizar último ping para evitar tomas innecesarias
			lastLeaderSeenRef.current = lockTs;
		}, leaderPingInterval);

		const handleStorage = (ev: StorageEvent) => {
			if (ev.key === LOCK_KEY && ev.newValue) {
				try {
					const parsed = JSON.parse(ev.newValue);
					lastLeaderSeenRef.current = parsed?.ts ?? Date.now();
					if (parsed?.id !== TAB_ID && isLeader) {
						// Otro tab tomó el lock; liberamos liderazgo y cerramos SSE
						setIsLeader(false);
						if (eventSourceRef.current) {
							eventSourceRef.current.close();
							eventSourceRef.current = null;
						}
					}
				} catch {
					// ignore
				}
			}
		};
		window.addEventListener('storage', handleStorage);

		return () => {
			clearInterval(pingTimer);
			window.removeEventListener('storage', handleStorage);
			if (isLeader) {
				localStorage.removeItem(LOCK_KEY);
			}
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
				eventSourceRef.current = null;
			}
		};
	}, [dispatch, isLeader]);

	// Obtener el token desde Redux para reaccionar a cambios (rotación)
	const accessToken = useAppSelector((s) => s.auth.access);

	/** ---------- 2) Crear SSE SOLO si somos líderes y hay token ---------- */
	useEffect(() => {
		if (!isLeader) return;

		const token = tokenManager.getAccessToken() || accessToken;
		if (!token) return;

		// console.log('[ZENTRIA] Conectando SSE con token actualizado...');

		const baseURL = import.meta.env.VITE_API_URL;
		const url = `${baseURL}/me/notifications/stream?access_token=${token}&history=1`;

		const es = new EventSource(url);
		eventSourceRef.current = es;
		// @ts-ignore
		if (typeof window !== 'undefined') (window as any).__zentriaSseReady = true;

		es.onmessage = (ev) => {
			try {
				const data: UserNotificationDTO = JSON.parse(ev.data);

				/** Notificar al Redux local */
				dispatch(upsertMany([data]));

				/** Distribuir a las otras pestañas */
				bc.postMessage({ type: 'notification', data });
			} catch (err) {
				// console.error('[ZENTRIA] Error SSE:', err);
			}
		};

		es.onerror = () => {
			// console.warn('[ZENTRIA] SSE error. Reintentando...');
			es.close();
			// Forzar reconexión: breve delay y desmontar/montar
			// La forma más limpia es dejar que el componente se encargue o simplemente
			// cerrar. Si cerramos, el useEffect NO se re-ejecuta solo por cerrar 'es'.
			// Pero si el error fue por token inválido, el sistema de auth rotará el token,
			// cambiará 'accessToken', y este effect se re-ejecutará solo.
			// Si es error de red, podemos intentar reconectar manualmente:
			eventSourceRef.current = null;
			setTimeout(() => {
				// Toggle leader para forzar reinicio si seguimos siendo líderes
				if (isLeader) {
					setIsLeader(false);
					setTimeout(() => setIsLeader(true), 100);
				}
			}, 3000);
		};

		return () => {
			es.close();
			// @ts-ignore
			if (typeof window !== 'undefined') (window as any).__zentriaSseReady = false;
		};
	}, [isLeader, dispatch, accessToken]);

	/** ---------- 3) Detectar nuevas notificaciones locales ---------- */
	useEffect(() => {
		if (!Array.isArray(items)) return;

		const notDelivered = items.filter((n) => n.delivered_to_user === false);

		if (notDelivered.length) {
			dispatch(markDelivered({ ids: notDelivered.map((n) => n.id) }));
		}
	}, [items, dispatch]);

	return <>{children}</>;
};

export default NotificationsStreamProvider;
