import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Hook para obtener el DOMRect de un elemento referenciado.
 * Ahora es genérico y acepta refs con posible valor null (RefObject<T | null>).
 */
const useDomRect = <T extends HTMLElement = HTMLElement>(
	ref: RefObject<T | null>,
): [DOMRect | null] => {
	const [domRect, setDomRect] = useState<DOMRect | null>(null);
	const rafIdRef = useRef<number | null>(null);
	const resizeObserverRef = useRef<ResizeObserver | null>(null);

	const updateRect = () => {
		const nextRect = ref?.current ? ref.current.getBoundingClientRect() : null;
		setDomRect(nextRect);
	};

	const scheduleUpdate = () => {
		if (rafIdRef.current !== null) return;
		rafIdRef.current = window.requestAnimationFrame(() => {
			rafIdRef.current = null;
			updateRect();
		});
	};

	useLayoutEffect(() => {
		updateRect();
		return () => {
			if (rafIdRef.current !== null) {
				window.cancelAnimationFrame(rafIdRef.current);
				rafIdRef.current = null;
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ref?.current]);

	useEffect(() => {
		const element = ref?.current;
		if (!element) return;

		const observer = new ResizeObserver(() => {
			scheduleUpdate();
		});
		observer.observe(element);
		resizeObserverRef.current = observer;

		const scrollHandler = () => {
			scheduleUpdate();
		};
		window.addEventListener('scroll', scrollHandler, { passive: true, capture: true });
		window.addEventListener('resize', scrollHandler, { passive: true });
		return () => {
			window.removeEventListener('scroll', scrollHandler, true);
			window.removeEventListener('resize', scrollHandler);
			observer.disconnect();
			resizeObserverRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ref?.current]);

	return [domRect];
};

export default useDomRect;
