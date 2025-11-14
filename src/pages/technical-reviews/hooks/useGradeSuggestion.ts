/**
 * Hook useGradeSuggestion
 * Obtener sugerencia de grado automática
 */
import { useState, useCallback, useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { suggestGrade } from '@/store/slices/technicalReviews/thunks/validationThunks';

interface GradeSuggestionData {
    suggested_grade: string;
    grade_label: string;
    grade_description?: string;
    confidence: number;
    total_score: number;
    breakdown: Record<string, any>;
    reasoning: string[];
    is_auto_assignable: boolean;
    warnings: string[]; // Array de strings, no objetos
}

interface UseGradeSuggestionProps {
    branchId: number;
    itemId: number | null | undefined;
    autoFetch?: boolean; // Fetch automáticamente al montar
}

export const useGradeSuggestion = ({
    branchId,
    itemId,
    autoFetch = false,
}: UseGradeSuggestionProps) => {
    const dispatch = useAppDispatch();
    const [gradeData, setGradeData] = useState<GradeSuggestionData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch grade suggestion
     */
    const fetchGradeSuggestion = useCallback(async (): Promise<GradeSuggestionData | null> => {
        if (!itemId) {
            setError('No se puede calcular el grado sin un item ID');
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await dispatch(
                suggestGrade({
                    branchId,
                    itemId,
                })
            ).unwrap();

            setGradeData(result);
            return result;
        } catch (err: any) {
            const errorMessage =
                err?.message || 'No se pudo calcular la sugerencia de grado';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, branchId, itemId]);

    /**
     * Refrescar sugerencia
     */
    const refresh = useCallback(() => {
        return fetchGradeSuggestion();
    }, [fetchGradeSuggestion]);

    /**
     * Resetear estado
     */
    const reset = useCallback(() => {
        setGradeData(null);
        setError(null);
        setIsLoading(false);
    }, []);

    /**
     * Auto-fetch si está habilitado
     */
    useEffect(() => {
        if (autoFetch && itemId) {
            fetchGradeSuggestion();
        }
    }, [autoFetch, itemId, fetchGradeSuggestion]);

    return {
        gradeData,
        isLoading,
        error,
        fetchGradeSuggestion,
        refresh,
        reset,
    };
};
