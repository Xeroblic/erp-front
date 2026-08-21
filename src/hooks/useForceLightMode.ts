import { useEffect, useLayoutEffect, useRef } from 'react';
import { useAppSelector } from '../store';
import { selectIsDarkTheme } from '../store/slices/personalizacion/personalizacionSlice';

/**
 * Hook para forzar el modo "Light" (claro) en una página específica.
 * Evita que el `AppInitializer` o cambios en Redux vuelvan a aplicar
 * la clase `dark` mediante el uso de un MutationObserver.
 *
 * Uso: simplemente llama `useForceLightMode()` en el inicio de tu componente de página.
 */
const useForceLightMode = () => {
	const isDarkTheme = useAppSelector(selectIsDarkTheme);
	const latestThemePreferenceRef = useRef(isDarkTheme);

	useEffect(() => {
		latestThemePreferenceRef.current = isDarkTheme;
	}, [isDarkTheme]);

	useLayoutEffect(() => {
		if (typeof document === 'undefined') return undefined;

		const root = document.documentElement;
		const previousColorScheme = root.style.getPropertyValue('color-scheme');

		// Remover oscuridad inicial
		root.classList.remove('dark');
		root.style.setProperty('color-scheme', 'light');

		// "Guardián": Si algún componente global intenta inyectar el modo dark, lo removemos forzosamente
		const observer = new MutationObserver(() => {
			if (root.classList.contains('dark')) {
				root.classList.remove('dark');
			}
		});

		observer.observe(root, { attributes: true, attributeFilter: ['class'] });

		return () => {
			observer.disconnect();

			// Restaurar estado al desmontar el componente (recuperar el tema original del usuario)
			if (latestThemePreferenceRef.current) {
				root.classList.add('dark');
			} else {
				root.classList.remove('dark');
			}

			if (previousColorScheme) {
				root.style.setProperty('color-scheme', previousColorScheme);
			} else {
				root.style.removeProperty('color-scheme');
			}
		};
	}, []);
};

export default useForceLightMode;
