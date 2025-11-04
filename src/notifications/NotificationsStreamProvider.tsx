import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import type { UserNotificationDTO } from '@/interface/notifications.interface';
import NotificationPopup from './NotificationPopup';
import { fetchNotifications } from '@/store/slices/notifications/notificationsSlice';

/**
 * Provider de notificaciones con POLLING (SIN SSE).
 * 
 * EventSource NO soporta headers personalizados, y no podemos modificar el backend.
 * Solución: Polling cada 5 segundos usando ApiService (que SÍ envía headers).
 * 
 * Flujo:
 * 1. Carga inicial de notificaciones
 * 2. Polling cada 5s para detectar cambios
 * 3. Muestra popups nativos de Windows para TODAS las notificaciones
 * 4. Solo filtra las que ya fueron mostradas (evita duplicados en misma sesión)
 */
const NotificationsStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const dispatch = useAppDispatch();
	const { items } = useAppSelector((s) => s.notifications ?? { items: [] });

	// Refs para control
	const shownIdsRef = useRef<Set<number>>(new Set());

	// Cola + modal actual para popup tipo Windows
	const [queue, setQueue] = useState<UserNotificationDTO[]>([]);
	const [current, setCurrent] = useState<UserNotificationDTO | null>(null);
	const [open, setOpen] = useState(false);

	// Solicitar permiso del navegador al montar
	useEffect(() => {
		try {
			if (typeof window !== 'undefined' && 'Notification' in window) {
				if (Notification.permission === 'default') {
					void Notification.requestPermission();
				}
			}
		} catch {
			// noop
		}
	}, []);

	// ✅ POLLING: Cada 5 segundos (usa ApiService que SÍ envía headers)
	useEffect(() => {
		console.log('[NOTIF] 🚀 Inicializando sistema de notificaciones con POLLING...');
		
		const doFetch = () => {
			dispatch(fetchNotifications({ per_page: 20 })).catch(() => void 0);
		};
		
		// Primera carga inmediata
		doFetch();
		
		// Polling cada 5 segundos
		const interval = setInterval(() => {
			console.log('[NOTIF] 🔄 Polling notificaciones...');
			doFetch();
		}, 5000);

		// Refrescar al volver al foco
		const onFocus = () => {
			console.log('[NOTIF] 👀 Ventana enfocada, refrescando...');
			doFetch();
		};
		const onVis = () => {
			if (!document.hidden) {
				console.log('[NOTIF] 👁️ Ventana visible, refrescando...');
				doFetch();
			}
		};
		
		window.addEventListener('focus', onFocus);
		document.addEventListener('visibilitychange', onVis);

		return () => {
			console.log('[NOTIF] 🛑 Deteniendo polling...');
			clearInterval(interval);
			window.removeEventListener('focus', onFocus);
			document.removeEventListener('visibilitychange', onVis);
		};
	}, [dispatch]);

	// ✅ DETECTAR NOTIFICACIONES del store - SIN FILTROS, MUESTRA TODO
	useEffect(() => {
		if (!items || !Array.isArray(items)) return;

		console.log('[NOTIF] 📊 Store tiene', items.length, 'notificaciones');

		// Filtrar solo las que NO hemos mostrado aún
		const newcomers = items.filter((n) => !shownIdsRef.current.has(n.id));

		if (!newcomers.length) {
			return;
		}

		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('[NOTIF] 🆕 NUEVAS NOTIFICACIONES:', newcomers.length);
		console.log(
			'[NOTIF] IDs:',
			newcomers.map((n) => `${n.id}(${n.event?.type_key})`).join(', '),
		);

		// Mostrar cada una
		for (const n of newcomers) {
			shownIdsRef.current.add(n.id);

			const shown = showNativeNotification(n);
			if (!shown) {
				console.log('[NOTIF] 📋 Agregando ID', n.id, 'a cola popup');
				setQueue((prev) => [...prev, n]);
			}
		}

		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	}, [items]);

	// ✅ MOSTRAR NOTIFICACIÓN NATIVA DE WINDOWS
	const showNativeNotification = (n: UserNotificationDTO): boolean => {
		const isSupported = typeof window !== 'undefined' && 'Notification' in window;

		if (!isSupported || Notification.permission !== 'granted') {
			console.log('[NOTIF] ⚠️ No se puede mostrar notificación nativa:', {
				isSupported,
				permission: isSupported ? Notification.permission : 'N/A',
			});
			return false;
		}

		const title = n.event?.type_label || n.event?.type_key || 'Notificación';
		const body = n.message || title;

		try {
			const icon = '/logo192.png?v=zentria1';
			// Tag ÚNICO para que Windows muestre todas las notificaciones
			const uniqueTag = `notification-${n.id}-${Date.now()}-${Math.random()}`;

			console.log('[NOTIF] 🚀 Creando notificación nativa:', {
				id: n.id,
				title,
				body,
				tag: uniqueTag,
			});

			const notif = new Notification(title, {
				body,
				tag: uniqueTag,
				icon,
				badge: icon,
				requireInteraction: true,
			});

			notif.onclick = () => {
				try {
					window.focus();
				} finally {
					notif.close();
				}
			};

			console.log('[NOTIF] ✅ Notificación nativa creada');
			return true;
		} catch (err) {
			console.error('[NOTIF] ❌ Error al crear notificación:', err);
			return false;
		}
	};

	// Consumir la cola secuencialmente en un sólo popup
	useEffect(() => {
		if (!open && queue.length > 0) {
			setCurrent(queue[0]);
			setQueue((prev) => prev.slice(1));
			setOpen(true);
		}
	}, [queue, open]);

	const handleClose = () => {
		setOpen(false);
		setCurrent(null);
	};

	return (
		<>
			{children}
			<NotificationPopup isOpen={open} notification={current} onClose={handleClose} />
		</>
	);
};

export default NotificationsStreamProvider;
