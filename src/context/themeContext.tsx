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
import {
	selectLanguage,
	selectAsideStatus,
	selectFontSize,
	selectThemeColor,
	selectThemeColorShade,
	selectDarkMode,
	selectIsDarkTheme,
	setLanguage,
	setAsideStatus,
	setFontSize,
	setThemeColor,
	setThemeColorShade,
	setDarkMode,
} from '../store/slices/personalizacion/personalizacionSlice';
import useDarkModeManager from '../hooks/useDarkModeManager.ts';
import useDeviceScreen from '../hooks/useDeviceScreen';
import { TLang } from '../types/lang.type';
import { useAppDispatch, useAppSelector } from '../store/hook';

// Interface simplificada - ahora solo para compatibilidad
export interface IThemeContextProps {
	isDarkTheme: boolean;
	darkModeStatus: TDarkMode;
	setDarkModeStatus: Dispatch<SetStateAction<TDarkMode>>;
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
	const dispatch = useAppDispatch();

	// Leer estado desde Redux
	const language = useAppSelector(selectLanguage);
	const fontSize = useAppSelector(selectFontSize);
	const themeColor = useAppSelector(selectThemeColor);
	const themeColorShade = useAppSelector(selectThemeColorShade);

	// Usar el nuevo hook de dark mode
	const { darkModeStatus, isDarkTheme, setDarkModeStatus } = useDarkModeManager();

	const { i18n } = useTranslation();

	useLayoutEffect(() => {
		i18n.changeLanguage(language)
			.then(() => {
				document.documentElement.setAttribute('dir', i18n.dir());
				document.documentElement.setAttribute('lang', i18n.language);
			})
			.catch((error) => {
				console.error('[ThemeContext] Error changing language:', error);
			});

		dayjs.locale(language);
	}, [language, i18n]);

	/**
	 * Aside Status for responsive design
	 */
	const { width } = useDeviceScreen();
	const [asideStatus, setAsideStatus] = useState(
		localStorage.getItem('zentria_asideStatus')
			? localStorage.getItem('zentria_asideStatus') === 'true'
			: true,
	);
	useLayoutEffect(() => {
		if (Number(theme.screens.md.replace('px', '')) <= Number(width))
			localStorage.setItem('zentria_asideStatus', asideStatus?.toString());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [asideStatus]);
	useEffect(() => {
		if (Number(theme.screens.md.replace('px', '')) > Number(width)) setAsideStatus(false);
		return () => {
			setAsideStatus(
				localStorage.getItem('zentria_asideStatus')
					? localStorage.getItem('zentria_asideStatus') === 'true'
					: true,
			);
		};
	}, [width]);

	/**
	 * Apply CSS variables when theme color changes
	 */
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
		} else {
			// Color no encontrado - sin warning para mantener consola limpia
		}
	}, [themeColor, themeColorShade]);

	/**
	 * Apply CSS variables when font size changes
	 */
	useLayoutEffect(() => {
		const root = document.documentElement;
		const fontSizeInRem = fontSize / 16; // Convertir px a rem (16px = 1rem)

		root.style.setProperty('--font-size-base', `${fontSizeInRem}rem`);
		root.style.setProperty('--font-size-px', `${fontSize}px`);

		// También aplicar directamente al html para mayor compatibilidad
		root.style.fontSize = `${fontSize}px`;
	}, [fontSize]);

	/**
	 * Wrapper functions for compatibility with existing components
	 */
	const setters = useMemo(
		() => ({
			setLanguage: (value: React.SetStateAction<TLang>) => {
				if (typeof value === 'function') {
					dispatch(setLanguage((value as (prev: TLang) => TLang)(language)));
				} else {
					dispatch(setLanguage(value));
				}
			},
			setDarkModeStatus: (value: React.SetStateAction<TDarkMode>) => {
				if (typeof value === 'function') {
					const newValue = (value as (prev: TDarkMode) => TDarkMode)(darkModeStatus);
					setDarkModeStatus(newValue);
				} else {
					setDarkModeStatus(value);
				}
			},
			// setAsideStatus: (value: React.SetStateAction<boolean>) => {
			//     if (typeof value === 'function') {
			//         dispatch(setAsideStatus((value as (prev: boolean) => boolean)(asideStatus)));
			//     } else {
			//         dispatch(setAsideStatus(value));
			//     }
			// },
			setFontSize: (value: React.SetStateAction<number>) => {
				if (typeof value === 'function') {
					dispatch(setFontSize((value as (prev: number) => number)(fontSize)));
				} else {
					dispatch(setFontSize(value));
				}
			},
			setThemeColor: (value: React.SetStateAction<TColors>) => {
				if (typeof value === 'function') {
					dispatch(setThemeColor((value as (prev: TColors) => TColors)(themeColor)));
				} else {
					dispatch(setThemeColor(value));
				}
			},
			setThemeColorShade: (value: React.SetStateAction<TColorIntensity>) => {
				if (typeof value === 'function') {
					dispatch(
						setThemeColorShade(
							(value as (prev: TColorIntensity) => TColorIntensity)(themeColorShade),
						),
					);
				} else {
					dispatch(setThemeColorShade(value));
				}
			},
		}),
		[dispatch, language, darkModeStatus, asideStatus, fontSize, themeColor, themeColorShade],
	);

	const values: IThemeContextProps = useMemo(
		() => ({
			isDarkTheme,
			darkModeStatus,
			setDarkModeStatus: setters.setDarkModeStatus,
			asideStatus,
			setAsideStatus,
			fontSize,
			setFontSize: setters.setFontSize,
			language,
			setLanguage: setters.setLanguage,
			themeColor,
			setThemeColor: setters.setThemeColor,
			themeColorShade,
			setThemeColorShade: setters.setThemeColorShade,
		}),
		[
			isDarkTheme,
			darkModeStatus,
			asideStatus,
			fontSize,
			language,
			themeColor,
			themeColorShade,
			setters,
		],
	);

	return <ThemeContext.Provider value={values}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
