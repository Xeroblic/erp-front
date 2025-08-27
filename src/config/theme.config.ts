import DARK_MODE from '../constants/darkMode.constant';
import { TDarkMode } from '../types/darkMode.type';
import { TRounded } from '../types/rounded.type';
import { TColors } from '../types/colors.type';
import { TColorIntensity } from '../types/colorIntensities.type';
import { TBorderWidth } from '../types/borderWidth.type';
import { TLang } from '../types/lang.type';

type TThemeConfigs = {
	projectTitle: string;
	projectName: string;
	language: TLang;
	theme: TDarkMode;
	themeColor: TColors;
	themeColorShade: TColorIntensity;
	rounded: TRounded;
	/**
	 * UI Components
	 *
	 * If you give "border-0", you will remove the borders on the components.
	 */
	borderWidth: TBorderWidth;
	/**
	 * Default: 'transition-all duration-300 ease-in-out'
	 *
	 * For more information;
	 *
	 * https://tailwindcss.com/docs/transition-property
	 *
	 * https://tailwindcss.com/docs/transition-duration
	 *
	 * https://tailwindcss.com/docs/transition-timing-function
	 *
	 * https://tailwindcss.com/docs/transition-delay
	 */
	transition: string;
	fontSize: 12 | 13 | 14 | 15 | 16 | 17 | 18;
	/**
	 * Función para obtener configuración dinámica desde personalizacionUsuario
	 */
	getDynamicConfig: (personalizacionUsuario?: any) => TThemeConfigs;
};

// Función para obtener la personalización del usuario desde localStorage o store
const getPersonalizacionActual = () => {
	try {
		// Intentar obtener desde Redux store si está disponible
		if (typeof window !== 'undefined' && (window as any).__REDUX_STORE__) {
			const state = (window as any).__REDUX_STORE__.getState();
			if (state.personalizacion?.personalizacionUsuario) {
				return state.personalizacion.personalizacionUsuario;
			}
		}

		// Fallback a localStorage
		return {
			tcolor: localStorage.getItem('fyr_themeColor') || 'amber',
			tcolor_int: localStorage.getItem('fyr_themeColorShade') || '500',
			font_size: Number(localStorage.getItem('fyr_fontSize')) || 13,
			tema: localStorage.getItem('theme') === 'light' ? '1'
				: localStorage.getItem('theme') === 'dark' ? '2'
					: '3'
		};
	} catch (error) {
		// Si hay error, devolver valores por defecto
		return null;
	}
};

// Configuración base por defecto
const baseThemeConfig: TThemeConfigs = {
	projectTitle: '',
	projectName: '',
	language: 'en',
	theme: DARK_MODE.SYSTEM,

	// Getters dinámicos para colores y configuración
	get themeColor(): TColors {
		const personalizacion = getPersonalizacionActual();
		return (personalizacion?.tcolor as TColors) || 'amber';
	},

	get themeColorShade(): TColorIntensity {
		const personalizacion = getPersonalizacionActual();
		return (personalizacion?.tcolor_int as TColorIntensity) || '500';
	},

	get fontSize(): 12 | 13 | 14 | 15 | 16 | 17 | 18 {
		const personalizacion = getPersonalizacionActual();
		return (personalizacion?.font_size as 12 | 13 | 14 | 15 | 16 | 17 | 18) || 13;
	},

	rounded: 'rounded-lg',
	borderWidth: 'border-2',
	transition: 'transition-all duration-300 ease-in-out',

	getDynamicConfig(personalizacionUsuario?: any) {
		return {
			...this,
			...(personalizacionUsuario || {}),
			themeColor: (personalizacionUsuario?.tcolor as TColors) || this.themeColor,
			themeColorShade: (personalizacionUsuario?.tcolor_int as TColorIntensity) || this.themeColorShade,
			fontSize: personalizacionUsuario?.font_size || this.fontSize,
			theme: personalizacionUsuario?.tema === '1' ? DARK_MODE.LIGHT
				: personalizacionUsuario?.tema === '2' ? DARK_MODE.DARK
					: DARK_MODE.SYSTEM
		};
	}
};

export default baseThemeConfig;
