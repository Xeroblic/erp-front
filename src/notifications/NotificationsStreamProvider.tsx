import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchNotifications,
	upsertMany,
	markDelivered,
} from '@/store/slices/notifications/notificationsSlice';
import type { UserNotificationDTO } from '@/interface/notifications.interface';
import { tokenManager } from '@/services/auth/tokenManager';

const NotificationsStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const dispatch = useAppDispatch();
	const { items } = useAppSelector((state) => state.notifications ?? { items: [] });
	const processingRef = useRef<Set<number>>(new Set());
	const lastSeenCountRef = useRef<Map<number, number>>(new Map());

	const [useSSE, setUseSSE] = useState(true);
	const eventSourceRef = useRef<EventSource | null>(null);
	const connectionOpenedRef = useRef(false);

	// Solicitar permiso de notificaciones al montar
	useEffect(() => {
		if (typeof window !== 'undefined' && 'Notification' in window) {
			if (Notification.permission === 'default') {
				Notification.requestPermission();
			}
		}
	}, []);

	// Configurar sistema de notificaciones
	useEffect(() => {
		// Carga inicial del inbox
		dispatch(fetchNotifications({ per_page: 20 }));

		// Intentar SSE, fallback a polling
		if (useSSE && typeof EventSource !== 'undefined') {
			setupSSEConnection();
		} else {
			return setupPolling();
		}

		return () => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
				eventSourceRef.current = null;
			}
		};
	}, [dispatch, useSSE]);

	const setupSSEConnection = () => {
		const token = tokenManager.getAccessToken();
		if (!token || !tokenManager.isTokenValid(token)) {
			setUseSSE(false);
			return;
		}

		const baseURL = import.meta.env.VITE_API_URL;
		const lastEventId = getLastEventId();
		const url = `${baseURL}/me/notifications/stream?access_token=${token}&lastEventId=${lastEventId}&history=1`;

		const eventSource = new EventSource(url);
		eventSourceRef.current = eventSource;

		eventSource.onopen = () => {
			connectionOpenedRef.current = true;
		};

		eventSource.addEventListener('notification', (event) => {
			try {
				const notification = JSON.parse(event.data) as UserNotificationDTO;
				saveLastEventId(notification.id);
				dispatch(upsertMany([notification]));
			} catch (err) {
				console.error('[Notificaciones] Error procesando SSE:', err);
			}
		});

		eventSource.onerror = () => {
			eventSource.close();
			eventSourceRef.current = null;

			if (!connectionOpenedRef.current) {
				setUseSSE(false);
				return;
			}

			// Timeout normal del servidor (60s), reconectar
			connectionOpenedRef.current = false;
			setTimeout(() => {
				if (useSSE) setupSSEConnection();
			}, 1000);
		};
	};

	const setupPolling = () => {
		const fetchData = () => {
			dispatch(fetchNotifications({ per_page: 20 }));
		};

		const interval = setInterval(fetchData, 60000);
		const handleFocus = () => fetchData();
		const handleVisibility = () => {
			if (!document.hidden) fetchData();
		};

		window.addEventListener('focus', handleFocus);
		document.addEventListener('visibilitychange', handleVisibility);

		return () => {
			clearInterval(interval);
			window.removeEventListener('focus', handleFocus);
			window.removeEventListener('visibilitychange', handleVisibility);
		};
	};

	const getLastEventId = (): number => {
		const stored = sessionStorage.getItem('notif_last_event_id');
		return stored ? parseInt(stored, 10) : 0;
	};

	const saveLastEventId = (id: number): void => {
		const current = getLastEventId();
		if (id > current) {
			sessionStorage.setItem('notif_last_event_id', id.toString());
		}
	};

	// Detectar y mostrar notificaciones nuevas/actualizadas
	useEffect(() => {
		if (!Array.isArray(items)) return;

		const newItems = items.filter((n) => {
			if (processingRef.current.has(n.id)) return false;

			const lastCount = lastSeenCountRef.current.get(n.id);
			const currentCount = n.aggregate_count ?? 1;

			// Caso 1: No entregada
			if (n.delivered_to_user === false) return true;

			// Caso 2: Ya entregada PERO count cambió (actualización)
			if (
				n.delivered_to_user === true &&
				lastCount !== undefined &&
				currentCount > lastCount
			) {
				return true;
			}

			return false;
		});

		if (newItems.length === 0) return;

		newItems.forEach((n) => {
			processingRef.current.add(n.id);
			lastSeenCountRef.current.set(n.id, n.aggregate_count ?? 1);

			showNativeNotification(n);

			dispatch(markDelivered({ ids: [n.id] })).finally(() => {
				setTimeout(() => {
					processingRef.current.delete(n.id);
				}, 2000);
			});
		});
	}, [items, dispatch]);

	// Mostrar notificación nativa mejorada
	const showNativeNotification = (n: UserNotificationDTO): void => {
		if (typeof window === 'undefined' || !('Notification' in window)) return;
		if (Notification.permission !== 'granted') return;

		// Título descriptivo con módulo
		const module = n.event?.module_label || n.event?.module || '';
		const typeLabel = n.event?.type_label || n.event?.type_key || 'Notificación';
		const title = module ? `${module} · ${typeLabel}` : typeLabel;

		// Body enriquecido
		let body = n.message || typeLabel;

		// Contador de agregación
		if (n.aggregate_count && n.aggregate_count > 1) {
			body = `📊 ${n.aggregate_count} eventos similares\n\n${body}`;
		}

		// Hora formateada
		const time = n.created_at
			? new Date(n.created_at).toLocaleTimeString('es-CL', {
					hour: '2-digit',
					minute: '2-digit',
				})
			: '';
		if (time) {
			body = `${body}\n\n🕐 ${time}`;
		}

		// Configuración de la notificación
		const config: NotificationOptions = {
			body,
			icon: '/logo192.png?v=zentria1',
			badge: '/logo192.png?v=zentria1',
			tag: `notification-${n.id}`,
			requireInteraction: false,
			silent: false,
			...(n.event?.priority === 'P1' && { urgency: 'high' as any }),
		};

		try {
			const notification = new Notification(title, config);

			// Auto-cerrar en 5 segundos
			const autoCloseTimeout = setTimeout(() => {
				notification.close();
			}, 5000);

			// Click para enfocar y cerrar
			notification.onclick = () => {
				clearTimeout(autoCloseTimeout);
				window.focus();
				notification.close();
			};

			// Limpiar timeout al cerrar
			notification.onclose = () => {
				clearTimeout(autoCloseTimeout);
			};

			notification.onerror = (err) => {
				console.error('[Notificaciones] Error mostrando popup:', err);
				clearTimeout(autoCloseTimeout);
			};
		} catch (err) {
			console.error('[Notificaciones] Error creando popup:', err);
		}
	};

	return <>{children}</>;
};

export default NotificationsStreamProvider;
