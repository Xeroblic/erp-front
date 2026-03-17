/**
 * Hook para crear producto expres (rápido)
 * Responsabilidad única: crear producto sin pasar por catálogo (Single Responsibility)
 */
import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';
import type { IProduct } from '@/interface/product.interface';
import type { IQuickProductForm } from '../types';

interface ICreateProductResponse {
    success?: boolean;
    message?: string;
    data?: IProduct;
}

export const useQuickProductCreate = () => {
    const [isCreating, setIsCreating] = useState(false);

    /**
     * Crea un producto rápidamente con solo nombre, SKU y precio
     */
    const createQuickProduct = useCallback(
        async (
            data: IQuickProductForm,
            subsidiaryId: number,
        ): Promise<IProduct | null> => {
            if (subsidiaryId <= 0) {
                toast.error('Debes seleccionar una sucursal válida.');
                return null;
            }

            setIsCreating(true);
            try {
                const response = await ApiService.fetchData<ICreateProductResponse>({
                    url: `/subsidiaries/${subsidiaryId}/products`,
                    method: 'POST',
                    data: {
                        name: data.name.trim(),
                        sku: data.sku.trim(),
                        price: "0", // Enviamos precio 0 por defecto al backend ya que no es requerido en el form rápido
                        subsidiary_id: subsidiaryId,
                        is_active: true,
                        serial_tracking: false, // Por defecto, no serializado
                    },
                });

                if (response.status !== 201 && response.status !== 200) {
                    throw new Error('No se pudo crear el producto.');
                }

                const newProduct = response.data?.data || response.data;
                if (!newProduct) {
                    throw new Error('Respuesta del servidor inválida.');
                }

                toast.success(`✓ Producto "${data.name}" creado exitosamente.`);
                return newProduct as IProduct;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Error al crear producto.';
                toast.error(`✗ ${message}`);
                return null;
            } finally {
                setIsCreating(false);
            }
        },
        [],
    );

    return {
        isCreating,
        createQuickProduct,
    };
};
