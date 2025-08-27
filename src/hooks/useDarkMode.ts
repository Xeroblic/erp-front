import { useAppDispatch, useAppSelector } from '@/store';
import {
	selectDarkMode,
	selectIsDarkTheme,
	setDarkMode
} from '@/store/slices/personalizacion/personalizacionSlice';
import { TDarkMode } from '@/types/darkMode.type';

export default function useDarkMode() {
	const dispatch = useAppDispatch();
	const darkModeStatus = useAppSelector(selectDarkMode);
	const isDarkTheme = useAppSelector(selectIsDarkTheme);

	const handleSetDarkModeStatus = (newDarkMode: TDarkMode) => {
		dispatch(setDarkMode(newDarkMode));
	};

	return {
		isDarkTheme,
		darkModeStatus,
		setDarkModeStatus: handleSetDarkModeStatus
	};
}
