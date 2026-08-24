import { useAppSelector } from '../store/hook';
import {
	selectThemeColor,
	selectThemeColorShade,
	selectFontSize,
	selectDarkMode,
} from '../store/slices/personalizacion/personalizacionSlice';
import { TColorIntensity } from '../types/colorIntensities.type';

/**
 * Ajusta la intensidad del color por un offset
 * @param baseShade - El shade base (ej: '500')
 * @param offset - El offset a aplicar (ej: +100 para más oscuro, -100 para más claro)
 * @returns El nuevo shade ajustado, limitado a valores válidos de Tailwind
 *
 * @example
 * adjustShade('500', +100); // Retorna '600'
 * adjustShade('500', -200); // Retorna '300'
 * adjustShade('900', +200); // Retorna '950' (clamped)
 */
export const adjustShade = (baseShade: TColorIntensity, offset: number): TColorIntensity => {
	const shadeNum = parseInt(baseShade, 10);
	let newShade = shadeNum + offset;

	// Clamp to valid Tailwind shades (50-950)
	if (newShade < 50) newShade = 50;
	if (newShade > 950) newShade = 950;

	// Round to nearest valid shade
	const validShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
	const closest = validShades.reduce((prev, curr) =>
		Math.abs(curr - newShade) < Math.abs(prev - newShade) ? curr : prev,
	);

	return closest.toString() as TColorIntensity;
};

/**
 * Hook que proporciona los colores del tema de forma reactiva
 * Se actualiza automáticamente cuando cambia la personalización del usuario
 */
export const useReactiveThemeConfig = () => {
	const themeColor = useAppSelector(selectThemeColor);
	const themeColorShade = useAppSelector(selectThemeColorShade);
	const fontSize = useAppSelector(selectFontSize);
	const darkMode = useAppSelector(selectDarkMode);

	return {
		themeColor,
		themeColorShade,
		fontSize,
		darkMode,
	};
};

export default useReactiveThemeConfig;
