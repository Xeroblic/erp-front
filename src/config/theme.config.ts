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
		if (typeof window !== 'undefined' && (window as any).__REDUX_STORE__) {
			const state = (window as any).__REDUX_STORE__.getState();
			if (state.personalizacion?.personalizacionUsuario) {
				return state.personalizacion.personalizacionUsuario;
			}
		}
		return {
			tcolor: localStorage.getItem('zentria_themeColor') || 'amber',
			tcolor_int: localStorage.getItem('zentria_themeColorShade') || '500',
			font_size: Number(localStorage.getItem('zentria_fontSize')) || 13,
			tema:
				localStorage.getItem('theme') === 'light'
					? '1'
					: localStorage.getItem('theme') === 'dark'
						? '2'
						: '3',
		};
	} catch (error) {
		return null;
	}
};

const baseThemeConfig: TThemeConfigs = {
	projectTitle: '',
	projectName: '',
	language: 'es',
	theme: DARK_MODE.LIGHT,

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
			themeColorShade:
				(personalizacionUsuario?.tcolor_int as TColorIntensity) || this.themeColorShade,
			fontSize: personalizacionUsuario?.font_size || this.fontSize,
			theme:
				personalizacionUsuario?.tema === '1'
					? DARK_MODE.LIGHT
					: personalizacionUsuario?.tema === '2'
						? DARK_MODE.DARK
						: (localStorage.getItem('theme') as TDarkMode) || DARK_MODE.LIGHT,
		};
	},
};

export default baseThemeConfig;
