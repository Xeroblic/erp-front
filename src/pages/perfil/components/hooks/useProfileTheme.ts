import { useEffect, useRef } from 'react';
import { TDarkMode } from '@/types/darkMode.type';

type FormikLike = { values: { theme?: string } };

export function useProfileTheme(
	formik: FormikLike,
	darkMode: string,
	setDarkModeStatus: (m: TDarkMode) => Promise<void> | void,
) {
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
			void setDarkModeStatus(selectedTheme);
		}
	}, [formik.values.theme, darkMode, setDarkModeStatus]);
}
