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

// Configuración base por defecto
const baseThemeConfig: TThemeConfigs = {
	projectTitle: '',
	projectName: '',
	language: 'en',
	theme: DARK_MODE.SYSTEM,
	themeColor: 'amber' as TColors,
	themeColorShade: '500',
	rounded: 'rounded-lg',
	borderWidth: 'border-2',
	transition: 'transition-all duration-300 ease-in-out',
	fontSize: 13,
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
