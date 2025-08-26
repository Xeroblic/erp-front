import React, {
	createContext,
	Dispatch,
	FC,
	ReactNode,
	SetStateAction,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from 'react';
import theme from 'tailwindcss/defaultTheme';
import colors from 'tailwindcss/colors';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { TDarkMode } from '../types/darkMode.type';
import { TColors } from '../types/colors.type';
import { TColorIntensity } from '../types/colorIntensities.type';
import DARK_MODE from '../constants/darkMode.constant';
import THEME_COLOR from '../constants/themeColor.constant';
import themeConfig from '../config/theme.config';
import useDeviceScreen from '../hooks/useDeviceScreen';
import { TLang } from '../types/lang.type';
import { useAppDispatch, useAppSelector } from '../store/hook';
import { actualizarPersonalizacionThunk, obtenerPersonalizacionThunk } from '@/store';

export interface IThemeContextProps {
	isDarkTheme: boolean;
	darkModeStatus: TDarkMode | null;
	setDarkModeStatus: Dispatch<SetStateAction<TDarkMode | null>>;
	asideStatus: boolean;
	setAsideStatus: Dispatch<SetStateAction<boolean>>;
	fontSize: number;
	setFontSize: Dispatch<SetStateAction<number>>;
	language: TLang;
	setLanguage: Dispatch<SetStateAction<TLang>>;
	themeColor: TColors;
	setThemeColor: Dispatch<SetStateAction<TColors>>;
	themeColorShade: TColorIntensity;
	setThemeColorShade: Dispatch<SetStateAction<TColorIntensity>>;
}
const ThemeContext = createContext<IThemeContextProps>({} as IThemeContextProps);

interface IThemeContextProviderProps {
	children: ReactNode;
}
export const ThemeContextProvider: FC<IThemeContextProviderProps> = ({ children }) => {
	/**
	 * Get personalization from Redux store
	 */
	const { personalizacionUsuario } = useAppSelector((state) => state.auth);
	const dispatch = useAppDispatch();

	/**
	 * Language
	 */
	const { i18n } = useTranslation();
	const [language, setLanguage] = useState<TLang>(
		(localStorage.getItem('fyr_language') as TLang) || themeConfig.language,
	);
	useLayoutEffect(() => {
		localStorage.setItem('fyr_language', language);

		i18n.changeLanguage(language)
			.then(() => {
				document.documentElement.setAttribute('dir', i18n.dir());
				document.documentElement.setAttribute('lang', i18n.language);
			})
			.catch(() => { });

		// Changing the global locale doesn't affect existing instances.
		// more information: https://day.js.org/docs/en/i18n/changing-locale
		// If you want the current instances to change instantly: dayjs().locale(i18n.language)
		dayjs.locale(language);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [language]);

	/**
	 * Dark Mode
	 */
	const [darkModeStatus, setDarkModeStatus] = useState<TDarkMode | null>(
		(localStorage.getItem('theme') || themeConfig.theme) as TDarkMode,
	);
	const [isDarkTheme, setIsDarkTheme] = useState<boolean>(darkModeStatus === DARK_MODE.DARK);
	useLayoutEffect(() => {
		localStorage.setItem('theme', darkModeStatus as string);

		if (
			localStorage.getItem('theme') === DARK_MODE.DARK ||
			(localStorage.getItem('theme') === DARK_MODE.SYSTEM &&
				window.matchMedia(`(prefers-color-scheme: ${DARK_MODE.DARK})`).matches)
		) {
			document.documentElement.classList.add(DARK_MODE.DARK);
			setIsDarkTheme(true);
		} else {
			document.documentElement.classList.remove(DARK_MODE.DARK);
			setIsDarkTheme(false);
		}
	}, [darkModeStatus]);

	/**
	 * Aside Status
	 */
	const { width } = useDeviceScreen();
	const [asideStatus, setAsideStatus] = useState(
		localStorage.getItem('fyr_asideStatus')
			? localStorage.getItem('fyr_asideStatus') === 'true'
			: true,
	);
	useLayoutEffect(() => {
		if (Number(theme.screens.md.replace('px', '')) <= Number(width))
			localStorage.setItem('fyr_asideStatus', asideStatus?.toString());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [asideStatus]);
	useEffect(() => {
		if (Number(theme.screens.md.replace('px', '')) > Number(width)) setAsideStatus(false);
		return () => {
			setAsideStatus(
				localStorage.getItem('fyr_asideStatus')
					? localStorage.getItem('fyr_asideStatus') === 'true'
					: true,
			);
		};
	}, [width]);

	/**
	 * Font Size
	 */
	const [fontSize, setFontSize] = useState<number>(
		Number(localStorage.getItem('fyr_fontSize'))
			? Number(localStorage.getItem('fyr_fontSize'))
			: themeConfig.fontSize,
	);
	useLayoutEffect(() => {
		localStorage.setItem('fyr_fontSize', fontSize?.toString());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fontSize]);

	/**
	 * Theme Color - Primero localStorage, luego config por defecto (Redux se sincroniza después)
	 */
	const [themeColor, setThemeColor] = useState<TColors>(() => {
		// Prioridad: localStorage > config por defecto
		// Redux se sincronizará después cuando esté disponible
		const storedColor = localStorage.getItem('fyr_themeColor') as TColors;
		console.log('🚀 Inicializando themeColor:', storedColor || themeConfig.themeColor);
		return storedColor || themeConfig.themeColor;
	});
	const [themeColorShade, setThemeColorShade] = useState<TColorIntensity>(() => {
		// Prioridad: localStorage > config por defecto  
		// Redux se sincronizará después cuando esté disponible
		const storedShade = localStorage.getItem('fyr_themeColorShade') as TColorIntensity;
		console.log('🚀 Inicializando themeColorShade:', storedShade || themeConfig.themeColorShade);
		return storedShade || themeConfig.themeColorShade;
	});

	// Sync with personalizacionUsuario from Redux - cuando lleguen los datos correctos
	useEffect(() => {
		// Solo sincronizar si hay datos de personalización válidos y son diferentes
		if (personalizacionUsuario?.tcolor && personalizacionUsuario.tcolor !== themeColor) {
			console.log('🔄 Actualizando color desde Redux:', personalizacionUsuario.tcolor, '(anterior:', themeColor, ')');
			setThemeColor(personalizacionUsuario.tcolor as TColors);
		}
		if (personalizacionUsuario?.tcolor_int && personalizacionUsuario.tcolor_int !== themeColorShade) {
			console.log('🔄 Actualizando intensidad desde Redux:', personalizacionUsuario.tcolor_int, '(anterior:', themeColorShade, ')');
			setThemeColorShade(personalizacionUsuario.tcolor_int as TColorIntensity);
		}
	}, [personalizacionUsuario]);

	// Persistir cambios locales en localStorage
	useLayoutEffect(() => {
		localStorage.setItem('fyr_themeColor', themeColor);
		localStorage.setItem('fyr_themeColorShade', themeColorShade);
		console.log('� Guardando en localStorage:', { themeColor, themeColorShade });
	}, [themeColor, themeColorShade]);

	// Apply CSS variables when theme color changes
	useLayoutEffect(() => {
		const root = document.documentElement;

		// Get the color palette from Tailwind colors
		const colorPalette = colors[themeColor as keyof typeof colors] as any;

		if (colorPalette && typeof colorPalette === 'object') {
			// Apply CSS variables for primary colors using actual color values
			root.style.setProperty('--color-primary-50', colorPalette[50] || colorPalette['50']);
			root.style.setProperty('--color-primary-100', colorPalette[100] || colorPalette['100']);
			root.style.setProperty('--color-primary-200', colorPalette[200] || colorPalette['200']);
			root.style.setProperty('--color-primary-300', colorPalette[300] || colorPalette['300']);
			root.style.setProperty('--color-primary-400', colorPalette[400] || colorPalette['400']);
			root.style.setProperty('--color-primary-500', colorPalette[500] || colorPalette['500']);
			root.style.setProperty('--color-primary-600', colorPalette[600] || colorPalette['600']);
			root.style.setProperty('--color-primary-700', colorPalette[700] || colorPalette['700']);
			root.style.setProperty('--color-primary-800', colorPalette[800] || colorPalette['800']);
			root.style.setProperty('--color-primary-900', colorPalette[900] || colorPalette['900']);
			root.style.setProperty('--color-primary-950', colorPalette[950] || colorPalette['950']);

			console.log(`🎨 Tema aplicado correctamente: ${themeColor}-${themeColorShade}`, {
				color: colorPalette[themeColorShade],
				palette: colorPalette
			});
		} else {
			console.warn(`🎨 Color ${themeColor} no encontrado en la paleta de colores`);
		}
	}, [themeColor, themeColorShade]);

	const values: IThemeContextProps = useMemo(
		() => ({
			isDarkTheme,
			darkModeStatus,
			setDarkModeStatus,
			asideStatus,
			setAsideStatus,
			fontSize,
			setFontSize,
			language,
			setLanguage,
			themeColor,
			setThemeColor,
			themeColorShade,
			setThemeColorShade,
		}),
		[isDarkTheme, darkModeStatus, asideStatus, fontSize, language, themeColor, themeColorShade],
	);

	// Context Provider color


	return <ThemeContext.Provider value={values}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
