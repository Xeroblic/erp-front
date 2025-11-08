/**
 * Hook useFieldValidation
 * Validación en tiempo real de campos usando el backend
 */
import { useState, useCallback, useRef } from 'react';
import { useAppDispatch } from '@/store';
import { validateField } from '@/store/slices/technicalReviews/thunks/validationThunks';
import type { EquipmentType } from '@/interface/technicalReviews.interface';
import { extractFieldValue } from '../constants/field-helpers.constant';

interface UseFieldValidationProps {
    branchId: number;
    equipmentType: EquipmentType;
    fieldName: string;
    debounceMs?: number;
}

interface ValidationResult {
    isValid: boolean;
    error: string | null;
    warning: string | null;
    suggestion: string | null;
    helpText: string | null;
}

export const useFieldValidation = ({
    branchId,
    equipmentType,
    fieldName,
    debounceMs = 500,
}: UseFieldValidationProps) => {
    const dispatch = useAppDispatch();
    const [validationResult, setValidationResult] = useState<ValidationResult>({
        isValid: true,
        error: null,
        warning: null,
        suggestion: null,
        helpText: null,
    });
    const [isValidating, setIsValidating] = useState(false);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Validar valor de campo
     */
    const validate = useCallback(
        async (value: any): Promise<boolean> => {
            // Cancelar validación pendiente
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // Si el valor está vacío, resetear validación
            if (value == null || value === '') {
                setValidationResult({
                    isValid: true,
                    error: null,
                    warning: null,
                    suggestion: null,
                    helpText: null,
                });
                return true;
            }

            // Debounce
            return new Promise((resolve) => {
                debounceTimerRef.current = setTimeout(async () => {
                    setIsValidating(true);

                    try {
                        const result = await dispatch(
                            validateField({
                                branchId,
                                data: {
                                    equipment_type: equipmentType,
                                    field_name: fieldName,
                                    field_value: extractFieldValue(value),
                                },
                            })
                        ).unwrap();

                        const newValidationResult: ValidationResult = {
                            isValid: result.valid,
                            error: result.errors?.[0] || null,
                            warning: result.warnings?.[0] || null,
                            suggestion: result.suggestion || null,
                            helpText: result.help_text || null,
                        };

                        setValidationResult(newValidationResult);
                        resolve(result.valid);
                    } catch (error) {
                        // Error de red o backend
                        setValidationResult({
                            isValid: true, // No bloquear por error de validación
                            error: null,
                            warning: 'No se pudo validar el campo',
                            suggestion: null,
                            helpText: null,
                        });
                        resolve(true);
                    } finally {
                        setIsValidating(false);
                    }
                }, debounceMs);
            });
        },
        [dispatch, branchId, equipmentType, fieldName, debounceMs]
    );

    /**
     * Resetear validación
     */
    const reset = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        setValidationResult({
            isValid: true,
            error: null,
            warning: null,
            suggestion: null,
            helpText: null,
        });
        setIsValidating(false);
    }, []);

    return {
        ...validationResult,
        isValidating,
        validate,
        reset,
    };
};
