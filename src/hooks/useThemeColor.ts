import { useAppDispatch, useAppSelector } from '@/store';
import {
	selectThemeColor,
	selectThemeColorShade,
	setThemeColor,
	setThemeColorShade,
} from '@/store/slices/personalizacion/personalizacionSlice';
import { TColors } from '@/types/colors.type';
import { TColorIntensity } from '@/types/colorIntensities.type';

const useThemeColor = () => {
	const dispatch = useAppDispatch();
	const themeColor = useAppSelector(selectThemeColor);
	const themeColorShade = useAppSelector(selectThemeColorShade);

	const handleSetThemeColor = (newThemeColor: TColors) => {
		dispatch(setThemeColor(newThemeColor));
	};

	const handleSetThemeColorShade = (newThemeColorShade: TColorIntensity) => {
		dispatch(setThemeColorShade(newThemeColorShade));
	};

	return {
		themeColor,
		setThemeColor: handleSetThemeColor,
		themeColorShade,
		setThemeColorShade: handleSetThemeColorShade,
	};
};

export default useThemeColor;
