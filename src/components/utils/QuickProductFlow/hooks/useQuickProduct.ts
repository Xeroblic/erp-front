/**
 * Hook reutilizable para flujo de creación rápida de producto y marca
 * Completamente independiente - maneja directamente los slices de Redux y API
 * Escalable para múltiples contextos (IngresoStock, Revisiones, etc.)
 * Opcionales: deduplicación de marcas, seguimiento por serie
 */
import { useCallback, useState, useMemo } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import { createBrand, fetchBrands, deleteBrand } from '@/store/slices/brands/brandsSlice';
import { fetchProductsList, updateProduct } from '@/store/slices/products/productsSlice';
import ApiService from '@/services/ApiService';
import { QuickProductFormSchema } from '../types/types';
import type {
    IQuickProductForm,
    IUseQuickProductOptions,
    IUseQuickProductReturn,
    IBrandForDedup,
    IDedupProductItem,
} from '../types/types';
import type { IProduct } from '@/interface/product.interface';

interface ICreateProductResponse {
    success?: boolean;
    message?: string;
    data?: IProduct;
}

// Utilidades de deduplicación
const normalizeName = (value: string): string =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();

const isPotentialDuplicate = (a: string, b: string): boolean => {
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    const distance = Math.abs(a.length - b.length);
    if (distance > 1) return false;
    let mismatches = 0;
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
        if (a[i] === b[j]) {
            i++;
            j++;
            continue;
        }
        mismatches++;
        if (mismatches > 1) return false;
        if (a.length > b.length) i++;
        else if (b.length > a.length) j++;
        else {
            i++;
            j++;
        }
    }
    return true;
};

const findDuplicateBrands = (brands: IBrandForDedup[], targetBrandId: number): IBrandForDedup[] => {
    if (!brands.length || !targetBrandId) return [];
    const target = brands.find((b) => b.id === targetBrandId);
    if (!target) return [];
    const targetNormalized = normalizeName(target.name);
    return brands.filter((b) => isPotentialDuplicate(targetNormalized, normalizeName(b.name)));
};

