import { EMPTY_STATS } from "@/constants/brand.constant";
import { CreateBrandPayload, IBrand } from "@/interface/brand.interface";
import { BrandStatsState } from "@/store/slices/brands/brandsSlice";

export const isBrowser = typeof window !== 'undefined';

export const convertFileToWebP = async (file?: File | null): Promise<File | null> => {
  if (!file || !isBrowser || !file.type.startsWith('image/')) return file ?? null;

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext('2d');
  if (!context) return file;

  context.drawImage(bitmap, 0, 0);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((result) => resolve(result), 'image/webp', 0.92),
  );

  if (!blob) return file;

  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  });
};

export const buildFormData = async (payload: CreateBrandPayload) => {
  const formData = new FormData();

  formData.append('name', payload.name);
  if (payload.code) formData.append('code', payload.code);
  if (payload.origin_country) formData.append('origin_country', payload.origin_country);
  if (payload.manufacturer) formData.append('manufacturer', payload.manufacturer);
  formData.append('is_active', payload.is_active ? '1' : '0');

  if (payload.image) {
    const processed = await convertFileToWebP(payload.image);
    if (processed) formData.append('logo', processed, processed.name);
  }

  return formData;
};

export const normalizeBrand = (brand: any): IBrand => ({
  id: Number(brand.id),
  company_id: Number(brand.company_id ?? brand.company?.id ?? 0),
  branch_id: brand.branch_id ?? brand.branch?.id ?? undefined,
  code: brand.code ?? brand.slug ?? undefined,
  name: brand.name ?? '',
  origin_country: brand.origin_country ?? brand.country ?? null,
  manufacturer: brand.manufacturer ?? null,
  description: brand.description ?? null,
  logo_url: brand.logo_url ?? brand.logo ?? brand.photo_url ?? null,
  website_url: brand.website_url ?? brand.website ?? null,
  photo_url: brand.photo_url ?? brand.logo_url ?? null,
  is_active: Boolean(brand.is_active ?? brand.active ?? true),
  created_at: brand.created_at ?? new Date().toISOString(),
  updated_at: brand.updated_at ?? new Date().toISOString(),
  products_count: Number(brand.products_count ?? brand.total_products ?? 0),
  total_sales: Number(brand.total_sales ?? brand.sales_total ?? 0),
});

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