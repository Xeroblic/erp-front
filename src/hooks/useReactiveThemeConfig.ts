import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hook';
import { selectThemeColor, selectThemeColorShade, selectFontSize, selectDarkMode } from '../store/slices/personalizacion/personalizacionSlice';
import { TColors } from '../types/colors.type';
import { TColorIntensity } from '../types/colorIntensities.type';

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
        themeColor: themeColor as TColors,
        themeColorShade: themeColorShade as TColorIntensity,
        fontSize,
        darkMode
    };
};

export default useReactiveThemeConfig;