export const useQuickProduct = ({
    branchId,
    onProductCreated,
    onBrandCreated,
    onBrandDedupResolved,
    enableDedup = true,
}: IUseQuickProductOptions): IUseQuickProductReturn => {
    const dispatch = useAppDispatch();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);
    const [isDedupModalOpen, setIsDedupModalOpen] = useState(false);
    const [dedupCandidates, setDedupCandidates] = useState<IBrandForDedup[]>([]);
    const [dedupProductsByBrand, setDedupProductsByBrand] = useState<Record<number, IDedupProductItem[]>>({});
    const [dedupDefaultKeepId, setDedupDefaultKeepId] = useState<number | null>(null);
    const [isDedupLoading, setIsDedupLoading] = useState(false);
    const [isDedupSubmitting, setIsDedupSubmitting] = useState(false);

    // Redux state
    const brands = useAppSelector((s) => s.brands.items);
    const brandsLoading = useAppSelector((s) => s.brands.loading);

    // Cargar marcas al montar si hay branchId
    const loadBrands = useCallback(async () => {
        if (!branchId) return;
        try {
            await dispatch(fetchBrands({ branchId, search: '' })).unwrap();
        } catch (error) {
            toast.error('No se pudieron cargar las marcas');
        }
    }, [dispatch, branchId]);

    // Obtener categoría por defecto (primera activa)
    const getDefaultCategoryId = useCallback(async (): Promise<number | null> => {
        try {
            const response = await ApiService.fetchData<{ data?: unknown[] }>({
                url: '/categories',
                method: 'GET',
                params: {
                    per_page: 50,
                },
            });

            const categories = Array.isArray(response.data?.data)
                ? (response.data.data as any[])
                : Array.isArray(response.data)
                    ? (response.data as any[])
                    : [];

            const validCategories = categories
                .map((cat) => ({
                    id: Number(cat?.id ?? 0),
                    isActive: cat?.is_active !== false,
                }))
                .filter((cat) => cat.id > 0);

            const active = validCategories.find((cat) => cat.isActive);
            return active?.id ?? validCategories[0]?.id ?? null;
        } catch {
            return null;
        }
    }, []);

    // Crear producto directamente sin dependencias externas
    const createQuickProduct = useCallback(
        async (
            data: IQuickProductForm,
            brandId: number,
        ): Promise<IProduct | null> => {
            if (!branchId || branchId <= 0) {
                toast.error('Debes seleccionar una sucursal válida.');
                return null;
            }

            if (brandId <= 0) {
                toast.error('El campo marca es obligatorio para crear el producto.');
                return null;
            }

            setIsCreatingProduct(true);
            try {
                const parsedPrice = Number(data.price);
                const defaultCategoryId = await getDefaultCategoryId();
                if (!defaultCategoryId) {
                    toast.error(
                        'No hay categorías disponibles para crear el producto. Crea una categoría e inténtalo de nuevo.',
                    );
                    return null;
                }

                const serialTracking = data.serialTracking === '1';

                const response = await ApiService.fetchData<ICreateProductResponse>({
                    url: `/branches/${branchId}/products`,
                    method: 'POST',
                    data: {
                        name: data.name.trim(),
                        sku: data.sku.trim(),
                        price: Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0,
                        brand_id: brandId,
                        category_ids: [defaultCategoryId],
                        product_type: data.tipo,
                        attributes_json: { product_kind: data.tipo },
                        is_active: true,
                        serial_tracking: serialTracking,
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
                } as IProduct;

                toast.success(`✓ Producto "${data.name}" creado exitosamente.`);
                return newProduct;
            } catch (err) {
                const errorMessage = (err as any)?.response?.data?.message ||
                    (err instanceof Error ? err.message : String(err)) ||
                    'Error al crear producto.';
                toast.error(`✗ ${errorMessage}`);
                return null;
            } finally {
                setIsCreatingProduct(false);
            }
        },
        [branchId, getDefaultCategoryId],
    );
    const onOpen = useCallback(() => {
        setIsOpen(true);
        void loadBrands();
    }, [loadBrands]);

    const onClose = useCallback(() => {
        setIsOpen(false);
        form.resetForm();
    }, []);

    const isSubmitting = isCreatingProduct || brandsLoading;

    const form = useFormik<IQuickProductForm>({
        initialValues: {
            name: '',
            sku: '',
            price: '',
            brandId: '',
            tipo: '',
            serialTracking: '0',
        },
        validationSchema: QuickProductFormSchema,
        enableReinitialize: true,
        onSubmit: async (values, { resetForm }) => {
            if (!branchId) {
                toast.error('Debes seleccionar una sucursal válida para crear el producto.');
                return;
            }

            const selectedBrandId = Number(values.brandId || 0);
            if (!selectedBrandId) {
                toast.error('Debes seleccionar una marca para crear el producto exprés.');
                return;
            }

            try {
                const createdProduct = await createQuickProduct(values, selectedBrandId);
                if (!createdProduct) {
                    return;
                }

                // Reload products list after creation
                try {
                    await dispatch(
                        fetchProductsList({
                            entityParam: 'branches',
                            entityId: branchId,
                            params: { page: 1, per_page: 100 },
                        }),
                    ).unwrap();
                } catch {
                    // Silent fail on reload; product was created successfully
                }

                // Call optional callback
                if (onProductCreated) {
                    await Promise.resolve(onProductCreated(createdProduct));
                }

                toast.success(`Producto "${values.name}" creado exitosamente.`);
                resetForm();
                setIsOpen(false);
            } catch (error) {
                toast.error(`Error al crear producto: ${error}`);
            }
        },
    });

    const onBrandChange = useCallback(
        (brandId: string) => {
            form.setFieldValue('brandId', brandId);
        },
        [form],
    );

    const onCreateBrand = useCallback(
        async (brandName: string) => {
            if (!branchId) {
                toast.error('Debes seleccionar una sucursal antes de crear una marca.');
                return;
            }

            const normalizedName = brandName.trim();
            if (!normalizedName) {
                toast.warn('Ingresa un nombre válido para la marca.');
                return;
            }

            try {
                const createdBrand = await dispatch(
                    createBrand({
                        branchId,
                        data: {
                            name: normalizedName,
                            is_active: true,
                        },
                    }),
                ).unwrap();

                // Reload brands
                const reloadedBrands = await dispatch(fetchBrands({ branchId, search: '' })).unwrap();

                // Check for potential duplicates (if enabled)
                if (enableDedup && reloadedBrands?.items) {
                    const brandList = reloadedBrands.items.map((b) => ({ id: Number(b.id), name: b.name }));
                    const duplicates = findDuplicateBrands(brandList, createdBrand.id);

                    if (duplicates.length > 1) {
                        setDedupCandidates(duplicates);
                        setDedupDefaultKeepId(createdBrand.id);
                        setIsDedupModalOpen(true);
                        form.setFieldValue('brandId', String(createdBrand.id));
                        toast.info('Detectamos marcas similares. Elige cuál conservar.');
                        return;
                    }
                }

                // Auto-select the newly created brand
                form.setFieldValue('brandId', String(createdBrand.id));

                // Call optional callback
                if (onBrandCreated) {
                    onBrandCreated(createdBrand);
                }

                toast.success(`Marca "${createdBrand.name}" creada correctamente.`);
            } catch (error) {
                toast.error(`Error al crear marca: ${error}`);
            }
        },
        [dispatch, branchId, form, onBrandCreated, enableDedup],
    );

    const onCloseDedupModal = useCallback(() => {
        setIsDedupModalOpen(false);
        setDedupCandidates([]);
        setDedupProductsByBrand({});
        setDedupDefaultKeepId(null);
    }, []);

    const onResolveBrandDedup = useCallback(
        async (keepBrandId: number) => {
            if (!branchId || !dedupCandidates.length || !keepBrandId) return;

            setIsDedupSubmitting(true);
            try {
                const toDelete = dedupCandidates.filter((b) => b.id !== keepBrandId);

                for (const badBrand of toDelete) {
                    try {
                        await dispatch(deleteBrand({ branchId, brandId: badBrand.id })).unwrap();
                    } catch {
                        toast.warning(`No se pudo eliminar la marca duplicada: ${badBrand.name}`);
                    }
                }

                if (toDelete.length) {
                    toast.info(`Se conservará la marca ID ${keepBrandId}.`);
                }

                if (onBrandDedupResolved) {
                    onBrandDedupResolved(keepBrandId);
                }

                onCloseDedupModal();
            } catch (error) {
                toast.error(`Error al resolver duplicados: ${error}`);
            } finally {
                setIsDedupSubmitting(false);
            }
        },
        [dispatch, branchId, dedupCandidates, onBrandDedupResolved, onCloseDedupModal],
    );

    const brandOptions = useMemo(
        () =>
            brands.map((brand) => ({
                value: String(brand.id),
                label: brand.name,
            })),
        [brands],
    );

    return {
        isOpen,
        onOpen,
        onClose,
        form,
        isSubmitting,
        brands: brandOptions,
        brandsLoading,
        onBrandChange,
        onCreateBrand,
        isDedupModalOpen,
        dedupCandidates,
        dedupProductsByBrand,
        dedupDefaultKeepId,
        isDedupLoading,
        isDedupSubmitting,
        onCloseDedupModal,
        onResolveBrandDedup,
    };
};
