/**
 * Hook para manejar la lógica del workspace de ajuste
 * Responsabilidad única: CRUD de items en workspace (Single Responsibility)
 *
 * Recibe `contextSubsidiaryId` como fuente de verdad de la subsidiaria activa
 * (derivada de la sucursal seleccionada por el usuario en la página).
 */
import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import type { IProduct } from '@/interface/product.interface';
import type { IWorkItem } from '../types';

interface UseWorkspaceItemsParams {
    /** Subsidiaria activa derivada de la sucursal seleccionada */
    contextSubsidiaryId: number | null;
}

export const useWorkspaceItems = ({ contextSubsidiaryId }: UseWorkspaceItemsParams) => {
    const [workItems, setWorkItems] = useState<IWorkItem[]>([]);
    const [isWorkspaceVisible, setIsWorkspaceVisible] = useState(true);

    // Fuente de verdad: siempre la subsidiaria del contexto de la página
    const selectedSubsidiaryId = contextSubsidiaryId ?? 0;

    /**
     * Agrega un producto al workspace
     * Valida: no duplicados, subsidiaria válida
     */
    const addToWorkspace = useCallback(
        (product: IProduct, initialQuantity?: string) => {
            if (!selectedSubsidiaryId) {
                toast.error('Selecciona una sucursal antes de agregar productos.');
                return;
            }

            setWorkItems((prev) => {
                // Evitar duplicados
                if (prev.some((item) => item.productId === product.id)) {
                    toast.info('El producto ya está en la zona de ajuste.');
                    return prev;
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
                        branchId: Number(product.branch_id ?? 0),
                        subsidiaryId: selectedSubsidiaryId,
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
