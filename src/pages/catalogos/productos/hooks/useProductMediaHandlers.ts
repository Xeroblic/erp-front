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

	// Handler para subir imagen principal (siempre a 'main', reemplaza la existente)
	const handleMainImageUpload = useCallback(
		async (file?: File | null) => {
			if (!file || !product || !effectiveBranchId) return;
			try {
				const meta = JSON.stringify([
					{
						index: 0,
						collection: 'main',
						sort_order: 0,
						alt_text: 'Imagen principal',
						primary: true,
					},
				]);
				await dispatch(
					uploadProductMedia({
						branchId: effectiveBranchId,
						productId: product.id,
						file,
						meta,
					}),
				).unwrap();

				// Esperar un poquito para que el backend procese la imagen
				await new Promise((resolve) => setTimeout(resolve, 500));

				// Recargar el producto para ver la imagen actualizada
				await dispatch(
					fetchProductById({ branchId: effectiveBranchId, productId: product.id }),
				).unwrap();
			} catch (err) {
				console.error('Main image upload failed', err);
			}
		},
		[dispatch, product, effectiveBranchId],
	);

	// Handler para subir imagen a galería (siempre a 'gallery')
	const handleGalleryImageUpload = useCallback(
		async (file?: File | null) => {
			if (!file || !product || !effectiveBranchId) return;
			try {
				const meta = JSON.stringify([
					{
						index: 0,
						collection: 'gallery',
						sort_order: 0,
						alt_text: 'Galería',
						primary: false,
					},
				]);
				await dispatch(
					uploadProductMedia({
						branchId: effectiveBranchId,
						productId: product.id,
						file,
						meta,
					}),
				).unwrap();

				// Esperar un poquito para que el backend procese la imagen
				await new Promise((resolve) => setTimeout(resolve, 500));

				// Recargar el producto para ver la imagen actualizada
				await dispatch(
					fetchProductById({ branchId: effectiveBranchId, productId: product.id }),
				).unwrap();
			} catch (err) {
				console.error('Gallery image upload failed', err);
			}
		},
		[dispatch, product, effectiveBranchId],
	);

	const handleLibrarySelect = useCallback(
		async (items: any[]) => {
			if (!items || items.length === 0 || !product || !effectiveBranchId) return;
			const ids = items.map((i) => i.id);
			try {
				// Si no hay imagen principal, la primera desde biblioteca va a 'main'
				const hasMainImage = !!product.image;
				const collection = hasMainImage ? 'gallery' : 'main';

				await dispatch(
					attachProductMediaFromLibrary({
						branchId: effectiveBranchId,
						productId: product.id,
						payload: {
							library_media_id: ids[0],
							collection,
							sort_order: 0,
							alt_text: hasMainImage ? 'Galería' : 'Imagen principal',
						},
					}),
				).unwrap();

				// Esperar un poquito para que el backend procese
				await new Promise((resolve) => setTimeout(resolve, 500));

				// Recargar el producto para ver los cambios
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
		handleMainImageUpload,
		handleGalleryImageUpload,
		handleLibrarySelect,
	};
};
