import { useCallback } from 'react';
import { useAppDispatch } from '@/store';
import {
    uploadProductMedia,
    fetchBranchLibraryMedia,
    attachProductMediaFromLibrary,
    fetchProductById,
} from '@/store/slices/products/productsSlice';
import type { IProduct } from '@/interface/product.interface';

export const useProductMediaHandlers = (
    product: IProduct | null,
    effectiveBranchId: number | null,
) => {
    const dispatch = useAppDispatch();

    const handleFileUpload = useCallback(
        async (file?: File | null) => {
            if (!file || !product || !effectiveBranchId) return;
            try {
                const meta = JSON.stringify([
                    {
                        index: 0,
                        collection: 'gallery',
                        sort_order: 0,
                        alt_text: 'Uploaded',
                        primary: false,
                    },
                ]);
                const url = await dispatch(
                    uploadProductMedia({
                        branchId: effectiveBranchId,
                        productId: product.id,
                        file,
                        meta,
                    }),
                ).unwrap();
                if (url) {
                    await dispatch(
                        fetchProductById({ branchId: effectiveBranchId, productId: product.id }),
                    ).unwrap();
                }
            } catch (err) {
                console.error('Upload failed', err);
            }
        },
        [dispatch, product, effectiveBranchId],
    );

    const handleLibrarySelect = useCallback(
        async (items: any[]) => {
            if (!items || items.length === 0 || !product || !effectiveBranchId) return;
            const ids = items.map((i) => i.id);
            try {
                await dispatch(
                    attachProductMediaFromLibrary({
                        branchId: effectiveBranchId,
                        productId: product.id,
                        payload: {
                            library_media_id: ids[0],
                            collection: 'gallery',
                            sort_order: 0,
                            alt_text: '',
                        },
                    }),
                ).unwrap();
                await dispatch(
                    fetchProductById({ branchId: effectiveBranchId, productId: product.id }),
                ).unwrap();
            } catch (e) {
                console.error('Attach from library failed', e);
            }
        },
        [dispatch, product, effectiveBranchId],
    );

    return {
        handleFileUpload,
        handleLibrarySelect,
    };
};
