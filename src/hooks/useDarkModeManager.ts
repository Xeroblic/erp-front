import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
    selectDarkMode,
    selectIsDarkTheme,
    setDarkMode,
    actualizarPersonalizacionThunk
} from '../store/slices/personalizacion/personalizacionSlice';
import { TDarkMode } from '../types/darkMode.type';
import DARK_MODE from '../constants/darkMode.constant';

/**
 * Hook profesional para el manejo del Dark Mode
 * - Sincroniza con Redux
 * - Aplica clases al DOM
 * - Guarda en la API
 * - Maneja el modo sistema automÃ¡ticamente
 */
export const useDarkModeManager = () => {
    const dispatch = useAppDispatch();
    const darkModeStatus = useAppSelector(selectDarkMode);
    const isDarkTheme = useAppSelector(selectIsDarkTheme);

    // Aplicar clases dark al DOM cuando cambie el estado
    useEffect(() => {
        const htmlElement = document.documentElement;

        if (isDarkTheme) {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
    }, [isDarkTheme]);

    // Listener para cambios del sistema cuando estÃ¡ en modo 'system'
    useEffect(() => {
        if (darkModeStatus === DARK_MODE.SYSTEM) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const handleSystemChange = (_e: MediaQueryListEvent) => {
                // El selector ya maneja esto automÃ¡ticamente, solo forzamos re-render
            };

            mediaQuery.addEventListener('change', handleSystemChange);

            return () => {
                mediaQuery.removeEventListener('change', handleSystemChange);
            };
        }
    }, [darkModeStatus]);

    const setDarkModeStatus = async (newMode: TDarkMode, saveToAPI: boolean = true) => {
        if (newMode === darkModeStatus) {
            return;
        }

        // Actualizar estado local inmediatamente
        dispatch(setDarkMode(newMode));

        // Guardar en API si se solicita
        if (saveToAPI) {
            try {
                const temaNumerico =
                    newMode === DARK_MODE.LIGHT ? 1 :
                    newMode === DARK_MODE.DARK ? 2 : 3;

                await dispatch(
                    actualizarPersonalizacionThunk({ tema: temaNumerico })
                ).unwrap();
            } catch (_error) {
                // Silenciado
            }
        }
    };

    /**
     * FunciÃ³n para alternar entre light y dark (sin system)
     */
    const toggleDarkMode = () => {
        const newMode = isDarkTheme ? DARK_MODE.LIGHT : DARK_MODE.DARK;
        setDarkModeStatus(newMode);
    };

    /**
     * FunciÃ³n para sincronizar desde datos de API
     * @param temaFromAPI - Valor tema de la API (1=light, 2=dark, 3=system)
     */
    const syncFromAPI = (temaFromAPI: number) => {
        const mappedMode =
            temaFromAPI === 1 ? DARK_MODE.LIGHT :
            temaFromAPI === 2 ? DARK_MODE.DARK : DARK_MODE.SYSTEM;

        // Solo actualizar Redux, no guardar de vuelta en API
        dispatch(setDarkMode(mappedMode));
    };

    return {
        darkModeStatus,
        isDarkTheme,
        setDarkModeStatus,
        toggleDarkMode,
        syncFromAPI,

        // Utilidades
        isLight: darkModeStatus === DARK_MODE.LIGHT,
        isDark: darkModeStatus === DARK_MODE.DARK,
        isSystem: darkModeStatus === DARK_MODE.SYSTEM,
        systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches
    };
};

export default useDarkModeManager;
