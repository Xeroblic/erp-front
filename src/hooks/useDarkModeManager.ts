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
import { runThemeWipe, cornerForThemeMode } from '../utils/themeWipe.util';
import type { TWipeCorner } from '../utils/themeWipe.util';

const DEFAULT_TRANSITION_DURATION = 420;
const THEME_EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
let themeTransitionTimeout: number | undefined;
let themeTransitionRaf: number | undefined;
type ThemeTransitionEffect = 'fade' | 'wipe';

let activeFadeAnimation: Animation | null = null;

const clearThemeTransition = () => {
	if (typeof window === 'undefined' || typeof document === 'undefined') return;

	if (themeTransitionTimeout) {
		window.clearTimeout(themeTransitionTimeout);
		themeTransitionTimeout = undefined;
	}

	if (themeTransitionRaf) {
		window.cancelAnimationFrame(themeTransitionRaf);
		themeTransitionRaf = undefined;
	}

	if (activeFadeAnimation) {
		activeFadeAnimation.cancel();
		activeFadeAnimation = null;
	}

	document.documentElement.classList.remove('theme-transition');
	document.documentElement.style.removeProperty('--theme-transition-duration');
	document.documentElement.style.removeProperty('--theme-transition-easing');
	document.querySelectorAll('.theme-wipe-overlay').forEach((node) => node.remove());
};

const scheduleThemeTransition = (duration: number) => {
	if (typeof window === 'undefined' || typeof document === 'undefined') return;

	clearThemeTransition();

	const htmlElement = document.documentElement;
	const appliedDuration =
		Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_TRANSITION_DURATION;
	htmlElement.style.setProperty('--theme-transition-duration', `${appliedDuration}ms`);
	htmlElement.style.setProperty('--theme-transition-easing', THEME_EASING);
	htmlElement.classList.add('theme-transition');
	themeTransitionRaf = window.requestAnimationFrame(() => {
		void htmlElement.offsetHeight;
	});

	themeTransitionTimeout = window.setTimeout(() => {
		htmlElement.classList.remove('theme-transition');
		htmlElement.style.removeProperty('--theme-transition-duration');
		htmlElement.style.removeProperty('--theme-transition-easing');
		themeTransitionTimeout = undefined;
	}, appliedDuration + 150);
};

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

const runFadeTransition = (duration: number) => {
	if (typeof document === 'undefined') return;
	if (
		typeof window !== 'undefined' &&
		window.matchMedia &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	) {
		return;
	}

	const htmlElement = document.documentElement as HTMLElement & {
		animate?: (
			keyframes: Keyframe[] | PropertyIndexedKeyframes,
			options?: number | KeyframeAnimationOptions,
		) => Animation;
	};

	if (typeof htmlElement.animate !== 'function') return;

	if (activeFadeAnimation) {
		activeFadeAnimation.cancel();
		activeFadeAnimation = null;
	}

	activeFadeAnimation = htmlElement.animate(
		[
			{ opacity: 1, filter: 'none' },
			{ opacity: 0.94, filter: 'brightness(0.96) saturate(0.96)' },
			{ opacity: 1, filter: 'none' },
		],
		{
			duration,
			easing: THEME_EASING,
		},
	);

	const clearAnimation = () => {
		activeFadeAnimation = null;
	};

	activeFadeAnimation.addEventListener('finish', clearAnimation, { once: true });
	activeFadeAnimation.addEventListener('cancel', clearAnimation, { once: true });
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

		const { saveToAPI, animate, duration, corner, effect } = normalizeOptions(options);
		const transitionDuration =
			Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_TRANSITION_DURATION;

		const applyTheme = () => {
			dispatch(setDarkMode(newMode));
		};

		const runAnimatedThemeChange = () => {
			scheduleThemeTransition(transitionDuration);
			if (effect === 'wipe') {
				const wipeCorner = corner ?? cornerForThemeMode(newMode);
				runThemeWipe(wipeCorner, transitionDuration);
			} else {
				runFadeTransition(transitionDuration);
			}
			applyTheme();
		};

		const prefersReducedMotion =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

		try {
			if (!animate || prefersReducedMotion) {
				clearThemeTransition();
				applyTheme();
			} else {
				const doc = typeof document !== 'undefined' ? document : null;
				const startViewTransition =
					doc && typeof (doc as any).startViewTransition === 'function'
						? ((doc as any).startViewTransition as (
								callback: () => void | Promise<void>,
							) => { finished?: Promise<void> })
						: null;

				if (startViewTransition) {
					try {
						const viewTransition = startViewTransition(() => {
							runAnimatedThemeChange();
						});
						await viewTransition?.finished?.catch(() => {});
					} catch {
						runAnimatedThemeChange();
					}
				} else {
					runAnimatedThemeChange();
				}
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
