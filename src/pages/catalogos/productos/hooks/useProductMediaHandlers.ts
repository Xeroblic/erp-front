import { useCallback } from 'react';
import { useAppDispatch } from '@/store';
import {
	uploadProductMedia,
	attachProductMediaFromLibrary,
	fetchProductById,
	type ProductEntityParam,
} from '@/store/slices/products/productsSlice';
import type { IProduct } from '@/interface/product.interface';

interface LibrarySelectableItem {
	id: number;
}

export const useProductMediaHandlers = (
	product: IProduct | null,
	entityId: number | null,
	entityParam: ProductEntityParam = 'branches',
) => {
	const dispatch = useAppDispatch();

	// Handler para subir imagen principal (siempre a 'main', reemplaza la existente)
	const handleMainImageUpload = useCallback(
		async (file?: File | null) => {
			if (!file || !product || !entityId) return;
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
						entityParam,
						entityId,
						productId: product.id,
						file,
						meta,
					}),
				).unwrap();

				// Esperar un poquito para que el backend procese la imagen
				await new Promise((resolve) => setTimeout(resolve, 500));

				// Recargar el producto para ver la imagen actualizada
				await dispatch(
					fetchProductById({ entityParam, entityId, productId: product.id }),
				).unwrap();
			} catch (err) {
				console.error('Main image upload failed', err);
			}
		},
		[dispatch, product, entityId, entityParam],
	);

	// Handler para subir imagen a galería (siempre a 'gallery')
	const handleGalleryImageUpload = useCallback(
		async (file?: File | null) => {
			if (!file || !product || !entityId) return;
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
						entityParam,
						entityId,
						productId: product.id,
						file,
						meta,
					}),
				).unwrap();

				await new Promise((resolve) => setTimeout(resolve, 500));

				await dispatch(
					fetchProductById({ entityParam, entityId, productId: product.id }),
				).unwrap();
			} catch (err) {
				console.error('Gallery image upload failed', err);
			}
		},
		[dispatch, product, entityId, entityParam],
	);

	const handleLibrarySelect = useCallback(
		async (items: LibrarySelectableItem[]) => {
			if (!items || items.length === 0 || !product || !entityId) return;
			const ids = items
				.map((i) => i.id)
				.filter((id) => typeof id === 'number' && Number.isFinite(id));
			if (!ids.length) return;
			try {
				const hasMainImage = !!product.image;
				const collection = hasMainImage ? 'gallery' : 'main';

				await dispatch(
					attachProductMediaFromLibrary({
						entityParam,
						entityId,
						productId: product.id,
						payload: {
							library_media_id: ids[0],
							collection,
							sort_order: 0,
							alt_text: hasMainImage ? 'Galería' : 'Imagen principal',
						},
					}),
				).unwrap();

				await new Promise((resolve) => setTimeout(resolve, 500));

				await dispatch(
					fetchProductById({ entityParam, entityId, productId: product.id }),
				).unwrap();
			} catch (e) {
				console.error('Attach from library failed', e);
			}
		},
		[dispatch, product, entityId, entityParam],
	);
	return {
		handleMainImageUpload,
		handleGalleryImageUpload,
		handleLibrarySelect,
	};
};
