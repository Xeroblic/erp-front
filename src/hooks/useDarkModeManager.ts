import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
	selectDarkMode,
	selectIsDarkTheme,
	setDarkMode,
	actualizarPersonalizacionThunk,
} from '../store/slices/personalizacion/personalizacionSlice';
import { TDarkMode } from '../types/darkMode.type';
import DARK_MODE from '../constants/darkMode.constant';
import { runGsapThemeTransition } from '../utils/themeGsapTransition.util';
import type { TWipeCorner } from '../utils/themeWipe.util'; // Keep type if used in options type definition, though we might want to deprecate it. Let's keep it clean.

const DEFAULT_TRANSITION_DURATION = 420;
// EASING constants removed as they are now handled by GSAP internally or in the util.

type ThemeTransitionEffect = 'fade' | 'wipe';

type SetDarkModeOptions = {
	saveToAPI?: boolean;
	animate?: boolean;
	duration?: number;
	corner?: TWipeCorner;
	effect?: ThemeTransitionEffect;
};

const normalizeOptions = (
	value?: boolean | SetDarkModeOptions,
): Required<Pick<SetDarkModeOptions, 'saveToAPI' | 'animate'>> & {
	duration: number;
	corner?: TWipeCorner;
	effect: ThemeTransitionEffect;
} => {
	if (typeof value === 'boolean') {
		return {
			saveToAPI: value,
			animate: true,
			duration: DEFAULT_TRANSITION_DURATION,
			effect: 'fade',
		};
	}

	return {
		saveToAPI: value?.saveToAPI ?? true,
		animate: value?.animate ?? true,
		duration: value?.duration ?? DEFAULT_TRANSITION_DURATION,
		corner: value?.corner,
		effect: value?.effect ?? 'fade',
	};
};


/**
 * Hook profesional para el manejo del Dark Mode
 * - Sincroniza con Redux
 * - Aplica clases al DOM
 * - Guarda en la API
 * - Maneja el modo sistema automáticamente
 */
export const useDarkModeManager = () => {
	const dispatch = useAppDispatch();
	const darkModeStatus = useAppSelector(selectDarkMode);
	const isDarkTheme = useAppSelector(selectIsDarkTheme);

	// Aplicar clases dark al DOM cuando cambie el estado
	useEffect(() => {
		const htmlElement = document.documentElement;

		if (isDarkTheme) {
			htmlElement.classList.add('dark');
		} else {
			htmlElement.classList.remove('dark');
		}
	}, [isDarkTheme]);

	// Listener para cambios del sistema cuando está en modo 'system'
	useEffect(() => {
		if (darkModeStatus === DARK_MODE.SYSTEM) {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

			const handleSystemChange = (_e: MediaQueryListEvent) => {
				// El selector ya maneja esto automáticamente, solo forzamos re-render
			};

			mediaQuery.addEventListener('change', handleSystemChange);

			return () => {
				mediaQuery.removeEventListener('change', handleSystemChange);
			};
		}
	}, [darkModeStatus]);

	const setDarkModeStatus = async (
		newMode: TDarkMode,
		options?: boolean | SetDarkModeOptions,
	) => {
		if (newMode === darkModeStatus) {
			return;
		}

		const { saveToAPI, animate } = normalizeOptions(options);

		const applyTheme = () => {
			dispatch(setDarkMode(newMode));
		};

		const prefersReducedMotion =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

		try {
			if (!animate || prefersReducedMotion) {
				applyTheme();
			} else {
				// Use the new GSAP transition
				// We don't need to distinguish between wipe/fade anymore as the user requested "Circular Reveal Transition" implies one unified effect.
				// However, if we wanted to support 'fade' as fallback, we could keep it, but the user was specific about the effect.
				// We'll trust the GSAP util primarily.
				
                // Dynamically import to ensure no SSR issues / circular deps if any, though standard import is fine.
                // Using standard import since we added it to imports above (wait, I need to add the import).
                runGsapThemeTransition(newMode, applyTheme);
			}

			// Guardar en API si se solicita
			if (saveToAPI) {
				try {
					const temaNumerico =
						newMode === DARK_MODE.LIGHT ? 1 : newMode === DARK_MODE.DARK ? 2 : 3;

					await dispatch(actualizarPersonalizacionThunk({ tema: temaNumerico })).unwrap();
				} catch (_error) {
					// Silenciado
				}
			}
		} catch (error) {
			console.error('Error changing theme:', error);
		}
	};

	/**
	 * Función para alternar entre light y dark (sin system)
	 */
	const toggleDarkMode = () => {
		const newMode = isDarkTheme ? DARK_MODE.LIGHT : DARK_MODE.DARK;
		void setDarkModeStatus(newMode, true);
	};

	/**
	 * Función para sincronizar desde datos de API
	 * @param temaFromAPI - Valor tema de la API (1=light, 2=dark, 3=system)
	 */
	const syncFromAPI = (temaFromAPI: number) => {
		const mappedMode =
			temaFromAPI === 1
				? DARK_MODE.LIGHT
				: temaFromAPI === 2
					? DARK_MODE.DARK
					: DARK_MODE.SYSTEM;

		// Solo actualizar Redux, no guardar de vuelta en API
		dispatch(setDarkMode(mappedMode));
	};

	return {
		darkModeStatus,
		isDarkTheme,
		setDarkModeStatus,
		toggleDarkMode,
		syncFromAPI,

		// Utilidades
		isLight: darkModeStatus === DARK_MODE.LIGHT,
		isDark: darkModeStatus === DARK_MODE.DARK,
		isSystem: darkModeStatus === DARK_MODE.SYSTEM,
		systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
	};
};

export default useDarkModeManager;
