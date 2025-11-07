/**
 * Hook de Auto-Guardado para Revisiones Técnicas
 * 
 * Maneja el guardado automático de items según su estado de revisión:
 * - pending: Solo info básica (serial, product, equipment_type)
 * - in_review: Detalles técnicos (auto-save después de 30s de inactividad)
 * - reviewed: Revisión completa (manual)
 * - approved: Aprobado (manual)
 * 
 * @example
 * const { saveBasicInfo, saveDetails, isDirty, isSaving } = useAutoSaveReview({
 *   branchId: 1,
 *   itemId: 10,
 *   reviewStatus: 'in_review',
 *   equipmentType: 'notebook'
 * });
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppDispatch } from '@/store';
import { createItem, updateItem } from '@/store/slices/technicalReviews/thunks/itemsThunks';
import { updateItemDetails } from '@/store/slices/technicalReviews/thunks/reviewThunks';
import type { ReviewStatus, EquipmentType, UpdateItemDetailsPayload } from '@/interface/technicalReviews.interface';
import { toast } from 'react-toastify';

interface UseAutoSaveReviewProps {
    branchId: number;
    itemId?: number; // undefined = modo creación
    reviewStatus?: ReviewStatus;
    equipmentType?: EquipmentType | null;
    onSaveSuccess?: (itemId: number) => void;
    onSaveError?: (error: string) => void;
}

interface BasicInfoData {
    batch_id: number;
    serial_number: string;
    product_id?: number;
    equipment_type?: EquipmentType;
}

const AUTO_SAVE_DELAY = 30000; // 30 segundos de inactividad

export const useAutoSaveReview = ({
    branchId,
    itemId,
    reviewStatus,
    equipmentType,
    onSaveSuccess,
    onSaveError,
}: UseAutoSaveReviewProps) => {
    const dispatch = useAppDispatch();

    const [isDirty, setIsDirty] = useState(false); // Hay cambios sin guardar
    const [isSaving, setIsSaving] = useState(false); // Guardando actualmente
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingChangesRef = useRef<UpdateItemDetailsPayload | null>(null);
    const lastInteractionRef = useRef<Date>(new Date());

    // Limpiar timer al desmontar
    useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, []);

    /**
     * PASO 1: Guardar información básica (crea el item con status=pending)
     */
    const saveBasicInfo = useCallback(async (data: BasicInfoData): Promise<number | null> => {
        setIsSaving(true);
        try {
            if (itemId) {
                // Actualizar item existente
                const result = await dispatch(
                    updateItem({
                        branchId,
                        itemId,
                        data: {
                            batch_id: data.batch_id,
                            serial_number: data.serial_number,
                            product_id: data.product_id,
                            equipment_type: data.equipment_type,
                        },
                    })
                ).unwrap();

                setLastSaved(new Date());
                setIsDirty(false);
                onSaveSuccess?.(result.id);
                return result.id;
            } else {
                // Crear nuevo item
                const result = await dispatch(
                    createItem({
                        branchId,
                        data,
                    })
                ).unwrap();

                setLastSaved(new Date());
                setIsDirty(false);
                onSaveSuccess?.(result.id);
                return result.id;
            }
        } catch (error: any) {
            onSaveError?.(error);
            return null;
        } finally {
            setIsSaving(false);
        }
    }, [dispatch, branchId, itemId, onSaveSuccess, onSaveError]);

    /**
     * PASO 2: Guardar detalles técnicos (actualiza attributes_json)
     * - Marca cambios como pendientes
     * - Inicia timer de auto-save
     */
    const markDetailsChanged = useCallback((details: UpdateItemDetailsPayload) => {
        if (!itemId || reviewStatus !== 'in_review') {
            toast.info('Auto-save solo disponible para items en revisión');
            return;
        }

        pendingChangesRef.current = {
            ...pendingChangesRef.current,
            ...details,
        };

        setIsDirty(true);
        lastInteractionRef.current = new Date();

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        // Iniciar nuevo timer
        autoSaveTimerRef.current = setTimeout(() => {
            const timeSinceLastInteraction = Date.now() - lastInteractionRef.current.getTime();

            if (timeSinceLastInteraction >= AUTO_SAVE_DELAY) {
                saveDetailsPending();
            }
        }, AUTO_SAVE_DELAY);

    }, [itemId, reviewStatus]);

    /**
     * Guardar cambios pendientes de detalles
     */
    const saveDetailsPending = useCallback(async () => {
        if (!itemId || !pendingChangesRef.current || isSaving) {
            return;
        }
        setIsSaving(true);
        try {
            const result = await dispatch(
                updateItemDetails({
                    branchId,
                    itemId,
                    data: pendingChangesRef.current,
                    equipmentType: equipmentType || undefined,
                })
            ).unwrap();

            toast.success('Detalles guardados automáticamente');
            setLastSaved(new Date());
            setIsDirty(false);
            pendingChangesRef.current = null;
            onSaveSuccess?.(itemId);
        } catch (error: any) {
            toast.error('Error en auto-save:', error);
            onSaveError?.(error);
        } finally {
            setIsSaving(false);
        }
    }, [dispatch, branchId, itemId, equipmentType, isSaving, onSaveSuccess, onSaveError]);

    /**
     * Guardar detalles manualmente (forzar guardado inmediato)
     */
    const saveDetailsNow = useCallback(async (details?: UpdateItemDetailsPayload): Promise<boolean> => {
        if (!itemId) {
            return false;
        }

        // Cancelar auto-save pendiente
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        const dataToSave = details || pendingChangesRef.current;
        if (!dataToSave) {
            return false;
        }

        setIsSaving(true);

        try {
            const result = await dispatch(
                updateItemDetails({
                    branchId,
                    itemId,
                    data: dataToSave,
                    equipmentType: equipmentType || undefined,
                })
            ).unwrap();

            setLastSaved(new Date());
            setIsDirty(false);
            pendingChangesRef.current = null;
            onSaveSuccess?.(itemId);
            return true;
        } catch (error: any) {
            onSaveError?.(error);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [dispatch, branchId, itemId, equipmentType, onSaveSuccess, onSaveError]);

    /**
     * Resetear estado de dirty
     */
    const resetDirty = useCallback(() => {
        setIsDirty(false);
        pendingChangesRef.current = null;
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
    }, []);

    return {
        // Estado
        isDirty, // Hay cambios sin guardar
        isSaving, // Guardando actualmente
        lastSaved, // Última fecha de guardado

        // Métodos
        saveBasicInfo, // Guardar paso 1 (pending)
        markDetailsChanged, // Marcar cambios en detalles (inicia auto-save)
        saveDetailsNow, // Forzar guardado inmediato de detalles
        resetDirty, // Resetear estado dirty
    };
};
