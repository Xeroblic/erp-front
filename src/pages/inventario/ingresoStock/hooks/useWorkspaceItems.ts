/**
 * Hook para manejar la lógica del workspace de ajuste
 * Responsabilidad única: CRUD de items en workspace (Single Responsibility)
 */
import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import type { IProduct } from '@/interface/product.interface';
import type { IWorkItem } from '../types';

export const useWorkspaceItems = () => {
    const [workItems, setWorkItems] = useState<IWorkItem[]>([]);
    const [isWorkspaceVisible, setIsWorkspaceVisible] = useState(true);

    const selectedSubsidiaryId = workItems[0]?.subsidiaryId ?? 0;

    /**
     * Agrega un producto al workspace
     * Valida: no duplicados, misma subsidiaria, subsidiary_id válido
     */
    const addToWorkspace = useCallback(
        (product: IProduct, currentBranchId?: string, onBranchIdUpdate?: (branchId: string) => void, initialQuantity?: string) => {
            // Asignar subsidiary_id: prioridad es producto.subsidiary_id, fallback a primer item o 1
            let subId = Number(product.subsidiary_id ?? 0);
            if (!Number.isFinite(subId) || subId === 0) {
                // Si no tiene subsidiary_id, usar el del primer item o default a 1
                subId = selectedSubsidiaryId || 1;
            }

            const productBranchId = Number(product.branch_id ?? 0);
            if (!Number.isFinite(productBranchId) || productBranchId === 0) {
                toast.error(
                    `Producto "${product.name}" no tiene sucursal asignada. Contacta al administrador.`,
                );
                return;
            }

            // Cross-subsidiary guard
            if (selectedSubsidiaryId && selectedSubsidiaryId !== subId) {
                toast.error(
                    'No puedes mezclar productos de distintas subsidiarias en un mismo lote.',
                );
                return;
            }

            setWorkItems((prev) => {
                // Evitar duplicados
                if (prev.some((item) => item.productId === product.id)) {
                    toast.info('El producto ya está en la zona de ajuste.');
                    return prev;
                }

                // Auto-set branch del primer producto
                if (!currentBranchId && productBranchId > 0 && onBranchIdUpdate) {
                    onBranchIdUpdate(String(productBranchId));
                }

                return [
                    ...prev,
                    {
                        productId: product.id,
                        name: product.name || 'Sin nombre',
                        sku: product.sku || '-',
                        stock: Number(product.stock ?? 0),
                        price: Number(product.price ?? 0),
                        quantity: initialQuantity ?? '1',
                        branchId: productBranchId,
                        subsidiaryId: subId,
                    },
                ];
            });

            setIsWorkspaceVisible(true);
        },
        [selectedSubsidiaryId],
    );

    /**
     * Elimina un item del workspace
     */
    const removeFromWorkspace = useCallback((productId: number) => {
        setWorkItems((prev) => prev.filter((item) => item.productId !== productId));
    }, []);

    /**
     * Actualiza la cantidad de un item
     */
    const updateItemQuantity = useCallback((productId: number, quantity: string) => {
        setWorkItems((prev) =>
            prev.map((item) =>
                item.productId === productId ? { ...item, quantity } : item,
            ),
        );
    }, []);

    /**
     * Limpia completamente el workspace
     */
    const clearWorkspace = useCallback(() => {
        setWorkItems([]);
    }, []);

    return {
        workItems,
        isWorkspaceVisible,
        setIsWorkspaceVisible,
        selectedSubsidiaryId,
        addToWorkspace,
        removeFromWorkspace,
        updateItemQuantity,
        clearWorkspace,
    };
};
