import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch } from '@/store';
import { deleteBrand } from '@/store/slices/brands/brandsSlice';
import { fetchProductsList, updateProduct } from '@/store/slices/products/productsSlice';
import type { IProduct } from '@/interface/product.interface';

type BrandLike = {
	id: number;
	name: string;
};

export type DedupProductItem = {
	id: number;
	name: string;
	sku: string;
	brandId: number;
	brandName: string;
};

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
	// Similaridad simple para casos tipo del/dell
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

export const useBrandDeduplication = () => {
	const dispatch = useAppDispatch();

	const listProductsByBrand = useCallback(
		async (branchId: number, brand: BrandLike): Promise<DedupProductItem[]> => {
			const itemsMap = new Map<number, DedupProductItem>();
			let page = 1;
			let lastPage = 1;

			do {
				const result = await dispatch(
					fetchProductsList({
						entityParam: 'branches',
						entityId: branchId,
						params: {
							page,
							per_page: 100,
							brand_id: brand.id,
							branchId,
						},
					}),
				).unwrap();

				result.items.forEach((product: IProduct) => {
					const currentBrandId = Number(
						product.brand?.id ?? product.brand_id ?? brand.id,
					);
					if (currentBrandId !== Number(brand.id)) return;

					itemsMap.set(product.id, {
						id: product.id,
						name: product.name,
						sku: product.sku,
						brandId: currentBrandId,
						brandName: product.brand?.name ?? brand.name,
					});
				});

				lastPage = Number(result.meta?.last_page ?? 1);
				page += 1;
			} while (page <= lastPage);

			return Array.from(itemsMap.values());
		},
		[dispatch],
	);

	const getAffectedProductsByBrand = useCallback(
		async (branchId: number, brands: BrandLike[]) => {
			const entries = await Promise.all(
				brands.map(async (brand) => {
					const products = await listProductsByBrand(branchId, brand);
					return [brand.id, products] as const;
				}),
			);

			return entries.reduce<Record<number, DedupProductItem[]>>((acc, [brandId, items]) => {
				acc[brandId] = items;
				return acc;
			}, {});
		},
		[listProductsByBrand],
	);

	const reassignProductsToBrand = useCallback(
		async (branchId: number, productIds: number[], keepId: number) => {
			for (const productId of productIds) {
				await dispatch(
					updateProduct({
						entityParam: 'branches',
						entityId: branchId,
						productId,
						data: {
							brand_id: keepId,
						},
					}),
				).unwrap();
			}
		},
		[dispatch],
	);

	const validateNoProductsInBrands = useCallback(
		async (branchId: number, brandsToDelete: BrandLike[]) => {
			for (const brand of brandsToDelete) {
				const leftovers = await listProductsByBrand(branchId, brand);
				if (leftovers.length > 0) {
					return {
						valid: false,
						blockedBrand: brand,
						leftovers,
					};
				}
			}

			return {
				valid: true,
				blockedBrand: null,
				leftovers: [] as DedupProductItem[],
			};
		},
		[listProductsByBrand],
	);

	const findPotentialDuplicates = useCallback(
		(brands: BrandLike[], candidateBrandId: number): BrandLike[] => {
			if (!brands.length || !candidateBrandId) return [];

			const candidate = brands.find((b) => b.id === candidateBrandId);
			if (!candidate) return [];

			const candidateNormalized = normalizeName(candidate.name);
			const duplicates = brands.filter((brand) =>
				isPotentialDuplicate(candidateNormalized, normalizeName(brand.name)),
			);

			return duplicates;
		},
		[],
	);

	const purgeDuplicates = useCallback(
		async (branchId: number, duplicates: BrandLike[], keepId: number) => {
			if (!branchId || !duplicates.length || !keepId) return;

			const toDelete = duplicates.filter((b) => b.id !== keepId);

			const preValidation = await validateNoProductsInBrands(branchId, toDelete);
			if (!preValidation.valid) {
				throw new Error(
					`No se puede eliminar la marca ${preValidation.blockedBrand?.name ?? ''} porque aún tiene productos asociados.`,
				);
			}

			for (const badBrand of toDelete) {
				try {
					await dispatch(deleteBrand({ branchId, brandId: badBrand.id })).unwrap();
				} catch {
					toast.warning(`No se pudo eliminar la marca duplicada: ${badBrand.name}`);
				}
			}

			if (toDelete.length) {
				toast.info(`Se conservará la marca ID ${keepId}.`);
			}
		},
		[dispatch, validateNoProductsInBrands],
	);

	return {
		findPotentialDuplicates,
		getAffectedProductsByBrand,
		reassignProductsToBrand,
		validateNoProductsInBrands,
		purgeDuplicates,
	};
};
