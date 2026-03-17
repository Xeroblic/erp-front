/**
 * Hook para manejar envío de ajuste de stock
 * Responsabilidad única: comunicación con API (Single Responsibility)
 */
import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';
import type { IWorkItem, IMovementType, IBatchAdjustmentResponse, IStockAdjustmentPayload } from '../types';

export const useStockAdjustment = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Convierte cantidad string a número, validando > 0
     */
    const toPositiveNumber = useCallback((value: string | number): number => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }, []);

    /**
     * Calcula quantity_change (con signo según tipo de movimiento)
     */
    const getSignedQuantity = useCallback(
        (quantity: string, movementType: IMovementType): number => {
            const absolute = toPositiveNumber(quantity);
            if (!absolute) return 0;
            return movementType === 'egreso' ? -absolute : absolute;
        },
        [toPositiveNumber],
    );

    /**
     * Construye payload y envía ajuste al API
     */
    const submitBatchAdjustment = useCallback(
        async (
            workItems: IWorkItem[],
            branchId: string,
            reason: string,
            notes: string,
            selectedSubsidiaryId: number,
            movementType: IMovementType,
            onSuccess?: () => void,
        ): Promise<boolean> => {
            const parsedBranchId = toPositiveNumber(branchId);

            if (!workItems.length) {
                toast.error('Agrega al menos un producto para ajustar.');
                return false;
            }

            if (!Number.isFinite(selectedSubsidiaryId) || selectedSubsidiaryId === 0) {
                toast.error('Error interno: subsidiaria no válida. Reintenta agregar productos.');
                return false;
            }

            // Construir array de items con quantity_change
            const items = workItems
                .map((item) => ({
                    product_id: item.productId,
                    quantity_change: getSignedQuantity(item.quantity, movementType),
                }))
                .filter((item) => item.quantity_change !== 0);

            // Validar que NO haya cambios de 0
            if (!items.length || items.length !== workItems.length) {
                toast.error('Todos los productos deben tener cantidad distinta de 0.');
                return false;
            }

            // Armar payload
            const payload: IStockAdjustmentPayload = {
                branch_id: parsedBranchId,
                reason: reason.trim(),
                notes: notes.trim(),
                items,
            };

            setIsSubmitting(true);
            try {
                const response = await ApiService.fetchData<IBatchAdjustmentResponse>({
                    url: `/subsidiaries/${selectedSubsidiaryId}/stock-adjustments`,
                    method: 'POST',
                    data: payload as unknown as Record<string, unknown>,
                });

                if (response.status !== 202) {
                    throw new Error('El backend no aceptó el ajuste en segundo plano.');
                }

                const batchId = response.data?.batch_id;
                toast.success(
                    batchId
                        ? `✓ Procesando en segundo plano. Batch: ${batchId}`
                        : '✓ Procesando en segundo plano.',
                );

                onSuccess?.();
                return true;
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : 'Error al enviar ajuste de stock.';
                toast.error(`✗ ${message}`);
                return false;
            } finally {
                setIsSubmitting(false);
            }
        },
        [getSignedQuantity, toPositiveNumber],
    );

    return {
        isSubmitting,
        submitBatchAdjustment,
        getSignedQuantity,
        toPositiveNumber,
    };
};
