import { useState, useCallback } from 'react';

/**
 * Hook para manejar el estado de los modales de detalle de bodega
 * Centraliza toda la lógica de apertura/cierre y estado de los modales
 */
export const useWarehouseDetailModals = () => {
    // Estado de eliminación de producto
    const [productToRemove, setProductToRemove] = useState<any | null>(null);

    // Estado de asociación de producto
    const [attachProduct, setAttachProduct] = useState<any | null>(null);
    const [attaching, setAttaching] = useState(false);

    // Estado de cantidad manual
    const [qtyModal, setQtyModal] = useState<{
        open: boolean;
        productId: number | null;
        initialQty: number;
    }>({ open: false, productId: null, initialQty: 1 });

    // Estado de edición
    const [isEditable, setIsEditable] = useState(false);

    // Estado de actualización de sync
    const [updatingSyncIds, setUpdatingSyncIds] = useState<number[]>([]);

    /**
     * Abrir modal de eliminación
     */
    const openRemoveModal = useCallback((product: any) => {
        setProductToRemove(product);
    }, []);

    /**
     * Cerrar modal de eliminación
     */
    const closeRemoveModal = useCallback(() => {
        setProductToRemove(null);
    }, []);

    /**
     * Abrir modal de asociación
     */
    const openAttachModal = useCallback((product: any) => {
        setAttachProduct(product);
    }, []);

    /**
     * Cerrar modal de asociación
     */
    const closeAttachModal = useCallback(() => {
        setAttachProduct(null);
    }, []);

    /**
     * Abrir modal de cantidad manual
     */
    const openQtyModal = useCallback((productId: number, initialQty: number) => {
        setQtyModal({
            open: true,
            productId,
            initialQty,
        });
    }, []);

    /**
     * Cerrar modal de cantidad manual
     */
    const closeQtyModal = useCallback(() => {
        setQtyModal({ open: false, productId: null, initialQty: 1 });
    }, []);

    /**
     * Toggle modo edición
     */
    const toggleEditable = useCallback(() => {
        setIsEditable((prev) => !prev);
    }, []);

    /**
     * Agregar ID a lista de actualización
     */
    const addUpdatingId = useCallback((id: number) => {
        setUpdatingSyncIds((prev) => [...prev, id]);
    }, []);

    /**
     * Quitar ID de lista de actualización
     */
    const removeUpdatingId = useCallback((id: number) => {
        setUpdatingSyncIds((prev) => prev.filter((x) => x !== id));
    }, []);

    /**
     * Iniciar proceso de asociación
     */
    const startAttaching = useCallback(() => {
        setAttaching(true);
    }, []);

    /**
     * Finalizar proceso de asociación
     */
    const finishAttaching = useCallback(() => {
        setAttaching(false);
    }, []);

    return {
        // Estado
        productToRemove,
        attachProduct,
        attaching,
        qtyModal,
        isEditable,
        updatingSyncIds,

        // Acciones - Modal de eliminación
        openRemoveModal,
        closeRemoveModal,

        // Acciones - Modal de asociación
        openAttachModal,
        closeAttachModal,
        startAttaching,
        finishAttaching,

        // Acciones - Modal de cantidad
        openQtyModal,
        closeQtyModal,

        // Acciones - UI
        toggleEditable,
        addUpdatingId,
        removeUpdatingId,
    };
};
