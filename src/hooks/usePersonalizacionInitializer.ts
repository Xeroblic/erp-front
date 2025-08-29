import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
    obtenerPersonalizacionThunk,
    selectPersonalizacionUsuario,
    selectIsInitialized,
    setFontSize,
    setThemeColor,
    setThemeColorShade,
    setDarkMode
} from '../store/slices/personalizacion/personalizacionSlice';
import useDarkModeManager from './useDarkModeManager.ts';
import DARK_MODE from '../constants/darkMode.constant';

/**
 * Hook para inicializar la personalización del usuario
 * - Carga datos de la API
 * - Aplica valores por defecto si no hay datos
 * - Maneja errores de API
 */
export const usePersonalizacionInitializer = () => {
    const dispatch = useAppDispatch();
    const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
    const isInitialized = useAppSelector(selectIsInitialized);
    const { syncFromAPI } = useDarkModeManager();

    useEffect(() => {
        const initializePersonalization = async () => {
            try {
                // Intentar cargar desde API
                const result = await dispatch(obtenerPersonalizacionThunk()).unwrap();

                if (!result || Object.values(result).every(val => val === null || val === undefined)) {
                    await applyDefaultValues();
                } else {
                    if (result.tema !== null && result.tema !== undefined) {
                        syncFromAPI(result.tema);
                    }
                }

            } catch (error) {
                await applyDefaultValues();
            }
        };

        // Solo inicializar una vez
        if (!isInitialized) {
            initializePersonalization();
        }
    }, [dispatch, isInitialized, syncFromAPI]);

    const applyDefaultValues = async () => {
        try {

            // Valores por defecto
            const defaultValues = {
                tema: 3, // SYSTEM
                font_size: 14,
                tcolor: 'amber' as const,
                tcolor_int: '500' as const
            };

            // Aplicar localmente
            dispatch(setFontSize(defaultValues.font_size));
            dispatch(setThemeColor(defaultValues.tcolor));
            dispatch(setThemeColorShade(defaultValues.tcolor_int));
            dispatch(setDarkMode(DARK_MODE.SYSTEM));

            // Intentar guardar en API
            try {
            } catch (saveError) {
                console.warn('No se pudieron guardar los valores por defecto en API:', saveError);
            }
        } catch (error) {
            console.error(' Error aplicando valores por defecto:', error);
        }
    };

    return {
        isInitialized,
        personalizacionUsuario,
        applyDefaultValues
    };
};

export default usePersonalizacionInitializer;
