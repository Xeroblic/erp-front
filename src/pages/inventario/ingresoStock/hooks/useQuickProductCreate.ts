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

interface ICategoryLike {
    id: number;
    is_active?: boolean;
}

type ApiErrorLike = {
    message?: string;
    response?: {
        data?: {
            message?: string;
            errors?: Record<string, string[] | string>;
        };
    };
};

const getApiErrorMessage = (error: unknown): string => {
    const err = error as ApiErrorLike;
    const apiMessage = err?.response?.data?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;

    const apiErrors = err?.response?.data?.errors;
    if (apiErrors && typeof apiErrors === 'object') {
        const firstEntry = Object.values(apiErrors)[0];
        if (Array.isArray(firstEntry) && firstEntry.length > 0) return String(firstEntry[0]);
        if (typeof firstEntry === 'string' && firstEntry.trim()) return firstEntry;
    }

    if (err?.message) return err.message;
    return 'Error al crear producto.';
};

const extractCategoryList = (payload: unknown): ICategoryLike[] => {
    if (Array.isArray(payload)) return payload as ICategoryLike[];
    if (
        payload &&
        typeof payload === 'object' &&
        'data' in payload &&
        Array.isArray((payload as { data?: unknown[] }).data)
    ) {
        return ((payload as { data?: unknown[] }).data ?? []) as ICategoryLike[];
    }
    return [];
};

export const useQuickProductCreate = () => {
    const [isCreating, setIsCreating] = useState(false);

    const getDefaultCategoryId = useCallback(async (): Promise<number | null> => {
        try {
            const response = await ApiService.fetchData<{ data?: unknown[] }>({
                url: '/categories',
                method: 'GET',
                params: {
                    per_page: 50,
                },
            });

            const categories = extractCategoryList(response.data ?? response)
                .map((category) => ({
                    id: Number(category?.id ?? 0),
                    isActive: category?.is_active !== false,
                }))
                .filter((category) => category.id > 0);

            const active = categories.find((category) => category.isActive);
            return active?.id ?? categories[0]?.id ?? null;
        } catch {
            return null;
        }
    }, []);

    /**
     * Crea un producto rápidamente con solo nombre, SKU y precio
     */
    const createQuickProduct = useCallback(
        async (
            data: IQuickProductForm,
            subsidiaryId: number | null | undefined,
            branchId: number,
            brandId: number,
        ): Promise<IProduct | null> => {
            if (branchId <= 0) {
                toast.error('Debes seleccionar una sucursal válida.');
                return null;
            }

            if (brandId <= 0) {
                toast.error('El campo brand es obligatorio para crear el producto.');
                return null;
            }

            setIsCreating(true);
            try {
                const parsedPrice = Number(data.price);
                const normalizedSubsidiaryId = Number(subsidiaryId ?? 0) || undefined;
                const defaultCategoryId = await getDefaultCategoryId();
                if (!defaultCategoryId) {
                    toast.error(
                        'No hay categorías disponibles para crear el producto exprés. Crea una categoría e inténtalo de nuevo.',
                    );
                    return null;
                }

                const response = await ApiService.fetchData<ICreateProductResponse>({
                    // Crear siempre desde la sucursal activa para garantizar branch_id consistente
                    url: `/branches/${branchId}/products`,
                    method: 'POST',
                    data: {
                        name: data.name.trim(),
                        sku: data.sku.trim(),
                        price: Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0,
                        brand_id: brandId,
                        category_ids: [defaultCategoryId],
                        is_active: true,
                        serial_tracking: false, // Por defecto, no serializado
                    },
                });

                if (response.status !== 201 && response.status !== 200) {
                    throw new Error('No se pudo crear el producto.');
                }

                const rawProduct = response.data?.data || response.data;
                if (!rawProduct) {
                    throw new Error('Respuesta del servidor inválida.');
                }

                const newProduct = {
                    ...(rawProduct as IProduct),
                    branch_id: Number((rawProduct as IProduct)?.branch_id ?? branchId) || branchId,
                    subsidiary_id:
                        Number((rawProduct as IProduct)?.subsidiary_id ?? normalizedSubsidiaryId ?? 0) ||
                        undefined,
                } as IProduct;

                toast.success(`✓ Producto "${data.name}" creado exitosamente.`);
                return newProduct;
            } catch (err) {
                const message = getApiErrorMessage(err);
                toast.error(`✗ ${message}`);
                return null;
            } finally {
                setIsCreating(false);
            }
        },
        [getDefaultCategoryId],
    );

    return {
        isCreating,
        createQuickProduct,
    };
};
