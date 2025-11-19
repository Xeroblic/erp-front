import { RefObject, useEffect, useLayoutEffect, useState } from 'react';

/**
 * Hook para obtener el DOMRect de un elemento referenciado.
 * Ahora es genérico y acepta refs con posible valor null (RefObject<T | null>).
 */
const useDomRect = <T extends HTMLElement = HTMLElement>(ref: RefObject<T | null>): [DOMRect | null] => {
	const [domRect, setDomRect] = useState<DOMRect | null>(null);

	useLayoutEffect(() => {
		setDomRect(ref?.current ? ref.current.getBoundingClientRect() : null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const scrollHandler = () => {
			setDomRect(ref?.current ? ref.current.getBoundingClientRect() : null);
		};
		window.addEventListener('scroll', scrollHandler, true);
		return () => {
			window.removeEventListener('scroll', scrollHandler, true);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return [domRect];
};

export default useDomRect;
