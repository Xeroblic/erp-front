import React, { useEffect, useRef } from 'react';
import { useAppSelector } from '@/store';
import { toast } from 'react-toastify';

/**
 * Provider ligero que observa cambios en las notificaciones globales para mostrar avisos.
 * Debe envolver el arbol principal de la app (en App.tsx).
 */
const NotificationsStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { items } = useAppSelector((s) => s.notifications ?? { items: [] });
	const bootstrappedRef = useRef(false);
	const lastSeenIdRef = useRef<number>(0);

	useEffect(() => {
		if (!bootstrappedRef.current) {
			if (!items.length) return;
			const initialMax = items.reduce((max, it) => (it.id > max ? it.id : max), 0);
			lastSeenIdRef.current = initialMax;
			bootstrappedRef.current = true;
			return;
		}

		if (!items.length) {
			lastSeenIdRef.current = 0;
			return;
		}

		const prevMax = lastSeenIdRef.current;
		const currentMax = items.reduce((max, it) => (it.id > max ? it.id : max), prevMax);
		if (currentMax <= prevMax) return;

		const newItems = items.filter((n) => n.id > prevMax);
		if (!newItems.length) {
			lastSeenIdRef.current = currentMax;
			return;
		}

		newItems.forEach((n) => {
			const msg = n.message ?? n.event?.type_label ?? n.event?.type_key ?? 'Notificacion';
			try {
				toast.info(msg);
			} catch (_) {
				/* noop */
			}
		});
		lastSeenIdRef.current = currentMax;
	}, [items]);

	return <>{children}</>;
};

export default NotificationsStreamProvider;
