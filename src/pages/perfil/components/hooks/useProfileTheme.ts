import { useEffect, useRef } from 'react';
import { runThemeWipe, cornerForThemeMode } from '@/utils/themeWipe.util';
import { TDarkMode } from '@/types/darkMode.type';

type FormikLike = { values: { theme?: string } };

export function useProfileTheme(formik: FormikLike, darkMode: string, setDarkModeStatus: (m: TDarkMode) => void) {
	const themeSyncingRef = useRef(false);

	useEffect(() => {
		const currentTheme = (darkMode || 'system') as TDarkMode;
		const formTheme = (formik.values.theme || 'system') as TDarkMode;
		if (currentTheme !== formTheme) {
			themeSyncingRef.current = true;
			(formik as any).setFieldValue?.('theme', currentTheme, false);
		}
	}, [darkMode, formik.values.theme]);

	useEffect(() => {
		const selectedTheme = (formik.values.theme || 'system') as TDarkMode;
		if (themeSyncingRef.current) {
			themeSyncingRef.current = false;
			return;
		}
		if (selectedTheme !== darkMode) {
			const corner = cornerForThemeMode(selectedTheme);
			runThemeWipe(corner, 900);
			requestAnimationFrame(() => document.documentElement.classList.add('theme-transition'));
			setTimeout(() => document.documentElement.classList.remove('theme-transition'), 950);
			setDarkModeStatus(selectedTheme);
		}
	}, [formik.values.theme, darkMode, setDarkModeStatus]);
}

