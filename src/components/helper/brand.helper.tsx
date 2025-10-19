import { EMPTY_STATS } from '@/constants/brand.constant';
import { IBrand, IBrandImage } from '@/interface/brand.interface';
import { BrandStatsState } from '@/store/slices/brands/brandsSlice';

const resolveBackendOrigin = (): URL | null => {
	const envUrl =
		(typeof import.meta !== 'undefined' &&
			(import.meta.env?.VITE_API_URL as string | undefined)) ||
		(typeof process !== 'undefined' && typeof process.env !== 'undefined'
			? (process.env.VITE_API_URL as string | undefined)
			: undefined) ||
		'';

	if (!envUrl) return null;

	const sanitized = envUrl.replace(/\/api\/?$/, '');

	try {
		return new URL(sanitized);
	} catch {
		return null;
	}
};

const BACKEND_ORIGIN = resolveBackendOrigin();

export const ensureAbsoluteUrl = (value?: string | null): string | null => {
	if (!value) return null;

	const trimmed = value.trim();
	if (!trimmed) return null;

	const hasProtocol = /^https?:\/\//i.test(trimmed);

	let url = trimmed;

	if (!hasProtocol && BACKEND_ORIGIN) {
		const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
		url = `${BACKEND_ORIGIN.origin}${path}`;
	}

    // Mantener la URL exacta que entrega el backend.
    // Antes se forzaba a 'branch-public', pero ahora se requiere 'branch-{id}'.

	try {
		const parsed = new URL(url);
		const sameHost =
			BACKEND_ORIGIN &&
			parsed.hostname === BACKEND_ORIGIN.hostname &&
			parsed.protocol === BACKEND_ORIGIN.protocol;

		const backendPort =
			BACKEND_ORIGIN && BACKEND_ORIGIN.port ? BACKEND_ORIGIN.port : '';

		if (sameHost && !parsed.port && backendPort) {
			const origin = `${parsed.protocol}//${parsed.hostname}:${backendPort}`;
			return `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
		}

		return parsed.href;
	} catch {
		return url;
	}
};


export const isBrowser = typeof window !== 'undefined';

export const convertFileToWebP = async (file?: File | null): Promise<File | null> => {
	if (!file || !isBrowser || !file.type.startsWith('image/')) return file ?? null;
	if (file.type === 'image/webp') return file;

	const baseName = file.name?.replace(/\.[^.]+$/, '') || 'brand-image';

	const convertUsingBitmap = async (): Promise<Blob | null> => {
		if (typeof createImageBitmap !== 'function') return null;

		try {
			const bitmap = await createImageBitmap(file);
			const canvas = document.createElement('canvas');
			canvas.width = bitmap.width;
			canvas.height = bitmap.height;

			const context = canvas.getContext('2d');
			if (!context) return null;

			context.drawImage(bitmap, 0, 0);
			bitmap.close?.();

			return await new Promise((resolve) =>
				canvas.toBlob((result) => resolve(result), 'image/webp', 0.92),
			);
		} catch {
			return null;
		}
	};

	const convertUsingImageElement = async (): Promise<Blob | null> =>
		new Promise((resolve) => {
			const reader = new FileReader();

			reader.onerror = () => resolve(null);
			reader.onload = () => {
				const img = new Image();
				img.crossOrigin = 'anonymous';
				img.onerror = () => {
					if (img.src.startsWith('blob:')) {
						URL.revokeObjectURL(img.src);
					}
					resolve(null);
				};
				img.onload = () => {
					const canvas = document.createElement('canvas');
					canvas.width = img.naturalWidth || img.width;
					canvas.height = img.naturalHeight || img.height;

					const context = canvas.getContext('2d');
					if (!context) return resolve(null);

					context.drawImage(img, 0, 0);
					canvas.toBlob(
						(result) => resolve(result),
						'image/webp',
						0.92,
					);
					if (img.src.startsWith('blob:')) {
						URL.revokeObjectURL(img.src);
					}
				};

				if (typeof reader.result === 'string' && reader.result.length) {
					img.src = reader.result;
				} else {
					const objectUrl = URL.createObjectURL(file);
					img.src = objectUrl;
				}
			};
			reader.readAsDataURL(file);
		});

	const blob = (await convertUsingBitmap()) ?? (await convertUsingImageElement());
	if (!blob) return file;

	return new File([blob], `${baseName}.webp`, {
		type: 'image/webp',
		lastModified: Date.now(),
	});
};

const resolveMediaCandidate = (value: any): any => {
	if (!value) return null;
	if (typeof value === 'string') return value;
	if (Array.isArray(value)) return value[0] ?? null;
	if (Array.isArray(value?.data)) return value.data[0] ?? null;
	if (Array.isArray(value?.media)) return value.media[0] ?? null;
	return value;
};

const normalizeImage = (input: any): IBrandImage | null => {
	if (!input) return null;
	if (typeof input === 'string') {
		const absolute = ensureAbsoluteUrl(input);
		if (!absolute) return null;
		return { url: absolute, thumb: absolute, alt: null };
	}

	const candidate = resolveMediaCandidate(input);
	if (!candidate || typeof candidate !== 'object') return null;

	const url =
		candidate.url ??
		candidate.original_url ??
		candidate.full_url ??
		candidate.preview_url ??
		candidate.thumbnail_url ??
		candidate.thumb ??
		null;

	if (!url || typeof url !== 'string') return null;

	const thumb =
		candidate.thumb ??
		candidate.thumbnail_url ??
		candidate.preview_url ??
		candidate.conversion_url ??
		url;

	const idValue = candidate.id ?? candidate.media_id ?? candidate.pivot?.media_id;
	const parsedId = typeof idValue === 'number' ? idValue : Number(idValue);

	const absoluteUrl = ensureAbsoluteUrl(url);
	if (!absoluteUrl) return null;

	const absoluteThumb = ensureAbsoluteUrl(
		typeof thumb === 'string' ? thumb : undefined,
	);

	return {
		id: Number.isFinite(parsedId) ? Number(parsedId) : undefined,
		url: absoluteUrl,
		thumb: absoluteThumb ?? absoluteUrl,
		alt: candidate.alt ?? candidate.alt_text ?? candidate.custom_properties?.alt ?? null,
	};
};

export const normalizeBrand = (brand: any): IBrand => {
	const primaryImage =
		normalizeImage(brand.image) ??
		normalizeImage(brand.primary_image) ??
		normalizeImage(brand.primaryImage) ??
		normalizeImage(brand.logo) ??
		null;

	const rawGallery =
		brand.gallery ??
		brand.images ??
		brand.media ??
		(brand.image && Array.isArray(brand.image)
			? brand.image
			: brand.image?.gallery ?? []);

	const gallery = Array.isArray(rawGallery)
		? rawGallery
				.map((item: any) => normalizeImage(item))
				.filter((item): item is IBrandImage => Boolean(item?.url))
		: [];

	const logoUrl =
		primaryImage?.url ??
		brand.logo_url ??
		brand.logo ??
		brand.photo_url ??
		brand.image_url ??
		null;
	const absoluteLogo = ensureAbsoluteUrl(logoUrl);
	const absolutePhoto = ensureAbsoluteUrl(brand.photo_url ?? primaryImage?.url ?? absoluteLogo ?? undefined);

	return {
		id: Number(brand.id),
		company_id: Number(brand.company_id ?? brand.company?.id ?? 0),
		branch_id: brand.branch_id ?? brand.branch?.id ?? undefined,
		code: brand.code ?? brand.slug ?? undefined,
		name: brand.name ?? '',
		origin_country: brand.origin_country ?? brand.country ?? null,
		manufacturer: brand.manufacturer ?? null,
		description: brand.description ?? null,
		logo_url: absoluteLogo ?? null,
		website_url: brand.website_url ?? brand.website ?? null,
		photo_url: absolutePhoto ?? null,
		is_active: Boolean(brand.is_active ?? brand.active ?? true),
		created_at: brand.created_at ?? new Date().toISOString(),
		updated_at: brand.updated_at ?? new Date().toISOString(),
		products_count: Number(brand.products_count ?? brand.total_products ?? 0),
		total_sales: Number(brand.total_sales ?? brand.sales_total ?? 0),
		image: primaryImage,
		gallery,
	};
};

export const computeStats = (items: IBrand[]): BrandStatsState => {
	if (!items.length) return EMPTY_STATS;

	const total_brands = items.length;
	const active_brands = items.filter((brand) => brand.is_active).length;
	const inactive_brands = total_brands - active_brands;
	const total_products = items.reduce((sum, brand) => sum + (brand.products_count || 0), 0);
	const total_sales = items.reduce((sum, brand) => sum + (brand.total_sales || 0), 0);

	return {
		total_brands,
		active_brands,
		inactive_brands,
		total_products,
		total_sales,
	};
};
